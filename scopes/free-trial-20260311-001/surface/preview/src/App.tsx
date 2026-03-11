import { useState } from "react";
import type { TrialState } from "./types";
import { scenarios } from "./mock-data";
import GNB from "./components/GNB";
import ScenarioControl from "./components/ScenarioControl";
import TrialIdle from "./screens/TrialIdle";
import TrialBooked from "./screens/TrialBooked";
import TrialProgress from "./screens/TrialProgress";
import TrialComplete from "./screens/TrialComplete";
import StudentNoshow from "./screens/StudentNoshow";
import TutorNoshow from "./screens/TutorNoshow";
import TrialExhausted from "./screens/TrialExhausted";

export default function App() {
  const [state, setState] = useState<TrialState>("trial_idle");
  const data = scenarios[state];

  return (
    <div className="pb-[62px]">
      <ScenarioControl current={state} onChange={setState} />

      {state === "trial_idle" && <TrialIdle />}
      {state === "trial_booked" && <TrialBooked data={data} />}
      {(state === "trial_progress_1" || state === "trial_progress_2") && (
        <TrialProgress data={data} />
      )}
      {state === "trial_complete" && <TrialComplete />}
      {state === "student_noshow" && <StudentNoshow data={data} />}
      {state === "tutor_noshow" && <TutorNoshow data={data} />}
      {state === "trial_exhausted" && <TrialExhausted />}

      <GNB />
    </div>
  );
}
