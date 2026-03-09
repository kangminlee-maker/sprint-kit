import { describe, it, expect } from "vitest";
import { wrapGateError } from "./error-messages.js";

describe("wrapGateError", () => {
  it("wraps Transition denied → Korean message", () => {
    const reason = 'Transition denied: "draft" does not allow "align.locked"';
    expect(wrapGateError(reason)).toBe("현재 단계에서 이 작업을 수행할 수 없습니다.");
  });

  it("wraps Referential integrity → Korean message", () => {
    const reason = 'Referential integrity: constraint_id "CST-999" not found in pool';
    expect(wrapGateError(reason)).toBe("내부 참조 오류가 발생했습니다. 에이전트가 이벤트를 재확인해야 합니다.");
  });

  it("wraps Required constraint + rationale → Korean message", () => {
    const reason = 'Required constraint "CST-001" with override decision requires non-empty rationale';
    expect(wrapGateError(reason)).toBe("필수 제약 사항을 무시하려면 이유를 반드시 입력해야 합니다.");
  });

  it("wraps Convergence blocked → Korean message", () => {
    const reason = 'Convergence blocked: cannot "align.revised" until convergence.action_taken is recorded';
    expect(wrapGateError(reason)).toBe("수렴 차단 상태입니다. 방향 변경, scope 축소, 또는 보류 중 하나를 선택하세요.");
  });

  it("wraps Compile retry limit → Korean message", () => {
    const reason = "Compile retry limit exceeded (3 gap_found cycles). Consider scope.deferred or redirect.to_align.";
    expect(wrapGateError(reason)).toBe("compile 재시도 한도(3회)를 초과했습니다. scope를 보류하거나 방향을 재검토하세요.");
  });

  it("passes through Target lock messages (already Korean)", () => {
    const reason = "Target lock 불가: 미결정 2건. 모든 constraint 결정이 완료되어야 합니다.";
    expect(wrapGateError(reason)).toBe(reason);
  });

  it("passes through unknown error messages unchanged", () => {
    const reason = "Some unknown error occurred";
    expect(wrapGateError(reason)).toBe(reason);
  });
});
