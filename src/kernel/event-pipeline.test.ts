import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { appendScopeEvent, type EventInput } from "./event-pipeline.js";
import type { EventType } from "./types.js";
import { createScope, resolveScopePaths } from "./scope-manager.js";
import { readEvents } from "./event-store.js";
import { reduce } from "./reducer.js";
import type { Event, ConstraintPool, VerdictLogEntry, ScopePaths } from "./types.js";

// ─── Temp dir management ───

let tempDir: string;
let paths: ScopePaths;

function setup() {
  tempDir = mkdtempSync(join(process.cwd(), ".tmp-test-"));
  paths = createScope(tempDir, "SC-TEST");
}

function teardown() {
  rmSync(tempDir, { recursive: true, force: true });
}

// ─── Event input factory (simplified — type + actor + payload only) ───

function input<T extends EventType>(
  type: T,
  payload: EventInput<T>["payload"],
  actor: "user" | "system" | "agent" = "system",
): EventInput<T> {
  return { type, actor, payload };
}

// ─── Scope manager tests ───

describe("scope-manager", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("creates scope directory structure", () => {
    expect(existsSync(paths.base)).toBe(true);
    expect(existsSync(paths.state)).toBe(true);
    expect(existsSync(paths.surface)).toBe(true);
    expect(existsSync(paths.build)).toBe(true);
    expect(existsSync(paths.inputs)).toBe(true);
  });

  it("resolveScopePaths returns correct paths and scopeId", () => {
    const resolved = resolveScopePaths(tempDir, "SC-TEST");
    expect(resolved.scopeId).toBe("SC-TEST");
    expect(resolved.events).toContain("events.ndjson");
    expect(resolved.constraintPool).toContain("constraint-pool.json");
    expect(resolved.verdictLog).toContain("verdict-log.json");
  });

  it("createScope is idempotent", () => {
    const paths2 = createScope(tempDir, "SC-TEST");
    expect(paths2.base).toBe(paths.base);
  });
});

// ─── Pipeline: sequential event recording ───

describe("event-pipeline — sequential recording", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("records scope.created as first event", () => {
    const result = appendScopeEvent(paths, input("scope.created", {
      title: "Test", description: "Test scope", entry_mode: "experience",
    }, "user"));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.event.revision).toBe(1);
      expect(result.next_state).toBe("draft");
      expect(result.event.scope_id).toBe("SC-TEST");
      expect(result.event.event_id).toBe("evt_001");
    }
  });

  it("records 3 sequential events: created → grounding → grounded", () => {
    appendScopeEvent(paths, input("scope.created", {
      title: "Test", description: "d", entry_mode: "experience",
    }, "user"));

    appendScopeEvent(paths, input("grounding.started", {
      sources: [{ type: "add-dir", path_or_url: "/test" }],
    }));

    const r3 = appendScopeEvent(paths, input("grounding.completed", {
      snapshot_revision: 1,
      source_hashes: { src: "hash1" },
      perspective_summary: { experience: 1, code: 2, policy: 1 },
    }));
    expect(r3.success).toBe(true);
    if (r3.success) {
      expect(r3.next_state).toBe("grounded");
      expect(r3.event.revision).toBe(3);
    }

    const events = readEvents(paths.events);
    expect(events).toHaveLength(3);
    expect(events[2].state_after).toBe("grounded");
  });

  it("auto-generates envelope fields", () => {
    const result = appendScopeEvent(paths, input("scope.created", {
      title: "T", description: "d", entry_mode: "experience",
    }, "user"));

    if (result.success) {
      expect(result.event.event_id).toBeDefined();
      expect(result.event.scope_id).toBe("SC-TEST");
      expect(result.event.ts).toBeDefined();
      expect(result.event.revision).toBe(1);
      expect(result.event.state_before).toBeNull();
      expect(result.event.state_after).toBe("draft");
    }
  });

  it("sets state_before from current state", () => {
    appendScopeEvent(paths, input("scope.created", {
      title: "T", description: "d", entry_mode: "experience",
    }, "user"));
    const r2 = appendScopeEvent(paths, input("grounding.started", { sources: [] }));

    if (r2.success) {
      expect(r2.event.state_before).toBe("draft");
    }
  });
});

// ─── Pipeline: rejection ───

