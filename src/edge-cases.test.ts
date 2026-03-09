/**
 * Edge case tests — brief-parser, /start, compile, reducer, state machine.
 *
 * Covers boundary conditions and unusual inputs that the main test suites
 * do not exercise.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseBrief } from "./parsers/brief-parser.js";
import {
  executeStart,
  findExistingScope,
  type StartInitResult,
  type StartFailure,
  type StartResult,
  type StartResumeResult,
} from "./commands/start.js";
import {
  createScope,
  generateScopeId,
  resolveScopePaths,
} from "./kernel/scope-manager.js";
import { appendScopeEvent } from "./kernel/event-pipeline.js";
import { readEvents } from "./kernel/event-store.js";
import { reduce } from "./kernel/reducer.js";
import { compile, type CompileInput } from "./compilers/compile.js";
import { compileDefense } from "./compilers/compile-defense.js";
import { resolveTransition } from "./kernel/state-machine.js";
import type {
  ScopeState,
  ConstraintPool,
  ConstraintEntry,
  Event,
} from "./kernel/types.js";

// ─── Shared helpers ───

function makeEntry(
  id: string,
  overrides: Partial<ConstraintEntry> = {},
): ConstraintEntry {
  return {
    constraint_id: id,
    perspective: "code",
    summary: `summary ${id}`,
    severity: "recommended",
    discovery_stage: "draft_phase2",
    decision_owner: "product_owner",
    impact_if_ignored: `impact ${id}`,
    source_refs: [{ source: "src/test.ts", detail: "d" }],
    status: "decided",
    decision: "inject",
    selected_option: "opt",
    discovered_at: 1,
    decided_at: 2,
    ...overrides,
  };
}

function makePool(...entries: ConstraintEntry[]): ConstraintPool {
  let req = 0,
    rec = 0,
    dec = 0,
    inv = 0,
    cp = 0,
    und = 0;
  for (const e of entries) {
    if (e.severity === "required") req++;
    else rec++;
    if (e.status === "decided") dec++;
    if (e.status === "invalidated") inv++;
    if (e.status === "clarify_pending") cp++;
    if (e.status === "undecided") und++;
  }
  return {
    constraints: entries,
    summary: {
      total: entries.length,
      required: req,
      recommended: rec,
      decided: dec,
      clarify_pending: cp,
      invalidated: inv,
      undecided: und,
    },
  };
}

function makeState(
  pool: ConstraintPool,
  overrides: Partial<ScopeState> = {},
): ScopeState {
  return {
    scope_id: "SC-EDGE-TEST",
    title: "Edge Test",
    description: "d",
    entry_mode: "experience",
    current_state: "target_locked",
    direction: "test direction",
    scope_boundaries: { in: ["feature"], out: ["other"] },
    surface_hash: "abc123",
    constraint_pool: pool,
    stale: false,
    compile_ready: true,
    convergence_blocked: false,
    revision_count_align: 0,
    revision_count_surface: 0,
    retry_count_compile: 0,
    verdict_log: [],
    feedback_history: [],
    latest_revision: 10,
    ...overrides,
  };
}

// ============================================================
// brief-parser edge cases
// ============================================================

describe("Edge — brief-parser", () => {
  it("1. brief with ONLY HTML comments in required sections → validation fails", () => {
    const brief = `# test — Brief

## 변경 목적 (필수)
<!-- 여기에 목적을 입력하세요 -->
<!-- 추가 설명 -->

## 대상 사용자 (필수)
<!-- 사용자를 입력하세요 -->

## 기대 결과 (필수)
<!-- 결과를 입력하세요 -->
`;
    const result = parseBrief(brief);
    expect(result.validation.isComplete).toBe(false);
    expect(result.validation.missingFields).toEqual([
      "변경 목적",
      "대상 사용자",
      "기대 결과",
    ]);
  });

  it("2. brief with whitespace-only content in required sections → validation fails", () => {
    const brief = `# test — Brief

## 변경 목적 (필수)




## 대상 사용자 (필수)
\t\t

## 기대 결과 (필수)

`;
    const result = parseBrief(brief);
    expect(result.validation.isComplete).toBe(false);
    expect(result.validation.missingFields).toEqual([
      "변경 목적",
      "대상 사용자",
      "기대 결과",
    ]);
  });

  it("3. brief with mixed valid/invalid source entries → valid parsed, invalid ignored", () => {
    const brief = `# test — Brief

## 변경 목적 (필수)
기능 추가

## 대상 사용자 (필수)
사용자

## 기대 결과 (필수)
성공

## 소스

### 추가 소스
- [x] 유효한 소스 (add-dir: /valid/path)
- [x] 잘못된 타입 (unknown-type: /some/path)
- [x] 두번째 유효 (github-tarball: https://github.com/org/repo)
`;
    const result = parseBrief(brief);
    // Only valid types (add-dir, github-tarball) should be parsed
    expect(result.additionalSources).toHaveLength(2);
    expect(result.additionalSources[0]).toEqual({
      type: "add-dir",
      path: "/valid/path",
      description: "유효한 소스",
    });
    expect(result.additionalSources[1]).toEqual({
      type: "github-tarball",
      url: "https://github.com/org/repo",
      description: "두번째 유효",
    });
  });

  it("4. brief with duplicate sources (same type:identifier) → both returned", () => {
    const brief = `# test — Brief

## 변경 목적 (필수)
기능 추가

## 대상 사용자 (필수)
사용자

## 기대 결과 (필수)
성공

## 소스

### 추가 소스
- [x] 첫번째 (add-dir: /same/path)
- [x] 두번째 (add-dir: /same/path)
`;
    const result = parseBrief(brief);
    // parseBrief returns both — dedup happens in resolveSources
    expect(result.additionalSources).toHaveLength(2);
    expect(result.additionalSources[0].type).toBe("add-dir");
    expect(result.additionalSources[1].type).toBe("add-dir");
  });

  it("5. brief with no '추가 소스' section at all → empty additionalSources", () => {
    const brief = `# test — Brief

## 변경 목적 (필수)
기능 추가

## 대상 사용자 (필수)
사용자

## 기대 결과 (필수)
성공

## 소스

### 자동 로드 (환경설정)
- [x] 기본 소스 (add-dir: /src)
`;
    const result = parseBrief(brief);
    expect(result.additionalSources).toEqual([]);
  });
});

// ============================================================
// /start edge cases
// ============================================================

describe("Edge — /start command", () => {
  let projectDir: string;
  let scopesDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "sprint-edge-start-"));
    scopesDir = join(projectDir, "scopes");
    mkdirSync(scopesDir, { recursive: true });
  });
  afterEach(() => rmSync(projectDir, { recursive: true, force: true }));

  it("6. findExistingScope with multiple scopes (different dates) → returns most recent", () => {
    mkdirSync(join(scopesDir, "myproj-20260301-001"), { recursive: true });
    mkdirSync(join(scopesDir, "myproj-20260305-001"), { recursive: true });
    mkdirSync(join(scopesDir, "myproj-20260310-001"), { recursive: true });

    const result = findExistingScope(scopesDir, "myproj");
    // Lexicographically last = most recent date
    expect(result).toBe("myproj-20260310-001");
  });

  it("7. findExistingScope with non-existent scopesDir → returns null", () => {
    const result = findExistingScope(
      join(projectDir, "does-not-exist"),
      "anything",
    );
    expect(result).toBeNull();
  });

  it("8. executeStart Path B with brief that has sources but no CLI sources → config + brief sources only", async () => {
    // Step 1: Create scope via Path A
    const initResult = (await executeStart({
      rawInput: "",
      projectRoot: projectDir,
      scopesDir,
      projectName: "no-cli-src",
    })) as StartInitResult;

    // Step 2: Create a local source directory
    const srcDir = join(projectDir, "brief-src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "app.ts"), "const x = 1;");

    // Step 3: Fill in brief with additional source, no CLI sources in rawInput
    const filledBrief = `# no-cli-src — Brief

## 변경 목적 (필수)
기능 추가

## 대상 사용자 (필수)
사용자

## 기대 결과 (필수)
성공

## 소스

### 자동 로드 (환경설정)
- 없음

### 추가 소스
- [x] 앱 소스 (add-dir: ${srcDir})
`;
    writeFileSync(initResult.briefPath, filledBrief, "utf-8");

    // Step 4: Run /start again — no CLI sources in rawInput
    const result = await executeStart({
      rawInput: "", // no --add-dir flags
      projectRoot: projectDir,
      scopesDir,
      projectName: "no-cli-src",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    if ("action" in result && result.action === "initialized") return;
    if ("action" in result && result.action === "resume_info") return;

    const startResult = result as StartResult;
    // Only brief source (no config, no CLI)
    expect(startResult.scanResults.length).toBeGreaterThanOrEqual(1);

    const events = readEvents(startResult.paths.events);
    const state = reduce(events);
    expect(state.current_state).toBe("grounded");
  });

  it("9. generateScopeId with empty projectName → throws", () => {
    expect(() => generateScopeId(scopesDir, "")).toThrow(
      "projectName must contain at least one alphanumeric character",
    );
    expect(() => generateScopeId(scopesDir, "---")).toThrow(
      "projectName must contain at least one alphanumeric character",
    );
  });
});

// ============================================================
// compile edge cases
// ============================================================

describe("Edge — compile", () => {
  it("10. compile with InjectValidation with empty edge_cases → defense rejects", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject" }),
    );
    const state = makeState(pool);

    const input: CompileInput = {
      state,
      implementations: [
        {
          summary: "feature",
          related_cst: ["CST-001"],
          target: "src/a.ts",
          detail: "detail",
        },
      ],
      changes: [
        {
          action: "create",
          file_path: "src/a.ts",
          description: "new file",
          related_impl_indices: [0],
          related_cst: ["CST-001"],
        },
      ],
      brownfield: { related_files: [], module_dependencies: [] },
      brownfieldDetail: { scope_id: "SC-EDGE", sections: [] },
      surfaceSummary: "test",
      injectValidations: [
        {
          related_cst: "CST-001",
          target: "target",
          method: "method",
          pass_criteria: "pass",
          fail_action: "fail",
          edge_cases: [], // empty array → defense should reject
        },
      ],
    };

    const result = compile(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.violations).toBeDefined();
      const edgeCaseViolation = result.violations!.find(
        (v) => v.rule === "L2-inject-edge-case",
      );
      expect(edgeCaseViolation).toBeDefined();
    }
  });

  it("11. compile with ChangeItem that has before_context but no after_context → passes", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject" }),
    );
    const state = makeState(pool);

    const input: CompileInput = {
      state,
      implementations: [
        {
          summary: "feature",
          related_cst: ["CST-001"],
          target: "src/a.ts",
          detail: "detail",
        },
      ],
      changes: [
        {
          action: "modify",
          file_path: "src/a.ts",
          description: "modify file",
          related_impl_indices: [0],
          related_cst: ["CST-001"],
          before_context: "const old = 1;", // present
          // after_context: omitted (undefined)
        },
      ],
      brownfield: { related_files: [], module_dependencies: [] },
      brownfieldDetail: { scope_id: "SC-EDGE", sections: [] },
      surfaceSummary: "test",
      injectValidations: [
        {
          related_cst: "CST-001",
          target: "target",
          method: "method",
          pass_criteria: "pass",
          fail_action: "fail",
          edge_cases: [{ scenario: "빈 입력", expected_result: "에러" }],
        },
      ],
    };

    const result = compile(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // before_context is preserved in delta-set, after_context is undefined
    const change = result.deltaSet.changes[0];
    expect(change.before_context).toBe("const old = 1;");
    expect(change.after_context).toBeUndefined();
  });

  it("12. compile with ImplementationItem pseudocode containing markdown → renders correctly", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject" }),
    );
    const state = makeState(pool);

    const pseudocodeWithMarkdown = `# Step 1
items = db.query("SELECT * FROM blocks")
// **filter** blocked users
return items.filter(i => !blocked.has(i.id))`;

    const input: CompileInput = {
      state,
      implementations: [
        {
          summary: "feature",
          related_cst: ["CST-001"],
          target: "src/a.ts",
          detail: "detail",
          pseudocode: pseudocodeWithMarkdown,
        },
      ],
      changes: [
        {
          action: "create",
          file_path: "src/a.ts",
          description: "new file",
          related_impl_indices: [0],
          related_cst: ["CST-001"],
        },
      ],
      brownfield: { related_files: [], module_dependencies: [] },
      brownfieldDetail: { scope_id: "SC-EDGE", sections: [] },
      surfaceSummary: "test",
      injectValidations: [
        {
          related_cst: "CST-001",
          target: "target",
          method: "method",
          pass_criteria: "pass",
          fail_action: "fail",
          edge_cases: [{ scenario: "s", expected_result: "r" }],
        },
      ],
    };

    const result = compile(input);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // Pseudocode should be wrapped in code fences
    expect(result.buildSpecMd).toContain("```");
    expect(result.buildSpecMd).toContain("# Step 1");
    expect(result.buildSpecMd).toContain("// **filter** blocked users");
  });
});

// ============================================================
// reducer edge cases
// ============================================================

describe("Edge — reducer", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sprint-edge-reducer-"));
  });

  function setupScopeToAlignLocked(
    paths: ReturnType<typeof createScope>,
  ): void {
    appendScopeEvent(paths, {
      type: "scope.created",
      actor: "user",
      payload: {
        title: "Reducer Edge",
        description: "d",
        entry_mode: "experience",
      },
    });
    appendScopeEvent(paths, {
      type: "grounding.started",
      actor: "system",
      payload: { sources: [{ type: "add-dir", path_or_url: "/src" }] },
    });
    appendScopeEvent(paths, {
      type: "grounding.completed",
      actor: "system",
      payload: {
        snapshot_revision: 1,
        source_hashes: {},
        perspective_summary: { experience: 0, code: 0, policy: 0 },
      },
    });
    appendScopeEvent(paths, {
      type: "align.proposed",
      actor: "system",
      payload: {
        packet_path: "build/align-packet.md",
        packet_hash: "h1",
        snapshot_revision: 1,
      },
    });
    appendScopeEvent(paths, {
      type: "align.locked",
      actor: "user",
      payload: {
        locked_direction: "방향 1",
        locked_scope_boundaries: { in: ["A"], out: ["B"] },
        locked_in_out: true,
      },
    });
  }

  it("13. Multiple backward transitions in sequence → last_backward_reason updates each time", () => {
    const paths = createScope(tmpDir, "SC-BACK-001");
    setupScopeToAlignLocked(paths);

    // surface.generated → surface_iterating
    appendScopeEvent(paths, {
      type: "surface.generated",
      actor: "system",
      payload: {
        surface_type: "experience",
        surface_path: "surface/preview/",
        content_hash: "h_sf1",
        based_on_snapshot: 1,
      },
    });

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("surface_iterating");

    // First backward: redirect.to_align
    appendScopeEvent(paths, {
      type: "redirect.to_align",
      actor: "user",
      payload: { from_state: "surface_iterating", reason: "첫번째 방향 변경" },
    });

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("align_proposed");
    expect(state.last_backward_reason).toBe("첫번째 방향 변경");

    // Re-align and go back to surface_iterating
    appendScopeEvent(paths, {
      type: "align.locked",
      actor: "user",
      payload: {
        locked_direction: "방향 2",
        locked_scope_boundaries: { in: ["C"], out: ["D"] },
        locked_in_out: true,
      },
    });
    appendScopeEvent(paths, {
      type: "surface.generated",
      actor: "system",
      payload: {
        surface_type: "experience",
        surface_path: "surface/preview/",
        content_hash: "h_sf2",
        based_on_snapshot: 1,
      },
    });

    // Second backward
    appendScopeEvent(paths, {
      type: "redirect.to_align",
      actor: "user",
      payload: {
        from_state: "surface_iterating",
        reason: "두번째 방향 변경",
      },
    });

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("align_proposed");
    expect(state.last_backward_reason).toBe("두번째 방향 변경");
  });

  it("14. backward transition followed by align.locked → last_backward_reason cleared", () => {
    const paths = createScope(tmpDir, "SC-BACK-002");
    setupScopeToAlignLocked(paths);

    appendScopeEvent(paths, {
      type: "surface.generated",
      actor: "system",
      payload: {
        surface_type: "experience",
        surface_path: "surface/preview/",
        content_hash: "h_sf1",
        based_on_snapshot: 1,
      },
    });

    // Backward transition
    appendScopeEvent(paths, {
      type: "redirect.to_align",
      actor: "user",
      payload: { from_state: "surface_iterating", reason: "방향 변경" },
    });

    let state = reduce(readEvents(paths.events));
    expect(state.last_backward_reason).toBe("방향 변경");

    // Forward: align.locked clears last_backward_reason
    appendScopeEvent(paths, {
      type: "align.locked",
      actor: "user",
      payload: {
        locked_direction: "새 방향",
        locked_scope_boundaries: { in: ["X"], out: ["Y"] },
        locked_in_out: true,
      },
    });

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("align_locked");
    expect(state.last_backward_reason).toBeUndefined();
  });
});

// ============================================================
// state machine edge cases
// ============================================================

describe("Edge — state machine", () => {
  it("15. grounding.started from grounded → denied (only draft allows it)", () => {
    const outcome = resolveTransition("grounded", "grounding.started");
    expect(outcome.allowed).toBe(false);
  });

  it("16. snapshot.marked_stale from align_proposed → self-transition (stays align_proposed)", () => {
    const outcome = resolveTransition(
      "align_proposed",
      "snapshot.marked_stale",
    );
    expect(outcome.allowed).toBe(true);
    if (outcome.allowed) {
      expect(outcome.next_state).toBe("align_proposed");
      expect(outcome.kind).toBe("self");
    }
  });

  it("scope.closed from non-validated state → denied", () => {
    // scope.closed is only allowed from validated
    const outcome = resolveTransition("applied", "scope.closed");
    expect(outcome.allowed).toBe(false);
  });

  it("compile.started from compiled → denied", () => {
    const outcome = resolveTransition("compiled", "compile.started");
    expect(outcome.allowed).toBe(false);
  });

  it("align.locked from grounded → denied (must go through align_proposed)", () => {
    const outcome = resolveTransition("grounded", "align.locked");
    expect(outcome.allowed).toBe(false);
  });
});
