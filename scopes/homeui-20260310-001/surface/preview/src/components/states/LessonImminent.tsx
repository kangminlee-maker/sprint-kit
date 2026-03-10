import type { ScenarioData } from "../../types";
import StickyBottom from "../StickyBottom";

/** 상태 3: 레슨 임박 — 실시간 카운트다운 + 튜터 정보 */
export default function LessonImminent({ data }: { data: ScenarioData }) {
  const lesson = data.lesson!;
  const scheduled = new Date(lesson.scheduledAt);
  const diffMs = Math.max(0, scheduled.getTime() - Date.now());
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);

  return (
    <>
      {/* Greeting — white bg */}
      <div style={{
        padding: "24px 20px 16px",
        background: "var(--white)",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: 16,
          color: "var(--gray-500)",
          marginBottom: 8,
          letterSpacing: -0.32,
        }}>
          곧 레슨이 시작돼요!
        </p>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--gray-900)",
          lineHeight: 1.4,
          letterSpacing: -0.56,
        }}>
          레슨방에 입장해 주세요
        </h1>
      </div>

      {/* 실시간 카운트다운 */}
      <div style={{
        margin: "0 20px",
        padding: 24,
        background: "var(--gray-50)",
        borderRadius: 12,
        textAlign: "center",
      }}>
        <span style={{ fontSize: 14, color: "var(--gray-500)", letterSpacing: -0.28 }}>시작까지</span>
        <div style={{
          fontSize: 48,
          fontWeight: 800,
          color: "var(--gray-900)",
          marginTop: 8,
          letterSpacing: -0.96,
          fontVariantNumeric: "tabular-nums",
        }}>
          {String(diffMins).padStart(2, "0")}:{String(diffSecs).padStart(2, "0")}
        </div>
      </div>

      {/* 튜터 정보 */}
      <div style={{
        margin: "16px 20px 0",
        padding: 20,
        background: "var(--white)",
        borderRadius: 12,
        boxShadow: "var(--shadow-card)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "var(--blue-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <p style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--gray-900)",
            letterSpacing: -0.32,
          }}>
            {lesson.tutorName} 튜터
          </p>
          <p style={{
            fontSize: 14,
            color: "var(--gray-500)",
            marginTop: 2,
            letterSpacing: -0.28,
          }}>
            {lesson.courseName}
          </p>
        </div>
      </div>

      <div style={{ height: 80 }} />

      <StickyBottom
        label="레슨방 입장하기"
        variant="blue"
        onClick={() => alert("레슨방 입장 (미구현)")}
      />
    </>
  );
}
