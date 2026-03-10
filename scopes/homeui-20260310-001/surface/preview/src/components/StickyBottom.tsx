import Button3D from "./Button3D";

interface Props {
  label: string;
  onClick: () => void;
  variant?: "green" | "blue" | "warning" | "ghost";
  disabled?: boolean;
  subText?: string;
}

/**
 * StickyBottom CTA v2 — BottomStickyContainer pattern
 * sticky bottom z-30 (layerSticky), safe-area-inset-bottom
 */
export default function StickyBottom({ label, onClick, variant = "green", disabled = false, subText }: Props) {
  return (
    <div style={{
      position: "sticky",
      bottom: 0,
      left: 0,
      right: 0,
      padding: "var(--sticky-bottom-py) var(--page-px)",
      paddingBottom: "calc(var(--sticky-bottom-py) + env(safe-area-inset-bottom, 0px))",
      background: "var(--white)",
      zIndex: 30,
    }}>
      {subText && (
        <p style={{
          fontSize: 14,
          fontWeight: 400,
          color: "var(--gray-500)",
          textAlign: "center",
          marginBottom: 8,
          letterSpacing: -0.28,
          lineHeight: "20px",
        }}>
          {subText}
        </p>
      )}
      <Button3D
        onClick={onClick}
        variant={variant}
        disabled={disabled}
        fullWidth
      >
        {label}
      </Button3D>
    </div>
  );
}
