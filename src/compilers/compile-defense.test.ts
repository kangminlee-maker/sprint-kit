import { describe, it, expect } from "vitest";
import {
  compileDefense,
  type BuildSpecData,
  type DeltaSet,
  type ValidationPlanEntry,
  type ValidationPlanItem,
} from "./compile-defense.js";
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
  let req = 0, rec = 0, dec = 0, inv = 0;
  for (const e of entries) {
    if (e.severity === "required") req++; else rec++;
    if (e.status === "decided") dec++;
    if (e.status === "invalidated") inv++;
  }
  return { constraints: entries, summary: { total: entries.length, required: req, recommended: rec, decided: dec, clarify_pending: 0, invalidated: inv, undecided: 0 } };
}

function makeState(pool: ConstraintPool): ScopeState {
  return {
    scope_id: "SC-TEST", title: "T", description: "d", entry_mode: "experience",
    current_state: "target_locked", constraint_pool: pool,
    stale: false, compile_ready: true, convergence_blocked: false,
    revision_count_align: 0, revision_count_surface: 0, retry_count_compile: 0,
    verdict_log: [], feedback_history: [], latest_revision: 0,
  };
}

function makeBuildSpec(
  section3: BuildSpecData["section3"],
  section4: BuildSpecData["section4"],
): BuildSpecData {
  return { section3, section4 };
}

function makeDeltaSet(changes: DeltaSet["changes"]): DeltaSet {
  return { scope_id: "SC-TEST", surface_hash: "h", build_spec_hash: "h", changes };
}

// ─── Layer 1: Checklist ───

describe("compile-defense — Layer 1 Checklist", () => {
  it("passes when all non-invalidated constraints are in Section 3", () => {
    const pool = makePool(
      makeEntry("CST-001"),
      makeEntry("CST-002"),
      makeEntry("CST-003", { status: "invalidated", decision: undefined }),
    );
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }, { constraint_id: "CST-002", decision: "inject" }],
      [{ impl_id: "IMPL-001", related_cst: ["CST-001"] }, { impl_id: "IMPL-002", related_cst: ["CST-002"] }],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "create", file_path: "a.ts", description: "d", related_impl: ["IMPL-001"], related_cst: ["CST-001"] },
      { change_id: "CHG-002", action: "create", file_path: "b.ts", description: "d", related_impl: ["IMPL-002"], related_cst: ["CST-002"] },
    ]);
    const vp: ValidationPlanItem[] = [
      { val_id: "VAL-001", related_cst: "CST-001", decision_type: "inject", target: "t", method: "m", pass_criteria: "p", fail_action: "f", edge_cases: [{ scenario: "null", expected_result: "error" }] },
      { val_id: "VAL-002", related_cst: "CST-002", decision_type: "inject", target: "t", method: "m", pass_criteria: "p", fail_action: "f", edge_cases: [{ scenario: "null", expected_result: "error" }] },
    ];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(true);
  });

  it("fails when a constraint is missing from Section 3", () => {
    const pool = makePool(makeEntry("CST-001"), makeEntry("CST-002"));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }], // CST-002 missing
      [{ impl_id: "IMPL-001", related_cst: ["CST-001"] }],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "create", file_path: "a.ts", description: "d", related_impl: ["IMPL-001"], related_cst: ["CST-001"] },
    ]);
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "inject" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L1-checklist" && v.detail.includes("CST-002"))).toBe(true);
    }
  });

  it("ignores invalidated constraints", () => {
    const pool = makePool(
      makeEntry("CST-001"),
      makeEntry("CST-002", { status: "invalidated", decision: undefined }),
    );
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }],
      [{ impl_id: "IMPL-001", related_cst: ["CST-001"] }],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "create", file_path: "a.ts", description: "d", related_impl: ["IMPL-001"], related_cst: ["CST-001"] },
    ]);
    const vp: ValidationPlanItem[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "inject", target: "t", method: "m", pass_criteria: "p", fail_action: "f", edge_cases: [{ scenario: "null", expected_result: "error" }] }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(true);
  });
});

