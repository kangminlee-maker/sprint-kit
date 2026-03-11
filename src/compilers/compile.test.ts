import { describe, it, expect } from "vitest";
import { compile, type CompileInput, type CompileSuccess, type BrownfieldContext, type BrownfieldDetail, type ImplementationItem, type ChangeItem, type InjectValidation } from "./compile.js";
import { contentHash } from "../kernel/hash.js";
import type { ScopeState, ConstraintPool, ConstraintEntry } from "../kernel/types.js";

// ─── Helpers ───

function makeEntry(id: string, overrides: Partial<ConstraintEntry> = {}): ConstraintEntry {
  return {
    constraint_id: id, perspective: "code", summary: `summary ${id}`,
    severity: "recommended", discovery_stage: "draft_phase2", decision_owner: "product_owner",
    impact_if_ignored: `impact ${id}`, source_refs: [{ source: "src/test.ts", detail: "d" }],
    status: "decided", decision: "inject", selected_option: "opt", discovered_at: 1, decided_at: 2,
    ...overrides,
  };
}

function makePool(...entries: ConstraintEntry[]): ConstraintPool {
  let req = 0, rec = 0, dec = 0, inv = 0, cp = 0, und = 0;
  for (const e of entries) {
    if (e.severity === "required") req++; else rec++;
    if (e.status === "decided") dec++;
    if (e.status === "invalidated") inv++;
    if (e.status === "clarify_pending") cp++;
    if (e.status === "undecided") und++;
  }
  return { constraints: entries, summary: { total: entries.length, required: req, recommended: rec, decided: dec, clarify_pending: cp, invalidated: inv, undecided: und } };
}

function makeState(pool: ConstraintPool, overrides: Partial<ScopeState> = {}): ScopeState {
  return {
    scope_id: "SC-TEST", title: "Test Scope", description: "d", entry_mode: "experience",
    current_state: "target_locked", direction: "test direction",
    scope_boundaries: { in: ["feature A"], out: ["feature B"] },
    surface_hash: "abc123", constraint_pool: pool,
    stale: false, compile_ready: true, convergence_blocked: false,
    revision_count_align: 0, revision_count_surface: 0, retry_count_compile: 0,
    verdict_log: [], feedback_history: [], latest_revision: 10,
    ...overrides,
  };
}

function makeBrownfield(): BrownfieldContext {
  return {
    related_files: [{ path: "src/app.ts", role: "entry point", detail_anchor: "app-entry" }],
    module_dependencies: [{ module: "app", depends_on: "db", detail_anchor: "dep-app-db" }],
  };
}

function makeBrownfieldDetail(): BrownfieldDetail {
  return {
    scope_id: "SC-TEST",
    sections: [
      { anchor: "app-entry", source: "local", title: "app.ts", content: "Entry point of the application" },
      { anchor: "dep-app-db", source: "local", title: "app → db", content: "App module depends on db module" },
    ],
  };
}

function makeFullInput(overrides: Partial<CompileInput> = {}): CompileInput {
  const pool = makePool(
    makeEntry("CST-001", { decision: "inject" }),
    makeEntry("CST-002", { decision: "defer", source_refs: [{ source: "src/other.ts", detail: "d" }] }),
  );
  return {
    state: makeState(pool),
    implementations: [
      { summary: "Add feature A", related_cst: ["CST-001"], target: "src/feature.ts", detail: "Create file" },
    ],
    changes: [
      { action: "create", file_path: "src/feature.ts", description: "New file", related_impl_indices: [0], related_cst: ["CST-001"] },
    ],
    brownfield: makeBrownfield(),
    brownfieldDetail: makeBrownfieldDetail(),
    surfaceSummary: "Test scenario summary",
    injectValidations: [
      { related_cst: "CST-001", target: "feature A", method: "unit test", pass_criteria: "passes", fail_action: "fix", edge_cases: [{ scenario: "empty input", expected_result: "returns error" }] },
    ],
    ...overrides,
  };
}

// ─── Input Validation ───

