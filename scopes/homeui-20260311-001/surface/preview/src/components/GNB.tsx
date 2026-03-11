import { useState } from "react";

const TABS = [
  { label: "홈", icon: "🏠", active: true },
  { label: "레슨", icon: "📖", active: false },
  { label: "예약", icon: "📅", active: false },
  { label: "AI 학습", icon: "🤖", active: false },
  { label: "마이포도", icon: "👤", active: false },
] as const;

/** GNB — 하단 고정 탭 바 (h-62px, fixed bottom, z-100) */
export function GNB() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around bg-white"
      style={{
        height: "62px",
        maxWidth: "480px",
        margin: "0 auto",
        borderTop: "1px solid var(--gray-200)",
      }}
    >
      {TABS.map((tab, i) => (
        <button
          key={tab.label}
          className="flex flex-col items-center justify-center gap-0.5 cursor-pointer bg-transparent border-none"
          style={{
            flex: 1,
            fontSize: "9px",
            fontWeight: 600,
            lineHeight: "14px",
            letterSpacing: "-0.27px",
            color: activeTab === i ? "var(--gray-900)" : "var(--gray-300)",
          }}
          onClick={() => setActiveTab(i)}
        >
          <span style={{ fontSize: "20px" }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
