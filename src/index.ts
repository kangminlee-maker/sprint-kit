/**
 * sprint-kit public API.
 *
 * CLI, adapters, and external consumers should import from this file only.
 * Do NOT import kernel internals (reducer, event-pipeline, gate-guard) directly.
 */

// ─── Commands (orchestration) ───

export { executeStart, findExistingScope } from "./commands/start.js";
export type { StartInput, StartOutput, StartResult, StartInitResult, StartResumeResult, StartFailure } from "./commands/start.js";

export { executeAlign } from "./commands/align.js";
export type { AlignInput, AlignOutput } from "./commands/align.js";

export { executeDraft } from "./commands/draft.js";
export type { DraftInput, DraftAction, DraftResult, DraftFailure, DraftOutput } from "./commands/draft.js";

export { executeApply } from "./commands/apply.js";
export type { ApplyAction, ApplyOutput } from "./commands/apply.js";

export { executeClose, executeDefer } from "./commands/close.js";
export type { CloseOutput } from "./commands/close.js";

export { checkStale, checkAndRecordStale } from "./commands/stale-check.js";
export type { StaleCheckResult } from "./commands/stale-check.js";

// ─── Scope Management ───

export { resolveScopePaths, generateScopeId, createScope, normalizeProjectName } from "./kernel/scope-manager.js";
export type { ScopePaths } from "./kernel/scope-manager.js";

// ─── Config ───

export { loadProjectConfig, resolveSources, readSourcesYaml, writeSourcesYaml, parseStartInput } from "./config/project-config.js";
export type { ProjectConfig, ParsedStartInput } from "./config/project-config.js";

// ─── Renderers (pure functions) ───

export { renderAlignPacket } from "./renderers/align-packet.js";
export { renderDraftPacket } from "./renderers/draft-packet.js";
export { renderScopeMd } from "./renderers/scope-md.js";

// ─── Compilers (pure functions) ───

export { compile } from "./compilers/compile.js";
export type { CompileInput, CompileSuccess, CompileFailure } from "./compilers/compile.js";

// ─── Validators (pure functions) ───

export { validate } from "./validators/validate.js";

// ─── Hash ───

export { contentHash } from "./kernel/hash.js";

// ─── Core types (read-only access to kernel types) ───

export type {
  State,
  EventType,
  Actor,
  Perspective,
  Severity,
  DecisionOwner,
  ConstraintDecision,
  DiscoveryStage,
  AssumptionStatus,
  EntryMode,
  SurfaceType,
  SourceType,
  ScopeState,
  AlignPacketContent,
  DraftPacketContent,
  Event,
  ConstraintPool,
  ConstraintEntry,
} from "./kernel/types.js";
