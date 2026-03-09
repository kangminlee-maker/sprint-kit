/**
 * /close command orchestration.
 *
 * Closes a validated scope:
 * - validated → scope.closed → closed
 *
 * Only allowed when current state is "validated".
 */

import { writeFileSync } from "node:fs";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";
import { appendScopeEvent } from "../kernel/event-pipeline.js";
import { renderScopeMd } from "../renderers/scope-md.js";
import { wrapGateError } from "./error-messages.js";
import type { ScopePaths } from "../kernel/scope-manager.js";
import type { ScopeState } from "../kernel/types.js";

// ─── Output ───

export interface CloseResult {
  success: true;
  nextState: string;
  message: string;
}

export interface CloseFailure {
  success: false;
  reason: string;
}

export type CloseOutput = CloseResult | CloseFailure;

// ─── Main ───

export function executeClose(paths: ScopePaths): CloseOutput {
  const events = readEvents(paths.events);
  const state = reduce(events);

  if (state.current_state !== "validated") {
    return {
      success: false,
      reason: `현재 상태가 ${state.current_state}입니다. /close는 validated 상태에서만 실행할 수 있습니다.`,
    };
  }

  const result = appendScopeEvent(paths, {
    type: "scope.closed",
    actor: "user",
    payload: {},
  });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };
  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: "closed",
    message: "Scope가 종료되었습니다.",
  };
}

// ─── Defer ───

export function executeDefer(
  paths: ScopePaths,
  reason: string,
  resumeCondition: string,
): CloseOutput {
  const events = readEvents(paths.events);
  const state = reduce(events);

  const terminalStates = ["closed", "deferred", "rejected"];
  if (terminalStates.includes(state.current_state)) {
    return {
      success: false,
      reason: `현재 상태가 ${state.current_state}입니다. 이미 종료된 scope는 보류할 수 없습니다.`,
    };
  }

  const result = appendScopeEvent(paths, {
    type: "scope.deferred",
    actor: "user",
    payload: { reason, resume_condition: resumeCondition },
  });

  if (!result.success) return { success: false, reason: wrapGateError(result.reason) };
  writeScopeMd(paths, result.state);

  return {
    success: true,
    nextState: "deferred",
    message: "Scope가 보류되었습니다.",
  };
}

// ─── Helpers ───

function writeScopeMd(paths: ScopePaths, state?: ScopeState): void {
  const s = state ?? reduce(readEvents(paths.events));
  const md = renderScopeMd(s);
  writeFileSync(paths.scopeMd, md, "utf-8");
}
