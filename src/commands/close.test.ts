import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { executeClose, executeDefer } from "./close.js";
import { createScope } from "../kernel/scope-manager.js";
import { appendScopeEvent } from "../kernel/event-pipeline.js";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";

let tmpDir: string;

beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), "sprint-close-")); });
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

/** Set up scope through validated state */
function setupValidated() {
  const paths = createScope(tmpDir, "SC-CLOSE-001");
  appendScopeEvent(paths, { type: "scope.created", actor: "user", payload: { title: "Test", description: "d", entry_mode: "experience" } });
  appendScopeEvent(paths, { type: "grounding.started", actor: "system", payload: { sources: [{ type: "add-dir", path_or_url: "/test" }] } });
  appendScopeEvent(paths, { type: "grounding.completed", actor: "system", payload: { snapshot_revision: 1, source_hashes: { "add-dir:/test": "h1" }, perspective_summary: { experience: 1, code: 1, policy: 1 } } });
  appendScopeEvent(paths, { type: "align.proposed", actor: "system", payload: { packet_path: "build/align-packet.md", packet_hash: "h", snapshot_revision: 1 } });
  appendScopeEvent(paths, { type: "align.locked", actor: "user", payload: { locked_direction: "test", locked_scope_boundaries: { in: ["a"], out: ["b"] }, locked_in_out: true } });
  appendScopeEvent(paths, { type: "surface.generated", actor: "system", payload: { surface_type: "experience", surface_path: "surface/preview/", content_hash: "sf1", based_on_snapshot: 1 } });
  appendScopeEvent(paths, { type: "surface.confirmed", actor: "user", payload: { final_surface_path: "surface/preview/", final_content_hash: "sf1", total_revisions: 0 } });
  appendScopeEvent(paths, { type: "constraint.discovered", actor: "system", payload: { constraint_id: "CST-001", perspective: "code", summary: "test constraint", severity: "required", discovery_stage: "draft_phase2", decision_owner: "product_owner", impact_if_ignored: "fails", source_refs: [{ source: "test.ts", detail: "d" }] } });
  appendScopeEvent(paths, { type: "constraint.decision_recorded", actor: "user", payload: { constraint_id: "CST-001", decision: "inject", selected_option: "fix", decision_owner: "product_owner", rationale: "필수" } });
  appendScopeEvent(paths, { type: "target.locked", actor: "system", payload: { surface_hash: "sf1", constraint_decisions: [{ constraint_id: "CST-001", decision: "inject" }] } });
  appendScopeEvent(paths, { type: "compile.started", actor: "system", payload: { snapshot_revision: 1, surface_hash: "sf1" } });
  appendScopeEvent(paths, { type: "compile.completed", actor: "system", payload: { build_spec_path: "build/build-spec.md", build_spec_hash: "bs1", brownfield_detail_path: "build/brownfield-detail.md", brownfield_detail_hash: "bf1", delta_set_path: "build/delta-set.json", delta_set_hash: "ds1", validation_plan_path: "build/validation-plan.md", validation_plan_hash: "vp1" } });
  appendScopeEvent(paths, { type: "apply.started", actor: "agent", payload: { build_spec_hash: "bs1" } });
  appendScopeEvent(paths, { type: "apply.completed", actor: "agent", payload: { result: "success" } });
  appendScopeEvent(paths, { type: "validation.started", actor: "agent", payload: { validation_plan_hash: "vp1" } });
  appendScopeEvent(paths, { type: "validation.completed", actor: "agent", payload: { result: "pass", pass_count: 1, fail_count: 0, items: [{ val_id: "VAL-001", related_cst: "CST-001", result: "pass", detail: "확인 완료" }] } });
  return paths;
}