// ─── Layer 2: inject ───

describe("compile-defense — Layer 2 inject", () => {
  it("fails when inject has no IMPL", () => {
    const pool = makePool(makeEntry("CST-001"));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }],
      [], // no IMPL
    );
    const ds = makeDeltaSet([]);
    const vp: ValidationPlanEntry[] = [];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L2-inject-impl")).toBe(true);
    }
  });

  it("fails when inject has no CHG", () => {
    const pool = makePool(makeEntry("CST-001"));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }],
      [{ impl_id: "IMPL-001", related_cst: ["CST-001"] }],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "create", file_path: "a.ts", description: "d", related_impl: ["IMPL-001"], related_cst: [] }, // no CST-001
    ]);
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "inject" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L2-inject-chg")).toBe(true);
    }
  });

  it("fails when inject has no VAL", () => {
    const pool = makePool(makeEntry("CST-001"));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }],
      [{ impl_id: "IMPL-001", related_cst: ["CST-001"] }],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "create", file_path: "a.ts", description: "d", related_impl: ["IMPL-001"], related_cst: ["CST-001"] },
    ]);
    const vp: ValidationPlanEntry[] = []; // no VAL
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L2-inject-val")).toBe(true);
    }
  });
});

// ─── Layer 2: defer ───

describe("compile-defense — Layer 2 defer", () => {
  it("passes when defer source_refs not in delta-set", () => {
    const pool = makePool(makeEntry("CST-001", {
      decision: "defer",
      source_refs: [{ source: "src/untouched.ts", detail: "d" }],
    }));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "defer" }],
      [],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "modify", file_path: "src/other.ts", description: "d", related_impl: [], related_cst: [] },
    ]);
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "defer" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(true);
  });

  it("fails when defer source_refs file is modified", () => {
    const pool = makePool(makeEntry("CST-001", {
      decision: "defer",
      source_refs: [{ source: "src/modified.ts", detail: "d" }],
    }));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "defer" }],
      [],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "modify", file_path: "src/modified.ts", description: "d", related_impl: [], related_cst: [] },
    ]);
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "defer" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L2-defer-interfere")).toBe(true);
    }
  });

  it("fails when defer source_ref matches one of multiple CHGs with same file_path", () => {
    const pool = makePool(makeEntry("CST-001", {
      decision: "defer",
      source_refs: [{ source: "src/shared.ts", detail: "d" }],
    }));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "defer" }],
      [],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "modify", file_path: "src/other.ts", description: "d", related_impl: [], related_cst: [] },
      { change_id: "CHG-002", action: "modify", file_path: "src/shared.ts", description: "d", related_impl: [], related_cst: [] },
    ]);
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "defer" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L2-defer-interfere" && v.detail.includes("src/shared.ts"))).toBe(true);
    }
  });
});

// ─── Layer 2: override ───

describe("compile-defense — Layer 2 override", () => {
  it("passes when override is not reflected", () => {
    const pool = makePool(makeEntry("CST-001", {
      decision: "override",
      source_refs: [{ source: "src/policy.ts", detail: "d" }],
    }));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "override" }],
      [],
    );
    const ds = makeDeltaSet([]); // no changes
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "override" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(true);
  });

  it("fails when override is reflected in delta-set", () => {
    const pool = makePool(makeEntry("CST-001", {
      decision: "override",
      source_refs: [{ source: "src/policy.ts", detail: "d" }],
    }));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "override" }],
      [],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "modify", file_path: "src/policy.ts", description: "d", related_impl: [], related_cst: ["CST-001"] },
    ]);
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "override" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L2-override-reflected")).toBe(true);
    }
  });
});

// ─── Layer 2: traceability ───

describe("compile-defense — Layer 2 traceability", () => {
  it("fails when IMPL has no CHG", () => {
    const pool = makePool(makeEntry("CST-001"));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }],
      [{ impl_id: "IMPL-001", related_cst: ["CST-001"] }],
    );
    const ds = makeDeltaSet([]); // no changes for IMPL-001
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "inject" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L2-impl-no-chg")).toBe(true);
    }
  });
});

