#!/usr/bin/env npx tsx
/**
 * Validates that agent-protocol documents reference types/enums/events
 * that actually exist in the codebase.
 *
 * Checks:
 *   A. Event type strings in appendScopeEvent() calls match PayloadMap keys
 *   B. Payload field names match the corresponding payload interface (unidirectional: doc → code)
 *   C. Inline code references (backtick) match exported type/interface names
 *
 * Input sources:
 *   - src/kernel/types.ts (primary)
 *   - src/compilers/compile.ts (Compile I/O types)
 *   - src/compilers/compile-defense.ts (Defense types)
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — errors found
 *
 * Usage:
 *   npx tsx scripts/check-protocol-refs.ts
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseTypeFile, type ParseResult } from "./lib/parse-types.js";

const ROOT = join(import.meta.dirname, "..");
const PROTOCOL_DIR = join(ROOT, "docs/agent-protocol");
const SOURCE_FILES = [
  join(ROOT, "src/kernel/types.ts"),
  join(ROOT, "src/compilers/compile.ts"),
  join(ROOT, "src/compilers/compile-defense.ts"),
];

// ─── Build reference sets ───

function buildRefSets(sources: string[]) {
  const exportedNames = new Set<string>();
  const payloadMapKeys = new Set<string>();
  const payloadFields = new Map<string, Set<string>>(); // payloadInterface → field names
  const unionValues = new Map<string, Set<string>>(); // union type name → values

  for (const filePath of sources) {
    const result = parseTypeFile(filePath);

    for (const u of result.unionTypes) {
      exportedNames.add(u.name);
      unionValues.set(u.name, new Set(u.values));
    }
    for (const c of result.constArrays) {
      exportedNames.add(c.name);
    }
    for (const i of result.interfaces) {
      exportedNames.add(i.name);
      payloadFields.set(i.name, new Set(i.fields.map((f) => f.name)));
    }
    for (const f of result.functions) {
      exportedNames.add(f);
    }
    for (const entry of result.payloadMap) {
      payloadMapKeys.add(entry.eventType);
    }
  }

  return { exportedNames, payloadMapKeys, payloadFields, unionValues };
}

// ─── Extract references from protocol markdown ───

interface ProtocolRef {
  file: string;
  line: number;
  type: "event_type" | "payload_field" | "inline_code";
  value: string;
  context?: string; // for payload_field: which event type
}

function extractRefs(protocolDir: string): ProtocolRef[] {
  const refs: ProtocolRef[] = [];
  const files = readdirSync(protocolDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  for (const fileName of files) {
    const filePath = join(protocolDir, fileName);
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    let inCodeBlock = false;
    let currentEventType: string | null = null;
    let inPayloadBlock = false;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Track code block boundaries
      if (line.trimStart().startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          currentEventType = null;
          inPayloadBlock = false;
          braceDepth = 0;
        } else {
          inCodeBlock = line.includes("typescript") || line.includes("ts");
        }
        continue;
      }

      if (inCodeBlock) {
        // Rule A: Extract event type from `type: "xxx"` pattern
        const eventMatch = line.match(/type:\s*"([^"]+)"/);
        if (eventMatch) {
          currentEventType = eventMatch[1];
          refs.push({
            file: fileName,
            line: lineNum,
            type: "event_type",
            value: currentEventType,
          });
        }

        // Track payload block entry
        if (line.includes("payload:") && line.includes("{")) {
          inPayloadBlock = true;
          braceDepth = 0;
        }

        if (inPayloadBlock) {
          braceDepth += (line.match(/{/g) || []).length;
          braceDepth -= (line.match(/}/g) || []).length;

          // Rule B: Extract payload field names (top-level only, depth 1)
          const fieldMatch = line.match(/^\s+(\w+)\s*[:{]/);
          if (fieldMatch && fieldMatch[1] !== "payload" && fieldMatch[1] !== "type" && braceDepth === 1) {
            refs.push({
              file: fileName,
              line: lineNum,
              type: "payload_field",
              value: fieldMatch[1],
              context: currentEventType ?? undefined,
            });
          }

          if (braceDepth <= 0) {
            inPayloadBlock = false;
          }
        }
      } else {
        // Rule C: Extract inline code references (backtick)
        const inlineMatches = line.matchAll(/`([A-Z]\w+)`/g);
        for (const m of inlineMatches) {
          refs.push({
            file: fileName,
            line: lineNum,
            type: "inline_code",
            value: m[1],
          });
        }
      }
    }
  }

  return refs;
}

// ─── Validate ───

interface CheckError {
  file: string;
  line: number;
  rule: "A" | "B" | "C";
  message: string;
}

// Known non-type words that appear in backtick-quoted inline code
const KNOWN_NON_TYPES = new Set([
  "Phase", "Section", "Step", "Gate", "Round", "Builder", "Surface",
  "Draft", "Align", "Compile", "Apply", "Brief", "Scope",
  "Path", "Deep", "Discovery", "Experience", "Code", "Policy",
  "Product", "Owner", "Target", "Constraint", "Exploration",
  "SKIP", "JSON", "PRD", "PO", "Build", "Spec",
  "YYYYMMDD", "NNN",
  "InvoiceStatus", "TicketEventType",
]);

function validate(
  refs: ProtocolRef[],
  refSets: ReturnType<typeof buildRefSets>,
): CheckError[] {
  const errors: CheckError[] = [];

  for (const ref of refs) {
    switch (ref.type) {
      case "event_type": {
        // Rule A: event type must exist in PayloadMap
        if (!refSets.payloadMapKeys.has(ref.value)) {
          errors.push({
            file: ref.file,
            line: ref.line,
            rule: "A",
            message: `Event type "${ref.value}" not found in PayloadMap`,
          });
        }
        break;
      }

      case "payload_field": {
        // Rule B: payload field must exist in the corresponding payload interface (unidirectional)
        if (ref.context) {
          // Find the payload interface for this event type
          const payloadInterface = findPayloadInterface(ref.context, refSets);
          if (payloadInterface) {
            const fields = refSets.payloadFields.get(payloadInterface);
            if (fields && !fields.has(ref.value)) {
              errors.push({
                file: ref.file,
                line: ref.line,
                rule: "B",
                message: `Field "${ref.value}" not found in ${payloadInterface} (event: ${ref.context})`,
              });
            }
          }
        }
        break;
      }

      case "inline_code": {
        // Rule C: type/interface name must exist in exports
        // Only check PascalCase names that look like type references
        if (!refSets.exportedNames.has(ref.value)) {
          // Skip common words and non-type references
          if (!/^[A-Z][a-zA-Z]+$/.test(ref.value)) break;
          if (ref.value.length < 3) break;
          // Skip known non-type words (domain examples, format patterns, common words)
          if (KNOWN_NON_TYPES.has(ref.value)) break;

          errors.push({
            file: ref.file,
            line: ref.line,
            rule: "C",
            message: `"${ref.value}" not found in exported types/interfaces`,
          });
        }
        break;
      }
    }
  }

  return errors;
}

function findPayloadInterface(
  eventType: string,
  refSets: ReturnType<typeof buildRefSets>,
): string | null {
  // Convention: "scope.created" → "ScopeCreatedPayload"
  const parts = eventType.split(".");
  const name = parts
    .map((p) =>
      p
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(""),
    )
    .join("") + "Payload";

  return refSets.payloadFields.has(name) ? name : null;
}

// ─── Main ───

const refSets = buildRefSets(SOURCE_FILES);
const refs = extractRefs(PROTOCOL_DIR);
const errors = validate(refs, refSets);

const result = {
  status: errors.length === 0 ? "pass" : "fail",
  total_refs: refs.length,
  errors,
  summary: {
    event_types: refs.filter((r) => r.type === "event_type").length,
    payload_fields: refs.filter((r) => r.type === "payload_field").length,
    inline_codes: refs.filter((r) => r.type === "inline_code").length,
    error_count: errors.length,
  },
};

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length > 0 ? 1 : 0);
