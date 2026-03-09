import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderAlignPacket } from "./align-packet.js";
import { reduce } from "../kernel/reducer.js";
import type {
  Event,
  ScopeState,
  AlignPacketContent,
  ConstraintPool,
  ConstraintEntry,
} from "../kernel/types.js";

// ─── Helpers ───

function emptyPool(): ConstraintPool {
  return {
    constraints: [],
    summary: { total: 0, required: 0, recommended: 0, decided: 0, clarify_pending: 0, invalidated: 0, undecided: 0 },
  };
}

function makeEntry(id: string, overrides: Partial<ConstraintEntry> = {}): ConstraintEntry {
  return {
    constraint_id: id,
    perspective: "code",
    summary: `test summary for ${id}`,
    severity: "recommended",
    discovery_stage: "grounding",
    decision_owner: "product_owner",
    impact_if_ignored: `impact if ${id} ignored`,
    source_refs: [{ source: "test.ts", detail: "test detail" }],
    status: "undecided",
    discovered_at: 1,
    ...overrides,
  };
}

function makePoolWith(...entries: ConstraintEntry[]): ConstraintPool {
  let required = 0, recommended = 0;
  for (const e of entries) {
    if (e.severity === "required") required++; else recommended++;
  }
  return {
    constraints: entries,
    summary: {
      total: entries.length, required, recommended,
      decided: 0, clarify_pending: 0, invalidated: 0, undecided: entries.length,
    },
  };
}

function makeState(overrides: Partial<ScopeState> = {}): ScopeState {
  return {
    scope_id: "SC-TEST",
    title: "테스트 Scope",
    description: "테스트용",
    entry_mode: "experience",
    current_state: "grounded",
    constraint_pool: emptyPool(),
    stale: false,
    compile_ready: false,
    convergence_blocked: false,
    revision_count_align: 0,
    revision_count_surface: 0,
    verdict_log: [],
    feedback_history: [],
    latest_revision: 0,
    ...overrides,
  };
}

function makeContent(overrides: Partial<AlignPacketContent> = {}): AlignPacketContent {
  return {
    user_original_text: "테스트 기능",
    interpreted_direction: "테스트 해석 방향",
    proposed_scope: { in: ["기능A", "기능B"], out: ["기능C"] },
    scenarios: ["시나리오 1: 사용자가 A를 수행합니다"],
    as_is: {
      experience: "현재 화면에 해당 기능 없음",
      policy: "관련 정책 없음",
      code: "관련 코드 없음",
    },
    tensions: [],
    decision_questions: ["이 범위에 동의하십니까?"],
    ...overrides,
  };
}

// ─── Golden data ───

describe("align-packet — golden data structure", () => {
  it("renders Align Packet matching golden structure", () => {
    const goldenPath = resolve(
      import.meta.dirname,
      "../../scopes/example-tutor-block/events.ndjson",
    );
    const events: Event[] = readFileSync(goldenPath, "utf-8")
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line) as Event);

    // Use state at align.proposed point (first 7 events: up to align.proposed)
    const alignEvents = events.slice(0, 7);
    const state = reduce(alignEvents);

    const content: AlignPacketContent = {
      user_original_text: "튜터 차단 기능",
      interpreted_direction: "학생이 특정 튜터를 차단하면, 향후 매칭에서 해당 튜터가 자동으로 제외됩니다.",
      proposed_scope: {
        in: ["차단 생성", "차단 해제", "차단 목록 조회", "매칭 시 차단 반영"],
        out: ["튜터에게 차단 사실 통보", "차단 사유 수집", "관리자 차단 기능"],
      },
      scenarios: [
        "시나리오 1: 학생 A가 수업 후 튜터 B를 차단합니다. 이후 수업 예약 시 튜터 B는 후보에 나타나지 않습니다.",
        "시나리오 2: 학생 A가 차단 관리 화면에서 튜터 B의 차단을 해제합니다. 이후 튜터 B가 다시 매칭 후보에 포함됩니다.",
      ],
      as_is: {
        experience: "튜터 프로필 화면이 존재하지만, 차단 기능은 없습니다.",
        policy: "이용약관에 공정 매칭 조항이 있습니다.",
        code: "매칭 시스템은 언어, 시간대, 레벨만으로 튜터를 배정합니다.",
        code_details: "매칭 엔진: matching-engine.ts의 findAvailableTutors()",
      },
      tensions: [
        { constraint_id: "CST-001", what: "매칭 시스템에 제외 기능 없음", why_conflict: "화면과 시스템이 함께 바뀌어야 함", scale: "매칭 시스템 내부 로직 변경 필요" },
        { constraint_id: "CST-002", what: "이용약관 충돌", why_conflict: "차단이 공정 매칭과 양립 불가", scale: "약관 검토 필요", options: ["예외 조항 추가", "사유 수집으로 제한", "현재 약관 유지", "법무 확인"] },
        { constraint_id: "CST-003", what: "버튼 공간 부족", why_conflict: "간격 부족으로 오터치 위험", scale: "레이아웃 재배치", details: "현재 여유 공간 8px, 가이드 기준 16px" },
      ],
      decision_questions: [
        "위 범위(포함/제외)에 동의하십니까?",
        "이 3건의 충돌을 인지한 상태에서 이 방향으로 진행하겠습니까?",
        "열린 질문은 Draft 단계에서 결정해도 됩니까?",
      ],
    };

    const md = renderAlignPacket(state, content);

    // Section existence
    expect(md).toContain("### 1. 당신이 요청한 것 (To-be)");
    expect(md).toContain("### 2. 현재 현실 (As-is)");
    expect(md).toContain("### 3. 충돌 지점 (Tension)");
    expect(md).toContain("### 4. 지금 결정할 것");

    // Header
    expect(md).toContain("## Align Packet: 튜터 차단 기능");

    // CST tracking
    expect(md).toContain("CST-001");
    expect(md).toContain("CST-002");
    expect(md).toContain("CST-003");

    // Summary table
    expect(md).toContain("| CST-ID | 관점 | 요약 |");

    // Impact from pool
    expect(md).toContain("차단 버튼을 눌러도 실제 매칭에 반영되지 않습니다");

    // <details>
    expect(md).toContain("<details>");
    expect(md).toContain("기술 상세 (Builder 참고용)");

    // Decision choices
    expect(md).toContain("**Approve** / **Revise** / **Reject** / **Redirect**");
  });
});

