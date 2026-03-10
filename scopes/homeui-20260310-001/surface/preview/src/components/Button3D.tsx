import { useState } from "react";

type Variant = "green" | "blue" | "ghost" | "warning";
type Size = "xLarge" | "lg" | "sm";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

/**
 * 3D press button v2
 * shadow: CSS box-shadow (not padding-bottom trick)
 * hover: translateY(1px), shadow 3px
 * active: translateY(4px), shadow none
 * border-radius: 5px
 */

const variantStyles: Record<Variant, {
  surface: string; hover: string; shadow: string;
  text: string; borderColor: string;
}> = {
  green: {
    surface: "var(--podo-green)",
    hover: "var(--green-300)",
    shadow: "var(--gray-900)",
    text: "var(--gray-900)",
    borderColor: "var(--gray-900)",
  },
  blue: {
    surface: "var(--blue-500)",
    hover: "var(--blue-700)",
    shadow: "var(--gray-900)",
    text: "var(--white)",
    borderColor: "var(--gray-900)",
  },
  ghost: {
    surface: "var(--white)",
    hover: "var(--white)",
    shadow: "var(--gray-200)",
    text: "var(--gray-900)",
    borderColor: "var(--gray-200)",
  },
  warning: {
    surface: "var(--red-500)",
    hover: "var(--red-700)",
    shadow: "var(--gray-900)",
    text: "var(--white)",
    borderColor: "var(--gray-900)",
  },
};

export default function Button3D({
  children, onClick, disabled = false, variant = "green", size = "lg", fullWidth = false,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const surfaceH = size === "xLarge" ? 48 : size === "lg" ? 48 : 40;
  const widthStyle = size === "xLarge" ? 180 : undefined;
  const v = variantStyles[variant];

  const translateY = disabled ? 0 : pressed ? 4 : hovered ? 1 : 0;
  const shadowY = disabled ? 0 : pressed ? 0 : hovered ? 3 : 4;
  const surfaceBg = disabled
    ? "var(--gray-100)"
    : (hovered || pressed)
      ? v.hover
      : v.surface;
  const borderColor = disabled ? "var(--gray-200)" : v.borderColor;
  const textColor = disabled ? "var(--gray-300)" : v.text;
  const shadowColor = disabled ? "var(--gray-200)" : v.shadow;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => { setPressed(false); setHovered(false); }}
      onMouseEnter={() => !disabled && setHovered(true)}
      onTouchStart={() => !disabled && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        minHeight: surfaceH + 4,
        width: fullWidth ? "100%" : widthStyle,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        display: "block",
      }}
    >
      {/* surface layer with box-shadow for 3D effect */}
      <div style={{
        position: "relative",
        height: surfaceH,
        borderRadius: 5,
        background: surfaceBg,
        border: `1.5px solid ${borderColor}`,
        boxShadow: shadowY > 0 ? `0 ${shadowY}px 0 0 ${shadowColor}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateY(${translateY}px)`,
        transition: "transform 100ms, box-shadow 100ms, background-color 100ms",
        fontSize: size === "sm" ? 14 : 16,
        fontWeight: 700,
        color: textColor,
        letterSpacing: (size === "sm" ? 14 : 16) * -0.02,
        lineHeight: size === "sm" ? "22px" : "24px",
        paddingLeft: 20,
        paddingRight: 20,
      }}>
        {children}
      </div>
    </button>
  );
}
