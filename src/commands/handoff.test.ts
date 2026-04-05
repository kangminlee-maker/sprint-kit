import { describe, expect, it, afterEach } from "vitest";
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildHandoffPrd } from "./handoff.js";
import type { ConstraintEntry, ScopeState } from "../kernel/types.js";

function makeConstraint(
  constraint_id: string,
  overrides: Partial<ConstraintEntry> = {},
): ConstraintEntry {
  return {
    constraint_id,
    perspective: "code",
    summary: `${constraint_id} summary`,
    severity: "recommended",
    discovery_stage: "draft_phase2",
    decision_owner: "product_owner",
    impact_if_ignored: "impact",
    source_refs: [],
    evidence_status: "verified",
    status: "decided",
    decision: "inject",
    rationale: "default rationale",
    discovered_at: 1,
    decided_at: 2,
    ...overrides,
  };
}

function makeState(constraints: ConstraintEntry[]): ScopeState {
  const decided = constraints.filter((constraint) => constraint.status === "decided").length;
  const clarifyPending = constraints.filter((constraint) => constraint.status === "clarify_pending").length;
  const invalidated = constraints.filter((constraint) => constraint.status === "invalidated").length;
  const undecided = constraints.filter((constraint) => constraint.status === "undecided").length;

  return {
    scope_id: "SC-HANDOFF-001",
    title: "Handoff Test",
    description: "handoff description",
    entry_mode: "experience",
    current_state: "validated",
    direction: "handoff direction",
    scope_boundaries: { in: ["scope in"], out: ["scope out"] },
    constraint_pool: {
      constraints,
      summary: {
        total: constraints.length,
        required: constraints.filter((constraint) => constraint.severity === "required").length,
        recommended: constraints.filter((constraint) => constraint.severity === "recommended").length,
        decided,
        clarify_pending: clarifyPending,
        invalidated: invalidated,
        undecided,
      },
    },
    stale: false,
    compile_ready: true,
    convergence_blocked: false,
    revision_count_align: 0,
    revision_count_surface: 0,
    retry_count_compile: 0,
    snapshot_revision: 1,
    verdict_log: [],
    feedback_history: [],
    pre_apply_completed: true,
    prd_review_completed: true,
    latest_revision: 1,
  };
}