describe("compile — input validation", () => {
  it("fails when state is not target_locked", () => {
    const input = makeFullInput({ state: makeState(makePool(), { current_state: "compiled" }) });
    const result = compile(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("target_locked");
  });

  it("fails when compile_ready is false", () => {
    const input = makeFullInput({ state: makeState(makePool(), { compile_ready: false }) });
    const result = compile(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("compile_ready");
  });

  it("fails when surface_hash is missing", () => {
    const input = makeFullInput({ state: makeState(makePool(), { surface_hash: undefined }) });
    const result = compile(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("surface_hash");
  });

  it("fails when direction is missing", () => {
    const input = makeFullInput({ state: makeState(makePool(), { direction: undefined }) });
    const result = compile(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("direction");
  });

  it("fails when scope_boundaries is missing", () => {
    const input = makeFullInput({ state: makeState(makePool(), { scope_boundaries: undefined }) });
    const result = compile(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("scope_boundaries");
  });

  it("fails when clarify decision exists", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "clarify" }));
    const input = makeFullInput({ state: makeState(pool) });
    const result = compile(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("clarify");
  });

  it("fails when modify-direction decision exists", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "modify-direction" }));
    const input = makeFullInput({ state: makeState(pool) });
    const result = compile(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("modify-direction");
  });

  it("fails when related_impl_indices is out of range", () => {
    const input = makeFullInput({
      changes: [{ action: "create", file_path: "a.ts", description: "d", related_impl_indices: [99], related_cst: ["CST-001"] }],
    });
    const result = compile(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("invalid index");
  });

  it("fails when inject constraint has no validation", () => {
    const input = makeFullInput({ injectValidations: [] });
    const result = compile(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("CST-001");
  });
});

// ─── ID Assignment ───

describe("compile — ID assignment", () => {
  it("assigns sequential IMPL IDs", () => {
    const input = makeFullInput({
      implementations: [
        { summary: "A", related_cst: ["CST-001"], target: "a.ts", detail: "d" },
        { summary: "B", related_cst: ["CST-001"], target: "b.ts", detail: "d" },
      ],
      changes: [
        { action: "create", file_path: "a.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
        { action: "create", file_path: "b.ts", description: "d", related_impl_indices: [1], related_cst: ["CST-001"] },
      ],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecData.section4.map((s) => s.impl_id)).toEqual(["IMPL-001", "IMPL-002"]);
    }
  });

  it("assigns sequential CHG IDs", () => {
    const input = makeFullInput();
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.deltaSet.changes.map((c) => c.change_id)).toEqual(["CHG-001"]);
    }
  });

  it("maps related_impl_indices to IMPL IDs", () => {
    const input = makeFullInput();
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.deltaSet.changes[0].related_impl).toEqual(["IMPL-001"]);
    }
  });

  it("assigns sequential VAL IDs (inject first, then defer)", () => {
    const input = makeFullInput();
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.validationPlan.map((v) => v.val_id)).toEqual(["VAL-001", "VAL-002"]);
      expect(result.validationPlan[0].decision_type).toBe("inject");
      expect(result.validationPlan[1].decision_type).toBe("defer");
    }
  });
});

// ─── Defense Integration ───

describe("compile — defense integration", () => {
  it("fails when inject has no IMPL", () => {
    const input = makeFullInput({ implementations: [], changes: [] });
    const result = compile(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      // validateInput catches missing CHG/IMPL before compile-defense runs
      expect(result.reason).toContain("inject constraint");
    }
  });

  it("passes with valid full input", () => {
    const result = compile(makeFullInput());
    expect(result.success).toBe(true);
  });
});

// ─── Markdown Structure ───

