import type { TrialState } from "../types";
import { PROGRESS_STEPS } from "../types";

/** 체험 진행 상태에 따른 활성 단계 인덱스 (0-based) */
function getActiveStep(state: TrialState): number {
  switch (state) {
    case "not_applied":
      return -1; // 전부 비활성
    case "trial_waiting":
      return 0; // 신청 완료
    case "booking_reserved":
      return 1; // 예습 단계
    case "lesson_imminent":
      return 2; // 레슨 단계
    case "trial_completed":
    case "trial_exhausted":
      return 3; // 완료
    case "tutor_noshow":
    case "student_noshow":
      return 1; // 예습까지 완료, 레슨에서 중단
  }
}

/** 프로그레스바를 표시하지 않는 상태 */
function shouldHide(state: TrialState): boolean {
  return state === "not_applied" || state === "trial_exhausted";
}

export function TrialProgressBar({ state }: { state: TrialState }) {
  if (shouldHide(state)) return null;

  const activeStep = getActiveStep(state);
  const isException = state === "tutor_noshow" || state === "student_noshow";

  return (
    <div className="px-5 pt-3 pb-1">
      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {PROGRESS_STEPS.map((step, i) => {
          const isActive = i <= activeStep;
          const isCurrent = i === activeStep;
          const isLast = i === PROGRESS_STEPS.length - 1;

          return (
            <div key={step} className="flex items-center" style={{ flex: isLast ? 0 : 1 }}>
              {/* Dot */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: isCurrent ? "24px" : "16px",
                    height: isCurrent ? "24px" : "16px",
                    backgroundColor: isException && i === 2
                      ? "var(--red-500)"
                      : isActive
                        ? "var(--green-500)"
                        : "var(--gray-200)",
                    transition: "all 200ms",
                  }}
                >
                  {isCurrent && (
                    <div
                      className="rounded-full"
                      style={{
                        width: "8px",
                        height: "8px",
                        backgroundColor: "white",
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? "var(--gray-900)" : "var(--gray-400)",
                    letterSpacing: "-0.22px",
                  }}
                >
                  {step}
                </span>
              </div>

              {/* Connecting bar */}
              {!isLast && (
                <div
                  className="flex-1"
                  style={{
                    height: "4px",
                    backgroundColor: i < activeStep ? "var(--green-500)" : "var(--gray-200)",
                    marginBottom: "18px",
                    marginLeft: "2px",
                    marginRight: "2px",
                    borderRadius: "2px",
                    transition: "background-color 300ms",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
