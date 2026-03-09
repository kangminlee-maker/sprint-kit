import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderScopeMd } from "./scope-md.js";
import { reduce } from "../kernel/reducer.js";
import type { Event, ScopeState, ConstraintPool } from "../kernel/types.js";

// ─── Helpers ───

function emptyPool(): ConstraintPool {
  return {
    constraints: [],
    summary: { total: 0, required: 0, recommended: 0, decided: 0, clarify_pending: 0, invalidated: 0, undecided: 0 },
  };
}

function makeState(overrides: Partial<ScopeState> = {}): ScopeState {
  return {
    scope_id: "SC-TEST",
    title: "테스트 Scope",
    description: "테스트용",
    entry_mode: "experience",
    current_state: "draft",
    constraint_pool: emptyPool(),
    stale: false,
    compile_ready: false,
    convergence_blocked: false,
    revision_count_align: 0,
    revision_count_surface: 0,
    retry_count_compile: 0,
    verdict_log: [],
    feedback_history: [],
    latest_revision: 0,
    ...overrides,
  };
}

// ─── Golden data ───

describe("scope-md — golden data", () => {
  it("renders scope.md from golden events", () => {
    const goldenPath = resolve(
      import.meta.dirname,
      "../../scopes/example-tutor-block/events.ndjson",
    );
    const events: Event[] = readFileSync(goldenPath, "utf-8")
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line) as Event);

    const state = reduce(events);
    const md = renderScopeMd(state);

    expect(md).toContain("# Scope: 튜터 차단 기능");
    expect(md).toContain("Build Spec 생성 완료");
    expect(md).toContain("방향");
    expect(md).toContain("학생이 튜터를 차단하면");
    expect(md).toContain("전체: 8건");
    expect(md).toContain("결정 완료: 8건");
    expect(md).toContain("revision 29");
    // verdict_log shows last 5: CST-004~008 (CST-001 is older, trimmed)
    expect(md).toContain("CST-008");
  });
});

// ─── Structure tests ───

describe("scope-md — structure", () => {
  it("renders header with title from state", () => {
    const md = renderScopeMd(makeState({ title: "My Scope" }));
    expect(md).toContain("# Scope: My Scope");
  });

  it("shows current state in human-readable form", () => {
    const md = renderScopeMd(makeState({ current_state: "surface_confirmed" }));
    expect(md).toContain("Surface 확정됨");
  });

  it("shows direction when present", () => {
    const md = renderScopeMd(makeState({ direction: "test direction" }));
    expect(md).toContain("**방향**: test direction");
  });

  it("omits direction when absent", () => {
    const md = renderScopeMd(makeState());
    expect(md).not.toContain("**방향**");
  });

  it("shows scope boundaries when locked", () => {
    const md = renderScopeMd(makeState({
      scope_boundaries: { in: ["기능A", "기능B"], out: ["기능C"] },
    }));
    expect(md).toContain("## 범위");
    expect(md).toContain("기능A");
    expect(md).toContain("기능C");
  });

  it("omits scope boundaries when not locked", () => {
    const md = renderScopeMd(makeState());
    expect(md).not.toContain("## 범위");
  });
});

// ─── Next action ───

describe("scope-md — next action", () => {
  it("draft → scan sources", () => {
    const md = renderScopeMd(makeState({ current_state: "draft" }));
    expect(md).toContain("/start");
  });

  it("surface_confirmed with undecided → decide constraints", () => {
    const pool = emptyPool();
    pool.summary.total = 3;
    pool.summary.undecided = 2;
    const md = renderScopeMd(makeState({ current_state: "surface_confirmed", constraint_pool: pool }));
    expect(md).toContain("2건의 제약 사항");
  });

  it("surface_confirmed with clarify_pending → resolve clarify", () => {
    const pool = emptyPool();
    pool.summary.total = 3;
    pool.summary.clarify_pending = 1;
    const md = renderScopeMd(makeState({ current_state: "surface_confirmed", constraint_pool: pool }));
    expect(md).toContain("clarify");
  });

  it("closed → scope terminated", () => {
    const md = renderScopeMd(makeState({ current_state: "closed" }));
    expect(md).toContain("종료");
  });
});

// ─── Blockers ───

describe("scope-md — blockers", () => {
  it("shows stale blocker with source details", () => {
    const md = renderScopeMd(makeState({
      stale: true,
      stale_sources: [{ path: "src/a.ts", old_hash: "h1", new_hash: "h2" }],
      stale_since: 10,
    }));
    expect(md).toContain("## 차단 상태");
    expect(md).toContain("src/a.ts");
    expect(md).toContain("revision 10");
  });

  it("shows convergence blocker", () => {
    const md = renderScopeMd(makeState({ convergence_blocked: true }));
    expect(md).toContain("수렴 차단");
  });

  it("shows clarify blocker", () => {
    const pool = emptyPool();
    pool.summary.total = 2;
    pool.summary.clarify_pending = 1;
    const md = renderScopeMd(makeState({ constraint_pool: pool }));
    expect(md).toContain("clarify 미해소");
  });

  it("omits blocker section when no blockers", () => {
    const md = renderScopeMd(makeState());
    expect(md).not.toContain("## 차단 상태");
  });
});

