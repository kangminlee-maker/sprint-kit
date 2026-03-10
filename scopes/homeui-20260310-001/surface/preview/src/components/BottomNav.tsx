/** GNB 4탭 v2 — 60px, 홈/레슨/예약/마이포도 */
export default function BottomNav() {
  const tabs: { label: string; icon: React.ReactNode; active: boolean }[] = [
    {
      label: "홈",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      active: true,
    },
    {
      label: "레슨",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      active: false,
    },
    {
      label: "예약",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      active: false,
    },
    {
      label: "마이포도",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      active: false,
    },
  ];

  return (
    <nav style={{
      position: "sticky",
      bottom: 0,
      height: 60,
      background: "var(--white)",
      borderTop: "1px solid var(--gray-200)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      zIndex: 10,
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.label}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            color: tab.active ? "var(--gray-900)" : "var(--gray-400)",
          }}
        >
          {tab.icon}
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: -0.24,
          }}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
