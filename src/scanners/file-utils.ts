import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, relative, extname } from "node:path";
import { contentHash } from "../kernel/hash.js";
import { getLogger } from "../logger.js";
import type { FileEntry } from "./types.js";

// ─── File Filtering ───

const ALWAYS_EXCLUDE_DIRS = new Set([".git", "node_modules", ".obsidian"]);

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg", ".webp",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".zip", ".tar", ".gz", ".bz2", ".7z", ".rar",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".exe", ".dll", ".so", ".dylib", ".class", ".jar", ".war",
  ".o", ".obj", ".pyc", ".pyo",
  ".mp3", ".mp4", ".avi", ".mov", ".flv", ".wav",
  ".sqlite", ".db",
]);

export function isBinaryFile(filePath: string): boolean {
  if (BINARY_EXTENSIONS.has(extname(filePath).toLowerCase())) {
    return true;
  }
  try {
    const buf = Buffer.alloc(512);
    const fd = require("node:fs").openSync(filePath, "r");
    const bytesRead = require("node:fs").readSync(fd, buf, 0, 512, 0);
    require("node:fs").closeSync(fd);
    for (let i = 0; i < bytesRead; i++) {
      if (buf[i] === 0) return true; // NULL byte = binary
    }
    return false;
  } catch {
    return false;
  }
}

// ─── .gitignore parsing (simplified) ───

export function loadGitignorePatterns(dirPath: string): string[] {
  const gitignorePath = join(dirPath, ".gitignore");
  if (!existsSync(gitignorePath)) return [];
  try {
    return readFileSync(gitignorePath, "utf-8")
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith("#"));
  } catch {
    return [];
  }
}

function matchesGitignore(relativePath: string, patterns: string[]): boolean {
  let excluded = false;

  for (const pattern of patterns) {
    // Negation pattern: ! prefix → force include (cancel previous exclusion)
    const isNegation = pattern.startsWith("!");
    const rawPattern = isNegation ? pattern.slice(1) : pattern;
    const cleanPattern = rawPattern.endsWith("/") ? rawPattern.slice(0, -1) : rawPattern;

    let matched = false;

    // Simple matching: exact segment match
    const segments = relativePath.split("/");
    for (const seg of segments) {
      if (seg === cleanPattern) {
        matched = true;
        break;
      }
    }

    // Wildcard patterns: *.ext
    if (!matched && cleanPattern.startsWith("*.")) {
      const ext = cleanPattern.slice(1);
      if (relativePath.endsWith(ext)) {
        matched = true;
      }
    }

    // Path prefix match (e.g. "dist/keep.js" matches pattern "dist/keep.js")
    if (!matched && cleanPattern.includes("/")) {
      if (relativePath === cleanPattern || relativePath.startsWith(cleanPattern + "/")) {
        matched = true;
      }
    }

    if (matched) {
      excluded = isNegation ? false : true;
    }
  }

  return excluded;
}

/**
 * Check if any negation pattern references a path under the given directory.
 * Used to decide whether to recurse into an otherwise-excluded directory.
 */
function hasNegationUnder(dirRelPath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (!pattern.startsWith("!")) continue;
    const rawPattern = pattern.slice(1);
    const cleanPattern = rawPattern.endsWith("/") ? rawPattern.slice(0, -1) : rawPattern;
    if (cleanPattern.startsWith(dirRelPath + "/")) {
      return true;
    }
  }
  return false;
}

// ─── Path normalization (NFC) ───

export function normalizePath(p: string): string {
  return resolve(p).normalize("NFC");
}

// ─── Walk directory ───

export interface WalkOptions {
  extraExcludeDirs?: Set<string>;
  gitignorePatterns?: string[];
}

