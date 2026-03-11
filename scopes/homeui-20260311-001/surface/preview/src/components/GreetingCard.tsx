import type { TrialState } from "../types";
import { toHomeVariant } from "../types";
import { ButtonPrimary } from "./ButtonPrimary";
import { ButtonGhost } from "./ButtonGhost";

interface GreetingCardProps {
  state: TrialState;
  userName: string;
}

/** Greeting Card — 상태별 전환되는 메인 카드 */
export function GreetingCard({ state, userName }: GreetingCardProps) {
  const variant = toHomeVariant(state);

  // 어두운 카드 (trial, booking_waiting, booking_imminent)
  const isDark = variant === "trial" || variant === "booking_waiting" || variant === "booking_imminent";

  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: isDark ? "var(--gray-900)" : "white",
        padding: "20px",
        boxShadow: isDark ? "none" : "var(--shadow-card)",
        border: isDark ? "none" : "1px solid var(--gray-200)",
        transition: "all 200ms",
      }}
    >
      {renderContent(state, userName)}
    </div>
  );
}

function renderContent(state: TrialState, userName: string) {
  switch (state) {
    case "not_applied":
      return <NotAppliedContent userName={userName} />;
    case "trial_waiting":
      return <TrialWaitingContent userName={userName} />;
    case "booking_reserved":
      return <BookingReservedContent userName={userName} />;
    case "lesson_imminent":
      return <LessonImminentContent userName={userName} />;
    case "trial_completed":
      return <TrialCompletedContent userName={userName} />;
    case "tutor_noshow":
      return <TutorNoshowContent userName={userName} />;
    case "student_noshow":
      return <StudentNoshowContent userName={userName} />;
    case "trial_exhausted":
      return <TrialExhaustedContent userName={userName} />;
  }
}

// ─── 미신청 (trial 변형) ───
function NotAppliedContent({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "20px", letterSpacing: "-0.28px", margin: 0 }}>
          반가워요!
        </p>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "white", lineHeight: "26px", letterSpacing: "-0.36px", margin: "4px 0 0" }}>
          {userName}님, 환영해요.<br />무료체험으로 가볍게 시작해요.
        </h2>
      </div>
      <ButtonPrimary onClick={() => alert("→ /subscribes/trial")}>
        무료 체험 시작하기
      </ButtonPrimary>
    </div>
  );
}

// ─── 체험대기 (booking_waiting 변형) ───
function TrialWaitingContent({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "20px", letterSpacing: "-0.28px", margin: 0 }}>
          체험 신청 완료!
        </p>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "white", lineHeight: "26px", letterSpacing: "-0.36px", margin: "4px 0 0" }}>
          {userName}님, 수업을 예약해 볼까요?
        </h2>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "20px", letterSpacing: "-0.28px", margin: "8px 0 0" }}>
          체험 수강권 유효기간: 7일
        </p>
      </div>
      <ButtonPrimary onClick={() => alert("→ /booking")}>
        수업 예약하기
      </ButtonPrimary>
    </div>
  );
}

// ─── 예약완료 (booking_waiting 변형) ───
function BookingReservedContent({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "20px", letterSpacing: "-0.28px", margin: 0 }}>
          수업이 예정되어있어요
        </p>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "white", lineHeight: "26px", letterSpacing: "-0.36px", margin: "4px 0 0" }}>
          {userName}님, 체험 레슨이<br />예정되어있어요
        </h2>
        <div
          className="flex items-center gap-2 rounded-xl mt-3"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "12px 16px" }}
        >
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: "20px" }}>
            📅 내일 오후 3:00 · 25분
          </span>
        </div>
      </div>
      <ButtonPrimary onClick={() => alert("→ 예습하기")}>
        예습하기
      </ButtonPrimary>
      <div className="flex gap-2">
        <ButtonGhost fullWidth onClick={() => alert("→ 튜터 프로필")}>
          튜터 정보
        </ButtonGhost>
        <ButtonGhost fullWidth onClick={() => alert("→ 예약 변경")}>
          예약 변경
        </ButtonGhost>
      </div>
    </div>
  );
}

// ─── 레슨입장 (booking_imminent 변형) ───
function LessonImminentContent({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "20px", letterSpacing: "-0.28px", margin: 0 }}>
          곧 수업이 시작돼요!
        </p>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--podo-green)", lineHeight: "30px", letterSpacing: "-0.44px", margin: "4px 0 0" }}>
          레슨 5분 전
        </h2>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "20px", letterSpacing: "-0.28px", margin: "4px 0 0" }}>
          {userName}님, 수업 준비가 되셨나요?
        </p>
      </div>
      <ButtonPrimary onClick={() => alert("→ /lessons/classroom/[id]")}>
        수업 입장하기
      </ButtonPrimary>
    </div>
  );
}

