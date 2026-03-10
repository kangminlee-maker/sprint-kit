import type { ScenarioData } from "../../types";
import StepTabs from "../StepTabs";
import VideoCard from "../VideoCard";
import FeatureListCard from "../FeatureListCard";
import StickyBottom from "../StickyBottom";

/** 상태 1: 미신청 — v2 Trial Home layout */
export default function TrialIdle({ data }: { data: ScenarioData }) {
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
          OO님, 환영해요.
        </h1>
        <p style={{
          fontSize: 20,
          fontWeight: 400,
          color: "var(--gray-700)",
          lineHeight: 1.5,
          letterSpacing: -0.4,
          marginTop: 4,
        }}>
          무료체험으로 가볍게 시작해요.
        </p>
      </div>

      {/* StepTabs — 3단계 */}
      <StepTabs activeStep={1} />

      {/* Video Card */}
      <div style={{ marginBottom: 20 }}>
        <VideoCard />
      </div>

      {/* Feature List Cards */}
      <FeatureListCard />

      {/* Bottom spacer for sticky CTA + GNB */}
      <div style={{ height: 80 }} />

      <StickyBottom
        label="체험레슨 예약하기"
        onClick={() => alert("예약 플로우 진입 (미구현)")}
      />
    </>
  );
}
