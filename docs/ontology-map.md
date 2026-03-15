# Sprint Kit Ontology Map
<!-- auto-generated from src/kernel/types.ts — do not edit manually -->
<!-- generated at: 2026-03-15T07:26:14.181Z -->
<!-- regenerate: npx tsx scripts/generate-ontology-map.ts --write -->

## Union Types

### Actor (3 values)
`user | system | agent`
→ src/kernel/types.ts:101

### Perspective (3 values)
`experience | code | policy`
→ src/kernel/types.ts:105

### Severity (2 values)
`required | recommended`
→ src/kernel/types.ts:109

### DecisionOwner (2 values)
`product_owner | builder`
→ src/kernel/types.ts:113

### ConstraintDecision (5 values)
`inject | defer | override | clarify | modify-direction`
→ src/kernel/types.ts:117

### DiscoveryStage (7 values)
`grounding | exploration | draft_surface_gen | draft_phase1 | draft_phase2 | compile | apply`
→ src/kernel/types.ts:126

### AssumptionStatus (4 values)
> Exploration Phase 5 가정의 검증 상태. 설계 예약: 현재 reducer는 "unverified"로만 초기화합니다. 나머지 3개 값으로의 전이는 `exploration.assumption_resolved` 이벤트 구현 시 활성화됩니다. 해당 이벤트가 구현되기 전까지, §2.6 렌더러는 status === "unverified"만 필터하여 모든 가정을 PO에게 표시합니다 (정보 누락 방지).
`unverified | verified | constraint_discovered | invalidated`
→ src/kernel/types.ts:143

### FeedbackClassification (4 values)
`surface_only | constraint_decision | target_change | direction_change`
→ src/kernel/types.ts:151

### EntryMode (2 values)
`experience | interface`
→ src/kernel/types.ts:159

### SurfaceType (2 values)
`experience | interface`
→ src/kernel/types.ts:163

### ValidationResult (2 values)
`pass | fail`
→ src/kernel/types.ts:311

### EvidenceStatus (4 values)
`verified | code_inferred | brief_claimed | unverified`
→ src/kernel/types.ts:419

### PreApplyReviewVerdict (2 values)
`pass | gap_found`
→ src/kernel/types.ts:599

### ConstraintStatus (4 values)
`undecided | decided | clarify_pending | invalidated`
→ src/kernel/types.ts:711

### TransitionKind (3 values)
`forward | self | backward`
→ src/kernel/types.ts:921

## Const Arrays

### STATES (15 values)
`draft | grounded | exploring | align_proposed | align_locked | surface_iterating | surface_confirmed | constraints_resolved | target_locked | compiled | applied | validated | closed | deferred | rejected`
→ src/kernel/types.ts:3

### TERMINAL_STATES (3 values)
`closed | deferred | rejected`
→ src/kernel/types.ts:23

### TRANSITION_EVENT_TYPES (33 values)
`scope.created | scope.closed | input.attached | grounding.started | grounding.completed | snapshot.marked_stale | align.proposed | align.revised | align.locked | redirect.to_grounding | redirect.to_align | surface.change_required | surface.generated | surface.revision_requested | surface.revision_applied | surface.confirmed | constraint.discovered | constraint.decision_recorded | constraint.clarify_requested | constraint.clarify_resolved | constraint.invalidated | target.locked | compile.started | compile.completed | compile.constraint_gap_found | apply.started | apply.completed | apply.decision_gap_found | validation.started | validation.completed | exploration.started | exploration.round_completed | exploration.phase_transitioned`
→ src/kernel/types.ts:32

### GLOBAL_EVENT_TYPES (2 values)
`scope.deferred | scope.rejected`
→ src/kernel/types.ts:71

### OBSERVATIONAL_EVENT_TYPES (9 values)
`feedback.classified | convergence.warning | convergence.diagnosis | convergence.blocked | convergence.action_taken | draft_packet.rendered | constraint.evidence_updated | prd.rendered | pre_apply.review_completed`
→ src/kernel/types.ts:79

## Domain Interfaces

### BrownfieldFileEntry
- path: string
- role: string
- detail_anchor: string
→ src/kernel/types.ts:202

### BrownfieldDepEntry
- module: string
- depends_on: string
- detail_anchor: string
→ src/kernel/types.ts:208

### BrownfieldApiEntry
- endpoint: string
- method: string
- description: string
- detail_anchor: string
→ src/kernel/types.ts:214

