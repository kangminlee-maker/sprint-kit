#!/usr/bin/env npx tsx
/**
 * Visual QA script for Surface mockup verification.
 *
 * Checks:
 * 1. vite build succeeds (all tools)
 * 2. Screenshot comparison with design ontology (Claude Code only, via Chrome)
 *
 * Exit codes:
 *   0 — QA passed (or SKIP: tool does not support visual check)
 *   1 — Build failed
 *   2 — Visual check failed (design mismatch)
 *
 * Output format (JSON):
 *   { "status": "pass" | "fail" | "skip", "details": "..." }
 *
 * Usage:
 *   npx tsx scripts/visual-qa.ts --surface-path surface/preview/
 *   echo '{"surface_path":"surface/preview/"}' | npx tsx scripts/visual-qa.ts
 *
 * This script does NOT record events. It reports results to the agent.
 * The agent decides whether to fix issues or proceed.
 *
 * Tool compatibility:
 *   - Claude Code: hook calls this after surface file writes
 *   - Codex/Cursor: agent calls this directly after surface generation
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

// ─── Input schema (stdin JSON or CLI argv) ───

const InputSchema = z.object({
  surface_path: z.string(),
  project_root: z.string().optional(),
});

type Input = z.infer<typeof InputSchema>;

// ─── Parse input from stdin or argv ───

async function parseInput(): Promise<Input> {
  // Try stdin first (non-TTY means piped input)
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString("utf-8").trim();
    if (raw) {
      return InputSchema.parse(JSON.parse(raw));
    }
  }

  // Fall back to CLI argv
  const args = process.argv.slice(2);
  const surfacePathIdx = args.indexOf("--surface-path");
  if (surfacePathIdx === -1 || !args[surfacePathIdx + 1]) {
    console.error(JSON.stringify({
      status: "fail",
      details: "Usage: npx tsx scripts/visual-qa.ts --surface-path <path>",
    }));
    process.exit(1);
  }

  const projectRootIdx = args.indexOf("--project-root");
  return InputSchema.parse({
    surface_path: args[surfacePathIdx + 1],
    project_root: projectRootIdx !== -1 ? args[projectRootIdx + 1] : undefined,
  });
}

// ─── Main ───

async function main() {
  const input = await parseInput();
  const projectRoot = input.project_root ?? process.cwd();
  const surfacePath = resolve(projectRoot, input.surface_path);

  // Check surface directory exists
  if (!existsSync(surfacePath)) {
    console.log(JSON.stringify({
      status: "fail",
      details: `Surface directory not found: ${surfacePath}`,
    }));
    process.exit(1);
  }

  // Check package.json exists (is it a buildable project?)
  const packageJson = resolve(surfacePath, "package.json");
  if (!existsSync(packageJson)) {
    console.log(JSON.stringify({
      status: "skip",
      details: "No package.json found. Surface may not be a buildable project.",
    }));
    process.exit(0);
  }

  // Step 1: npm install (if node_modules missing)
  const nodeModules = resolve(surfacePath, "node_modules");
  if (!existsSync(nodeModules)) {
    try {
      execSync("npm install", { cwd: surfacePath, stdio: "pipe", timeout: 60000 });
    } catch (err) {
      console.log(JSON.stringify({
        status: "fail",
        details: `npm install failed: ${err instanceof Error ? err.message : String(err)}`,
      }));
      process.exit(1);
    }
  }

  // Step 2: vite build
  try {
    execSync("npx vite build", { cwd: surfacePath, stdio: "pipe", timeout: 60000 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({
      status: "fail",
      details: `Build failed: ${msg}`,
    }));
    process.exit(1);
  }

  // Step 3: Visual check (Chrome screenshot) — tool-dependent
  // Currently: SKIP. Chrome integration requires Claude Code browser tool.
  // Future: screenshot comparison with design ontology tokens.
  console.log(JSON.stringify({
    status: "pass",
    details: "Build succeeded. Visual screenshot check: SKIP (not yet implemented).",
  }));
  process.exit(0);
}

main().catch((err) => {
  console.log(JSON.stringify({
    status: "fail",
    details: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
  }));
  process.exit(1);
});