// ─── Section 1: To-be ───

describe("align-packet — Section 1 To-be", () => {
  it("renders original text", () => {
    const md = renderAlignPacket(makeState(), makeContent({ user_original_text: "My feature" }));
    expect(md).toContain('"My feature"');
  });

  it("renders scope tables with '동의하시나요?' column", () => {
    const md = renderAlignPacket(makeState(), makeContent({
      proposed_scope: { in: ["X", "Y"], out: ["Z"] },
    }));
    expect(md).toContain("| 포함 | 동의하시나요? |");
    expect(md).toContain("| X | |");
    expect(md).toContain("| 제외 | 동의하시나요? |");
    expect(md).toContain("| Z | |");
  });

  it("renders scenarios as blockquotes", () => {
    const md = renderAlignPacket(makeState(), makeContent({
      scenarios: ["학생이 차단합니다"],
    }));
    expect(md).toContain("> 학생이 차단합니다");
  });

  it("renders interface extras when entry_mode is interface", () => {
    const md = renderAlignPacket(
      makeState({ entry_mode: "interface" }),
      makeContent({
        interface_extras: { api_scope: "public", breaking_change: "forbidden", version_policy: "extend" },
      }),
    );
    expect(md).toContain("API 공개 범위");
    expect(md).toContain("public");
  });
});

// ─── Section 2: As-is ───

describe("align-packet — Section 2 As-is", () => {
  it("renders 3 perspective headers", () => {
    const md = renderAlignPacket(makeState(), makeContent());
    expect(md).toContain("#### Experience 관점");
    expect(md).toContain("#### Policy 관점");
    expect(md).toContain("#### Code 관점");
  });

  it("renders code_details in <details>", () => {
    const md = renderAlignPacket(makeState(), makeContent({
      as_is: { experience: "e", policy: "p", code: "c", code_details: "technical stuff" },
    }));
    expect(md).toContain("<details>");
    expect(md).toContain("technical stuff");
  });

  it("omits <details> when no code_details", () => {
    const md = renderAlignPacket(makeState(), makeContent({
      as_is: { experience: "e", policy: "p", code: "c" },
    }));
    expect(md).not.toContain("<details>");
  });
});

// ─── Section 3: Tension ───