### BrownfieldSchemaEntry
- table: string
- columns: string
- detail_anchor: string
→ src/kernel/types.ts:221

### BrownfieldConfigEntry
- key: string
- description: string
- detail_anchor: string
→ src/kernel/types.ts:227

### BrownfieldContext
- related_files: BrownfieldFileEntry[]
- module_dependencies: BrownfieldDepEntry[]
- api_contracts?: BrownfieldApiEntry[]
- db_schemas?: BrownfieldSchemaEntry[]
- config_env?: BrownfieldConfigEntry[]
→ src/kernel/types.ts:233

### BrownfieldEnumDef
- name: string
- source: string
- values: string[]
→ src/kernel/types.ts:241

### BrownfieldInvariant
- name: string
- source: string
- description: string
- type: "schema" | "business_rule" | "api_contract" | "state_machine"
- affected_files?: string[]
→ src/kernel/types.ts:247

### BrownfieldDetail
- scope_id: string
- sections: BrownfieldDetailSection[]
- enums?: BrownfieldEnumDef[]
- invariants?: BrownfieldInvariant[]
→ src/kernel/types.ts:255

### BrownfieldDetailSection
- anchor: string
- source: string
- title: string
- content: string
→ src/kernel/types.ts:262

### ValidationPlanEntry
- val_id: string
- related_cst: string
- decision_type: "inject" | "defer" | "override"
→ src/kernel/types.ts:271

### ValidationPlanItem
extends: ValidationPlanEntry
- target: string
- method: string
- pass_criteria: string
- fail_action: string
- edge_cases?: Array<{
    scenario: string;
    expected_result: string;
  }>
→ src/kernel/types.ts:277

### RealitySnapshot
- scope_id: string
- snapshot_revision: number
- source_hashes: Record<string, string>
- perspective_summary: Record<Perspective, number>
- scanned_at: string
→ src/kernel/types.ts:290

### PreApplyReviewFinding
- perspective: "policy" | "brownfield" | "logic"
- status: "pass" | "warning"
- summary: string
- detail?: string
→ src/kernel/types.ts:601

### ConstraintEntry
- constraint_id: string
- perspective: Perspective
- summary: string
- severity: Severity
- discovery_stage: DiscoveryStage
- decision_owner: DecisionOwner
- impact_if_ignored: string
- source_refs: Array<{ source: string; detail: string }>
- evidence_status: EvidenceStatus
- evidence_note?: string
- requires_policy_change?: boolean
- status: ConstraintStatus
- invalidation_reason?: string
- decision?: ConstraintDecision
- selected_option?: string
- rationale?: string
- discovered_at: number
- decided_at?: number
→ src/kernel/types.ts:717

### ConstraintPool
- constraints: ConstraintEntry[]
- summary: {
    total: number;
    required: number;
    recommended: number;
    decided: number;
    clarify_pending: number;
    invalidated: number;
    undecided: number;
  }
→ src/kernel/types.ts:738

### ScopeState
> [설계 예약] 가정 검증 시 발견된 constraint의 ID. exploration.assumption_resolved 이벤트 구현 시 활성화.
- scope_id: string
- title: string
- description: string
- entry_mode: EntryMode
- current_state: State
- direction?: string
- scope_boundaries?: { in: string[]; out: string[] }
- surface_hash?: string
- surface_path?: string
- constraint_pool: ConstraintPool
- grounding_sources?: Array<{ type: SourceType; path_or_url: string }>
- stale: boolean
- stale_sources?: Array<{ path: string; old_hash: string; new_hash: string }>
- stale_since?: number
- compile_ready: boolean
- convergence_blocked: boolean
- revision_count_align: number
- revision_count_surface: number
- retry_count_compile: number
- snapshot_revision: number
- validation_plan_hash?: string
- validation_result?: { result: ValidationResult; pass_count: number; fail_count: number; items: ValidationItemResult[] }
- last_backward_reason?: string
- verdict_log: VerdictLogEntry[]
- feedback_history: FeedbackClassifiedPayload[]
- exploration_progress?: {
    current_phase: number;
    current_phase_name: string;
    total_rounds: number;
    entry_mode: string;
    decisions: Array<{
      round: number;
      phase: number;
      topic: string;
      question: string;
      answer: string;
    }>;
    assumptions: Array<{
      content: string;
      type: string;
      status: AssumptionStatus;
      source_phase?: number;
      /** [설계 예약] 가정 검증 시 발견된 constraint의 ID. exploration.assumption_resolved 이벤트 구현 시 활성화. */
      related_constraint_id?: string;
    }>;
    phase_history: Array<{
      phase: number;
      phase_name: string;
      entered_at: number;
    }>;
    completed_at?: number;
  }
