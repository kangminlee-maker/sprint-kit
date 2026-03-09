/** 개별 체험 회차의 상태 */
export type TrialStatus =
  | "available"   // 예약대기 — 예약할 수 있는 상태
  | "reserved"    // 예약완료 — 날짜/시간이 확정된 상태
  | "completed"   // 완료 — 레슨을 정상 수강한 상태
  | "consumed"    // 차감됨 — 학생 노쇼로 횟수가 차감된 상태
  | "locked";     // 잠금 — 이전 회차 완료 전 개방 불가

/** 하나의 체험 회차 데이터 */
export interface TrialLesson {
  round: 1 | 2 | 3;
  status: TrialStatus;
  level?: string;
  reservedAt?: string; // "2026-03-10 (월) 오후 3:00" 형태
}

/** 시나리오 이름 — PO가 전환할 수 있는 미리보기 상태 */
export type ScenarioKey =
  | "normal"       // 정상 진행 (1회차 완료, 2회차 예약가능, 3회차 잠금)
  | "studentNoShow" // 학생 노쇼 (1회차 차감, 2회차 예약가능, 3회차 잠금)
  | "tutorNoShow"   // 튜터 노쇼 (1회차 복구됨, 2/3 잠금)
  | "allDone";      // 전체 소진 (3회차 모두 완료)

/** 현재 보이는 화면 */
export type ScreenId =
  | "home"
  | "detail"
  | "conversion";
