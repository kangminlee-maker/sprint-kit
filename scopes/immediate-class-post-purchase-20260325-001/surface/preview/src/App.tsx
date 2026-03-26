import { useState } from "react";
import { Check, ChevronLeft, Gift, Clock, X, Sparkles } from "lucide-react";

// ── Primary Button (isometric 3D) ──

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  const baseColor = disabled ? "#E8E8E8" : "#1C1C1C";
  const faceColor = disabled ? "#F5F5F5" : "#B5FD4C";
  const textColor = disabled ? "#D6D6D6" : "#1C1C1C";
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className="group w-full rounded-lg transition-all"
      style={{ background: baseColor, paddingBottom: disabled ? 0 : 4, borderRadius: 8 }}
      disabled={disabled}
    >
      <div
        className={`w-full rounded-lg px-5 py-3.5 text-center text-base font-bold leading-6 transition-all ${
          disabled ? "" : "group-active:translate-y-[4px]"
        }`}
        style={{
          background: faceColor,
          color: textColor,
          outline: disabled ? "none" : "1.5px solid #1C1C1C",
          outlineOffset: "-1.5px",
          borderRadius: 8,
        }}
      >
        {children}
      </div>
    </button>
  );
}

// ── Mock Data ──

type PlanType = "count" | "unlimited";

const PLANS: Record<PlanType, { planName: string; planType: PlanType; totalClasses: number | "무제한"; expireDate: string; price: string }> = {
  count: {
    planName: "영어 회화 6개월",
    planType: "count",
    totalClasses: 48,
    expireDate: "2026-09-25",
    price: "299,000원",
  },
  unlimited: {
    planName: "영어 회화 무제한 3개월",
    planType: "unlimited",
    totalClasses: "무제한",
    expireDate: "2026-06-25",
    price: "449,000원",
  },
};