describe("compile — Build Spec markdown", () => {
  it("contains all 7 section headers", () => {
    const result = compile(makeFullInput());
    expect(result.success).toBe(true);
    if (!result.success) return;
    const md = result.buildSpecMd;
    expect(md).toContain("## 1. Scope Summary");
    expect(md).toContain("## 2. Confirmed Surface");
    expect(md).toContain("## 3. Constraint Decision Map");
    expect(md).toContain("## 4. Implementation Plan");
    expect(md).toContain("## 5. Delta Set Reference");
    expect(md).toContain("## 6. Validation Plan Reference");
    expect(md).toContain("## 7. Brownfield Context");
  });

  it("includes scope info in Section 1", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    expect(result.buildSpecMd).toContain("SC-TEST");
    expect(result.buildSpecMd).toContain("test direction");
    expect(result.buildSpecMd).toContain("feature A");
  });

  it("includes all CST-IDs in Section 3", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    expect(result.buildSpecMd).toContain("CST-001");
    expect(result.buildSpecMd).toContain("CST-002");
  });

  it("includes IMPL details in Section 4", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    expect(result.buildSpecMd).toContain("IMPL-001");
    expect(result.buildSpecMd).toContain("Add feature A");
  });

  it("test files in brownfield are rendered as Tier 2 (collapsed)", () => {
    const brownfield: BrownfieldContext = {
      related_files: [
        { path: "src/app.ts", role: "typescript (local)", detail_anchor: "app-entry" },
        { path: "src/app.test.ts", role: "test (local)", detail_anchor: "app-test" },
      ],
      module_dependencies: [],
    };
    const result = compile(makeFullInput({ brownfield })) as CompileSuccess;
    // Non-test file is in Tier 1 (always visible)
    expect(result.buildSpecMd).toContain("### 변경 대상 파일 (1건)");
    expect(result.buildSpecMd).toContain("src/app.ts");
    // Test file is in Tier 2 (collapsed <details>)
    expect(result.buildSpecMd).toContain("<summary>테스트 파일 (1건)</summary>");
    expect(result.buildSpecMd).toContain("src/app.test.ts");
  });

  it("Tier 1 items are always visible, Tier 2 uses <details>", () => {
    const brownfield: BrownfieldContext = {
      related_files: [{ path: "src/app.ts", role: "entry", detail_anchor: "app-entry" }],
      module_dependencies: [{ module: "app", depends_on: "db", detail_anchor: "dep-app-db" }],
      api_contracts: [{ endpoint: "/api/test", method: "GET", description: "test", detail_anchor: "api-test" }],
    };
    const result = compile(makeFullInput({ brownfield })) as CompileSuccess;
    // Tier 1: always visible (no <details> wrapping)
    expect(result.buildSpecMd).toContain("### 변경 대상 파일");
    expect(result.buildSpecMd).toContain("### 직접 의존 모듈");
    // Tier 2: collapsed with <details>
    expect(result.buildSpecMd).toContain("<details>");
    expect(result.buildSpecMd).toContain("API 계약");
    // detail reference links
    expect(result.buildSpecMd).toContain("[→ 상세](brownfield-detail.md#app-entry)");
  });
});

describe("compile — validation-plan markdown", () => {
  it("contains VAL headers with correct format", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    expect(result.validationPlanMd).toContain("### VAL-001 | CST-001 | inject");
    expect(result.validationPlanMd).toContain("### VAL-002 | CST-002 | defer");
  });

  it("includes all 4 required fields per VAL", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    expect(result.validationPlanMd).toContain("**검증 대상:**");
    expect(result.validationPlanMd).toContain("**검증 방법:**");
    expect(result.validationPlanMd).toContain("**통과 조건:**");
    expect(result.validationPlanMd).toContain("**실패 시 조치:**");
  });

  it("auto-generates defer VAL with source_refs", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    const deferVal = result.validationPlan.find((v) => v.decision_type === "defer");
    expect(deferVal).toBeDefined();
    expect(deferVal!.method).toContain("src/other.ts");
  });
});

describe("compile — delta-set JSON", () => {
  it("produces valid JSON", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    const parsed = JSON.parse(result.deltaSetJson);
    expect(parsed.scope_id).toBe("SC-TEST");
    expect(parsed.changes).toHaveLength(1);
  });

  it("includes surface_hash and build_spec_hash", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    expect(result.deltaSet.surface_hash).toBe("abc123");
    expect(result.deltaSet.build_spec_hash).toBeTruthy();
  });
});

// ─── Hash Integrity ───

describe("compile — hash integrity", () => {
  it("buildSpecHash matches contentHash(buildSpecMd)", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    expect(result.buildSpecHash).toBe(contentHash(result.buildSpecMd));
  });

  it("deltaSetHash matches contentHash(deltaSetJson)", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    expect(result.deltaSetHash).toBe(contentHash(result.deltaSetJson));
  });

  it("validationPlanHash matches contentHash(validationPlanMd)", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    expect(result.validationPlanHash).toBe(contentHash(result.validationPlanMd));
  });

  it("delta-set.build_spec_hash is non-empty", () => {
    const result = compile(makeFullInput()) as CompileSuccess;
    expect(result.deltaSet.build_spec_hash.length).toBeGreaterThan(0);
  });
});

// ─── Edge Cases ───

