import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderDraftPacket } from "./draft-packet.js";
import { reduce } from "../kernel/reducer.js";
import type {
  Event,
  ScopeState,
  DraftPacketContent,
  ConstraintPool,
  ConstraintEntry,
  ConstraintDetail,
  ConstraintDetailPO,
  ConstraintDetailBuilder,
} from "../kernel/types.js";

// ─── Helpers ───

function emptyPool(): ConstraintPool {
  return { constraints: [], summary: { total: 0, required: 0, recommended: 0, decided: 0, clarify_pending: 0, invalidated: 0, undecided: 0 } };
}

function makeEntry(id: string, overrides: Partial<ConstraintEntry> = {}): ConstraintEntry {
  return {
    constraint_id: id, perspective: "code", summary: `summary ${id}`,
    severity: "recommended", discovery_stage: "draft_phase2", decision_owner: "product_owner",
    impact_if_ignored: `impact ${id}`, source_refs: [{ source: "t.ts", detail: "d" }],
    status: "undecided", discovered_at: 1, ...overrides,
  };
}

function makePoolWith(...entries: ConstraintEntry[]): ConstraintPool {
  let req = 0, rec = 0, inv = 0;
  for (const e of entries) {
    if (e.severity === "required") req++; else rec++;
    if (e.status === "invalidated") inv++;
  }
  return { constraints: entries, summary: { total: entries.length, required: req, recommended: rec, decided: 0, clarify_pending: 0, invalidated: inv, undecided: entries.length - inv } };
}

function makeState(overrides: Partial<ScopeState> = {}): ScopeState {
  return {
    scope_id: "SC-TEST", title: "테스트", description: "d", entry_mode: "experience",
    current_state: "surface_confirmed", constraint_pool: emptyPool(),
    stale: false, compile_ready: false, convergence_blocked: false,
    revision_count_align: 0, revision_count_surface: 0,
    verdict_log: [], feedback_history: [], latest_revision: 0, ...overrides,
  };
}

function makeContent(overrides: Partial<DraftPacketContent> = {}): DraftPacketContent {
  return {
    surface_path: "surface/preview/", scenario_guide: [],
    constraint_details: [], guardrails: [], decision_questions: [], ...overrides,
  };
}

function poDet(id: string): ConstraintDetailPO {
  return {
    constraint_id: id, decision_owner: "product_owner", situation: `situation ${id}`,
    options_table: [{ choice: "inject", pros: "빠른 적용", description: "desc", risk: "low", reversal_cost: "낮음" }],
    recommendation: "inject 추천",
  };
}

function builderDet(id: string): ConstraintDetailBuilder {
  return {
    constraint_id: id, decision_owner: "builder", situation: `situation ${id}`,
    builder_decision: "DB 테이블 생성", builder_judgment: "필수. 되돌림 비용 낮음",
  };
}

// ─── Golden data ───

