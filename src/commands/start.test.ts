import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { executeStart, type StartInput } from "./start.js";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";

let projectDir: string;
let scopesDir: string;

beforeEach(() => {
  projectDir = mkdtempSync(join(tmpdir(), "sprint-start-"));
  scopesDir = join(projectDir, "scopes");
  mkdirSync(scopesDir, { recursive: true });
});

afterEach(() => {
  rmSync(projectDir, { recursive: true, force: true });
});

function makeInput(overrides: Partial<StartInput> = {}): StartInput {
  return {
    rawInput: "튜터 차단 기능 추가",
    projectRoot: projectDir,
    scopesDir,
    scopeId: "SC-TEST-001",
    title: "튜터 차단 기능",
    ...overrides,
  };
}

describe("executeStart", () => {
  it("creates scope and records events with local source", async () => {
    // Create a local source directory
    const srcDir = join(projectDir, "app-src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "app.ts"), 'import { foo } from "./foo";');
    writeFileSync(join(srcDir, "foo.ts"), "export const foo = 1;");

    const result = await executeStart(makeInput({
      rawInput: `튜터 차단 --add-dir ${srcDir}`,
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;

    // Verify scope was created
    expect(result.paths.scopeId).toBe("SC-TEST-001");

    // Verify scan results
    expect(result.scanResults).toHaveLength(1);
    expect(result.scanResults[0].files.length).toBeGreaterThanOrEqual(2);
    expect(result.totalFiles).toBeGreaterThanOrEqual(2);

    // Verify source_hashes uses {type}:{identifier} keys
    const hashKeys = Object.keys(result.sourceHashes);
    expect(hashKeys.length).toBe(1);
    expect(hashKeys[0]).toMatch(/^add-dir:/);

    // Verify events were recorded
    const events = readEvents(result.paths.events);
    const types = events.map(e => e.type);
    expect(types).toContain("scope.created");
    expect(types).toContain("grounding.started");
    expect(types).toContain("grounding.completed");

    // Verify state
    const state = reduce(events);
    expect(state.current_state).toBe("grounded");
    expect(state.title).toBe("튜터 차단 기능");
    expect(state.grounding_sources).toHaveLength(1);

    // Verify reality-snapshot.json was written
    const snapshot = JSON.parse(readFileSync(result.paths.realitySnapshot, "utf-8"));
    expect(snapshot.scope_id).toBe("SC-TEST-001");
    expect(snapshot.source_hashes).toEqual(result.sourceHashes);

    // Verify sources.yaml was written
    const sourcesContent = readFileSync(result.paths.sourcesYaml, "utf-8");
    expect(sourcesContent).toContain("add-dir");
  });

  it("merges .sprint-kit.yaml defaults with /start flags", async () => {
    // Create .sprint-kit.yaml with a default source
    const defaultSrcDir = join(projectDir, "default-src");
    mkdirSync(defaultSrcDir, { recursive: true });
    writeFileSync(join(defaultSrcDir, "default.ts"), "const d = 1;");

    writeFileSync(join(projectDir, ".sprint-kit.yaml"), `default_sources:\n  - type: add-dir\n    path: ${defaultSrcDir}\n    description: default source\n`);

    // Add another source via /start flag
    const flagSrcDir = join(projectDir, "flag-src");
    mkdirSync(flagSrcDir, { recursive: true });
    writeFileSync(join(flagSrcDir, "flag.ts"), "const f = 1;");

    const result = await executeStart(makeInput({
      rawInput: `기능 추가 --add-dir ${flagSrcDir}`,
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;

    // Both sources scanned
    expect(result.scanResults).toHaveLength(2);
    expect(Object.keys(result.sourceHashes)).toHaveLength(2);
  });

  it("fails when no sources are specified", async () => {
    const result = await executeStart(makeInput({
      rawInput: "기능 추가",
    }));

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.step).toBe("resolve_sources");
    expect(result.reason).toContain("소스가 없습니다");
  });

  it("reports scan errors without stopping", async () => {
    // Create one valid source
    const srcDir = join(projectDir, "valid-src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "app.ts"), "const a = 1;");

    const result = await executeStart(makeInput({
      rawInput: `기능 추가 --add-dir ${srcDir} --add-dir /nonexistent/path`,
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;

    // One success, one empty (nonexistent path returns empty, not error)
    expect(result.scanResults).toHaveLength(2);
  });

  it("calls onProgress callback", async () => {
    const srcDir = join(projectDir, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "a.ts"), "const a = 1;");

    const messages: string[] = [];
    const result = await executeStart(makeInput({
      rawInput: `차단 --add-dir ${srcDir}`,
      onProgress: (msg) => messages.push(msg),
    }));

    expect(result.success).toBe(true);
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0]).toContain("소스 스캔을 시작합니다");
    expect(messages[messages.length - 1]).toContain("소스 스캔 완료");
  });

  it("uses experience as default entry_mode", async () => {
    const srcDir = join(projectDir, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "a.ts"), "const a = 1;");

    const result = await executeStart(makeInput({
      rawInput: `차단 --add-dir ${srcDir}`,
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;

    const state = reduce(readEvents(result.paths.events));
    expect(state.entry_mode).toBe("experience");
  });
});
