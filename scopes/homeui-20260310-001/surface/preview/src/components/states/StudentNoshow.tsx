import type { ScenarioData } from "../../types";
import StickyBottom from "../StickyBottom";

/** 상태 5: 학생 노쇼 — red-500 accent, 패널티 안내 */
export default function StudentNoshow({ data }: { data: ScenarioData }) {
  const penaltyEnd = data.user.penaltyEndAt ? new Date(data.user.penaltyEndAt) : null;
  const isPenaltyActive = penaltyEnd ? penaltyEnd.getTime() > Date.now() : false;
  const remainHours = penaltyEnd ? Math.max(0, Math.ceil((penaltyEnd.getTime() - Date.now()) / 3600000)) : 0;

  return (
    <>
      {/* Greeting — white bg, red accent */}
      <div style={{
        padding: "24px 20px 16px",
        background: "var(--white)",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--red-500)",
          lineHeight: 1.4,
          letterSpacing: -0.56,
          marginBottom: 8,
        }}>
          수업에 참여하지 못했어요
        </h1>
        <p style={{
          fontSize: 20,
          fontWeight: 400,
          color: "var(--gray-700)",
          lineHeight: 1.5,
          letterSpacing: -0.4,
        }}>
          수업 시작 후 10분이 지나 노쇼로 처리되었어요.
        </p>
      </div>

      {/* 패널티 안내 — 72시간 */}
      {isPenaltyActive && (
        <div style={{
          margin: "0 20px",
          padding: 20,
          background: "var(--red-100)",
          borderRadius: 12,
          border: "1px solid var(--red-200)",
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--red-500)",
            marginBottom: 12,
            letterSpacing: -0.32,
          }}>
            예약 제한 안내
          </h3>
          <p style={{
            fontSize: 14,
            color: "var(--gray-900)",
            lineHeight: 1.6,
            letterSpacing: -0.28,
          }}>
            노쇼로 인해 <strong>72시간 동안 예약이 제한</strong>돼요.
          </p>
          <p style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--red-500)",
            marginTop: 8,
            letterSpacing: -0.48,
          }}>
            약 {remainHours}시간 후 해제
          </p>
          <p style={{
            fontSize: 12,
            color: "var(--gray-500)",
            marginTop: 4,
            letterSpacing: -0.24,
          }}>
            해제 시각: {penaltyEnd?.toLocaleString("ko-KR")}
          </p>
        </div>
      )}

      {/* 잔여 횟수 */}
      <div style={{
        margin: "16px 20px 0",
        padding: "16px 20px",
        background: "var(--gray-50)",
        borderRadius: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 14, color: "var(--gray-700)", letterSpacing: -0.28 }}>남은 체험 횟수</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: -0.4 }}>
          {data.user.remainTrialCount}회 / {data.user.totalTrialCount}회
        </span>
      </div>

      <div style={{ height: 80 }} />

      <StickyBottom
        label={isPenaltyActive ? `${remainHours}시간 후 예약 가능해요` : "다시 예약하기"}
        onClick={() => alert("예약 플로우 진입 (미구현)")}
        disabled={isPenaltyActive}
      />
    </>
  );
}
