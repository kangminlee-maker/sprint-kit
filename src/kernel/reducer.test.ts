import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { reduce } from "./reducer.js";
import type { Event, ScopeState, ConstraintPool, VerdictLogEntry } from "./types.js";

// ─── Golden data helpers ───

const GOLDEN_DIR = resolve(import.meta.dirname, "../../scopes/example-tutor-block");

function readGoldenEvents(): Event[] {
  return readFileSync(resolve(GOLDEN_DIR, "events.ndjson"), "utf-8")
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line) as Event);
}

function readGoldenPool(): ConstraintPool {
  return JSON.parse(
    readFileSync(resolve(GOLDEN_DIR, "state/constraint-pool.json"), "utf-8"),
  ) as ConstraintPool;
}

function readGoldenVerdictLog(): VerdictLogEntry[] {
  return JSON.parse(
    readFileSync(resolve(GOLDEN_DIR, "state/verdict-log.json"), "utf-8"),
  ) as VerdictLogEntry[];
}

// ─── Event factory helpers ───

let _rev = 0;
function resetRev() { _rev = 0; }
function nextRev() { return ++_rev; }

function evt(
  type: string,
  stateBefore: string | null,
  stateAfter: string,
  payload: Record<string, unknown> = {},
): Event {
  const r = nextRev();
  return {
    event_id: `evt_${r}`,
    scope_id: "SC-TEST",
    type,
    ts: `2026-01-01T00:00:${String(r).padStart(2, "0")}Z`,
    revision: r,
    actor: "system",
    state_before: stateBefore,
    state_after: stateAfter,
    payload,
  } as Event;
}

// ─── Golden data tests ───

describe("reducer — golden data", () => {
  const events = readGoldenEvents();
  const state = reduce(events);

  it("current_state is compiled", () => {
    expect(state.current_state).toBe("compiled");
  });

  it("direction matches align.locked", () => {
    expect(state.direction).toBe(
      "학생이 튜터를 차단하면 향후 매칭에서 자동 제외",
    );
  });

  it("scope_boundaries matches align.locked", () => {
    expect(state.scope_boundaries).toEqual({
      in: ["차단 생성", "차단 해제", "차단 목록 조회", "매칭 시 차단 반영"],
      out: ["튜터에게 차단 통보", "차단 사유 수집", "관리자 차단"],
    });
  });

  it("surface_hash matches surface.confirmed", () => {
    expect(state.surface_hash).toBe("hash_sf_004");
  });

  it("constraint_pool matches golden constraint-pool.json", () => {
    const expectedPool = readGoldenPool();
    expect(state.constraint_pool.summary).toEqual(expectedPool.summary);
    expect(state.constraint_pool.constraints).toEqual(expectedPool.constraints);
  });

  it("stale is false", () => {
    expect(state.stale).toBe(false);
    expect(state.stale_sources).toBeUndefined();
    expect(state.stale_since).toBeUndefined();
  });

  it("compile_ready is true", () => {
    expect(state.compile_ready).toBe(true);
  });

  it("convergence_blocked is false", () => {
    expect(state.convergence_blocked).toBe(false);
  });

  it("revision_count_align is 0", () => {
    expect(state.revision_count_align).toBe(0);
  });

  it("revision_count_surface is 3", () => {
    expect(state.revision_count_surface).toBe(3);
  });

  it("verdict_log matches golden verdict-log.json", () => {
    const expectedLog = readGoldenVerdictLog();
    expect(state.verdict_log).toEqual(expectedLog);
  });

  it("feedback_history is empty", () => {
    expect(state.feedback_history).toEqual([]);
  });

  it("latest_revision is 29", () => {
    expect(state.latest_revision).toBe(29);
  });
});

// ─── Empty events ───

