/**
 * Build a developer handoff PRD JSON from a PRD markdown file + scope state.
 *
 * Precondition: This function assumes a validated ScopeState where all
 * constraints have final decisions (no pending clarify/modify-direction).
 */

import { readFileSync, existsSync } from "node:fs";
import type { ScopeState, ConstraintEntry } from "../kernel/types.js";

// ─── Output Schema ───

export interface HandoffUserJourney {
  persona: string;
  action: string;
}

export interface HandoffConstraint {
  constraint_id: string;
  perspective: string;
  summary: string;
  severity: string;
  selected_option?: string;
  impact_if_ignored: string;
}

export interface HandoffBrownfieldSource {
  name: string;
  path: string;
  desc: string;
}

export interface HandoffPrd {
  scope_id: string;
  scope_title: string;
  goal: string;
  user_journeys: HandoffUserJourney[];
  applied_constraints: HandoffConstraint[];
  success_criteria: string[];
  decide_later_items: string[];
  overrides_and_exceptions: string[];
  out_of_scope: string[];
  brownfield_sources: HandoffBrownfieldSource[];
  unclassified_constraints: string[];
  created_at: string;
}

// ─── Builder ───

export function buildHandoffPrd(prdPath: string | null, state: ScopeState): HandoffPrd {
  const sections = prdPath && existsSync(prdPath)
    ? parsePrdSections(readFileSync(prdPath, "utf-8"))
    : {};

  // Filter invalidated constraints once at entry
  const active = state.constraint_pool.constraints.filter(
    (c) => c.status !== "invalidated",
  );

  const appliedConstraints = extractAppliedConstraints(active);
  const decideLaterItems = extractDecideLaterItems(active);
  const overridesAndExceptions = extractOverridesAndExceptions(active);

  // Exhaustiveness guard: find constraints not covered by any section
  const coveredIds = new Set<string>();
  for (const c of appliedConstraints) coveredIds.add(c.constraint_id);
  for (const c of active.filter(isDeferredConstraint)) coveredIds.add(c.constraint_id);
  for (const c of active.filter((x) => x.decision === "override")) coveredIds.add(c.constraint_id);

  const unclassified = active
    .filter((c) => !coveredIds.has(c.constraint_id))
    .map((c) => `[${c.constraint_id}] ${c.summary} (decision: ${c.decision ?? "none"})`);

  return {
    scope_id: state.scope_id,
    scope_title: state.title,
    goal: extractGoal(state, sections),
    user_journeys: extractUserJourneys(state, sections),
    applied_constraints: appliedConstraints,
    success_criteria: extractSuccessCriteria(state, sections),
    decide_later_items: decideLaterItems,
    overrides_and_exceptions: overridesAndExceptions,
    out_of_scope: state.scope_boundaries?.out ?? [],
    brownfield_sources: extractBrownfieldSources(state, active, sections),
    unclassified_constraints: unclassified,
    created_at: new Date().toISOString(),
  };
}

// ─── PRD Markdown Parser ───

function parsePrdSections(md: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = md.split("\n");
  let currentKey = "";
  let currentLines: string[] = [];

  // Detect minimum heading level for resilience to PRD template changes
  const minLevel = detectMinHeadingLevel(lines);
  const sectionPattern = new RegExp(`^#{${minLevel}}\\s+(?:\\d+\\.\\s*)?(.+)$`);

  for (const line of lines) {
    const match = line.match(sectionPattern);
    if (match) {
      if (currentKey) sections[currentKey] = currentLines.join("\n").trim();
      currentKey = normalizeKey(match[1]);
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentKey) sections[currentKey] = currentLines.join("\n").trim();

  return sections;
}

function normalizeKey(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, " ").replace(/\s+/g, " ").trim();
}

// ─── Extractors ───

function extractGoal(state: ScopeState, sections: Record<string, string>): string {
  const summary = findSection(sections, ["executive summary"]);
  if (summary) {
    const firstParagraph = summary.split("\n\n")[0]?.replace(/\n/g, " ").trim();
    if (firstParagraph && firstParagraph.length > 10) return firstParagraph;
  }
  if (state.direction) return state.direction;
  return state.description ?? state.title;
}

