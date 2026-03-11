import { useState } from "react";
import type { TrialState } from "../types";
import { scenarios, scenarioOrder } from "../mock-data";

interface Props {
  current: TrialState;
  onChange: (state: TrialState) => void;
}

export default function ScenarioControl({ current, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const idx = scenarioOrder.indexOf(current);

  if (!expanded) {
    return (
      <div className="fixed top-2 right-2 z-[300] flex items-center gap-1">
        <button
          className="rounded-full bg-gray-900 px-3 py-1.5 text-xs font-bold text-white"
          onClick={() => onChange(scenarioOrder[(idx + 1) % scenarioOrder.length])}
        >
          {scenarios[current].label}
        </button>
        <button
          className="rounded-full bg-gray-900 px-2 py-1.5 text-xs text-white"
          onClick={() => setExpanded(true)}
        >
          ⋯
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-2 right-2 z-[300] w-48 rounded-xl bg-gray-900 p-2 shadow-lg">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-gray-400">시나리오</span>
        <button
          className="text-xs text-gray-400"
          onClick={() => setExpanded(false)}
        >
          ✕
        </button>
      </div>
      {scenarioOrder.map((state) => (
        <button
          key={state}
          className={`block w-full rounded-lg px-2 py-1.5 text-left text-xs ${
            state === current
              ? "bg-white/10 font-bold text-white"
              : "text-gray-400"
          }`}
          onClick={() => {
            onChange(state);
            setExpanded(false);
          }}
        >
          {scenarios[state].label}
        </button>
      ))}
    </div>
  );
}
