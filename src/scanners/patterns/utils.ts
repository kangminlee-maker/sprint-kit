/**
 * Shared utility functions for pattern detectors.
 */

/** Extract the lowercase file extension (including the dot). Returns "" if none. */
export function extOf(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot === -1 ? "" : filePath.slice(dot).toLowerCase();
}

/** Compute the 1-based line number for a given character index in content. */
export function lineNumber(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content[i] === "\n") line++;
  }
  return line;
}

/** Check if a file path refers to a dotenv file (.env, .env.local, .env.production, etc.). */
export function isDotenvFile(filePath: string): boolean {
  const basename = filePath.split("/").pop() ?? "";
  return /^\.env(\..+)?$/.test(basename);
}
