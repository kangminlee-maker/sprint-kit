import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildConstraintPool,
  isConstraintsResolved,
  findConstraint,
} from "./constraint-pool.js";
import type { Event, ConstraintPool, ConstraintEntry } from "./types.js";

// ─── Helpers ───

const GOLDEN_EVENTS_PATH = resolve(
  import.meta.dirname,
  "../../scopes/example-tutor-block/events.ndjson",
);
const GOLDEN_POOL_PATH = resolve(
  import.meta.dirname,
  "../../scopes/example-tutor-block/state/constraint-pool.json",
);

function readGoldenEvents(): Event[] {
  return readFileSync(GOLDEN_EVENTS_PATH, "utf-8")
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line) as Event);
}

function readGoldenPool(): ConstraintPool {
  return JSON.parse(readFileSync(GOLDEN_POOL_PATH, "utf-8")) as ConstraintPool;
}

/** Create a minimal constraint.discovered event. */
function discovered(
  id: string,
  revision: number,
  overrides: Partial<{
    perspective: "experience" | "code" | "policy";
    severity: "required" | "recommended";
    decision_owner: "product_owner" | "builder";
    discovery_stage: "grounding" | "draft_phase1" | "draft_phase2" | "compile" | "apply";
  }> = {},
): Event {
  return {
    event_id: `evt_${revision}`,
    scope_id: "SC-TEST",
    type: "constraint.discovered",
    ts: `2026-01-01T00:00:${String(revision).padStart(2, "0")}Z`,
    revision,
    actor: "system",
    state_before: "surface_confirmed",
    state_after: "surface_confirmed",
    payload: {
      constraint_id: id,
      perspective: overrides.perspective ?? "code",
      summary: `test constraint ${id}`,
      severity: overrides.severity ?? "recommended",
      discovery_stage: overrides.discovery_stage ?? "draft_phase2",
      decision_owner: overrides.decision_owner ?? "product_owner",
      impact_if_ignored: "test impact",
      source_refs: [{ source: "test.ts", detail: "test detail" }],
    },
  } as Event;
}

/** Create a constraint.decision_recorded event. */
function decisionRecorded(
  id: string,
  revision: number,
  overrides: Partial<{
    decision: "inject" | "defer" | "override" | "clarify" | "modify-direction";
    decision_owner: "product_owner" | "builder";
    selected_option: string;
    rationale: string;
  }> = {},
): Event {
  return {
    event_id: `evt_${revision}`,
    scope_id: "SC-TEST",
    type: "constraint.decision_recorded",
    ts: `2026-01-01T00:00:${String(revision).padStart(2, "0")}Z`,
    revision,
    actor: "user",
    state_before: "surface_confirmed",
    state_after: "surface_confirmed",
    payload: {
      constraint_id: id,
      decision: overrides.decision ?? "inject",
      selected_option: overrides.selected_option ?? "option A",
      decision_owner: overrides.decision_owner ?? "product_owner",
      rationale: overrides.rationale ?? "test rationale",
    },
  } as Event;
}

/** Create a constraint.clarify_requested event. */
function clarifyRequested(id: string, revision: number): Event {
  return {
    event_id: `evt_${revision}`,
    scope_id: "SC-TEST",
    type: "constraint.clarify_requested",
    ts: `2026-01-01T00:00:${String(revision).padStart(2, "0")}Z`,
    revision,
    actor: "user",
    state_before: "surface_confirmed",
    state_after: "surface_confirmed",
    payload: {
      constraint_id: id,
      question: "test question",
      asked_to: "test team",
    },
  } as Event;
}

/** Create a constraint.clarify_resolved event. */
function clarifyResolved(
  id: string,
  revision: number,
  overrides: Partial<{
    decision: "inject" | "defer" | "override" | "modify-direction";
    decision_owner: "product_owner" | "builder";
  }> = {},
): Event {
  return {
    event_id: `evt_${revision}`,
    scope_id: "SC-TEST",
    type: "constraint.clarify_resolved",
    ts: `2026-01-01T00:00:${String(revision).padStart(2, "0")}Z`,
    revision,
    actor: "user",
    state_before: "surface_confirmed",
    state_after: "surface_confirmed",
    payload: {
      constraint_id: id,
      resolution: "resolved",
      decision: overrides.decision ?? "inject",
      selected_option: "resolved option",
      decision_owner: overrides.decision_owner ?? "product_owner",
      rationale: "resolved rationale",
    },
  } as Event;
}