describe("executeClose", () => {
  it("validated → closed", () => {
    const paths = setupValidated();
    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("validated");

    const result = executeClose(paths);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("closed");

    const updatedState = reduce(readEvents(paths.events));
    expect(updatedState.current_state).toBe("closed");
  });

  it("generates handoff_prd.json on close", () => {
    const paths = setupValidated();
    const result = executeClose(paths);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.handoff_path).toBe("build/handoff_prd.json");

    const filePath = join(paths.build, "handoff_prd.json");
    expect(existsSync(filePath)).toBe(true);

    const handoff = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(handoff.pm_id).toBe("SC-CLOSE-001");
    expect(handoff.product_name).toBe("Test");
    expect(handoff.goal).toBeTruthy();
    expect(handoff.user_stories).toBeInstanceOf(Array);
    expect(handoff.user_stories.length).toBeGreaterThan(0);
    expect(handoff.user_stories[0]).toHaveProperty("persona");
    expect(handoff.user_stories[0]).toHaveProperty("action");
    expect(handoff.user_stories[0]).toHaveProperty("benefit");
    expect(handoff.constraints).toBeInstanceOf(Array);
    expect(handoff.constraints.length).toBeGreaterThan(0);
    expect(handoff.success_criteria).toBeInstanceOf(Array);
    expect(handoff.success_criteria.length).toBeGreaterThan(0);
    expect(handoff.assumptions).toBeInstanceOf(Array);
    expect(handoff.assumptions.length).toBeGreaterThan(0);
    expect(handoff.decide_later_items).toBeInstanceOf(Array);
    expect(handoff.decide_later_items.length).toBeGreaterThan(0);
    expect(handoff.brownfield_repos).toBeInstanceOf(Array);
    expect(handoff.interview_id).toBeTruthy();
    expect(handoff.created_at).toBeTruthy();
  });

  it("fails when not in validated state (draft)", () => {
    const paths = createScope(tmpDir, "SC-CLOSE-002");
    appendScopeEvent(paths, { type: "scope.created", actor: "user", payload: { title: "T", description: "d", entry_mode: "experience" } });

    const result = executeClose(paths);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.reason).toContain("validated");
  });

  it("fails when in compiled state", () => {
    const paths = createScope(tmpDir, "SC-CLOSE-003");
    appendScopeEvent(paths, { type: "scope.created", actor: "user", payload: { title: "Test", description: "d", entry_mode: "experience" } });
    appendScopeEvent(paths, { type: "grounding.started", actor: "system", payload: { sources: [{ type: "add-dir", path_or_url: "/test" }] } });
    appendScopeEvent(paths, { type: "grounding.completed", actor: "system", payload: { snapshot_revision: 1, source_hashes: { "add-dir:/test": "h1" }, perspective_summary: { experience: 1, code: 1, policy: 1 } } });
    appendScopeEvent(paths, { type: "align.proposed", actor: "system", payload: { packet_path: "build/align-packet.md", packet_hash: "h", snapshot_revision: 1 } });
    appendScopeEvent(paths, { type: "align.locked", actor: "user", payload: { locked_direction: "test", locked_scope_boundaries: { in: ["a"], out: ["b"] }, locked_in_out: true } });
    appendScopeEvent(paths, { type: "surface.generated", actor: "system", payload: { surface_type: "experience", surface_path: "surface/preview/", content_hash: "sf1", based_on_snapshot: 1 } });
    appendScopeEvent(paths, { type: "surface.confirmed", actor: "user", payload: { final_surface_path: "surface/preview/", final_content_hash: "sf1", total_revisions: 0 } });
    appendScopeEvent(paths, { type: "constraint.discovered", actor: "system", payload: { constraint_id: "CST-001", perspective: "code", summary: "c", severity: "required", discovery_stage: "draft_phase2", decision_owner: "product_owner", impact_if_ignored: "f", source_refs: [{ source: "t", detail: "d" }] } });
    appendScopeEvent(paths, { type: "constraint.decision_recorded", actor: "user", payload: { constraint_id: "CST-001", decision: "inject", selected_option: "fix", decision_owner: "product_owner", rationale: "r" } });
    appendScopeEvent(paths, { type: "target.locked", actor: "system", payload: { surface_hash: "sf1", constraint_decisions: [{ constraint_id: "CST-001", decision: "inject" }] } });
    appendScopeEvent(paths, { type: "compile.started", actor: "system", payload: { snapshot_revision: 1, surface_hash: "sf1" } });
    appendScopeEvent(paths, { type: "compile.completed", actor: "system", payload: { build_spec_path: "build/build-spec.md", build_spec_hash: "bs1", brownfield_detail_path: "build/brownfield-detail.md", brownfield_detail_hash: "bf1", delta_set_path: "build/delta-set.json", delta_set_hash: "ds1", validation_plan_path: "build/validation-plan.md", validation_plan_hash: "vp1" } });

    const result = executeClose(paths);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.reason).toContain("validated");
  });

  it("fails when in applied state", () => {
    const paths = createScope(tmpDir, "SC-CLOSE-004");
    appendScopeEvent(paths, { type: "scope.created", actor: "user", payload: { title: "Test", description: "d", entry_mode: "experience" } });
    appendScopeEvent(paths, { type: "grounding.started", actor: "system", payload: { sources: [{ type: "add-dir", path_or_url: "/test" }] } });
    appendScopeEvent(paths, { type: "grounding.completed", actor: "system", payload: { snapshot_revision: 1, source_hashes: { "add-dir:/test": "h1" }, perspective_summary: { experience: 1, code: 1, policy: 1 } } });
    appendScopeEvent(paths, { type: "align.proposed", actor: "system", payload: { packet_path: "build/align-packet.md", packet_hash: "h", snapshot_revision: 1 } });
    appendScopeEvent(paths, { type: "align.locked", actor: "user", payload: { locked_direction: "test", locked_scope_boundaries: { in: ["a"], out: ["b"] }, locked_in_out: true } });
    appendScopeEvent(paths, { type: "surface.generated", actor: "system", payload: { surface_type: "experience", surface_path: "surface/preview/", content_hash: "sf1", based_on_snapshot: 1 } });
    appendScopeEvent(paths, { type: "surface.confirmed", actor: "user", payload: { final_surface_path: "surface/preview/", final_content_hash: "sf1", total_revisions: 0 } });
    appendScopeEvent(paths, { type: "constraint.discovered", actor: "system", payload: { constraint_id: "CST-001", perspective: "code", summary: "c", severity: "required", discovery_stage: "draft_phase2", decision_owner: "product_owner", impact_if_ignored: "f", source_refs: [{ source: "t", detail: "d" }] } });
    appendScopeEvent(paths, { type: "constraint.decision_recorded", actor: "user", payload: { constraint_id: "CST-001", decision: "inject", selected_option: "fix", decision_owner: "product_owner", rationale: "r" } });
    appendScopeEvent(paths, { type: "target.locked", actor: "system", payload: { surface_hash: "sf1", constraint_decisions: [{ constraint_id: "CST-001", decision: "inject" }] } });
    appendScopeEvent(paths, { type: "compile.started", actor: "system", payload: { snapshot_revision: 1, surface_hash: "sf1" } });
    appendScopeEvent(paths, { type: "compile.completed", actor: "system", payload: { build_spec_path: "build/build-spec.md", build_spec_hash: "bs1", brownfield_detail_path: "build/brownfield-detail.md", brownfield_detail_hash: "bf1", delta_set_path: "build/delta-set.json", delta_set_hash: "ds1", validation_plan_path: "build/validation-plan.md", validation_plan_hash: "vp1" } });
    appendScopeEvent(paths, { type: "apply.started", actor: "agent", payload: { build_spec_hash: "bs1" } });
    appendScopeEvent(paths, { type: "apply.completed", actor: "agent", payload: { result: "success" } });

    const result = executeClose(paths);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.reason).toContain("validated");
  });
});

describe("executeDefer", () => {
  it("defers from any non-terminal state", () => {
    const paths = createScope(tmpDir, "SC-DEFER-001");
    appendScopeEvent(paths, { type: "scope.created", actor: "user", payload: { title: "T", description: "d", entry_mode: "experience" } });

    const result = executeDefer(paths, "방향 재정립 필요", "다음 분기 재개");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("deferred");

    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("deferred");
  });

  it("fails from terminal state", () => {
    const paths = setupValidated();
    executeClose(paths); // → closed

    const result = executeDefer(paths, "test", "test");
    expect(result.success).toBe(false);
  });
});
