import { sourceKey, type SourceEntry } from "./types.js";

/**
 * Adapter for figma-mcp source hash generation.
 *
 * Since figma-mcp has no Scanner (agent calls MCP directly),
 * this adapter ensures source_hashes key follows the `{type}:{identifier}` convention.
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
