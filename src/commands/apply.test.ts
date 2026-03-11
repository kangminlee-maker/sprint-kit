import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { executeApply } from "./apply.js";
import { createScope } from "../kernel/scope-manager.js";
import { appendScopeEvent } from "../kernel/event-pipeline.js";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";

let tmpDir: string;

beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), "sprint-apply-")); });
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

/** Set up scope through compiled state */
function setupCompiled() {
  writeFileSync(join(tmpDir, ".sprint-kit.yaml"), "apply_enabled: true\ndefault_sources: []\n", "utf-8");
  const paths = createScope(tmpDir, "SC-APPLY-001");
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
  return paths;
}

/** Set up scope through applied state */
function setupApplied() {
  const paths = setupCompiled();
  appendScopeEvent(paths, { type: "apply.started", actor: "agent", payload: { build_spec_hash: "bs1" } }, { apply_enabled: true });
  appendScopeEvent(paths, { type: "apply.completed", actor: "agent", payload: { result: "success" } });
  return paths;
}

describe("executeApply", () => {
  it("start_apply → compiled (self transition)", () => {
    const paths = setupCompiled();
    const result = executeApply(paths, { type: "start_apply", buildSpecHash: "bs1" }, { projectRoot: tmpDir });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("compiled");

    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("compiled");
  });

  it("complete_apply → applied", () => {
    const paths = setupCompiled();
    executeApply(paths, { type: "start_apply", buildSpecHash: "bs1" });

    const result = executeApply(paths, { type: "complete_apply", result: "success" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("applied");

    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("applied");
  });

  it("full happy path: start → complete → validate → pass", () => {
    const paths = setupCompiled();

    // start_apply
    const startResult = executeApply(paths, { type: "start_apply", buildSpecHash: "bs1" }, { projectRoot: tmpDir });
    expect(startResult.success).toBe(true);

    // complete_apply
    const completeResult = executeApply(paths, { type: "complete_apply", result: "success" });
    expect(completeResult.success).toBe(true);

    // start_validation
    const valStartResult = executeApply(paths, { type: "start_validation", validationPlanHash: "vp1" });
    expect(valStartResult.success).toBe(true);

    // complete_validation (pass)
    const valCompleteResult = executeApply(paths, {
      type: "complete_validation",
      plan: [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "inject", target: "test.ts", method: "manual", pass_criteria: "works", fail_action: "fix" }],
      results: [{ val_id: "VAL-001", related_cst: "CST-001", result: "pass", detail: "확인 완료" }],
      actualPlanHash: "vp1",
    });
    expect(valCompleteResult.success).toBe(true);
    if (!valCompleteResult.success) return;
    expect(valCompleteResult.nextState).toBe("validated");

    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("validated");
  });

  it("report_gap → constraints_resolved (backward transition)", () => {
    const paths = setupCompiled();
    executeApply(paths, { type: "start_apply", buildSpecHash: "bs1" });

    const result = executeApply(paths, {
      type: "report_gap",
      constraintPayload: {
        constraint_id: "CST-002",
        perspective: "code",
        summary: "edge case 발견",
        severity: "required",
        discovery_stage: "apply",
        decision_owner: "product_owner",
        impact_if_ignored: "data loss",
        source_refs: [{ source: "handler.ts", detail: "line 42" }],
      },
      gapPayload: {
        new_constraint_id: "CST-002",
        description: "미결정 edge case 발견",
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("constraints_resolved");

    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("constraints_resolved");
  });

  it("validation fail → constraints_resolved", () => {
    const paths = setupApplied();

    // start_validation
    executeApply(paths, { type: "start_validation", validationPlanHash: "vp1" });

    // complete_validation (fail)
    const result = executeApply(paths, {
      type: "complete_validation",
      plan: [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "inject", target: "test.ts", method: "manual", pass_criteria: "works", fail_action: "fix" }],
      results: [{ val_id: "VAL-001", related_cst: "CST-001", result: "fail", detail: "구현 누락" }],
      actualPlanHash: "vp1",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("constraints_resolved");
    expect(result.data?.result).toBe("fail");

    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("constraints_resolved");
  });

  it("start_apply fails when not in compiled state", () => {
    const paths = setupApplied(); // already applied
    const result = executeApply(paths, { type: "start_apply", buildSpecHash: "bs1" }, { projectRoot: tmpDir });
    expect(result.success).toBe(false);
  });
});
