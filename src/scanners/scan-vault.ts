import { statSync } from "node:fs";
import { normalizePath } from "./file-utils.js";
import { scanDirectory } from "./scan-local.js";
import { sourceKey, emptyScanResult } from "./types.js";
import type { ScanResult, SourceEntry } from "./types.js";

/**
 * Scan an Obsidian vault directory.
 * Delegates to scanDirectory (shared with scanLocal) and re-keys the result
 * so that content_hashes uses "obsidian-vault:{path}" instead of "add-dir:{path}".
 */
export function scanVault(source: SourceEntry & { type: "obsidian-vault" }): ScanResult {
  const fullPath = normalizePath(source.path);
  try {
    const stat = statSync(fullPath);
    if (!stat.isDirectory()) {
      return emptyScanResult(source);
    }
  } catch {
    return emptyScanResult(source);
  }

  // .obsidian/ is already in ALWAYS_EXCLUDE_DIRS in file-utils.ts
  const result = scanDirectory(source, fullPath);

  // Ensure content_hashes key uses obsidian-vault:{path} and source is the original
  const vaultKey = sourceKey(source);
  const hashes: Record<string, string> = {};
  for (const value of Object.values(result.content_hashes)) {
    hashes[vaultKey] = value;
  }

  return {
    ...result,
    source,
    content_hashes: hashes,
  };
}
