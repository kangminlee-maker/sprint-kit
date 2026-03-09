/**
 * /start command orchestration.
 *
 * Connects config → scanners → kernel event pipeline → renderers.
 * This is the first user-facing entry point of Sprint Kit.
 *
 * Steps:
 * 1. Parse input (description + source flags)
 * 2. Load .sprint-kit.yaml defaults + merge with flags
 * 3. Create scope directory
 * 4. Record scope.created event
 * 5. Write sources.yaml
 * 6. Scan each source → collect ScanResults
 * 7. Record grounding.started event
 * 8. Record grounding.completed event (with source_hashes)
 * 9. Return scan results for agent to discover constraints + render Align Packet
 *
 * Steps 10+ (constraint discovery, Align Packet rendering) are agent-driven.
 * The agent reads the scan results and uses 3-perspective checklists.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createScope, type ScopePaths } from "../kernel/scope-manager.js";
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

// ─── Input ───

export interface StartInput {
  /** Raw user input: description + optional flags */
  rawInput: string;
  /** Project root where .sprint-kit.yaml lives */
  projectRoot: string;
  /** Directory where scopes are stored */
  scopesDir: string;
  /** Scope ID (SC-YYYY-NNN format) */
  scopeId: string;
  /** Title extracted from user input */
  title: string;
  /** Entry mode: "experience" | "interface" */
  entryMode?: "experience" | "interface";
  /** Progress callback for scan feedback */
  onProgress?: (message: string) => void;
}

// ─── Output ───

export interface StartResult {
  success: true;
  paths: ScopePaths;
  scanResults: ScanResult[];
  scanErrors: ScanError[];
  sourceHashes: Record<string, string>;
  totalFiles: number;
}

export interface StartFailure {
  success: false;
  reason: string;
  step: string;
}

export type StartOutput = StartResult | StartFailure;

// ─── Main ───

export async function executeStart(input: StartInput): Promise<StartOutput> {
  const progress = input.onProgress ?? (() => {});

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

  // Step 5: Write sources.yaml
  writeSourcesYaml(paths.sourcesYaml, sources);

  // Step 6: Scan sources
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

  // Step 6.5: Check if all scans failed
  if (scanResults.length === 0 && scanErrors.length > 0) {
    const errorSummary = scanErrors.map(e => `${sourceKey(e.source)}: ${e.message}`).join("; ");
    return {
      success: false,
      reason: `모든 소스 스캔이 실패했습니다: ${errorSummary}`,
      step: "scan_sources",
    };
  }

  // Step 7: Record grounding.started
  const groundingSources = sources.map(toGroundingSource);
  const groundingStarted = appendScopeEvent(paths, {
    type: "grounding.started",
    actor: "system",
    payload: { sources: groundingSources },
  });

  if (!groundingStarted.success) {
    return { success: false, reason: wrapGateError(groundingStarted.reason), step: "grounding.started" };
  }

  // Step 8: Build source_hashes + perspective_summary + record grounding.completed
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

  // Step 9: Write reality-snapshot.json
  const realitySnapshot = {
    scope_id: input.scopeId,
    snapshot_revision: snapshotRevision,
    source_hashes: sourceHashes,
    perspective_summary: perspectiveSummary,
    scanned_at: new Date().toISOString(),
  };
  writeFileSync(paths.realitySnapshot, JSON.stringify(realitySnapshot, null, 2) + "\n", "utf-8");

  // Step 10: Write scope.md
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
