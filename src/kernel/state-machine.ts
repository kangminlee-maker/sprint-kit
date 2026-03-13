import type {
  State,
  TransitionEventType,
  GlobalEventType,
  ObservationalEventType,
  EventType,
  TransitionOutcome,
  TransitionResult,
  TransitionKind,
} from "./types.js";
import { TERMINAL_STATES, OBSERVATIONAL_EVENT_TYPES } from "./types.js";

const OBSERVATIONAL_SET: ReadonlySet<string> = new Set(OBSERVATIONAL_EVENT_TYPES);

// ─── Matrix entry ───

interface MatrixEntry {
  next: State;
  kind: TransitionKind;
  /** Context-dependent alternative targets (determined by reducer/gate-guard in Phase 2). */
  conditional?: State[];
}

// State × TransitionEvent matrix.
// Only explicitly listed combinations are allowed. Everything else is denied.
const MATRIX: Partial<
  Record<State, Partial<Record<TransitionEventType, MatrixEntry>>>
> = {
  // ── draft ──
  draft: {
    "input.attached": { next: "draft", kind: "self" },
    "grounding.started": { next: "draft", kind: "self" },
    "grounding.completed": { next: "grounded", kind: "forward" },
    "constraint.discovered": { next: "draft", kind: "self" },
  },

  // ── grounded ──
  grounded: {
    "align.proposed": { next: "align_proposed", kind: "forward" },
    "constraint.discovered": { next: "grounded", kind: "self" },
    "snapshot.marked_stale": { next: "grounded", kind: "self" },
    "exploration.started": { next: "exploring", kind: "forward" },
  },

  // ── exploring ──
  exploring: {
    "exploration.round_completed": { next: "exploring", kind: "self" },
    "exploration.phase_transitioned": { next: "exploring", kind: "self" },
    "align.proposed": { next: "align_proposed", kind: "forward" },
    "constraint.discovered": { next: "exploring", kind: "self" },
    "snapshot.marked_stale": { next: "exploring", kind: "self" },
  },

  // ── align_proposed ──
  align_proposed: {
    "align.locked": { next: "align_locked", kind: "forward" },
    "align.revised": { next: "align_proposed", kind: "self" },
    "snapshot.marked_stale": { next: "align_proposed", kind: "self" },
    "redirect.to_grounding": { next: "grounded", kind: "backward" },
  },

  // ── align_locked ──
  align_locked: {
    "surface.generated": { next: "surface_iterating", kind: "forward" },
    "snapshot.marked_stale": { next: "align_proposed", kind: "backward" },
  },

  // ── surface_iterating ──
  surface_iterating: {
    "surface.revision_requested": {
      next: "surface_iterating",
      kind: "self",
    },
    "surface.revision_applied": { next: "surface_iterating", kind: "self" },
    "surface.confirmed": { next: "surface_confirmed", kind: "forward" },
    "constraint.discovered": { next: "surface_iterating", kind: "self" },
    "redirect.to_align": { next: "align_proposed", kind: "backward" },
    "snapshot.marked_stale": { next: "surface_iterating", kind: "self" },
  },

  // ── surface_confirmed ──
  surface_confirmed: {
    "constraint.discovered": { next: "surface_confirmed", kind: "self" },
    "constraint.decision_recorded": {
      next: "surface_confirmed",
      kind: "self",
      conditional: ["constraints_resolved"],
    },
    "constraint.clarify_requested": {
      next: "surface_confirmed",
      kind: "self",
    },
    "constraint.clarify_resolved": {
      next: "surface_confirmed",
      kind: "self",
      conditional: ["constraints_resolved"],
    },
    "constraint.invalidated": {
      next: "surface_confirmed",
      kind: "self",
      conditional: ["constraints_resolved"],
    },
    "target.locked": { next: "target_locked", kind: "forward" },
    "surface.change_required": {
      next: "surface_iterating",
      kind: "backward",
    },
    "redirect.to_align": { next: "align_proposed", kind: "backward" },
    "snapshot.marked_stale": { next: "surface_confirmed", kind: "self" },
  },

  // ── constraints_resolved ──
  constraints_resolved: {
    "constraint.discovered": {
      next: "surface_confirmed",
      kind: "backward",
    },
    "constraint.decision_recorded": {
      next: "constraints_resolved",
      kind: "self",
    },
    "constraint.invalidated": { next: "constraints_resolved", kind: "self" },
    "target.locked": { next: "target_locked", kind: "forward" },
    "surface.change_required": {
      next: "surface_iterating",
      kind: "backward",
    },
    "redirect.to_align": { next: "align_proposed", kind: "backward" },
    "snapshot.marked_stale": { next: "constraints_resolved", kind: "self" },
  },

  // ── target_locked ──
  target_locked: {
    "constraint.discovered": { next: "target_locked", kind: "self" },
    "compile.started": { next: "target_locked", kind: "self" },
    "compile.completed": { next: "compiled", kind: "forward" },
    "compile.constraint_gap_found": {
      next: "constraints_resolved",
      kind: "backward",
    },
    "snapshot.marked_stale": {
      next: "constraints_resolved",
      kind: "backward",
    },
  },

  // ── compiled ──
  compiled: {
    "constraint.discovered": { next: "compiled", kind: "self" },
    "compile.constraint_gap_found": {
      next: "constraints_resolved",
      kind: "backward",
    },
    "apply.started": { next: "compiled", kind: "self" },
    "apply.completed": { next: "applied", kind: "forward" },
    "apply.decision_gap_found": {
      next: "constraints_resolved",
      kind: "backward",
    },
    "snapshot.marked_stale": { next: "grounded", kind: "backward" },
  },

  // ── applied ──
  applied: {
    "validation.started": { next: "applied", kind: "self" },
    "validation.completed": {
      next: "validated",
      kind: "forward",
      conditional: ["constraints_resolved", "grounded"],
    },
    "snapshot.marked_stale": { next: "applied", kind: "self" },
  },

  // ── validated ──
  validated: {
    "scope.closed": { next: "closed", kind: "forward" },
  },
};

