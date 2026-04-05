import { describe, it, expect } from "vitest";
import { validate, type ValidateInput } from "./validate.js";
import type { ScopeState, ConstraintPool, ValidationItemResult } from "../kernel/types.js";
import type { ValidationPlanItem } from "../compilers/compile-defense.js";

// ─── Helpers ───

function makeState(overrides: Partial<ScopeState> = {}): ScopeState {
  const emptyPool: ConstraintPool = {
    constraints: [],
    summary: { total: 0, required: 0, recommended: 0, decided: 0, clarify_pending: 0, invalidated: 0, undecided: 0 },
  };
  return {
    scope_id: "SC-TEST", title: "T", description: "d", entry_mode: "experience",
    current_state: "applied", constraint_pool: emptyPool,
    stale: false, compile_ready: true, convergence_blocked: false,
    revision_count_align: 0, revision_count_surface: 0, retry_count_compile: 0,
    validation_plan_hash: "plan_hash_abc",
    verdict_log: [], feedback_history: [], latest_revision: 20,
    ...overrides,
  };
}

function makePlan(...items: Array<{ val_id: string; cst: string; type: "inject" | "defer" | "override" }>): ValidationPlanItem[] {
  return items.map((i) => ({
    val_id: i.val_id,
    related_cst: i.cst,
    decision_type: i.type,
    target: `target ${i.val_id}`,
    method: `method ${i.val_id}`,
    pass_criteria: `criteria ${i.val_id}`,
    fail_action: `action ${i.val_id}`,
  }));
}

function makeResults(...items: Array<{ val_id: string; cst: string; result: "pass" | "fail"; detail?: string }>): ValidationItemResult[] {
  return items.map((i) => ({
    val_id: i.val_id,
    related_cst: i.cst,
    result: i.result,
    detail: i.detail ?? `${i.result} detail`,
  }));
}

function makeInput(overrides: Partial<ValidateInput> = {}): ValidateInput {
  return {
    state: makeState(),
    plan: makePlan(
      { val_id: "VAL-001", cst: "CST-001", type: "inject" },
      { val_id: "VAL-002", cst: "CST-002", type: "defer" },
    ),
    results: makeResults(
      { val_id: "VAL-001", cst: "CST-001", result: "pass" },
      { val_id: "VAL-002", cst: "CST-002", result: "pass" },
    ),
    actualPlanHash: "plan_hash_abc",
    ...overrides,
  };
}

// ─── Input Validation ───

