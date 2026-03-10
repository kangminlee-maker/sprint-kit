// ─── States ───

export const STATES = [
  "draft",
  "grounded",
  "align_proposed",
  "align_locked",
  "surface_iterating",
  "surface_confirmed",
  "constraints_resolved",
  "target_locked",
  "compiled",
  "applied",
  "validated",
  "closed",
  "deferred",
  "rejected",
] as const;

export type State = (typeof STATES)[number];

export const TERMINAL_STATES: ReadonlySet<State> = new Set([
  "closed",
  "deferred",
  "rejected",
]);

// ─── Event Types ───

// Transition events: state changes defined in the matrix
export const TRANSITION_EVENT_TYPES = [
  "scope.created",
  "scope.closed",
  "input.attached",
  "grounding.started",
  "grounding.completed",
  "snapshot.marked_stale",
  "align.proposed",
  "align.revised",
  "align.locked",
  "redirect.to_grounding",
  "redirect.to_align",
  "surface.change_required",
  "surface.generated",
  "surface.revision_requested",
  "surface.revision_applied",
  "surface.confirmed",
  "constraint.discovered",
  "constraint.decision_recorded",
  "constraint.clarify_requested",
  "constraint.clarify_resolved",
  "constraint.invalidated",
  "target.locked",
  "compile.started",
  "compile.completed",
  "compile.constraint_gap_found",
  "apply.started",
  "apply.completed",
  "apply.decision_gap_found",
  "validation.started",
  "validation.completed",
] as const;

export type TransitionEventType = (typeof TRANSITION_EVENT_TYPES)[number];

// Global events: same behavior from every non-terminal state
export const GLOBAL_EVENT_TYPES = [
  "scope.deferred",
  "scope.rejected",
] as const;

export type GlobalEventType = (typeof GLOBAL_EVENT_TYPES)[number];

// Observational events: no state change, allowed in non-terminal states
export const OBSERVATIONAL_EVENT_TYPES = [
  "feedback.classified",
  "convergence.warning",
  "convergence.diagnosis",
  "convergence.blocked",
  "convergence.action_taken",
  "draft_packet.rendered",
] as const;

export type ObservationalEventType =
  (typeof OBSERVATIONAL_EVENT_TYPES)[number];

export type EventType =
  | TransitionEventType
  | GlobalEventType
  | ObservationalEventType;

// ─── Actor ───

export type Actor = "user" | "system" | "agent";

// ─── Perspective ───

export type Perspective = "experience" | "code" | "policy";

// ─── Severity ───

export type Severity = "required" | "recommended";

// ─── Decision Owner ───

export type DecisionOwner = "product_owner" | "builder";

// ─── Constraint Decision ───

export type ConstraintDecision =
  | "inject"
  | "defer"
  | "override"
  | "clarify"
  | "modify-direction";

// ─── Discovery Stage ───

export type DiscoveryStage =
  | "grounding"
  | "draft_surface_gen" // Surface 생성 직후 품질 체크에서 발견
  | "draft_phase1"
  | "draft_phase2"
  | "compile"
  | "apply";

// ─── Feedback Classification ───

export type FeedbackClassification =
  | "surface_only"
  | "constraint_decision"
  | "target_change"
  | "direction_change";

// ─── Entry Mode ───

export type EntryMode = "experience" | "interface";

// ─── Surface Type ───

export type SurfaceType = "experience" | "interface";

// ─── Source Type ───

export type SourceType =
  | "add-dir"
  | "github-tarball"
  | "figma-mcp"
  | "obsidian-vault";

// ─── Source Entry (config 수준) ───

export type SourceEntry =
  | { type: "add-dir"; path: string; description?: string }
  | { type: "github-tarball"; url: string; description?: string }
  | { type: "figma-mcp"; file_key: string; description?: string }
  | { type: "obsidian-vault"; path: string; description?: string };

// ─── Source Key ───

export function sourceKey(entry: SourceEntry): string {
  switch (entry.type) {
    case "add-dir":
      return `add-dir:${entry.path}`;
    case "github-tarball":
      return `github-tarball:${entry.url}`;
    case "figma-mcp":
      return `figma-mcp:${entry.file_key}`;
    case "obsidian-vault":
      return `obsidian-vault:${entry.path}`;
  }
}

// ─── Brownfield Types ───

export interface BrownfieldFileEntry {
  path: string;
  role: string;
  detail_anchor: string;
}

export interface BrownfieldDepEntry {
  module: string;
  depends_on: string;
  detail_anchor: string;
}

export interface BrownfieldApiEntry {
  endpoint: string;
  method: string;
  description: string;
  detail_anchor: string;
}

export interface BrownfieldSchemaEntry {
  table: string;
  columns: string;
  detail_anchor: string;
}

