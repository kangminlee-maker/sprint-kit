/** 체험 상태 — 홈 화면 Greeting 분기의 기준 */
export type TrialState =
  | "not_applied"       // 미신청 → trial 변형
  | "trial_waiting"     // 체험대기 (결제 완료, 예약 전) → booking_waiting 변형
  | "booking_reserved"  // 예약완료 (수업 2시간+ 전) → booking_waiting 변형
  | "lesson_imminent"   // 레슨입장 (수업 10분 전~) → booking_imminent 변형
  | "trial_completed"   // 체험완료 → no_plan 변형 재활용
  | "tutor_noshow"      // 튜터노쇼 → no_booking 변형 재활용
  | "student_noshow"    // 학생노쇼/취소 → no_booking 변형 재활용
  | "trial_exhausted";  // 전체소진 → no_plan 변형 재활용

/** 홈 화면 변형 — 디자인 온톨로지 home_variants */
export type HomeVariant =
  | "trial"
  | "no_plan"
  | "no_booking"
  | "booking_waiting"
  | "booking_imminent";

/** TrialState → HomeVariant 매핑 */
export function toHomeVariant(state: TrialState): HomeVariant {
  switch (state) {
    case "not_applied":
      return "trial";
    case "trial_waiting":
    case "booking_reserved":
      return "booking_waiting";
    case "lesson_imminent":
      return "booking_imminent";
    case "trial_completed":
    case "trial_exhausted":
      return "no_plan";
    case "tutor_noshow":
    case "student_noshow":
      return "no_booking";
  }
}

/** 상태별 라벨 (디버그 패널용) */
export const TRIAL_STATE_LABELS: Record<TrialState, string> = {
  not_applied: "미신청",
  trial_waiting: "체험대기",
  booking_reserved: "예약완료",
  lesson_imminent: "레슨입장",
  trial_completed: "체험완료",
  tutor_noshow: "튜터노쇼",
  student_noshow: "학생노쇼",
  trial_exhausted: "전체소진",
};

/** 프로그레스바 단계 */
export const PROGRESS_STEPS = ["신청", "예습", "레슨", "완료"] as const;
export type ProgressStep = (typeof PROGRESS_STEPS)[number];
