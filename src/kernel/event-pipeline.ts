import { writeFileSync } from "node:fs";
import type { Event, EventType, State, Actor, ScopeState, PayloadMap } from "./types.js";
import { readEvents, appendEvent } from "./event-store.js";
import { reduce } from "./reducer.js";
import { validateEvent, type GateResult, type GateOptions } from "./gate-guard.js";
import type { ScopePaths } from "./scope-manager.js";
import { makeId } from "./id.js";

// ─── Input type (caller provides only what they control) ───

export interface EventInput<T extends EventType = EventType> {
  type: T;
  actor: Actor;
  payload: T extends keyof PayloadMap ? PayloadMap[T] : Record<string, unknown>;
}

// ─── Result type ───

export type PipelineResult =
  | { success: true; event: Event; next_state: State; state: ScopeState }
  | { success: false; reason: string };

// ─── Main pipeline ───

/**
 * Append an event to a scope through the full pipeline:
 * 1. Read current events → reduce to current state
 * 2. Validate the new event (gate-guard)
 * 3. Generate envelope (event_id, scope_id, ts, revision, state_before, state_after)
 * 4. Append to event store
 * 5. Re-reduce → write kernel materialized views (constraint-pool.json, verdict-log.json)
 *
 * Returns the updated ScopeState so the caller can render scope.md
 * or other view-layer outputs without kernel depending on renderers.
 *
 * This is the ONLY path for recording events. No other code should
 * call event-store.appendEvent directly.
 */
export function appendScopeEvent(
  paths: ScopePaths,
  input: EventInput,
  gateOptions?: GateOptions,
): PipelineResult {
  // ── Step 1: Current state ──
  const currentEvents = readEvents(paths.events);
  const currentState = reduce(currentEvents);

  // ── Step 2: Build temporary event for validation ──
  const revision = currentEvents.length + 1;
  const tempEvent = {
    event_id: makeId("evt_", revision),
    scope_id: paths.scopeId,
    type: input.type,
    ts: new Date().toISOString(),
    revision,
    actor: input.actor,
    state_before: input.type === "scope.created" ? null : currentState.current_state,
    state_after: "draft" as State, // placeholder, gate-guard determines actual value
    payload: input.payload,
  } as Event;

  // ── Step 3: Validate ──
  const gate: GateResult = validateEvent(currentState, tempEvent, gateOptions);
  if (!gate.allowed) {
    return { success: false, reason: gate.reason };
  }

  // ── Step 4: Set final state_after and append ──
  const eventToAppend = {
    ...tempEvent,
    state_after: gate.next_state,
  } as Event;

  appendEvent(paths.events, eventToAppend);

  // ── Step 5: Incremental reduce (reuse currentEvents instead of re-reading) ──
  const updatedState = reduce([...currentEvents, eventToAppend]);

  writeFileSync(
    paths.constraintPool,
    JSON.stringify(updatedState.constraint_pool, null, 2) + "\n",
    "utf-8",
  );

  writeFileSync(
    paths.verdictLog,
    JSON.stringify(updatedState.verdict_log, null, 2) + "\n",
    "utf-8",
  );

  return {
    success: true,
    event: eventToAppend,
    next_state: gate.next_state,
    state: updatedState,
  };
}