export interface BrownfieldConfigEntry {
  key: string;
  description: string;
  detail_anchor: string;
}

export interface BrownfieldContext {
  related_files: BrownfieldFileEntry[];
  module_dependencies: BrownfieldDepEntry[];
  api_contracts?: BrownfieldApiEntry[];
  db_schemas?: BrownfieldSchemaEntry[];
  config_env?: BrownfieldConfigEntry[];
}

export interface BrownfieldDetail {
  scope_id: string;
  sections: BrownfieldDetailSection[];
}

export interface BrownfieldDetailSection {
  anchor: string;
  source: string;
  title: string;
  content: string;
}

// ─── Validation Plan Types ───

export interface ValidationPlanEntry {
  val_id: string;
  related_cst: string;
  decision_type: "inject" | "defer" | "override";
}

export interface ValidationPlanItem extends ValidationPlanEntry {
  target: string;
  method: string;
  pass_criteria: string;
  fail_action: string;
  edge_cases?: Array<{
    scenario: string;
    expected_result: string;
  }>;
}

// ─── Reality Snapshot ───

export interface RealitySnapshot {
  scope_id: string;
  snapshot_revision: number;
  source_hashes: Record<string, string>;
  perspective_summary: Record<Perspective, number>;
  scanned_at: string;
}

// ─── Format Utilities ───

export function formatPerspective(p: string): string {
  switch (p) {
    case "experience": return "Experience";
    case "code": return "Code";
    case "policy": return "Policy";
    default: return p;
  }
}

// ─── Validation Result ───

export type ValidationResult = "pass" | "fail";

// ─── Payloads (discriminated by event type) ───

export interface ScopeCreatedPayload {
  title: string;
  description: string;
  entry_mode: EntryMode;
}

export interface ScopeClosedPayload {}

export interface ScopeDeferredPayload {
  reason: string;
  resume_condition: string;
}

export interface ScopeRejectedPayload {
  reason: string;
  rejection_basis: string;
}

export interface InputAttachedPayload {
  filename: string;
  path: string;
}

export interface GroundingStartedPayload {
  sources: Array<{ type: SourceType; path_or_url: string }>;
}

export interface GroundingCompletedPayload {
  snapshot_revision: number;
  source_hashes: Record<string, string>;
  perspective_summary: Record<Perspective, number>;
  failed_sources?: Array<{ source_key: string; error_type: string; message: string }>;
}

export interface SnapshotMarkedStalePayload {
  stale_sources: Array<{
    path: string;
    old_hash: string;
    new_hash: string;
  }>;
}

export interface AlignProposedPayload {
  packet_path: string;
  packet_hash: string;
  snapshot_revision: number;
}

export interface AlignRevisedPayload {
  revision_count: number;
  feedback_scope: string;
  feedback_text: string;
  packet_path: string;
  packet_hash: string;
}

export interface AlignLockedPayload {
  locked_direction: string;
  locked_scope_boundaries: {
    in: string[];
    out: string[];
  };
  locked_in_out: boolean;
}

export interface RedirectToGroundingPayload {
  from_state: State;
  reason: string;
}

export interface RedirectToAlignPayload {
  from_state: State;
  reason: string;
}

export interface SurfaceChangeRequiredPayload {
  constraint_id: string;
  reason: string;
}

export interface SurfaceGeneratedPayload {
  surface_type: SurfaceType;
  surface_path: string;
  content_hash: string;
  based_on_snapshot: number;
  ontology_sections_used?: string[]; // audit trail: which ontology sections the agent referenced
}

export interface SurfaceRevisionRequestedPayload {
  feedback_text: string;
}

export interface SurfaceRevisionAppliedPayload {
  revision_count: number;
  surface_path: string;
  content_hash: string;
}

export interface SurfaceConfirmedPayload {
  final_surface_path: string;
  final_content_hash: string;
  total_revisions: number;
}

export interface ConstraintDiscoveredPayload {
  constraint_id: string;
  perspective: Perspective;
  summary: string;
  severity: Severity;
  discovery_stage: DiscoveryStage;
  decision_owner: DecisionOwner;
  impact_if_ignored: string;
  source_refs: Array<{ source: string; detail: string }>;
}

export interface ConstraintDecisionRecordedPayload {
  constraint_id: string;
  decision: ConstraintDecision;
  selected_option: string;
  decision_owner: DecisionOwner;
  rationale: string;
}

export interface ConstraintClarifyRequestedPayload {
  constraint_id: string;
  question: string;
  asked_to: string;
}

export interface ConstraintClarifyResolvedPayload {
  constraint_id: string;
  resolution: string;
  decision: ConstraintDecision;
  selected_option: string;
  decision_owner: DecisionOwner;
  rationale: string;
}

export interface ConstraintInvalidatedPayload {
  constraint_id: string;
  reason: string;
}