// ─── Layer 2: unexpected decision ───

describe("compile-defense — Layer 2 unexpected decision", () => {
  it("fails when decision is clarify", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "clarify" }));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "clarify" }],
      [],
    );
    const ds = makeDeltaSet([]);
    const vp: ValidationPlanEntry[] = [];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L2-decision-unexpected" && v.detail.includes("clarify"))).toBe(true);
    }
  });

  it("fails when decision is modify-direction", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "modify-direction" }));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "modify-direction" }],
      [],
    );
    const ds = makeDeltaSet([]);
    const vp: ValidationPlanEntry[] = [];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L2-decision-unexpected" && v.detail.includes("modify-direction"))).toBe(true);
    }
  });
});

// ─── Layer 2: CHG→IMPL reverse traceability ───

describe("compile-defense — Layer 2 CHG→IMPL reverse", () => {
  it("fails when CHG references non-existent IMPL", () => {
    const pool = makePool(makeEntry("CST-001"));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }],
      [{ impl_id: "IMPL-001", related_cst: ["CST-001"] }],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "create", file_path: "a.ts", description: "d", related_impl: ["IMPL-999"], related_cst: ["CST-001"] },
    ]);
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "inject" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L2-chg-orphan-impl" && v.detail.includes("IMPL-999"))).toBe(true);
    }
  });

  it("allows CHG with empty related_impl (defer/override context)", () => {
    const pool = makePool(makeEntry("CST-001", {
      decision: "defer",
      source_refs: [{ source: "src/untouched.ts", detail: "d" }],
    }));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "defer" }],
      [],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "modify", file_path: "src/other.ts", description: "d", related_impl: [], related_cst: [] },
    ]);
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "defer" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(true);
  });

  it("passes when all CHG.related_impl reference valid IMPLs", () => {
    const pool = makePool(makeEntry("CST-001"));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }],
      [{ impl_id: "IMPL-001", related_cst: ["CST-001"] }],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "create", file_path: "a.ts", description: "d", related_impl: ["IMPL-001"], related_cst: ["CST-001"] },
    ]);
    const vp: ValidationPlanItem[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "inject", target: "t", method: "m", pass_criteria: "p", fail_action: "f", edge_cases: [{ scenario: "null", expected_result: "error" }] }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(true);
  });
});

// ─── Golden data ───

describe("compile-defense — golden data", () => {
  it("passes for golden example constraints", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const { reduce } = await import("../kernel/reducer.js");

    const eventsPath = resolve(import.meta.dirname, "../../scopes/example-tutor-block/events.ndjson");
    const deltaSetPath = resolve(import.meta.dirname, "../../scopes/example-tutor-block/build/delta-set.json");

    const events = readFileSync(eventsPath, "utf-8").trimEnd().split("\n").map((l) => JSON.parse(l));
    const state = reduce(events);
    const deltaSet: DeltaSet = JSON.parse(readFileSync(deltaSetPath, "utf-8"));

    // Build Section 3 from pool (auto-generated)
    const section3 = state.constraint_pool.constraints
      .filter((c) => c.status !== "invalidated")
      .map((c) => ({ constraint_id: c.constraint_id, decision: c.decision! }));

    // Build Section 4 from delta-set (reverse-engineer IMPL→CST mapping)
    const implMap = new Map<string, string[]>();
    for (const chg of deltaSet.changes) {
      for (const implId of chg.related_impl) {
        if (!implMap.has(implId)) implMap.set(implId, []);
        for (const cst of chg.related_cst) {
          if (!implMap.get(implId)!.includes(cst)) implMap.get(implId)!.push(cst);
        }
      }
    }
    const section4 = Array.from(implMap.entries()).map(([impl_id, related_cst]) => ({ impl_id, related_cst }));

    const buildSpec = makeBuildSpec(section3, section4);

    // Build validation plan from golden validation-plan.md (simplified: 1 VAL per CST)
    const valPlan: ValidationPlanItem[] = state.constraint_pool.constraints
      .filter((c) => c.status !== "invalidated" && c.decision)
      .map((c, i) => ({
        val_id: `VAL-${String(i + 1).padStart(3, "0")}`,
        related_cst: c.constraint_id,
        decision_type: c.decision === "defer" ? "defer" as const : "inject" as const,
        target: `${c.summary} 검증`,
        method: `${c.summary} 구현 확인`,
        pass_criteria: `${c.constraint_id} 관련 동작 확인`,
        fail_action: "구현 오류",
        ...(c.decision !== "defer" ? { edge_cases: [{ scenario: `${c.constraint_id} 빈 입력`, expected_result: "에러 반환" }] } : {}),
      }));

    const result = compileDefense(state, buildSpec, deltaSet, valPlan);
    expect(result.passed).toBe(true);
  });
});