const LEVELS = [
  { id: "beginner", label: "Beginner", description: "기초 인사, 간단한 문장", firstLesson: "Self-Introduction" },
  { id: "elementary", label: "Elementary", description: "일상 대화, 짧은 대화문", firstLesson: "Weekend Plans" },
  { id: "intermediate", label: "Intermediate", description: "업무·사회 주제, 의견 표현", firstLesson: "Workplace Communication" },
  { id: "upper", label: "Upper-Intermediate", description: "심화 토론, 뉘앙스 표현", firstLesson: "Business Negotiations" },
  { id: "advanced", label: "Advanced", description: "토론, 학술, 추상적 주제", firstLesson: "Debate: AI & Jobs" },
] as const;

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function generateTimeSlots() {
  const now = new Date();
  const slots: { dateNum: number; day: string; am: { time: string; available: boolean }[]; pm: { time: string; available: boolean }[] }[] = [];

  for (let d = 0; d < 7; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const dayLabel = d === 0 ? "오늘" : d === 1 ? "내일" : WEEKDAY_KO[date.getDay()];

    const am: { time: string; available: boolean }[] = [];
    const pm: { time: string; available: boolean }[] = [];

    for (let h = 0; h <= 23; h++) {
      for (const m of ["00", "30"]) {
        const slot = { time: `${String(h).padStart(2, "0")}:${m}`, available: Math.random() > 0.15 };
        // For today, slots before now+2hr are unavailable
        if (d === 0 && (h < now.getHours() + 3 || (h === now.getHours() + 2 && parseInt(m) <= now.getMinutes()))) {
          slot.available = false;
        }
        if (h < 12) am.push(slot);
        else pm.push(slot);
      }
    }

    slots.push({ dateNum: date.getDate(), day: dayLabel, am, pm });
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

// ── Screen type ──

type Screen =
  | "celebration"
  | "level-select"
  | "time-select"
  | "booking-confirmed"
  | "lesson-tab";

// ── App ──

export default function App() {
  const [screen, setScreen] = useState<Screen>("celebration");
  const [planType, setPlanType] = useState<PlanType>("count");
  const [selectedLevel, setSelectedLevel] = useState<string>("elementary");
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [incentiveClaimed, setIncentiveClaimed] = useState(false);
  const [hasTrialData] = useState(true);
  const recommendedLevel = hasTrialData ? "elementary" : null;

  const MOCK_PURCHASE = PLANS[planType];
  const incentiveText = planType === "count" ? "보너스 1회" : "3일 연장";

  function handleDismiss() {
    setShowExitConfirm(true);
  }

  function confirmExit() {
    setShowExitConfirm(false);
    setScreen("lesson-tab");
  }

  function handleBookingConfirmed() {
    setIncentiveClaimed(true);
    setScreen("booking-confirmed");
  }

  const selectedLevelData = LEVELS.find((l) => l.id === selectedLevel)!;

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-white relative">
      {/* ── Screen: Celebration ── */}
      {screen === "celebration" && (
        <div className="flex min-h-screen flex-col">
          <div className="flex flex-1 flex-col items-center justify-center px-5 pb-40">
            {/* Checkmark */}
            <div className="flex size-20 items-center justify-center rounded-full bg-[#F2FCEC]">
              <Check className="size-10 text-[#1C1C1C]" strokeWidth={3} />
            </div>

            <h1 className="mt-5 text-lg font-bold text-[#1C1C1C] leading-7">
              구매가 완료되었어요!
            </h1>

            {/* Purchase summary */}
            <div className="mt-5 w-full rounded-lg bg-[#F5F5F5] px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#A5A5A5]">수강권</span>
                <span className="text-sm font-medium text-[#1C1C1C]">
                  {MOCK_PURCHASE.planName}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-[#A5A5A5]">수업 횟수</span>
                <span className="text-sm font-medium text-[#1C1C1C]">
                  {MOCK_PURCHASE.totalClasses === "무제한" ? "무제한" : `${MOCK_PURCHASE.totalClasses}회`}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-[#A5A5A5]">유효기간</span>
                <span className="text-sm font-medium text-[#1C1C1C]">
                  {MOCK_PURCHASE.expireDate}
                </span>
              </div>
            </div>

            {/* Motivation + Incentive */}
            <div className="mt-3 w-full rounded-lg bg-[#1C1C1C] px-5 py-4">
              <p className="text-sm font-bold text-white leading-[22px]">
                지금이 시작하기 가장 좋은 순간이에요
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#B5FD4C] leading-[22px]">
                <Gift className="size-4 shrink-0" />
                {MOCK_PURCHASE.planType === "count"
                  ? "첫 수업 완료 시 보너스 1회 증정"
                  : "첫 수업 완료 시 3일 연장"}
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-white px-5 py-2">
            <PrimaryButton onClick={() => setScreen("level-select")}>
              첫 수업 예약하기
            </PrimaryButton>
            <button
              onClick={handleDismiss}
              className="mt-1 w-full py-3 text-sm font-medium text-[#A5A5A5]"
            >
              다음에 할게요
            </button>
          </div>
        </div>
      )}

      {/* ── Screen: Level Select ── */}
      {screen === "level-select" && (
        <div className="flex min-h-screen flex-col">
          {/* Top bar */}
          <div className="flex items-center px-5 py-3">
            <button onClick={() => setScreen("celebration")} className="p-1">
              <ChevronLeft className="size-6 text-[#1C1C1C]" />
            </button>
            <div className="flex-1" />
          </div>

          {/* Title */}
          <div className="px-5">
            <h2 className="text-lg font-bold text-[#1C1C1C] leading-7">
              레벨을 선택해 주세요.
            </h2>
            <p className="mt-1 text-sm text-[#A5A5A5] leading-[22px]">
              체험 수업 기반으로 추천해 드려요.
            </p>
          </div>

          {/* Level cards */}
          <div className="mt-5 flex-1 px-5 pb-24">
            {LEVELS.map((level) => {
              const isRecommended = level.id === recommendedLevel;
              const isSelected = level.id === selectedLevel;

              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`mt-2 flex w-full items-start gap-3 rounded-lg p-4 text-left transition-colors outline -outline-offset-1 ${
                    isSelected
                      ? "bg-[#F2FCEC] outline-[1.5px] outline-[#1C1C1C]"
                      : "bg-white outline-1 outline-[#E8E8E8]"
                  }`}
                >
                  {/* Radio */}
                  <div className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                    isSelected ? "border-[#1C1C1C] bg-[#1C1C1C]" : "border-[#D6D6D6]"
                  }`}>
                    {isSelected && <Check className="size-3 text-white" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-medium text-[#1C1C1C] leading-6">
                        {level.label}
                      </p>
                      {isRecommended && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1C1C1C] px-2.5 py-1 text-[11px] font-bold text-[#B5FD4C]">
                          <Sparkles className="size-3" />
                          추천
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-[#A5A5A5] leading-[22px]">
                      {level.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-white px-5 py-2">
            <PrimaryButton onClick={() => setScreen("time-select")}>
              다음 — 시간 선택
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ── Screen: Time Select ── */}
      {screen === "time-select" && (
        <div className="flex min-h-screen flex-col">
          {/* Top bar */}
          <div className="flex items-center px-5 py-3">
            <button onClick={() => setScreen("level-select")} className="p-1">
              <ChevronLeft className="size-6 text-gray-900" />
            </button>
            <div className="flex-1" />
          </div>

          {/* Title */}
          <div className="px-5">
            <h2 className="text-lg font-bold text-[#1C1C1C] leading-7">
              레슨 일정을 선택해주세요.
            </h2>
            <p className="mt-1 text-sm text-[#A5A5A5] leading-[22px]">
              레슨은 25분간 진행됩니다.
            </p>
          </div>

          {/* Date selector — 7 days horizontal */}
          <div className="mt-5 flex px-5">
            {TIME_SLOTS.map((slot, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedDay(i);
                  setSelectedTime(null);
                }}
                className={`flex w-16 flex-col items-center gap-1.5 rounded-lg px-4 py-3.5 transition-colors ${
                  selectedDay === i
                    ? "bg-[#F2FCEC] outline outline-[1.5px] outline-[#1C1C1C]"
                    : "bg-white"
                }`}
              >
                <span className={`text-sm font-medium leading-[22px] ${
                  selectedDay === i ? "text-[#1C1C1C]" : "text-[#A5A5A5]"
                }`}>
                  {slot.day}
                </span>
                <span className="text-base font-medium leading-6 text-[#1C1C1C]">
                  {slot.dateNum}
                </span>
              </button>
            ))}
          </div>

          {/* Time slots — scrollable */}
          <div className="mt-5 flex-1 overflow-y-auto px-5 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1C1C1C] leading-7">예약 가능 시간</h3>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-full bg-[#D6D6D6]" />
                <span className="text-sm font-medium text-[#A5A5A5]">예약 마감</span>
              </div>
            </div>

            {/* 오전 */}
            <div className="mt-5">
              <p className="text-sm text-[#A5A5A5] leading-[22px]">오전</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {TIME_SLOTS[selectedDay]?.am.map((slot, i) => (
                  <button
                    key={`am-${i}`}
                    onClick={() => slot.available && setSelectedTime(`am-${i}`)}
                    disabled={!slot.available}
                    className={`rounded-lg py-3.5 text-center text-base font-medium leading-6 transition-colors outline outline-1 -outline-offset-1 ${
                      !slot.available
                        ? "bg-[#F5F5F5] text-[#D6D6D6] outline-[#E8E8E8]"
                        : selectedTime === `am-${i}`
                          ? "bg-[#F2FCEC] text-[#1C1C1C] outline-[#1C1C1C] outline-[1.5px]"
                          : "bg-white text-[#1C1C1C] outline-[#E8E8E8]"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            {/* 오후 */}
            <div className="mt-5">
              <p className="text-sm text-[#A5A5A5] leading-[22px]">오후</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {TIME_SLOTS[selectedDay]?.pm.map((slot, i) => (
                  <button
                    key={`pm-${i}`}
                    onClick={() => slot.available && setSelectedTime(`pm-${i}`)}
                    disabled={!slot.available}
                    className={`rounded-lg py-3.5 text-center text-base font-medium leading-6 transition-colors outline outline-1 -outline-offset-1 ${
                      !slot.available
                        ? "bg-[#F5F5F5] text-[#D6D6D6] outline-[#E8E8E8]"
                        : selectedTime === `pm-${i}`
                          ? "bg-[#F2FCEC] text-[#1C1C1C] outline-[#1C1C1C] outline-[1.5px]"
                          : "bg-white text-[#1C1C1C] outline-[#E8E8E8]"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-white px-5 py-2">
            <PrimaryButton onClick={() => selectedTime && handleBookingConfirmed()} disabled={!selectedTime}>
              선택한 날짜에 예약
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ── Screen: Booking Confirmed ── */}
      {screen === "booking-confirmed" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-5 pb-24">
          {/* Hero */}
          <div className="flex size-20 items-center justify-center rounded-full bg-[#F2FCEC]">
            <Check className="size-10 text-[#1C1C1C]" strokeWidth={3} />
          </div>
          <h1 className="mt-5 text-lg font-bold text-[#1C1C1C] leading-7">예약 완료!</h1>
          <p className="mt-1 text-sm text-[#A5A5A5] leading-[22px]">수업 전에 알림을 보내드릴게요.</p>

          {/* Booking card */}
          <div className="mt-5 w-full rounded-lg px-5 py-4 outline outline-1 -outline-offset-1 outline-[#E8E8E8]">
            <p className="text-base font-medium text-[#1C1C1C] leading-6">
              {selectedLevelData.label} — {selectedLevelData.firstLesson}
            </p>
            <p className="mt-2 text-sm text-[#A5A5A5] leading-[22px]">
              {selectedTime && (() => {
                const [period, idx] = selectedTime.split("-");
                const slots = period === "am" ? TIME_SLOTS[selectedDay]?.am : TIME_SLOTS[selectedDay]?.pm;
                return slots?.[parseInt(idx)]?.time;
              })()}{" "}
              · {TIME_SLOTS[selectedDay]?.day}
            </p>
          </div>

          {/* Bonus pending */}
          {incentiveClaimed && (
            <div className="mt-3 w-full rounded-lg bg-[#1C1C1C] px-5 py-4">
              <div className="flex items-center gap-3">
                <Gift className="size-5 shrink-0 text-[#B5FD4C]" />
                <p className="text-sm font-medium text-white leading-[22px]">
                  {MOCK_PURCHASE.planType === "count"
                    ? "수업 완료 시 보너스 1회 지급"
                    : "수업 완료 시 3일 연장"}
                </p>
              </div>
              <p className="mt-1.5 pl-8 text-xs text-[#A5A5A5] leading-[18px]">
                시간 변경 가능 · 취소 시 소멸
              </p>
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-white px-5 py-2">
            <PrimaryButton onClick={() => setScreen("lesson-tab")}>
              내 수업 보기
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ── Screen: Lesson Tab (dismiss destination) ── */}
      {screen === "lesson-tab" && (
        <div className="flex min-h-screen flex-col">
          <div className="px-5 pt-14 pb-3">
            <h2 className="text-lg font-bold text-[#1C1C1C] leading-7">내 수업</h2>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-5 pb-20">
            <div className="flex size-16 items-center justify-center rounded-lg bg-[#F5F5F5]">
              <span className="text-2xl">📚</span>
            </div>
            <p className="mt-4 text-base font-medium text-[#1C1C1C] leading-6">
              {incentiveClaimed ? "수업이 예약되었어요!" : "아직 예약된 수업이 없어요"}
            </p>
            <p className="mt-1 text-sm text-[#A5A5A5] leading-[22px]">
              {incentiveClaimed
                ? "예정된 수업을 여기서 확인하세요."
                : "코스를 둘러보고 첫 수업을 예약해 보세요."}
            </p>
          </div>
          {/* Mock GNB */}
          <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-[480px] border-t border-[#E8E8E8] bg-white py-2">
            {["홈", "수업", "예약", "AI학습", "마이포도"].map((tab, i) => (
              <div
                key={tab}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div className={`size-5 rounded ${i === 1 ? "bg-[#1C1C1C]" : "bg-[#D6D6D6]"}`} />
                <span className={`text-[10px] leading-3 ${i === 1 ? "font-bold text-[#1C1C1C]" : "text-[#A5A5A5]"}`}>{tab}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Exit Confirmation Modal ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="mx-auto w-full max-w-[480px] rounded-t-2xl bg-white px-5 pb-8 pt-6">
            <h3 className="text-lg font-bold text-[#1C1C1C] leading-7">
              정말 나가시겠어요?
            </h3>
            <p className="mt-2 text-sm text-[#A5A5A5] leading-[22px]">
              {MOCK_PURCHASE.planType === "count"
                ? "지금 나가면 보너스 1회 혜택이 사라져요."
                : "지금 나가면 3일 연장 혜택이 사라져요."}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <PrimaryButton onClick={() => setShowExitConfirm(false)}>
                예약하기
              </PrimaryButton>
              <button
                onClick={confirmExit}
                className="w-full rounded-lg bg-[#F5F5F5] py-3.5 text-base font-medium leading-6 text-[#A5A5A5]"
              >
                나중에 할게요
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation guide (dev only) ── */}
      <div className="fixed right-3 top-3 z-50 rounded-xl bg-gray-900/80 px-3 py-2 text-[10px] text-white/70">
        <div className="flex items-center gap-1">
          <span>Screen:</span>
          <span className="font-bold text-podo-green">{screen}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {(["celebration", "level-select", "time-select", "booking-confirmed", "lesson-tab"] as Screen[]).map((s) => (
            <button
              key={s}
              onClick={() => setScreen(s)}
              className={`rounded px-1.5 py-0.5 text-[9px] ${screen === s ? "bg-podo-green text-black" : "bg-white/10"}`}
            >
              {s.replace("celebration", "1.cel").replace("level-select", "2.lvl").replace("time-select", "3.time").replace("booking-confirmed", "4.done").replace("lesson-tab", "5.tab")}
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex items-center gap-1 border-t border-white/10 pt-1.5">
          <span>Plan:</span>
          {(["count", "unlimited"] as PlanType[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPlanType(p); setScreen("celebration"); }}
              className={`rounded px-1.5 py-0.5 text-[9px] ${planType === p ? "bg-podo-green text-black" : "bg-white/10"}`}
            >
              {p === "count" ? "회차권" : "무제한"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
