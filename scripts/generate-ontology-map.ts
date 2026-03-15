#!/usr/bin/env npx tsx
/**
 * Generates docs/ontology-map.md from src/kernel/types.ts.
 *
 * Usage:
 *   npx tsx scripts/generate-ontology-map.ts          # stdout (dry run)
 *   npx tsx scripts/generate-ontology-map.ts --write   # write to docs/ontology-map.md
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseTypeFile, type ParseResult } from "./lib/parse-types.js";

const ROOT = join(import.meta.dirname, "..");
const TYPES_PATH = join(ROOT, "src/kernel/types.ts");
const OUTPUT_PATH = join(ROOT, "docs/ontology-map.md");

// ─── Classification ───

const L4_EXCLUDED = new Set([
  "TransitionResult", "TransitionDenied", "TransitionOutcome",
  "sourceKey", "formatPerspective", "isEvidenceUnverified", "isPolicyChangeRequired",
]);

const L3_RENDERER_INPUTS = new Set([
  "AlignPacketContent", "DraftPacketContent",
  "ConstraintDetailPO", "ConstraintDetailBuilder", "ConstraintDetail",
]);

const PAYLOAD_SUFFIX = "Payload";

function isPayload(name: string): boolean {
  return name.endsWith(PAYLOAD_SUFFIX) || name === "PayloadMap" || name === "ValidationItemResult";
}

function isL3(name: string): boolean {
  return isPayload(name) || L3_RENDERER_INPUTS.has(name);
}

// ─── Render ───

function render(r: ParseResult): string {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push(`# Sprint Kit Ontology Map`);
  lines.push(`<!-- auto-generated from src/kernel/types.ts — do not edit manually -->`);
  lines.push(`<!-- generated at: ${now} -->`);
  lines.push(`<!-- regenerate: npx tsx scripts/generate-ontology-map.ts --write -->`);
  lines.push(``);

  // ── L1: Union Types ──
  lines.push(`## Union Types`);
  lines.push(``);
  for (const u of r.unionTypes) {
    if (L4_EXCLUDED.has(u.name)) continue;
    lines.push(`### ${u.name} (${u.values.length} values)`);
    if (u.jsdoc) lines.push(`> ${u.jsdoc}`);
    lines.push(`\`${u.values.join(" | ")}\``);
    lines.push(`→ src/kernel/types.ts:${u.line}`);
    lines.push(``);
  }

  // ── L1: Const Arrays ──
  lines.push(`## Const Arrays`);
  lines.push(``);
  for (const c of r.constArrays) {
    lines.push(`### ${c.name} (${c.values.length} values)`);
    lines.push(`\`${c.values.join(" | ")}\``);
    lines.push(`→ src/kernel/types.ts:${c.line}`);
    lines.push(``);
  }

  // ── L2: Domain Interfaces ──
  lines.push(`## Domain Interfaces`);
  lines.push(``);
  const l2 = r.interfaces.filter(
    (i) => !isL3(i.name) && !L4_EXCLUDED.has(i.name),
  );
  for (const iface of l2) {
    lines.push(`### ${iface.name}`);
    if (iface.jsdoc) lines.push(`> ${iface.jsdoc}`);
    if (iface.extends) lines.push(`extends: ${iface.extends}`);
    for (const f of iface.fields) {
      const opt = f.optional ? "?" : "";
      lines.push(`- ${f.name}${opt}: ${f.type}`);
    }
    lines.push(`→ src/kernel/types.ts:${iface.line}`);
    lines.push(``);
  }

  // ── L3: Renderer Input Types ──
  lines.push(`## Renderer Input Types`);
  lines.push(``);
  const l3renderer = r.interfaces.filter((i) => L3_RENDERER_INPUTS.has(i.name));
  for (const iface of l3renderer) {
    lines.push(`### ${iface.name}`);
    for (const f of iface.fields) {
      const opt = f.optional ? "?" : "";
      lines.push(`- ${f.name}${opt}: ${f.type}`);
    }
    lines.push(`→ src/kernel/types.ts:${iface.line}`);
    lines.push(``);
  }

  // ── L3: Event-Payload Map ──
  lines.push(`## Event-Payload Map`);
  lines.push(``);
  lines.push(`| Event Type | Payload Interface |`);
  lines.push(`|---|---|`);
  for (const entry of r.payloadMap) {
    lines.push(`| ${entry.eventType} | ${entry.payloadInterface} |`);
  }
  lines.push(``);

  // ── Relationships ──
  lines.push(`## Relationships`);
  lines.push(``);
  lines.push(`### Physical References (actual code)`);
  lines.push(``);
  lines.push(`- ScopeState 1:1 ConstraintPool (via constraint_pool field)`);
  lines.push(`- ConstraintPool 1:N ConstraintEntry (via constraints[])`);
  lines.push(`- ScopeState 1:N VerdictLogEntry (via verdict_log[])`);
  lines.push(`- ScopeState 0..1 ExplorationProgress (via exploration_progress?)`);
  lines.push(`- ScopeState N:N Event (state reconstructed from Event[] via Reducer)`);
  lines.push(`- Event → PayloadMap[T] (discriminated union, compile-time enforced)`);
  lines.push(``);
  lines.push(`### Tracing Chain — CST-centric Star Pattern`);
  lines.push(``);
  lines.push(`The logical chain CST→IMPL→CHG→VAL is verified by Compile Defense.`);
  lines.push(`Physical references form a star pattern centered on CST:`);
  lines.push(``);
  lines.push(`- ConstraintEntry N:M ImplementationItem (via related_cst: string[])`);
  lines.push(`- ImplementationItem N:M DeltaSetChange (via related_impl: string[])`);
  lines.push(`- ValidationPlanItem N:1 ConstraintEntry (via related_cst: string)`);
  lines.push(``);
  lines.push(`Note: ImplementationItem, DeltaSetChange are defined in src/compilers/, not kernel/types.ts.`);
  lines.push(`Compile Defense L2 verifies: for each inject CST, at least one IMPL, CHG, and VAL exist.`);
  lines.push(``);

  // ── Behavioral Knowledge Guide ──
  lines.push(`## Behavioral Knowledge (not in this map)`);
  lines.push(``);
  lines.push(`This map covers structural knowledge only (entities, fields, relationships).`);
  lines.push(`Sprint Kit's identity is defined by behavioral knowledge:`);
  lines.push(``);
  lines.push(`| Knowledge | Location |`);
  lines.push(`|---|---|`);
  lines.push(`| State×Event transition matrix (15×44) | src/kernel/state-machine.ts |`);
  lines.push(`| Gate Guard rules (GC-005~018) | src/kernel/gate-guard.ts |`);
  lines.push(`| Compile Defense L1-L3 | src/compilers/compile-defense.ts |`);
  lines.push(`| Compile I/O types (ImplementationItem, ChangeItem, DeltaSet, etc.) | src/compilers/compile.ts, compile-defense.ts |`);
  lines.push(`| Global Constraints GC-001~022 | docs/blueprint.md §7 |`);
  lines.push(`| Convergence Safety (3/5/7 thresholds) | src/kernel/constants.ts, gate-guard.ts |`);
  lines.push(`| Stale Detection (2-point: gate + command) | docs/blueprint.md §4 |`);
  lines.push(`| Exploration 6-Phase protocol | docs/agent-protocol/exploration.md |`);
  lines.push(`| Pre-Apply Review 3-perspective | docs/agent-protocol/draft-compile.md |`);
  lines.push(`| Feedback Classification rules | docs/agent-protocol/draft-surface.md |`);
  lines.push(`| Agent protocol procedures | docs/agent-protocol/*.md |`);
  lines.push(``);

  // ── Functions (L4, excluded) ──
  lines.push(`## Excluded (L4: internal implementation)`);
  lines.push(``);
  lines.push(`Functions: ${r.functions.join(", ")}`);
  lines.push(`Types: ${[...L4_EXCLUDED].filter((n) => !r.functions.includes(n)).join(", ")}`);
  lines.push(``);

  return lines.join("\n");
}

// ─── Main ───

const result = parseTypeFile(TYPES_PATH);
const markdown = render(result);

if (process.argv.includes("--write")) {
  writeFileSync(OUTPUT_PATH, markdown);
  console.log(`Written to ${OUTPUT_PATH}`);
  console.log(`  Union types: ${result.unionTypes.length}`);
  console.log(`  Const arrays: ${result.constArrays.length}`);
  console.log(`  Interfaces: ${result.interfaces.length}`);
  console.log(`  PayloadMap entries: ${result.payloadMap.length}`);
} else {
  process.stdout.write(markdown);
}
