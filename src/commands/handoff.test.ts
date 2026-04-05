import { describe, expect, it } from "vitest";
import { buildHandoffPrd } from "./handoff.js";
import type { ConstraintEntry, ScopeState } from "../kernel/types.js";

function makeConstraint(
  constraint_id: string,
  overrides: Partial<ConstraintEntry> = {},
): ConstraintEntry {
  return {
    constraint_id,
    perspective: "code",
    summary: `${constraint_id} summary`,
    severity: "recommended",
    discovery_stage: "draft_phase2",
    decision_owner: "product_owner",
    impact_if_ignored: "impact",
    source_refs: [],
    evidence_status: "verified",
    status: "decided",
    decision: "inject",
    rationale: "default rationale",
    discovered_at: 1,
    decided_at: 2,
    ...overrides,
  };
}

function makeState(constraints: ConstraintEntry[]): ScopeState {
  const decided = constraints.filter((constraint) => constraint.status === "decided").length;
  const clarifyPending = constraints.filter((constraint) => constraint.status === "clarify_pending").length;
  const invalidated = constraints.filter((constraint) => constraint.status === "invalidated").length;
  const undecided = constraints.filter((constraint) => constraint.status === "undecided").length;

  return {
    scope_id: "SC-HANDOFF-001",
    title: "Handoff Test",
    description: "handoff description",
    entry_mode: "experience",
    current_state: "validated",
    direction: "handoff direction",
    scope_boundaries: { in: ["scope in"], out: ["scope out"] },
    constraint_pool: {
      constraints,
      summary: {
        total: constraints.length,
        required: constraints.filter((constraint) => constraint.severity === "required").length,
        recommended: constraints.filter((constraint) => constraint.severity === "recommended").length,
        decided,
        clarify_pending: clarifyPending,
        invalidated: invalidated,
        undecided,
      },
    },
    stale: false,
    compile_ready: true,
    convergence_blocked: false,
    revision_count_align: 0,
    revision_count_surface: 0,
    retry_count_compile: 0,
    snapshot_revision: 1,
    verdict_log: [],
    feedback_history: [],
    pre_apply_completed: true,
    prd_review_completed: true,
    latest_revision: 1,
  };
}

describe("buildHandoffPrd", () => {
  it("classifies deferred constraints as decide-later items regardless of owner", () => {
    const state = makeState([
      makeConstraint("CST-PO-DEFER", {
        decision: "defer",
        decision_owner: "product_owner",
        rationale: "po decided to defer",
      }),
      makeConstraint("CST-BUILDER-DEFER", {
        decision: "defer",
        decision_owner: "builder",
        rationale: "builder deferred implementation",
      }),
    ]);

    const handoff = buildHandoffPrd(null, state);

    expect(handoff.decide_later_items).toEqual([
      "[CST-PO-DEFER] CST-PO-DEFER summary — po decided to defer",
      "[CST-BUILDER-DEFER] CST-BUILDER-DEFER summary — builder deferred implementation",
    ]);
    expect(handoff.unclassified_constraints).toEqual([]);
  });
});
