#!/usr/bin/env npx tsx
/**
 * Gate Guard: kernel/ 모듈의 의존 방향 검증.
 *
 * kernel/ 파일은 다른 src/ 모듈(commands, scanners, compilers, renderers, config, validators, parsers)을
 * import하면 안 됩니다. 이 규칙이 깨지면 단방향 DAG가 파괴됩니다.
 *
 * Usage:
 *   npx tsx scripts/check-dependency-direction.ts
 *
 * Exit codes:
 *   0 — no violations
 *   1 — violations found
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const KERNEL_DIR = join(ROOT, "src/kernel");

const FORBIDDEN_MODULES = [
  "commands", "scanners", "compilers", "renderers",
  "config", "validators", "parsers",
];

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (full.endsWith(".ts") && !full.endsWith(".test.ts") && !full.endsWith(".d.ts")) {
      results.push(full);
    }
  }
  return results;
}

const files = collectTsFiles(KERNEL_DIR);
const violations: { file: string; line: number; import: string }[] = [];

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("import")) continue;

    for (const mod of FORBIDDEN_MODULES) {
      // Match: from "../commands/...", from "../scanners/...", etc.
      const pattern = new RegExp(`from\\s+["'][^"']*\\.\\./${mod}/`);
      if (pattern.test(line)) {
        violations.push({
          file: relative(ROOT, file),
          line: i + 1,
          import: line.trim(),
        });
      }
    }
  }
}

if (violations.length === 0) {
  console.log("✓ kernel/ dependency direction: no violations");
  process.exit(0);
} else {
  console.error(`✗ kernel/ dependency direction: ${violations.length} violation(s)`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} — ${v.import}`);
  }
  process.exit(1);
}