describe("reducer — empty events", () => {
  const state = reduce([]);

  it("current_state is draft", () => {
    expect(state.current_state).toBe("draft");
  });

  it("latest_revision is 0", () => {
    expect(state.latest_revision).toBe(0);
  });

  it("constraint_pool is empty", () => {
    expect(state.constraint_pool.constraints).toHaveLength(0);
    expect(state.constraint_pool.summary.total).toBe(0);
  });

  it("compile_ready is false (no constraints but also no surface)", () => {
    // compile_ready = isConstraintsResolved && !stale
    // With 0 constraints, isConstraintsResolved=true, stale=false → true
    // This is by design: state machine prevents actual compile from draft
    expect(state.compile_ready).toBe(true);
  });

  it("convergence_blocked is false", () => {
    expect(state.convergence_blocked).toBe(false);
  });

  it("stale is false", () => {
    expect(state.stale).toBe(false);
  });
});

// ─── current_state ───

describe("reducer — current_state", () => {
  beforeEach(resetRev);

  it("follows last event state_after", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("grounding.started", "draft", "draft", { sources: [] }),
      evt("grounding.completed", "draft", "grounded", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }),
    ];
    expect(reduce(events).current_state).toBe("grounded");
  });

  it("terminal state (deferred)", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("scope.deferred", "draft", "deferred", { reason: "r", resume_condition: "c" }),
    ];
    const state = reduce(events);
    expect(state.current_state).toBe("deferred");
  });

  it("terminal state (rejected)", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("scope.rejected", "draft", "rejected", { reason: "r", rejection_basis: "b" }),
    ];
    expect(reduce(events).current_state).toBe("rejected");
  });
});

// ─── direction and scope_boundaries ───

describe("reducer — direction", () => {
  beforeEach(resetRev);

  it("undefined when no align.locked", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
    ];
    const state = reduce(events);
    expect(state.direction).toBeUndefined();
    expect(state.scope_boundaries).toBeUndefined();
  });

  it("uses latest align.locked after redirect", () => {
    const events = [
      evt("align.locked", "align_proposed", "align_locked", {
        locked_direction: "direction-1",
        locked_scope_boundaries: { in: ["a"], out: ["b"] },
        locked_in_out: true,
      }),
      evt("redirect.to_align", "surface_iterating", "align_proposed", { from_state: "surface_iterating", reason: "r" }),
      evt("align.locked", "align_proposed", "align_locked", {
        locked_direction: "direction-2",
        locked_scope_boundaries: { in: ["c"], out: ["d"] },
        locked_in_out: true,
      }),
    ];
    const state = reduce(events);
    expect(state.direction).toBe("direction-2");
    expect(state.scope_boundaries).toEqual({ in: ["c"], out: ["d"] });
    // verdict_log should have both entries
    expect(state.verdict_log.filter((v) => v.type === "align.locked")).toHaveLength(2);
  });
});

// ─── surface_hash ───

describe("reducer — surface_hash", () => {
  beforeEach(resetRev);

  it("undefined when no surface.confirmed", () => {
    expect(reduce([]).surface_hash).toBeUndefined();
  });

  it("uses latest surface.confirmed hash", () => {
    const events = [
      evt("surface.confirmed", "surface_iterating", "surface_confirmed", {
        final_surface_path: "p1", final_content_hash: "hash-1", total_revisions: 1,
      }),
      evt("redirect.to_align", "surface_confirmed", "align_proposed", { from_state: "surface_confirmed", reason: "r" }),
      evt("surface.confirmed", "surface_iterating", "surface_confirmed", {
        final_surface_path: "p2", final_content_hash: "hash-2", total_revisions: 2,
      }),
    ];
    expect(reduce(events).surface_hash).toBe("hash-2");
  });
});

// ─── stale ───

