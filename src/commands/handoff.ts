/**
 * Build a developer handoff PRD JSON from a PRD markdown file + scope state.
 */

import { readFileSync, existsSync } from "node:fs";
import type { ScopeState, ConstraintEntry } from "../kernel/types.js";

// ─── Output Schema ───

export interface HandoffUserStory {
  persona: string;
  action: string;
  benefit: string;
}

export interface HandoffBrownfieldRepo {
  name: string;
  path: string;
  desc: string;
}

export interface HandoffPrd {
  pm_id: string;
  product_name: string;
  goal: string;
  user_stories: HandoffUserStory[];
  constraints: string[];
  success_criteria: string[];
  decide_later_items: string[];
  assumptions: string[];
  interview_id: string;
  brownfield_repos: HandoffBrownfieldRepo[];
  created_at: string;
}

// ─── Builder ───

export function buildHandoffPrd(prdPath: string, state: ScopeState): HandoffPrd {
  const sections = existsSync(prdPath)
    ? parsePrdSections(readFileSync(prdPath, "utf-8"))
    : {};
  const constraints = state.constraint_pool.constraints;

  return {
    pm_id: state.scope_id,
    product_name: state.title,
    goal: extractGoal(state, sections),
    user_stories: extractUserStories(state, sections),
    constraints: extractConstraints(constraints),
    success_criteria: extractSuccessCriteria(state, sections),
    decide_later_items: extractDecideLaterItems(constraints),
    assumptions: extractAssumptions(constraints),
    interview_id: state.scope_id,
    brownfield_repos: extractBrownfieldRepos(state, constraints, sections),
    created_at: new Date().toISOString(),
  };
}

// ─── PRD Markdown Parser ───

function parsePrdSections(md: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = md.split("\n");
  let currentKey = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(?:\d+\.\s*)?(.+)$/);
    if (h2Match) {
      if (currentKey) sections[currentKey] = currentLines.join("\n").trim();
      currentKey = normalizeKey(h2Match[1]);
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentKey) sections[currentKey] = currentLines.join("\n").trim();

  return sections;
}

function normalizeKey(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z가-힣\s]/g, "").trim();
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

function extractUserStories(
  state: ScopeState,
  sections: Record<string, string>,
): HandoffUserStory[] {
  const stories: HandoffUserStory[] = [];

  const journeys = findSection(sections, ["user journeys"]);
  if (journeys) {
    const journeyBlocks = journeys.split(/^###\s+/m).filter(Boolean);
    for (const block of journeyBlocks) {
      const titleLine = block.split("\n")[0] ?? "";
      const personaMatch = block.match(/\*\*Persona:\*\*\s*(.+?)(?:\n|$)/);
      const persona = personaMatch
        ? personaMatch[1].replace(/\(.+?\)/, "").trim()
        : "user";
      const action = titleLine.replace(/\(.*?\)/g, "").trim();
      const benefit = state.direction ?? state.title;
      if (action) stories.push({ persona, action, benefit });
    }
  }

  if (stories.length === 0 && state.scope_boundaries?.in) {
    for (const item of state.scope_boundaries.in) {
      stories.push({ persona: "user", action: item, benefit: state.direction ?? state.title });
    }
  }

  return stories;
}

function extractConstraints(pool: ConstraintEntry[]): string[] {
  return pool
    .filter((c) => c.decision === "inject" && c.status !== "invalidated")
    .map((c) => `[${c.constraint_id}] ${c.summary} (${c.selected_option ?? c.decision})`);
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

  return state.constraint_pool.constraints
    .filter((c) => c.decision === "inject")
    .map((c) => `${c.constraint_id}: ${c.summary}`);
}

function extractDecideLaterItems(pool: ConstraintEntry[]): string[] {
  const items = pool
    .filter((c) => c.decision === "defer" && c.decision_owner === "builder")
    .map((c) => `[${c.constraint_id}] ${c.summary} — ${c.rationale ?? "deferred"}`);

  return items.length > 0 ? items : ["No deferred developer decisions"];
}

function extractAssumptions(pool: ConstraintEntry[]): string[] {
  const assumptions: string[] = [];

  for (const c of pool.filter((c) => c.decision === "override")) {
    assumptions.push(`[${c.constraint_id}] ${c.summary} — overridden: ${c.rationale ?? "no rationale"}`);
  }

  for (const c of pool.filter((c) => c.requires_policy_change && c.evidence_status === "verified")) {
    assumptions.push(`[${c.constraint_id}] Policy verified: ${c.evidence_note ?? c.summary}`);
  }

  return assumptions.length > 0 ? assumptions : ["No explicit assumptions recorded"];
}

function extractBrownfieldRepos(
  state: ScopeState,
  pool: ConstraintEntry[],
  sections: Record<string, string>,
): HandoffBrownfieldRepo[] {
  const repos: HandoffBrownfieldRepo[] = [];
  const seen = new Set<string>();

  // PRD Brownfield Sources 섹션
  const bf = findSection(sections, ["brownfield sources"]);
  if (bf) {
    const items = bf.match(/^[-*]\s+.+$/gm);
    if (items) {
      for (const line of items) {
        const text = line.replace(/^[-*]\s+/, "").trim();
        if (!seen.has(text)) {
          seen.add(text);
          repos.push({ name: text.split(/[:/]/)[0]?.trim() ?? text, path: text, desc: "From PRD Brownfield Sources" });
        }
      }
    }
  }

  // grounding sources
  if (state.grounding_sources) {
    for (const src of state.grounding_sources) {
      if (seen.has(src.path_or_url)) continue;
      seen.add(src.path_or_url);
      repos.push({ name: extractName(src.path_or_url), path: src.path_or_url, desc: `Scanned source (${src.type})` });
    }
  }

  // constraint source_refs
  for (const c of pool.filter((c) => c.decision === "inject")) {
    for (const ref of c.source_refs) {
      if (seen.has(ref.source)) continue;
      seen.add(ref.source);
      repos.push({ name: extractName(ref.source), path: ref.source, desc: `${c.constraint_id}: ${ref.detail}` });
    }
  }

  return repos;
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

function extractName(pathOrUrl: string): string {
  const segments = pathOrUrl.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? pathOrUrl;
}
