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

// ── Rule 2: generators/ ↔ ontology-*.ts 양방향 차단 ──
// 생성 파이프라인(generators/)과 소비 파이프라인(ontology-*.ts)은 YAML로만 연결됩니다.
// 코드 수준의 import는 양방향 모두 금지합니다.

const GENERATORS_DIR = join(ROOT, "src/scanners/generators");
const SCANNERS_DIR = join(ROOT, "src/scanners");

// generators/ → ontology-*.ts import 차단
try {
  const generatorFiles = collectTsFiles(GENERATORS_DIR);
  for (const file of generatorFiles) {
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("import")) continue;
      if (/from\s+["'][^"']*ontology-/.test(line)) {
        violations.push({
          file: relative(ROOT, file),
          line: i + 1,
          import: line.trim(),
        });
      }
      // generators/ → scanners/types.ts import 차단 (ScanResult 직접 참조 금지)
      // "../types"는 generators/types.ts 참조이므로 허용. "../../types" 이상이 scanners/types.ts
      if (/from\s+["'][^"']*\.\.\/\.\.\/types/.test(line)) {
        violations.push({
          file: relative(ROOT, file),
          line: i + 1,
          import: line.trim(),
        });
      }
    }
  }
} catch {
  // generators/ 디렉토리가 없으면 건너뜀
}

// ontology-*.ts → generators/ import 차단
try {
  const ontologyFiles = readdirSync(SCANNERS_DIR)
    .filter((f) => f.startsWith("ontology-") && f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .map((f) => join(SCANNERS_DIR, f));

  for (const file of ontologyFiles) {
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("import")) continue;
      if (/from\s+["'][^"']*generators\//.test(line)) {
        violations.push({
          file: relative(ROOT, file),
          line: i + 1,
          import: line.trim(),
        });
      }
    }
  }
} catch {
  // scanners/ 디렉토리 없으면 건너뜀
}

// ── 결과 출력 ──

if (violations.length === 0) {
  console.log("✓ dependency direction: no violations");
  process.exit(0);
} else {
  console.error(`✗ dependency direction: ${violations.length} violation(s)`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} — ${v.import}`);
  }
  process.exit(1);
}
