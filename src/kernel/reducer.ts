import type {
  Event,
  EventType,
  ScopeState,
  VerdictLogEntry,
  FeedbackClassifiedPayload,
  ScopeCreatedPayload,
  AlignLockedPayload,
  SurfaceConfirmedPayload,
  GroundingStartedPayload,
  GroundingCompletedPayload,
  SnapshotMarkedStalePayload,
  ConstraintDecisionRecordedPayload,
  ConstraintClarifyResolvedPayload,
  RedirectToGroundingPayload,
  RedirectToAlignPayload,
  SurfaceChangeRequiredPayload,
  CompileConstraintGapFoundPayload,
  ApplyDecisionGapFoundPayload,
  ExplorationStartedPayload,
  ExplorationRoundCompletedPayload,
  ExplorationPhaseTransitionedPayload,
} from "./types.js";
import { buildConstraintPool, isConstraintsResolved } from "./constraint-pool.js";

/**
 * Compute the current ScopeState from an event sequence.
 *
 * Pure function — deterministic, no side effects, no external I/O.
 * Events MUST be sorted by revision (ascending). This is guaranteed
 * by event-store.readEvents() which reads events.ndjson line by line.
 */
export function reduce(events: Event[]): ScopeState {
  // ── Constraint pool (separate traversal) ──
  const constraint_pool = buildConstraintPool(events);

  // ── Single traversal for all other fields ──
  let scope_id = "";
  let title = "";
  let description = "";
  let entry_mode: ScopeState["entry_mode"] = "experience";
  let current_state: ScopeState["current_state"] = "draft";
  let direction: string | undefined;
  let scope_boundaries: { in: string[]; out: string[] } | undefined;
  let surface_hash: string | undefined;
  let surface_path: string | undefined;

  let grounding_sources: ScopeState["grounding_sources"];
  let lastGroundingRev = -1;
  let lastStaleRev = -1;
  let stale = false;
  let stale_sources: ScopeState["stale_sources"];
  let stale_since: number | undefined;

  let lastBlockedRev = -1;
  let lastActionTakenRev = -1;

  let revision_count_align = 0;
  let revision_count_surface = 0;
  let retry_count_compile = 0;
  let validation_plan_hash: string | undefined;
  let validation_result: ScopeState["validation_result"];
  let last_backward_reason: string | undefined;

  const verdict_log: VerdictLogEntry[] = [];
  const feedback_history: FeedbackClassifiedPayload[] = [];
  let exploration_progress: ScopeState["exploration_progress"];

  let latest_revision = 0;

  for (const evt of events) {
    current_state = evt.state_after;
    latest_revision = evt.revision;

    switch (evt.type as EventType) {
      // ── Scope ──
      case "scope.created": {
        const p = evt.payload as ScopeCreatedPayload;
        scope_id = evt.scope_id;
        title = p.title;
        description = p.description;
        entry_mode = p.entry_mode;
        break;
      }

      // ── Redirect (backward) ──
      case "redirect.to_grounding": {
        const p = evt.payload as RedirectToGroundingPayload;
        last_backward_reason = p.reason;
        break;
      }

      case "redirect.to_align": {
        const p = evt.payload as RedirectToAlignPayload;
        last_backward_reason = p.reason;
        break;
      }

      case "surface.change_required": {
        const p = evt.payload as SurfaceChangeRequiredPayload;
        last_backward_reason = p.reason;
        break;
      }

      // ── Align ──
      case "align.locked": {
        const p = evt.payload as AlignLockedPayload;
        direction = p.locked_direction;
        scope_boundaries = p.locked_scope_boundaries;
        last_backward_reason = undefined;
        verdict_log.push({
          type: "align.locked",
          revision: evt.revision,
          ts: evt.ts,
          locked_direction: p.locked_direction,
        });
        break;
      }

      case "align.revised":
        revision_count_align++;
        break;

      // ── Surface ──
      case "surface.confirmed": {
        const p = evt.payload as SurfaceConfirmedPayload;
        surface_hash = p.final_content_hash;
        surface_path = p.final_surface_path;
        break;
      }

      case "surface.revision_applied":
        revision_count_surface++;
        break;

      // ── Grounding / Stale ──
      case "grounding.started": {
        const p = evt.payload as GroundingStartedPayload;
        grounding_sources = p.sources;
        break;
      }

      case "grounding.completed": {
        lastGroundingRev = evt.revision;
        break;
      }

      case "snapshot.marked_stale": {
        const p = evt.payload as SnapshotMarkedStalePayload;
        lastStaleRev = evt.revision;
        stale_sources = p.stale_sources;
        stale_since = evt.revision;
        break;
      }

      // ── Constraint decisions → verdict log ──
      case "constraint.decision_recorded": {
        const p = evt.payload as ConstraintDecisionRecordedPayload;
        verdict_log.push({
          type: "constraint.decision_recorded",
          revision: evt.revision,
          ts: evt.ts,
          constraint_id: p.constraint_id,
          decision: p.decision,
          decision_owner: p.decision_owner,
        });
        break;
      }

      case "constraint.clarify_resolved": {
        const p = evt.payload as ConstraintClarifyResolvedPayload;
        verdict_log.push({
          type: "constraint.clarify_resolved",
          revision: evt.revision,
          ts: evt.ts,
          constraint_id: p.constraint_id,
          decision: p.decision,
          decision_owner: p.decision_owner,
        });
        break;
      }

      // ── Compile retry tracking ──
      case "compile.constraint_gap_found":
        retry_count_compile++;
        break;

      case "compile.completed": {
        const cp = evt.payload as import("./types.js").CompileCompletedPayload;
        retry_count_compile = 0;
        validation_plan_hash = cp.validation_plan_hash;
        break;
      }

      case "validation.completed": {
        const vp = evt.payload as import("./types.js").ValidationCompletedPayload;
        validation_result = {
          result: vp.result,
          pass_count: vp.pass_count,
          fail_count: vp.fail_count,
          items: vp.items,
        };
        break;
      }

      // ── Convergence ──
      case "convergence.blocked":
        lastBlockedRev = evt.revision;
        break;

      case "convergence.action_taken":
        lastActionTakenRev = evt.revision;
        break;

      // ── Feedback ──
      case "feedback.classified":
        feedback_history.push(evt.payload as FeedbackClassifiedPayload);
        break;

      // ── Exploration ──
      case "exploration.started": {
        const p = evt.payload as ExplorationStartedPayload;
        exploration_progress = {
          current_phase: 1,
          current_phase_name: "목적 정밀화",
          total_rounds: 0,
          entry_mode: p.entry_mode,
          decisions: [],
          assumptions: [],
          phase_history: [{ phase: 1, phase_name: "목적 정밀화", entered_at: evt.revision }],
          completed_at: undefined,
        };
        break;
      }
      case "exploration.round_completed": {
        const p = evt.payload as ExplorationRoundCompletedPayload;
        if (exploration_progress) {
          exploration_progress.total_rounds++;
          for (const d of p.decisions) {
            exploration_progress.decisions.push({
              round: d.round,
              phase: p.phase,
              topic: p.topic,
              question: d.question,
              answer: d.answer,
            });
          }
          if (p.assumptions_found) {
            for (const a of p.assumptions_found) {
              exploration_progress.assumptions.push({
                content: a,
                type: "discovered",
                status: "unverified",
                source_phase: p.phase,
              });
            }
          }
        }
        break;
      }
      case "exploration.phase_transitioned": {
        const p = evt.payload as ExplorationPhaseTransitionedPayload;
        if (exploration_progress) {
          exploration_progress.current_phase = p.to_phase;
          const phaseNames: Record<number, string> = {
            1: "목적 정밀화", 2: "영역 탐색", 3: "현재 상태 공유",
            4: "시나리오 탐색", 5: "가정 검증", 6: "범위 확정",
          };
          exploration_progress.current_phase_name = phaseNames[p.to_phase] ?? `Phase ${p.to_phase}`;
          exploration_progress.phase_history.push({
            phase: p.to_phase,
            phase_name: exploration_progress.current_phase_name,
            entered_at: evt.revision,
          });
        }
        break;
      }

      // ── Exploration completed (via align.proposed) ──
      case "align.proposed": {
        if (exploration_progress && !exploration_progress.completed_at) {
          exploration_progress.completed_at = evt.revision;
        }
        break;
      }
    }
  }

  // ── Derived fields ──
  stale = lastStaleRev > lastGroundingRev;

  // Clear stale detail when not stale
  if (!stale) {
    stale_sources = undefined;
    stale_since = undefined;
  }

  const compile_ready = isConstraintsResolved(constraint_pool) && !stale;
  const convergence_blocked =
    lastBlockedRev > -1 && lastBlockedRev > lastActionTakenRev;

  return {
    scope_id,
    title,
    description,
    entry_mode,
    current_state,
    direction,
    scope_boundaries,
    surface_hash,
    surface_path,
    grounding_sources,
    constraint_pool,
    last_backward_reason,
    stale,
    stale_sources,
    stale_since,
    compile_ready,
    convergence_blocked,
    revision_count_align,
    revision_count_surface,
    retry_count_compile,
    snapshot_revision: lastGroundingRev > 0 ? lastGroundingRev : 0,
    validation_plan_hash,
    validation_result,
    verdict_log,
    feedback_history,
    exploration_progress,
    latest_revision,
  };
}