describe("buildHandoffPrd", () => {
  it("classifies deferred constraints as decide-later items regardless of owner", () => {
    const state = makeState([
      makeConstraint("CST-PO-DEFER", {
        decision: "defer",
        decision_owner: "product_owner",
        rationale: "po decided to defer",
      }),
      makeConstraint("CST-BUILDER-DEFER", {
        decision: "defer",
        decision_owner: "builder",
        rationale: "builder deferred implementation",
      }),
    ]);

    const handoff = buildHandoffPrd(null, state);

    expect(handoff.decide_later_items).toEqual([
      "[CST-PO-DEFER] CST-PO-DEFER summary — po decided to defer",
      "[CST-BUILDER-DEFER] CST-BUILDER-DEFER summary — builder deferred implementation",
    ]);
    expect(handoff.unclassified_constraints).toEqual([]);
  });

  // ─── A. PRD Markdown Parsing ───

  describe("PRD Markdown Parsing", () => {
    let tempDir: string;

    afterEach(() => {
      if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    });

    it("extracts goal from Executive Summary section", () => {
      tempDir = mkdtempSync(join(tmpdir(), "handoff-test-"));
      const prdPath = join(tempDir, "prd.md");
      writeFileSync(
        prdPath,
        "## Executive Summary\n\nThis is the goal paragraph with enough text to pass the length check.\n\nSecond paragraph.",
      );

      const handoff = buildHandoffPrd(prdPath, makeState([]));

      expect(handoff.goal).toBe(
        "This is the goal paragraph with enough text to pass the length check.",
      );
    });

    it("falls back to state.direction when no PRD file", () => {
      const handoff = buildHandoffPrd(null, makeState([]));

      expect(handoff.goal).toBe("handoff direction");
    });

    it("handles PRD with h3 headings", () => {
      tempDir = mkdtempSync(join(tmpdir(), "handoff-test-"));
      const prdPath = join(tempDir, "prd.md");
      writeFileSync(
        prdPath,
        "### Executive Summary\n\nGoal text here is long enough to be valid.\n\n### User Journeys\n\nSome journey content.",
      );

      const handoff = buildHandoffPrd(prdPath, makeState([]));

      expect(handoff.goal).toBe(
        "Goal text here is long enough to be valid.",
      );
    });

    it("handles PRD with no headings — falls back to state", () => {
      tempDir = mkdtempSync(join(tmpdir(), "handoff-test-"));
      const prdPath = join(tempDir, "prd.md");
      writeFileSync(prdPath, "Just some plain text without any markdown headings.");

      const handoff = buildHandoffPrd(prdPath, makeState([]));

      expect(handoff.goal).toBe("handoff direction");
    });
  });

  // ─── B. User Journey Extraction ───

  describe("User Journey Extraction", () => {
    let tempDir: string;

    afterEach(() => {
      if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    });

    it("extracts user journeys from PRD User Journeys section", () => {
      tempDir = mkdtempSync(join(tmpdir(), "handoff-test-"));
      const prdPath = join(tempDir, "prd.md");
      writeFileSync(
        prdPath,
        [
          "## User Journeys",
          "",
          "### Sign up for free trial (critical)",
          "",
          "**Persona:** New visitor",
          "",
          "User navigates to sign-up page...",
          "",
          "### Upgrade subscription",
          "",
          "**Persona:** Existing customer (premium)",
          "",
          "User clicks upgrade button...",
        ].join("\n"),
      );

      const handoff = buildHandoffPrd(prdPath, makeState([]));

      expect(handoff.user_journeys).toHaveLength(2);
      expect(handoff.user_journeys[0]).toEqual({
        persona: "New visitor",
        action: "Sign up for free trial",
      });
      expect(handoff.user_journeys[1]).toEqual({
        persona: "Existing customer",
        action: "Upgrade subscription",
      });
    });

    it("falls back to scope_boundaries.in when no journeys in PRD", () => {
      const handoff = buildHandoffPrd(null, makeState([]));

      expect(handoff.user_journeys).toEqual([
        { persona: "user", action: "scope in" },
      ]);
    });
  });

  // ─── C. Constraint Classification ───

  describe("Constraint Classification", () => {
    it("classifies inject constraints as applied_constraints", () => {
      const state = makeState([
        makeConstraint("CST-INJ-001", {
          decision: "inject",
          selected_option: "option A",
        }),
      ]);

      const handoff = buildHandoffPrd(null, state);

      expect(handoff.applied_constraints).toHaveLength(1);
      expect(handoff.applied_constraints[0]).toEqual({
        constraint_id: "CST-INJ-001",
        perspective: "code",
        summary: "CST-INJ-001 summary",
        severity: "recommended",
        selected_option: "option A",
        impact_if_ignored: "impact",
      });
    });

    it("classifies override constraints as overrides_and_exceptions", () => {
      const state = makeState([
        makeConstraint("CST-OVR-001", {
          decision: "override",
          rationale: "product decision",
        }),
      ]);

      const handoff = buildHandoffPrd(null, state);

      expect(handoff.overrides_and_exceptions).toEqual([
        "[CST-OVR-001] CST-OVR-001 summary — overridden: product decision",
      ]);
    });

    it("places invalidated constraints in no output section", () => {
      const state = makeState([
        makeConstraint("CST-INV-001", {
          status: "invalidated",
          decision: "inject",
        }),
      ]);

      const handoff = buildHandoffPrd(null, state);

      expect(handoff.applied_constraints).toEqual([]);
      expect(handoff.decide_later_items).toEqual([]);
      expect(handoff.overrides_and_exceptions).toEqual([]);
      expect(handoff.unclassified_constraints).toEqual([]);
    });

    it("captures unclassified constraints as safety net", () => {
      const state = makeState([
        makeConstraint("CST-UNK-001", {
          decision: "clarify",
        }),
      ]);

      const handoff = buildHandoffPrd(null, state);

      expect(handoff.unclassified_constraints).toEqual([
        "[CST-UNK-001] CST-UNK-001 summary (decision: clarify)",
      ]);
    });
  });

  // ─── D. Success Criteria ───

  describe("Success Criteria", () => {
    let tempDir: string;

    afterEach(() => {
      if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    });

    it("extracts success criteria from PRD bullet list", () => {
      tempDir = mkdtempSync(join(tmpdir(), "handoff-test-"));
      const prdPath = join(tempDir, "prd.md");
      writeFileSync(
        prdPath,
        "## Success Criteria\n\n- Criterion one\n- Criterion two\n* Criterion three",
      );

      const handoff = buildHandoffPrd(prdPath, makeState([]));

      expect(handoff.success_criteria).toEqual([
        "Criterion one",
        "Criterion two",
        "Criterion three",
      ]);
    });

    it("falls back to validation_result.items when no PRD", () => {
      const state: ScopeState = {
        ...makeState([]),
        validation_result: {
          result: "pass",
          pass_count: 1,
          fail_count: 0,
          items: [
            { val_id: "V1", detail: "test", result: "pass", related_cst: "CST-001" },
          ],
        },
      };

      const handoff = buildHandoffPrd(null, state);

      expect(handoff.success_criteria).toEqual(["[V1] test (pass)"]);
    });
  });

  // ─── E. Brownfield Sources ───

  describe("Brownfield Sources", () => {
    it("collects brownfield sources from grounding_sources and constraint source_refs", () => {
      const state: ScopeState = {
        ...makeState([
          makeConstraint("CST-BF-001", {
            decision: "inject",
            source_refs: [{ source: "/src/db", detail: "schema ref" }],
          }),
        ]),
        grounding_sources: [{ type: "add-dir", path_or_url: "/src/auth" }],
      };

      const handoff = buildHandoffPrd(null, state);

      expect(handoff.brownfield_sources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "/src/auth" }),
          expect.objectContaining({ path: "/src/db" }),
        ]),
      );
      expect(handoff.brownfield_sources).toHaveLength(2);
    });

    it("deduplicates brownfield sources", () => {
      const state: ScopeState = {
        ...makeState([
          makeConstraint("CST-BF-002", {
            decision: "inject",
            source_refs: [{ source: "/src/shared", detail: "shared ref" }],
          }),
        ]),
        grounding_sources: [{ type: "add-dir", path_or_url: "/src/shared" }],
      };

      const handoff = buildHandoffPrd(null, state);

      const sharedSources = handoff.brownfield_sources.filter(
        (s) => s.path === "/src/shared",
      );
      expect(sharedSources).toHaveLength(1);
    });
  });

  // ─── F. Out of Scope ───

  describe("Out of Scope", () => {
    it("populates out_of_scope from scope_boundaries.out", () => {
      const handoff = buildHandoffPrd(null, makeState([]));

      expect(handoff.out_of_scope).toEqual(["scope out"]);
    });
  });
});
