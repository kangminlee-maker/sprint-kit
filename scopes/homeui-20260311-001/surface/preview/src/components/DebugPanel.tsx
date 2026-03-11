import { useState } from "react";
import type { TrialState } from "../types";
import { TRIAL_STATE_LABELS, toHomeVariant } from "../types";

interface DebugPanelProps {
  states: TrialState[];
  current: TrialState;
  onChange: (state: TrialState) => void;
}

/** DebugPanel — 시나리오 전환용 플로팅 패널 (z-[300]) */
export function DebugPanel({ states, current, onChange }: DebugPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 토글 버튼 */}
      <button
        className="fixed cursor-pointer border-none flex items-center justify-center rounded-full"
        style={{
          bottom: "80px",
          right: "max(calc((100% - 480px) / 2 + 16px), 16px)",
          width: "48px",
          height: "48px",
          backgroundColor: "var(--gray-900)",
          color: "white",
          fontSize: "20px",
          zIndex: 300,
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
        onClick={() => setOpen(!open)}
      >
        {open ? "✕" : "🔧"}
      </button>

      {/* 패널 */}
      {open && (
        <div
          className="fixed rounded-2xl"
          style={{
            bottom: "140px",
            right: "max(calc((100% - 480px) / 2 + 16px), 16px)",
            width: "240px",
            backgroundColor: "var(--gray-900)",
            padding: "16px",
            zIndex: 300,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          }}
        >
          <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "0 0 8px", lineHeight: "18px" }}>
            시나리오 전환
          </p>
          <div className="flex flex-col gap-1">
            {states.map((s) => {
              const isActive = s === current;
              const variant = toHomeVariant(s);
              return (
                <button
                  key={s}
                  className="flex items-center justify-between cursor-pointer border-none rounded-lg"
                  style={{
                    padding: "8px 12px",
                    backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                    color: "white",
                    fontSize: "13px",
                    lineHeight: "18px",
                    textAlign: "left",
                  }}
                  onClick={() => onChange(s)}
                >
                  <span>
                    {isActive && "● "}
                    {TRIAL_STATE_LABELS[s]}
                  </span>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
                    {variant}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
