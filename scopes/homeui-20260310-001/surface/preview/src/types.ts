export type HomeState =
  | "TRIAL_IDLE"        // 미신청
  | "TRIAL_BOOKED"      // 예약 대기
  | "LESSON_IMMINENT"   // 레슨 임박 (시작 10분 전~)
  | "TRIAL_COMPLETED"   // 체험 완료 (미결제)
  | "STUDENT_NOSHOW"    // 학생 노쇼
  | "TUTOR_NOSHOW"      // 튜터 노쇼
  | "TRIAL_EXHAUSTED"   // 3회 전체 소진
  | "CANCELLED";        // 취소

export interface LessonInfo {
  lessonId: string;
  scheduledAt: string;        // ISO datetime
  tutorName: string;
  courseName: string;
  invoiceStatus: string;
  city: "PODO" | "PODO_TRIAL";
}

export interface UserInfo {
  trialPaymentYn: "Y" | "N";
  trialClassCompYn: "Y" | "N";
  paymentYn: "Y" | "N";
  remainTrialCount: number;
  totalTrialCount: number;
  penaltyEndAt: string | null;  // ISO datetime or null
}

export interface TrialStep {
  stepName: "NONE" | "STEP1" | "STEP2" | "STEP3" | "STEP4" | "STEP5";
  preStudyProgress: number;     // 0~100
}

export interface ScenarioData {
  state: HomeState;
  user: UserInfo;
  lesson: LessonInfo | null;
  trialStep: TrialStep;
}