describe("compile — edge cases", () => {
  it("handles override constraint with auto-generated VAL", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject" }),
      makeEntry("CST-002", { decision: "override", source_refs: [{ source: "src/policy.ts", detail: "d" }] }),
    );
    const input = makeFullInput({
      state: makeState(pool),
      injectValidations: [
        { related_cst: "CST-001", target: "t", method: "m", pass_criteria: "p", fail_action: "f", edge_cases: [{ scenario: "null input", expected_result: "error" }] },
      ],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const overrideVal = result.validationPlan.find((v) => v.decision_type === "override");
      expect(overrideVal).toBeDefined();
      expect(overrideVal!.method).toContain("src/policy.ts");
    }
  });

  it("handles invalidated constraint (excluded from defense, included in markdown)", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject" }),
      makeEntry("CST-INV", { status: "invalidated", decision: undefined, invalidation_reason: "direction changed" }),
    );
    const input = makeFullInput({ state: makeState(pool) });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).toContain("CST-INV");
      expect(result.buildSpecMd).toContain("direction changed");
      // Defense section3 should NOT include invalidated
      expect(result.buildSpecData.section3.find((s) => s.constraint_id === "CST-INV")).toBeUndefined();
    }
  });

  it("handles multiple implementations for one constraint", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "inject" }));
    const input: CompileInput = {
      state: makeState(pool),
      implementations: [
        { summary: "Impl A", related_cst: ["CST-001"], target: "a.ts", detail: "d" },
        { summary: "Impl B", related_cst: ["CST-001"], target: "b.ts", detail: "d" },
      ],
      changes: [
        { action: "create", file_path: "a.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
        { action: "modify", file_path: "b.ts", description: "d", related_impl_indices: [1], related_cst: ["CST-001"] },
      ],
      brownfield: makeBrownfield(),
      brownfieldDetail: makeBrownfieldDetail(),
      surfaceSummary: "s",
      injectValidations: [
        { related_cst: "CST-001", target: "t", method: "m", pass_criteria: "p", fail_action: "f", edge_cases: [{ scenario: "null input", expected_result: "error" }] },
      ],
    };
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.deltaSet.changes).toHaveLength(2);
      expect(result.buildSpecData.section4).toHaveLength(2);
    }
  });

  it("is deterministic — same input produces same output", () => {
    const input = makeFullInput();
    const r1 = compile(input) as CompileSuccess;
    const r2 = compile(input) as CompileSuccess;
    expect(r1.buildSpecHash).toBe(r2.buildSpecHash);
    expect(r1.deltaSetHash).toBe(r2.deltaSetHash);
    expect(r1.validationPlanHash).toBe(r2.validationPlanHash);
  });
});

// ─── Additional Edge Cases ───

