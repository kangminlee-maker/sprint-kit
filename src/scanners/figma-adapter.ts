import { sourceKey, type SourceEntry } from "./types.js";

/**
 * Adapter for figma-mcp source hash generation.
 *
 * figma-mcp has no automated Scanner. The agent calls Figma MCP directly
 * during grounding and records hashes via these helper functions.
 *
 * Stale detection for figma-mcp is delegated to the agent protocol:
 * - The agent calls `get_metadata` to obtain `lastModified`
 * - If changed, the agent records `snapshot.marked_stale` via appendScopeEvent
 * - stale-check.ts intentionally skips figma-mcp (only checks local sources)
 *
 * See: commands/stale-check.ts, docs/agent-protocol/start.md
 */
export function figmaSourceHashKey(source: SourceEntry & { type: "figma-mcp" }): string {
  return sourceKey(source);
}

/**
 * Generate a source_hashes entry for a Figma source.
 *
 * @param source - The figma-mcp source entry
 * @param lastModified - The lastModified timestamp from Figma API
 * @returns A { key, value } pair for source_hashes
 */
export function figmaSourceHash(
  source: SourceEntry & { type: "figma-mcp" },
  lastModified: string,
): { key: string; value: string } {
  return {
    key: sourceKey(source),
    value: lastModified,
  };
}