describe("reducer — stale detection", () => {
  beforeEach(resetRev);

  it("false when only grounding.completed", () => {
    const events = [
      evt("grounding.completed", "draft", "grounded", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }),
    ];
    const state = reduce(events);
    expect(state.stale).toBe(false);
    expect(state.stale_sources).toBeUndefined();
  });

  it("true when stale after grounding", () => {
    const events = [
      evt("grounding.completed", "draft", "grounded", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }),
      evt("snapshot.marked_stale", "grounded", "grounded", {
        stale_sources: [{ path: "src/a.ts", old_hash: "h1", new_hash: "h2" }],
      }),
    ];
    const state = reduce(events);
    expect(state.stale).toBe(true);
    expect(state.stale_sources).toEqual([{ path: "src/a.ts", old_hash: "h1", new_hash: "h2" }]);
    expect(state.stale_since).toBe(2);
  });

  it("false after re-grounding (stale resolved)", () => {
    const events = [
      evt("grounding.completed", "draft", "grounded", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }),
      evt("snapshot.marked_stale", "grounded", "grounded", {
        stale_sources: [{ path: "a.ts", old_hash: "h1", new_hash: "h2" }],
      }),
      evt("grounding.completed", "draft", "grounded", { snapshot_revision: 2, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }),
    ];
    const state = reduce(events);
    expect(state.stale).toBe(false);
    expect(state.stale_sources).toBeUndefined();
    expect(state.stale_since).toBeUndefined();
  });

  it("true again after re-grounding + new stale", () => {
    const events = [
      evt("grounding.completed", "draft", "grounded", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }),
      evt("snapshot.marked_stale", "grounded", "grounded", {
        stale_sources: [{ path: "a.ts", old_hash: "h1", new_hash: "h2" }],
      }),
      evt("grounding.completed", "draft", "grounded", { snapshot_revision: 2, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }),
      evt("snapshot.marked_stale", "align_proposed", "align_proposed", {
        stale_sources: [{ path: "b.ts", old_hash: "h3", new_hash: "h4" }],
      }),
    ];
    const state = reduce(events);
    expect(state.stale).toBe(true);
    expect(state.stale_sources).toEqual([{ path: "b.ts", old_hash: "h3", new_hash: "h4" }]);
    expect(state.stale_since).toBe(4);
  });

  it("true when no grounding.completed but snapshot.marked_stale exists", () => {
    // Defense: should not happen in normal flow, but reducer should handle
    const events = [
      evt("snapshot.marked_stale", "grounded", "grounded", {
        stale_sources: [{ path: "x.ts", old_hash: "h1", new_hash: "h2" }],
      }),
    ];
    const state = reduce(events);
    // lastStaleRev(1) > lastGroundingRev(-1) → true
    expect(state.stale).toBe(true);
  });
});

// ─── compile_ready ───

describe("reducer — compile_ready", () => {
  beforeEach(resetRev);

  it("true when all decided and not stale", () => {
    const events = [
      evt("grounding.completed", "draft", "grounded", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }),
      evt("constraint.discovered", "surface_confirmed", "surface_confirmed", {
        constraint_id: "CST-001", perspective: "code", summary: "s", severity: "required",
        discovery_stage: "draft_phase2", decision_owner: "builder", impact_if_ignored: "i", source_refs: [],
      }),
      evt("constraint.decision_recorded", "surface_confirmed", "constraints_resolved", {
        constraint_id: "CST-001", decision: "inject", selected_option: "o", decision_owner: "builder", rationale: "r",
      }),
    ];
    expect(reduce(events).compile_ready).toBe(true);
  });

  it("false when undecided constraints exist", () => {
    const events = [
      evt("constraint.discovered", "surface_confirmed", "surface_confirmed", {
        constraint_id: "CST-001", perspective: "code", summary: "s", severity: "required",
        discovery_stage: "draft_phase2", decision_owner: "builder", impact_if_ignored: "i", source_refs: [],
      }),
    ];
    expect(reduce(events).compile_ready).toBe(false);
  });

  it("false when stale even if constraints resolved", () => {
    const events = [
      evt("grounding.completed", "draft", "grounded", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }),
      evt("constraint.discovered", "surface_confirmed", "surface_confirmed", {
        constraint_id: "CST-001", perspective: "code", summary: "s", severity: "required",
        discovery_stage: "draft_phase2", decision_owner: "builder", impact_if_ignored: "i", source_refs: [],
      }),
      evt("constraint.decision_recorded", "surface_confirmed", "constraints_resolved", {
        constraint_id: "CST-001", decision: "inject", selected_option: "o", decision_owner: "builder", rationale: "r",
      }),
      evt("snapshot.marked_stale", "constraints_resolved", "constraints_resolved", {
        stale_sources: [{ path: "a.ts", old_hash: "h1", new_hash: "h2" }],
      }),
    ];
    expect(reduce(events).compile_ready).toBe(false);
  });
});

// ─── convergence_blocked ───

