/**
 * Vertical integration test:
 * ScanResult[] → buildBrownfield() → compile() → BuildSpec + BrownfieldDetail
 *
 * Verifies the full path from scanner output to compile output works
 * without data loss or type mismatch.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { scanLocal } from "./scanners/scan-local.js";
import { buildBrownfield } from "./scanners/brownfield-builder.js";
import { compile, type CompileInput, type CompileSuccess } from "./compilers/compile.js";
import type { ScopeState, ConstraintPool, ConstraintEntry } from "./kernel/types.js";

const TMP = join(import.meta.dirname ?? ".", ".tmp-integration-test");

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

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

function makeState(pool: ConstraintPool): ScopeState {
  return {
    scope_id: "SC-INT-TEST", title: "Integration Test", description: "d", entry_mode: "experience",
    current_state: "target_locked", direction: "test direction",
    scope_boundaries: { in: ["feature"], out: ["other"] },
    surface_hash: "abc123", constraint_pool: pool,
    stale: false, compile_ready: true, convergence_blocked: false,
    revision_count_align: 0, revision_count_surface: 0, retry_count_compile: 0,
    verdict_log: [], feedback_history: [], latest_revision: 10,
  };
}

// ─── Tests ───

describe("Vertical integration: ScanResult → BrownfieldContext → compile()", () => {
  it("full path: scan directory → build brownfield → compile → Build Spec + BrownfieldDetail", () => {
    // Step 1: Create a fixture project
    writeFileSync(join(TMP, "app.ts"), `
import { UserService } from "./user-service";
const apiKey = process.env.API_KEY;
`);
    writeFileSync(join(TMP, "user-service.ts"), `
export class UserService {
  async getUser() { return {}; }
}
`);

    // Step 2: Scan
    const scanResult = scanLocal({ type: "add-dir", path: TMP });
    expect(scanResult.files.length).toBeGreaterThanOrEqual(2);
    expect(scanResult.dependency_graph.length).toBeGreaterThan(0);
    expect(scanResult.config_patterns.length).toBeGreaterThan(0);

    // Step 3: Build Brownfield
    const { context, detail } = buildBrownfield("SC-INT-TEST", [scanResult]);
    expect(context.related_files.length).toBeGreaterThan(0);
    expect(detail.sections.length).toBeGreaterThan(0);

    // Verify detail_anchor links exist
    for (const file of context.related_files) {
      expect(file.detail_anchor).toBeTruthy();
      expect(detail.sections.some(s => s.anchor === file.detail_anchor)).toBe(true);
    }
    for (const dep of context.module_dependencies) {
      expect(dep.detail_anchor).toBeTruthy();
    }

    // Step 4: Compile
    const pool = makePool(
      makeEntry("CST-001", { decision: "inject" }),
    );
    const input: CompileInput = {
      state: makeState(pool),
      implementations: [
        { summary: "Add user feature", related_cst: ["CST-001"], target: "src/user.ts", detail: "Create file" },
      ],
      changes: [
        { action: "create", file_path: "src/user.ts", description: "New file", related_impl_indices: [0], related_cst: ["CST-001"] },
      ],
      brownfield: context,
      brownfieldDetail: detail,
      surfaceSummary: "Integration test scenario",
      injectValidations: [
        { related_cst: "CST-001", target: "user feature", method: "unit test", pass_criteria: "passes", fail_action: "fix" },
      ],
    };

    const result = compile(input);
    expect(result.success).toBe(true);

    if (!result.success) return;
    const success = result as CompileSuccess;

    // Verify Build Spec contains Tier 1+2 with references
    expect(success.buildSpecMd).toContain("## 7. Brownfield Context");
    expect(success.buildSpecMd).toContain("변경 대상 파일");
    expect(success.buildSpecMd).toContain("brownfield-detail.md#");
    expect(success.buildSpecMd).toContain("[→ 상세]");

    // Verify BrownfieldDetail is rendered
    expect(success.brownfieldDetailMd).toContain("# Brownfield Detail");
    expect(success.brownfieldDetailMd).toContain("scope: SC-INT-TEST");
    expect(success.brownfieldDetailHash).toBeTruthy();

    // Verify hashes are non-empty
    expect(success.buildSpecHash).toBeTruthy();
    expect(success.brownfieldDetailHash).toBeTruthy();
    expect(success.deltaSetHash).toBeTruthy();
    expect(success.validationPlanHash).toBeTruthy();
  });

  it("empty scan results → compile still works with empty brownfield", () => {
    const { context, detail } = buildBrownfield("SC-INT-TEST", []);

    const pool = makePool(
      makeEntry("CST-001", { decision: "defer", source_refs: [{ source: "src/a.ts", detail: "d" }] }),
    );
    const input: CompileInput = {
      state: makeState(pool),
      implementations: [],
      changes: [],
      brownfield: context,
      brownfieldDetail: detail,
      surfaceSummary: "Empty scenario",
      injectValidations: [],
    };

    const result = compile(input);
    expect(result.success).toBe(true);
  });
});