function extractUserJourneys(
  state: ScopeState,
  sections: Record<string, string>,
): HandoffUserJourney[] {
  const journeys: HandoffUserJourney[] = [];

  const journeySection = findSection(sections, ["user journeys"]);
  if (journeySection) {
    // Split on one level below the section heading (e.g., ### if section is ##)
    const subLevel = detectMinHeadingLevel(journeySection.split("\n"));
    const subPattern = new RegExp(`^#{${subLevel}}\\s+`, "m");
    const parts = journeySection.split(subPattern);
    // Skip preamble text before the first sub-heading
    if (!journeySection.trim().startsWith("#".repeat(subLevel))) {
      parts.shift();
    }
    const journeyBlocks = parts.filter(Boolean);
    for (const block of journeyBlocks) {
      const titleLine = block.split("\n")[0] ?? "";
      const personaMatch = block.match(/\*\*Persona:?\*\*[:\s]*(.+?)(?:\n|$)/);
      const persona = personaMatch
        ? personaMatch[1].replace(/\s*\(.+?\)\s*/g, "").trim() || "user"
        : "user";
      const action = titleLine.replace(/\(.*?\)/g, "").trim();
      if (action) journeys.push({ persona, action });
    }
  }

  if (journeys.length === 0 && state.scope_boundaries?.in) {
    for (const item of state.scope_boundaries.in) {
      journeys.push({ persona: "user", action: item });
    }
  }

  return journeys;
}

function extractAppliedConstraints(pool: ConstraintEntry[]): HandoffConstraint[] {
  return pool
    .filter((c) => c.decision === "inject")
    .map((c) => ({
      constraint_id: c.constraint_id,
      perspective: c.perspective,
      summary: c.summary,
      severity: c.severity,
      selected_option: c.selected_option,
      impact_if_ignored: c.impact_if_ignored,
    }));
}

function extractSuccessCriteria(
  state: ScopeState,
  sections: Record<string, string>,
): string[] {
  const sc = findSection(sections, ["success criteria"]);
  if (sc) {
    const items = sc.match(/^[-*]\s+.+$/gm);
    if (items && items.length > 0) {
      return items.map((line) => line.replace(/^[-*]\s+/, "").trim());
    }
  }

  if (state.validation_result?.items) {
    return state.validation_result.items.map(
      (item) => `[${item.val_id}] ${item.detail} (${item.result})`,
    );
  }

  return [];
}

function extractDecideLaterItems(pool: ConstraintEntry[]): string[] {
  const items = pool
    .filter(isDeferredConstraint)
    .map((c) => `[${c.constraint_id}] ${c.summary} — ${c.rationale ?? "deferred"}`);

  return items;
}

function extractOverridesAndExceptions(pool: ConstraintEntry[]): string[] {
  const items: string[] = [];

  for (const c of pool.filter((c) => c.decision === "override")) {
    items.push(`[${c.constraint_id}] ${c.summary} — overridden: ${c.rationale ?? "no rationale"}`);
  }

  return items;
}

function extractBrownfieldSources(
  state: ScopeState,
  pool: ConstraintEntry[],
  sections: Record<string, string>,
): HandoffBrownfieldSource[] {
  const sources: HandoffBrownfieldSource[] = [];
  const seen = new Set<string>();

  // PRD Brownfield Sources section
  const bf = findSection(sections, ["brownfield sources"]);
  if (bf) {
    const items = bf.match(/^[-*]\s+.+$/gm);
    if (items) {
      for (const line of items) {
        const text = line.replace(/^[-*]\s+/, "").trim();
        if (!seen.has(text)) {
          seen.add(text);
          const colonIdx = text.indexOf(": ");
          const name = colonIdx > 0 ? text.substring(0, colonIdx).trim() : extractName(text);
          sources.push({ name, path: text, desc: "From PRD Brownfield Sources" });
        }
      }
    }
  }

  // grounding sources
  if (state.grounding_sources) {
    for (const src of state.grounding_sources) {
      if (seen.has(src.path_or_url)) continue;
      seen.add(src.path_or_url);
      sources.push({ name: extractName(src.path_or_url), path: src.path_or_url, desc: `Scanned source (${src.type})` });
    }
  }

  // constraint source_refs
  for (const c of pool.filter((c) => c.decision === "inject")) {
    for (const ref of c.source_refs) {
      if (seen.has(ref.source)) continue;
      seen.add(ref.source);
      sources.push({ name: extractName(ref.source), path: ref.source, desc: `${c.constraint_id}: ${ref.detail}` });
    }
  }

  return sources;
}

// ─── Helpers ───

function findSection(sections: Record<string, string>, candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    for (const [key, value] of Object.entries(sections)) {
      if (key.includes(candidate)) return value;
    }
  }
  return undefined;
}

function detectMinHeadingLevel(lines: string[]): number {
  let min = 7; // sentinel above max heading level
  for (const line of lines) {
    const m = line.match(/^(#{2,6})\s/);
    if (m && m[1].length < min) min = m[1].length;
  }
  return min <= 6 ? min : 2;
}

function extractName(pathOrUrl: string): string {
  if (!pathOrUrl) return "unknown";
  const segments = pathOrUrl.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "unknown";
}

function isDeferredConstraint(constraint: ConstraintEntry): boolean {
  return constraint.decision === "defer";
}
