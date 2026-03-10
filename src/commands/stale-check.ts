/**
 * Stale detection: compare current source hashes with recorded source_hashes.
 *
 * Called before gate transitions (mandatory) and at command start (lightweight).
 * If stale sources are found, records snapshot.marked_stale event.
 *
 * This module does NOT re-scan sources. It only computes current hashes
 * and compares with the hashes recorded in grounding.completed.
 */

import { readFileSync, statSync, existsSync } from "node:fs";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";
import { appendScopeEvent } from "../kernel/event-pipeline.js";
import { renderScopeMd } from "../renderers/scope-md.js";
import { writeFileSync } from "node:fs";
import { computeDirectoryHash, walkDirectory, normalizePath } from "../scanners/file-utils.js";
import { contentHash } from "../kernel/hash.js";
import { readSourcesYaml } from "../config/project-config.js";
import { sourceKey, type SourceEntry } from "../scanners/types.js";
import type { ScopePaths } from "../kernel/scope-manager.js";

// ─── Output ───

export interface StaleCheckResult {
  stale: boolean;
  stale_sources: Array<{ path: string; old_hash: string; new_hash: string }>;
}

// ─── Main ───

/**
 * Check if any sources have changed since last grounding.
 * Compares current file hashes with source_hashes from grounding.completed.
 *
 * Only checks local sources (add-dir, obsidian-vault).
 * github-tarball requires network access (not checked here).
 * figma-mcp requires MCP calls (not checked here).
 */
export function checkStale(paths: ScopePaths): StaleCheckResult {
  const events = readEvents(paths.events);
  const state = reduce(events);

  // Find grounding.completed event to get recorded source_hashes
  const groundingCompleted = [...events].reverse().find(e => e.type === "grounding.completed");
  if (!groundingCompleted) {
    return { stale: false, stale_sources: [] };
  }

  const recordedHashes = (groundingCompleted.payload as { source_hashes: Record<string, string> }).source_hashes;

  // Load sources to know which ones to check
  const sources = readSourcesYaml(paths.sourcesYaml);
  const staleSources: StaleCheckResult["stale_sources"] = [];

  for (const source of sources) {
    // Only check local sources (synchronous hash comparison).
    // github-tarball: requires network access — not checked here.
    // figma-mcp: requires MCP calls — delegated to agent protocol.
    //   Agent calls get_metadata, compares lastModified, and records
    //   snapshot.marked_stale if changed. See: scanners/figma-adapter.ts
    if (source.type !== "add-dir" && source.type !== "obsidian-vault") {
      continue;
    }

    const key = sourceKey(source);
    const oldHash = recordedHashes[key];
    if (!oldHash) continue; // Source wasn't in last grounding

    const newHash = computeCurrentHash(source);
    if (newHash !== oldHash) {
      staleSources.push({ path: key, old_hash: oldHash, new_hash: newHash });
    }
  }

  return {
    stale: staleSources.length > 0,
    stale_sources: staleSources,
  };
}

/**
 * Record snapshot.marked_stale event if stale sources detected.
 * Returns true if stale was detected and recorded.
 */
export function checkAndRecordStale(paths: ScopePaths): boolean {
  const result = checkStale(paths);
  if (!result.stale) return false;

  const staleResult = appendScopeEvent(paths, {
    type: "snapshot.marked_stale",
    actor: "system",
    payload: {
      stale_sources: result.stale_sources,
    },
  });

  // Update scope.md after stale event
  if (staleResult.success) {
    const state = reduce(readEvents(paths.events));
    writeFileSync(paths.scopeMd, renderScopeMd(state), "utf-8");
  }

  return true;
}

// ─── Helpers ───

function computeCurrentHash(source: SourceEntry & { type: "add-dir" | "obsidian-vault" }): string {
  const fullPath = normalizePath(source.path);

  if (!existsSync(fullPath)) return "missing";

  try {
    const stat = statSync(fullPath);
    if (stat.isFile()) {
      return contentHash(readFileSync(fullPath, "utf-8"));
    }
    // Directory
    const files = walkDirectory(fullPath);
    return computeDirectoryHash(fullPath, files);
  } catch {
    return "error";
  }
}
