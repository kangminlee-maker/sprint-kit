/**
 * End-to-end test: Brief → Align → Draft → Compile → Apply → Validation → Close
 *
 * Replays the golden example (tutor-block) through the full lifecycle,
 * then extends with apply, validation, and close events.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, mkdtempSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { appendScopeEvent, type EventInput } from "./kernel/event-pipeline.js";
import type { EventType } from "./kernel/types.js";
import { createScope } from "./kernel/scope-manager.js";
import { readEvents } from "./kernel/event-store.js";
import { reduce } from "./kernel/reducer.js";
import { compile, type CompileInput } from "./compilers/compile.js";
import { validate } from "./validators/validate.js";
import type { Event, ScopeState, ValidationPlanItem } from "./kernel/types.js";

// ─── Golden data ───

const GOLDEN_DIR = resolve(import.meta.dirname, "../scopes/example-tutor-block");

function readGoldenEvents(): Event[] {
  return readFileSync(resolve(GOLDEN_DIR, "events.ndjson"), "utf-8")
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line) as Event);
}

// ─── E2E Test ───

describe("E2E — tutor-block full lifecycle", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sprint-e2e-"));
  });

  it("Brief → Align → Draft → Compile → Apply → Validation → Close", () => {
    // ── Phase 1: Replay golden events (Brief → Compile) ──
    const paths = createScope(tmpDir, "SC-E2E-001");
    const goldenEvents = readGoldenEvents();

    // Replay golden events up to target_locked (exclude compile.started & compile.completed)
    const eventsBeforeCompile = goldenEvents.filter(
      (e) => e.type !== "compile.started" && e.type !== "compile.completed",
    );
    for (const evt of eventsBeforeCompile) {
      const result = appendScopeEvent(paths, {
        type: evt.type,
        actor: evt.actor,
        payload: evt.payload,
      });
      expect(result.success).toBe(true);
    }

    // Verify target_locked state
    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("target_locked");
    expect(state.constraint_pool.summary.decided).toBe(8);
    expect(state.compile_ready).toBe(true);

    // ── Phase 2: Compile ──
    // Build CompileInput from golden data
    const goldenDeltaSet = JSON.parse(
      readFileSync(resolve(GOLDEN_DIR, "build/delta-set.json"), "utf-8"),
    );

    // Reverse-engineer implementations from delta-set
    const implMap = new Map<string, { csts: string[]; chgs: typeof goldenDeltaSet.changes }>();
    for (const chg of goldenDeltaSet.changes) {
      for (const implId of chg.related_impl) {
        if (!implMap.has(implId)) implMap.set(implId, { csts: [], chgs: [] });
        const entry = implMap.get(implId)!;
        entry.chgs.push(chg);
        for (const cst of chg.related_cst) {
          if (!entry.csts.includes(cst)) entry.csts.push(cst);
        }
      }
    }

    const implIds = Array.from(implMap.keys()).sort();
    const implementations = implIds.map((id) => ({
      summary: `Implementation ${id}`,
      related_cst: implMap.get(id)!.csts,
      target: implMap.get(id)!.chgs[0].file_path,
      detail: implMap.get(id)!.chgs[0].description,
    }));

    const implIndexMap = new Map(implIds.map((id, i) => [id, i]));
    const changes = goldenDeltaSet.changes.map((chg: any) => ({
      action: chg.action,
      file_path: chg.file_path,
      description: chg.description,
      related_impl_indices: chg.related_impl.map((id: string) => implIndexMap.get(id)!),
      related_cst: chg.related_cst,
    }));

    // Build inject validations from golden validation-plan
    const injectCsts = state.constraint_pool.constraints
      .filter((c) => c.decision === "inject")
      .map((c) => c.constraint_id);

    const injectValidations = injectCsts.map((cstId) => {
      const c = state.constraint_pool.constraints.find((x) => x.constraint_id === cstId)!;
      return {
        related_cst: cstId,
        target: `${c.summary} 검증`,
        method: `${c.summary} 구현 확인`,
        pass_criteria: `${cstId} 관련 동작 확인`,
        fail_action: "구현 오류. apply 재시도",
        edge_cases: [{ scenario: `${cstId} 빈 입력`, expected_result: "에러 반환" }],
      };
    });

    const compileInput: CompileInput = {
      state,
      implementations,
      changes,
      brownfield: {
        related_files: [
          { path: "src/matching/matching-engine.ts", role: "매칭 엔진", detail_anchor: "matching-engine" },
          { path: "src/api/v1/matching.ts", role: "매칭 API", detail_anchor: "api-matching" },
        ],
        module_dependencies: [
          { module: "matching-engine", depends_on: "tutor-block", detail_anchor: "dep-matching-tutor-block" },
        ],
      },
      brownfieldDetail: {
        scope_id: "SC-TEST",
        sections: [
          { anchor: "matching-engine", source: "podo-backend", title: "MatchingEngine", content: "매칭 엔진 상세" },
          { anchor: "api-matching", source: "podo-backend", title: "Matching API", content: "매칭 API 상세" },
          { anchor: "dep-matching-tutor-block", source: "podo-backend", title: "matching → tutor-block", content: "의존성 상세" },
        ],
      },
      surfaceSummary: "튜터 프로필에서 차단 버튼 → 확인 → 차단 완료. 설정에서 차단 관리.",
      injectValidations,
    };

    const compileResult = compile(compileInput);
    if (!compileResult.success) {
      console.log("Compile failed:", compileResult.reason);
      if (compileResult.violations) {
        for (const v of compileResult.violations) console.log(`  ${v.rule}: ${v.detail}`);
      }
    }
    expect(compileResult.success).toBe(true);
    if (!compileResult.success) return;

    // Verify compile output
    expect(compileResult.buildSpecMd).toContain("## 1. Scope Summary");
    expect(compileResult.buildSpecMd).toContain("## 7. Brownfield Context");
    expect(compileResult.deltaSet.changes.length).toBe(8);
    expect(compileResult.validationPlan.length).toBeGreaterThan(0);

    // Record compile events
    const compileStarted = appendScopeEvent(paths, {
      type: "compile.started",
      actor: "system",
      payload: { snapshot_revision: 3, surface_hash: state.surface_hash },
    });
    expect(compileStarted.success).toBe(true);

    const compileCompleted = appendScopeEvent(paths, {
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
    expect(compileCompleted.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("compiled");
    expect(state.validation_plan_hash).toBe(compileResult.validationPlanHash);

    // ── Phase 3: Apply ──
    const applyStartResult = appendScopeEvent(paths, {
      type: "apply.started",
      actor: "agent",
      payload: { build_spec_hash: compileResult.buildSpecHash },
    }, { apply_enabled: true });
    expect(applyStartResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("compiled"); // self-transition

    const applyCompleteResult = appendScopeEvent(paths, {
      type: "apply.completed",
      actor: "agent",
      payload: { result: "success" },
    });
    expect(applyCompleteResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("applied");

    // ── Phase 4: Validation ──
    const valStartResult = appendScopeEvent(paths, {
      type: "validation.started",
      actor: "agent",
      payload: { validation_plan_hash: compileResult.validationPlanHash },
    });
    expect(valStartResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("applied"); // self-transition

    // Run validate() with all items passing
    const valResults = compileResult.validationPlan.map((item) => ({
      val_id: item.val_id,
      related_cst: item.related_cst,
      result: "pass" as const,
      detail: `${item.target} 확인 완료`,
    }));

    const validateOutput = validate({
      state,
      plan: compileResult.validationPlan,
      results: valResults,
      actualPlanHash: compileResult.validationPlanHash,
    });
    expect(validateOutput.success).toBe(true);
    if (!validateOutput.success) return;

    expect(validateOutput.result).toBe("pass");
    expect(validateOutput.fail_count).toBe(0);

    const valCompleteResult = appendScopeEvent(paths, {
      type: "validation.completed",
      actor: "agent",
      payload: {
        result: validateOutput.result,
        pass_count: validateOutput.pass_count,
        fail_count: validateOutput.fail_count,
        items: validateOutput.items,
      },
    });
    expect(valCompleteResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("validated");

    // ── Phase 5: Close (PO confirmation) ──
    const closeResult = appendScopeEvent(paths, {
      type: "scope.closed",
      actor: "user",
      payload: {},
    });
    expect(closeResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("closed");

    // ── Final Assertions ──
    const allEvents = readEvents(paths.events);
    // eventsBeforeCompile + compile.started + compile.completed + apply.started + apply.completed + validation.started + validation.completed + scope.closed
    expect(allEvents.length).toBe(eventsBeforeCompile.length + 7);

    // Verify the full event type sequence
    const lastFiveTypes = allEvents.slice(-5).map((e) => e.type);
    expect(lastFiveTypes).toEqual([
      "apply.started",
      "apply.completed",
      "validation.started",
      "validation.completed",
      "scope.closed",
    ]);
  });

  it("validation fail → constraints_resolved rollback", () => {
    const paths = createScope(tmpDir, "SC-E2E-002");
    const goldenEvents = readGoldenEvents();

    // Replay to compiled
    for (const evt of goldenEvents) {
      appendScopeEvent(paths, { type: evt.type, actor: evt.actor, payload: evt.payload });
    }

    // Apply
    appendScopeEvent(paths, { type: "apply.started", actor: "agent", payload: { build_spec_hash: "h" } }, { apply_enabled: true });
    appendScopeEvent(paths, { type: "apply.completed", actor: "agent", payload: { result: "success" } });

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("applied");

    // Validation with 1 failure
    appendScopeEvent(paths, { type: "validation.started", actor: "agent", payload: { validation_plan_hash: "h" } });

    const failResult = appendScopeEvent(paths, {
      type: "validation.completed",
      actor: "agent",
      payload: {
        result: "fail",
        pass_count: 7,
        fail_count: 1,
        items: [{ val_id: "VAL-001", related_cst: "CST-001", result: "fail", detail: "차단 반영 안 됨" }],
      },
    });
    expect(failResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("constraints_resolved"); // rollback
  });

  it("stale during applied → grounded on validation.completed", () => {
    const paths = createScope(tmpDir, "SC-E2E-003");
    const goldenEvents = readGoldenEvents();

    // Replay to compiled
    for (const evt of goldenEvents) {
      appendScopeEvent(paths, { type: evt.type, actor: evt.actor, payload: evt.payload });
    }

    // Apply
    appendScopeEvent(paths, { type: "apply.started", actor: "agent", payload: { build_spec_hash: "h" } }, { apply_enabled: true });
    appendScopeEvent(paths, { type: "apply.completed", actor: "agent", payload: { result: "success" } });

    // Mark stale during applied
    const staleResult = appendScopeEvent(paths, {
      type: "snapshot.marked_stale",
      actor: "system",
      payload: { stale_sources: [{ path: "src/matching/matching-engine.ts", old_hash: "a", new_hash: "b" }] },
    });
    expect(staleResult.success).toBe(true);

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("applied"); // self-transition
    expect(state.stale).toBe(true);

    // Validation pass but stale → grounded
    appendScopeEvent(paths, { type: "validation.started", actor: "agent", payload: { validation_plan_hash: "h" } });

    const valResult = appendScopeEvent(paths, {
      type: "validation.completed",
      actor: "agent",
      payload: { result: "pass", pass_count: 8, fail_count: 0, items: [] },
    });
    expect(valResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("grounded"); // stale override
  });
});

// ─── Edge Case E2E Tests ───

describe("E2E — edge case scenarios", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sprint-e2e-edge-"));
  });

  const goldenFirstPayload = () => readGoldenEvents()[0]!.payload;

  function replayUntilState(
    paths: ReturnType<typeof createScope>,
    goldenEvents: Event[],
    targetState: string,
  ) {
    for (const evt of goldenEvents) {
      const result = appendScopeEvent(paths, {
        type: evt.type,
        actor: evt.actor,
        payload: evt.payload,
      });
      if (!result.success) throw new Error(`Replay failed: ${result.reason}`);
      if (result.success && result.next_state === targetState) break;
    }
  }

  it("gap_found → re-compile cycle", () => {
    const paths = createScope(tmpDir, "SC-EDGE-001");
    const goldenEvents = readGoldenEvents();

    // Replay until target_locked
    replayUntilState(paths, goldenEvents, "target_locked");

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("target_locked");

    // compile.started
    const csResult = appendScopeEvent(paths, {
      type: "compile.started",
      actor: "system",
      payload: { snapshot_revision: 1, surface_hash: "hash_sf_004" },
    });
    expect(csResult.success).toBe(true);

    // constraint.discovered FIRST (referential integrity)
    const discResult = appendScopeEvent(paths, {
      type: "constraint.discovered",
      actor: "system",
      payload: {
        constraint_id: "CST-NEW",
        perspective: "code",
        summary: "컴파일 중 발견된 새 제약",
        severity: "required",
        discovery_stage: "compile",
        decision_owner: "product_owner",
        impact_if_ignored: "빌드 시 누락",
        source_refs: [{ source: "compile-check", detail: "새 제약 발견" }],
      },
    });
    expect(discResult.success).toBe(true);

    // compile.constraint_gap_found (CST-NEW)
    const gapResult = appendScopeEvent(paths, {
      type: "compile.constraint_gap_found",
      actor: "system",
      payload: { new_constraint_id: "CST-NEW", perspective: "code", summary: "컴파일 중 발견된 새 제약" },
    });
    expect(gapResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("constraints_resolved");
    expect(state.retry_count_compile).toBe(1);

    // Decide the new constraint
    const decResult = appendScopeEvent(paths, {
      type: "constraint.decision_recorded",
      actor: "user",
      payload: {
        constraint_id: "CST-NEW",
        decision: "inject",
        selected_option: "새 제약 반영",
        decision_owner: "product_owner",
        rationale: "빌드에 필요",
      },
    });
    expect(decResult.success).toBe(true);

    // target.locked again
    const tlResult = appendScopeEvent(paths, {
      type: "target.locked",
      actor: "system",
      payload: {
        surface_hash: "hash_sf_004",
        constraint_decisions: [
          { constraint_id: "CST-001", decision: "inject" },
          { constraint_id: "CST-002", decision: "inject" },
          { constraint_id: "CST-003", decision: "inject" },
          { constraint_id: "CST-004", decision: "defer" },
          { constraint_id: "CST-005", decision: "inject" },
          { constraint_id: "CST-006", decision: "inject" },
          { constraint_id: "CST-007", decision: "inject" },
          { constraint_id: "CST-008", decision: "inject" },
          { constraint_id: "CST-NEW", decision: "inject" },
        ],
      },
    });
    expect(tlResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("target_locked");

    // compile.started (retry)
    const cs2Result = appendScopeEvent(paths, {
      type: "compile.started",
      actor: "system",
      payload: { snapshot_revision: 1, surface_hash: "hash_sf_004" },
    });
    expect(cs2Result.success).toBe(true);

    // compile.completed
    const ccResult = appendScopeEvent(paths, {
      type: "compile.completed",
      actor: "system",
      payload: {
        build_spec_path: "build/build-spec.md",
        build_spec_hash: "hash_bs_002",
        brownfield_detail_path: "build/brownfield-detail.md",
        brownfield_detail_hash: "hash_bd_002",
        delta_set_path: "build/delta-set.json",
        delta_set_hash: "hash_ds_002",
        validation_plan_path: "build/validation-plan.md",
        validation_plan_hash: "hash_vp_002",
      },
    });
    expect(ccResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("compiled");
    expect(state.retry_count_compile).toBe(0);
  });

  it("redirect.to_align from surface_iterating → re-align", () => {
    const paths = createScope(tmpDir, "SC-EDGE-002");
    const goldenEvents = readGoldenEvents();

    // Replay until align_locked
    replayUntilState(paths, goldenEvents, "align_locked");

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("align_locked");

    // surface.generated → surface_iterating
    const sgResult = appendScopeEvent(paths, {
      type: "surface.generated",
      actor: "system",
      payload: {
        surface_type: "experience",
        surface_path: "surface/preview/",
        content_hash: "hash_sf_new_001",
        based_on_snapshot: 1,
      },
    });
    expect(sgResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("surface_iterating");

    // redirect.to_align → align_proposed
    const raResult = appendScopeEvent(paths, {
      type: "redirect.to_align",
      actor: "user",
      payload: { from_state: "surface_iterating", reason: "방향 재조정 필요" },
    });
    expect(raResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("align_proposed");

    // align.revised
    const arResult = appendScopeEvent(paths, {
      type: "align.revised",
      actor: "system",
      payload: {
        revision_count: 1,
        feedback_scope: "direction",
        feedback_text: "차단 대신 숨기기로 변경",
        packet_path: "build/align-packet.md",
        packet_hash: "hash_ap_002",
      },
    });
    expect(arResult.success).toBe(true);

    // align.locked
    const alResult = appendScopeEvent(paths, {
      type: "align.locked",
      actor: "user",
      payload: {
        locked_direction: "학생이 튜터를 숨기면 매칭에서 제외",
        locked_scope_boundaries: {
          in: ["숨기기 생성", "숨기기 해제", "매칭 반영"],
          out: ["관리자 차단"],
        },
        locked_in_out: true,
      },
    });
    expect(alResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("align_locked");

    // surface.generated
    const sg2Result = appendScopeEvent(paths, {
      type: "surface.generated",
      actor: "system",
      payload: {
        surface_type: "experience",
        surface_path: "surface/preview/",
        content_hash: "hash_sf_new_002",
        based_on_snapshot: 1,
      },
    });
    expect(sg2Result.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("surface_iterating");

    // surface.confirmed
    const scResult = appendScopeEvent(paths, {
      type: "surface.confirmed",
      actor: "user",
      payload: {
        final_surface_path: "surface/preview/",
        final_content_hash: "hash_sf_new_002",
        total_revisions: 0,
      },
    });
    expect(scResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("surface_confirmed");
  });

  it("convergence.blocked → scope.deferred", () => {
    const paths = createScope(tmpDir, "SC-EDGE-003");
    const goldenEvents = readGoldenEvents();

    // Replay until surface_iterating
    replayUntilState(paths, goldenEvents, "surface_iterating");

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("surface_iterating");

    // convergence.blocked (observational)
    const cbResult = appendScopeEvent(paths, {
      type: "convergence.blocked",
      actor: "system",
      payload: { state: "surface_iterating", revision_count: 5, requires_action: true },
    });
    expect(cbResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("surface_iterating"); // observational, no state change
    expect(state.convergence_blocked).toBe(true);

    // scope.deferred (global event)
    const sdResult = appendScopeEvent(paths, {
      type: "scope.deferred",
      actor: "user",
      payload: { reason: "수렴 실패", resume_condition: "방향 재정립 후 재개" },
    });
    expect(sdResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("deferred");
  });

  it("snapshot.marked_stale during compiled → grounded", () => {
    const paths = createScope(tmpDir, "SC-EDGE-004");
    const goldenEvents = readGoldenEvents();

    // Replay full golden (compiled state)
    for (const evt of goldenEvents) {
      const result = appendScopeEvent(paths, {
        type: evt.type,
        actor: evt.actor,
        payload: evt.payload,
      });
      expect(result.success).toBe(true);
    }

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("compiled");

    // snapshot.marked_stale → grounded (from compiled)
    const staleResult = appendScopeEvent(paths, {
      type: "snapshot.marked_stale",
      actor: "system",
      payload: { stale_sources: [{ path: "src/matching/matching-engine.ts", old_hash: "a", new_hash: "b" }] },
    });
    expect(staleResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("grounded");
  });

  it("compile retry limit (3회 gap_found) → compile.started rejected", () => {
    const paths = createScope(tmpDir, "SC-EDGE-005");
    const goldenEvents = readGoldenEvents();

    // Replay until target_locked
    replayUntilState(paths, goldenEvents, "target_locked");

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("target_locked");

    // 3 gap_found cycles
    for (let i = 0; i < 3; i++) {
      const cstId = `CST-GAP-${i + 1}`;

      // compile.started
      const csRes = appendScopeEvent(paths, {
        type: "compile.started",
        actor: "system",
        payload: { snapshot_revision: 1, surface_hash: "hash_sf_004" },
      });
      expect(csRes.success).toBe(true);

      // constraint.discovered FIRST
      const discRes = appendScopeEvent(paths, {
        type: "constraint.discovered",
        actor: "system",
        payload: {
          constraint_id: cstId,
          perspective: "code",
          summary: `Gap ${i + 1}`,
          severity: "required",
          discovery_stage: "compile",
          decision_owner: "product_owner",
          impact_if_ignored: "빌드 실패",
          source_refs: [{ source: "compile", detail: `gap ${i + 1}` }],
        },
      });
      expect(discRes.success).toBe(true);

      // compile.constraint_gap_found
      const gapRes = appendScopeEvent(paths, {
        type: "compile.constraint_gap_found",
        actor: "system",
        payload: { new_constraint_id: cstId, perspective: "code", summary: `Gap ${i + 1}` },
      });
      expect(gapRes.success).toBe(true);

      // → constraints_resolved
      state = reduce(readEvents(paths.events));
      expect(state.current_state).toBe("constraints_resolved");

      // Decide the new constraint
      const decRes = appendScopeEvent(paths, {
        type: "constraint.decision_recorded",
        actor: "user",
        payload: {
          constraint_id: cstId,
          decision: "inject",
          selected_option: `Gap ${i + 1} 반영`,
          decision_owner: "product_owner",
          rationale: "빌드 필요",
        },
      });
      expect(decRes.success).toBe(true);

      // target.locked
      const tlRes = appendScopeEvent(paths, {
        type: "target.locked",
        actor: "system",
        payload: {
          surface_hash: "hash_sf_004",
          constraint_decisions: [{ constraint_id: cstId, decision: "inject" }],
        },
      });
      expect(tlRes.success).toBe(true);

      state = reduce(readEvents(paths.events));
      expect(state.current_state).toBe("target_locked");
    }

    state = reduce(readEvents(paths.events));
    expect(state.retry_count_compile).toBe(3);

    // 4th compile.started → rejected
    const fourthResult = appendScopeEvent(paths, {
      type: "compile.started",
      actor: "system",
      payload: { snapshot_revision: 1, surface_hash: "hash_sf_004" },
    });
    expect(fourthResult.success).toBe(false);
    if (!fourthResult.success) {
      expect(fourthResult.reason).toContain("retry limit");
    }
  });

  it("scope.deferred from validated state", () => {
    const paths = createScope(tmpDir, "SC-EDGE-006");
    const goldenEvents = readGoldenEvents();

    // Replay full golden → compiled
    for (const evt of goldenEvents) {
      appendScopeEvent(paths, { type: evt.type, actor: evt.actor, payload: evt.payload });
    }

    // Apply
    appendScopeEvent(paths, { type: "apply.started", actor: "agent", payload: { build_spec_hash: "h" } }, { apply_enabled: true });
    appendScopeEvent(paths, { type: "apply.completed", actor: "agent", payload: { result: "success" } });

    // Validation pass
    appendScopeEvent(paths, { type: "validation.started", actor: "agent", payload: { validation_plan_hash: "h" } });
    const valResult = appendScopeEvent(paths, {
      type: "validation.completed",
      actor: "agent",
      payload: { result: "pass", pass_count: 8, fail_count: 0, items: [] },
    });
    expect(valResult.success).toBe(true);

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("validated");

    // scope.deferred from validated (global event)
    const sdResult = appendScopeEvent(paths, {
      type: "scope.deferred",
      actor: "user",
      payload: { reason: "출시 보류", resume_condition: "다음 분기 재개" },
    });
    expect(sdResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("deferred");
  });

  it("validation fail → re-cycle to close", () => {
    const paths = createScope(tmpDir, "SC-EDGE-007");
    const goldenEvents = readGoldenEvents();

    // Replay full golden → compiled
    for (const evt of goldenEvents) {
      appendScopeEvent(paths, { type: evt.type, actor: evt.actor, payload: evt.payload });
    }

    // Apply
    appendScopeEvent(paths, { type: "apply.started", actor: "agent", payload: { build_spec_hash: "h" } }, { apply_enabled: true });
    appendScopeEvent(paths, { type: "apply.completed", actor: "agent", payload: { result: "success" } });

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("applied");

    // Validation fail
    appendScopeEvent(paths, { type: "validation.started", actor: "agent", payload: { validation_plan_hash: "h" } });
    const valFailResult = appendScopeEvent(paths, {
      type: "validation.completed",
      actor: "agent",
      payload: {
        result: "fail",
        pass_count: 7,
        fail_count: 1,
        items: [{ val_id: "VAL-001", related_cst: "CST-001", result: "fail", detail: "차단 반영 안 됨" }],
      },
    });
    expect(valFailResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("constraints_resolved");

    // Re-decide constraint (change approach)
    const decResult = appendScopeEvent(paths, {
      type: "constraint.decision_recorded",
      actor: "user",
      payload: {
        constraint_id: "CST-001",
        decision: "inject",
        selected_option: "매칭 시스템 제외 기능 수정",
        decision_owner: "product_owner",
        rationale: "구현 방식 변경하여 재시도",
      },
    });
    expect(decResult.success).toBe(true);

    // target.locked
    const tlResult = appendScopeEvent(paths, {
      type: "target.locked",
      actor: "system",
      payload: {
        surface_hash: "hash_sf_004",
        constraint_decisions: [
          { constraint_id: "CST-001", decision: "inject" },
          { constraint_id: "CST-002", decision: "inject" },
          { constraint_id: "CST-003", decision: "inject" },
          { constraint_id: "CST-004", decision: "defer" },
          { constraint_id: "CST-005", decision: "inject" },
          { constraint_id: "CST-006", decision: "inject" },
          { constraint_id: "CST-007", decision: "inject" },
          { constraint_id: "CST-008", decision: "inject" },
        ],
      },
    });
    expect(tlResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("target_locked");

    // Re-compile
    appendScopeEvent(paths, {
      type: "compile.started",
      actor: "system",
      payload: { snapshot_revision: 1, surface_hash: "hash_sf_004" },
    });

    const ccResult = appendScopeEvent(paths, {
      type: "compile.completed",
      actor: "system",
      payload: {
        build_spec_path: "build/build-spec.md",
        build_spec_hash: "hash_bs_003",
        brownfield_detail_path: "build/brownfield-detail.md",
        brownfield_detail_hash: "hash_bd_003",
        delta_set_path: "build/delta-set.json",
        delta_set_hash: "hash_ds_003",
        validation_plan_path: "build/validation-plan.md",
        validation_plan_hash: "hash_vp_003",
      },
    });
    expect(ccResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("compiled");

    // Re-apply
    appendScopeEvent(paths, { type: "apply.started", actor: "agent", payload: { build_spec_hash: "hash_bs_003" } }, { apply_enabled: true });
    appendScopeEvent(paths, { type: "apply.completed", actor: "agent", payload: { result: "success" } });

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("applied");

    // Validation pass
    appendScopeEvent(paths, { type: "validation.started", actor: "agent", payload: { validation_plan_hash: "hash_vp_003" } });
    const valPassResult = appendScopeEvent(paths, {
      type: "validation.completed",
      actor: "agent",
      payload: { result: "pass", pass_count: 8, fail_count: 0, items: [] },
    });
    expect(valPassResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("validated");

    // Close
    const closeResult = appendScopeEvent(paths, {
      type: "scope.closed",
      actor: "user",
      payload: {},
    });
    expect(closeResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("closed");
  });

  it("constraints_resolved → new constraint discovered → undecided exists", () => {
    const paths = createScope(tmpDir, "SC-EDGE-008");
    const goldenEvents = readGoldenEvents();

    // Replay to constraints_resolved (all 8 constraints decided)
    replayUntilState(paths, goldenEvents, "constraints_resolved");

    let state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("constraints_resolved");
    expect(state.constraint_pool.summary.undecided).toBe(0);

    // New constraint discovered while in constraints_resolved
    const discResult = appendScopeEvent(paths, {
      type: "constraint.discovered",
      actor: "system",
      payload: {
        constraint_id: "CST-LATE-001", perspective: "experience", summary: "late discovery",
        severity: "recommended", discovery_stage: "draft_phase2", decision_owner: "product_owner",
        impact_if_ignored: "UX 문제", source_refs: [{ source: "test", detail: "d" }],
      },
    });
    expect(discResult.success).toBe(true);

    state = reduce(readEvents(paths.events));
    // New undecided constraint exists
    expect(state.constraint_pool.constraints.some(c => c.constraint_id === "CST-LATE-001")).toBe(true);
    expect(state.constraint_pool.summary.undecided).toBe(1);
    // target.locked should be blocked (isConstraintsResolved = false)
    expect(state.compile_ready).toBe(false);
  });
});
