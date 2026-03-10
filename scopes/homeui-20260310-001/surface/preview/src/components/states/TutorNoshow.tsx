import type { ScenarioData } from "../../types";
import StickyBottom from "../StickyBottom";

/** 상태 6: 튜터 노쇼 — blue-500 accent, 복구 안내 */
export default function TutorNoshow({ data }: { data: ScenarioData }) {
  return (
    <>
      {/* Greeting — white bg, blue accent */}
      <div style={{
        padding: "24px 20px 16px",
        background: "var(--white)",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--blue-500)",
          lineHeight: 1.4,
          letterSpacing: -0.56,
          marginBottom: 8,
        }}>
          튜터 사정으로 수업이 취소되었어요
        </h1>
        <p style={{
          fontSize: 20,
          fontWeight: 400,
          color: "var(--gray-700)",
          lineHeight: 1.5,
          letterSpacing: -0.4,
        }}>
          불편을 드려 죄송해요.
        </p>
      </div>

      {/* 복구 안내 */}
      <div style={{
        margin: "0 20px",
        padding: 20,
        background: "var(--white)",
        borderRadius: 12,
        boxShadow: "var(--shadow-card)",
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--gray-900)",
          marginBottom: 12,
          letterSpacing: -0.32,
        }}>
          복구된 내용
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--green-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--gray-900)",
              letterSpacing: -0.32,
            }}>
              체험 1회 복구 완료
            </p>
            <p style={{
              fontSize: 14,
              color: "var(--gray-500)",
              marginTop: 2,
              letterSpacing: -0.28,
            }}>
              체험 횟수가 차감되지 않았어요
            </p>
          </div>
        </div>

        <div style={{
          background: "var(--blue-100)",
          borderRadius: 8,
          padding: "12px 16px",
        }}>
          <p style={{ fontSize: 14, color: "var(--blue-500)", letterSpacing: -0.28 }}>
            바로 다시 예약할 수 있어요. 예약 제한이 없어요.
          </p>
        </div>
      </div>

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
        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--green-500)", letterSpacing: -0.4 }}>
          {data.user.remainTrialCount}회 / {data.user.totalTrialCount}회
        </span>
      </div>

      <div style={{ height: 80 }} />

      <StickyBottom
        label="다시 예약하기"
        onClick={() => alert("예약 플로우 진입 (미구현)")}
      />
    </>
  );
}
