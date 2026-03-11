import type { TrialState, ScenarioData } from "./types";

const lesson = {
  date: "3월 13일 (목)",
  time: "19:00",
  tutorName: "Sarah",
  language: "영어",
  level: "초급 (B)",
};

export const scenarios: Record<TrialState, ScenarioData> = {
  trial_idle: {
    label: "미신청",
    ticketsTotal: 0,
    ticketsRemaining: 0,
    completedCount: 0,
  },
  trial_booked: {
    label: "1회차 예약",
    ticketsTotal: 3,
    ticketsRemaining: 2,
    completedCount: 0,
    lessonInfo: lesson,
  },
  trial_progress_1: {
    label: "1/3 완료",
    ticketsTotal: 3,
    ticketsRemaining: 2,
    completedCount: 1,
    couponIssued: true,
  },
  trial_progress_2: {
    label: "2/3 완료",
    ticketsTotal: 3,
    ticketsRemaining: 1,
    completedCount: 2,
    couponIssued: true,
  },
  trial_complete: {
    label: "3/3 완료",
    ticketsTotal: 3,
    ticketsRemaining: 0,
    completedCount: 3,
    couponIssued: true,
  },
  student_noshow: {
    label: "학생 노쇼",
    ticketsTotal: 3,
    ticketsRemaining: 1,
    completedCount: 0,
  },
  tutor_noshow: {
    label: "튜터 노쇼",
    ticketsTotal: 3,
    ticketsRemaining: 3,
    completedCount: 0,
  },
  trial_exhausted: {
    label: "소진 → 유료",
    ticketsTotal: 3,
    ticketsRemaining: 0,
    completedCount: 3,
  },
};

export const scenarioOrder: TrialState[] = [
  "trial_idle",
  "trial_booked",
  "trial_progress_1",
  "trial_progress_2",
  "trial_complete",
  "student_noshow",
  "tutor_noshow",
  "trial_exhausted",
];
