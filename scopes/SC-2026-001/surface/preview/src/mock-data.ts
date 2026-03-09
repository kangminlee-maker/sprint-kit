import type { TrialLesson, ScenarioKey } from "./types";

/** 시나리오별 체험 회차 상태 프리셋 */
export const scenarioPresets: Record<ScenarioKey, TrialLesson[]> = {
  /** 정상 진행: 1회차 완료, 2회차 예약대기, 3회차 잠금 */
  normal: [
    { round: 1, status: "completed", level: "Beginner" },
    { round: 2, status: "available", level: "Beginner" },
    { round: 3, status: "locked", level: "Elementary" },
  ],

  /** 학생 노쇼: 1회차 노쇼 차감, 2회차 예약대기, 3회차 잠금 */
  studentNoShow: [
    { round: 1, status: "consumed", level: "Beginner" },
    { round: 2, status: "available", level: "Beginner" },
    { round: 3, status: "locked", level: "Elementary" },
  ],

  /** 튜터 노쇼: 1회차 예약대기(복구됨), 2/3회차 잠금 */
  tutorNoShow: [
    { round: 1, status: "available", level: "Beginner" },
    { round: 2, status: "locked", level: "Beginner" },
    { round: 3, status: "locked", level: "Elementary" },
  ],

  /** 전체 소진: 3회차 모두 완료 */
  allDone: [
    { round: 1, status: "completed", level: "Beginner" },
    { round: 2, status: "completed", level: "Beginner" },
    { round: 3, status: "completed", level: "Elementary" },
  ],
};

/** 시나리오 한글 라벨 */
export const scenarioLabels: Record<ScenarioKey, string> = {
  normal: "정상 진행",
  studentNoShow: "학생 노쇼",
  tutorNoShow: "튜터 노쇼",
  allDone: "전체 소진",
};

/** 사용자 이름 (목업용) */
export const userName = "지수";

/** 예약 시간 샘플 */
export const sampleReservation = "2026-03-12 (목) 오후 3:00";