// ─── 체험완료 (no_plan 변형 재활용) ───
function TrialCompletedContent({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p style={{ fontSize: "14px", color: "var(--gray-500)", lineHeight: "20px", letterSpacing: "-0.28px", margin: 0 }}>
          체험을 완료했어요!
        </p>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--gray-900)", lineHeight: "26px", letterSpacing: "-0.36px", margin: "4px 0 0" }}>
          {userName}님, 정규 수업을<br />시작해 볼까요?
        </h2>
      </div>

      {/* 첫 수강 혜택 카드 */}
      <div
        className="rounded-xl"
        style={{ backgroundColor: "var(--red-100)", padding: "16px" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="rounded-full flex items-center justify-center"
            style={{
              width: "22px",
              height: "22px",
              backgroundColor: "var(--red-500)",
              fontSize: "11px",
              fontWeight: 700,
              color: "white",
            }}
          >
            %
          </span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--red-500)", lineHeight: "20px" }}>
            첫 수강 혜택
          </span>
        </div>
        <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--gray-900)", lineHeight: "24px", margin: "8px 0 0" }}>
          지금 시작하면 <span style={{ color: "var(--red-500)" }}>35% 할인</span>
        </p>
        <p style={{ fontSize: "14px", color: "var(--gray-500)", lineHeight: "20px", margin: "4px 0 0" }}>
          <span style={{ textDecoration: "line-through", color: "var(--gray-400)" }}>140,000원/월</span>
          {" → "}
          <span style={{ fontWeight: 700, color: "var(--gray-900)" }}>89,000원</span>
          <span style={{ color: "var(--gray-500)" }}>/월</span>
        </p>
      </div>

      <ButtonPrimary onClick={() => alert("→ /subscribes/tickets")}>
        수강권 구매하기
      </ButtonPrimary>
    </div>
  );
}

// ─── 튜터노쇼 (no_booking 변형 재활용) ───
function TutorNoshowContent({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div
          className="inline-flex items-center rounded-full mb-2"
          style={{ padding: "4px 10px", backgroundColor: "var(--red-100)" }}
        >
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--red-500)", lineHeight: "18px" }}>
            수업 취소
          </span>
        </div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--gray-900)", lineHeight: "26px", letterSpacing: "-0.36px", margin: "0" }}>
          선생님 사정으로<br />수업이 취소되었어요
        </h2>
        <p style={{ fontSize: "14px", color: "var(--gray-500)", lineHeight: "20px", letterSpacing: "-0.28px", margin: "8px 0 0" }}>
          {userName}님, 체험 수업 1회가 복구되었어요.
          다시 예약해 주세요.
        </p>
      </div>

      <ButtonPrimary onClick={() => alert("→ /booking")}>
        다시 예약하기
      </ButtonPrimary>
    </div>
  );
}

// ─── 학생노쇼/취소 (no_booking 변형 재활용) ───
function StudentNoshowContent({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div
          className="inline-flex items-center rounded-full mb-2"
          style={{ padding: "4px 10px", backgroundColor: "var(--gray-100)" }}
        >
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--gray-500)", lineHeight: "18px" }}>
            수업 불참
          </span>
        </div>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--gray-900)", lineHeight: "26px", letterSpacing: "-0.36px", margin: "0" }}>
          아쉽지만 수업에<br />참여하지 못했어요
        </h2>
        <p style={{ fontSize: "14px", color: "var(--gray-500)", lineHeight: "20px", letterSpacing: "-0.28px", margin: "8px 0 0" }}>
          {userName}님, 불참한 수업의 횟수는 복구되지 않아요.
          남은 체험을 예약해 주세요.
        </p>
      </div>

      <ButtonPrimary onClick={() => alert("→ /booking")}>
        다음 체험 예약하기
      </ButtonPrimary>
    </div>
  );
}

// ─── 전체소진 (no_plan 변형 재활용) ───
function TrialExhaustedContent({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p style={{ fontSize: "14px", color: "var(--gray-500)", lineHeight: "20px", letterSpacing: "-0.28px", margin: 0 }}>
          체험 수업을 모두 사용했어요
        </p>
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--gray-900)", lineHeight: "26px", letterSpacing: "-0.36px", margin: "4px 0 0" }}>
          {userName}님, 정규 수업으로<br />계속해 볼까요?
        </h2>
      </div>

      {/* 프로모션 카드 */}
      <div
        className="rounded-xl"
        style={{ backgroundColor: "var(--green-100)", padding: "16px" }}
      >
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--green-500)", lineHeight: "20px", margin: 0 }}>
          지금 시작하면 첫 달 특별 혜택!
        </p>
        <p style={{ fontSize: "14px", color: "var(--gray-500)", lineHeight: "20px", margin: "4px 0 0" }}>
          정규 수업에서 더 많은 튜터와 만나보세요.
        </p>
      </div>

      <ButtonPrimary onClick={() => alert("→ /subscribes/tickets")}>
        수강권 둘러보기
      </ButtonPrimary>
    </div>
  );
}
