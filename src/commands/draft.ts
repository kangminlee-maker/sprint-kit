/**
 * /draft command orchestration.
 *
 * State-dependent behavior:
 * - align_locked → generate surface + transition to surface_iterating
 * - surface_iterating → apply feedback or confirm surface
 * - surface_confirmed → deep constraint discovery + Draft Packet rendering
 * - constraints_resolved → lock target
 * - target_locked → compile
 *
 * Surface generation and constraint discovery are agent-driven.
 * This module provides the event recording orchestration.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";
import { appendScopeEvent } from "../kernel/event-pipeline.js";
import { renderScopeMd } from "../renderers/scope-md.js";
import { wrapGateError } from "./error-messages.js";
import { contentHash } from "../kernel/hash.js";
import { compile, type CompileInput, type CompileSuccess } from "../compilers/compile.js";
import type { DefenseViolation } from "../compilers/compile-defense.js";
import type { ScopePaths } from "../kernel/scope-manager.js";
import type { ScopeState, ConstraintDiscoveredPayload, ConstraintDecisionRecordedPayload, FeedbackClassification } from "../kernel/types.js";

// ─── Input ───

export type DraftAction =
  | { type: "generate_surface"; surfacePath: string; surfaceHash: string; snapshotRevision: number }
  | { type: "apply_feedback"; feedbackText: string; surfacePath: string; surfaceHash: string; classification?: FeedbackClassification }
  | { type: "confirm_surface"; surfacePath: string; surfaceHash: string }
  | { type: "surface_change_required"; constraintId: string; reason: string }
  | { type: "record_constraint"; constraintPayload: ConstraintDiscoveredPayload }
  | { type: "record_decision"; decisionPayload: ConstraintDecisionRecordedPayload }
  | { type: "lock_target" }
  | { type: "compile"; compileInput: CompileInput };

export interface DraftInput {
  paths: ScopePaths;
  action: DraftAction;
}

// ─── Output ───

export interface DraftResult {
  success: true;
  nextState: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface DraftFailure {
  success: false;
  reason: string;
  violations?: DefenseViolation[];
}

export type DraftOutput = DraftResult | DraftFailure;

// ─── Main ───

export function executeDraft(input: DraftInput): DraftOutput {
  const { paths, action } = input;
  const events = readEvents(paths.events);
  const state = reduce(events);

  switch (action.type) {
    case "generate_surface":
      return handleGenerateSurface(paths, state, action);
    case "apply_feedback":
      return handleApplyFeedback(paths, state, action);
    case "confirm_surface":
      return handleConfirmSurface(paths, state, action);
    case "surface_change_required":
      return handleSurfaceChangeRequired(paths, action);
    case "record_constraint":
      return handleRecordConstraint(paths, action);
    case "record_decision":
      return handleRecordDecision(paths, action);
    case "lock_target":
      return handleLockTarget(paths, state);
    case "compile":
      return handleCompile(paths, state, action);
  }
}

// ─── Action Handlers ───

function handleGenerateSurface(
  paths: ScopePaths,
  state: ScopeState,
  action: DraftAction & { type: "generate_surface" },
): DraftOutput {
  if (state.current_state !== "align_locked") {
    return { success: false, reason: `Surface 생성은 align_locked 상태에서만 가능합니다. 현재: ${state.current_state}` };
  }

  const result = appendScopeEvent(paths, {
    type: "surface.generated",
    actor: "system",
    payload: {
      surface_type: state.entry_mode,
      surface_path: action.surfacePath,
      content_hash: action.surfaceHash,
      based_on_snapshot: action.snapshotRevision,
    },
  });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };
  writeScopeMd(paths, result.state);

  const guide = state.entry_mode === "experience"
    ? "`cd surface/preview && npm run dev`로 mockup을 확인하세요."
    : "`surface/contract-diff/`의 API 명세를 확인하세요.";

  return {
    success: true,
    nextState: "surface_iterating",
    message: `Surface가 생성되었습니다. ${guide} 수정이 필요하면 피드백을 주세요. 이 모습이 맞으면 '확정합니다'라고 말씀해 주세요.`,
  };
}

function handleApplyFeedback(
  paths: ScopePaths,
  state: ScopeState,
  action: DraftAction & { type: "apply_feedback" },
): DraftOutput {
  const classification: FeedbackClassification = action.classification ?? "surface_only";

  // 1. Record feedback
  const fbResult = appendScopeEvent(paths, {
    type: "surface.revision_requested",
    actor: "user",
    payload: { feedback_text: action.feedbackText },
  });
  if (!fbResult.success) return { success: false, reason: wrapGateError(fbResult.reason) };

  // 2. Record feedback classification
  const classifyResult = appendScopeEvent(paths, {
    type: "feedback.classified",
    actor: "system",
    payload: {
      classification,
      confidence: action.classification ? 1.0 : 0.8,
      confirmed_by: action.classification ? "user" : "auto",
    },
  });
  if (!classifyResult.success) return { success: false, reason: wrapGateError(classifyResult.reason) };

  // 3. direction_change → redirect to align, early return
  if (classification === "direction_change") {
    const redirectResult = appendScopeEvent(paths, {
      type: "redirect.to_align",
      actor: "system",
      payload: {
        from_state: state.current_state,
        reason: "피드백 분류: direction_change — 방향 재검토가 필요합니다.",
      },
    });
    if (!redirectResult.success) return { success: false, reason: wrapGateError(redirectResult.reason) };
    writeScopeMd(paths, redirectResult.state);

    return {
      success: true,
      nextState: "align_proposed",
      message: "방향 변경 피드백이 감지되었습니다. /align으로 방향을 재검토합니다.",
    };
  }

  // 4. Record revision
  const revResult = appendScopeEvent(paths, {
    type: "surface.revision_applied",
    actor: "system",
    payload: {
      revision_count: state.revision_count_surface + 1,
      surface_path: action.surfacePath,
      content_hash: action.surfaceHash,
    },
  });
  if (!revResult.success) return { success: false, reason: wrapGateError(revResult.reason) };

  writeScopeMd(paths, revResult.state);

  // 5. target_change → append scope change notice
  const message = classification === "target_change"
    ? "피드백이 반영되었습니다. 범위가 변경되었습니다. Surface를 다시 확인해 주세요."
    : "피드백이 반영되었습니다. Surface를 다시 확인해 주세요.";

  return {
    success: true,
    nextState: "surface_iterating",
    message,
  };
}

function handleConfirmSurface(
  paths: ScopePaths,
  state: ScopeState,
  action: DraftAction & { type: "confirm_surface" },
): DraftOutput {
  const result = appendScopeEvent(paths, {
    type: "surface.confirmed",
    actor: "user",
    payload: {
      final_surface_path: action.surfacePath,
      final_content_hash: action.surfaceHash,
      total_revisions: state.revision_count_surface,
    },
  });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };
  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: "surface_confirmed",
    message: "Surface가 확정되었습니다. 3개 관점에서 정밀 스캔을 수행합니다.",
  };
}

function handleSurfaceChangeRequired(
  paths: ScopePaths,
  action: DraftAction & { type: "surface_change_required" },
): DraftOutput {
  const result = appendScopeEvent(paths, {
    type: "surface.change_required",
    actor: "system",
    payload: {
      constraint_id: action.constraintId,
      reason: action.reason,
    },
  });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };
  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: "surface_iterating",
    message: `${action.constraintId}: 제약 사항으로 인해 Surface 수정이 필요합니다. Surface를 다시 검토해 주세요.`,
  };
}

function handleRecordConstraint(
  paths: ScopePaths,
  action: DraftAction & { type: "record_constraint" },
): DraftOutput {
  const result = appendScopeEvent(paths, {
    type: "constraint.discovered",
    actor: "system",
    payload: action.constraintPayload,
  });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };
  writeScopeMd(paths, result.state);

  const cstId = action.constraintPayload.constraint_id ?? "?";
  return {
    success: true,
    nextState: "surface_confirmed",
    message: `Constraint ${cstId}이 기록되었습니다.`,
  };
}

function handleRecordDecision(
  paths: ScopePaths,
  action: DraftAction & { type: "record_decision" },
): DraftOutput {
  const result = appendScopeEvent(paths, {
    type: "constraint.decision_recorded",
    actor: "user",
    payload: action.decisionPayload,
  });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };

  const cstId = action.decisionPayload.constraint_id ?? "?";
  const decision = action.decisionPayload.decision ?? "?";

  // modify-direction → automatically redirect to Align
  if (decision === "modify-direction") {
    const redirectResult = appendScopeEvent(paths, {
      type: "redirect.to_align",
      actor: "system",
      payload: {
        from_state: result.next_state,
        reason: `${cstId}: modify-direction 결정으로 방향 재검토 필요`,
      },
    });
    if (!redirectResult.success) return { success: false, reason: wrapGateError(redirectResult.reason) };
    writeScopeMd(paths, redirectResult.state);

    return {
      success: true,
      nextState: "align_proposed",
      message: `${cstId}: modify-direction. 방향을 재검토합니다. /align으로 진행하세요.`,
    };
  }

  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: result.next_state,
    message: `${cstId}: ${decision} 결정이 기록되었습니다.`,
  };
}

function handleLockTarget(paths: ScopePaths, state: ScopeState): DraftOutput {
  // Filter: decided constraints only (matches gate-guard Rule 6 criteria)
  const activeConstraints = state.constraint_pool.constraints
    .filter(c => c.status === "decided")
    .map(c => ({ constraint_id: c.constraint_id, decision: c.decision! }));

  const result = appendScopeEvent(paths, {
    type: "target.locked",
    actor: "system",
    payload: {
      surface_hash: state.surface_hash ?? "",
      constraint_decisions: activeConstraints,
    },
  });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };
  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: "target_locked",
    message: "모든 결정이 완료되었습니다. compile을 시작합니다.",
  };
}

function handleCompile(
  paths: ScopePaths,
  state: ScopeState,
  action: DraftAction & { type: "compile" },
): DraftOutput {
  // Execute compile FIRST (before recording compile.started)
  // This prevents orphaned compile.started events in the event stream on failure.
  const compileResult = compile(action.compileInput);

  if (!compileResult.success) {
    return {
      success: false,
      reason: wrapGateError(`Compile 실패: ${compileResult.reason}`),
      violations: compileResult.violations,
    };
  }

  // Record compile.started (only after successful compile)
  const startResult = appendScopeEvent(paths, {
    type: "compile.started",
    actor: "system",
    payload: {
      snapshot_revision: state.snapshot_revision,
      surface_hash: state.surface_hash ?? "",
    },
  });

  if (!startResult.success) return { success: false, reason: wrapGateError(startResult.reason) };

  const success = compileResult as CompileSuccess;

  // Save artifacts
  writeFileSync(join(paths.build, "build-spec.md"), success.buildSpecMd, "utf-8");
  writeFileSync(join(paths.build, "brownfield-detail.md"), success.brownfieldDetailMd, "utf-8");
  writeFileSync(join(paths.build, "delta-set.json"), success.deltaSetJson, "utf-8");
  writeFileSync(join(paths.build, "validation-plan.md"), success.validationPlanMd, "utf-8");

  // Record compile.completed
  const completeResult = appendScopeEvent(paths, {
    type: "compile.completed",
    actor: "system",
    payload: {
      build_spec_path: "build/build-spec.md",
      build_spec_hash: success.buildSpecHash,
      brownfield_detail_path: "build/brownfield-detail.md",
      brownfield_detail_hash: success.brownfieldDetailHash,
      delta_set_path: "build/delta-set.json",
      delta_set_hash: success.deltaSetHash,
      validation_plan_path: "build/validation-plan.md",
      validation_plan_hash: success.validationPlanHash,
    },
  });

  if (!completeResult.success) return { success: false, reason: wrapGateError(completeResult.reason) };
  writeScopeMd(paths, completeResult.state);

  return {
    success: true,
    nextState: "compiled",
    message: "Build Spec이 생성되었습니다. 구현을 적용하세요.",
    data: {
      buildSpecHash: success.buildSpecHash,
      deltaSetHash: success.deltaSetHash,
      validationPlanHash: success.validationPlanHash,
      warnings: success.warnings,
    },
  };
}

// ─── Helpers ───

function writeScopeMd(paths: ScopePaths, state?: ScopeState): void {
  const s = state ?? reduce(readEvents(paths.events));
  const md = renderScopeMd(s);
  writeFileSync(paths.scopeMd, md, "utf-8");
}