describe("align-packet — Section 3 Tension", () => {
  it("renders summary table from tensions", () => {
    const entry = makeEntry("CST-001", { perspective: "code", summary: "no exclusion" });
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const content = makeContent({
      tensions: [{ constraint_id: "CST-001", what: "w", why_conflict: "c", scale: "s" }],
    });
    const md = renderAlignPacket(state, content);
    expect(md).toContain("| CST-001 | Code | no exclusion |");
  });

  it("renders individual detail with 4 required items", () => {
    const entry = makeEntry("CST-001", { impact_if_ignored: "bad things happen" });
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const content = makeContent({
      tensions: [{ constraint_id: "CST-001", what: "WHAT", why_conflict: "WHY", scale: "BIG" }],
    });
    const md = renderAlignPacket(state, content);
    expect(md).toContain("**이것이 무엇인가:**");
    expect(md).toContain("WHAT");
    expect(md).toContain("**왜 충돌하는가:**");
    expect(md).toContain("WHY");
    expect(md).toContain("**처리하지 않으면:**");
    expect(md).toContain("bad things happen");
    expect(md).toContain("**변경 규모:** BIG");
  });

  it("renders options as table when present", () => {
    const entry = makeEntry("CST-001");
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const content = makeContent({
      tensions: [{
        constraint_id: "CST-001", what: "w", why_conflict: "c", scale: "s",
        options: [
          { choice: "opt A", pros: "빠름", risk: "낮음", detail: "상세A" },
          { choice: "opt B", pros: "안정적", risk: "중간" },
        ],
        recommendation: "opt A 추천",
      }],
    });
    const md = renderAlignPacket(state, content);
    expect(md).toContain("| 선택 | 이점 | 리스크 | 내용 |");
    expect(md).toContain("| opt A | 빠름 | 낮음 | 상세A |");
    expect(md).toContain("| opt B | 안정적 | 중간 |  |");
    expect(md).toContain("**추천:** opt A 추천");
  });

  it("renders tension details in <details>", () => {
    const entry = makeEntry("CST-001");
    const state = makeState({ constraint_pool: makePoolWith(entry) });
    const content = makeContent({
      tensions: [{ constraint_id: "CST-001", what: "w", why_conflict: "c", scale: "s", details: "tech detail" }],
    });
    const md = renderAlignPacket(state, content);
    expect(md).toContain("tech detail");
    // Multiple <details> blocks (one from as_is if exists, one from tension)
  });

  it("renders empty tension message when no constraints", () => {
    const md = renderAlignPacket(makeState(), makeContent({ tensions: [] }));
    expect(md).toContain("발견된 충돌이 없습니다");
  });

  it("shows tension count", () => {
    const entries = [makeEntry("CST-001"), makeEntry("CST-002")];
    const state = makeState({ constraint_pool: makePoolWith(...entries) });
    const content = makeContent({
      tensions: [
        { constraint_id: "CST-001", what: "w1", why_conflict: "c1", scale: "s1" },
        { constraint_id: "CST-002", what: "w2", why_conflict: "c2", scale: "s2" },
      ],
    });
    const md = renderAlignPacket(state, content);
    expect(md).toContain("2건의 충돌");
  });
});

// ─── Section 4: Decision ───

describe("align-packet — Section 4 Decision", () => {
  it("renders questions and choices", () => {
    const md = renderAlignPacket(makeState(), makeContent({
      decision_questions: ["Q1?", "Q2?"],
    }));
    expect(md).toContain("1. Q1?");
    expect(md).toContain("2. Q2?");
    expect(md).toContain("**Approve**");
  });
});

// ─── Edge cases: empty collections ───

describe("align-packet — empty collections edge cases", () => {
  it("renders with empty scenarios (no blockquotes)", () => {
    const md = renderAlignPacket(makeState(), makeContent({ scenarios: [] }));
    expect(md).toContain("**시나리오:**");
    expect(md).not.toContain("> ");
  });

  it("renders with empty proposed_scope.in and out (tables with headers only)", () => {
    const md = renderAlignPacket(makeState(), makeContent({
      proposed_scope: { in: [], out: [] },
    }));
    expect(md).toContain("| 포함 | 동의하시나요? |");
    expect(md).toContain("| 제외 | 동의하시나요? |");
    // No data rows
    const lines = md.split("\n");
    const inHeaderIdx = lines.findIndex(l => l.includes("| 포함 | 동의하시나요? |"));
    const separatorIdx = inHeaderIdx + 1;
    const nextLine = lines[separatorIdx + 1];
    // Next line should be empty or the exclusion table
    expect(nextLine === "" || nextLine.includes("| 제외")).toBe(true);
  });

  it("interface_extras is ignored when entry_mode is experience", () => {
    const md = renderAlignPacket(
      makeState({ entry_mode: "experience" }),
      makeContent({
        interface_extras: { api_scope: "public", breaking_change: "forbidden", version_policy: "extend" },
      }),
    );
    expect(md).not.toContain("API 공개 범위");
    expect(md).not.toContain("Interface scope 추가 항목");
  });

  it("renders with empty tensions array", () => {
    const md = renderAlignPacket(makeState(), makeContent({ tensions: [] }));
    expect(md).toContain("발견된 충돌이 없습니다");
    expect(md).not.toContain("| CST-ID |");
  });

  it("renders with empty decision_questions", () => {
    const md = renderAlignPacket(makeState(), makeContent({ decision_questions: [] }));
    expect(md).toContain("### 4. 지금 결정할 것");
    expect(md).toContain("**Approve**");
  });
});

// ─── Validation ───

describe("align-packet — validation", () => {
  it("throws when tension constraint_id not in pool", () => {
    const content = makeContent({
      tensions: [{ constraint_id: "CST-MISSING", what: "w", why_conflict: "c", scale: "s" }],
    });
    expect(() => renderAlignPacket(makeState(), content)).toThrow("CST-MISSING");
  });

  it("throws when entry_mode is interface but no interface_extras", () => {
    const state = makeState({ entry_mode: "interface" });
    expect(() => renderAlignPacket(state, makeContent())).toThrow("interface_extras");
  });
});
