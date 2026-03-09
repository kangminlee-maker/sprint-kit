import type { TrialLesson, ScreenId } from "../types";
import { sampleReservation } from "../mock-data";
import TrialLessonCard from "./TrialLessonCard";

interface TrialLessonDetailProps {
  trials: TrialLesson[];
  onNavigate: (screen: ScreenId) => void;
  onBack: () => void;
}

export default function TrialLessonDetail({
  trials,
  onNavigate,
  onBack,
}: TrialLessonDetailProps) {
  const completed = trials.filter(
    (t) => t.status === "completed" || t.status === "consumed"
  ).length;
  const total = trials.length;
  const progressPct = (completed / total) * 100;

  // 전체 소진 시 전환 화면 유도
  const allDone = trials.every(
    (t) => t.status === "completed" || t.status === "consumed"
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-8 screen-enter">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#e8e8e8]">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center -ml-1"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M13 4L7 10L13 16"
                stroke="#1c1c1c"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className="text-[17px] font-bold text-[#1c1c1c]">
            체험 레슨 상세
          </h2>
        </div>
      </header>

      {/* 진행률 */}
      <section className="bg-white px-5 py-5 mb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-bold text-[#1c1c1c]">
            {completed} / {total} 완료
          </span>
          <span className="text-[13px] text-[#757575]">
            {Math.round(progressPct)}%
          </span>
        </div>
        <div className="w-full h-2 bg-[#e8e8e8] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              backgroundColor: "#9BEB26",
            }}
          />
        </div>
      </section>

      {/* 체험 카드 목록 */}
      <section className="px-4 space-y-3">
        {trials.map((trial) => (
          <TrialLessonCard
            key={trial.round}
            trial={trial}
            reservedAt={
              trial.status === "reserved" ? sampleReservation : undefined
            }
          />
        ))}
      </section>

      {/* 전체 소진 시 전환 유도 배너 */}
      {allDone && (
        <section className="px-4 mt-4">
          <button
            onClick={() => onNavigate("conversion")}
            className="w-full rounded-2xl p-5 text-left transition-colors hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #B5FD4C 0%, #9BEB26 100%)",
            }}
          >
            <p className="text-[16px] font-bold text-[#1c1c1c]">
              체험이 모두 완료되었어요!
            </p>
            <p className="text-[13px] text-[#457B23] mt-1">
              수강권을 둘러보세요 &rarr;
            </p>
          </button>
        </section>
      )}
    </div>
  );
}
