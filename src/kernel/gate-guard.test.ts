import { describe, it, expect } from "vitest";
import { validateEvent } from "./gate-guard.js";
import { reduce } from "./reducer.js";
import { buildConstraintPool } from "./constraint-pool.js";
import type { Event, ScopeState, ConstraintPool } from "./types.js";

// ─── Helpers ───

/** Build a minimal ScopeState for testing. */
function makeState(overrides: Partial<ScopeState> = {}): ScopeState {
  const emptyPool: ConstraintPool = {
    constraints: [],
    summary: { total: 0, required: 0, recommended: 0, decided: 0, clarify_pending: 0, invalidated: 0, undecided: 0 },
  };
  return {
    current_state: "surface_confirmed",
    constraint_pool: emptyPool,
    stale: false,
    compile_ready: false,
    convergence_blocked: false,
    revision_count_align: 0,
    revision_count_surface: 0,
    retry_count_compile: 0,
    verdict_log: [],
    feedback_history: [],
    latest_revision: 0,
    ...overrides,
  };
}

/** Build a state with constraints in the pool. */
function makeStateWithConstraints(
  constraints: Array<{
    id: string;
    severity: "required" | "recommended";
    status: "undecided" | "decided" | "clarify_pending" | "invalidated";
  }>,
  stateOverrides: Partial<ScopeState> = {},
): ScopeState {
  const entries = constraints.map((c) => ({
    constraint_id: c.id,
    perspective: "code" as const,
    summary: `test ${c.id}`,
    severity: c.severity,
    discovery_stage: "draft_phase2" as const,
    decision_owner: "product_owner" as const,
    status: c.status,
    discovered_at: 1,
    ...(c.status === "decided" ? { decision: "inject" as const, selected_option: "opt", decided_at: 2 } : {}),
  }));

  let decided = 0, clarify_pending = 0, invalidated = 0, undecided = 0, required = 0, recommended = 0;
  for (const e of entries) {
    if (e.severity === "required") required++; else recommended++;
    switch (e.status) {
      case "decided": decided++; break;
      case "clarify_pending": clarify_pending++; break;
      case "invalidated": invalidated++; break;
      case "undecided": undecided++; break;
    }
  }

  return makeState({
    constraint_pool: {
      constraints: entries,
      summary: { total: entries.length, required, recommended, decided, clarify_pending, invalidated, undecided },
    },
    ...stateOverrides,
  });
}

/** Create a minimal event for testing. */
function makeEvent(
  type: string,
  payload: Record<string, unknown> = {},
  revision = 10,
): Event {
  return {
    event_id: `evt_${revision}`,
    scope_id: "SC-TEST",
    type,
    ts: "2026-01-01T00:00:10Z",
    revision,
    actor: "user",
    state_before: "surface_confirmed",
    state_after: "surface_confirmed",
    payload,
  } as Event;
}

// ─── Rule 1: State transition authorization ───

