import { useState } from "react";
import type { ScenarioKey } from "../types";
import { scenarioLabels } from "../mock-data";

interface ScenarioControlProps {
  current: ScenarioKey;
  onChange: (scenario: ScenarioKey) => void;
}

const scenarios: ScenarioKey[] = ["normal", "studentNoShow", "tutorNoShow", "allDone"];

/**
 * PO 리뷰용 시나리오 전환 컨트롤 패널.
 * 좌측 하단 플로팅 토글로 열고 닫을 수 있음.
 */
export default function ScenarioControl({ current, onChange }: ScenarioControlProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 left-3 z-[60] max-w-[480px]">
      {/* 패널 (열림 상태) */}
      {open && (
        <div className="mb-2 bg-[#1c1c1c] text-white rounded-2xl p-4 shadow-xl min-w-[200px] animate-[fadeIn_0.15s_ease-out]">
          <p className="text-[11px] font-semibold text-[#a5a5a5] uppercase tracking-wide mb-3">
            시나리오 전환
          </p>
          <div className="space-y-1.5">
            {scenarios.map((key) => (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  current === key
                    ? "bg-[#B5FD4C] text-[#1c1c1c]"
                    : "hover:bg-[#2b2b2b] text-[#d6d6d6]"
                }`}
              >
                {current === key && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1c1c1c] mr-2" />
                )}
                {scenarioLabels[key]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 토글 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-[#1c1c1c] text-white shadow-lg flex items-center justify-center hover:bg-[#2b2b2b] transition-colors"
        title="시나리오 전환"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 5L13 13M13 5L5 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 5H15M3 9H15M3 13H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