describe("event-pipeline — rejection", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("rejects invalid transition", () => {
    appendScopeEvent(paths, input("scope.created", {
      title: "T", description: "d", entry_mode: "experience",
    }, "user"));

    const result = appendScopeEvent(paths, input("align.locked", {
      locked_direction: "d",
      locked_scope_boundaries: { in: [], out: [] },
      locked_in_out: true,
    }, "user"));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("Transition denied");
  });

  it("rejects scope.created when events exist", () => {
    appendScopeEvent(paths, input("scope.created", {
      title: "T", description: "d", entry_mode: "experience",
    }, "user"));

    const result = appendScopeEvent(paths, input("scope.created", {
      title: "T2", description: "d2", entry_mode: "interface",
    }, "user"));

    expect(result.success).toBe(false);
  });

  it("does not write event on rejection", () => {
    appendScopeEvent(paths, input("scope.created", {
      title: "T", description: "d", entry_mode: "experience",
    }, "user"));

    appendScopeEvent(paths, input("align.locked", {
      locked_direction: "d",
      locked_scope_boundaries: { in: [], out: [] },
      locked_in_out: true,
    }, "user"));

    expect(readEvents(paths.events)).toHaveLength(1);
  });
});

// ─── Pipeline: materialized views ───

describe("event-pipeline — materialized views", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("writes constraint-pool.json after event", () => {
    appendScopeEvent(paths, input("scope.created", {
      title: "T", description: "d", entry_mode: "experience",
    }, "user"));

    expect(existsSync(paths.constraintPool)).toBe(true);
    const pool = JSON.parse(readFileSync(paths.constraintPool, "utf-8")) as ConstraintPool;
    expect(pool.summary.total).toBe(0);
  });

  it("writes verdict-log.json after event", () => {
    appendScopeEvent(paths, input("scope.created", {
      title: "T", description: "d", entry_mode: "experience",
    }, "user"));

    expect(existsSync(paths.verdictLog)).toBe(true);
    const log = JSON.parse(readFileSync(paths.verdictLog, "utf-8")) as VerdictLogEntry[];
    expect(log).toHaveLength(0);
  });

  it("updates constraint-pool.json when constraints are added", () => {
    appendScopeEvent(paths, input("scope.created", { title: "T", description: "d", entry_mode: "experience" }, "user"));
    appendScopeEvent(paths, input("grounding.completed", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }));
    appendScopeEvent(paths, input("align.proposed", { packet_path: "p", packet_hash: "h", snapshot_revision: 1 }));
    appendScopeEvent(paths, input("align.locked", { locked_direction: "dir", locked_scope_boundaries: { in: [], out: [] }, locked_in_out: true }, "user"));
    appendScopeEvent(paths, input("surface.generated", { surface_type: "experience", surface_path: "s", content_hash: "h", based_on_snapshot: 1 }));
    appendScopeEvent(paths, input("surface.confirmed", { final_surface_path: "s", final_content_hash: "h", total_revisions: 0 }, "user"));

    appendScopeEvent(paths, input("constraint.discovered", {
      constraint_id: "CST-001", perspective: "code", summary: "test",
      severity: "required", discovery_stage: "draft_phase2",
      decision_owner: "builder", impact_if_ignored: "bad", source_refs: [],
    }));

    const pool = JSON.parse(readFileSync(paths.constraintPool, "utf-8")) as ConstraintPool;
    expect(pool.summary.total).toBe(1);
    expect(pool.summary.undecided).toBe(1);
  });

  it("updates verdict-log.json when decisions are made", () => {
    appendScopeEvent(paths, input("scope.created", { title: "T", description: "d", entry_mode: "experience" }, "user"));
    appendScopeEvent(paths, input("grounding.completed", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }));
    appendScopeEvent(paths, input("align.proposed", { packet_path: "p", packet_hash: "h", snapshot_revision: 1 }));
    appendScopeEvent(paths, input("align.locked", { locked_direction: "dir", locked_scope_boundaries: { in: [], out: [] }, locked_in_out: true }, "user"));
    appendScopeEvent(paths, input("surface.generated", { surface_type: "experience", surface_path: "s", content_hash: "h", based_on_snapshot: 1 }));
    appendScopeEvent(paths, input("surface.confirmed", { final_surface_path: "s", final_content_hash: "h", total_revisions: 0 }, "user"));
    appendScopeEvent(paths, input("constraint.discovered", {
      constraint_id: "CST-001", perspective: "code", summary: "test",
      severity: "required", discovery_stage: "draft_phase2",
      decision_owner: "builder", impact_if_ignored: "bad", source_refs: [],
    }));

    appendScopeEvent(paths, input("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "inject", selected_option: "opt",
      decision_owner: "builder", rationale: "needed",
    }, "agent"));

    const log = JSON.parse(readFileSync(paths.verdictLog, "utf-8")) as VerdictLogEntry[];
    expect(log).toHaveLength(2);
    expect(log[0].type).toBe("align.locked");
    expect(log[1].type).toBe("constraint.decision_recorded");
  });
});