export function walkDirectory(
  rootPath: string,
  options: WalkOptions = {},
): FileEntry[] {
  const root = normalizePath(rootPath);
  const results: FileEntry[] = [];
  const extraExclude = options.extraExcludeDirs ?? new Set();
  const gitignore = options.gitignorePatterns ?? loadGitignorePatterns(root);

  function walk(dirPath: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dirPath);
    } catch (error) {
      getLogger().debug("walkDirectory: failed to read directory", { path: dirPath, error });
      return;
    }

    for (const name of entries) {
      const fullPath = join(dirPath, name);
      const relPath = relative(root, fullPath).normalize("NFC");

      // Skip excluded directories
      if (ALWAYS_EXCLUDE_DIRS.has(name) || extraExclude.has(name)) {
        continue;
      }

      const excluded = matchesGitignore(relPath, gitignore);

      let stat;
      try {
        stat = statSync(fullPath);
      } catch (error) {
        getLogger().debug("walkDirectory: failed to stat file", { path: fullPath, error });
        continue; // broken symlink etc.
      }

      if (stat.isDirectory()) {
        // Even if the directory is excluded, recurse if negation patterns
        // reference paths under it — individual files will be checked.
        if (excluded && !hasNegationUnder(relPath, gitignore)) {
          continue;
        }
        walk(fullPath);
      } else if (excluded) {
        // File is excluded by gitignore
        continue;
      } else if (stat.isFile()) {
        // Skip binary files
        if (isBinaryFile(fullPath)) continue;

        results.push({
          path: relPath,
          category: categorizeFile(relPath),
          language: detectLanguage(relPath),
          size_bytes: stat.size,
        });
      }
      // Symlinks: statSync follows them by default. Circular symlinks
      // will fail with ELOOP and be caught by the try/catch.
    }
  }

  walk(root);
  return results;
}

// ─── Sorted concat hash ───

export function computeDirectoryHash(rootPath: string, files: FileEntry[]): string {
  const root = normalizePath(rootPath);
  const sortedPaths = files.map(f => f.path).sort();
  const hashes: string[] = [];

  for (const relPath of sortedPaths) {
    const fullPath = join(root, relPath);
    try {
      const content = readFileSync(fullPath, "utf-8");
      hashes.push(contentHash(content));
    } catch {
      hashes.push("unreadable");
    }
  }

  return contentHash(hashes.join(""));
}

// ─── File categorization ───

const LANGUAGE_MAP: Record<string, string> = {
  ".ts": "typescript", ".tsx": "typescript", ".mts": "typescript", ".cts": "typescript",
  ".js": "javascript", ".jsx": "javascript", ".mjs": "javascript", ".cjs": "javascript",
  ".java": "java", ".kt": "kotlin", ".kts": "kotlin",
  ".py": "python", ".go": "go", ".rs": "rust", ".rb": "ruby",
  ".sql": "sql",
  ".yaml": "yaml", ".yml": "yaml",
  ".json": "json",
  ".md": "markdown",
  ".html": "html", ".css": "css", ".scss": "scss",
  ".sh": "shell", ".bash": "shell",
  ".xml": "xml",
  ".toml": "toml",
  ".gradle": "gradle",
};

function detectLanguage(filePath: string): string | undefined {
  const ext = extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext];
}

const TEST_PATTERNS = [/\.test\.[^.]+$/, /\.spec\.[^.]+$/, /\/__tests__\//, /\/test\//];
const CONFIG_PATTERNS = [
  /\.env/, /\.config\.[^.]+$/, /tsconfig/, /package\.json$/, /\.eslintrc/,
  /application\.ya?ml$/, /application\.properties$/,
];
const SCHEMA_PATTERNS = [/\.sql$/, /migration/, /schema/, /\.dbml$/];
const DOC_PATTERNS = [/\.md$/, /\.mdx$/, /README/, /CHANGELOG/];

function categorizeFile(relPath: string): FileEntry["category"] {
  if (TEST_PATTERNS.some(p => p.test(relPath))) return "test";
  if (CONFIG_PATTERNS.some(p => p.test(relPath))) return "config";
  if (SCHEMA_PATTERNS.some(p => p.test(relPath))) return "schema";
  if (DOC_PATTERNS.some(p => p.test(relPath))) return "doc";
  const lang = detectLanguage(relPath);
  if (lang && !["yaml", "json", "markdown", "xml", "toml"].includes(lang)) return "source";
  return "other";
}