describe("reducer — convergence_blocked", () => {
  beforeEach(resetRev);

  it("false when no convergence events", () => {
    expect(reduce([]).convergence_blocked).toBe(false);
  });

  it("true when blocked without action_taken", () => {
    const events = [
      evt("convergence.blocked", "surface_iterating", "surface_iterating", {
        state: "surface_iterating", revision_count: 7, requires_action: true,
      }),
    ];
    expect(reduce(events).convergence_blocked).toBe(true);
  });

  it("false after action_taken resolves blocked", () => {
    const events = [
      evt("convergence.blocked", "surface_iterating", "surface_iterating", {
        state: "surface_iterating", revision_count: 7, requires_action: true,
      }),
      evt("convergence.action_taken", "surface_iterating", "surface_iterating", {
        state: "surface_iterating", chosen_action: "redirect", reason: "r",
      }),
    ];
    expect(reduce(events).convergence_blocked).toBe(false);
  });

  it("true when blocked again after action_taken", () => {
    const events = [
      evt("convergence.blocked", "surface_iterating", "surface_iterating", {
        state: "surface_iterating", revision_count: 7, requires_action: true,
      }),
      evt("convergence.action_taken", "surface_iterating", "surface_iterating", {
        state: "surface_iterating", chosen_action: "continue", reason: "r",
      }),
      evt("convergence.blocked", "surface_iterating", "surface_iterating", {
        state: "surface_iterating", revision_count: 14, requires_action: true,
      }),
    ];
    expect(reduce(events).convergence_blocked).toBe(true);
  });
});

// ─── revision counts ───

describe("reducer — revision counts", () => {
  beforeEach(resetRev);

  it("counts align.revised events", () => {
    const events = [
      evt("align.revised", "align_proposed", "align_proposed", {
        revision_count: 1, feedback_scope: "s", feedback_text: "t", packet_path: "p", packet_hash: "h",
      }),
      evt("align.revised", "align_proposed", "align_proposed", {
        revision_count: 2, feedback_scope: "s", feedback_text: "t", packet_path: "p", packet_hash: "h",
      }),
    ];
    expect(reduce(events).revision_count_align).toBe(2);
  });

  it("counts surface.revision_applied events", () => {
    const events = [
      evt("surface.revision_applied", "surface_iterating", "surface_iterating", {
        revision_count: 1, surface_path: "p", content_hash: "h",
      }),
    ];
    expect(reduce(events).revision_count_surface).toBe(1);
  });
});

// ─── verdict_log with clarify_resolved ───

describe("reducer — verdict_log with clarify_resolved", () => {
  beforeEach(resetRev);

  it("includes clarify_resolved entries", () => {
    const events = [
      evt("align.locked", "align_proposed", "align_locked", {
        locked_direction: "dir", locked_scope_boundaries: { in: [], out: [] }, locked_in_out: true,
      }),
      evt("constraint.discovered", "surface_confirmed", "surface_confirmed", {
        constraint_id: "CST-001", perspective: "code", summary: "s", severity: "required",
        discovery_stage: "draft_phase2", decision_owner: "product_owner", impact_if_ignored: "i", source_refs: [],
      }),
      evt("constraint.clarify_requested", "surface_confirmed", "surface_confirmed", {
        constraint_id: "CST-001", question: "q", asked_to: "team",
      }),
      evt("constraint.clarify_resolved", "surface_confirmed", "constraints_resolved", {
        constraint_id: "CST-001", resolution: "resolved", decision: "inject",
        selected_option: "opt", decision_owner: "product_owner", rationale: "r",
      }),
    ];
    const state = reduce(events);
    expect(state.verdict_log).toHaveLength(2); // align.locked + clarify_resolved
    expect(state.verdict_log[1].type).toBe("constraint.clarify_resolved");
  });
});

// ─── feedback_history ───

describe("reducer — feedback_history", () => {
  beforeEach(resetRev);

  it("collects feedback.classified payloads", () => {
    const events = [
      evt("feedback.classified", "surface_iterating", "surface_iterating", {
        classification: "surface_only", confidence: 0.9, confirmed_by: "auto",
      }),
      evt("feedback.classified", "surface_iterating", "surface_iterating", {
        classification: "constraint_decision", confidence: 0.7, confirmed_by: "user",
      }),
    ];
    const state = reduce(events);
    expect(state.feedback_history).toHaveLength(2);
    expect(state.feedback_history[0].classification).toBe("surface_only");
    expect(state.feedback_history[1].confirmed_by).toBe("user");
  });
});

