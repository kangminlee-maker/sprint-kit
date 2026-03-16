import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { executeStart, findExistingScope, type StartInput, type StartResult, type StartInitResult, type StartResumeResult, type StartFailure } from "./start.js";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";
import { createScope } from "../kernel/scope-manager.js";
import { appendScopeEvent } from "../kernel/event-pipeline.js";

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

// ─── 3-path branching tests (TCOV-2) ───

describe("executeStart — Path A: New scope", () => {
  it("returns StartInitResult with action: initialized, creates brief.md", async () => {
    const result = await executeStart({
      rawInput: "",
      projectRoot: projectDir,
      scopesDir,
      projectName: "test-project",
    });

    expect(result.success).toBe(true);
    expect(result).toHaveProperty("action", "initialized");

    const initResult = result as StartInitResult;
    expect(initResult.scopeId).toMatch(/^test-project-\d{8}-\d{3}$/);
    expect(initResult.briefPath).toBeDefined();
    expect(existsSync(initResult.briefPath)).toBe(true);

    const briefContent = readFileSync(initResult.briefPath, "utf-8");
    expect(briefContent).toContain("변경 목적");
    expect(briefContent).toContain("대상 사용자");
    expect(briefContent).toContain("기대 결과");
  });
});

describe("executeStart — Path B: Brief filled", () => {
  it("reads brief, validates, creates scope.created event, starts grounding", async () => {
    // Step 1: Create scope via Path A
    const initResult = await executeStart({
      rawInput: "",
      projectRoot: projectDir,
      scopesDir,
      projectName: "brief-test",
    }) as StartInitResult;

    // Step 2: Create a source directory
    const srcDir = join(projectDir, "src-for-brief");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "app.ts"), "const x = 1;");

    // Step 3: Fill in the brief with required fields + additional source
    const filledBrief = `# brief-test — Brief

## 변경 목적 (필수)
사용자 차단 기능을 추가해야 합니다.

## 대상 사용자 (필수)
일반 사용자

## 기대 결과 (필수)
차단된 사용자가 매칭에서 제외됩니다.

## 포함 범위

## 제외 범위

## 제약 및 참고사항

## 소스

### 자동 로드 (환경설정)
- 환경설정 파일(.sprint-kit.yaml)이 없거나 소스가 정의되지 않았습니다.

### 추가 소스
- [x] 앱 소스 (add-dir: ${srcDir})
`;
    writeFileSync(initResult.briefPath, filledBrief, "utf-8");

    // Step 4: Run /start again with the same projectName
    const result = await executeStart({
      rawInput: "",
      projectRoot: projectDir,
      scopesDir,
      projectName: "brief-test",
    });

    expect(result.success).toBe(true);
    // Path B returns StartResult (not StartInitResult)
    expect(result).not.toHaveProperty("action", "initialized");
    expect(result).not.toHaveProperty("action", "resume_info");

    if (!result.success) return;
    if ("action" in result && (result.action === "initialized" || result.action === "resume_info")) return;

    // Verify events were recorded
    const events = readEvents(result.paths.events);
    const types = events.map(e => e.type);
    expect(types).toContain("scope.created");
    expect(types).toContain("grounding.started");
    expect(types).toContain("grounding.completed");

    const state = reduce(events);
    expect(state.current_state).toBe("grounded");
    expect(state.title).toBe("사용자 차단 기능을 추가해야 합니다.");
  });
});

describe("executeStart — Path B: Brief incomplete → exploration conversation mode", () => {
  it("succeeds with briefValidation indicating missing fields", async () => {
    // Step 1: Create scope via Path A
    const initResult = await executeStart({
      rawInput: "",
      projectRoot: projectDir,
      scopesDir,
      projectName: "incomplete-brief",
    }) as StartInitResult;

    // Step 2: Leave brief mostly empty (only fill purpose, leave others blank)
    const incompleteBrief = `# incomplete-brief — Brief

## 변경 목적 (필수)
기능 추가

## 대상 사용자 (필수)

## 기대 결과 (필수)

## 소스

### 자동 로드 (환경설정)
- 없음

### 추가 소스
`;
    writeFileSync(initResult.briefPath, incompleteBrief, "utf-8");

    // Step 2.5: Create a local source and .sprint-kit.yaml so grounding can proceed
    const srcDir = join(projectDir, "src-incomplete");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "index.ts"), "export const x = 1;");
    writeFileSync(
      join(projectDir, ".sprint-kit.yaml"),
      `default_sources:\n  - type: add-dir\n    path: ${srcDir}\n    description: test source\n`,
    );

    // Step 3: Run /start again — should succeed with briefValidation
    const result = await executeStart({
      rawInput: "",
      projectRoot: projectDir,
      scopesDir,
      projectName: "incomplete-brief",
    });

    expect(result.success).toBe(true);
    const success = result as StartResult;
    expect(success.briefValidation).toBeDefined();
    expect(success.briefValidation!.isComplete).toBe(false);
    expect(success.briefValidation!.missingFields).toContain("대상 사용자");
    expect(success.briefValidation!.missingFields).toContain("기대 결과");
    expect(success.totalFiles).toBeGreaterThan(0);
  });
});

