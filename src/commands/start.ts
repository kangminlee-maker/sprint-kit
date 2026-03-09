/**
 * /start command orchestration — 3-path branching.
 *
 * Connects config -> scanners -> kernel event pipeline -> renderers.
 * This is the first user-facing entry point of Sprint Kit.
 *
 * 3-path branching:
 *   Path A — New scope: create directory + brief template (no grounding)
 *   Path B — Brief filled: validate brief -> 3-way source merge -> grounding
 *   Path C — Resume: read event log -> return current state + next action
 *
 * Backward compatibility:
 *   When scopeId + title are provided directly (old interface), Path B logic
 *   executes immediately (existing tests keep passing).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  createScope,
  generateScopeId,
  resolveScopePaths,
  type ScopePaths,
  type BriefSourceEntry,
} from "../kernel/scope-manager.js";
import { appendScopeEvent, type PipelineResult } from "../kernel/event-pipeline.js";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";
import { renderScopeMd } from "../renderers/scope-md.js";
import { wrapGateError } from "./error-messages.js";
import {
  parseStartInput,
  loadProjectConfig,
  resolveSources,
  writeSourcesYaml,
} from "../config/project-config.js";
import { scanLocal } from "../scanners/scan-local.js";
import { scanVault } from "../scanners/scan-vault.js";
import { scanTarball, isScanError } from "../scanners/scan-tarball.js";
import { sourceKey, toGroundingSource, type SourceEntry, type ScanResult, type ScanError } from "../scanners/types.js";
import { buildBrownfield } from "../scanners/brownfield-builder.js";
import { parseBrief } from "../parsers/brief-parser.js";
import { TERMINAL_STATES } from "../kernel/types.js";

// ─── Input ───

export interface StartInput {
  /** Project name for scope ID generation (new interface) */
  projectName?: string;
  /** Raw user input: description + optional flags */
  rawInput: string;
  /** Project root where .sprint-kit.yaml lives */
  projectRoot: string;
  /** Directory where scopes are stored */
  scopesDir: string;
  /** Scope ID — optional now; auto-generated if not provided */
  scopeId?: string;
  /** Title — optional; extracted from brief or rawInput */
  title?: string;
  /** Entry mode: "experience" | "interface" */
  entryMode?: "experience" | "interface";
  /** Progress callback for scan feedback */
  onProgress?: (message: string) => void;
}

// ─── Output ───

export interface StartResult {
  success: true;
  action?: "executed";
  paths: ScopePaths;
  scanResults: ScanResult[];
  scanErrors: ScanError[];
  sourceHashes: Record<string, string>;
  totalFiles: number;
}

export interface StartInitResult {
  success: true;
  action: "initialized";
  paths: ScopePaths;
  scopeId: string;
  briefPath: string;
}

export interface StartResumeResult {
  success: true;
  action: "resume_info";
  paths: ScopePaths;
  scopeId: string;
  currentState: string;
  nextAction: string;
}

export interface StartFailure {
  success: false;
  reason: string;
  step: string;
}

export type StartOutput = StartResult | StartInitResult | StartResumeResult | StartFailure;

// ─── Main ───

export async function executeStart(input: StartInput): Promise<StartOutput> {
  const progress = input.onProgress ?? (() => {});

  // Backward compatibility: when scopeId + title are provided directly,
  // go straight to Path B execution logic (old interface).
  if (input.scopeId && input.title) {
    return executePathBDirect(input as StartInput & { scopeId: string; title: string }, progress);
  }

  // New 3-path branching: determine scopeId
  const projectName = input.projectName ?? "scope";
  const scopeId = input.scopeId ?? generateScopeId(input.scopesDir, projectName);
  const paths = resolveScopePaths(input.scopesDir, scopeId);

  // Check existing state
  const existingEvents = readEvents(paths.events);

  if (existingEvents.length > 0) {
    // PATH C: Resume
    return handleResume(paths, scopeId, existingEvents, progress);
  }

  if (!existsSync(paths.base)) {
    // PATH A: New scope — create directory + brief
    return handleNewScope(input, projectName, scopeId, paths, progress);
  }

  // Folder exists but no events — check brief
  // PATH B: Brief filled -> execute
  return handleBriefExecution(input, scopeId, paths, progress);
}

