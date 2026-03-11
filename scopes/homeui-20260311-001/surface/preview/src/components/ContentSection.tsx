import type { TrialState } from "../types";

/** 상태별 본문 카드 영역 (Greeting 아래) */
export function ContentSection({ state }: { state: TrialState }) {
  switch (state) {
    case "not_applied":
      return <TrialFeatureCards />;
    case "trial_waiting":
      return <AILearningCard />;
    case "booking_reserved":
      return <LessonPrepCards />;
    case "lesson_imminent":
      return null; // 레슨 입장 시에는 Greeting이 화면 대부분을 차지
    case "trial_completed":
      return <PostTrialCards />;
    case "tutor_noshow":
      return <RebookingGuide reason="tutor" />;
    case "student_noshow":
      return <RebookingGuide reason="student" />;
    case "trial_exhausted":
      return <PostTrialCards />;
  }
}

// ─── 미신청: 체험 안내 카드 ───
function TrialFeatureCards() {
  const features = [
    { icon: "🎯", title: "1:1 맞춤 수업", desc: "나에게 맞는 레벨로 시작해요" },
    { icon: "📱", title: "AI 학습", desc: "수업 전 AI와 먼저 연습해요" },
    { icon: "⏱", title: "25분 집중 레슨", desc: "부담 없는 시간, 확실한 효과" },
  ];

  return (
    <div className="flex flex-col gap-2">
      {features.map((f) => (
        <LinkCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
      ))}
    </div>
  );
}

// ─── 체험대기: AI 학습 유도 ───
function AILearningCard() {
  return (
    <div
      className="rounded-xl cursor-pointer"
      style={{
        backgroundColor: "var(--gray-100)",
        padding: "20px",
        transition: "background-color 150ms",
      }}
      onClick={() => alert("→ /ai-learning")}
    >
      <div className="flex items-center gap-3">
        <div
          className="rounded-xl flex items-center justify-center"
          style={{ width: "40px", height: "40px", backgroundColor: "white", fontSize: "20px" }}
        >
          🤖
        </div>
        <div className="flex-1">
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--gray-900)", lineHeight: "24px", margin: 0 }}>
            AI 학습으로 예습하기
          </p>
          <p style={{ fontSize: "14px", color: "var(--gray-500)", lineHeight: "20px", margin: "2px 0 0" }}>
            수업 전에 AI와 먼저 연습해 보세요
          </p>
        </div>
        <span style={{ color: "var(--gray-300)", fontSize: "20px" }}>›</span>
      </div>
    </div>
  );
}

// ─── 예약완료: 수업 준비 카드 ───
function LessonPrepCards() {
  return (
    <div className="flex flex-col gap-2">
      <LinkCard icon="📚" title="학습가이드" desc="레슨 주제를 미리 확인해요" />
      <LinkCard icon="🗣" title="발음 학습북" desc="정확한 발음으로 연습해요" />
    </div>
  );
}

// ─── 체험완료/소진: 결제 유도 카드 ───
function PostTrialCards() {
  return (
    <div className="flex flex-col gap-2">
      {/* AFTER_TRIAL 쿠폰 */}
      <div
        className="rounded-xl"
        style={{
          backgroundColor: "#1A1A1A",
          padding: "20px",
          cursor: "pointer",
        }}
        onClick={() => alert("→ /subscribes/tickets (쿠폰 적용)")}
      >
        <p style={{ fontSize: "12px", fontWeight: 600, color: "#C5F467", lineHeight: "18px", margin: 0 }}>
          체험 완료 쿠폰
        </p>
        <p style={{ fontSize: "16px", fontWeight: 700, color: "white", lineHeight: "24px", margin: "4px 0 0" }}>
          지금 수강 시작하면 <span style={{ color: "#C5F467" }}>15% 추가 할인</span>
        </p>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "20px", margin: "4px 0 0" }}>
          첫 수강 혜택과 중복 적용 가능
        </p>
      </div>

      {/* 수업 후기 */}
      <LinkCard icon="⭐" title="수강생 후기" desc="다른 학생들의 생생한 후기를 확인해요" />
    </div>
  );
}

// ─── 노쇼: 재예약 안내 ───
function RebookingGuide({ reason }: { reason: "tutor" | "student" }) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-xl"
        style={{
          backgroundColor: "var(--gray-100)",
          padding: "16px",
        }}
      >
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--gray-900)", lineHeight: "20px", margin: 0 }}>
          {reason === "tutor" ? "체험 수업이 복구되었어요" : "다음 수업을 준비해요"}
        </p>
        <p style={{ fontSize: "14px", color: "var(--gray-500)", lineHeight: "20px", margin: "4px 0 0" }}>
          {reason === "tutor"
            ? "선생님 불참으로 체험 1회가 추가 지급되었어요. 새로운 시간에 다시 예약해 주세요."
            : "수업 예약은 현 시점 기준 2시간 이후부터 가능해요."
          }
        </p>
      </div>
      <LinkCard icon="📖" title="AI 학습으로 연습하기" desc="다음 수업 전에 AI와 먼저 연습해요" />
    </div>
  );
}

// ─── 공통 LinkCard ───
function LinkCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl cursor-pointer"
      style={{
        backgroundColor: "var(--gray-100)",
        padding: "16px 20px",
        transition: "background-color 150ms",
      }}
    >
      <div
        className="rounded-xl flex items-center justify-center shrink-0"
        style={{ width: "40px", height: "40px", backgroundColor: "white", fontSize: "20px" }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--gray-900)", lineHeight: "24px", letterSpacing: "-0.32px", margin: 0 }}>
          {title}
        </p>
        <p style={{ fontSize: "14px", color: "var(--gray-500)", lineHeight: "20px", letterSpacing: "-0.28px", margin: "2px 0 0" }}>
          {desc}
        </p>
      </div>
      <span style={{ color: "var(--gray-300)", fontSize: "20px" }}>›</span>
    </div>
  );
}
