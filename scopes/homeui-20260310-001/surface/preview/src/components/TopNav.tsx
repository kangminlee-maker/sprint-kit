/** 홈 상단 네비 v2 — pill 버튼 [수강신청] [채팅상담] + 알림 도트 */
export default function TopNav() {
  return (
    <nav style={{
      display: "flex",
      position: "relative",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 20px",
    }}>
      {/* Left spacer */}
      <div style={{ width: 24 }} />

      {/* Center: pill buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => alert("수강신청 (미구현)")}
          style={{
            height: 32,
            padding: "0 16px",
            borderRadius: 9999,
            background: "var(--gray-900)",
            color: "var(--white)",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            letterSpacing: -0.26,
          }}
        >
          수강신청
        </button>
        <button
          onClick={() => alert("채팅상담 (미구현)")}
          style={{
            height: 32,
            padding: "0 16px",
            borderRadius: 9999,
            background: "var(--gray-100)",
            color: "var(--gray-900)",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            letterSpacing: -0.26,
          }}
        >
          채팅상담
        </button>
      </div>

      {/* Right: notification dot */}
      <button
        onClick={() => alert("알림 (미구현)")}
        style={{
          width: 24,
          height: 24,
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Bell icon placeholder */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-900)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {/* Red dot */}
        <div style={{
          position: "absolute",
          top: 2,
          right: 2,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--red-500)",
        }} />
      </button>
    </nav>
  );
}
