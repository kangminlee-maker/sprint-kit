import type { ScenarioData } from "./types";

const tomorrow = new Date(Date.now() + 86400000).toISOString();
const tenMinLater = new Date(Date.now() + 600000).toISOString();
const threeDaysLater = new Date(Date.now() + 259200000).toISOString();

export const scenarios: Record<string, { label: string; data: ScenarioData }> = {
  TRIAL_IDLE: {
    label: "1. 미신청",
    data: {
      state: "TRIAL_IDLE",
      user: {
        trialPaymentYn: "N",
        trialClassCompYn: "N",
        paymentYn: "N",
        remainTrialCount: 3,
        totalTrialCount: 3,
        penaltyEndAt: null,
      },
      lesson: null,
      trialStep: { stepName: "NONE", preStudyProgress: 0 },
    },
  },

  TRIAL_BOOKED: {
    label: "2. 예약 대기",
    data: {
      state: "TRIAL_BOOKED",
      user: {
        trialPaymentYn: "Y",
        trialClassCompYn: "N",
        paymentYn: "N",
        remainTrialCount: 2,
        totalTrialCount: 3,
        penaltyEndAt: null,
      },
      lesson: {
        lessonId: "L-001",
        scheduledAt: tomorrow,
        tutorName: "Emma",
        courseName: "일상 영어 회화",
        invoiceStatus: "RESERVED",
        city: "PODO_TRIAL",
      },
      trialStep: { stepName: "STEP3", preStudyProgress: 40 },
    },
  },

  LESSON_IMMINENT: {
    label: "3. 레슨 임박",
    data: {
      state: "LESSON_IMMINENT",
      user: {
        trialPaymentYn: "Y",
        trialClassCompYn: "N",
        paymentYn: "N",
        remainTrialCount: 2,
        totalTrialCount: 3,
        penaltyEndAt: null,
      },
      lesson: {
        lessonId: "L-001",
        scheduledAt: tenMinLater,
        tutorName: "Emma",
        courseName: "일상 영어 회화",
        invoiceStatus: "RESERVED",
        city: "PODO_TRIAL",
      },
      trialStep: { stepName: "STEP5", preStudyProgress: 100 },
    },
  },

  TRIAL_COMPLETED: {
    label: "4. 체험 완료",
    data: {
      state: "TRIAL_COMPLETED",
      user: {
        trialPaymentYn: "Y",
        trialClassCompYn: "Y",
        paymentYn: "N",
        remainTrialCount: 0,
        totalTrialCount: 3,
        penaltyEndAt: null,
      },
      lesson: {
        lessonId: "L-001",
        scheduledAt: new Date(Date.now() - 3600000).toISOString(),
        tutorName: "Emma",
        courseName: "일상 영어 회화",
        invoiceStatus: "COMPLETED",
        city: "PODO_TRIAL",
      },
      trialStep: { stepName: "STEP5", preStudyProgress: 100 },
    },
  },

  STUDENT_NOSHOW: {
    label: "5. 학생 노쇼",
    data: {
      state: "STUDENT_NOSHOW",
      user: {
        trialPaymentYn: "Y",
        trialClassCompYn: "N",
        paymentYn: "N",
        remainTrialCount: 1,
        totalTrialCount: 3,
        penaltyEndAt: threeDaysLater,
      },
      lesson: {
        lessonId: "L-001",
        scheduledAt: new Date(Date.now() - 7200000).toISOString(),
        tutorName: "Emma",
        courseName: "일상 영어 회화",
        invoiceStatus: "NOSHOW_S",
        city: "PODO_TRIAL",
      },
      trialStep: { stepName: "STEP2", preStudyProgress: 60 },
    },
  },

  TUTOR_NOSHOW: {
    label: "6. 튜터 노쇼",
    data: {
      state: "TUTOR_NOSHOW",
      user: {
        trialPaymentYn: "Y",
        trialClassCompYn: "N",
        paymentYn: "N",
        remainTrialCount: 2,
        totalTrialCount: 3,
        penaltyEndAt: null,
      },
      lesson: {
        lessonId: "L-001",
        scheduledAt: new Date(Date.now() - 3600000).toISOString(),
        tutorName: "Emma",
        courseName: "일상 영어 회화",
        invoiceStatus: "CANCEL_NOSHOW_T",
        city: "PODO_TRIAL",
      },
      trialStep: { stepName: "STEP2", preStudyProgress: 60 },
    },
  },

  TRIAL_EXHAUSTED: {
    label: "7. 전체 소진",
    data: {
      state: "TRIAL_EXHAUSTED",
      user: {
        trialPaymentYn: "Y",
        trialClassCompYn: "Y",
        paymentYn: "N",
        remainTrialCount: 0,
        totalTrialCount: 3,
        penaltyEndAt: null,
      },
      lesson: null,
      trialStep: { stepName: "STEP5", preStudyProgress: 100 },
    },
  },

  CANCELLED: {
    label: "8. 취소",
    data: {
      state: "CANCELLED",
      user: {
        trialPaymentYn: "Y",
        trialClassCompYn: "N",
        paymentYn: "N",
        remainTrialCount: 2,
        totalTrialCount: 3,
        penaltyEndAt: null,
      },
      lesson: {
        lessonId: "L-001",
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        tutorName: "Emma",
        courseName: "일상 영어 회화",
        invoiceStatus: "CANCEL",
        city: "PODO_TRIAL",
      },
      trialStep: { stepName: "STEP2", preStudyProgress: 30 },
    },
  },
};
