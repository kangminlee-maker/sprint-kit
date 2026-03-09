/**
 * Gate-guard error wrapping for PO-friendly Korean messages.
 *
 * gate-guard returns English diagnostic messages for internal use.
 * This utility translates them to Korean for the commands/ layer
 * where Product Owners interact with the system.
 */

export function wrapGateError(reason: string): string {
  if (reason.includes("Transition denied")) {
    return "현재 단계에서 이 작업을 수행할 수 없습니다.";
  }
  if (reason.includes("Referential integrity")) {
    return "내부 참조 오류가 발생했습니다. 에이전트가 이벤트를 재확인해야 합니다.";
  }
  if (reason.includes("Required constraint") && reason.includes("rationale")) {
    return "필수 제약 사항을 무시하려면 이유를 반드시 입력해야 합니다.";
  }
  if (reason.includes("Convergence blocked")) {
    return "수렴 차단 상태입니다. 방향 변경, scope 축소, 또는 보류 중 하나를 선택하세요.";
  }
  if (reason.includes("Compile retry limit")) {
    return "compile 재시도 한도(3회)를 초과했습니다. scope를 보류하거나 방향을 재검토하세요.";
  }
  if (reason.includes("cannot be invalidated by system alone")) {
    return "필수 제약 사항은 시스템이 단독으로 무효화할 수 없습니다. 사용자의 확인이 필요합니다.";
  }
  if (reason.includes("Target lock")) {
    return reason; // 이미 한국어
  }
  // compile() / validate() 순수 함수 에러
  if (reason.includes("Compile 실패:") || reason.includes("Compile Defense failed")) {
    return "구현 명세 생성에 실패했습니다. 에이전트가 구현 계획을 수정한 뒤 재시도합니다.";
  }
  if (reason.includes("must be") && reason.includes("state")) {
    return "현재 단계에서 이 작업을 수행할 수 없습니다.";
  }
  if (reason.includes("compile_ready is false")) {
    return "아직 구현 명세를 생성할 수 없습니다. 제약 사항 결정이 완료되지 않았거나 소스가 변경되었습니다.";
  }
  if (reason.includes("validation_plan_hash mismatch")) {
    return "검증 계획이 변경되었습니다. compile을 다시 실행해야 합니다.";
  }
  if (reason.includes("no matching injectValidation")) {
    return "구현 계획에 누락된 검증 항목이 있습니다. 에이전트가 수정한 뒤 재시도합니다.";
  }
  return reason; // 알 수 없는 에러는 원문 유지
}