// ─── Pipeline: state returned for caller rendering ───

describe("event-pipeline — state for caller rendering", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("returns updatedState so caller can render scope.md", async () => {
    const result = appendScopeEvent(paths, input("scope.created", {
      title: "Test Scope", description: "d", entry_mode: "experience",
    }, "user"));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state).toBeDefined();
      expect(result.state.title).toBe("Test Scope");
      expect(result.state.current_state).toBe("draft");

      // Caller can render scope.md using returned state
      const { renderScopeMd } = await import("../renderers/scope-md.js");
      const md = renderScopeMd(result.state);
      expect(md).toContain("# Scope: Test Scope");
    }
  });
});

// ─── Pipeline: rejection recovery ───

describe("event-pipeline — rejection recovery", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("rejects invalid event then accepts valid event", () => {
    appendScopeEvent(paths, input("scope.created", {
      title: "T", description: "d", entry_mode: "experience",
    }, "user"));

    // Invalid: align.locked not allowed from draft
    const rejected = appendScopeEvent(paths, input("align.locked", {
      locked_direction: "d",
      locked_scope_boundaries: { in: [], out: [] },
      locked_in_out: true,
    }, "user"));
    expect(rejected.success).toBe(false);

    // Valid: grounding.started is allowed from draft
    const accepted = appendScopeEvent(paths, input("grounding.started", {
      sources: [{ type: "add-dir", path_or_url: "/test" }],
    }));
    expect(accepted.success).toBe(true);
    if (accepted.success) {
      expect(accepted.event.revision).toBe(2);
      expect(accepted.next_state).toBe("draft");
    }
  });
});

// ─── Pipeline: terminal state rejection ───

describe("event-pipeline — terminal state rejection", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("rejects events after scope.deferred (terminal state)", () => {
    appendScopeEvent(paths, input("scope.created", {
      title: "T", description: "d", entry_mode: "experience",
    }, "user"));

    appendScopeEvent(paths, input("scope.deferred", {
      reason: "postponed", resume_condition: "next quarter",
    }, "user"));

    const result = appendScopeEvent(paths, input("grounding.started", {
      sources: [{ type: "add-dir", path_or_url: "/test" }],
    }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("Transition denied");
  });

  it("rejects events after scope.rejected (terminal state)", () => {
    appendScopeEvent(paths, input("scope.created", {
      title: "T", description: "d", entry_mode: "experience",
    }, "user"));

    appendScopeEvent(paths, input("scope.rejected", {
      reason: "not feasible", rejection_basis: "cost",
    }, "user"));

    const result = appendScopeEvent(paths, input("grounding.started", {
      sources: [{ type: "add-dir", path_or_url: "/test" }],
    }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.reason).toContain("Transition denied");
  });
});

// ─── Pipeline: constraint lifecycle with materialized views ───

describe("event-pipeline — constraint lifecycle materialized views", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("discovered → decided: constraint-pool.json has decided constraint", () => {
    appendScopeEvent(paths, input("scope.created", { title: "T", description: "d", entry_mode: "experience" }, "user"));
    appendScopeEvent(paths, input("grounding.completed", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }));
    appendScopeEvent(paths, input("align.proposed", { packet_path: "p", packet_hash: "h", snapshot_revision: 1 }));
    appendScopeEvent(paths, input("align.locked", { locked_direction: "dir", locked_scope_boundaries: { in: [], out: [] }, locked_in_out: true }, "user"));
    appendScopeEvent(paths, input("surface.generated", { surface_type: "experience", surface_path: "s", content_hash: "h", based_on_snapshot: 1 }));
    appendScopeEvent(paths, input("surface.confirmed", { final_surface_path: "s", final_content_hash: "h", total_revisions: 0 }, "user"));

    appendScopeEvent(paths, input("constraint.discovered", {
      constraint_id: "CST-001", perspective: "code", summary: "test",
      severity: "required", discovery_stage: "draft_phase2",
      decision_owner: "builder", impact_if_ignored: "bad", source_refs: [],
    }));

    appendScopeEvent(paths, input("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "inject", selected_option: "opt",
      decision_owner: "builder", rationale: "needed",
    }, "agent"));

    const pool = JSON.parse(readFileSync(paths.constraintPool, "utf-8")) as ConstraintPool;
    expect(pool.summary.total).toBe(1);
    expect(pool.summary.decided).toBe(1);
    expect(pool.summary.undecided).toBe(0);
    expect(pool.constraints[0].status).toBe("decided");
    expect(pool.constraints[0].decision).toBe("inject");
  });
});