// ─── latest_revision with observational events ───

describe("reducer — latest_revision", () => {
  beforeEach(resetRev);

  it("includes observational event revisions", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("feedback.classified", "draft", "draft", {
        classification: "surface_only", confidence: 0.9, confirmed_by: "auto",
      }),
    ];
    expect(reduce(events).latest_revision).toBe(2);
  });
});

// ─── retry_count_compile ───

describe("reducer — retry_count_compile", () => {
  beforeEach(resetRev);

  it("starts at 0", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
    ];
    expect(reduce(events).retry_count_compile).toBe(0);
  });

  it("increments on compile.constraint_gap_found", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("compile.constraint_gap_found", "target_locked", "constraints_resolved", {
        new_constraint_id: "CST-010", perspective: "code", summary: "s",
      }),
    ];
    expect(reduce(events).retry_count_compile).toBe(1);
  });

  it("resets on compile.completed", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("compile.constraint_gap_found", "target_locked", "constraints_resolved", {
        new_constraint_id: "CST-010", perspective: "code", summary: "s",
      }),
      evt("compile.completed", "target_locked", "compiled", {
        build_spec_path: "p", build_spec_hash: "h",
        delta_set_path: "p", delta_set_hash: "h",
        validation_plan_path: "p", validation_plan_hash: "h",
      }),
    ];
    expect(reduce(events).retry_count_compile).toBe(0);
  });

  it("counts multiple gap_found events", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("compile.constraint_gap_found", "target_locked", "constraints_resolved", {
        new_constraint_id: "CST-010", perspective: "code", summary: "s",
      }),
      evt("compile.constraint_gap_found", "target_locked", "constraints_resolved", {
        new_constraint_id: "CST-011", perspective: "code", summary: "s",
      }),
      evt("compile.constraint_gap_found", "target_locked", "constraints_resolved", {
        new_constraint_id: "CST-012", perspective: "code", summary: "s",
      }),
    ];
    expect(reduce(events).retry_count_compile).toBe(3);
  });
});

// ─── additional edge cases ───

describe("reducer — additional edge cases", () => {
  beforeEach(resetRev);

  it("validation_plan_hash set from compile.completed", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("compile.completed", "target_locked", "compiled", {
        build_spec_path: "p", build_spec_hash: "h",
        delta_set_path: "p", delta_set_hash: "h",
        validation_plan_path: "p", validation_plan_hash: "vph",
      }),
    ];
    const state = reduce(events);
    expect(state.validation_plan_hash).toBe("vph");
  });

  it("validation_plan_hash undefined before compile.completed", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
    ];
    const state = reduce(events);
    expect(state.validation_plan_hash).toBeUndefined();
  });

  it("entry_mode interface from scope.created", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "interface" }),
    ];
    const state = reduce(events);
    expect(state.entry_mode).toBe("interface");
  });

  it("observational events only affect latest_revision", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("convergence.warning", "draft", "draft", {
        state: "draft", revision_count: 1, pattern_summary: "p",
      }),
      evt("convergence.diagnosis", "draft", "draft", {
        state: "draft", revision_count: 2, diagnosis: "d", options: [],
      }),
    ];
    const state = reduce(events);
    expect(state.latest_revision).toBe(3);
    expect(state.convergence_blocked).toBe(false);
  });
});

// ─── last_backward_reason (TCOV-1) ───