// ─── Additional Edge Cases ───

describe("compile-defense — additional edge cases", () => {
  it("multiple violations from different rules simultaneously", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "inject" }));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }],
      [], // no IMPL
    );
    const ds = makeDeltaSet([]); // no CHG
    const vp: ValidationPlanEntry[] = []; // no VAL
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L2-inject-impl")).toBe(true);
      expect(result.violations.some((v) => v.rule === "L2-inject-chg")).toBe(true);
      expect(result.violations.some((v) => v.rule === "L2-inject-val")).toBe(true);
    }
  });

  it("L1 + L2 violations simultaneously", () => {
    const pool = makePool(
      makeEntry("CST-001"), // missing from Section 3
      makeEntry("CST-002", { decision: "inject" }),
    );
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-002", decision: "inject" }], // CST-001 missing
      [{ impl_id: "IMPL-001", related_cst: ["CST-002"] }],
    );
    const ds = makeDeltaSet([]); // no CHG for CST-002
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-002", decision_type: "inject" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violations.some((v) => v.rule === "L1-checklist")).toBe(true);
      expect(result.violations.some((v) => v.rule === "L2-inject-chg")).toBe(true);
    }
  });

  it("empty pool passes defense", () => {
    const pool = makePool();
    const bs = makeBuildSpec([], []);
    const ds = makeDeltaSet([]);
    const vp: ValidationPlanEntry[] = [];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(true);
  });

  it("CHG with multiple related_impl one valid one invalid", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "inject" }));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }],
      [{ impl_id: "IMPL-001", related_cst: ["CST-001"] }],
    );
    const ds = makeDeltaSet([
      { change_id: "CHG-001", action: "create", file_path: "a.ts", description: "d", related_impl: ["IMPL-001", "IMPL-999"], related_cst: ["CST-001"] },
    ]);
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "inject" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      const orphanViolations = result.violations.filter((v) => v.rule === "L2-chg-orphan-impl");
      expect(orphanViolations).toHaveLength(1);
      expect(orphanViolations[0].detail).toContain("IMPL-999");
    }
  });

  it("multiple IMPLs without CHGs", () => {
    const pool = makePool(makeEntry("CST-001", { decision: "inject" }));
    const bs = makeBuildSpec(
      [{ constraint_id: "CST-001", decision: "inject" }],
      [
        { impl_id: "IMPL-001", related_cst: ["CST-001"] },
        { impl_id: "IMPL-002", related_cst: ["CST-001"] },
      ],
    );
    const ds = makeDeltaSet([]); // no changes at all
    const vp: ValidationPlanEntry[] = [{ val_id: "VAL-001", related_cst: "CST-001", decision_type: "inject" }];
    const result = compileDefense(makeState(pool), bs, ds, vp);
    expect(result.passed).toBe(false);
    if (!result.passed) {
      const implNoChg = result.violations.filter((v) => v.rule === "L2-impl-no-chg");
      expect(implNoChg).toHaveLength(2);
    }
  });
});
