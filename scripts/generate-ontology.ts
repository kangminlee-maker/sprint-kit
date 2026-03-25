#!/usr/bin/env tsx
/**
 * 온톨로지 자동 생성 CLI
 *
 * 사용법:
 *   npx tsx scripts/generate-ontology.ts --dir ./src
 *   npx tsx scripts/generate-ontology.ts --dir ./src --out-dir ./ontology
 *   echo '{"dir":"./src"}' | npx tsx scripts/generate-ontology.ts
 *
 * 입력: TypeScript/JavaScript 소스 디렉토리
 * 출력: glossary.yaml, actions.yaml, transitions.yaml (--out-dir) 또는 JSON (stdout)
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "fs";
import { join, extname, resolve } from "path";
import { z } from "zod";
import { runGeneratorPipeline } from "../src/scanners/generators/run-pipeline.js";
import type { GeneratorFileEntry, GeneratorConfigFile } from "../src/scanners/generators/types.js";

const InputSchema = z.object({
  dir: z.string(),
  out_dir: z.string().optional(),
  config_files: z.array(z.string()).optional(),
});

// ── 입력 파싱 (dual input) ──

function parseInput(): z.infer<typeof InputSchema> {
  // CLI argv
  const args = process.argv.slice(2);
  const dirIdx = args.indexOf("--dir");
  const outIdx = args.indexOf("--out-dir");
  const configIdx = args.indexOf("--config");

  if (dirIdx !== -1) {
    return InputSchema.parse({
      dir: args[dirIdx + 1],
      out_dir: outIdx !== -1 ? args[outIdx + 1] : undefined,
      config_files: configIdx !== -1 ? args[configIdx + 1]?.split(",") : undefined,
    });
  }

  // stdin JSON
  if (!process.stdin.isTTY) {
    const stdin = readFileSync(0, "utf-8").trim();
    if (stdin) {
      return InputSchema.parse(JSON.parse(stdin));
    }
  }

  console.error("Usage: generate-ontology --dir <path> [--out-dir <path>] [--config <path1,path2>]");
  process.exit(1);
}

// ── 파일 수집 ──

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const CONFIG_PATTERNS: { pattern: RegExp; format: "yaml" | "properties" | "env" }[] = [
  { pattern: /application\.ya?ml$/i, format: "yaml" },
  { pattern: /application\.properties$/i, format: "properties" },
  { pattern: /\.env(\.\w+)?$/i, format: "env" },
];

function collectFiles(dir: string): GeneratorFileEntry[] {
  const files: GeneratorFileEntry[] = [];
  const absDir = resolve(dir);

  function walk(currentDir: string): void {
    for (const entry of readdirSync(currentDir)) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "dist" || entry === "build") continue;
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (SOURCE_EXTENSIONS.has(extname(entry))) {
        // test 파일 제외
        if (entry.includes(".test.") || entry.includes(".spec.")) continue;
        const relativePath = fullPath.substring(absDir.length + 1);
        files.push({ path: relativePath, content: readFileSync(fullPath, "utf-8") });
      }
    }
  }

  walk(absDir);
  return files;
}

function collectConfigFiles(paths: string[]): GeneratorConfigFile[] {
  const configs: GeneratorConfigFile[] = [];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    const content = readFileSync(p, "utf-8");
    const matched = CONFIG_PATTERNS.find((c) => c.pattern.test(p));
    if (matched) {
      configs.push({ path: p, content, format: matched.format });
    }
  }
  return configs;
}

// ── 메인 ──

function main(): void {
  const input = parseInput();
  const dir = resolve(input.dir);

  if (!existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }

  const files = collectFiles(dir);
  if (files.length === 0) {
    console.error(`No source files found in: ${dir}`);
    process.exit(1);
  }

  const configFiles = input.config_files ? collectConfigFiles(input.config_files) : [];

  const result = runGeneratorPipeline({
    files,
    dependency_graph: [],
    config_files: configFiles.length > 0 ? configFiles : undefined,
  });

  if (input.out_dir) {
    const outDir = resolve(input.out_dir);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    if (result.yaml.glossary) writeFileSync(join(outDir, "glossary.yaml"), result.yaml.glossary);
    if (result.yaml.actions) writeFileSync(join(outDir, "actions.yaml"), result.yaml.actions);
    if (result.yaml.transitions) writeFileSync(join(outDir, "transitions.yaml"), result.yaml.transitions);

    console.log(JSON.stringify({
      status: "success",
      files_written: [
        result.yaml.glossary ? "glossary.yaml" : null,
        result.yaml.actions ? "actions.yaml" : null,
        result.yaml.transitions ? "transitions.yaml" : null,
      ].filter(Boolean),
      meta: result.meta,
      warnings: result.yaml.warnings,
    }, null, 2));
  } else {
    console.log(JSON.stringify({
      glossary: result.yaml.glossary,
      actions: result.yaml.actions,
      transitions: result.yaml.transitions,
      warnings: result.yaml.warnings,
      meta: result.meta,
    }, null, 2));
  }
}

main();