describe("compile — additional edge cases", () => {
  it("all defer constraints: no IMPL, defer-only validation plan", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "defer", source_refs: [{ source: "src/a.ts", detail: "d" }] }),
      makeEntry("CST-002", { decision: "defer", source_refs: [{ source: "src/b.ts", detail: "d" }] }),
    );
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [],
      changes: [],
      injectValidations: [],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.validationPlan).toHaveLength(2);
      expect(result.validationPlan.every((v) => v.decision_type === "defer")).toBe(true);
      expect(result.buildSpecMd).toContain("구현 항목 없음");
    }
  });

  it("all override constraints: override-only validation plan", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "override", source_refs: [{ source: "a.ts", detail: "d" }] }),
    );
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [],
      changes: [],
      injectValidations: [],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.validationPlan).toHaveLength(1);
      expect(result.validationPlan[0].decision_type).toBe("override");
    }
  });

  it("brownfield with all optional sections", () => {
    const brownfield: BrownfieldContext = {
      related_files: [{ path: "src/app.ts", role: "entry", detail_anchor: "app-entry" }],
      module_dependencies: [{ module: "app", depends_on: "db", detail_anchor: "dep-app-db" }],
      api_contracts: [{ endpoint: "/api/test", method: "GET", description: "test endpoint", detail_anchor: "api-test" }],
      db_schemas: [{ table: "users", columns: "id, name", detail_anchor: "schema-users" }],
      config_env: [{ key: "DB_URL", description: "database connection", detail_anchor: "config-db-url" }],
    };
    const input = makeFullInput({ brownfield });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).toContain("API 계약");
      expect(result.buildSpecMd).toContain("DB 스키마");
      expect(result.buildSpecMd).toContain("설정/환경 변수");
    }
  });

  it("empty brownfield fields", () => {
    const brownfield: BrownfieldContext = {
      related_files: [],
      module_dependencies: [],
    };
    const input = makeFullInput({ brownfield });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const section7Start = result.buildSpecMd.indexOf("## 7. Brownfield Context");
      const section7Content = result.buildSpecMd.slice(section7Start);
      expect(section7Content).not.toContain("<details>");
    }
  });

  it("interface entry_mode uses contract-diff path", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "inject" }));
    const input = makeFullInput({
      state: makeState(pool, { entry_mode: "interface" }),
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).toContain("surface/contract-diff/");
    }
  });

  it("3+ invalidated shows collapsible details", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject" }),
      makeEntry("CST-INV1", { status: "invalidated", decision: undefined, invalidation_reason: "r1" }),
      makeEntry("CST-INV2", { status: "invalidated", decision: undefined, invalidation_reason: "r2" }),
      makeEntry("CST-INV3", { status: "invalidated", decision: undefined, invalidation_reason: "r3" }),
    );
    const input = makeFullInput({ state: makeState(pool) });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).toContain("<details>");
      expect(result.buildSpecMd).toContain("무효화된 항목 (3건)");
    }
  });

  it("exactly 2 invalidated shows plain list", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject" }),
      makeEntry("CST-INV1", { status: "invalidated", decision: undefined, invalidation_reason: "r1" }),
      makeEntry("CST-INV2", { status: "invalidated", decision: undefined, invalidation_reason: "r2" }),
    );
    const input = makeFullInput({ state: makeState(pool) });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const section3Start = result.buildSpecMd.indexOf("## 3. Constraint Decision Map");
      const section4Start = result.buildSpecMd.indexOf("## 4. Implementation Plan");
      const section3Content = result.buildSpecMd.slice(section3Start, section4Start);
      expect(section3Content).toContain("무효화된 항목:");
      expect(section3Content).not.toContain("<details>");
    }
  });

  it("multiple injectValidations for same CST produces multiple VALs", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject" }),
      makeEntry("CST-002", { decision: "inject" }),
    );
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [
        { summary: "A", related_cst: ["CST-001"], target: "a.ts", detail: "d" },
        { summary: "B", related_cst: ["CST-002"], target: "b.ts", detail: "d" },
      ],
      changes: [
        { action: "create", file_path: "a.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
        { action: "create", file_path: "b.ts", description: "d", related_impl_indices: [1], related_cst: ["CST-002"] },
      ],
      injectValidations: [
        { related_cst: "CST-001", target: "t1", method: "m1", pass_criteria: "p1", fail_action: "f1", edge_cases: [{ scenario: "null", expected_result: "error" }] },
        { related_cst: "CST-002", target: "t2", method: "m2", pass_criteria: "p2", fail_action: "f2", edge_cases: [{ scenario: "null", expected_result: "error" }] },
      ],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const injectVals = result.validationPlan.filter(v => v.decision_type === "inject");
      expect(injectVals).toHaveLength(2);
    }
  });

  it("implementation with depends_on shows in Section 4", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "inject" }));
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [
        { summary: "Base", related_cst: ["CST-001"], target: "base.ts", detail: "base detail" },
        { summary: "Derived", related_cst: ["CST-001"], target: "derived.ts", detail: "derived detail", depends_on: ["IMPL-001"] },
      ],
      changes: [
        { action: "create", file_path: "base.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
        { action: "create", file_path: "derived.ts", description: "d", related_impl_indices: [1], related_cst: ["CST-001"] },
      ],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).toContain("**의존성:** IMPL-001");
    }
  });

  it("implementation with guardrail shows in Section 4", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "inject" }));
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [
        { summary: "A", related_cst: ["CST-001"], target: "a.ts", detail: "d", guardrail: "API 호환 유지" },
      ],
      changes: [
        { action: "create", file_path: "a.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
      ],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).toContain("**guardrail:** API 호환 유지");
    }
  });

  it("implementation with assumptions shows in Section 4", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "inject" }));
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [
        { summary: "A", related_cst: ["CST-001"], target: "a.ts", detail: "d", assumptions: ["DB 스키마 변경 없음", "API 하위 호환 유지"] },
      ],
      changes: [
        { action: "create", file_path: "a.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
      ],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).toContain("**전제 가정:**");
      expect(result.buildSpecMd).toContain("DB 스키마 변경 없음");
      expect(result.buildSpecMd).toContain("API 하위 호환 유지");
    }
  });

  it("implementation without assumptions does not render assumptions section", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "inject" }));
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [
        { summary: "A", related_cst: ["CST-001"], target: "a.ts", detail: "d" },
      ],
      changes: [
        { action: "create", file_path: "a.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
      ],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).not.toContain("**전제 가정:**");
    }
  });

  it("Section 5 action counts format (create 2건 + modify 3건)", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "inject" }));
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [
        { summary: "A", related_cst: ["CST-001"], target: "a.ts", detail: "d" },
      ],
      changes: [
        { action: "create", file_path: "a.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
        { action: "create", file_path: "b.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
        { action: "modify", file_path: "c.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
        { action: "modify", file_path: "d.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
        { action: "modify", file_path: "e.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
      ],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).toContain("create 2건");
      expect(result.buildSpecMd).toContain("modify 3건");
    }
  });

  it("Section 5 with only delete actions shows delete count", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "inject" }));
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [
        { summary: "A", related_cst: ["CST-001"], target: "a.ts", detail: "d" },
      ],
      changes: [
        { action: "delete", file_path: "old.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] },
      ],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).toContain("delete 1건");
    }
  });

  it("defer with multiple source_refs", () => {
    const pool = makePool(
      makeEntry("CST-001", {
        decision: "defer",
        source_refs: [{ source: "a.ts", detail: "d" }, { source: "b.ts", detail: "d" }],
      }),
    );
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [],
      changes: [],
      injectValidations: [],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const deferVal = result.validationPlan.find((v) => v.decision_type === "defer");
      expect(deferVal).toBeDefined();
      expect(deferVal!.method).toContain("a.ts");
      expect(deferVal!.method).toContain("b.ts");
    }
  });
});

