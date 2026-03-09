import type { DepEdge } from "../types.js";
import { extOf } from "./utils.js";

// ─── Language detection by file extension ───

type Lang = "java" | "ts" | "python" | "go" | "kotlin";

const EXT_MAP: Record<string, Lang> = {
  ".java": "java",
  ".ts": "ts",
  ".tsx": "ts",
  ".js": "ts",
  ".jsx": "ts",
  ".mjs": "ts",
  ".cjs": "ts",
  ".py": "python",
  ".go": "go",
  ".kt": "kotlin",
  ".kts": "kotlin",
};

// ─── Safe regex helpers (no backtracking) ───

function matchAll(re: RegExp, text: string): RegExpExecArray[] {
  const results: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    results.push(m);
    if (!re.global) break;
  }
  return results;
}

// ─── Per-language detectors ───

function detectJava(content: string, filePath: string): DepEdge[] {
  // import com.example.Foo;
  const re = /^import\s+([\w.]+);/gm;
  return matchAll(re, content).map((m) => ({
    from: filePath,
    to: m[1],
    kind: "import" as const,
  }));
}

function detectTs(content: string, filePath: string): DepEdge[] {
  const edges: DepEdge[] = [];

  // import ... from "..."  or  import ... from '...'
  const importRe = /^import\s+[^;]*?\s+from\s+["']([^"']+)["']/gm;
  for (const m of matchAll(importRe, content)) {
    edges.push({ from: filePath, to: m[1], kind: "import" });
  }

  // import "..."  (side-effect import)
  const sideEffectRe = /^import\s+["']([^"']+)["']/gm;
  for (const m of matchAll(sideEffectRe, content)) {
    // Avoid duplicates with the previous pattern
    if (!edges.some((e) => e.to === m[1] && e.kind === "import")) {
      edges.push({ from: filePath, to: m[1], kind: "import" });
    }
  }

  // require("...") or require('...')
  const requireRe = /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const m of matchAll(requireRe, content)) {
    edges.push({ from: filePath, to: m[1], kind: "require" });
  }

  return edges;
}

function detectPython(content: string, filePath: string): DepEdge[] {
  const edges: DepEdge[] = [];

  // from foo.bar import Baz
  const fromRe = /^from\s+([\w.]+)\s+import\b/gm;
  for (const m of matchAll(fromRe, content)) {
    edges.push({ from: filePath, to: m[1], kind: "import" });
  }

  // import foo.bar
  const importRe = /^import\s+([\w.]+)/gm;
  for (const m of matchAll(importRe, content)) {
    edges.push({ from: filePath, to: m[1], kind: "import" });
  }

  return edges;
}

function detectGo(content: string, filePath: string): DepEdge[] {
  const edges: DepEdge[] = [];

  // Single import: import "fmt"
  const singleRe = /^import\s+"([^"]+)"/gm;
  for (const m of matchAll(singleRe, content)) {
    edges.push({ from: filePath, to: m[1], kind: "import" });
  }

  // Grouped import block: import ( "fmt" \n "net/http" )
  const groupRe = /^import\s*\(([\s\S]*?)\)/gm;
  for (const m of matchAll(groupRe, content)) {
    const lineRe = /"([^"]+)"/g;
    for (const lm of matchAll(lineRe, m[1])) {
      edges.push({ from: filePath, to: lm[1], kind: "import" });
    }
  }

  return edges;
}

function detectKotlin(content: string, filePath: string): DepEdge[] {
  const re = /^import\s+([\w.]+)/gm;
  return matchAll(re, content).map((m) => ({
    from: filePath,
    to: m[1],
    kind: "import" as const,
  }));
}

// ─── Main entry ───

export function detectImports(content: string, filePath: string): DepEdge[] {
  try {
    if (!content || content.length === 0) return [];

    const lang = EXT_MAP[extOf(filePath)];
    if (!lang) return [];

    switch (lang) {
      case "java":
        return detectJava(content, filePath);
      case "ts":
        return detectTs(content, filePath);
      case "python":
        return detectPython(content, filePath);
      case "go":
        return detectGo(content, filePath);
      case "kotlin":
        return detectKotlin(content, filePath);
      default:
        return [];
    }
  } catch {
    return [];
  }
}