describe("gate-guard — Rule 1: state transition", () => {
  it("allows valid transition: draft → grounding.completed → grounded", () => {
    const state = makeState({ current_state: "draft" });
    const event = makeEvent("grounding.completed", {
      snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 },
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("grounded");
  });

  it("denies invalid transition: draft → align.locked", () => {
    const state = makeState({ current_state: "draft" });
    const event = makeEvent("align.locked", {
      locked_direction: "d", locked_scope_boundaries: { in: [], out: [] }, locked_in_out: true,
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain("Transition denied");
  });

  it("denies events at terminal state (closed)", () => {
    const state = makeState({ current_state: "closed" });
    const event = makeEvent("align.proposed", { packet_path: "p", packet_hash: "h", snapshot_revision: 1 });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
  });

  it("allows global event (scope.deferred) from non-terminal", () => {
    const state = makeState({ current_state: "align_proposed" });
    const event = makeEvent("scope.deferred", { reason: "r", resume_condition: "c" });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("deferred");
  });

  it("allows observational event (feedback.classified)", () => {
    const state = makeState({ current_state: "surface_iterating" });
    const event = makeEvent("feedback.classified", {
      classification: "surface_only", confidence: 0.9, confirmed_by: "auto",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("surface_iterating");
  });
});

// ─── Rule 2: Referential integrity ───

describe("gate-guard — Rule 2: referential integrity", () => {
  it("allows decision_recorded when constraint exists in pool", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "recommended", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "inject", selected_option: "opt",
      decision_owner: "product_owner", rationale: "r",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
  });

  it("denies decision_recorded for non-existent constraint", () => {
    const state = makeState();
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-999", decision: "inject", selected_option: "opt",
      decision_owner: "product_owner", rationale: "r",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain("CST-999");
  });

  it("denies clarify_requested for non-existent constraint", () => {
    const state = makeState();
    const event = makeEvent("constraint.clarify_requested", {
      constraint_id: "CST-999", question: "q", asked_to: "t",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
  });

  it("denies clarify_resolved for non-existent constraint", () => {
    const state = makeState();
    const event = makeEvent("constraint.clarify_resolved", {
      constraint_id: "CST-999", resolution: "r", decision: "inject",
      selected_option: "o", decision_owner: "product_owner", rationale: "r",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
  });

  it("denies surface.change_required for non-existent constraint", () => {
    const state = makeState();
    const event = makeEvent("surface.change_required", {
      constraint_id: "CST-999", reason: "r",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
  });

  it("allows constraint.discovered (no referential check needed)", () => {
    const state = makeState();
    const event = makeEvent("constraint.discovered", {
      constraint_id: "CST-NEW", perspective: "code", summary: "s",
      severity: "required", discovery_stage: "draft_phase2",
      decision_owner: "builder", impact_if_ignored: "i", source_refs: [],
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
  });
});

// ─── Rule 3: Required override validation ───

describe("gate-guard — Rule 3: required override", () => {
  it("allows inject on required constraint (no rationale needed)", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "inject", selected_option: "opt",
      decision_owner: "product_owner", rationale: "",
    });
    expect(validateEvent(state, event).allowed).toBe(true);
  });

  it("allows override on required with rationale", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "override", selected_option: "opt",
      decision_owner: "product_owner", rationale: "cost reduction",
    });
    expect(validateEvent(state, event).allowed).toBe(true);
  });

  it("denies override on required with empty rationale", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "override", selected_option: "opt",
      decision_owner: "product_owner", rationale: "",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain("rationale");
  });

  it("denies override on required with whitespace-only rationale", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "override", selected_option: "opt",
      decision_owner: "product_owner", rationale: "   ",
    });
    expect(validateEvent(state, event).allowed).toBe(false);
  });

  it("allows override on recommended without rationale", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "recommended", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "override", selected_option: "opt",
      decision_owner: "product_owner", rationale: "",
    });
    expect(validateEvent(state, event).allowed).toBe(true);
  });

  it("applies same rule to clarify_resolved", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "clarify_pending" },
    ]);
    const event = makeEvent("constraint.clarify_resolved", {
      constraint_id: "CST-001", resolution: "r", decision: "override",
      selected_option: "opt", decision_owner: "product_owner", rationale: "",
    });
    expect(validateEvent(state, event).allowed).toBe(false);
  });
});

// ─── Rule 3b: Required constraint invalidation protection (GC-017) ───

describe("gate-guard — Rule 3b: required constraint invalidation [GC-017]", () => {
  it("denies system invalidation of required constraint", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "undecided" },
    ]);
    const event = {
      ...makeEvent("constraint.invalidated", {
        constraint_id: "CST-001", reason: "방향 변경으로 무관",
      }),
      actor: "system" as const,
    };
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain("cannot be invalidated by system alone");
  });

  it("allows user invalidation of required constraint", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "undecided" },
    ]);
    const event = {
      ...makeEvent("constraint.invalidated", {
        constraint_id: "CST-001", reason: "사용자 확인 완료",
      }),
      actor: "user" as const,
    };
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
  });

  it("allows system invalidation of recommended constraint", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "recommended", status: "undecided" },
    ]);
    const event = {
      ...makeEvent("constraint.invalidated", {
        constraint_id: "CST-001", reason: "방향 변경으로 무관",
      }),
      actor: "system" as const,
    };
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
  });

  it("allows agent invalidation of required constraint", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "undecided" },
    ]);
    const event = {
      ...makeEvent("constraint.invalidated", {
        constraint_id: "CST-001", reason: "에이전트가 사용자 확인 후 발행",
      }),
      actor: "agent" as const,
    };
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
  });
});

