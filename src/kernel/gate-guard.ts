import type {
  Event,
  EventType,
  State,
  ScopeState,
  ConstraintDecisionRecordedPayload,
  ConstraintClarifyRequestedPayload,
  ConstraintClarifyResolvedPayload,
  ConstraintInvalidatedPayload,
  SurfaceChangeRequiredPayload,
  ValidationCompletedPayload,
} from "./types.js";
import { resolveTransition } from "./state-machine.js";
import { findConstraint, isConstraintsResolved } from "./constraint-pool.js";

// ─── Result type ───

export type GateResult =
  | { allowed: true; next_state: State }
  | { allowed: false; reason: string };

// ─── Events that reference a constraint_id ───

const CONSTRAINT_REF_EVENTS = new Set<string>([
  "constraint.decision_recorded",
  "constraint.clarify_requested",
  "constraint.clarify_resolved",
  "constraint.invalidated",
  "surface.change_required",
]);

// ─── Events blocked during convergence ───

const CONVERGENCE_BLOCKED_EVENTS = new Set<string>([
  "align.revised",
  "surface.revision_applied",
]);

// ─── Main validation function ───

/**
 * Validate an event before appending to the event store.
 *
 * Checks 5 rules in order:
 * 1. State transition authorization (state machine matrix)
 * 2. Referential integrity (constraint_id existence)
 * 3. Required override validation (rationale required)
 * 4. Convergence blocking (revise blocked after convergence.blocked)
 * 5. Compile retry limit (compile.started blocked after 3 gap_found cycles)
 *
 * On success, returns the determined next_state (resolving conditional targets).
 * On failure, returns the reason for rejection.
 */
export function validateEvent(
  state: ScopeState,
  newEvent: Event,
): GateResult {
  const eventType = newEvent.type;

  // ── Special case: scope.created is a bootstrap event ──
  // Not in the state machine matrix. Allowed only when no events exist yet.
  if (eventType === "scope.created") {
    if (state.latest_revision === 0) {
      return { allowed: true, next_state: "draft" };
    }
    return {
      allowed: false,
      reason: `scope.created is only allowed as the first event (current revision: ${state.latest_revision})`,
    };
  }

  // ── Rule 1: State transition authorization ──
  const outcome = resolveTransition(state.current_state, eventType);
  if (!outcome.allowed) {
    return {
      allowed: false,
      reason: `Transition denied: "${state.current_state}" does not allow "${eventType}"`,
    };
  }

  // ── Rule 2: Referential integrity ──
  if (CONSTRAINT_REF_EVENTS.has(eventType)) {
    const constraintId = extractConstraintId(newEvent);
    if (constraintId !== undefined) {
      const entry = findConstraint(state.constraint_pool, constraintId);
      if (!entry) {
        return {
          allowed: false,
          reason: `Referential integrity: constraint_id "${constraintId}" not found in pool`,
        };
      }

      // ── Rule 3: Required override validation ──
      if (
        eventType === "constraint.decision_recorded" ||
        eventType === "constraint.clarify_resolved"
      ) {
        const decision = (newEvent.payload as { decision: string }).decision;
        if (
          entry.severity === "required" &&
          decision === "override"
        ) {
          const rationale = (newEvent.payload as { rationale?: string }).rationale;
          if (!rationale || rationale.trim() === "") {
            return {
              allowed: false,
              reason: `Required constraint "${constraintId}" with override decision requires non-empty rationale`,
            };
          }
        }
      }
    }
  }

  // ── Rule 4: Convergence blocking ──
  if (
    state.convergence_blocked &&
    CONVERGENCE_BLOCKED_EVENTS.has(eventType)
  ) {
    return {
      allowed: false,
      reason: `Convergence blocked: cannot "${eventType}" until convergence.action_taken is recorded`,
    };
  }

  // ── Rule 5: Compile retry limit ──
  if (
    eventType === "compile.started" &&
    state.retry_count_compile >= 3
  ) {
    return {
      allowed: false,
      reason: `Compile retry limit exceeded (${state.retry_count_compile} gap_found cycles). Consider scope.deferred or redirect.to_align.`,
    };
  }

  // ── Resolve next state (handle conditional targets) ──
  const next_state = resolveNextState(outcome, state, newEvent);

  return { allowed: true, next_state };
}