describe("draft-packet — golden data structure", () => {
  it("renders Draft Packet matching golden structure", () => {
    const goldenPath = resolve(import.meta.dirname, "../../scopes/example-tutor-block/events.ndjson");
    const events: Event[] = readFileSync(goldenPath, "utf-8").trimEnd().split("\n").map((l) => JSON.parse(l) as Event);

    // State at surface_confirmed + all constraints discovered (first 18 events)
    const state = reduce(events.slice(0, 18));

    const content: DraftPacketContent = {
      surface_path: "scopes/SC-2026-001/surface/preview/",
      run_command: "cd surface/preview && npm run dev",
      mockup_revisions: 3,
      scenario_guide: [
        { scenario: "차단 생성", start: "튜터 프로필", steps: "차단 버튼 → 확인", confirmed: "성공 메시지" },
        { scenario: "차단 해제", start: "설정 → 차단 관리", steps: "해제 버튼 → 확인", confirmed: "목록에서 제거" },
      ],
      constraint_details: [
        { constraint_id: "CST-001", decision_owner: "product_owner", situation: "매칭 시스템에 제외 기능 없음", options_table: [{ choice: "inject (제외 기능 추가)", description: "매칭 시스템에 제외 기능 추가", risk: "가장 큰 변경", reversal_cost: "낮음" }], recommendation: "inject" },
        { constraint_id: "CST-005", decision_owner: "builder", situation: "차단 정보 저장 공간 없음", builder_decision: "DB 테이블 신규 생성", builder_judgment: "필수. 되돌림 비용 낮음" },
        { constraint_id: "CST-008", decision_owner: "product_owner", situation: "차단 남용 방지 한도 없음", options_table: [{ choice: "inject (언어별 5명)", description: "언어별 5명 제한", risk: "한도 낮음 불만", reversal_cost: "낮음" }], recommendation: "inject (언어별 5명)" },
        { constraint_id: "CST-002", decision_owner: "product_owner", situation: "이용약관 충돌", options_table: [{ choice: "inject (예외 조항)", description: "약관 예외 추가", risk: "법무 비용", reversal_cost: "중간" }], recommendation: "clarify" },
        { constraint_id: "CST-003", decision_owner: "product_owner", situation: "버튼 공간 부족", options_table: [{ choice: "inject (간격 확보)", description: "레이아웃 재배치", risk: "사용자 혼동", reversal_cost: "낮음" }], recommendation: "inject" },
        { constraint_id: "CST-004", decision_owner: "product_owner", situation: "차단 관리 메뉴 위치", options_table: [{ choice: "defer (현재 유지)", description: "4번째 항목 유지", risk: "찾기 어려움", reversal_cost: "낮음" }], recommendation: "defer" },
        { constraint_id: "CST-006", decision_owner: "builder", situation: "API 응답 변경 위험", builder_decision: "optional 필드 방식", builder_judgment: "호환성 유지. 비용 적음", guardrail: "기존 API 응답 형식을 깨지 않는다" },
        { constraint_id: "CST-007", decision_owner: "product_owner", situation: "개인정보 삭제 의무", options_table: [{ choice: "inject (자동 삭제)", description: "3년 후 삭제", risk: "차단 자연 해제", reversal_cost: "낮음" }], recommendation: "inject" },
      ],
      guardrails: [
        "기존 예약된 수업은 취소하지 않는다",
        "차단 행위는 중복 요청 시 오류 없이 기존 상태를 유지한다",
        "튜터에게 차단 사실을 알리지 않는다",
        "기존 API 응답 형식을 깨지 않는다",
      ],
      decision_questions: [
        "위 8건에 대해 각각 선택해 주세요",
        "clarify를 선택한 항목은 해소될 때까지 잠글 수 없습니다",
        "모든 결정이 완료되면 compile을 시작합니다",
      ],
    };

    const md = renderDraftPacket(state, content);

    // Section existence
    expect(md).toContain("### 1. 확정된 Surface");
    expect(md).toContain("### 2. 현재까지의 결정 현황");
    expect(md).toContain("### 3. 결정이 필요한 항목");
    expect(md).toContain("### 5. 제약 조건");
    expect(md).toContain("### 6. 지금 결정할 것");

    // CST tracking + severity
    expect(md).toContain("CST-001");
    expect(md).toContain("CST-008");
    expect(md).toContain("필수");
    expect(md).toContain("권장");
    expect(md).toContain("(Builder 결정)");

    // Impact from pool
    expect(md).toContain("차단 버튼을 눌러도 실제 매칭에 반영되지 않습니다");

    // Scenario table
    expect(md).toContain("| 시나리오 | 시작 | 동작 순서 | 확인된 동작 |");

    // Builder format
    expect(md).toContain("Builder 결정 예정");
    expect(md).toContain("guardrail 확인 후 승인");

    // Decision choices
    expect(md).toContain("**Approve**");
  });
});

// ─── Section 2: auto-generated ───

