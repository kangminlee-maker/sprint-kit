import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkStale, checkAndRecordStale } from "./stale-check.js";
import { createScope } from "../kernel/scope-manager.js";
import { appendScopeEvent } from "../kernel/event-pipeline.js";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";
import { computeDirectoryHash, walkDirectory } from "../scanners/file-utils.js";

let tmpDir: string;
let srcDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "sprint-stale-"));
  srcDir = join(tmpDir, "project-src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(join(srcDir, "app.ts"), "const a = 1;");
});

afterEach(() => rmSync(tmpDir, { recursive: true, force: true }));

function setupGroundedScope() {
  const scopesDir = join(tmpDir, "scopes");
  mkdirSync(scopesDir, { recursive: true });
  const paths = createScope(scopesDir, "SC-STALE-001");

  appendScopeEvent(paths, { type: "scope.created", actor: "user", payload: { title: "T", description: "d", entry_mode: "experience" } });
  appendScopeEvent(paths, { type: "grounding.started", actor: "system", payload: { sources: [{ type: "add-dir", path_or_url: srcDir }] } });

  // Compute actual hash for the source directory
  const files = walkDirectory(srcDir);
  const hash = computeDirectoryHash(srcDir, files);

  appendScopeEvent(paths, { type: "grounding.completed", actor: "system", payload: { snapshot_revision: 1, source_hashes: { [`add-dir:${srcDir}`]: hash }, perspective_summary: { experience: 0, code: 0, policy: 0 } } });

  // Write sources.yaml so stale-check can read it
  const { stringify } = require("yaml");
  writeFileSync(paths.sourcesYaml, stringify({ sources: [{ type: "add-dir", path: srcDir }] }), "utf-8");

  return paths;
}

describe("checkStale", () => {
  it("returns not stale when source unchanged", () => {
    const paths = setupGroundedScope();
    const result = checkStale(paths);
    expect(result.stale).toBe(false);
    expect(result.stale_sources).toEqual([]);
  });

  it("detects stale when file content changes", () => {
    const paths = setupGroundedScope();
    // Modify source file
    writeFileSync(join(srcDir, "app.ts"), "const a = 2; // changed");
    const result = checkStale(paths);
    expect(result.stale).toBe(true);
    expect(result.stale_sources).toHaveLength(1);
    expect(result.stale_sources[0].path).toBe(`add-dir:${srcDir}`);
  });

  it("detects stale when file is added", () => {
    const paths = setupGroundedScope();
    writeFileSync(join(srcDir, "new-file.ts"), "const b = 1;");
    const result = checkStale(paths);
    expect(result.stale).toBe(true);
  });

  it("returns not stale when no grounding.completed exists", () => {
    const scopesDir = join(tmpDir, "scopes2");
    mkdirSync(scopesDir, { recursive: true });
    const paths = createScope(scopesDir, "SC-STALE-002");
    appendScopeEvent(paths, { type: "scope.created", actor: "user", payload: { title: "T", description: "d", entry_mode: "experience" } });
    writeFileSync(paths.sourcesYaml, "", "utf-8");
    const result = checkStale(paths);
    expect(result.stale).toBe(false);
  });
});

describe("checkAndRecordStale", () => {
  it("records snapshot.marked_stale event when stale detected", () => {
    const paths = setupGroundedScope();
    // Proceed to align_proposed
    appendScopeEvent(paths, { type: "align.proposed", actor: "system", payload: { packet_path: "build/align-packet.md", packet_hash: "h", snapshot_revision: 1 } });

    // Modify source
    writeFileSync(join(srcDir, "app.ts"), "const a = 999;");

    const wasStale = checkAndRecordStale(paths);
    expect(wasStale).toBe(true);

    const state = reduce(readEvents(paths.events));
    expect(state.stale).toBe(true);
  });

  it("does nothing when not stale", () => {
    const paths = setupGroundedScope();
    const wasStale = checkAndRecordStale(paths);
    expect(wasStale).toBe(false);
  });
});
