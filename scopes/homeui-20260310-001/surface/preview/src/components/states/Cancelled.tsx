import type { ScenarioData } from "../../types";
import StickyBottom from "../StickyBottom";

/** 상태 8: 취소 — 재예약 유도 */
export default function Cancelled({ data }: { data: ScenarioData }) {
  return (
    <>
      {/* Greeting — white bg */}
      <div style={{
        padding: "24px 20px 16px",
        background: "var(--white)",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--gray-900)",
          lineHeight: 1.4,
          letterSpacing: -0.56,
          marginBottom: 8,
        }}>
          수업이 취소되었어요
        </h1>
        <p style={{
          fontSize: 20,
          fontWeight: 400,
          color: "var(--gray-700)",
          lineHeight: 1.5,
          letterSpacing: -0.4,
        }}>
          새로운 수업을 예약해 보세요.
        </p>
      </div>

      {/* 잔여 횟수 */}
      <div style={{
        margin: "0 20px",
        padding: "16px 20px",
        background: "var(--white)",
        borderRadius: 12,
        boxShadow: "var(--shadow-card)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 14, color: "var(--gray-700)", letterSpacing: -0.28 }}>남은 체험 횟수</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", letterSpacing: -0.4 }}>
          {data.user.remainTrialCount}회 / {data.user.totalTrialCount}회
        </span>
      </div>

      {/* 체험 무료 취소 안내 */}
      {data.lesson?.city === "PODO_TRIAL" && (
        <div style={{
          margin: "16px 20px 0",
          padding: "12px 16px",
          background: "var(--green-100)",
          borderRadius: 8,
          border: "1px solid var(--green-200)",
        }}>
          <p style={{ fontSize: 14, color: "var(--green-700)", letterSpacing: -0.28 }}>
            체험 수업은 무료로 취소되었어요. 수강권이 차감되지 않았어요.
          </p>
        </div>
      )}

      <div style={{ height: 80 }} />

      <StickyBottom
        label="다시 예약하기"
        onClick={() => alert("예약 플로우 진입 (미구현)")}
      />
    </>
  );
}
