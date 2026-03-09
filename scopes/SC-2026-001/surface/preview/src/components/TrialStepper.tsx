import type { TrialLesson } from "../types";

interface TrialStepperProps {
  trials: TrialLesson[];
}

/**
 * 3회차 진행 스텝 인디케이터.
 * - 완료(completed/consumed): 초록 채움 원
 * - 예약가능(available/reserved): 초록 테두리 원
 * - 잠금(locked): 회색 자물쇠
 */
export default function TrialStepper({ trials }: TrialStepperProps) {
  const remaining = trials.filter(
    (t) => t.status === "available" || t.status === "reserved" || t.status === "locked"
  ).length;

  return (
    <div className="w-full">
      {/* 스텝 원과 연결선 */}
      <div className="flex items-center justify-between px-6 relative">
        {trials.map((trial, idx) => {
          const state = getStepState(trial.status);
          const isLast = idx === trials.length - 1;

          return (
            <div key={trial.round} className="flex items-center flex-1 last:flex-none">
              {/* 원 + 라벨 */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <StepCircle state={state} />
                <span
                  className={`text-xs font-medium ${
                    state === "done"
                      ? "text-[#6ABE36]"
                      : state === "current"
                      ? "text-[#1c1c1c]"
                      : "text-[#a5a5a5]"
                  }`}
                >
                  {trial.round}회차
                </span>
              </div>

              {/* 연결선 */}
              {!isLast && (
                <div className="flex-1 mx-2 relative -top-2">
                  <div
                    className="h-[2px] w-full rounded-full"
                    style={{
                      backgroundColor:
                        state === "done" ? "#9BEB26" : "#e8e8e8",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 남은 횟수 안내 */}
      <p className="text-center text-[13px] text-[#757575] mt-4">
        무료 체험 {remaining}회 남음
      </p>
    </div>
  );
}

type StepState = "done" | "current" | "locked";

function getStepState(
  status: TrialLesson["status"]
): StepState {
  if (status === "completed" || status === "consumed") return "done";
  if (status === "available" || status === "reserved") return "current";
  return "locked";
}

function StepCircle({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#9BEB26" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (state === "current") {
    return (
      <div
        className="w-8 h-8 rounded-full border-[2.5px] flex items-center justify-center bg-white"
        style={{ borderColor: "#9BEB26" }}
      >
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#9BEB26" }} />
      </div>
    );
  }
  // locked
  return (
    <div className="w-8 h-8 rounded-full bg-[#e8e8e8] flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" stroke="#a5a5a5" strokeWidth="1.5" fill="none" />
        <path d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2C8.38 2 9.5 3.12 9.5 4.5V6" stroke="#a5a5a5" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