// ─── Pipeline: verdict-log clarify_resolved ───

describe("event-pipeline — verdict-log clarify_resolved", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("verdict-log includes clarify_resolved entries", () => {
    appendScopeEvent(paths, input("scope.created", { title: "T", description: "d", entry_mode: "experience" }, "user"));
    appendScopeEvent(paths, input("grounding.completed", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }));
    appendScopeEvent(paths, input("align.proposed", { packet_path: "p", packet_hash: "h", snapshot_revision: 1 }));
    appendScopeEvent(paths, input("align.locked", { locked_direction: "dir", locked_scope_boundaries: { in: [], out: [] }, locked_in_out: true }, "user"));
    appendScopeEvent(paths, input("surface.generated", { surface_type: "experience", surface_path: "s", content_hash: "h", based_on_snapshot: 1 }));
    appendScopeEvent(paths, input("surface.confirmed", { final_surface_path: "s", final_content_hash: "h", total_revisions: 0 }, "user"));

    appendScopeEvent(paths, input("constraint.discovered", {
      constraint_id: "CST-001", perspective: "code", summary: "test",
      severity: "required", discovery_stage: "draft_phase2",
      decision_owner: "product_owner", impact_if_ignored: "bad", source_refs: [],
    }));

    appendScopeEvent(paths, input("constraint.clarify_requested", {
      constraint_id: "CST-001", question: "clarify this?", asked_to: "team",
    }, "agent"));

    appendScopeEvent(paths, input("constraint.clarify_resolved", {
      constraint_id: "CST-001", resolution: "resolved", decision: "inject",
      selected_option: "opt", decision_owner: "product_owner", rationale: "clear now",
    }, "user"));

    const log = JSON.parse(readFileSync(paths.verdictLog, "utf-8")) as VerdictLogEntry[];
    const clarifyEntries = log.filter(e => e.type === "constraint.clarify_resolved");
    expect(clarifyEntries.length).toBeGreaterThanOrEqual(1);
    expect(clarifyEntries[0].type).toBe("constraint.clarify_resolved");
  });
});

// ─── Pipeline: golden data replay ───

describe("event-pipeline — golden data replay", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("replays all 29 golden events and produces matching materialized views", () => {
    const goldenEventsPath = resolve(
      import.meta.dirname,
      "../../scopes/example-tutor-block/events.ndjson",
    );
    const goldenPoolPath = resolve(
      import.meta.dirname,
      "../../scopes/example-tutor-block/state/constraint-pool.json",
    );
    const goldenVerdictPath = resolve(
      import.meta.dirname,
      "../../scopes/example-tutor-block/state/verdict-log.json",
    );

    const goldenEvents: Event[] = readFileSync(goldenEventsPath, "utf-8")
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line) as Event);

    // Replay: extract type/actor/payload from golden events
    for (const evt of goldenEvents) {
      const result = appendScopeEvent(paths, {
        type: evt.type,
        actor: evt.actor,
        payload: evt.payload,
      } as EventInput);
      expect(
        result.success,
        `Event ${evt.event_id} (${evt.type}) failed: ${!result.success ? (result as { reason: string }).reason : ""}`,
      ).toBe(true);
    }

    // Verify events count
    const replayedEvents = readEvents(paths.events);
    expect(replayedEvents).toHaveLength(29);

    // Verify constraint-pool.json matches golden
    const expectedPool = JSON.parse(readFileSync(goldenPoolPath, "utf-8")) as ConstraintPool;
    const actualPool = JSON.parse(readFileSync(paths.constraintPool, "utf-8")) as ConstraintPool;
    expect(actualPool.summary).toEqual(expectedPool.summary);
    expect(actualPool.constraints).toEqual(expectedPool.constraints);

    // Verify verdict-log.json matches golden (structure, not timestamps)
    const expectedLog = JSON.parse(readFileSync(goldenVerdictPath, "utf-8")) as VerdictLogEntry[];
    const actualLog = JSON.parse(readFileSync(paths.verdictLog, "utf-8")) as VerdictLogEntry[];
    expect(actualLog).toHaveLength(expectedLog.length);
    for (let i = 0; i < expectedLog.length; i++) {
      // Compare structure but not ts (generated at replay time)
      const { ts: _ets, ...expectedEntry } = expectedLog[i] as Record<string, unknown>;
      const { ts: _ats, ...actualEntry } = actualLog[i] as Record<string, unknown>;
      expect(actualEntry).toEqual(expectedEntry);
    }

    // Verify final state
    const finalState = reduce(replayedEvents);
    expect(finalState.current_state).toBe("compiled");
    expect(finalState.latest_revision).toBe(29);
  });
});