describe("validate — input validation", () => {
  it("fails when state is not applied", () => {
    const input = makeInput({ state: makeState({ current_state: "compiled" }) });
    const result = validate(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("applied");
  });

  it("fails when validation_plan_hash mismatches", () => {
    const input = makeInput({ actualPlanHash: "wrong_hash" });
    const result = validate(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("mismatch");
  });

  it("passes when state has no validation_plan_hash (first compile)", () => {
    const input = makeInput({ state: makeState({ validation_plan_hash: undefined }) });
    const result = validate(input);
    expect(result.success).toBe(true);
  });

  it("fails when a plan item has no result", () => {
    const input = makeInput({
      results: makeResults({ val_id: "VAL-001", cst: "CST-001", result: "pass" }),
      // VAL-002 missing
    });
    const result = validate(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("VAL-002");
  });

  it("fails when result references non-existent plan item", () => {
    const input = makeInput({
      results: makeResults(
        { val_id: "VAL-001", cst: "CST-001", result: "pass" },
        { val_id: "VAL-002", cst: "CST-002", result: "pass" },
        { val_id: "VAL-999", cst: "CST-999", result: "fail" },
      ),
    });
    const result = validate(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("VAL-999");
  });

  it("fails when results contain duplicate val_id", () => {
    const input = makeInput({
      results: makeResults(
        { val_id: "VAL-001", cst: "CST-001", result: "pass" },
        { val_id: "VAL-001", cst: "CST-001", result: "fail" },
      ),
    });

    const result = validate(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("duplicate VAL-001");
  });

  it("fails when result related_cst mismatches the validation plan", () => {
    const input = makeInput({
      results: makeResults(
        { val_id: "VAL-001", cst: "CST-999", result: "pass" },
        { val_id: "VAL-002", cst: "CST-002", result: "pass" },
      ),
    });

    const result = validate(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("CST-999");
  });
});

// ─── Aggregation ───

describe("validate — aggregation", () => {
  it("returns pass when all items pass", () => {
    const result = validate(makeInput());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe("pass");
      expect(result.pass_count).toBe(2);
      expect(result.fail_count).toBe(0);
    }
  });

  it("returns fail when any item fails", () => {
    const input = makeInput({
      results: makeResults(
        { val_id: "VAL-001", cst: "CST-001", result: "pass" },
        { val_id: "VAL-002", cst: "CST-002", result: "fail", detail: "간섭 발견" },
      ),
    });
    const result = validate(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe("fail");
      expect(result.pass_count).toBe(1);
      expect(result.fail_count).toBe(1);
    }
  });

  it("returns fail when all items fail", () => {
    const input = makeInput({
      results: makeResults(
        { val_id: "VAL-001", cst: "CST-001", result: "fail" },
        { val_id: "VAL-002", cst: "CST-002", result: "fail" },
      ),
    });
    const result = validate(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe("fail");
      expect(result.pass_count).toBe(0);
      expect(result.fail_count).toBe(2);
    }
  });

  it("includes all items in output", () => {
    const result = validate(makeInput());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.items).toHaveLength(2);
      expect(result.items[0].val_id).toBe("VAL-001");
      expect(result.items[1].val_id).toBe("VAL-002");
    }
  });
});

// ─── Edge Cases ───

describe("validate — edge cases", () => {
  it("handles empty plan and results (all-pass)", () => {
    const input = makeInput({ plan: [], results: [] });
    const result = validate(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe("pass");
      expect(result.pass_count).toBe(0);
      expect(result.fail_count).toBe(0);
    }
  });

  it("is deterministic", () => {
    const input = makeInput();
    const r1 = validate(input);
    const r2 = validate(input);
    expect(r1).toEqual(r2);
  });

  it("handles inject + defer + override mix", () => {
    const plan = makePlan(
      { val_id: "VAL-001", cst: "CST-001", type: "inject" },
      { val_id: "VAL-002", cst: "CST-002", type: "defer" },
      { val_id: "VAL-003", cst: "CST-003", type: "override" },
    );
    const results = makeResults(
      { val_id: "VAL-001", cst: "CST-001", result: "pass" },
      { val_id: "VAL-002", cst: "CST-002", result: "pass" },
      { val_id: "VAL-003", cst: "CST-003", result: "fail", detail: "override가 반영됨" },
    );
    const input = makeInput({ plan, results });
    const result = validate(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe("fail");
      expect(result.fail_count).toBe(1);
      expect(result.items.find((i) => i.val_id === "VAL-003")?.detail).toBe("override가 반영됨");
    }
  });
});

// ─── Additional Edge Cases ───

describe("validate — additional edge cases", () => {
  it("plan and results in different order passes", () => {
    const plan = makePlan(
      { val_id: "VAL-002", cst: "CST-002", type: "defer" },
      { val_id: "VAL-001", cst: "CST-001", type: "inject" },
    );
    const results = makeResults(
      { val_id: "VAL-001", cst: "CST-001", result: "pass" },
      { val_id: "VAL-002", cst: "CST-002", result: "pass" },
    );
    const input = makeInput({ plan, results });
    const result = validate(input);
    expect(result.success).toBe(true);
  });

  it("large result set with 1 fail", () => {
    const items: Array<{ val_id: string; cst: string; type: "inject" }> = [];
    const resultItems: Array<{ val_id: string; cst: string; result: "pass" | "fail" }> = [];
    for (let i = 1; i <= 20; i++) {
      const valId = `VAL-${String(i).padStart(3, "0")}`;
      const cstId = `CST-${String(i).padStart(3, "0")}`;
      items.push({ val_id: valId, cst: cstId, type: "inject" });
      resultItems.push({ val_id: valId, cst: cstId, result: i === 10 ? "fail" : "pass" });
    }
    const input = makeInput({
      plan: makePlan(...items),
      results: makeResults(...resultItems),
    });
    const result = validate(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe("fail");
      expect(result.pass_count).toBe(19);
      expect(result.fail_count).toBe(1);
    }
  });

  it("state target_locked rejected", () => {
    const input = makeInput({ state: makeState({ current_state: "target_locked" }) });
    const result = validate(input);
    expect(result.success).toBe(false);
  });

  it("state validated rejected", () => {
    const input = makeInput({ state: makeState({ current_state: "validated" }) });
    const result = validate(input);
    expect(result.success).toBe(false);
  });
});