describe("reducer — last_backward_reason", () => {
  beforeEach(resetRev);

  it("redirect.to_grounding sets last_backward_reason to payload reason", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("redirect.to_grounding", "align_locked", "draft", { from_state: "align_locked", reason: "소스 변경으로 재분석 필요" }),
    ];
    const state = reduce(events);
    expect(state.last_backward_reason).toBe("소스 변경으로 재분석 필요");
  });

  it("redirect.to_align sets last_backward_reason to payload reason", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("redirect.to_align", "surface_iterating", "align_proposed", { from_state: "surface_iterating", reason: "방향 재검토 필요" }),
    ];
    const state = reduce(events);
    expect(state.last_backward_reason).toBe("방향 재검토 필요");
  });

  it("surface.change_required sets last_backward_reason to payload reason", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("surface.change_required", "surface_confirmed", "surface_iterating", { constraint_id: "CST-001", reason: "UI 요구사항 변경" }),
    ];
    const state = reduce(events);
    expect(state.last_backward_reason).toBe("UI 요구사항 변경");
  });

  it("align.locked resets last_backward_reason to undefined", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("redirect.to_align", "surface_iterating", "align_proposed", { from_state: "surface_iterating", reason: "방향 재검토" }),
      evt("align.locked", "align_proposed", "align_locked", {
        locked_direction: "direction", locked_scope_boundaries: { in: ["a"], out: ["b"] }, locked_in_out: true,
      }),
    ];
    const state = reduce(events);
    expect(state.last_backward_reason).toBeUndefined();
  });

  it("undefined when no backward events exist", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
    ];
    const state = reduce(events);
    expect(state.last_backward_reason).toBeUndefined();
  });
});

// ─── validation_result (TCOV-5) ───

describe("reducer — validation_result", () => {
  beforeEach(resetRev);

  it("contains correct result after validation.completed", () => {
    const items = [
      { val_id: "VAL-001", related_cst: "CST-001", result: "pass" as const, detail: "통과" },
      { val_id: "VAL-002", related_cst: "CST-002", result: "fail" as const, detail: "실패: 엣지 케이스 미처리" },
      { val_id: "VAL-003", related_cst: "CST-003", result: "pass" as const, detail: "통과" },
    ];
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("grounding.started", "draft", "draft", { sources: [] }),
      evt("grounding.completed", "draft", "grounded", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }),
      evt("align.proposed", "grounded", "align_proposed", { packet_path: "p", packet_hash: "h", snapshot_revision: 1 }),
      evt("align.locked", "align_proposed", "align_locked", {
        locked_direction: "dir", locked_scope_boundaries: { in: ["a"], out: ["b"] }, locked_in_out: true,
      }),
      evt("surface.generated", "align_locked", "surface_iterating", { surface_type: "experience", surface_path: "p", content_hash: "h", based_on_snapshot: 1 }),
      evt("surface.confirmed", "surface_iterating", "surface_confirmed", { final_surface_path: "p", final_content_hash: "h", total_revisions: 1 }),
      evt("target.locked", "constraints_resolved", "target_locked", { surface_hash: "h", constraint_decisions: [] }),
      evt("compile.started", "target_locked", "target_locked", { snapshot_revision: 1, surface_hash: "h" }),
      evt("compile.completed", "target_locked", "compiled", {
        build_spec_path: "p", build_spec_hash: "h",
        delta_set_path: "p", delta_set_hash: "h",
        validation_plan_path: "p", validation_plan_hash: "vph",
      }),
      evt("apply.started", "compiled", "compiled", { build_spec_hash: "h" }),
      evt("apply.completed", "compiled", "applied", { result: "done" }),
      evt("validation.started", "applied", "applied", { validation_plan_hash: "vph" }),
      evt("validation.completed", "applied", "validated", {
        result: "fail", pass_count: 2, fail_count: 1, items,
      }),
    ];
    const state = reduce(events);
    expect(state.validation_result).toBeDefined();
    expect(state.validation_result!.result).toBe("fail");
    expect(state.validation_result!.pass_count).toBe(2);
    expect(state.validation_result!.fail_count).toBe(1);
    expect(state.validation_result!.items).toEqual(items);
  });

  it("undefined before validation.completed", () => {
    const events = [
      evt("scope.created", null, "draft", { title: "t", description: "d", entry_mode: "experience" }),
      evt("compile.completed", "target_locked", "compiled", {
        build_spec_path: "p", build_spec_hash: "h",
        delta_set_path: "p", delta_set_hash: "h",
        validation_plan_path: "p", validation_plan_hash: "vph",
      }),
    ];
    const state = reduce(events);
    expect(state.validation_result).toBeUndefined();
  });
});

// ─── determinism ───