/** Create a constraint.invalidated event. */
function invalidated(id: string, revision: number): Event {
  return {
    event_id: `evt_${revision}`,
    scope_id: "SC-TEST",
    type: "constraint.invalidated",
    ts: `2026-01-01T00:00:${String(revision).padStart(2, "0")}Z`,
    revision,
    actor: "system",
    state_before: "surface_confirmed",
    state_after: "surface_confirmed",
    payload: {
      constraint_id: id,
      reason: "no longer relevant",
    },
  } as Event;
}

/** Assert summary invariants hold for any pool. */
function assertSummaryInvariants(pool: ConstraintPool) {
  const { summary, constraints } = pool;
  expect(summary.total).toBe(constraints.length);
  expect(summary.required + summary.recommended).toBe(summary.total);
  expect(
    summary.decided +
      summary.clarify_pending +
      summary.invalidated +
      summary.undecided,
  ).toBe(summary.total);
}

// ─── Tests ───

describe("constraint-pool — golden data", () => {
  const events = readGoldenEvents();
  const expectedPool = readGoldenPool();

  it("buildConstraintPool matches golden constraint-pool.json", () => {
    const pool = buildConstraintPool(events);

    expect(pool.constraints).toHaveLength(expectedPool.constraints.length);
    expect(pool.summary).toEqual(expectedPool.summary);

    for (const expected of expectedPool.constraints) {
      const actual = findConstraint(pool, expected.constraint_id);
      expect(actual).toBeDefined();
      expect(actual).toEqual(expected);
    }
  });

  it("summary invariants hold for golden data", () => {
    const pool = buildConstraintPool(events);
    assertSummaryInvariants(pool);
  });

  it("isConstraintsResolved is true for golden data (all decided)", () => {
    const pool = buildConstraintPool(events);
    expect(isConstraintsResolved(pool)).toBe(true);
  });
});

describe("constraint-pool — status transitions", () => {
  it("discovered → decided", () => {
    const events = [
      discovered("CST-001", 1),
      decisionRecorded("CST-001", 2),
    ];
    const pool = buildConstraintPool(events);
    const entry = findConstraint(pool, "CST-001")!;

    expect(entry.status).toBe("decided");
    expect(entry.decision).toBe("inject");
    expect(entry.discovered_at).toBe(1);
    expect(entry.decided_at).toBe(2);
  });

  it("discovered → clarify_pending → clarify_resolved (decided)", () => {
    const events = [
      discovered("CST-001", 1),
      clarifyRequested("CST-001", 2),
      clarifyResolved("CST-001", 3),
    ];
    const pool = buildConstraintPool(events);
    const entry = findConstraint(pool, "CST-001")!;

    expect(entry.status).toBe("decided");
    expect(entry.decided_at).toBe(3);
  });

  it("discovered → invalidated", () => {
    const events = [discovered("CST-001", 1), invalidated("CST-001", 2)];
    const pool = buildConstraintPool(events);
    const entry = findConstraint(pool, "CST-001")!;

    expect(entry.status).toBe("invalidated");
  });

  it("undecided → invalidated direct path", () => {
    const events = [
      discovered("CST-001", 1, { severity: "recommended" }),
      invalidated("CST-001", 2),
    ];
    const pool = buildConstraintPool(events);
    const entry = findConstraint(pool, "CST-001")!;

    expect(entry.status).toBe("invalidated");
    expect(entry.severity).toBe("recommended");
    assertSummaryInvariants(pool);
    expect(pool.summary.invalidated).toBe(1);
    expect(pool.summary.undecided).toBe(0);
  });
});

