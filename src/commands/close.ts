/**
 * /close command orchestration.
 *
 * Closes a validated scope:
 * - validated → scope.closed → closed
 *
 * Only allowed when current state is "validated".
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";
import { appendScopeEvent } from "../kernel/event-pipeline.js";
import { renderScopeMd } from "../renderers/scope-md.js";
import { wrapGateError } from "./error-messages.js";
import { buildHandoffPrd } from "./handoff.js";
import type { ScopePaths } from "../kernel/scope-manager.js";
import type { ScopeState, PrdRenderedPayload } from "../kernel/types.js";

// ─── Output ───

export interface CloseResult {
  success: true;
  nextState: string;
  message: string;
  handoff_path?: string;
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

  // Generate handoff_prd.json for developer handoff
  let handoff_path: string | undefined;
  try {
    // prd.rendered 이벤트에서 실제 PRD 파일 경로를 읽음 (failed 제외)
    let prdEvent: (typeof events)[number] | undefined;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === "prd.rendered") { prdEvent = events[i]; break; }
    }
    const prdPayload = prdEvent?.payload as PrdRenderedPayload | undefined;
    const prdRelPath = prdPayload && prdPayload.status !== "failed"
      ? prdPayload.prd_path
      : undefined;
    const prdPath = prdRelPath ? join(paths.base, prdRelPath) : undefined;
    const handoff = buildHandoffPrd(prdPath ?? null, state);
    if (!existsSync(paths.build)) mkdirSync(paths.build, { recursive: true });
    const hp = join(paths.build, "handoff_prd.json");
    writeFileSync(hp, JSON.stringify(handoff, null, 2), "utf-8");
    handoff_path = "build/handoff_prd.json";
  } catch (err) {
    // handoff generation is observational — failure does not block close
    console.warn(`[handoff] generation failed: ${err instanceof Error ? err.stack : err}`);
  }

  return {
    success: true,
    nextState: "closed",
    message: "Scope가 종료되었습니다.",
    handoff_path,
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