// validation.completed has conditional next state (pass vs fail).
// The matrix records the default (pass → validated).
// Gate guard / pipeline handles fail variants.
// This is documented here for completeness but the conditional logic
// lives in gate-guard.ts (Phase 2).

// ─── Public API ───

/**
 * Check whether a transition event is allowed from the given state.
 * Returns the outcome (allowed + next state, or denied).
 */
export function canTransition(
  state: State,
  eventType: TransitionEventType,
): TransitionOutcome {
  const stateRow = MATRIX[state];
  if (!stateRow) {
    return { allowed: false };
  }
  const entry = stateRow[eventType];
  if (!entry) {
    return { allowed: false };
  }
  const result: TransitionResult = {
    allowed: true,
    next_state: entry.next,
    kind: entry.kind,
  };
  if (entry.conditional) {
    result.conditional_targets = entry.conditional;
  }
  return result;
}

/**
 * Check whether a global event is allowed from the given state.
 * Global events (scope.deferred, scope.rejected) are allowed from every non-terminal state.
 */
export function canApplyGlobal(
  state: State,
  eventType: GlobalEventType,
): TransitionOutcome {
  if (TERMINAL_STATES.has(state)) {
    return { allowed: false };
  }
  const targetState: State =
    eventType === "scope.deferred" ? "deferred" : "rejected";
  return { allowed: true, next_state: targetState, kind: "forward" };
}

/**
 * Check whether an observational event is allowed from the given state.
 * Observational events are allowed in every non-terminal state.
 * They do not change state (state_after === state_before).
 */
export function canApplyObservational(
  state: State,
  _eventType: ObservationalEventType,
): TransitionOutcome {
  if (TERMINAL_STATES.has(state)) {
    return { allowed: false };
  }
  return { allowed: true, next_state: state, kind: "self" };
}

/**
 * Unified check: given current state and any event type, return the transition outcome.
 */
export function resolveTransition(
  state: State,
  eventType: EventType,
): TransitionOutcome {
  // Global events
  if (eventType === "scope.deferred" || eventType === "scope.rejected") {
    return canApplyGlobal(state, eventType);
  }

  // Observational events
  if (OBSERVATIONAL_SET.has(eventType)) {
    return canApplyObservational(
      state,
      eventType as ObservationalEventType,
    );
  }

  // Transition events
  return canTransition(state, eventType as TransitionEventType);
}

/**
 * Get all allowed events from a given state (transition events only).
 * Useful for debugging and testing.
 */
export function allowedTransitionEvents(
  state: State,
): TransitionEventType[] {
  const stateRow = MATRIX[state];
  if (!stateRow) return [];
  return Object.keys(stateRow) as TransitionEventType[];
}
