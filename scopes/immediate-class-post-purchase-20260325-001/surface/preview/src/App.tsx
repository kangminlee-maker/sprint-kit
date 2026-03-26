import { useState } from "react";
import { Check, ChevronLeft, Gift, Clock, X, Sparkles } from "lucide-react";

// ── Mock Data ──

type PlanType = "count" | "unlimited";

const MOCK_PURCHASE = {
  planName: "영어 회화 6개월",
  planType: "count" as PlanType,
  totalClasses: 48,
  expireDate: "2026-09-25",
  price: "299,000원",
};

const LEVELS = [
  { id: "beginner", label: "Beginner", description: "Basic greetings, simple sentences", firstLesson: "Self-Introduction" },
  { id: "elementary", label: "Elementary", description: "Daily conversations, short dialogues", firstLesson: "Weekend Plans" },
  { id: "intermediate", label: "Intermediate", description: "Work & social topics, opinions", firstLesson: "Workplace Communication" },
  { id: "upper", label: "Upper-Intermediate", description: "Complex discussions, nuanced views", firstLesson: "Business Negotiations" },
  { id: "advanced", label: "Advanced", description: "Debate, academic, abstract topics", firstLesson: "Debate: AI & Jobs" },
] as const;

function generateTimeSlots() {
  const now = new Date();
  const slots: { date: string; day: string; times: { time: string; tutor: string; available: boolean }[] }[] = [];

  for (let d = 0; d < 3; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const dayLabel = d === 0 ? "Today" : d === 1 ? "Tomorrow" : date.toLocaleDateString("en", { weekday: "short" });
    const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;

    const times: { time: string; tutor: string; available: boolean }[] = [];
    const startHour = d === 0 ? Math.max(now.getHours() + 3, 9) : 9;

    for (let h = startHour; h <= 22; h++) {
      for (const m of ["00", "30"]) {
        if (times.length >= 6) break;
        const tutors = ["Sarah K.", "Mike L.", "Jenny P.", "David C.", "Emma W."];
        times.push({
          time: `${h}:${m}`,
          tutor: tutors[Math.floor(Math.random() * tutors.length)],
          available: Math.random() > 0.2,
        });
      }
    }

    slots.push({ date: dateLabel, day: dayLabel, times });
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
  const [selectedLevel, setSelectedLevel] = useState<string>("elementary"); // pre-selected from trial recommendation
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [incentiveClaimed, setIncentiveClaimed] = useState(false);
  const [hasTrialData] = useState(true); // simulate trial user with level data
  const recommendedLevel = hasTrialData ? "elementary" : null; // simulated recommendation

  const incentiveText =
    MOCK_PURCHASE.planType === "count" ? "+1 bonus class" : "+3 days free";

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
          <div className="flex flex-1 flex-col items-center justify-center px-5 pb-32">
            {/* Checkmark */}
            <div className="flex size-[120px] items-center justify-center rounded-full bg-podo-green/20">
              <div className="flex size-[80px] items-center justify-center rounded-full bg-podo-green">
                <Check className="size-10 text-podo-black" strokeWidth={3} />
              </div>
            </div>

            <h1 className="mt-6 text-2xl font-bold text-gray-900">
              Purchase Complete!
            </h1>

            {/* Purchase summary */}
            <div className="mt-5 w-full rounded-2xl bg-gray-50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Plan</span>
                <span className="text-sm font-semibold text-gray-900">
                  {MOCK_PURCHASE.planName}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Classes</span>
                <span className="text-sm font-semibold text-gray-900">
                  {MOCK_PURCHASE.totalClasses} classes
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Valid until</span>
                <span className="text-sm font-semibold text-gray-900">
                  {MOCK_PURCHASE.expireDate}
                </span>
              </div>
            </div>

            {/* Incentive banner */}
            <div className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-podo-black px-5 py-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-podo-green">
                <Gift className="size-5 text-podo-black" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  Book now and get {incentiveText} when you complete the class!
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  This offer is only available right now. If you leave, it's gone forever. Rescheduling is fine, but cancelling forfeits the bonus.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-white px-5 pb-8 pt-3">
            <button
              onClick={() => setScreen("level-select")}
              className="w-full rounded-2xl bg-podo-green py-4 text-base font-bold text-podo-black active:bg-podo-green-dark transition-colors"
            >
              Book Your First Class
            </button>
            <button
              onClick={handleDismiss}
              className="mt-2 w-full py-3 text-sm text-gray-400"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* ── Screen: Level Select ── */}
      {screen === "level-select" && (
        <div className="flex min-h-screen flex-col">
          {/* Top bar */}
          <div className="flex items-center px-4 py-3">
            <button onClick={() => setScreen("celebration")} className="p-1">
              <ChevronLeft className="size-6 text-gray-900" />
            </button>
            <h2 className="flex-1 text-center text-base font-bold text-gray-900">
              Choose Your Level
            </h2>
            <button onClick={handleDismiss} className="p-1">
              <X className="size-5 text-gray-400" />
            </button>
          </div>

          {/* Incentive reminder */}
          <div className="mx-5 flex items-center gap-2 rounded-xl bg-podo-green/10 px-4 py-2.5">
            <Gift className="size-4 shrink-0 text-podo-green-dark" />
            <span className="text-xs font-medium text-gray-700">
              Book now → complete class → {incentiveText} (one-time offer)
            </span>
          </div>

          {/* Level cards */}
          <div className="mt-4 flex-1 px-5 pb-24">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">
              Select your level
            </p>

            {LEVELS.map((level) => {
              const isRecommended = level.id === recommendedLevel;
              const isSelected = level.id === selectedLevel;

              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`mt-2 flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${
                    isSelected
                      ? "border-podo-green bg-podo-green/5"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  {/* Radio indicator */}
                  <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-podo-green bg-podo-green" : "border-gray-300"
                  }`}>
                    {isSelected && <Check className="size-4 text-podo-black" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {level.label}
                      </p>
                      {isRecommended && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-podo-green/20 px-2.5 py-0.5 text-[10px] font-bold text-podo-black">
                          <Sparkles className="size-3" />
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {level.description}
                    </p>
                    <p className="mt-1.5 text-xs text-gray-500">
                      First lesson: <span className="font-medium text-gray-700">{level.firstLesson}</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-white px-5 pb-8 pt-3">
            <button
              onClick={() => setScreen("time-select")}
              className="w-full rounded-2xl bg-podo-green py-4 text-base font-bold text-podo-black active:bg-podo-green-dark transition-colors"
            >
              Next — Choose Time
            </button>
          </div>
        </div>
      )}

      {/* ── Screen: Time Select ── */}
      {screen === "time-select" && (
        <div className="flex min-h-screen flex-col">
          {/* Top bar */}
          <div className="flex items-center px-4 py-3">
            <button onClick={() => setScreen("level-select")} className="p-1">
              <ChevronLeft className="size-6 text-gray-900" />
            </button>
            <h2 className="flex-1 text-center text-base font-bold text-gray-900">
              Choose a Time
            </h2>
            <button onClick={handleDismiss} className="p-1">
              <X className="size-5 text-gray-400" />
            </button>
          </div>

          {/* Selected level + lesson summary */}
          <div className="mx-5 rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-400">Your first lesson</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {selectedLevelData.label} — {selectedLevelData.firstLesson}
            </p>
          </div>

          {/* Min 2hr notice */}
          <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5">
            <Clock className="size-4 shrink-0 text-blue-500" />
            <span className="text-xs text-blue-700">
              Classes start at least 2 hours from now
            </span>
          </div>

          {/* Day selector */}
          <div className="mt-4 flex gap-2 px-5">
            {TIME_SLOTS.map((slot, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedDay(i);
                  setSelectedTime(null);
                }}
                className={`flex-1 rounded-2xl py-3 text-center transition-colors ${
                  selectedDay === i
                    ? "bg-podo-black text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <p className="text-xs font-medium">{slot.day}</p>
                <p className="mt-0.5 text-sm font-bold">{slot.date}</p>
              </button>
            ))}
          </div>

          {/* Time slots */}
          <div className="mt-4 flex-1 px-5 pb-24">
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS[selectedDay]?.times.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => slot.available && setSelectedTime(`${selectedDay}-${i}`)}
                  disabled={!slot.available}
                  className={`rounded-2xl border-2 p-4 text-left transition-colors ${
                    !slot.available
                      ? "border-gray-100 bg-gray-50 opacity-40"
                      : selectedTime === `${selectedDay}-${i}`
                        ? "border-podo-green bg-podo-green/5"
                        : "border-gray-100 bg-white"
                  }`}
                >
                  <p className="text-lg font-bold text-gray-900">
                    {slot.time}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{slot.tutor}</p>
                  {!slot.available && (
                    <p className="mt-1 text-xs text-red-400">Full</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-white px-5 pb-8 pt-3">
            <button
              onClick={() => selectedTime && handleBookingConfirmed()}
              disabled={!selectedTime}
              className={`w-full rounded-2xl py-4 text-base font-bold transition-colors ${
                selectedTime
                  ? "bg-podo-green text-podo-black active:bg-podo-green-dark"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              Confirm Booking
            </button>
          </div>
        </div>
      )}

      {/* ── Screen: Booking Confirmed ── */}
      {screen === "booking-confirmed" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-5 pb-24">
          <div className="flex size-[120px] items-center justify-center rounded-full bg-podo-green/20">
            <div className="flex size-[80px] items-center justify-center rounded-full bg-podo-green">
              <Check className="size-10 text-podo-black" strokeWidth={3} />
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Class Booked!
          </h1>
          <p className="mt-2 text-center text-base text-gray-500">
            Your first class is scheduled. We'll remind you before it starts.
          </p>

          {/* Bonus pending notice */}
          {incentiveClaimed && (
            <div className="mt-5 w-full rounded-2xl bg-podo-green/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <Gift className="size-5 shrink-0 text-podo-green-dark" />
                <span className="text-sm font-semibold text-gray-900">
                  Complete this class to get {incentiveText}!
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500 pl-8">
                Rescheduling is okay — your bonus is preserved. But if you cancel the class, the bonus is forfeited.
              </p>
            </div>
          )}

          {/* Booking summary */}
          <div className="mt-5 w-full rounded-2xl bg-gray-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Lesson</span>
              <span className="text-sm font-semibold text-gray-900">
                {selectedLevelData.label} — {selectedLevelData.firstLesson}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Time</span>
              <span className="text-sm font-semibold text-gray-900">
                {selectedTime && TIME_SLOTS[selectedDay]?.times[parseInt(selectedTime.split("-")[1])]?.time}{" "}
                ({TIME_SLOTS[selectedDay]?.day})
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Tutor</span>
              <span className="text-sm font-semibold text-gray-900">
                {selectedTime && TIME_SLOTS[selectedDay]?.times[parseInt(selectedTime.split("-")[1])]?.tutor}
              </span>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-white px-5 pb-8 pt-3">
            <button
              onClick={() => setScreen("lesson-tab")}
              className="w-full rounded-2xl bg-podo-green py-4 text-base font-bold text-podo-black active:bg-podo-green-dark transition-colors"
            >
              Go to My Lessons
            </button>
          </div>
        </div>
      )}

      {/* ── Screen: Lesson Tab (dismiss destination) ── */}
      {screen === "lesson-tab" && (
        <div className="flex min-h-screen flex-col">
          <div className="flex items-center px-5 py-4">
            <h2 className="text-xl font-bold text-gray-900">My Lessons</h2>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-5">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gray-100">
              <span className="text-2xl text-gray-300">📚</span>
            </div>
            <p className="mt-4 text-base font-semibold text-gray-900">
              {incentiveClaimed ? "Your class is booked!" : "No classes booked yet"}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {incentiveClaimed
                ? "Check your upcoming lessons here."
                : "Browse courses and book your first class to get started."}
            </p>
          </div>
          {/* Mock GNB */}
          <div className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-[480px] border-t border-gray-100 bg-white">
            {["Home", "Lessons", "Schedule", "AI Study", "My PODO"].map((tab, i) => (
              <div
                key={tab}
                className={`flex flex-1 flex-col items-center py-2 ${i === 1 ? "text-podo-black" : "text-gray-300"}`}
              >
                <div className={`size-5 rounded-md ${i === 1 ? "bg-podo-green" : "bg-gray-200"}`} />
                <span className={`mt-1 text-[10px] ${i === 1 ? "font-bold" : ""}`}>{tab}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Exit Confirmation Modal ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="mx-auto w-full max-w-[480px] rounded-t-3xl bg-white px-5 pb-8 pt-6">
            <h3 className="text-lg font-bold text-gray-900">
              Are you sure?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              If you leave now, the <strong>{incentiveText}</strong> offer will be gone forever.
              You won't be able to come back to this screen. Book now, complete the class, and the bonus is yours. You can reschedule anytime — just don't cancel.
            </p>
            <div className="mt-6 space-y-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full rounded-2xl bg-podo-green py-4 text-base font-bold text-podo-black active:bg-podo-green-dark transition-colors"
              >
                Stay and Book
              </button>
              <button
                onClick={confirmExit}
                className="w-full rounded-2xl bg-gray-100 py-4 text-base font-medium text-gray-500"
              >
                Leave — I'll book later
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
      </div>
    </div>
  );
}