// ─── Path A: New scope ───

async function handleNewScope(
  input: StartInput,
  projectName: string,
  scopeId: string,
  _paths: ScopePaths,
  progress: (msg: string) => void,
): Promise<StartInitResult> {
  progress("새 scope를 생성합니다...");

  // Load .sprint-kit.yaml default_sources
  const config = loadProjectConfig(input.projectRoot);

  // Convert to BriefSourceEntry format for brief template
  const defaultSources: BriefSourceEntry[] = config.default_sources.map(
    (s) => toBriefSourceEntry(s),
  );

  // Create scope directory + brief template
  const paths = createScope(input.scopesDir, scopeId, {
    projectName,
    defaultSources,
  });

  progress(`brief.md가 생성되었습니다: ${paths.brief}`);

  return {
    success: true,
    action: "initialized",
    paths,
    scopeId: paths.scopeId,
    briefPath: paths.brief,
  };
}

// ─── Path B: Brief filled -> grounding ───

async function handleBriefExecution(
  input: StartInput,
  scopeId: string,
  paths: ScopePaths,
  progress: (msg: string) => void,
): Promise<StartResult | StartFailure> {
  // B-2: Read and validate brief.md
  if (!existsSync(paths.brief)) {
    return {
      success: false,
      reason: `brief.md 파일이 존재하지 않습니다: ${paths.brief}`,
      step: "brief_validation",
    };
  }

  const briefContent = readFileSync(paths.brief, "utf-8");
  const parsedBrief = parseBrief(briefContent);

  // B-2: Validation check
  if (!parsedBrief.validation.isComplete) {
    const missing = parsedBrief.validation.missingFields.join(", ");
    return {
      success: false,
      reason: `다음 필수 항목이 비어 있습니다: ${missing}. 작성 후 다시 실행해 주세요.`,
      step: "brief_validation",
    };
  }

  // B-3: Extract info from brief
  const title = parsedBrief.title;
  const description = parsedBrief.description;

  // B-4: 3-way source collection
  const parsed = parseStartInput(input.rawInput);
  const config = loadProjectConfig(input.projectRoot);
  const configSources = config.default_sources;
  const briefSources = parsedBrief.additionalSources;
  const cliSources = parsed.sources;
  const sources = resolveSources(configSources, [...briefSources, ...cliSources]);

  if (sources.length === 0) {
    return {
      success: false,
      reason: "스캔할 소스가 없습니다. .sprint-kit.yaml에 default_sources를 추가하거나, brief.md에 추가 소스를 기입하거나, /start 명령에 --add-dir, --github 등 플래그를 사용하세요.",
      step: "resolve_sources",
    };
  }

  // B-5: Record scope.created
  const createResult = appendScopeEvent(paths, {
    type: "scope.created",
    actor: "user",
    payload: {
      title,
      description,
      entry_mode: input.entryMode ?? "experience",
    },
  });

  if (!createResult.success) {
    return { success: false, reason: wrapGateError(createResult.reason), step: "scope.created" };
  }

  // B-6: Continue with grounding
  return executeGrounding(paths, scopeId, sources, progress);
}

// ─── Path B direct: backward compatibility (old interface) ───

