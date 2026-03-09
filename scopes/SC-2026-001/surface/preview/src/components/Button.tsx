import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "secondary";
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * PODO 디자인 시스템 버튼.
 * - primary: 라임 그린 배경 + 3D 그림자 효과
 * - ghost: 투명 배경 + 테두리
 * - secondary: 회색 배경
 */
export default function Button({
  variant = "primary",
  fullWidth = false,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold text-[15px] transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";

  const widthCls = fullWidth ? "w-full" : "";

  const variants: Record<string, string> = {
    primary: [
      "text-[#1c1c1c] py-3.5 px-6",
      "border-[1.5px] border-[#1c1c1c]",
      "hover:translate-y-[2px] hover:shadow-none",
    ].join(" "),
    ghost: [
      "bg-white text-[#1c1c1c] py-3 px-5",
      "border-[1.5px] border-[#d6d6d6]",
      "hover:bg-[#f5f5f5]",
    ].join(" "),
    secondary: [
      "bg-[#e8e8e8] text-[#444444] py-3 px-5",
      "hover:bg-[#d6d6d6]",
    ].join(" "),
  };

  // 3D shadow only for primary
  const style3D =
    variant === "primary"
      ? {
          backgroundColor: "#B5FD4C",
          boxShadow: "0 4px 0 0 #1c1c1c",
        }
      : undefined;

  return (
    <button
      className={`${base} ${widthCls} ${variants[variant]} ${className}`}
      style={style3D}
      {...rest}
    >
      {children}
    </button>
  );
}
