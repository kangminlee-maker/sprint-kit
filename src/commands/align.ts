/**
 * /align command orchestration.
 *
 * Processes user verdict on the Align Packet:
 * - approve: lock direction + scope boundaries → align_locked
 * - revise: re-render Align Packet with feedback → stay align_proposed
 * - reject: terminate scope → rejected
 * - redirect: return to grounding → grounded
 *
 * Stale detection and convergence safety are handled here.
 */

import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";
import { appendScopeEvent, type PipelineResult } from "../kernel/event-pipeline.js";
import { renderScopeMd } from "../renderers/scope-md.js";
import { checkStale } from "./stale-check.js";
import { wrapGateError } from "./error-messages.js";
import { CONVERGENCE_THRESHOLDS } from "../kernel/constants.js";
import { writeFileSync } from "node:fs";
import type { ScopePaths } from "../kernel/scope-manager.js";
import type { ScopeState } from "../kernel/types.js";

// ─── Input ───

export type AlignVerdict =
  | { type: "approve"; direction: string; scope_in: string[]; scope_out: string[] }
  | { type: "revise"; feedback: string; feedbackScope: string; updatedPacketHash: string }
  | { type: "reject"; reason: string; basis: string }
  | { type: "redirect"; reason: string };

export interface AlignInput {
  paths: ScopePaths;
  verdict: AlignVerdict;
}

// ─── Output ───

export interface AlignResult {
  success: true;
  nextState: string;
  message: string;
}

export interface AlignFailure {
  success: false;
  reason: string;
}

export type AlignOutput = AlignResult | AlignFailure;

// ─── Main ───

export function executeAlign(input: AlignInput): AlignOutput {
  const { paths, verdict } = input;

  // Step 1: Check current state
  const events = readEvents(paths.events);
  const state = reduce(events);

  if (state.current_state !== "align_proposed") {
    return {
      success: false,
      reason: `현재 상태가 ${state.current_state}입니다. /align은 align_proposed 상태에서만 실행할 수 있습니다.`,
    };
  }

  // Step 2: Stale check (local sources only)
  const staleResult = checkStale(paths);
  if (staleResult.stale) {
    const changedPaths = staleResult.stale_sources.map(s => s.path).join(", ");
    return {
      success: false,
      reason: `소스가 변경되었습니다 (${changedPaths}). /start를 다시 실행하여 재스캔하세요.`,
    };
  }

  // Step 3: Check convergence blocked
  if (state.convergence_blocked) {
    return {
      success: false,
      reason: "수렴 차단 상태입니다. 다음 중 하나를 선택하세요: (1) 방향 변경 (/align redirect) (2) scope 축소 (/align revise) (3) scope 보류 (scope.deferred)",
    };
  }

  // Step 4: Process verdict
  switch (verdict.type) {
    case "approve":
      return handleApprove(paths, state, verdict);
    case "revise":
      return handleRevise(paths, state, verdict);
    case "reject":
      return handleReject(paths, verdict);
    case "redirect":
      return handleRedirect(paths, verdict);
  }
}

// ─── Verdict Handlers ───

function handleApprove(
  paths: ScopePaths,
  state: ScopeState,
  verdict: AlignVerdict & { type: "approve" },
): AlignOutput {
  const result = appendScopeEvent(paths, {
    type: "align.locked",
    actor: "user",
    payload: {
      locked_direction: verdict.direction,
      locked_scope_boundaries: {
        in: verdict.scope_in,
        out: verdict.scope_out,
      },
      locked_in_out: true,
    },
  });

  if (!result.success) {
    return { success: false, reason: wrapGateError(result.reason) };
  }

  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: "align_locked",
    message: "방향과 범위가 확정되었습니다. /draft로 Surface를 생성하세요.",
  };
}

function handleRevise(
  paths: ScopePaths,
  state: ScopeState,
  verdict: AlignVerdict & { type: "revise" },
): AlignOutput {
  const result = appendScopeEvent(paths, {
    type: "align.revised",
    actor: "user",
    payload: {
      revision_count: state.revision_count_align + 1,
      feedback_scope: verdict.feedbackScope,
      feedback_text: verdict.feedback,
      packet_path: "build/align-packet.md",
      packet_hash: verdict.updatedPacketHash,
    },
  });

  if (!result.success) {
    return { success: false, reason: wrapGateError(result.reason) };
  }

  // Record convergence observational events based on revision count
  const revCount = state.revision_count_align + 1;

  if (revCount >= CONVERGENCE_THRESHOLDS.blocked) {
    appendScopeEvent(paths, {
      type: "convergence.blocked",
      actor: "system",
      payload: { state: "align_proposed", revision_count: revCount, requires_action: true },
    });
  } else if (revCount >= CONVERGENCE_THRESHOLDS.caution) {
    appendScopeEvent(paths, {
      type: "convergence.diagnosis",
      actor: "system",
      payload: { state: "align_proposed", revision_count: revCount, diagnosis: "반복 수정이 지속되고 있습니다", options: ["방향 변경", "scope 축소", "전문가 상담"] },
    });
  } else if (revCount >= CONVERGENCE_THRESHOLDS.notice) {
    appendScopeEvent(paths, {
      type: "convergence.warning",
      actor: "system",
      payload: { state: "align_proposed", revision_count: revCount, pattern_summary: `${revCount}회 반복 수정 중` },
    });
  }

  writeScopeMd(paths);

  let message = "피드백이 반영되었습니다. 수정된 Align Packet을 확인하세요.";
  if (revCount >= CONVERGENCE_THRESHOLDS.blocked) {
    message = "7회 이상 수정되었습니다. 수렴 차단 상태입니다. 다음 중 선택하세요: (1) 방향 변경 (2) scope 축소 (3) scope 보류";
  } else if (revCount >= CONVERGENCE_THRESHOLDS.caution) {
    message = `${revCount}회 수정되었습니다. 방향 자체를 재검토하는 것이 좋을 수 있습니다.`;
  } else if (revCount >= 3) {
    message = `${revCount}회 수정되었습니다. 피드백 패턴을 확인해 주세요.`;
  }

  return {
    success: true,
    nextState: "align_proposed",
    message,
  };
}

function handleReject(
  paths: ScopePaths,
  verdict: AlignVerdict & { type: "reject" },
): AlignOutput {
  const result = appendScopeEvent(paths, {
    type: "scope.rejected",
    actor: "user",
    payload: {
      reason: verdict.reason,
      rejection_basis: verdict.basis,
    },
  });

  if (!result.success) {
    return { success: false, reason: wrapGateError(result.reason) };
  }

  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: "rejected",
    message: "scope가 거절되었습니다.",
  };
}

function handleRedirect(
  paths: ScopePaths,
  verdict: AlignVerdict & { type: "redirect" },
): AlignOutput {
  const result = appendScopeEvent(paths, {
    type: "redirect.to_grounding",
    actor: "user",
    payload: {
      from_state: "align_proposed",
      reason: verdict.reason,
    },
  });

  if (!result.success) {
    return { success: false, reason: wrapGateError(result.reason) };
  }

  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: "grounded",
    message: "grounding으로 복귀합니다. 추가 소스를 확보한 뒤 /start를 재실행하세요.",
  };
}

// ─── Helpers ───

function writeScopeMd(paths: ScopePaths, state?: ScopeState): void {
  const s = state ?? reduce(readEvents(paths.events));
  const md = renderScopeMd(s);
  writeFileSync(paths.scopeMd, md, "utf-8");
}