- latest_revision: number
→ src/kernel/types.ts:779

## Renderer Input Types

### AlignPacketContent
- user_original_text: string
- interpreted_direction: string
- proposed_scope: { in: string[]; out: string[] }
- scenarios: string[]
- as_is: {
    experience: string;
    policy: string;
    code: string;
    code_details?: string;
  }
- tensions: Array<{
    constraint_id: string;
    what: string;
    why_conflict: string;
    // "처리하지 않으면"은 pool의 impact_if_ignored에서 자동 가져옴 (단일 소스)
    scale: string;
    options?: Array<{
      choice: string;
      pros: string;
      risk: string;
      detail?: string;
    }>;
    recommendation?: string;
    details?: string;
  }>
- decision_questions: string[]
- interface_extras?: {
    api_scope: string;
    breaking_change: string;
    version_policy: string;
  }
→ src/kernel/types.ts:837

### DraftPacketContent
- surface_path: string
- run_command?: string
- mockup_revisions?: number
- scenario_guide: Array<{
    scenario: string;
    start: string;
    steps: string;
    confirmed: string;
  }>
- constraint_details: ConstraintDetail[]
- guardrails: string[]
- decision_questions: string[]
→ src/kernel/types.ts:896

## Event-Payload Map

| Event Type | Payload Interface |
|---|---|
| scope.created | ScopeCreatedPayload |
| scope.closed | ScopeClosedPayload |
| scope.deferred | ScopeDeferredPayload |
| scope.rejected | ScopeRejectedPayload |
| input.attached | InputAttachedPayload |
| grounding.started | GroundingStartedPayload |
| grounding.completed | GroundingCompletedPayload |
| snapshot.marked_stale | SnapshotMarkedStalePayload |
| align.proposed | AlignProposedPayload |
| align.revised | AlignRevisedPayload |
| align.locked | AlignLockedPayload |
| redirect.to_grounding | RedirectToGroundingPayload |
| redirect.to_align | RedirectToAlignPayload |
| surface.change_required | SurfaceChangeRequiredPayload |
| surface.generated | SurfaceGeneratedPayload |
| surface.revision_requested | SurfaceRevisionRequestedPayload |
| surface.revision_applied | SurfaceRevisionAppliedPayload |
| surface.confirmed | SurfaceConfirmedPayload |
| constraint.discovered | ConstraintDiscoveredPayload |
| constraint.decision_recorded | ConstraintDecisionRecordedPayload |
| constraint.clarify_requested | ConstraintClarifyRequestedPayload |
| constraint.clarify_resolved | ConstraintClarifyResolvedPayload |
| constraint.invalidated | ConstraintInvalidatedPayload |
| target.locked | TargetLockedPayload |
| compile.started | CompileStartedPayload |
| compile.completed | CompileCompletedPayload |
| compile.constraint_gap_found | CompileConstraintGapFoundPayload |
| apply.started | ApplyStartedPayload |
| apply.completed | ApplyCompletedPayload |
| apply.decision_gap_found | ApplyDecisionGapFoundPayload |
| validation.started | ValidationStartedPayload |
| validation.completed | ValidationCompletedPayload |
| feedback.classified | FeedbackClassifiedPayload |
| convergence.warning | ConvergenceWarningPayload |
| convergence.diagnosis | ConvergenceDiagnosisPayload |
| convergence.blocked | ConvergenceBlockedPayload |
| convergence.action_taken | ConvergenceActionTakenPayload |
| constraint.evidence_updated | ConstraintEvidenceUpdatedPayload |
| draft_packet.rendered | DraftPacketRenderedPayload |
| prd.rendered | PrdRenderedPayload |
| pre_apply.review_completed | PreApplyReviewCompletedPayload |
| exploration.started | ExplorationStartedPayload |
| exploration.round_completed | ExplorationRoundCompletedPayload |
| exploration.phase_transitioned | ExplorationPhaseTransitionedPayload |

## Relationships

### Physical References (actual code)

