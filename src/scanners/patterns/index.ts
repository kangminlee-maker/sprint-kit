import type { DepEdge, ApiPattern, SchemaPattern, ConfigPattern, DocStructure } from "../types.js";
import { detectImports } from "./imports.js";
import { detectApiRoutes } from "./api-routes.js";
import { detectSchemas } from "./schemas.js";
import { detectConfigs } from "./configs.js";
import { detectDocStructure } from "./doc-structure.js";
import { extOf, isDotenvFile } from "./utils.js";

export interface DetectPatternsResult {
  deps: DepEdge[];
  apis: ApiPattern[];
  schemas: SchemaPattern[];
  configs: ConfigPattern[];
  docs: DocStructure[];
}

// Extensions recognized by at least one detector
const SOURCE_EXTS = new Set([
  ".java",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".kt",
  ".kts",
]);

const DOC_EXTS = new Set([".yaml", ".yml", ".md"]);

const CONFIG_EXTS = new Set([
  ".java",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

// SQL files for schema detection
const SQL_EXTS = new Set([".sql"]);

export function detectPatterns(content: string, filePath: string): DetectPatternsResult {
  const empty: DetectPatternsResult = { deps: [], apis: [], schemas: [], configs: [], docs: [] };

  try {
    if (!content || content.length === 0) return empty;

    const ext = extOf(filePath);
    const result: DetectPatternsResult = { deps: [], apis: [], schemas: [], configs: [], docs: [] };

    // Import detection: source files
    if (SOURCE_EXTS.has(ext)) {
      result.deps = detectImports(content, filePath);
    }

    // API route detection: source files
    if (SOURCE_EXTS.has(ext)) {
      result.apis = detectApiRoutes(content, filePath);
    }

    // Schema detection: source files (JPA, Drizzle) + SQL files
    if (SOURCE_EXTS.has(ext) || SQL_EXTS.has(ext)) {
      result.schemas = detectSchemas(content, filePath);
    }

    // Config detection: dotenv files + source files with process.env / System.getenv
    if (isDotenvFile(filePath) || CONFIG_EXTS.has(ext) || ext === ".java") {
      result.configs = detectConfigs(content, filePath);
    }

    // Doc structure detection: YAML / Markdown
    if (DOC_EXTS.has(ext)) {
      result.docs = detectDocStructure(content, filePath);
    }

    return result;
  } catch {
    return empty;
  }
}
