import { writeFileSync } from "node:fs";
import type { Event, EventType, State, Actor, ScopeState } from "./types.js";
import { readEvents, appendEvent, nextRevision } from "./event-store.js";
import { reduce } from "./reducer.js";
import { validateEvent, type GateResult } from "./gate-guard.js";
import type { ScopePaths } from "./scope-manager.js";

// ─── Input type (caller provides only what they control) ───

export interface EventInput {
  type: EventType;
  actor: Actor;
  payload: Record<string, unknown>;
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
): PipelineResult {
  // ── Step 1: Current state ──
  const currentEvents = readEvents(paths.events);
  const currentState = reduce(currentEvents);

  // ── Step 2: Build temporary event for validation ──
  const revision = nextRevision(paths.events);
  const tempEvent = {
    event_id: `evt_${String(revision).padStart(3, "0")}`,
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
  const gate: GateResult = validateEvent(currentState, tempEvent);
  if (!gate.allowed) {
    return { success: false, reason: gate.reason };
  }

  // ── Step 4: Set final state_after and append ──
  const eventToAppend = {
    ...tempEvent,
    state_after: gate.next_state,
  } as Event;

  appendEvent(paths.events, eventToAppend);

  // ── Step 5: Re-reduce and write kernel materialized views ──
  const updatedEvents = readEvents(paths.events);
  const updatedState = reduce(updatedEvents);

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
