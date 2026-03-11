import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonPrimaryProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "green" | "blue";
  fullWidth?: boolean;
}

/**
 * ButtonPrimary — 3레이어 3D 프레스 구조
 * 외부 button(52px) → 그림자 div → 표면 div(48px)
 * podo-green 배경, border-[1.5px] border-gray-900
 */
export function ButtonPrimary({
  children,
  variant = "green",
  fullWidth = true,
  disabled,
  ...props
}: ButtonPrimaryProps) {
  const bgColor = variant === "green" ? "var(--podo-green)" : "var(--blue-500)";
  const shadowColor = variant === "green" ? "var(--green-500)" : "#4A6BD4";
  const textColor = variant === "green" ? "var(--gray-900)" : "white";

  return (
    <button
      className="relative border-none bg-transparent p-0 cursor-pointer"
      style={{
        width: fullWidth ? "100%" : "auto",
        height: "52px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
      disabled={disabled}
      {...props}
    >
      {/* Shadow layer */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          backgroundColor: shadowColor,
          border: "1.5px solid var(--gray-900)",
        }}
      />
      {/* Surface layer */}
      <div
        className="relative flex items-center justify-center rounded-2xl"
        style={{
          height: "48px",
          backgroundColor: bgColor,
          border: "1.5px solid var(--gray-900)",
          fontSize: "16px",
          fontWeight: 700,
          lineHeight: "24px",
          letterSpacing: "-0.48px",
          color: textColor,
          transition: "transform 100ms",
        }}
      >
        {children}
      </div>
    </button>
  );
}