describe("executeStart — Path C: Resume with events", () => {
  it("returns StartResumeResult with current state info", async () => {
    // Step 1: Create and execute a full start to get events
    const srcDir = join(projectDir, "src-resume");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "a.ts"), "const a = 1;");

    const scopeId = "resume-test-20260310-001";
    const firstResult = await executeStart({
      rawInput: `테스트 --add-dir ${srcDir}`,
      projectRoot: projectDir,
      scopesDir,
      scopeId,
      title: "Resume 테스트",
    });

    expect(firstResult.success).toBe(true);

    // Step 2: Set up findExistingScope to find this scope
    // Create .sprint-kit.yaml to not interfere
    // Manually run executeStart with the same scopeId pattern
    // Since findExistingScope uses normalized project name, we simulate by
    // calling executeStart with the exact scopeId (backward compat path triggers on scopeId+title)
    // Instead, let's use the new interface: create a matching directory name

    // Read events to verify they exist
    if (!firstResult.success) return;
    if ("action" in firstResult && firstResult.action === "initialized") return;
    const events = readEvents(firstResult.paths.events);
    expect(events.length).toBeGreaterThan(0);

    // Step 3: Now call again using the same scopeId+title (triggers backward compat path)
    // For Path C testing, we need projectName-based lookup
    // The existing scope dir is "resume-test-20260310-001", and findExistingScope
    // searches for `{normalized}-{YYYYMMDD}-{NNN}` pattern.
    // We can call findExistingScope directly to confirm, then trigger Path C via
    // a new scope creation with the right name pattern.

    // Actually, let's create a scope with known events using createScope + appendScopeEvent
    const scopeId2 = "pathc-20260310-001";
    mkdirSync(join(scopesDir, scopeId2), { recursive: true });
    const paths2 = createScope(scopesDir, scopeId2);

    appendScopeEvent(paths2, {
      type: "scope.created",
      actor: "user",
      payload: { title: "Path C 테스트", description: "d", entry_mode: "experience" },
    });

    // Now executeStart with projectName "pathc" should find the existing scope
    const resumeResult = await executeStart({
      rawInput: "",
      projectRoot: projectDir,
      scopesDir,
      projectName: "pathc",
    });

    expect(resumeResult.success).toBe(true);
    expect(resumeResult).toHaveProperty("action", "resume_info");

    const resume = resumeResult as StartResumeResult;
    expect(resume.scopeId).toBe(scopeId2);
    expect(resume.currentState).toBe("draft");
    expect(resume.nextAction).toBeDefined();
  });
});

describe("findExistingScope", () => {
  it("returns most recent matching scope", () => {
    // Create multiple matching directories
    mkdirSync(join(scopesDir, "myapp-20260310-001"), { recursive: true });
    mkdirSync(join(scopesDir, "myapp-20260310-002"), { recursive: true });
    mkdirSync(join(scopesDir, "myapp-20260310-003"), { recursive: true });

    const result = findExistingScope(scopesDir, "myapp");
    expect(result).toBe("myapp-20260310-003");
  });

  it("returns null when no matching scope exists", () => {
    const result = findExistingScope(scopesDir, "nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when scopesDir does not exist", () => {
    const result = findExistingScope(join(projectDir, "no-such-dir"), "anything");
    expect(result).toBeNull();
  });

  it("ignores non-matching directories", () => {
    mkdirSync(join(scopesDir, "other-20260310-001"), { recursive: true });
    mkdirSync(join(scopesDir, "target-20260310-001"), { recursive: true });

    const result = findExistingScope(scopesDir, "target");
    expect(result).toBe("target-20260310-001");
  });
});

// ─── ScanSkipped integration test (ETag cache hit) ───

describe("ScanSkipped integration (ETag cache hit)", () => {
  it("reuses cached hash when scanTarball returns ScanSkipped", async () => {
    // Mock scanTarball to return ScanSkipped for github-tarball source
    const { scanTarball } = await import("../scanners/scan-tarball.js");
    const scanTarballSpy = vi.spyOn(
      await import("../scanners/scan-tarball.js"),
      "scanTarball",
    );
    scanTarballSpy.mockResolvedValue({
      skipped: true,
      source: { type: "github-tarball", url: "https://github.com/acme/repo" },
      cached_hash: "cached-hash-abc",
    });

    // Also need a local source so grounding doesn't fail (needs at least 1 scanResult or scanSkipped)
    const srcDir = join(projectDir, "local-src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "app.ts"), "const a = 1;");

    // Create .sprint-kit.yaml with github-tarball source
    writeFileSync(
      join(projectDir, ".sprint-kit.yaml"),
      `default_sources:\n  - type: github-tarball\n    url: https://github.com/acme/repo\n    description: test repo\n`,
    );

    const result = await executeStart(makeInput({
      rawInput: `기능 추가 --add-dir ${srcDir}`,
    }));

    expect(result.success).toBe(true);
    if (!result.success) return;

    // Verify cached hash is in sourceHashes
    expect(result.sourceHashes["github-tarball:https://github.com/acme/repo"]).toBe("cached-hash-abc");

    // Verify grounding.completed event contains the cached hash in source_hashes
    const events = readEvents(result.paths.events);
    const groundingCompleted = events.find(e => e.type === "grounding.completed");
    expect(groundingCompleted).toBeDefined();
    expect((groundingCompleted!.payload as any).source_hashes["github-tarball:https://github.com/acme/repo"])
      .toBe("cached-hash-abc");

    scanTarballSpy.mockRestore();
  });
});
