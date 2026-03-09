/**
 * E2E tests for /start 2-stage flow, Path C resume, and full lifecycle
 * with structured_options and edge_cases.
 *
 * Tests the recently added features:
 * - Brief creation + validation (Path A → Path B)
 * - Resume from various states (Path C)
 * - Compile with pseudocode, before/after_context, edge_cases
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  rmSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  executeStart,
  findExistingScope,
  type StartInput,
  type StartInitResult,
  type StartResumeResult,
  type StartResult,
  type StartFailure,
} from "./commands/start.js";
import { readEvents } from "./kernel/event-store.js";
import { reduce } from "./kernel/reducer.js";
import { createScope, resolveScopePaths } from "./kernel/scope-manager.js";
import { appendScopeEvent } from "./kernel/event-pipeline.js";
import { compile, type CompileInput } from "./compilers/compile.js";
import type { Event, ScopeState, ConstraintPool, ConstraintEntry } from "./kernel/types.js";

// ─── Shared helpers ───

let projectDir: string;
let scopesDir: string;

function setupProjectDir(): void {
  projectDir = mkdtempSync(join(tmpdir(), "sprint-e2e-start-"));
  scopesDir = join(projectDir, "scopes");
  mkdirSync(scopesDir, { recursive: true });
}

function makeEntry(id: string, overrides: Partial<ConstraintEntry> = {}): ConstraintEntry {
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
  let req = 0, rec = 0, dec = 0, inv = 0, cp = 0, und = 0;
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
    summary: { total: entries.length, required: req, recommended: rec, decided: dec, clarify_pending: cp, invalidated: inv, undecided: und },
  };
}

function makeState(pool: ConstraintPool): ScopeState {
  return {
    scope_id: "SC-E2E-TEST",
    title: "E2E Test",
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
  };
}

// ─── E2E 1: Complete /start 2-stage flow with brief ───

describe("E2E 1 — /start 2-stage flow (Path A → brief → Path B → grounding)", () => {
  beforeEach(() => setupProjectDir());
  afterEach(() => rmSync(projectDir, { recursive: true, force: true }));

  it("Path A creates brief, Path B validates brief and runs grounding", async () => {
    // ── Step 1: Path A — create new scope ──
    const initResult = await executeStart({
      rawInput: "",
      projectRoot: projectDir,
      scopesDir,
      projectName: "test-brief-flow",
    });

    expect(initResult.success).toBe(true);
    expect(initResult).toHaveProperty("action", "initialized");

    const init = initResult as StartInitResult;
    expect(init.scopeId).toMatch(/^test-brief-flow-\d{8}-\d{3}$/);
    expect(init.briefPath).toBeDefined();
    expect(existsSync(init.briefPath)).toBe(true);

    // Verify brief template content
    const briefTemplate = readFileSync(init.briefPath, "utf-8");
    expect(briefTemplate).toContain("변경 목적");
    expect(briefTemplate).toContain("대상 사용자");
    expect(briefTemplate).toContain("기대 결과");

    // ── Step 2: Fill in brief with required fields + additional source ──
    const srcDir = join(projectDir, "app-src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "main.ts"), 'import { service } from "./service";');
    writeFileSync(join(srcDir, "service.ts"), "export const service = { run: () => {} };");

    const filledBrief = `# test-brief-flow — Brief

## 변경 목적 (필수)
사용자 차단 기능을 구현합니다.

## 대상 사용자 (필수)
일반 사용자

## 기대 결과 (필수)
차단한 사용자가 매칭 후보에서 제외됩니다.

## 포함 범위
차단 API, 매칭 로직 수정

## 제외 범위
관리자 대시보드

## 제약 및 참고사항
기존 매칭 알고리즘 성능 영향 최소화

## 소스

### 자동 로드 (환경설정)
- 환경설정 파일(.sprint-kit.yaml)이 없거나 소스가 정의되지 않았습니다.

### 추가 소스
- [x] 앱 소스 코드 (add-dir: ${srcDir})
`;
    writeFileSync(init.briefPath, filledBrief, "utf-8");

    // ── Step 3: Path B — re-run /start with same projectName ──
    const result = await executeStart({
      rawInput: "",
      projectRoot: projectDir,
      scopesDir,
      projectName: "test-brief-flow",
    });

    expect(result.success).toBe(true);
    // Path B returns StartResult (not init or resume)
    expect(result).not.toHaveProperty("action", "initialized");
    expect(result).not.toHaveProperty("action", "resume_info");

    if (!result.success) return;
    if ("action" in result && (result.action === "initialized" || result.action === "resume_info")) return;

    const startResult = result as StartResult;

    // ── Step 4: Verify events.ndjson contains scope.created and grounding.completed ──
    const events = readEvents(startResult.paths.events);
    const types = events.map((e) => e.type);
    expect(types).toContain("scope.created");
    expect(types).toContain("grounding.started");
    expect(types).toContain("grounding.completed");

    // Verify state
    const state = reduce(events);
    expect(state.current_state).toBe("grounded");
    expect(state.title).toBe("사용자 차단 기능을 구현합니다.");

    // ── Step 5: Verify sources.yaml contains merged sources ──
    const sourcesContent = readFileSync(startResult.paths.sourcesYaml, "utf-8");
    expect(sourcesContent).toContain("add-dir");
    expect(sourcesContent).toContain(srcDir);

    // Verify scan results
    expect(startResult.scanResults.length).toBeGreaterThanOrEqual(1);
    expect(startResult.totalFiles).toBeGreaterThanOrEqual(2);
  });
});

// ─── E2E 2: /start Path C resume from various states ───

describe("E2E 2 — /start Path C resume from various states", () => {
  beforeEach(() => setupProjectDir());
  afterEach(() => rmSync(projectDir, { recursive: true, force: true }));

  it("resumes from align_proposed with correct nextAction", async () => {
    // Create scope and advance to align_proposed
    const scopeId = "resume-align-20260310-001";
    const paths = createScope(scopesDir, scopeId);

    appendScopeEvent(paths, {
      type: "scope.created",
      actor: "user",
      payload: { title: "Resume 테스트", description: "d", entry_mode: "experience" },
    });
    appendScopeEvent(paths, {
      type: "grounding.started",
      actor: "system",
      payload: { sources: [{ type: "add-dir", path_or_url: "/src" }] },
    });
    appendScopeEvent(paths, {
      type: "grounding.completed",
      actor: "system",
      payload: { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } },
    });
    appendScopeEvent(paths, {
      type: "align.proposed",
      actor: "system",
      payload: { packet_path: "build/align-packet.md", packet_hash: "h1", snapshot_revision: 1 },
    });

    // Verify state
    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("align_proposed");

    // Call executeStart — should get Path C
    const result = await executeStart({
      rawInput: "",
      projectRoot: projectDir,
      scopesDir,
      projectName: "resume-align",
    });

    expect(result.success).toBe(true);
    expect(result).toHaveProperty("action", "resume_info");

    const resume = result as StartResumeResult;
    expect(resume.currentState).toBe("align_proposed");
    expect(resume.nextAction).toContain("/align");
  });

  it("resumes from compiled with apply guidance", async () => {
    // Create scope and advance to compiled
    const scopeId = "resume-compiled-20260310-001";
    const paths = createScope(scopesDir, scopeId);

    // Bootstrap events to reach compiled
    appendScopeEvent(paths, {
      type: "scope.created",
      actor: "user",
      payload: { title: "Compiled Resume", description: "d", entry_mode: "experience" },
    });
    appendScopeEvent(paths, {
      type: "grounding.started",
      actor: "system",
      payload: { sources: [{ type: "add-dir", path_or_url: "/src" }] },
    });
    appendScopeEvent(paths, {
      type: "grounding.completed",
      actor: "system",
      payload: { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } },
    });
    appendScopeEvent(paths, {
      type: "align.proposed",
      actor: "system",
      payload: { packet_path: "build/align-packet.md", packet_hash: "h1", snapshot_revision: 1 },
    });
    appendScopeEvent(paths, {
      type: "align.locked",
      actor: "user",
      payload: {
        locked_direction: "차단 기능 구현",
        locked_scope_boundaries: { in: ["차단 기능"], out: ["관리자 기능"] },
        locked_in_out: true,
      },
    });
    appendScopeEvent(paths, {
      type: "surface.generated",
      actor: "system",
      payload: { surface_type: "experience", surface_path: "surface/preview/", content_hash: "h_sf", based_on_snapshot: 1 },
    });
    appendScopeEvent(paths, {
      type: "surface.confirmed",
      actor: "user",
      payload: { final_surface_path: "surface/preview/", final_content_hash: "h_sf", total_revisions: 0 },
    });
    appendScopeEvent(paths, {
      type: "target.locked",
      actor: "system",
      payload: { surface_hash: "h_sf", constraint_decisions: [] },
    });
    appendScopeEvent(paths, {
      type: "compile.started",
      actor: "system",
      payload: { snapshot_revision: 1, surface_hash: "h_sf" },
    });
    appendScopeEvent(paths, {
      type: "compile.completed",
      actor: "system",
      payload: {
        build_spec_path: "build/build-spec.md",
        build_spec_hash: "h_bs",
        brownfield_detail_path: "build/brownfield-detail.md",
        brownfield_detail_hash: "h_bd",
        delta_set_path: "build/delta-set.json",
        delta_set_hash: "h_ds",
        validation_plan_path: "build/validation-plan.md",
        validation_plan_hash: "h_vp",
      },
    });

    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("compiled");

    // Call executeStart — should resume
    const result = await executeStart({
      rawInput: "",
      projectRoot: projectDir,
      scopesDir,
      projectName: "resume-compiled",
    });

    expect(result.success).toBe(true);
    expect(result).toHaveProperty("action", "resume_info");

    const resume = result as StartResumeResult;
    expect(resume.currentState).toBe("compiled");
    expect(resume.nextAction).toContain("apply");
  });
});

// ─── E2E 3: Full lifecycle with structured_options and edge_cases ───

describe("E2E 3 — Full lifecycle with pseudocode, before/after_context, edge_cases", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sprint-e2e-lifecycle-"));
  });

  it("compile with structured fields → build-spec/delta-set/validation-plan contain them", () => {
    // ── Phase 1: Create scope → grounding → align.locked ──
    const paths = createScope(tmpDir, "SC-LIFECYCLE-001");

    appendScopeEvent(paths, {
      type: "scope.created",
      actor: "user",
      payload: { title: "구조화 옵션 테스트", description: "d", entry_mode: "experience" },
    });
    appendScopeEvent(paths, {
      type: "grounding.started",
      actor: "system",
      payload: { sources: [{ type: "add-dir", path_or_url: "/src" }] },
    });
    appendScopeEvent(paths, {
      type: "grounding.completed",
      actor: "system",
      payload: { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } },
    });
    appendScopeEvent(paths, {
      type: "align.proposed",
      actor: "system",
      payload: { packet_path: "build/align-packet.md", packet_hash: "h1", snapshot_revision: 1 },
    });
    appendScopeEvent(paths, {
      type: "align.locked",
      actor: "user",
      payload: {
        locked_direction: "차단 기능 구현",
        locked_scope_boundaries: { in: ["차단"], out: ["관리자"] },
        locked_in_out: true,
      },
    });

    // ── Phase 2: surface.generated → surface.confirmed ──
    appendScopeEvent(paths, {
      type: "surface.generated",
      actor: "system",
      payload: { surface_type: "experience", surface_path: "surface/preview/", content_hash: "h_sf", based_on_snapshot: 1 },
    });
    appendScopeEvent(paths, {
      type: "surface.confirmed",
      actor: "user",
      payload: { final_surface_path: "surface/preview/", final_content_hash: "h_sf", total_revisions: 0 },
    });

    // ── Phase 3: Discover constraints with structured options ──
    const constraints = [
      { id: "CST-001", summary: "매칭 제외 로직", severity: "required" as const },
      { id: "CST-002", summary: "차단 목록 DB 스키마", severity: "recommended" as const },
    ];

    for (const c of constraints) {
      appendScopeEvent(paths, {
        type: "constraint.discovered",
        actor: "system",
        payload: {
          constraint_id: c.id,
          perspective: "code",
          summary: c.summary,
          severity: c.severity,
          discovery_stage: "draft_phase2",
          decision_owner: "product_owner",
          impact_if_ignored: `${c.summary} 미반영 시 문제`,
          source_refs: [{ source: "src/matching.ts", detail: `${c.summary} 관련` }],
        },
      });
    }

    // Record constraint decisions
    for (const c of constraints) {
      appendScopeEvent(paths, {
        type: "constraint.decision_recorded",
        actor: "user",
        payload: {
          constraint_id: c.id,
          decision: "inject",
          selected_option: `${c.summary} 반영`,
          decision_owner: "product_owner",
          rationale: `${c.summary} 필수 반영`,
        },
      });
    }

    // target.locked
    appendScopeEvent(paths, {
      type: "target.locked",
      actor: "system",
      payload: {
        surface_hash: "h_sf",
        constraint_decisions: constraints.map((c) => ({ constraint_id: c.id, decision: "inject" as const })),
      },
    });

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("target_locked");
    expect(state.compile_ready).toBe(true);

    // ── Phase 4: Compile with structured fields ──
    const compileInput: CompileInput = {
      state,
      implementations: [
        {
          summary: "매칭 엔진에서 차단 사용자 제외",
          related_cst: ["CST-001"],
          target: "src/matching/engine.ts",
          detail: "차단 목록 조회 후 필터링",
          pseudocode: `function filterBlocked(candidates, blockedIds) {
  return candidates.filter(c => !blockedIds.includes(c.id));
}`,
          test_strategy: "단위 테스트: 빈 목록, 전체 차단, 부분 차단 케이스",
        },
        {
          summary: "차단 목록 DB 테이블 생성",
          related_cst: ["CST-002"],
          target: "src/db/migrations/add-block-table.sql",
          detail: "blocks 테이블 생성",
        },
      ],
      changes: [
        {
          action: "modify",
          file_path: "src/matching/engine.ts",
          description: "차단 필터링 로직 추가",
          related_impl_indices: [0],
          related_cst: ["CST-001"],
          before_context: "// 기존: 모든 후보를 반환\nreturn candidates;",
          after_context: "// 변경: 차단된 사용자 제외 후 반환\nreturn candidates.filter(c => !blockedIds.has(c.id));",
        },
        {
          action: "create",
          file_path: "src/db/migrations/add-block-table.sql",
          description: "blocks 테이블 생성 마이그레이션",
          related_impl_indices: [1],
          related_cst: ["CST-002"],
        },
      ],
      brownfield: {
        related_files: [
          { path: "src/matching/engine.ts", role: "매칭 엔진", detail_anchor: "matching-engine" },
        ],
        module_dependencies: [
          { module: "matching-engine", depends_on: "user-service", detail_anchor: "dep-matching-user" },
        ],
      },
      brownfieldDetail: {
        scope_id: "SC-LIFECYCLE-001",
        sections: [
          { anchor: "matching-engine", source: "app-src", title: "MatchingEngine", content: "매칭 엔진 코드 상세" },
          { anchor: "dep-matching-user", source: "app-src", title: "matching → user", content: "의존성 상세" },
        ],
      },
      surfaceSummary: "프로필에서 차단 → 확인 → 매칭 제외",
      injectValidations: [
        {
          related_cst: "CST-001",
          target: "매칭 제외 로직 검증",
          method: "단위 테스트 실행",
          pass_criteria: "차단 사용자가 후보에서 제외됨",
          fail_action: "구현 수정 후 재시도",
          edge_cases: [
            { scenario: "차단 목록이 빈 경우", expected_result: "모든 후보 반환" },
            { scenario: "모든 후보가 차단된 경우", expected_result: "빈 배열 반환" },
          ],
        },
        {
          related_cst: "CST-002",
          target: "DB 스키마 검증",
          method: "마이그레이션 실행 후 테이블 확인",
          pass_criteria: "blocks 테이블 존재",
          fail_action: "마이그레이션 스크립트 수정",
          edge_cases: [
            { scenario: "중복 차단 시도", expected_result: "unique constraint 동작" },
          ],
        },
      ],
    };

    const compileResult = compile(compileInput);
    expect(compileResult.success).toBe(true);
    if (!compileResult.success) return;

    // ── Phase 5: Verify build-spec.md contains pseudocode blocks ──
    expect(compileResult.buildSpecMd).toContain("## 1. Scope Summary");
    expect(compileResult.buildSpecMd).toContain("**pseudocode:**");
    expect(compileResult.buildSpecMd).toContain("filterBlocked");
    expect(compileResult.buildSpecMd).toContain("**test strategy:**");

    // ── Phase 6: Verify delta-set.json contains before/after_context ──
    const deltaSet = compileResult.deltaSet;
    const modifyChange = deltaSet.changes.find((c) => c.action === "modify");
    expect(modifyChange).toBeDefined();
    expect(modifyChange!.before_context).toContain("기존: 모든 후보를 반환");
    expect(modifyChange!.after_context).toContain("변경: 차단된 사용자 제외 후 반환");

    // ── Phase 7: Verify validation-plan.md contains edge_cases table ──
    expect(compileResult.validationPlanMd).toContain("Edge cases");
    expect(compileResult.validationPlanMd).toContain("차단 목록이 빈 경우");
    expect(compileResult.validationPlanMd).toContain("모든 후보가 차단된 경우");
    expect(compileResult.validationPlanMd).toContain("중복 차단 시도");

    // ── Phase 8: Verify compile-defense passes (edge_cases present) ──
    // If compile succeeded, defense passed. But let's verify the val items have edge_cases.
    const injectValItems = compileResult.validationPlan.filter((v) => v.decision_type === "inject");
    for (const v of injectValItems) {
      expect(v.edge_cases).toBeDefined();
      expect(v.edge_cases!.length).toBeGreaterThan(0);
    }

    // ── Phase 9: Record compile events and continue lifecycle ──
    const csResult = appendScopeEvent(paths, {
      type: "compile.started",
      actor: "system",
      payload: { snapshot_revision: 1, surface_hash: "h_sf" },
    });
    expect(csResult.success).toBe(true);

    const ccResult = appendScopeEvent(paths, {
      type: "compile.completed",
      actor: "system",
      payload: {
        build_spec_path: "build/build-spec.md",
        build_spec_hash: compileResult.buildSpecHash,
        brownfield_detail_path: "build/brownfield-detail.md",
        brownfield_detail_hash: compileResult.brownfieldDetailHash,
        delta_set_path: "build/delta-set.json",
        delta_set_hash: compileResult.deltaSetHash,
        validation_plan_path: "build/validation-plan.md",
        validation_plan_hash: compileResult.validationPlanHash,
      },
    });
    expect(ccResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("compiled");

    // Apply
    appendScopeEvent(paths, { type: "apply.started", actor: "agent", payload: { build_spec_hash: compileResult.buildSpecHash } });
    appendScopeEvent(paths, { type: "apply.completed", actor: "agent", payload: { result: "success" } });

    // Validation pass
    appendScopeEvent(paths, { type: "validation.started", actor: "agent", payload: { validation_plan_hash: compileResult.validationPlanHash } });
    appendScopeEvent(paths, {
      type: "validation.completed",
      actor: "agent",
      payload: { result: "pass", pass_count: 2, fail_count: 0, items: [] },
    });

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("validated");

    // Close
    appendScopeEvent(paths, { type: "scope.closed", actor: "user", payload: {} });

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("closed");
  });
});