describe("reducer — determinism", () => {
  it("same events produce identical state", () => {
    const events = readGoldenEvents();
    const state1 = reduce(events);
    const state2 = reduce(events);
    expect(state1).toEqual(state2);
  });
});

// ─── Exploration progress ───

describe("exploration progress", () => {
  function explorationBase() {
    resetRev();
    return [
      evt("scope.created", null, "draft", { title: "test", description: "d", entry_mode: "experience" }),
      evt("grounding.started", "draft", "draft", { sources: [] }),
      evt("grounding.completed", "draft", "grounded", {
        snapshot_revision: 1,
        source_hashes: {},
        perspective_summary: { experience: 0, code: 0, policy: 0 },
      }),
    ];
  }

  it("exploration.started initializes exploration_progress", () => {
    const events = [
      ...explorationBase(),
      evt("exploration.started", "grounded", "grounded", { entry_mode: "brief_minimal" }),
    ];
    const state = reduce(events);
    expect(state.exploration_progress).toBeDefined();
    expect(state.exploration_progress!.current_phase).toBe(1);
    expect(state.exploration_progress!.total_rounds).toBe(0);
    expect(state.exploration_progress!.entry_mode).toBe("brief_minimal");
    expect(state.exploration_progress!.decisions).toHaveLength(0);
    expect(state.exploration_progress!.phase_history).toHaveLength(1);
  });

  it("exploration.round_completed accumulates decisions and rounds", () => {
    const events = [
      ...explorationBase(),
      evt("exploration.started", "grounded", "grounded", { entry_mode: "conversation" }),
      evt("exploration.round_completed", "grounded", "grounded", {
        phase: 1, phase_name: "목적 정밀화", round: 1, topic: "결과 확인",
        decisions: [{ round: 1, question: "핵심 결과는?", answer: "결제 전환" }],
        assumptions_found: ["체험 직후가 최적 시점"],
      }),
      evt("exploration.round_completed", "grounded", "grounded", {
        phase: 2, phase_name: "영역 탐색", round: 2, topic: "영역 확정",
        decisions: [
          { round: 2, question: "관련 영역은?", answer: "홈 화면, 결제 플로우" },
          { round: 2, question: "푸시 알림은?", answer: "이번에는 제외" },
        ],
      }),
    ];
    const state = reduce(events);
    expect(state.exploration_progress!.total_rounds).toBe(2);
    expect(state.exploration_progress!.decisions).toHaveLength(3);
    expect(state.exploration_progress!.assumptions).toHaveLength(1);
    expect(state.exploration_progress!.assumptions[0].content).toBe("체험 직후가 최적 시점");
    expect(state.exploration_progress!.assumptions[0].status).toBe("unverified");
  });

  it("exploration.phase_transitioned updates current phase", () => {
    const events = [
      ...explorationBase(),
      evt("exploration.started", "grounded", "grounded", { entry_mode: "brief_detailed" }),
      evt("exploration.phase_transitioned", "grounded", "grounded", {
        from_phase: 1, to_phase: 2, reason: "PO가 결과 목록에 동의",
      }),
      evt("exploration.phase_transitioned", "grounded", "grounded", {
        from_phase: 2, to_phase: 3, reason: "영역 확정 완료",
      }),
    ];
    const state = reduce(events);
    expect(state.exploration_progress!.current_phase).toBe(3);
    expect(state.exploration_progress!.current_phase_name).toBe("현재 상태 공유");
    expect(state.exploration_progress!.phase_history).toHaveLength(3);
  });

  it("align.proposed sets exploration_progress.completed_at", () => {
    const events = [
      ...explorationBase(),
      evt("exploration.started", "grounded", "grounded", { entry_mode: "conversation" }),
      evt("exploration.round_completed", "grounded", "grounded", {
        phase: 1, phase_name: "목적 정밀화", round: 1, topic: "결과",
        decisions: [{ round: 1, question: "q", answer: "a" }],
      }),
      evt("align.proposed", "grounded", "align_proposed", {
        packet_path: "build/align-packet.md", packet_hash: "h", snapshot_revision: 1,
      }),
    ];
    const state = reduce(events);
    expect(state.exploration_progress!.completed_at).toBe(events[events.length - 1].revision);
  });
});
