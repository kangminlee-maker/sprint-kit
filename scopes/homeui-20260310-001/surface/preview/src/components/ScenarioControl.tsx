import { useState } from "react";
import { scenarios } from "../mock-data";
import type { HomeState } from "../types";

interface Props {
  current: HomeState;
  onChange: (state: HomeState) => void;
}

/** 디버그 UI — z-index: 999 (layerTop) */
export default function ScenarioControl({ current, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      position: "fixed",
      top: 8,
      right: 8,
      zIndex: 999,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 6,
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--gray-900)",
          color: "var(--white)",
          border: "none",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
        onMouseDown={(e) => ((e.target as HTMLElement).style.opacity = "0.8")}
        onMouseUp={(e) => ((e.target as HTMLElement).style.opacity = "1")}
      >
        {open ? "\u00d7" : "\u25c6"}
      </button>

      {open && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "flex-end",
        }}>
          {Object.entries(scenarios).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => { onChange(key as HomeState); setOpen(false); }}
              style={{
                borderRadius: 9999,
                background: current === key ? "var(--green-500)" : "var(--gray-900)",
                color: "var(--white)",
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 12px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                whiteSpace: "nowrap",
              }}
              onMouseDown={(e) => ((e.target as HTMLElement).style.opacity = "0.8")}
              onMouseUp={(e) => ((e.target as HTMLElement).style.opacity = "1")}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
