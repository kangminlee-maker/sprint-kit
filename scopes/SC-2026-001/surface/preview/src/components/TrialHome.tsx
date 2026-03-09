import type { TrialLesson, ScreenId } from "../types";
import { userName } from "../mock-data";
import TrialStepper from "./TrialStepper";
import Button from "./Button";
import BottomNav from "./BottomNav";

interface TrialHomeProps {
  trials: TrialLesson[];
  onNavigate: (screen: ScreenId) => void;
}

export default function TrialHome({ trials, onNavigate }: TrialHomeProps) {
  const nextAvailable = trials.find(
    (t) => t.status === "available" || t.status === "reserved"
  );
  const nextRound = nextAvailable?.round ?? 1;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 상단 바 */}
      <header className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <PillButton>수강신청</PillButton>
          <PillButton>채팅상담</PillButton>
        </div>
        <div className="relative">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z"
              stroke="#1c1c1c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.73 21a2 2 0 01-3.46 0"
              stroke="#1c1c1c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* 알림 점 */}
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: "#FD6771" }} />
        </div>
      </header>

      {/* 인사말 */}
      <section className="px-5 pt-4 pb-6">
        <h1 className="text-[26px] font-bold text-[#1c1c1c] leading-tight">
          {userName}님, 환영해요.
          <br />
          무료체험으로 가볍게
          <br />
          시작해요.
        </h1>
      </section>

      {/* 3회차 스텝 인디케이터 */}
      <section className="px-5 pb-4">
        <div className="bg-[#fafafa] rounded-2xl py-5 px-3">
          <TrialStepper trials={trials} />

          {/* CTA 버튼 */}
          <div className="mt-5 px-3">
            <Button fullWidth onClick={() => onNavigate("detail")}>
              {nextRound}회차 예약하기
            </Button>
          </div>
        </div>
      </section>

      {/* 체험 상세 바로가기 */}
      <section className="px-5 pb-4">
        <button
          onClick={() => onNavigate("detail")}
          className="w-full flex items-center justify-between bg-[#F2FCEC] rounded-xl px-4 py-3.5 transition-colors hover:bg-[#CBF2B3]"
        >
          <span className="text-[14px] font-semibold text-[#457B23]">
            체험 레슨 상세 보기
          </span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7 4L12 9L7 14" stroke="#457B23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      {/* 비디오 카드 */}
      <section className="px-5 pb-4">
        <div
          className="relative rounded-2xl overflow-hidden py-8 px-6"
          style={{
            background: "linear-gradient(135deg, #7C4DFF 0%, #B388FF 100%)",
          }}
        >
          <p className="text-white text-[16px] font-bold leading-snug">
            무료체험은 어떻게
            <br />
            진행되나요?
          </p>
          <p className="text-white/70 text-[13px] mt-1.5">영상으로 확인하기</p>
          {/* 재생 버튼 */}
          <div className="absolute right-5 bottom-5 w-11 h-11 rounded-full bg-white/25 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M5 3L15 9L5 15V3Z" fill="white" />
            </svg>
          </div>
        </div>
      </section>

      {/* 기능 카드 3개 */}
      <section className="px-5 space-y-3 pb-8">
        <FeatureCard
          color="#6184FF"
          icon="star"
          title="AI 레벨 테스트"
          desc="나에게 맞는 레벨을 알아보세요"
        />
        <FeatureCard
          color="#FD6771"
          icon="heart"
          title="학습 콘텐츠 미리보기"
          desc="실제 레슨에 사용되는 교재를 확인하세요"
        />
        <FeatureCard
          color="#B5FD4C"
          icon="trophy"
          title="수강 후기 보기"
          desc="다른 수강생의 솔직한 후기를 읽어보세요"
        />
      </section>

      <BottomNav active="home" />
    </div>
  );
}

/* ---------- 서브 컴포넌트 ---------- */

function PillButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="text-[13px] font-semibold text-[#444444] bg-[#f5f5f5] rounded-full px-3.5 py-1.5 hover:bg-[#e8e8e8] transition-colors">
      {children}
    </button>
  );
}

function FeatureCard({
  color,
  icon,
  title,
  desc,
}: {
  color: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <button className="w-full flex items-center gap-4 bg-white border border-[#e8e8e8] rounded-2xl px-5 py-4 hover:bg-[#fafafa] transition-colors text-left">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + "1A" }}
      >
        {icon === "star" && (
          <svg width="20" height="20" viewBox="0 0 20 20" fill={color}>
            <path d="M10 1L12.47 7.27L19 7.97L14.15 12.47L15.54 19L10 15.77L4.46 19L5.85 12.47L1 7.97L7.53 7.27L10 1Z" />
          </svg>
        )}
        {icon === "heart" && (
          <svg width="20" height="20" viewBox="0 0 20 20" fill={color}>
            <path d="M10 17.5L8.55 16.18C4 12.07 1 9.36 1 6.15C1 3.44 3.14 1.3 5.85 1.3C7.36 1.3 8.82 2.01 10 3.19C11.18 2.01 12.64 1.3 14.15 1.3C16.86 1.3 19 3.44 19 6.15C19 9.36 16 12.07 11.45 16.18L10 17.5Z" />
          </svg>
        )}
        {icon === "trophy" && (
          <svg width="20" height="20" viewBox="0 0 20 20" fill={color}>
            <path d="M10 13C12.76 13 15 10.76 15 8V2H5V8C5 10.76 7.24 13 10 13ZM15 2H18V6C18 7.66 16.66 9 15 9V2ZM5 2V9C3.34 9 2 7.66 2 6V2H5ZM7 15V17H13V15L16 18H4L7 15Z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[#1c1c1c]">{title}</p>
        <p className="text-[13px] text-[#757575] mt-0.5">{desc}</p>
      </div>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
        <path d="M7 4L12 9L7 14" stroke="#d6d6d6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