describe("draft-packet — Section 2 auto status", () => {
  it("shows Align decisions from state", () => {
    const state = makeState({ direction: "test direction", scope_boundaries: { in: ["A"], out: ["B"] } });
    const md = renderDraftPacket(state, makeContent());
    expect(md).toContain("방향 승인");
    expect(md).toContain("범위 확정");
  });

  it("shows grounding CST IDs", () => {
    const entries = [makeEntry("CST-001", { discovery_stage: "grounding" }), makeEntry("CST-002", { discovery_stage: "draft_phase2" })];
    const state = makeState({ constraint_pool: makePoolWith(...entries) });
    const md = renderDraftPacket(state, makeContent());
    expect(md).toContain("CST-001 인지 완료");
    expect(md).not.toContain("CST-002 인지 완료");
  });

  it("shows clarify lock warning", () => {
    const pool = emptyPool();
    pool.summary.clarify_pending = 2;
    pool.summary.total = 5;
    const md = renderDraftPacket(makeState({ constraint_pool: pool }), makeContent());
    expect(md).toContain("2건");
  });
});

// ─── Section 3: sorting ───

describe("draft-packet — Section 3 sorting", () => {
  it("sorts required before recommended", () => {
    const e1 = makeEntry("CST-002", { severity: "recommended" });
    const e2 = makeEntry("CST-001", { severity: "required" });
    const state = makeState({ constraint_pool: makePoolWith(e1, e2) });
    const content = makeContent({ constraint_details: [poDet("CST-002"), poDet("CST-001")] });
    const md = renderDraftPacket(state, content);

    const idx001 = md.indexOf("CST-001");
    const idx002 = md.indexOf("CST-002");
    expect(idx001).toBeLessThan(idx002);
  });
});

// ─── Section 3: PO vs Builder ───

describe("draft-packet — Section 3 PO/Builder detail", () => {
  it("renders PO detail with options table", () => {
    const entry = makeEntry("CST-001");
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const content = makeContent({ constraint_details: [poDet("CST-001")] });
    const md = renderDraftPacket(state, content);
    expect(md).toContain("| 선택 | 이점 | 내용 | 리스크 | 되돌림 비용 |");
    expect(md).toContain("추천:");
    expect(md).toContain("선택: ___");
  });

  it("renders Builder detail with builder_decision", () => {
    const entry = makeEntry("CST-001", { decision_owner: "builder" });
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const content = makeContent({ constraint_details: [builderDet("CST-001")] });
    const md = renderDraftPacket(state, content);
    expect(md).toContain("**Builder가 결정할 사항:**");
    expect(md).toContain("Builder 결정 예정");
  });

  it("renders Builder without guardrail — '제품 관점 제약 조건 없음'", () => {
    const entry = makeEntry("CST-001", { decision_owner: "builder" });
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const md = renderDraftPacket(state, makeContent({ constraint_details: [builderDet("CST-001")] }));
    expect(md).toContain("제품 관점 제약 조건 없음");
    expect(md).not.toContain("위 guardrail 확인 후 승인");
  });

  it("renders Builder guardrail when present", () => {
    const entry = makeEntry("CST-001", { decision_owner: "builder" });
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const det = builderDet("CST-001");
    det.guardrail = "API 호환성 유지";
    const md = renderDraftPacket(state, makeContent({ constraint_details: [det] }));
    expect(md).toContain("**guardrail:** API 호환성 유지");
  });

  it("uses pool impact_if_ignored for '처리하지 않으면'", () => {
    const entry = makeEntry("CST-001", { impact_if_ignored: "big problem" });
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const md = renderDraftPacket(state, makeContent({ constraint_details: [poDet("CST-001")] }));
    expect(md).toContain("**처리하지 않으면:** big problem");
  });
});

// ─── Section 4: invalidated ───