export interface TargetLockedPayload {
  surface_hash: string;
  constraint_decisions: Array<{
    constraint_id: string;
    decision: ConstraintDecision;
  }>;
}

export interface CompileStartedPayload {
  snapshot_revision: number;
  surface_hash: string;
}

export interface CompileCompletedPayload {
  build_spec_path: string;
  build_spec_hash: string;
  brownfield_detail_path: string;
  brownfield_detail_hash: string;
  delta_set_path: string;
  delta_set_hash: string;
  validation_plan_path: string;
  validation_plan_hash: string;
}

export interface CompileConstraintGapFoundPayload {
  new_constraint_id: string;
  perspective: Perspective;
  summary: string;
}

export interface ApplyStartedPayload {
  build_spec_hash: string;
}

export interface ApplyCompletedPayload {
  result: string;
}

export interface ApplyDecisionGapFoundPayload {
  new_constraint_id: string;
  description: string;
}

export interface ValidationStartedPayload {
  validation_plan_hash: string;
}

export interface ValidationItemResult {
  val_id: string;
  related_cst: string;
  result: ValidationResult;
  detail: string;
}

export interface ValidationCompletedPayload {
  result: ValidationResult;
  pass_count: number;
  fail_count: number;
  items: ValidationItemResult[];
}

// Observational payloads

export interface FeedbackClassifiedPayload {
  classification: FeedbackClassification;
  confidence: number;
  confirmed_by: "auto" | "user";
}

export interface ConvergenceWarningPayload {
  state: State;
  revision_count: number;
  pattern_summary: string;
}

export interface ConvergenceDiagnosisPayload {
  state: State;
  revision_count: number;
  diagnosis: string;
  options: string[];
}

export interface ConvergenceBlockedPayload {
  state: State;
  revision_count: number;
  requires_action: boolean;
}

export interface ConvergenceActionTakenPayload {
  state: State;
  chosen_action: string;
  reason: string;
}

export interface DraftPacketRenderedPayload {
  packet_path: string;
  packet_hash: string;
  surface_hash: string;
  constraint_count: number;
  required_count: number;
  recommended_count: number;
  invalidated_count: number;
}

// ─── Payload Map (type → payload) ───

export interface PayloadMap {
  "scope.created": ScopeCreatedPayload;
  "scope.closed": ScopeClosedPayload;
  "scope.deferred": ScopeDeferredPayload;
  "scope.rejected": ScopeRejectedPayload;
  "input.attached": InputAttachedPayload;
  "grounding.started": GroundingStartedPayload;
  "grounding.completed": GroundingCompletedPayload;
  "snapshot.marked_stale": SnapshotMarkedStalePayload;
  "align.proposed": AlignProposedPayload;
  "align.revised": AlignRevisedPayload;
  "align.locked": AlignLockedPayload;
  "redirect.to_grounding": RedirectToGroundingPayload;
  "redirect.to_align": RedirectToAlignPayload;
  "surface.change_required": SurfaceChangeRequiredPayload;
  "surface.generated": SurfaceGeneratedPayload;
  "surface.revision_requested": SurfaceRevisionRequestedPayload;
  "surface.revision_applied": SurfaceRevisionAppliedPayload;
  "surface.confirmed": SurfaceConfirmedPayload;
  "constraint.discovered": ConstraintDiscoveredPayload;
  "constraint.decision_recorded": ConstraintDecisionRecordedPayload;
  "constraint.clarify_requested": ConstraintClarifyRequestedPayload;
  "constraint.clarify_resolved": ConstraintClarifyResolvedPayload;
  "constraint.invalidated": ConstraintInvalidatedPayload;
  "target.locked": TargetLockedPayload;
  "compile.started": CompileStartedPayload;
  "compile.completed": CompileCompletedPayload;
  "compile.constraint_gap_found": CompileConstraintGapFoundPayload;
  "apply.started": ApplyStartedPayload;
  "apply.completed": ApplyCompletedPayload;
  "apply.decision_gap_found": ApplyDecisionGapFoundPayload;
  "validation.started": ValidationStartedPayload;
  "validation.completed": ValidationCompletedPayload;
  "feedback.classified": FeedbackClassifiedPayload;
  "convergence.warning": ConvergenceWarningPayload;
  "convergence.diagnosis": ConvergenceDiagnosisPayload;
  "convergence.blocked": ConvergenceBlockedPayload;
  "convergence.action_taken": ConvergenceActionTakenPayload;
  "draft_packet.rendered": DraftPacketRenderedPayload;
}

// ─── Event (discriminated union) ───

export type Event<T extends EventType = EventType> = {
  event_id: string;
  scope_id: string;
  type: T;
  ts: string;
  revision: number;
  actor: Actor;
  state_before: State | null;
  state_after: State;
  payload: T extends keyof PayloadMap ? PayloadMap[T] : never;
};

