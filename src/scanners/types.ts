import type { SourceType } from "../kernel/types.js";

// ─── Source Entry (config 수준) ───

export type SourceEntry =
  | { type: "add-dir"; path: string; description?: string }
  | { type: "github-tarball"; url: string; description?: string }
  | { type: "figma-mcp"; file_key: string; description?: string }
  | { type: "obsidian-vault"; path: string; description?: string };

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

// ─── Scan Error ───

export interface ScanError {
  source: SourceEntry;
  error_type: "network" | "auth" | "not_found" | "timeout" | "parse" | "io";
  message: string;
}