async function executePathBDirect(
  input: StartInput & { scopeId: string; title: string },
  progress: (msg: string) => void,
): Promise<StartResult | StartFailure> {
  // Step 1: Parse input
  const parsed = parseStartInput(input.rawInput);

  // Step 2: Load config + merge sources
  const config = loadProjectConfig(input.projectRoot);
  const sources = resolveSources(config.default_sources, parsed.sources);

  if (sources.length === 0) {
    return {
      success: false,
      reason: "스캔할 소스가 없습니다. .sprint-kit.yaml에 default_sources를 추가하거나, /start 명령에 --add-dir, --github 등 플래그를 사용하세요.",
      step: "resolve_sources",
    };
  }

  // Step 3: Create scope
  const paths = createScope(input.scopesDir, input.scopeId);

  // Step 4: Record scope.created
  const createResult = appendScopeEvent(paths, {
    type: "scope.created",
    actor: "user",
    payload: {
      title: input.title,
      description: parsed.description,
      entry_mode: input.entryMode ?? "experience",
    },
  });

  if (!createResult.success) {
    return { success: false, reason: wrapGateError(createResult.reason), step: "scope.created" };
  }

  // Step 5: Write sources.yaml + grounding
  return executeGrounding(paths, input.scopeId, sources, progress);
}

// ─── Path C: Resume ───

async function handleResume(
  paths: ScopePaths,
  scopeId: string,
  existingEvents: import("../kernel/types.js").Event[],
  progress: (msg: string) => void,
): Promise<StartResumeResult> {
  const state = reduce(existingEvents);
  const currentState = state.current_state;

  let nextAction: string;

  if (TERMINAL_STATES.has(currentState)) {
    nextAction = "이 scope는 종료되었습니다. 새 scope를 만드시려면 다른 이름으로 /start를 실행해 주세요.";
  } else if (currentState === "draft") {
    // Check if grounding has not completed
    const hasGroundingCompleted = existingEvents.some(
      (e) => e.type === "grounding.completed",
    );
    if (!hasGroundingCompleted) {
      nextAction = "brief 검증 후 소스 재스캔 진행";
    } else {
      nextAction = "grounding이 진행 중입니다. 계속 진행합니다.";
    }
  } else if (currentState === "grounded") {
    nextAction = "Align Packet이 아직 생성되지 않았습니다. 계속 진행합니다.";
  } else if (currentState === "align_proposed") {
    nextAction = "Align Packet이 대기 중입니다. /align으로 결정해 주세요.";
  } else {
    // align_locked and beyond
    nextAction = `현재 ${currentState} 상태입니다. /draft로 진행해 주세요.`;
  }

  progress(`기존 scope를 재개합니다 (${currentState})`);

  return {
    success: true,
    action: "resume_info",
    paths,
    scopeId,
    currentState,
    nextAction,
  };
}

// ─── Shared grounding logic ───