// ─── Constraint Status (reducer output) ───

export type ConstraintStatus =
  | "undecided"
  | "decided"
  | "clarify_pending"
  | "invalidated";

export interface ConstraintEntry {
  constraint_id: string;
  perspective: Perspective;
  summary: string;
  severity: Severity;
  discovery_stage: DiscoveryStage;
  decision_owner: DecisionOwner;
  impact_if_ignored: string;
  source_refs: Array<{ source: string; detail: string }>;
  status: ConstraintStatus;
  invalidation_reason?: string;
  decision?: ConstraintDecision;
  selected_option?: string;
  rationale?: string;
  discovered_at: number; // revision
  decided_at?: number; // revision
}

export interface ConstraintPool {
  constraints: ConstraintEntry[];
  summary: {
    total: number;
    required: number;
    recommended: number;
    decided: number;
    clarify_pending: number;
    invalidated: number;
    undecided: number;
  };
}

// ─── Verdict Log Entry ───

export type VerdictLogEntry =
  | {
      type: "align.locked";
      revision: number;
      ts: string;
      locked_direction: string;
    }
  | {
      type: "constraint.decision_recorded";
      revision: number;
      ts: string;
      constraint_id: string;
      decision: ConstraintDecision;
      decision_owner: DecisionOwner;
    }
  | {
      type: "constraint.clarify_resolved";
      revision: number;
      ts: string;
      constraint_id: string;
      decision: ConstraintDecision;
      decision_owner: DecisionOwner;
    };

// ─── ScopeState (reducer output) ───

export interface ScopeState {
  scope_id: string;
  title: string;
  description: string;
  entry_mode: EntryMode;
  current_state: State;
  direction?: string;
  scope_boundaries?: { in: string[]; out: string[] };
  surface_hash?: string;
  surface_path?: string; // from surface.confirmed final_surface_path
  constraint_pool: ConstraintPool;
  grounding_sources?: Array<{ type: SourceType; path_or_url: string }>;
  stale: boolean;
  stale_sources?: Array<{ path: string; old_hash: string; new_hash: string }>;
  stale_since?: number; // revision of the snapshot.marked_stale event
  compile_ready: boolean;
  convergence_blocked: boolean;
  revision_count_align: number;
  revision_count_surface: number;
  retry_count_compile: number;
  snapshot_revision: number; // revision of the latest grounding.completed event
  validation_plan_hash?: string;
  validation_result?: { result: ValidationResult; pass_count: number; fail_count: number; items: ValidationItemResult[] };
  last_backward_reason?: string;
  verdict_log: VerdictLogEntry[];
  feedback_history: FeedbackClassifiedPayload[];
  latest_revision: number;
}

// ─── Renderer Input Types ───

export interface AlignPacketContent {
  user_original_text: string;
  interpreted_direction: string;
  proposed_scope: { in: string[]; out: string[] };
  scenarios: string[];
  as_is: {
    experience: string;
    policy: string;
    code: string;
    code_details?: string;
  };
  tensions: Array<{
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
  }>;
  decision_questions: string[];
  interface_extras?: {
    api_scope: string;
    breaking_change: string;
    version_policy: string;
  };
}

export type ConstraintDetailPO = {
  constraint_id: string;
  decision_owner: "product_owner";
  situation: string;
  options_table: Array<{
    choice: string;
    pros: string;
    description: string;
    risk: string;
    reversal_cost: string;
  }>;
  recommendation: string;
};

export type ConstraintDetailBuilder = {
  constraint_id: string;
  decision_owner: "builder";
  situation: string;
  builder_decision: string;
  builder_judgment: string;
  guardrail?: string;
};

export type ConstraintDetail = ConstraintDetailPO | ConstraintDetailBuilder;

export interface DraftPacketContent {
  // Section 1: 확정된 Surface
  surface_path: string;
  run_command?: string;
  mockup_revisions?: number;
  scenario_guide: Array<{
    scenario: string;
    start: string;
    steps: string;
    confirmed: string;
  }>;

  // Section 3: 결정이 필요한 항목 (개별 상세)
  // "처리하지 않으면"은 pool.impact_if_ignored 단일 소스
  constraint_details: ConstraintDetail[];

  // Section 5: 제약 조건
  guardrails: string[];

  // Section 6: 질문
  decision_questions: string[];
}

// ─── Transition Result ───

export type TransitionKind = "forward" | "self" | "backward";

export interface TransitionResult {
  allowed: true;
  next_state: State;
  kind: TransitionKind;
  /** Other possible target states when context (e.g. constraint pool) determines the outcome. */
  conditional_targets?: State[];
}

export interface TransitionDenied {
  allowed: false;
}

export type TransitionOutcome = TransitionResult | TransitionDenied;