// ─── Rule 4: Convergence blocking ───

describe("gate-guard — Rule 4: convergence blocking", () => {
  it("allows revision when not blocked", () => {
    const state = makeState({
      current_state: "surface_iterating",
      convergence_blocked: false,
    });
    const event = makeEvent("surface.revision_applied", {
      revision_count: 1, surface_path: "p", content_hash: "h",
    });
    expect(validateEvent(state, event).allowed).toBe(true);
  });

  it("denies surface.revision_applied when blocked", () => {
    const state = makeState({
      current_state: "surface_iterating",
      convergence_blocked: true,
    });
    const event = makeEvent("surface.revision_applied", {
      revision_count: 8, surface_path: "p", content_hash: "h",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain("Convergence blocked");
  });

  it("denies align.revised when blocked", () => {
    const state = makeState({
      current_state: "align_proposed",
      convergence_blocked: true,
    });
    const event = makeEvent("align.revised", {
      revision_count: 8, feedback_scope: "s", feedback_text: "t",
      packet_path: "p", packet_hash: "h",
    });
    expect(validateEvent(state, event).allowed).toBe(false);
  });

  it("allows scope.deferred even when blocked (global event)", () => {
    const state = makeState({
      current_state: "surface_iterating",
      convergence_blocked: true,
    });
    const event = makeEvent("scope.deferred", { reason: "r", resume_condition: "c" });
    expect(validateEvent(state, event).allowed).toBe(true);
  });

  it("allows convergence.action_taken even when blocked (observational)", () => {
    const state = makeState({
      current_state: "surface_iterating",
      convergence_blocked: true,
    });
    const event = makeEvent("convergence.action_taken", {
      state: "surface_iterating", chosen_action: "redirect", reason: "r",
    });
    expect(validateEvent(state, event).allowed).toBe(true);
  });
});

// ─── Rule 5a: Apply gate ───

describe("gate-guard — Rule 5a: apply gate", () => {
  it("denies apply.started when apply_enabled is not provided", () => {
    const state = makeState({ current_state: "compiled" });
    const event = makeEvent("apply.started", { build_spec_hash: "h" });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("apply_enabled");
    }
  });

  it("denies apply.started when apply_enabled is false", () => {
    const state = makeState({ current_state: "compiled" });
    const event = makeEvent("apply.started", { build_spec_hash: "h" });
    const result = validateEvent(state, event, { apply_enabled: false });
    expect(result.allowed).toBe(false);
  });

  it("allows apply.started when apply_enabled is true", () => {
    const state = makeState({ current_state: "compiled" });
    const event = makeEvent("apply.started", { build_spec_hash: "h" });
    const result = validateEvent(state, event, { apply_enabled: true });
    expect(result.allowed).toBe(true);
  });

  it("does not affect non-apply events", () => {
    const state = makeState({ current_state: "target_locked", compile_ready: true });
    const event = makeEvent("compile.started", { snapshot_revision: 1, surface_hash: "h" });
    // No options needed for non-apply events
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
  });
});

// ─── Rule 5b: Compile retry limit ───

describe("gate-guard — Rule 5: compile retry limit", () => {
  it("allows compile.started when retry_count_compile < 3", () => {
    const state = makeState({
      current_state: "target_locked",
      retry_count_compile: 2,
    });
    const event = makeEvent("compile.started", {
      snapshot_revision: 1, surface_hash: "h",
    });
    expect(validateEvent(state, event).allowed).toBe(true);
  });

  it("denies compile.started when retry_count_compile >= 3", () => {
    const state = makeState({
      current_state: "target_locked",
      retry_count_compile: 3,
    });
    const event = makeEvent("compile.started", {
      snapshot_revision: 1, surface_hash: "h",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain("Compile retry limit");
  });

  it("allows compile.completed even when retry_count_compile >= 3", () => {
    const state = makeState({
      current_state: "target_locked",
      retry_count_compile: 3,
    });
    const event = makeEvent("compile.completed", {
      build_spec_path: "p", build_spec_hash: "h",
      delta_set_path: "p", delta_set_hash: "h",
      validation_plan_path: "p", validation_plan_hash: "h",
    });
    expect(validateEvent(state, event).allowed).toBe(true);
  });

  it("allows scope.deferred when compile retry limit exceeded", () => {
    const state = makeState({
      current_state: "target_locked",
      retry_count_compile: 3,
    });
    const event = makeEvent("scope.deferred", { reason: "r", resume_condition: "c" });
    expect(validateEvent(state, event).allowed).toBe(true);
  });
});

// ─── Conditional targets: surface_confirmed → constraints_resolved ───

describe("gate-guard — conditional targets: constraints_resolved", () => {
  it("stays at surface_confirmed when undecided constraints remain", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "undecided" },
      { id: "CST-002", severity: "recommended", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "inject", selected_option: "opt",
      decision_owner: "product_owner", rationale: "r",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("surface_confirmed");
  });

  it("transitions to constraints_resolved when last constraint decided", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "decided" },
      { id: "CST-002", severity: "recommended", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-002", decision: "inject", selected_option: "opt",
      decision_owner: "product_owner", rationale: "r",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("constraints_resolved");
  });

  it("transitions via clarify_resolved when last pending resolved", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "decided" },
      { id: "CST-002", severity: "recommended", status: "clarify_pending" },
    ]);
    const event = makeEvent("constraint.clarify_resolved", {
      constraint_id: "CST-002", resolution: "r", decision: "inject",
      selected_option: "opt", decision_owner: "product_owner", rationale: "r",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("constraints_resolved");
  });

  it("transitions via invalidated when all others decided", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "decided" },
      { id: "CST-002", severity: "recommended", status: "undecided" },
    ]);
    const event = makeEvent("constraint.invalidated", {
      constraint_id: "CST-002", reason: "no longer relevant",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("constraints_resolved");
  });
});

