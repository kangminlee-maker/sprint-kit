import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonGhostProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: "lg" | "sm";
  fullWidth?: boolean;
}

/** ButtonGhost — 보조 행동 버튼 (흰색 배경 + gray-200 테두리) */
export function ButtonGhost({
  children,
  size = "lg",
  fullWidth = false,
  ...props
}: ButtonGhostProps) {
  const h = size === "lg" ? "52px" : "44px";

  return (
    <button
      className="cursor-pointer bg-white flex items-center justify-center rounded-2xl"
      style={{
        height: h,
        width: fullWidth ? "100%" : "auto",
        padding: "0 20px",
        border: "1.5px solid var(--gray-200)",
        fontSize: "16px",
        fontWeight: 700,
        lineHeight: "24px",
        letterSpacing: "-0.48px",
        color: "var(--gray-900)",
      }}
      {...props}
    >
      {children}
    </button>
  );
}