- ScopeState 1:1 ConstraintPool (via constraint_pool field)
- ConstraintPool 1:N ConstraintEntry (via constraints[])
- ScopeState 1:N VerdictLogEntry (via verdict_log[])
- ScopeState 0..1 ExplorationProgress (via exploration_progress?)
- ScopeState N:N Event (state reconstructed from Event[] via Reducer)
- Event → PayloadMap[T] (discriminated union, compile-time enforced)

### Tracing Chain — CST-centric Star Pattern

The logical chain CST→IMPL→CHG→VAL is verified by Compile Defense.
Physical references form a star pattern centered on CST:

- ConstraintEntry N:M ImplementationItem (via related_cst: string[])
- ImplementationItem N:M DeltaSetChange (via related_impl: string[])
- ValidationPlanItem N:1 ConstraintEntry (via related_cst: string)

Note: ImplementationItem, DeltaSetChange are defined in src/compilers/, not kernel/types.ts.
Compile Defense L2 verifies: for each inject CST, at least one IMPL, CHG, and VAL exist.

## Behavioral Knowledge (not in this map)

This map covers structural knowledge only (entities, fields, relationships).
Sprint Kit's identity is defined by behavioral knowledge:

| Knowledge | Location |
|---|---|
| State×Event transition matrix (15×44) | src/kernel/state-machine.ts |
| Gate Guard rules (GC-005~018) | src/kernel/gate-guard.ts |
| Compile Defense L1-L3 | src/compilers/compile-defense.ts |
| Compile I/O types (ImplementationItem, ChangeItem, DeltaSet, etc.) | src/compilers/compile.ts, compile-defense.ts |
| Global Constraints GC-001~022 | dev-docs/spec/blueprint.md §7 |
| Convergence Safety (3/5/7 thresholds) | src/kernel/constants.ts, gate-guard.ts |
| Stale Detection (2-point: gate + command) | dev-docs/spec/blueprint.md §4 |
| Exploration 6-Phase protocol | docs/agent-protocol/exploration.md |
| Pre-Apply Review 3-perspective | docs/agent-protocol/draft-compile.md |
| Feedback Classification rules | docs/agent-protocol/draft-surface.md |
| Agent protocol procedures | docs/agent-protocol/*.md |

## Reverse Index (domain concept → files)

> 1차 소비자: AI 에이전트 / 2차 소비자: PO(에이전트 경유)
> "이 도메인 개념을 변경하면 어떤 파일이 영향을 받는가?"에 답합니다.

### Scope
- src/commands/align.ts
- src/commands/apply.ts
- src/commands/close.ts
- src/commands/draft.ts
- src/compilers/compile-defense.ts
- src/compilers/compile.ts
- src/kernel/event-pipeline.ts
- src/kernel/gate-guard.ts
- src/kernel/reducer.ts
- src/kernel/state-machine.ts
- src/renderers/align-packet.ts
- src/renderers/draft-packet.ts
- src/renderers/scope-md.ts
- src/validators/validate.ts

### Event
- src/kernel/constraint-pool.ts
- src/kernel/event-pipeline.ts
- src/kernel/event-store.ts
- src/kernel/gate-guard.ts
- src/kernel/reducer.ts
- src/kernel/state-machine.ts

### State Machine
- src/commands/start.ts
- src/kernel/event-pipeline.ts
- src/kernel/gate-guard.ts
- src/kernel/state-machine.ts

### Constraint
- src/compilers/compile-defense.ts
- src/compilers/compile.ts
- src/kernel/constraint-pool.ts
- src/renderers/align-packet.ts
- src/renderers/draft-packet.ts

### Source
- src/commands/stale-check.ts
- src/commands/start.ts
- src/config/project-config.ts
- src/parsers/brief-parser.ts
- src/scanners/types.ts

### Exploration
- src/kernel/reducer.ts

### Surface
- src/kernel/reducer.ts

### Validation
- src/commands/apply.ts
- src/compilers/compile-defense.ts
- src/validators/validate.ts

### Brownfield
- src/compilers/compile-defense.ts
- src/compilers/compile.ts
- src/scanners/brownfield-builder.ts

### Feedback
- src/commands/draft.ts
- src/kernel/reducer.ts

### Snapshot
- src/kernel/reducer.ts

### Renderer / Packet
- src/renderers/align-packet.ts
- src/renderers/draft-packet.ts

## Excluded (L4: internal implementation)

Functions: sourceKey, formatPerspective, isEvidenceUnverified, isPolicyChangeRequired
Types: TransitionResult, TransitionDenied, TransitionOutcome
