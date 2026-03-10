import type { ScenarioData } from "../../types";
import StepTabs from "../StepTabs";
import StickyBottom from "../StickyBottom";

/** 상태 2: 예약 대기 — 예습 유도 */
export default function TrialBooked({ data }: { data: ScenarioData }) {
  const lesson = data.lesson!;
  const scheduled = new Date(lesson.scheduledAt);
  const diffMs = scheduled.getTime() - Date.now();
  const diffHours = Math.max(0, Math.floor(diffMs / 3600000));
  const diffMins = Math.max(0, Math.floor((diffMs % 3600000) / 60000));

  return (
    <>
      {/* Greeting — white bg */}
      <div style={{
        padding: "24px 20px 16px",
        background: "var(--white)",
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--gray-900)",
          lineHeight: 1.4,
          letterSpacing: -0.56,
        }}>
          레슨 준비를 시작해 볼까요?
        </h1>
      </div>

      {/* StepTabs — step 2 */}
      <StepTabs activeStep={2} />

      {/* 예약 정보 카드 */}
      <div style={{
        margin: "0 20px",
        padding: 20,
        background: "var(--gray-50)",
        borderRadius: 12,
        border: "1px solid var(--gray-200)",
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--gray-900)",
          marginBottom: 16,
          letterSpacing: -0.32,
        }}>
          예약 정보
        </h3>
        {[
          { label: "튜터", value: lesson.tutorName },
          { label: "코스", value: lesson.courseName },
          {
            label: "일시",
            value: `${scheduled.toLocaleDateString("ko-KR")} ${scheduled.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`,
          },
        ].map(({ label, value }) => (
          <div key={label} style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 14, color: "var(--gray-500)", letterSpacing: -0.28 }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-900)", letterSpacing: -0.28 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* 카운트다운 */}
      <div style={{
        margin: "16px 20px 0",
        padding: 20,
        background: "var(--white)",
        borderRadius: 12,
        boxShadow: "var(--shadow-card)",
        textAlign: "center",
      }}>
        <span style={{ fontSize: 14, color: "var(--gray-500)", letterSpacing: -0.28 }}>레슨까지 남은 시간</span>
        <div style={{
          fontSize: 28,
          fontWeight: 800,
          color: "var(--green-500)",
          marginTop: 4,
          letterSpacing: -0.56,
        }}>
          {diffHours}시간 {diffMins}분
        </div>
      </div>

      {/* 예습 진행률 */}
      <div style={{
        margin: "16px 20px 0",
        padding: 20,
        background: "var(--white)",
        borderRadius: 12,
        boxShadow: "var(--shadow-card)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--gray-900)", letterSpacing: -0.32 }}>
            예습 진행률
          </h3>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--green-500)", letterSpacing: -0.32 }}>
            {data.trialStep.preStudyProgress}%
          </span>
        </div>
        <div style={{
          height: 8,
          background: "var(--gray-100)",
          borderRadius: 4,
          overflow: "hidden",
        }}>
          <div style={{
            width: `${data.trialStep.preStudyProgress}%`,
            height: "100%",
            background: "var(--green-500)",
            borderRadius: 4,
            transition: "width 300ms",
          }} />
        </div>
      </div>

      <div style={{ height: 80 }} />

      <StickyBottom
        label="AI 학습 시작하기"
        onClick={() => alert("AI 학습 진입 (미구현)")}
      />
    </>
  );
}
