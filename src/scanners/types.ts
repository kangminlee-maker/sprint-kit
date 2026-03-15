import type { SourceType, SourceEntry } from "../kernel/types.js";
import { sourceKey } from "../kernel/types.js";

// ─── Source Entry (re-exported from kernel) ───

export { type SourceEntry, sourceKey } from "../kernel/types.js";

// ─── Scan Result ───

export interface ScanResult {
  source: SourceEntry;
  scanned_at: string;
  files: FileEntry[];
  content_hashes: Record<string, string>;
  dependency_graph: DepEdge[];
  api_patterns: ApiPattern[];
  schema_patterns: SchemaPattern[];
  config_patterns: ConfigPattern[];
  doc_structure: DocStructure[];
  response_etag?: string;
}

export interface FileEntry {
  path: string;
  category: "source" | "config" | "schema" | "doc" | "test" | "other";
  language?: string;
  size_bytes: number;
}

export interface DepEdge {
  from: string;
  to: string;
  kind: "import" | "require" | "dynamic";
}

export interface ApiPattern {
  file: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  line: number;
}

export interface SchemaPattern {
  file: string;
  table: string;
  columns: string;
  line: number;
}

export interface ConfigPattern {
  file: string;
  key: string;
  source_type: "env" | "config_file" | "dotenv";
  line: number;
}

export interface DocStructure {
  file: string;
  format: "yaml" | "markdown" | "json";
  frontmatter?: Record<string, unknown>;
  headings?: string[];
  top_level_keys?: string[];
  item_counts?: Record<string, number>;
}

// ─── Pattern Detector Interface ───

export type PatternResult = DepEdge | ApiPattern | SchemaPattern | ConfigPattern;

export interface PatternDetector {
  name: string;
  detect(content: string, filePath: string): PatternResult[];
}

// ─── Normalize to GroundingStartedPayload format ───

export function toGroundingSource(entry: SourceEntry): { type: SourceType; path_or_url: string } {
  switch (entry.type) {
    case "add-dir":
      return { type: "add-dir", path_or_url: entry.path };
    case "github-tarball":
      return { type: "github-tarball", path_or_url: entry.url };
    case "figma-mcp":
      return { type: "figma-mcp", path_or_url: entry.file_key };
    case "obsidian-vault":
      return { type: "obsidian-vault", path_or_url: entry.path };
    case "mcp":
      return { type: "mcp", path_or_url: entry.provider };
  }
}

// ─── Empty Scan Result Factory ───

export function emptyScanResult(source: SourceEntry): ScanResult {
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
}

// ─── Scan Skipped (ETag cache hit — 304 Not Modified) ───

export interface ScanSkipped {
  skipped: true;
  source: SourceEntry;
  previous_hash: string;
}

export function isScanSkipped(
  result: ScanResult | ScanError | ScanSkipped,
): result is ScanSkipped {
  return "skipped" in result && (result as ScanSkipped).skipped === true;
}

// ─── Scan Error ───

export interface ScanError {
  source: SourceEntry;
  error_type: "network" | "auth" | "not_found" | "timeout" | "parse" | "io";
  message: string;
}
