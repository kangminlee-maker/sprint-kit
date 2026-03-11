import { useState } from "react";
import { TopNav } from "./components/TopNav";
import { GNB } from "./components/GNB";
import { GreetingCard } from "./components/GreetingCard";
import { TrialProgressBar } from "./components/TrialProgressBar";
import { ContentSection } from "./components/ContentSection";
import { DebugPanel } from "./components/DebugPanel";
import type { TrialState } from "./types";

const TRIAL_STATES: TrialState[] = [
  "not_applied",
  "trial_waiting",
  "booking_reserved",
  "lesson_imminent",
  "trial_completed",
  "tutor_noshow",
  "student_noshow",
  "trial_exhausted",
];

export default function App() {
  const [trialState, setTrialState] = useState<TrialState>("not_applied");
  const [userName] = useState("민지");

  return (
    <div className="app-root">
      {/* Top Navigation — h-[52px] */}
      <TopNav />

      {/* Main content — pt for topbar, pb for gnb */}
      <main
        className="pt-[52px] pb-[62px]"
        style={{ minHeight: "100dvh" }}
      >
        {/* Progress Bar — 체험 진행 상태 */}
        <TrialProgressBar state={trialState} />

        {/* Greeting Card — 상태별 전환 */}
        <section className="px-5 py-2">
          <GreetingCard state={trialState} userName={userName} />
        </section>

        {/* Content Section — 상태별 본문 카드 */}
        <section className="px-5 py-2">
          <ContentSection state={trialState} />
        </section>
      </main>

      {/* GNB — fixed bottom, h-[62px], z-[100] */}
      <GNB />

      {/* Debug Panel — z-[300], 시나리오 전환용 */}
      <DebugPanel
        states={TRIAL_STATES}
        current={trialState}
        onChange={setTrialState}
      />
    </div>
  );
}