// ─── Conditional target resolution ───

/**
 * Determine the actual next state when conditional_targets exist.
 *
 * Handles two cases:
 * 1. surface_confirmed + constraint decision/clarify/invalidated
 *    → constraints_resolved if all constraints are now resolved
 * 2. applied + validation.completed
 *    → validated (pass), constraints_resolved (fail), or grounded (fail+stale)
 */
function resolveNextState(
  outcome: { allowed: true; next_state: State; conditional_targets?: State[] },
  state: ScopeState,
  event: Event,
): State {
  if (!outcome.conditional_targets || outcome.conditional_targets.length === 0) {
    return outcome.next_state;
  }

  const eventType = event.type as EventType;

  // Case 1: surface_confirmed → constraints_resolved (conditional)
  if (
    state.current_state === "surface_confirmed" &&
    (eventType === "constraint.decision_recorded" ||
      eventType === "constraint.clarify_resolved" ||
      eventType === "constraint.invalidated")
  ) {
    // Simulate: apply this event to the pool, then check resolution
    const simulatedPool = simulateConstraintEvent(state, event);
    if (isConstraintsResolved(simulatedPool)) {
      return "constraints_resolved";
    }
    return "surface_confirmed";
  }

  // Case 2: applied + validation.completed → validated / constraints_resolved / grounded
  if (
    state.current_state === "applied" &&
    eventType === "validation.completed"
  ) {
    const p = event.payload as ValidationCompletedPayload;
    // stale → grounded (regardless of pass/fail)
    if (state.stale) {
      return "grounded";
    }
    if (p.result === "pass") {
      return "validated";
    }
    // fail + target issue → constraints_resolved
    return "constraints_resolved";
  }

  // Default: use matrix default
  return outcome.next_state;
}

// ─── Helpers ───

/**
 * Simulate applying a constraint event to get an updated pool.
 * Used for conditional target resolution without mutating the original pool.
 */
function simulateConstraintEvent(
  state: ScopeState,
  event: Event,
): ScopeState["constraint_pool"] {
  // Deep clone the constraints array to avoid mutation
  const clonedConstraints = state.constraint_pool.constraints.map((c) => ({
    ...c,
  }));

  const eventType = event.type as EventType;

  if (eventType === "constraint.decision_recorded") {
    const p = event.payload as ConstraintDecisionRecordedPayload;
    const entry = clonedConstraints.find(
      (c) => c.constraint_id === p.constraint_id,
    );
    if (entry) {
      entry.status = "decided";
    }
  } else if (eventType === "constraint.clarify_resolved") {
    const p = event.payload as ConstraintClarifyResolvedPayload;
    const entry = clonedConstraints.find(
      (c) => c.constraint_id === p.constraint_id,
    );
    if (entry) {
      entry.status = "decided";
    }
  } else if (eventType === "constraint.invalidated") {
    const p = event.payload as ConstraintInvalidatedPayload;
    const entry = clonedConstraints.find(
      (c) => c.constraint_id === p.constraint_id,
    );
    if (entry) {
      entry.status = "invalidated";
    }
  }

  // Recompute summary
  let decided = 0;
  let clarify_pending = 0;
  let invalidated = 0;
  let undecided = 0;
  let required = 0;
  let recommended = 0;

  for (const c of clonedConstraints) {
    if (c.severity === "required") required++;
    else recommended++;
    switch (c.status) {
      case "decided": decided++; break;
      case "clarify_pending": clarify_pending++; break;
      case "invalidated": invalidated++; break;
      case "undecided": undecided++; break;
    }
  }

  return {
    constraints: clonedConstraints,
    summary: {
      total: clonedConstraints.length,
      required,
      recommended,
      decided,
      clarify_pending,
      invalidated,
      undecided,
    },
  };
}

/** Extract constraint_id from event payload, if present. */
function extractConstraintId(event: Event): string | undefined {
  const payload = event.payload as Record<string, unknown>;
  if (typeof payload.constraint_id === "string") {
    return payload.constraint_id;
  }
  return undefined;
}