describe("draft-packet — Section 4 invalidated", () => {
  it("omits section when no invalidated", () => {
    const md = renderDraftPacket(makeState(), makeContent());
    expect(md).not.toContain("### 4.");
  });

  it("shows invalidated constraints", () => {
    const entry = makeEntry("CST-003", { status: "invalidated" });
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const md = renderDraftPacket(state, makeContent());
    expect(md).toContain("### 4. 시스템이 제외한 항목");
    expect(md).toContain("CST-003");
    expect(md).toContain("복원");
  });

  it("shows required invalidated warning", () => {
    const entry = makeEntry("CST-001", { status: "invalidated", severity: "required" });
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const md = renderDraftPacket(state, makeContent());
    expect(md).toContain("기능 불능 또는 규정 위반");
    expect(md).toContain("제외에 동의하시나요");
  });
});

// ─── Section 5: guardrails ───

describe("draft-packet — Section 5 guardrails", () => {
  it("renders guardrail bullets", () => {
    const md = renderDraftPacket(makeState(), makeContent({ guardrails: ["규칙1", "규칙2"] }));
    expect(md).toContain("- 규칙1");
    expect(md).toContain("- 규칙2");
  });
});

// ─── Section 6: decision ───

describe("draft-packet — Section 6 decision", () => {
  it("shows approve-only when no constraints", () => {
    const md = renderDraftPacket(makeState(), makeContent());
    expect(md).toContain("Approve만 선택");
  });

  it("shows full choices with constraint questions", () => {
    const entry = makeEntry("CST-001");
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const md = renderDraftPacket(state, makeContent({
      constraint_details: [poDet("CST-001")],
      decision_questions: ["8건에 대해 선택해 주세요"],
    }));
    expect(md).toContain("각 CST 결정");
    expect(md).toContain("compile을 시작합니다");
  });

  it("shows clarify warning when pending", () => {
    const pool = emptyPool();
    pool.summary.clarify_pending = 1;
    pool.summary.total = 1;
    const entry = makeEntry("CST-001");
    pool.constraints = [entry];
    const state = makeState({ constraint_pool: pool });
    const md = renderDraftPacket(state, makeContent({
      constraint_details: [poDet("CST-001")],
      decision_questions: ["선택하세요"],
    }));
    expect(md).toContain("clarify");
    expect(md).toContain("잠글 수 없습니다");
  });
});

// ─── Edge cases: empty and undefined fields ───

describe("draft-packet — empty/undefined edge cases", () => {
  it("renders with empty scenario_guide (no table)", () => {
    const md = renderDraftPacket(makeState(), makeContent({ scenario_guide: [] }));
    expect(md).toContain("### 1. 확정된 Surface");
    expect(md).not.toContain("| 시나리오 | 시작 |");
  });

  it("renders '없음' when guardrails is empty", () => {
    const md = renderDraftPacket(makeState(), makeContent({ guardrails: [] }));
    expect(md).toContain("없음");
  });

  it("omits run_command when undefined", () => {
    const md = renderDraftPacket(makeState(), makeContent({
      run_command: undefined,
    }));
    expect(md).not.toContain("**실행 방법**");
  });

  it("omits mockup_revisions when undefined", () => {
    const md = renderDraftPacket(makeState(), makeContent({
      mockup_revisions: undefined,
    }));
    expect(md).not.toContain("mockup 반복");
  });

  it("renders run_command when provided", () => {
    const md = renderDraftPacket(makeState(), makeContent({
      run_command: "npm run dev",
    }));
    expect(md).toContain("`npm run dev`");
  });

  it("renders mockup_revisions when provided", () => {
    const md = renderDraftPacket(makeState(), makeContent({
      mockup_revisions: 5,
    }));
    expect(md).toContain("5회 수정 후 사용자 확정");
  });
});

// ─── Validation ───

describe("draft-packet — validation", () => {
  it("throws when constraint_id not in pool", () => {
    expect(() => renderDraftPacket(makeState(), makeContent({
      constraint_details: [poDet("CST-MISSING")],
    }))).toThrow("CST-MISSING");
  });

  it("throws when decision_owner mismatch", () => {
    const entry = makeEntry("CST-001", { decision_owner: "builder" });
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    expect(() => renderDraftPacket(state, makeContent({
      constraint_details: [poDet("CST-001")], // PO detail for builder constraint
    }))).toThrow("decision_owner");
  });
});
