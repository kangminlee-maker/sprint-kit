/**
 * /apply command orchestration.
 *
 * State-dependent behavior:
 * - compiled → apply.started (start applying delta-set)
 * - compiled → apply.completed (delta-set applied successfully)
 * - compiled → apply.decision_gap_found (edge case found during apply → constraints_resolved)
 * - applied → validation.started (begin validation)
 * - applied → validation.completed (validate() + record result)
 *
 * Apply and validation are agent-driven.
 * This module provides the event recording orchestration.
 */

import { writeFileSync } from "node:fs";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";
import { appendScopeEvent } from "../kernel/event-pipeline.js";
import { renderScopeMd } from "../renderers/scope-md.js";
import { wrapGateError } from "./error-messages.js";
import { validate, type ValidateInput } from "../validators/validate.js";
import type { ScopePaths } from "../kernel/scope-manager.js";
import { loadProjectConfig } from "../config/project-config.js";
import type {
  ScopeState,
  ConstraintDiscoveredPayload,
  ApplyDecisionGapFoundPayload,
  ValidationItemResult,
  ValidationPlanItem,
} from "../kernel/types.js";

// ─── Input ───

export type ApplyAction =
  | { type: "start_apply"; buildSpecHash: string }
  | { type: "complete_apply"; result: string }
  | {
      type: "report_gap";
      constraintPayload: ConstraintDiscoveredPayload;
      gapPayload: ApplyDecisionGapFoundPayload;
    }
  | { type: "start_validation"; validationPlanHash: string }
  | {
      type: "complete_validation";
      plan: ValidationPlanItem[];
      results: ValidationItemResult[];
      actualPlanHash: string;
    };

// ─── Output ───

export interface ApplyResult {
  success: true;
  nextState: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ApplyFailure {
  success: false;
  reason: string;
}

export type ApplyOutput = ApplyResult | ApplyFailure;

// ─── Main ───

export function executeApply(
  paths: ScopePaths,
  action: ApplyAction,
  options?: { projectRoot?: string },
): ApplyOutput {
  switch (action.type) {
    case "start_apply":
      return handleStartApply(paths, action, options?.projectRoot);
    case "complete_apply":
      return handleCompleteApply(paths, action);
    case "report_gap":
      return handleReportGap(paths, action);
    case "start_validation":
      return handleStartValidation(paths, action);
    case "complete_validation":
      return handleCompleteValidation(paths, action);
  }
}

// ─── Action Handlers ───

// Note: apply.started is a self-transition (compiled → compiled).
// If the process is interrupted before complete_apply, this event can be
// re-recorded on resume without state corruption. Duplicate self-transitions are acceptable.
function handleStartApply(
  paths: ScopePaths,
  action: ApplyAction & { type: "start_apply" },
  projectRoot?: string,
): ApplyOutput {
  const config = projectRoot ? loadProjectConfig(projectRoot) : { default_sources: [] };
  const result = appendScopeEvent(paths, {
    type: "apply.started",
    actor: "agent",
    payload: { build_spec_hash: action.buildSpecHash },
  }, { apply_enabled: config.apply_enabled });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };
  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: result.next_state,
    message: "Apply가 시작되었습니다. delta-set의 변경 사항을 적용하세요.",
  };
}

function handleCompleteApply(
  paths: ScopePaths,
  action: ApplyAction & { type: "complete_apply" },
): ApplyOutput {
  const result = appendScopeEvent(paths, {
    type: "apply.completed",
    actor: "agent",
    payload: { result: action.result },
  });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };
  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: result.next_state,
    message: "구현이 완료되었습니다. validation을 시작하세요.",
  };
}

function handleReportGap(
  paths: ScopePaths,
  action: ApplyAction & { type: "report_gap" },
): ApplyOutput {
  // 1. constraint.discovered 먼저 기록 (참조 무결성)
  const discoverResult = appendScopeEvent(paths, {
    type: "constraint.discovered",
    actor: "system",
    payload: action.constraintPayload,
  });

  if (!discoverResult.success) return { success: false, reason: wrapGateError(discoverResult.reason) };

  // 2. apply.decision_gap_found 기록 → constraints_resolved로 역전이
  const gapResult = appendScopeEvent(paths, {
    type: "apply.decision_gap_found",
    actor: "agent",
    payload: action.gapPayload,
  });

  if (!gapResult.success) return { success: false, reason: wrapGateError(gapResult.reason) };
  writeScopeMd(paths, gapResult.state);

  return {
    success: true,
    nextState: gapResult.next_state,
    message: `Gap이 발견되었습니다 (${action.gapPayload.new_constraint_id}). Draft에서 재결정 후 재compile이 필요합니다.`,
  };
}

// Note: validation.started is a self-transition (applied → applied).
// Same resilience pattern as apply.started above.
function handleStartValidation(
  paths: ScopePaths,
  action: ApplyAction & { type: "start_validation" },
): ApplyOutput {
  const result = appendScopeEvent(paths, {
    type: "validation.started",
    actor: "agent",
    payload: { validation_plan_hash: action.validationPlanHash },
  });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };
  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: result.next_state,
    message: "Validation이 시작되었습니다. 각 VAL 항목을 검증하세요.",
  };
}

function handleCompleteValidation(
  paths: ScopePaths,
  action: ApplyAction & { type: "complete_validation" },
): ApplyOutput {
  // 1. validate() 순수 함수 호출
  const state = reduce(readEvents(paths.events));
  const validateOutput = validate({
    state,
    plan: action.plan,
    results: action.results,
    actualPlanHash: action.actualPlanHash,
  });

  if (!validateOutput.success) {
    return { success: false, reason: wrapGateError(validateOutput.reason) };
  }

  // 2. validation.completed 이벤트 기록
  const result = appendScopeEvent(paths, {
    type: "validation.completed",
    actor: "agent",
    payload: {
      result: validateOutput.result,
      pass_count: validateOutput.pass_count,
      fail_count: validateOutput.fail_count,
      items: validateOutput.items,
    },
  });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };
  writeScopeMd(paths, result.state);

  if (validateOutput.result === "pass") {
    return {
      success: true,
      nextState: result.next_state,
      message: "모든 검증이 통과했습니다. 결과를 확인하시고, 종료하려면 '완료'라고 말씀해 주세요.",
      data: {
        result: validateOutput.result,
        pass_count: validateOutput.pass_count,
        fail_count: validateOutput.fail_count,
      },
    };
  }

  return {
    success: true,
    nextState: result.next_state,
    message: `검증 실패: ${validateOutput.fail_count}건. 해당 constraint에 대해 재결정이 필요합니다.`,
    data: {
      result: validateOutput.result,
      pass_count: validateOutput.pass_count,
      fail_count: validateOutput.fail_count,
    },
  };
}

// ─── Helpers ───

function writeScopeMd(paths: ScopePaths, state?: ScopeState): void {
  const s = state ?? reduce(readEvents(paths.events));
  const md = renderScopeMd(s);
  writeFileSync(paths.scopeMd, md, "utf-8");
}
