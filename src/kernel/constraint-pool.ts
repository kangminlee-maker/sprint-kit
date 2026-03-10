import type {
  Event,
  EventType,
  ConstraintEntry,
  ConstraintPool,
  ConstraintDiscoveredPayload,
  ConstraintDecisionRecordedPayload,
  ConstraintClarifyResolvedPayload,
  ConstraintInvalidatedPayload,
  ConstraintClarifyRequestedPayload,
} from "./types.js";

// ─── Constraint event types handled by this module ───

const CONSTRAINT_EVENT_TYPES = new Set<string>([
  "constraint.discovered",
  "constraint.decision_recorded",
  "constraint.clarify_requested",
  "constraint.clarify_resolved",
  "constraint.invalidated",
]);

// ─── Build ───

/**
 * Build a ConstraintPool from an event sequence.
 *
 * Processes events in order (by revision). Only constraint.* events are
 * handled; all others are ignored. For the same constraint_id, later
 * revisions overwrite earlier ones (last-write-wins).
 *
 * Defense: if a decision/clarify/invalidation event references a
 * constraint_id that was never discovered, the event is skipped.
 */
export function buildConstraintPool(events: Event[]): ConstraintPool {
  const map = new Map<string, ConstraintEntry>();

  for (const evt of events) {
    if (!CONSTRAINT_EVENT_TYPES.has(evt.type)) continue;

    switch (evt.type as EventType) {
      case "constraint.discovered": {
        const p = evt.payload as ConstraintDiscoveredPayload;
        // Skip duplicate discovered for the same id (id uniqueness rule)
        if (map.has(p.constraint_id)) break;
        map.set(p.constraint_id, {
          constraint_id: p.constraint_id,
          perspective: p.perspective,
          summary: p.summary,
          severity: p.severity,
          discovery_stage: p.discovery_stage,
          decision_owner: p.decision_owner,
          impact_if_ignored: p.impact_if_ignored,
          source_refs: p.source_refs,
          evidence_status: p.evidence_status ?? "unverified",
          evidence_note: p.evidence_note,
          status: "undecided",
          discovered_at: evt.revision,
        });
        break;
      }

      case "constraint.decision_recorded": {
        const p = evt.payload as ConstraintDecisionRecordedPayload;
        const entry = map.get(p.constraint_id);
        if (!entry) break; // skip: referential integrity — gate-guard's responsibility
        entry.status = "decided";
        entry.decision = p.decision;
        entry.selected_option = p.selected_option;
        entry.rationale = p.rationale;
        entry.decision_owner = p.decision_owner;
        entry.decided_at = evt.revision;
        break;
      }

      case "constraint.clarify_requested": {
        const p = evt.payload as ConstraintClarifyRequestedPayload;
        const entry = map.get(p.constraint_id);
        if (!entry) break;
        entry.status = "clarify_pending";
        break;
      }

      case "constraint.clarify_resolved": {
        const p = evt.payload as ConstraintClarifyResolvedPayload;
        const entry = map.get(p.constraint_id);
        if (!entry) break;
        entry.status = "decided";
        entry.decision = p.decision;
        entry.selected_option = p.selected_option;
        entry.rationale = p.rationale;
        entry.decision_owner = p.decision_owner;
        entry.decided_at = evt.revision;
        break;
      }

      case "constraint.invalidated": {
        const p = evt.payload as ConstraintInvalidatedPayload;
        const entry = map.get(p.constraint_id);
        if (!entry) break;
        entry.status = "invalidated";
        entry.invalidation_reason = p.reason;
        break;
      }
    }
  }

  const constraints = Array.from(map.values());

  return { constraints, summary: computeSummary(constraints) };
}

// ─── Query ───

/**
 * Check whether all constraints are resolved:
 * undecided === 0 AND clarify_pending === 0.
 *
 * Returns true when there are no constraints at all (total === 0),
 * which allows surface_confirmed → target.locked direct transition.
 */
export function isConstraintsResolved(pool: ConstraintPool): boolean {
  return pool.summary.undecided === 0 && pool.summary.clarify_pending === 0;
}

/**
 * Find a constraint entry by id. Returns undefined if not found.
 * Used by gate-guard for referential integrity and required-override checks.
 */
export function findConstraint(
  pool: ConstraintPool,
  constraintId: string,
): ConstraintEntry | undefined {
  return pool.constraints.find((c) => c.constraint_id === constraintId);
}

// ─── Internal ───

function computeSummary(constraints: ConstraintEntry[]): ConstraintPool["summary"] {
  let required = 0;
  let recommended = 0;
  let decided = 0;
  let clarify_pending = 0;
  let invalidated = 0;
  let undecided = 0;

  for (const c of constraints) {
    if (c.severity === "required") required++;
    else recommended++;

    switch (c.status) {
      case "decided":
        decided++;
        break;
      case "clarify_pending":
        clarify_pending++;
        break;
      case "invalidated":
        invalidated++;
        break;
      case "undecided":
        undecided++;
        break;
    }
  }

  return {
    total: constraints.length,
    required,
    recommended,
    decided,
    clarify_pending,
    invalidated,
    undecided,
  };
}