describe("constraint-pool — decision_owner update", () => {
  it("discovered(builder) → decision_recorded(builder): same owner preserved", () => {
    const events = [
      discovered("CST-001", 1, { decision_owner: "builder" }),
      decisionRecorded("CST-001", 2, { decision_owner: "builder" }),
    ];
    const pool = buildConstraintPool(events);
    expect(findConstraint(pool, "CST-001")!.decision_owner).toBe("builder");
  });

  it("discovered(builder) → decision_recorded(product_owner): owner changed", () => {
    const events = [
      discovered("CST-001", 1, { decision_owner: "builder" }),
      decisionRecorded("CST-001", 2, { decision_owner: "product_owner" }),
    ];
    const pool = buildConstraintPool(events);
    expect(findConstraint(pool, "CST-001")!.decision_owner).toBe(
      "product_owner",
    );
  });

  it("discovered(PO) → clarify → clarify_resolved(builder): owner changed via clarify", () => {
    const events = [
      discovered("CST-001", 1, { decision_owner: "product_owner" }),
      clarifyRequested("CST-001", 2),
      clarifyResolved("CST-001", 3, { decision_owner: "builder" }),
    ];
    const pool = buildConstraintPool(events);
    expect(findConstraint(pool, "CST-001")!.decision_owner).toBe("builder");
  });

  it("two decision_recorded with different owners → last revision wins", () => {
    const events = [
      discovered("CST-001", 1, { decision_owner: "builder" }),
      decisionRecorded("CST-001", 2, { decision_owner: "builder" }),
      decisionRecorded("CST-001", 3, { decision_owner: "product_owner" }),
    ];
    const pool = buildConstraintPool(events);
    const entry = findConstraint(pool, "CST-001")!;

    expect(entry.decision_owner).toBe("product_owner");
    expect(entry.decided_at).toBe(3);
  });

  it("decision_recorded(builder) → invalidated: preserves last decided owner", () => {
    const events = [
      discovered("CST-001", 1, { decision_owner: "product_owner" }),
      decisionRecorded("CST-001", 2, { decision_owner: "builder" }),
      invalidated("CST-001", 3),
    ];
    const pool = buildConstraintPool(events);
    const entry = findConstraint(pool, "CST-001")!;

    expect(entry.status).toBe("invalidated");
    expect(entry.decision_owner).toBe("builder");
  });
});

describe("constraint-pool — conflict resolution", () => {
  it("same constraint_id with decision_recorded twice → last revision wins", () => {
    const events = [
      discovered("CST-001", 1),
      decisionRecorded("CST-001", 2, {
        decision: "defer",
        selected_option: "option A",
      }),
      decisionRecorded("CST-001", 3, {
        decision: "inject",
        selected_option: "option B",
      }),
    ];
    const pool = buildConstraintPool(events);
    const entry = findConstraint(pool, "CST-001")!;

    expect(entry.decision).toBe("inject");
    expect(entry.selected_option).toBe("option B");
    expect(entry.decided_at).toBe(3);
  });
});

describe("constraint-pool — empty pool", () => {
  it("no events → empty pool", () => {
    const pool = buildConstraintPool([]);

    expect(pool.constraints).toHaveLength(0);
    expect(pool.summary.total).toBe(0);
    assertSummaryInvariants(pool);
  });

  it("no constraint events → empty pool", () => {
    const nonConstraintEvent: Event = {
      event_id: "evt_1",
      scope_id: "SC-TEST",
      type: "align.locked",
      ts: "2026-01-01T00:00:01Z",
      revision: 1,
      actor: "user",
      state_before: "align_proposed",
      state_after: "align_locked",
      payload: {
        locked_direction: "test",
        locked_scope_boundaries: { in: [], out: [] },
        locked_in_out: true,
      },
    } as Event;
    const pool = buildConstraintPool([nonConstraintEvent]);

    expect(pool.constraints).toHaveLength(0);
    expect(isConstraintsResolved(pool)).toBe(true);
  });

  it("isConstraintsResolved is true for empty pool", () => {
    const pool = buildConstraintPool([]);
    expect(isConstraintsResolved(pool)).toBe(true);
  });
});