async function executeGrounding(
  paths: ScopePaths,
  scopeId: string,
  sources: SourceEntry[],
  progress: (msg: string) => void,
): Promise<StartResult | StartFailure> {
  // Write sources.yaml
  writeSourcesYaml(paths.sourcesYaml, sources);

  // Scan sources
  progress(`소스 스캔을 시작합니다 (${sources.length}개 소스)`);

  const scanResults: ScanResult[] = [];
  const scanErrors: ScanError[] = [];

  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    const label = src.description ?? sourceKey(src);
    progress(`${label} 스캔 중 (${i + 1}/${sources.length})...`);

    const result = await scanSource(src);
    if (isScanError(result)) {
      scanErrors.push(result);
      progress(`${label} 스캔 실패: ${result.message}`);
    } else {
      scanResults.push(result);
    }
  }

  // Check if all scans failed
  if (scanResults.length === 0 && scanErrors.length > 0) {
    const errorSummary = scanErrors.map(e => `${sourceKey(e.source)}: ${e.message}`).join("; ");
    return {
      success: false,
      reason: `모든 소스 스캔이 실패했습니다: ${errorSummary}`,
      step: "scan_sources",
    };
  }

  // Record grounding.started
  const groundingSources = sources.map(toGroundingSource);
  const groundingStarted = appendScopeEvent(paths, {
    type: "grounding.started",
    actor: "system",
    payload: { sources: groundingSources },
  });

  if (!groundingStarted.success) {
    return { success: false, reason: wrapGateError(groundingStarted.reason), step: "grounding.started" };
  }

  // Build source_hashes + perspective_summary + record grounding.completed
  const sourceHashes: Record<string, string> = {};
  let totalFiles = 0;
  const perspectiveSummary = { experience: 0, code: 0, policy: 0 };

  for (const result of scanResults) {
    const key = sourceKey(result.source);
    const hashValues = Object.values(result.content_hashes);
    if (hashValues.length > 0) {
      sourceHashes[key] = hashValues[0];
    }
    totalFiles += result.files.length;

    // Count patterns by perspective-relevant categories
    perspectiveSummary.code += result.dependency_graph.length
      + result.api_patterns.length
      + result.schema_patterns.length
      + result.config_patterns.length;
    perspectiveSummary.experience += result.files.filter(f => f.category === "doc" || f.language === "html" || f.language === "css").length;
    perspectiveSummary.policy += result.doc_structure.length;
  }

  // Compute snapshot_revision from previous grounding events
  const currentEvents = readEvents(paths.events);
  const previousGroundings = currentEvents.filter(e => e.type === "grounding.completed").length;
  const snapshotRevision = previousGroundings + 1;

  const failedSources = scanErrors.map(e => ({
    source_key: sourceKey(e.source),
    error_type: e.error_type,
    message: e.message,
  }));

  const groundingCompleted = appendScopeEvent(paths, {
    type: "grounding.completed",
    actor: "system",
    payload: {
      snapshot_revision: snapshotRevision,
      source_hashes: sourceHashes,
      perspective_summary: perspectiveSummary,
      ...(failedSources.length > 0 ? { failed_sources: failedSources } : {}),
    },
  });

  if (!groundingCompleted.success) {
    return { success: false, reason: wrapGateError(groundingCompleted.reason), step: "grounding.completed" };
  }

  // Write reality-snapshot.json
  const realitySnapshot = {
    scope_id: scopeId,
    snapshot_revision: snapshotRevision,
    source_hashes: sourceHashes,
    perspective_summary: perspectiveSummary,
    scanned_at: new Date().toISOString(),
  };
  writeFileSync(paths.realitySnapshot, JSON.stringify(realitySnapshot, null, 2) + "\n", "utf-8");

  // Write scope.md
  const finalState = reduce(readEvents(paths.events));
  writeFileSync(paths.scopeMd, renderScopeMd(finalState), "utf-8");

  progress(`소스 스캔 완료 (파일 ${totalFiles}개)`);

  return {
    success: true,
    paths,
    scanResults,
    scanErrors,
    sourceHashes,
    totalFiles,
  };
}

// ─── Helpers ───

/**
 * Convert a SourceEntry to BriefSourceEntry format for the brief template.
 */
function toBriefSourceEntry(entry: SourceEntry): BriefSourceEntry {
  switch (entry.type) {
    case "add-dir":
      return { type: "add-dir", identifier: entry.path, description: entry.description };
    case "github-tarball":
      return { type: "github-tarball", identifier: entry.url, description: entry.description };
    case "figma-mcp":
      return { type: "figma-mcp", identifier: entry.file_key, description: entry.description };
    case "obsidian-vault":
      return { type: "obsidian-vault", identifier: entry.path, description: entry.description };
  }
}

// ─── Source dispatch ───

async function scanSource(source: SourceEntry): Promise<ScanResult | ScanError> {
  switch (source.type) {
    case "add-dir":
      return scanLocal(source);
    case "github-tarball":
      return scanTarball(source);
    case "obsidian-vault":
      return scanVault(source);
    case "figma-mcp":
      // Figma is agent-driven (MCP calls). Return empty ScanResult.
      return {
        source,
        scanned_at: new Date().toISOString(),
        files: [],
        content_hashes: {},
        dependency_graph: [],
        api_patterns: [],
        schema_patterns: [],
        config_patterns: [],
        doc_structure: [],
      };
    default: {
      const _exhaustive: never = source;
      return { source: source as SourceEntry, error_type: "parse" as const, message: `Unknown source type` };
    }
  }
}
