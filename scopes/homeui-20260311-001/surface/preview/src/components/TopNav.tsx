/** TopNav — 상단 네비게이션 바 (h-52px, fixed top) */
export function TopNav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between bg-white"
      style={{
        height: "52px",
        maxWidth: "480px",
        margin: "0 auto",
        padding: "0 20px",
      }}
    >
      {/* Logo */}
      <span
        className="font-bold tracking-[-0.36px]"
        style={{ fontSize: "18px", lineHeight: "26px", color: "var(--gray-900)" }}
      >
        PODO
      </span>

      {/* 수강권 구매 버튼 */}
      <button
        className="flex items-center gap-1 rounded-full cursor-pointer"
        style={{
          padding: "6px 14px",
          fontSize: "14px",
          fontWeight: 600,
          lineHeight: "20px",
          color: "var(--gray-900)",
          background: "var(--podo-green)",
          border: "1.5px solid var(--gray-900)",
          letterSpacing: "-0.28px",
        }}
        onClick={() => alert("→ /subscribes/tickets")}
      >
        수강신청
      </button>
    </nav>
  );
}
