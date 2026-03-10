import { useState } from "react";
import type { HomeState } from "./types";
import { scenarios } from "./mock-data";

import TopNav from "./components/TopNav";
import BottomNav from "./components/BottomNav";
import ScenarioControl from "./components/ScenarioControl";

import TrialIdle from "./components/states/TrialIdle";
import TrialBooked from "./components/states/TrialBooked";
import LessonImminent from "./components/states/LessonImminent";
import TrialCompleted from "./components/states/TrialCompleted";
import StudentNoshow from "./components/states/StudentNoshow";
import TutorNoshow from "./components/states/TutorNoshow";
import TrialExhausted from "./components/states/TrialExhausted";
import Cancelled from "./components/states/Cancelled";

export default function App() {
  const [currentState, setCurrentState] = useState<HomeState>("TRIAL_IDLE");
  const data = scenarios[currentState].data;

  const renderState = () => {
    switch (currentState) {
      case "TRIAL_IDLE":
        return <TrialIdle data={data} />;
      case "TRIAL_BOOKED":
        return <TrialBooked data={data} />;
      case "LESSON_IMMINENT":
        return <LessonImminent data={data} />;
      case "TRIAL_COMPLETED":
        return <TrialCompleted />;
      case "STUDENT_NOSHOW":
        return <StudentNoshow data={data} />;
      case "TUTOR_NOSHOW":
        return <TutorNoshow data={data} />;
      case "TRIAL_EXHAUSTED":
        return <TrialExhausted />;
      case "CANCELLED":
        return <Cancelled data={data} />;
    }
  };

  return (
    <>
      <TopNav />

      <main>
        {renderState()}
      </main>

      <BottomNav />
      <ScenarioControl current={currentState} onChange={setCurrentState} />
    </>
  );
}