// ─── Pipeline: structured rejection (PR-9) ───

describe("event-pipeline — structured rejection fields", () => {
  beforeEach(setup);
  afterEach(teardown);

  it("rejection includes current_state and rejected_type for invalid transition", () => {
    // Set up: create scope in draft state
    appendScopeEvent(paths, input("scope.created", {
      title: "T", description: "d", entry_mode: "experience",
    }, "user"));

    // draft does not allow align.locked
    const result = appendScopeEvent(paths, input("align.locked", {
      locked_direction: "dir", locked_scope_boundaries: { in: [], out: [] }, locked_in_out: true,
    }, "user"));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.current_state).toBe("draft");
      expect(result.rejected_type).toBe("align.locked");
      expect(result.reason).toContain("Transition denied");
    }
  });

  it("compile.started rejection after retry limit includes structured fields", () => {
    // Build up to target_locked state with golden events
    appendScopeEvent(paths, input("scope.created", { title: "T", description: "d", entry_mode: "experience" }, "user"));
    appendScopeEvent(paths, input("grounding.started", { sources: [] }));
    appendScopeEvent(paths, input("grounding.completed", { snapshot_revision: 1, source_hashes: {}, perspective_summary: { experience: 0, code: 0, policy: 0 } }));
    appendScopeEvent(paths, input("align.proposed", { packet_path: "p", packet_hash: "h", snapshot_revision: 1 }));
    appendScopeEvent(paths, input("align.locked", { locked_direction: "dir", locked_scope_boundaries: { in: [], out: [] }, locked_in_out: true }, "user"));
    appendScopeEvent(paths, input("surface.generated", { surface_type: "experience", surface_path: "s", content_hash: "h", based_on_snapshot: 1 }));
    appendScopeEvent(paths, input("surface.confirmed", { final_surface_path: "s", final_content_hash: "h", total_revisions: 0 }, "user"));

    // Add a constraint + decide it so we can lock target
    appendScopeEvent(paths, input("constraint.discovered", {
      constraint_id: "CST-001", perspective: "code", summary: "test",
      severity: "required", discovery_stage: "draft_phase2",
      decision_owner: "builder", impact_if_ignored: "bad", source_refs: [],
    }));
    appendScopeEvent(paths, input("constraint.decision_recorded", {
      constraint_id: "CST-001", decision: "inject", selected_option: "opt",
      decision_owner: "builder", rationale: "needed",
    }, "agent"));

    // Lock target
    appendScopeEvent(paths, input("target.locked", {
      surface_hash: "h",
      constraint_decisions: [{ constraint_id: "CST-001", decision: "inject" }],
    }));

    // Simulate 3 compile gap_found cycles to hit retry limit
    // Each cycle: compile.started → compile.constraint_gap_found (→ constraints_resolved)
    //   then re-lock target to get back to target_locked
    for (let i = 0; i < 3; i++) {
      appendScopeEvent(paths, input("compile.started", { snapshot_revision: 1, surface_hash: "h" }));
      appendScopeEvent(paths, input("compile.constraint_gap_found", {
        new_constraint_id: `CST-GAP-${i}`, perspective: "code", summary: "gap",
      }));
      // gap_found transitions to constraints_resolved; re-lock to get back to target_locked
      appendScopeEvent(paths, input("target.locked", {
        surface_hash: "h",
        constraint_decisions: [{ constraint_id: "CST-001", decision: "inject" }],
      }));
    }

    // 4th compile.started should be rejected (retry_count_compile === 3)
    const result = appendScopeEvent(paths, input("compile.started", { snapshot_revision: 1, surface_hash: "h" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.current_state).toBe("target_locked");
      expect(result.rejected_type).toBe("compile.started");
      expect(result.reason).toContain("Compile retry limit");
    }
  });
});