describe("constraint-pool — isConstraintsResolved", () => {
  it("undecided > 0 → false", () => {
    const events = [discovered("CST-001", 1), discovered("CST-002", 2)];
    const pool = buildConstraintPool(events);

    expect(pool.summary.undecided).toBe(2);
    expect(isConstraintsResolved(pool)).toBe(false);
  });

  it("clarify_pending > 0 → false", () => {
    const events = [
      discovered("CST-001", 1),
      clarifyRequested("CST-001", 2),
    ];
    const pool = buildConstraintPool(events);

    expect(pool.summary.clarify_pending).toBe(1);
    expect(isConstraintsResolved(pool)).toBe(false);
  });

  it("all decided → true", () => {
    const events = [
      discovered("CST-001", 1),
      discovered("CST-002", 2),
      decisionRecorded("CST-001", 3),
      decisionRecorded("CST-002", 4),
    ];
    const pool = buildConstraintPool(events);

    expect(isConstraintsResolved(pool)).toBe(true);
  });

  it("all invalidated → true", () => {
    const events = [
      discovered("CST-001", 1),
      discovered("CST-002", 2),
      invalidated("CST-001", 3),
      invalidated("CST-002", 4),
    ];
    const pool = buildConstraintPool(events);

    expect(isConstraintsResolved(pool)).toBe(true);
  });

  it("decided + invalidated mix, no undecided/clarify → true", () => {
    const events = [
      discovered("CST-001", 1),
      discovered("CST-002", 2),
      discovered("CST-003", 3),
      decisionRecorded("CST-001", 4),
      decisionRecorded("CST-002", 5),
      invalidated("CST-003", 6),
    ];
    const pool = buildConstraintPool(events);

    expect(pool.summary.decided).toBe(2);
    expect(pool.summary.invalidated).toBe(1);
    expect(isConstraintsResolved(pool)).toBe(true);
  });

  it("decided 5 + undecided 1 + clarify_pending 1 → false", () => {
    const events = [
      discovered("CST-001", 1),
      discovered("CST-002", 2),
      discovered("CST-003", 3),
      discovered("CST-004", 4),
      discovered("CST-005", 5),
      discovered("CST-006", 6),
      discovered("CST-007", 7),
      decisionRecorded("CST-001", 8),
      decisionRecorded("CST-002", 9),
      decisionRecorded("CST-003", 10),
      decisionRecorded("CST-004", 11),
      decisionRecorded("CST-005", 12),
      clarifyRequested("CST-006", 13),
      // CST-007 remains undecided
    ];
    const pool = buildConstraintPool(events);

    expect(pool.summary.decided).toBe(5);
    expect(pool.summary.clarify_pending).toBe(1);
    expect(pool.summary.undecided).toBe(1);
    expect(isConstraintsResolved(pool)).toBe(false);
    assertSummaryInvariants(pool);
  });
});

describe("constraint-pool — findConstraint", () => {
  it("existing id → entry", () => {
    const events = [discovered("CST-001", 1)];
    const pool = buildConstraintPool(events);

    expect(findConstraint(pool, "CST-001")).toBeDefined();
    expect(findConstraint(pool, "CST-001")!.constraint_id).toBe("CST-001");
  });

  it("non-existing id → undefined", () => {
    const events = [discovered("CST-001", 1)];
    const pool = buildConstraintPool(events);

    expect(findConstraint(pool, "CST-999")).toBeUndefined();
  });
});

describe("constraint-pool — defense (skip invalid input)", () => {
  it("decision_recorded for unknown constraint_id → skipped", () => {
    const events = [decisionRecorded("CST-UNKNOWN", 1)];
    const pool = buildConstraintPool(events);

    expect(pool.constraints).toHaveLength(0);
  });

  it("clarify_requested for unknown constraint_id → skipped", () => {
    const events = [clarifyRequested("CST-UNKNOWN", 1)];
    const pool = buildConstraintPool(events);

    expect(pool.constraints).toHaveLength(0);
  });

  it("duplicate constraint.discovered for same id → first one kept", () => {
    const events = [
      discovered("CST-001", 1, { severity: "required" }),
      discovered("CST-001", 2, { severity: "recommended" }),
    ];
    const pool = buildConstraintPool(events);

    expect(pool.constraints).toHaveLength(1);
    expect(findConstraint(pool, "CST-001")!.severity).toBe("required");
    expect(findConstraint(pool, "CST-001")!.discovered_at).toBe(1);
  });
});

describe("constraint-pool — summary invariants", () => {
  it("invariants hold for mixed status pool", () => {
    const events = [
      discovered("CST-001", 1, { severity: "required" }),
      discovered("CST-002", 2, { severity: "recommended" }),
      discovered("CST-003", 3, { severity: "required" }),
      discovered("CST-004", 4, { severity: "recommended" }),
      decisionRecorded("CST-001", 5),
      clarifyRequested("CST-002", 6),
      invalidated("CST-003", 7),
      // CST-004 remains undecided
    ];
    const pool = buildConstraintPool(events);

    assertSummaryInvariants(pool);
    expect(pool.summary.total).toBe(4);
    expect(pool.summary.required).toBe(2);
    expect(pool.summary.recommended).toBe(2);
    expect(pool.summary.decided).toBe(1);
    expect(pool.summary.clarify_pending).toBe(1);
    expect(pool.summary.invalidated).toBe(1);
    expect(pool.summary.undecided).toBe(1);
  });

  it("severity counts include invalidated constraints", () => {
    const events = [
      discovered("CST-001", 1, { severity: "required" }),
      invalidated("CST-001", 2),
    ];
    const pool = buildConstraintPool(events);

    expect(pool.summary.required).toBe(1);
    expect(pool.summary.invalidated).toBe(1);
    expect(pool.summary.total).toBe(1);
    assertSummaryInvariants(pool);
  });
});
