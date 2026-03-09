import type { ConfigPattern } from "../types.js";
import { lineNumber, isDotenvFile } from "./utils.js";

// ─── .env file (KEY=value) ───

function detectDotenv(content: string, filePath: string): ConfigPattern[] {
  const results: ConfigPattern[] = [];
  // KEY=value (skip comments and empty lines)
  const re = /^([A-Za-z_][A-Za-z0-9_]*)=/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    // Skip if preceded by # comment on same line
    const lineStart = content.lastIndexOf("\n", m.index) + 1;
    const before = content.slice(lineStart, m.index).trim();
    if (before.startsWith("#")) continue;

    results.push({
      file: filePath,
      key: m[1],
      source_type: "dotenv",
      line: lineNumber(content, m.index),
    });
  }
  return results;
}

// ─── process.env.KEY or process.env["KEY"] ───

function detectProcessEnv(content: string, filePath: string): ConfigPattern[] {
  const results: ConfigPattern[] = [];

  // process.env.KEY
  const dotRe = /\bprocess\.env\.([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = dotRe.exec(content)) !== null) {
    results.push({
      file: filePath,
      key: m[1],
      source_type: "env",
      line: lineNumber(content, m.index),
    });
  }

  // process.env["KEY"] or process.env['KEY']
  const bracketRe = /\bprocess\.env\s*\[\s*["']([^"']+)["']\s*\]/g;
  while ((m = bracketRe.exec(content)) !== null) {
    results.push({
      file: filePath,
      key: m[1],
      source_type: "env",
      line: lineNumber(content, m.index),
    });
  }

  return results;
}

// ─── System.getenv("KEY") ───

function detectSystemGetenv(content: string, filePath: string): ConfigPattern[] {
  const results: ConfigPattern[] = [];
  const re = /\bSystem\.getenv\s*\(\s*"([^"]+)"\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    results.push({
      file: filePath,
      key: m[1],
      source_type: "env",
      line: lineNumber(content, m.index),
    });
  }
  return results;
}

// ─── Main entry ───

export function detectConfigs(content: string, filePath: string): ConfigPattern[] {
  try {
    if (!content || content.length === 0) return [];

    const results: ConfigPattern[] = [];

    if (isDotenvFile(filePath)) {
      results.push(...detectDotenv(content, filePath));
    }

    results.push(...detectProcessEnv(content, filePath));
    results.push(...detectSystemGetenv(content, filePath));

    return results;
  } catch {
    return [];
  }
}
