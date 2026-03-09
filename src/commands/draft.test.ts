import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { executeDraft } from "./draft.js";
import { createScope } from "../kernel/scope-manager.js";
import { appendScopeEvent } from "../kernel/event-pipeline.js";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";

let tmpDir: string;

beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), "sprint-draft-")); });
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

/** Set up scope through align_locked */
function setupAlignLocked() {
  const paths = createScope(tmpDir, "SC-DRAFT-001");
  appendScopeEvent(paths, { type: "scope.created", actor: "user", payload: { title: "Test", description: "d", entry_mode: "experience" } });
  appendScopeEvent(paths, { type: "grounding.started", actor: "system", payload: { sources: [{ type: "add-dir", path_or_url: "/test" }] } });
  appendScopeEvent(paths, { type: "grounding.completed", actor: "system", payload: { snapshot_revision: 1, source_hashes: { "add-dir:/test": "h1" }, perspective_summary: { experience: 1, code: 1, policy: 1 } } });
  appendScopeEvent(paths, { type: "align.proposed", actor: "system", payload: { packet_path: "build/align-packet.md", packet_hash: "h", snapshot_revision: 1 } });
  appendScopeEvent(paths, { type: "align.locked", actor: "user", payload: { locked_direction: "test", locked_scope_boundaries: { in: ["a"], out: ["b"] }, locked_in_out: true } });
  return paths;
}

/** Set up scope through surface_iterating */
function setupSurfaceIterating() {
  const paths = setupAlignLocked();
  appendScopeEvent(paths, { type: "surface.generated", actor: "system", payload: { surface_type: "experience", surface_path: "surface/preview/", content_hash: "sf1", based_on_snapshot: 1 } });
  return paths;
}

describe("executeDraft", () => {
  it("generate_surface: align_locked → surface_iterating", () => {
    const paths = setupAlignLocked();
    const result = executeDraft({
      paths,
      action: { type: "generate_surface", surfacePath: "surface/preview/", surfaceHash: "sf1", snapshotRevision: 1 },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("surface_iterating");

    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("surface_iterating");
  });

  it("apply_feedback: surface_iterating → surface_iterating", () => {
    const paths = setupSurfaceIterating();
    const result = executeDraft({
      paths,
      action: { type: "apply_feedback", feedbackText: "버튼 위치 변경", surfacePath: "surface/preview/", surfaceHash: "sf2" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("surface_iterating");
  });

  it("confirm_surface: surface_iterating → surface_confirmed", () => {
    const paths = setupSurfaceIterating();
    const result = executeDraft({
      paths,
      action: { type: "confirm_surface", surfacePath: "surface/preview/", surfaceHash: "sf_final" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("surface_confirmed");
  });

  it("generate_surface fails when not align_locked", () => {
    const paths = setupSurfaceIterating(); // already surface_iterating
    const result = executeDraft({
      paths,
      action: { type: "generate_surface", surfacePath: "surface/preview/", surfaceHash: "sf", snapshotRevision: 1 },
    });
    expect(result.success).toBe(false);
  });

  it("apply_feedback with classification=surface_only records feedback.classified", () => {
    const paths = setupSurfaceIterating();
    const result = executeDraft({
      paths,
      action: { type: "apply_feedback", feedbackText: "색상 변경", surfacePath: "surface/preview/", surfaceHash: "sf3", classification: "surface_only" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("surface_iterating");

    const events = readEvents(paths.events);
    const classifiedEvents = events.filter(e => e.type === "feedback.classified");
    expect(classifiedEvents.length).toBe(1);
    expect(classifiedEvents[0].payload).toEqual({
      classification: "surface_only",
      confidence: 1.0,
      confirmed_by: "user",
    });

    // revision_applied should also be recorded
    const revisionEvents = events.filter(e => e.type === "surface.revision_applied");
    expect(revisionEvents.length).toBe(1);
  });

  it("apply_feedback with classification=direction_change issues redirect.to_align", () => {
    const paths = setupSurfaceIterating();
    const result = executeDraft({
      paths,
      action: { type: "apply_feedback", feedbackText: "방향을 바꿔야 합니다", surfacePath: "surface/preview/", surfaceHash: "sf4", classification: "direction_change" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("align_proposed");

    const events = readEvents(paths.events);
    const classifiedEvents = events.filter(e => e.type === "feedback.classified");
    expect(classifiedEvents.length).toBe(1);
    expect(classifiedEvents[0].payload).toEqual({
      classification: "direction_change",
      confidence: 1.0,
      confirmed_by: "user",
    });

    const redirectEvents = events.filter(e => e.type === "redirect.to_align");
    expect(redirectEvents.length).toBe(1);

    // revision_applied should NOT be recorded (early return)
    const revisionEvents = events.filter(e => e.type === "surface.revision_applied");
    expect(revisionEvents.length).toBe(0);

    const state = reduce(events);
    expect(state.current_state).toBe("align_proposed");
  });

  it("apply_feedback without classification defaults to surface_only", () => {
    const paths = setupSurfaceIterating();
    const result = executeDraft({
      paths,
      action: { type: "apply_feedback", feedbackText: "간격 조정", surfacePath: "surface/preview/", surfaceHash: "sf5" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("surface_iterating");

    const events = readEvents(paths.events);
    const classifiedEvents = events.filter(e => e.type === "feedback.classified");
    expect(classifiedEvents.length).toBe(1);
    expect(classifiedEvents[0].payload).toEqual({
      classification: "surface_only",
      confidence: 0.8,
      confirmed_by: "auto",
    });
  });

  it("apply_feedback with classification=target_change appends scope change message", () => {
    const paths = setupSurfaceIterating();
    const result = executeDraft({
      paths,
      action: { type: "apply_feedback", feedbackText: "범위 수정", surfacePath: "surface/preview/", surfaceHash: "sf6", classification: "target_change" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("surface_iterating");
    expect(result.message).toContain("범위가 변경되었습니다");
  });

  it("full flow: generate → feedback → confirm → constraint → decision → lock", () => {
    const paths = setupAlignLocked();

    // Generate surface
    executeDraft({ paths, action: { type: "generate_surface", surfacePath: "surface/preview/", surfaceHash: "sf1", snapshotRevision: 1 } });

    // Confirm surface
    executeDraft({ paths, action: { type: "confirm_surface", surfacePath: "surface/preview/", surfaceHash: "sf1" } });

    // Discover constraint
    executeDraft({ paths, action: { type: "record_constraint", constraintPayload: {
      constraint_id: "CST-001", perspective: "code", summary: "test", severity: "required",
      discovery_stage: "draft_phase2", decision_owner: "product_owner",
      impact_if_ignored: "fails", source_refs: [{ source: "test.ts", detail: "d" }],
    } } });

    // Record decision
    executeDraft({ paths, action: { type: "record_decision", decisionPayload: {
      constraint_id: "CST-001", decision: "inject", selected_option: "fix",
      decision_owner: "product_owner", rationale: "필수",
    } } });

    // Lock target
    const lockResult = executeDraft({ paths, action: { type: "lock_target" } });
    expect(lockResult.success).toBe(true);
    if (!lockResult.success) return;
    expect(lockResult.nextState).toBe("target_locked");

    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("target_locked");
  });
});