// ─── Conditional targets: validation.completed ───

describe("gate-guard — conditional targets: validation.completed", () => {
  it("pass → validated", () => {
    const state = makeState({ current_state: "applied" });
    const event = makeEvent("validation.completed", {
      result: "pass", pass_count: 5, fail_count: 0, items: [],
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("validated");
  });

  it("fail + not stale → constraints_resolved", () => {
    const state = makeState({ current_state: "applied", stale: false });
    const event = makeEvent("validation.completed", {
      result: "fail", pass_count: 3, fail_count: 2, items: [],
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("constraints_resolved");
  });

  it("fail + stale → grounded", () => {
    const state = makeState({ current_state: "applied", stale: true });
    const event = makeEvent("validation.completed", {
      result: "fail", pass_count: 3, fail_count: 2, items: [],
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("grounded");
  });

  it("transitions to grounded when pass but stale", () => {
    const state = makeState({ current_state: "applied", stale: true });
    const event = makeEvent("validation.completed", {
      result: "pass", pass_count: 5, fail_count: 0, items: [],
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("grounded");
  });
});

// ─── Integration: golden data event sequence ───

describe("gate-guard — golden data integration", () => {
  it("every golden event passes validation against its preceding state", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const goldenPath = resolve(import.meta.dirname, "../../scopes/example-tutor-block/events.ndjson");
    const allEvents: Event[] = readFileSync(goldenPath, "utf-8")
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line) as Event);

    for (let i = 0; i < allEvents.length; i++) {
      const precedingEvents = allEvents.slice(0, i);
      const state = reduce(precedingEvents);
      const currentEvent = allEvents[i];

      const result = validateEvent(state, currentEvent);
      expect(
        result.allowed,
        `Event ${currentEvent.event_id} (${currentEvent.type}) at revision ${currentEvent.revision} should be allowed. ${
          !result.allowed ? `Reason: ${result.reason}` : ""
        }`,
      ).toBe(true);

      if (result.allowed) {
        expect(
          result.next_state,
          `Event ${currentEvent.event_id}: expected next_state ${currentEvent.state_after}, got ${result.next_state}`,
        ).toBe(currentEvent.state_after);
      }
    }
  });
});

// ─── Additional edge case tests (review recommendations) ───

describe("gate-guard — scope.created edge cases", () => {
  it("denies scope.created when events already exist", () => {
    const state = makeState({ current_state: "draft", latest_revision: 1 });
    const event = makeEvent("scope.created", {
      title: "t", description: "d", entry_mode: "experience",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain("scope.created");
  });
});

describe("gate-guard — terminal state rejection", () => {
  it("denies global event (scope.deferred) at terminal state", () => {
    const state = makeState({ current_state: "closed" });
    const event = makeEvent("scope.deferred", { reason: "r", resume_condition: "c" });
    expect(validateEvent(state, event).allowed).toBe(false);
  });

  it("denies observational event (feedback.classified) at terminal state", () => {
    const state = makeState({ current_state: "deferred" });
    const event = makeEvent("feedback.classified", {
      classification: "surface_only", confidence: 0.9, confirmed_by: "auto",
    });
    expect(validateEvent(state, event).allowed).toBe(false);
  });

  it("denies observational event at rejected state", () => {
    const state = makeState({ current_state: "rejected" });
    const event = makeEvent("convergence.action_taken", {
      state: "rejected", chosen_action: "x", reason: "r",
    });
    expect(validateEvent(state, event).allowed).toBe(false);
  });
});

describe("gate-guard — additional edge cases", () => {
  it("constraint.discovered bypasses referential integrity", () => {
    const state = makeState({ current_state: "surface_confirmed" });
    const event = makeEvent("constraint.discovered", {
      constraint_id: "CST-NEW", perspective: "code", summary: "s",
      severity: "required", discovery_stage: "draft_phase2",
      decision_owner: "builder", impact_if_ignored: "i", source_refs: [],
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
  });

  it("constraint.invalidated for non-existent ID denied", () => {
    const state = makeState({ current_state: "surface_confirmed" });
    const event = makeEvent("constraint.invalidated", {
      constraint_id: "CST-GHOST", reason: "no longer relevant",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain("not found");
  });

  it("compile.constraint_gap_found not blocked by retry limit", () => {
    const state = makeState({
      current_state: "target_locked",
      retry_count_compile: 3,
    });
    const event = makeEvent("compile.constraint_gap_found", {
      new_constraint_id: "CST-010", perspective: "code", summary: "s",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
  });

  it("scope.created denied when events exist (latest_revision > 0)", () => {
    const state = makeState({ current_state: "draft", latest_revision: 5 });
    const event = makeEvent("scope.created", {
      title: "t", description: "d", entry_mode: "experience",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
  });

  it("convergence.action_taken allowed even when convergence_blocked", () => {
    const state = makeState({
      current_state: "surface_iterating",
      convergence_blocked: true,
    });
    const event = makeEvent("convergence.action_taken", {
      state: "surface_iterating", chosen_action: "redirect", reason: "r",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
  });
});

// ─── Rule 3: recommended constraint + override without rationale ───

describe("gate-guard — Rule 3: recommended + override", () => {
  it("allows override on recommended constraint without rationale", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "recommended", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "override", selected_option: "opt",
      decision_owner: "product_owner", rationale: "",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
  });

  it("allows override on recommended constraint with undefined rationale", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "recommended", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "override", selected_option: "opt",
      decision_owner: "product_owner",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
  });
});

// ─── Conditional target: surface_confirmed → constraints_resolved via last decide ───

describe("gate-guard — conditional target: last undecided constraint", () => {
  it("surface_confirmed → constraints_resolved when deciding the last undecided constraint", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "decided" },
      { id: "CST-002", severity: "recommended", status: "decided" },
      { id: "CST-003", severity: "recommended", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-003", decision: "inject", selected_option: "opt",
      decision_owner: "product_owner", rationale: "r",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("constraints_resolved");
  });

  it("stays surface_confirmed when there are still undecided after decide", () => {
    const state = makeStateWithConstraints([
      { id: "CST-001", severity: "required", status: "decided" },
      { id: "CST-002", severity: "recommended", status: "undecided" },
      { id: "CST-003", severity: "recommended", status: "undecided" },
    ]);
    const event = makeEvent("constraint.decision_recorded", {
      constraint_id: "CST-002", decision: "inject", selected_option: "opt",
      decision_owner: "product_owner", rationale: "r",
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("surface_confirmed");
  });
});

// ─── Rule 6: target.locked constraint resolution (TCOV-4) ───

describe("gate-guard — Rule 6: target.locked constraint resolution", () => {
  it("denies target.locked with undecided constraints", () => {
    const state = makeStateWithConstraints(
      [
        { id: "CST-001", severity: "required", status: "decided" },
        { id: "CST-002", severity: "recommended", status: "undecided" },
      ],
      { current_state: "constraints_resolved" },
    );
    const event = makeEvent("target.locked", {
      surface_hash: "h",
      constraint_decisions: [{ constraint_id: "CST-001", decision: "inject" }],
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain("미결정");
  });

  it("denies target.locked with clarify_pending constraints", () => {
    const state = makeStateWithConstraints(
      [
        { id: "CST-001", severity: "required", status: "decided" },
        { id: "CST-002", severity: "recommended", status: "clarify_pending" },
      ],
      { current_state: "constraints_resolved" },
    );
    const event = makeEvent("target.locked", {
      surface_hash: "h",
      constraint_decisions: [{ constraint_id: "CST-001", decision: "inject" }],
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toContain("clarify");
  });

  it("allows target.locked with all decided/invalidated constraints", () => {
    const state = makeStateWithConstraints(
      [
        { id: "CST-001", severity: "required", status: "decided" },
        { id: "CST-002", severity: "recommended", status: "decided" },
        { id: "CST-003", severity: "recommended", status: "invalidated" },
      ],
      { current_state: "constraints_resolved" },
    );
    const event = makeEvent("target.locked", {
      surface_hash: "h",
      constraint_decisions: [
        { constraint_id: "CST-001", decision: "inject" },
        { constraint_id: "CST-002", decision: "defer" },
      ],
    });
    const result = validateEvent(state, event);
    expect(result.allowed).toBe(true);
    if (result.allowed) expect(result.next_state).toBe("target_locked");
  });
});

// ─── scope.deferred exhaustive: allowed from every non-terminal state ───

describe("gate-guard — scope.deferred exhaustive non-terminal", () => {
  const nonTerminalStates = [
    "draft", "grounded", "align_proposed", "align_locked",
    "surface_iterating", "surface_confirmed", "constraints_resolved",
    "target_locked", "compiled", "applied", "validated",
  ] as const;

  for (const s of nonTerminalStates) {
    it(`scope.deferred allowed from ${s}`, () => {
      const state = makeState({ current_state: s });
      const event = makeEvent("scope.deferred", { reason: "r", resume_condition: "c" });
      const result = validateEvent(state, event);
      expect(result.allowed).toBe(true);
      if (result.allowed) expect(result.next_state).toBe("deferred");
    });
  }

  it("scope.deferred denied from deferred (terminal)", () => {
    const state = makeState({ current_state: "deferred" });
    const event = makeEvent("scope.deferred", { reason: "r", resume_condition: "c" });
    expect(validateEvent(state, event).allowed).toBe(false);
  });

  it("scope.deferred denied from rejected (terminal)", () => {
    const state = makeState({ current_state: "rejected" });
    const event = makeEvent("scope.deferred", { reason: "r", resume_condition: "c" });
    expect(validateEvent(state, event).allowed).toBe(false);
  });

  it("scope.deferred denied from closed (terminal)", () => {
    const state = makeState({ current_state: "closed" });
    const event = makeEvent("scope.deferred", { reason: "r", resume_condition: "c" });
    expect(validateEvent(state, event).allowed).toBe(false);
  });
});
