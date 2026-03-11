export type TrialState =
  | "trial_idle"        // 미신청
  | "trial_booked"      // 1회차 예약 완료
  | "trial_progress_1"  // 1/3 완료 → 다음 예약
  | "trial_progress_2"  // 2/3 완료 → 마지막 예약
  | "trial_complete"    // 3/3 완료 → 정규 전환
  | "student_noshow"    // 학생 노쇼 → 2장 소멸
  | "tutor_noshow"      // 튜터 노쇼 → 복구
  | "trial_exhausted";  // 소진 → 유료 체험

export interface LessonInfo {
  date: string;
  time: string;
  tutorName: string;
  language: string;
  level: string;
}

export interface ScenarioData {
  label: string;
  ticketsTotal: number;
  ticketsRemaining: number;
  completedCount: number;
  lessonInfo?: LessonInfo;
  couponIssued?: boolean;
}