// ─── requires_policy_change rendering ───

describe("compile — requires_policy_change output", () => {
  it("Section 3 shows policy change warning for inject + requires_policy_change", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject", requires_policy_change: true, evidence_note: "정책 변경 근거" }),
    );
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [{ summary: "feat", related_cst: ["CST-001"], target: "t", detail: "d" }],
      changes: [{ action: "create" as const, file_path: "a.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] }],
      injectValidations: [{ related_cst: "CST-001", target: "t", method: "m", pass_criteria: "p", fail_action: "f", edge_cases: [{ scenario: "s", expected_result: "r" }] }],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).toContain("정책 변경 검토 필요");
      expect(result.buildSpecMd).toContain("CST-001");
    }
  });

  it("decisionTreatment appends [정책 변경 검토 필요] for inject + requires_policy_change", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject", requires_policy_change: true }),
    );
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [{ summary: "feat", related_cst: ["CST-001"], target: "t", detail: "d" }],
      changes: [{ action: "create" as const, file_path: "a.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] }],
      injectValidations: [{ related_cst: "CST-001", target: "t", method: "m", pass_criteria: "p", fail_action: "f", edge_cases: [{ scenario: "s", expected_result: "r" }] }],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).toContain("[정책 변경 검토 필요]");
    }
  });

  it("validation plan shows policy warning for inject + requires_policy_change", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject", requires_policy_change: true }),
    );
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [{ summary: "feat", related_cst: ["CST-001"], target: "t", detail: "d" }],
      changes: [{ action: "create" as const, file_path: "a.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] }],
      injectValidations: [{ related_cst: "CST-001", target: "t", method: "m", pass_criteria: "p", fail_action: "f", edge_cases: [{ scenario: "s", expected_result: "r" }] }],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.validationPlanMd).toContain("정책 변경 전제");
    }
  });

  it("no policy warning when requires_policy_change is false", () => {
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject", requires_policy_change: false }),
    );
    const input = makeFullInput({
      state: makeState(pool),
      implementations: [{ summary: "feat", related_cst: ["CST-001"], target: "t", detail: "d" }],
      changes: [{ action: "create" as const, file_path: "a.ts", description: "d", related_impl_indices: [0], related_cst: ["CST-001"] }],
      injectValidations: [{ related_cst: "CST-001", target: "t", method: "m", pass_criteria: "p", fail_action: "f", edge_cases: [{ scenario: "s", expected_result: "r" }] }],
    });
    const result = compile(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.buildSpecMd).not.toContain("정책 변경 검토 필요");
      expect(result.validationPlanMd).not.toContain("정책 변경 전제");
    }
  });
});