// ─── Constraint summary ───

describe("scope-md — constraint summary", () => {
  it("shows constraint counts", () => {
    const pool = emptyPool();
    pool.summary = { total: 8, required: 3, recommended: 5, decided: 6, clarify_pending: 1, invalidated: 0, undecided: 1 };
    const md = renderScopeMd(makeState({ constraint_pool: pool }));
    expect(md).toContain("전체: 8건");
    expect(md).toContain("필수 3");
    expect(md).toContain("결정 완료: 6건");
    expect(md).toContain("미결정: 1건");
    expect(md).toContain("clarify 대기: 1건");
  });

  it("omits constraint section when total is 0", () => {
    const md = renderScopeMd(makeState());
    expect(md).not.toContain("## Constraint 현황");
  });
});

// ─── Edge cases: convergence_blocked override, stale with undefined, empty verdict_log ───

describe("scope-md — edge cases", () => {
  it("convergence_blocked overrides next action message", () => {
    const md = renderScopeMd(makeState({
      current_state: "surface_iterating",
      convergence_blocked: true,
    }));
    expect(md).toContain("수렴 차단 상태입니다");
    expect(md).toContain("방향 변경");
  });

  it("stale with undefined stale_sources shows '알 수 없음'", () => {
    const md = renderScopeMd(makeState({
      stale: true,
      stale_sources: undefined,
      stale_since: undefined,
    }));
    expect(md).toContain("알 수 없음");
    expect(md).toContain("?");
  });

  it("empty verdict_log omits 최근 결정 section", () => {
    const md = renderScopeMd(makeState({ verdict_log: [] }));
    expect(md).not.toContain("## 최근 결정");
  });

  it("verdict_log with clarify_resolved renders correctly", () => {
    const md = renderScopeMd(makeState({
      verdict_log: [
        { type: "constraint.clarify_resolved", revision: 15, ts: "2026-01-01T00:00:15Z", constraint_id: "CST-002", decision: "inject", decision_owner: "product_owner" },
      ],
    }));
    expect(md).toContain("## 최근 결정");
    expect(md).toContain("CST-002 clarify 해소");
    expect(md).toContain("inject");
  });

  it("constraint summary omits undecided/clarify/invalidated lines when zero", () => {
    const pool = emptyPool();
    pool.summary = { total: 3, required: 2, recommended: 1, decided: 3, clarify_pending: 0, invalidated: 0, undecided: 0 };
    const md = renderScopeMd(makeState({ constraint_pool: pool }));
    expect(md).toContain("전체: 3건");
    expect(md).toContain("결정 완료: 3건");
    expect(md).not.toContain("미결정:");
    expect(md).not.toContain("clarify 대기:");
    expect(md).not.toContain("제외됨:");
  });

  it("terminal states show appropriate messages", () => {
    expect(renderScopeMd(makeState({ current_state: "closed" }))).toContain("완료");
    expect(renderScopeMd(makeState({ current_state: "deferred" }))).toContain("보류");
    expect(renderScopeMd(makeState({ current_state: "rejected" }))).toContain("거절");
  });
});

// ─── Backward transition ───

describe("scope-md — backward transition", () => {
  it("shows compile retry blocker when constraints_resolved with retry_count > 0", () => {
    const md = renderScopeMd(makeState({
      current_state: "constraints_resolved",
      retry_count_compile: 1,
    }));
    expect(md).toContain("## 차단 상태");
    expect(md).toContain("compile 중 새 제약이 발견되어 결정이 필요합니다");
    expect(md).toContain("재시도 1/3회");
  });

  it("shows retry count 2/3 in blocker message", () => {
    const md = renderScopeMd(makeState({
      current_state: "constraints_resolved",
      retry_count_compile: 2,
    }));
    expect(md).toContain("재시도 2/3회");
  });

  it("does not show compile retry blocker when retry_count is 0", () => {
    const md = renderScopeMd(makeState({
      current_state: "constraints_resolved",
      retry_count_compile: 0,
    }));
    expect(md).not.toContain("compile 중 새 제약이 발견되어");
  });

  it("does not show compile retry blocker for other states even with retry_count > 0", () => {
    const md = renderScopeMd(makeState({
      current_state: "target_locked",
      retry_count_compile: 1,
    }));
    expect(md).not.toContain("compile 중 새 제약이 발견되어");
  });
});

// ─── Verdict log ───

describe("scope-md — verdict log", () => {
  it("shows recent decisions (last 5)", () => {
    const md = renderScopeMd(makeState({
      verdict_log: [
        { type: "align.locked", revision: 8, ts: "2026-01-01T00:00:08Z", locked_direction: "dir" },
        { type: "constraint.decision_recorded", revision: 19, ts: "2026-01-01T00:00:19Z", constraint_id: "CST-001", decision: "inject", decision_owner: "product_owner" },
      ],
    }));
    expect(md).toContain("## 최근 결정");
    expect(md).toContain("방향 확정");
    expect(md).toContain("CST-001");
    expect(md).toContain("inject");
  });

  it("omits verdict section when empty", () => {
    const md = renderScopeMd(makeState());
    expect(md).not.toContain("## 최근 결정");
  });
});
