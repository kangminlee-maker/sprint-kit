import type { TrialLesson } from "../types";
import Button from "./Button";

interface TrialLessonCardProps {
  trial: TrialLesson;
  reservedAt?: string;
}

/** 상태별 뱃지 설정 */
const badgeConfig: Record<
  TrialLesson["status"],
  { label: string; bg: string; text: string; border?: string; icon?: string }
> = {
  available: {
    label: "예약대기",
    bg: "#F2FCEC",
    text: "#6ABE36",
    border: "#6ABE36",
  },
  reserved: {
    label: "예약완료",
    bg: "#6184FF",
    text: "#ffffff",
  },
  completed: {
    label: "완료",
    bg: "#e8e8e8",
    text: "#757575",
  },
  consumed: {
    label: "차감됨",
    bg: "#FFF0F1",
    text: "#FD6771",
  },
  locked: {
    label: "잠금",
    bg: "#e8e8e8",
    text: "#a5a5a5",
    icon: "lock",
  },
};

export default function TrialLessonCard({ trial, reservedAt }: TrialLessonCardProps) {
  const badge = badgeConfig[trial.status];

  return (
    <div className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f5f5]">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-[#1c1c1c]">
            {trial.round}회차
          </span>
          <span className="text-[13px] text-[#757575]">|</span>
          <span className="text-[13px] text-[#757575]">
            {trial.level ?? "—"} 커리큘럼
          </span>
        </div>

        {/* 상태 뱃지 */}
        <span
          className="inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: badge.bg,
            color: badge.text,
            border: badge.border ? `1.5px solid ${badge.border}` : "none",
          }}
        >
          {badge.icon === "lock" && (
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" className="inline -mt-px">
              <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" stroke={badge.text} strokeWidth="1.5" fill="none" />
              <path d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2C8.38 2 9.5 3.12 9.5 4.5V6" stroke={badge.text} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
          {badge.label}
        </span>
      </div>

      {/* 카드 본문 — 상태별로 다른 내용 */}
      <div className="px-5 py-4">
        {trial.status === "locked" && <LockedBody />}
        {trial.status === "available" && <AvailableBody />}
        {trial.status === "reserved" && <ReservedBody reservedAt={reservedAt} />}
        {trial.status === "completed" && <CompletedBody />}
        {trial.status === "consumed" && <ConsumedBody />}
      </div>
    </div>
  );
}

/* ---------- 상태별 본문 ---------- */

function LockedBody() {
  return (
    <p className="text-[14px] text-[#a5a5a5] leading-relaxed">
      이전 회차를 완료하면 개방됩니다.
    </p>
  );
}

function AvailableBody() {
  return (
    <div className="space-y-3">
      <p className="text-[14px] text-[#757575]">레슨 예약을 진행해주세요.</p>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1 !text-[13px] !py-2.5">
          예약하기
        </Button>
        <Button variant="primary" className="flex-1 !text-[13px] !py-2.5">
          학습 및 수강
        </Button>
      </div>
    </div>
  );
}

function ReservedBody({ reservedAt }: { reservedAt?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[14px] text-[#444444]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="#757575" strokeWidth="1.2" />
          <path d="M1.5 6H14.5" stroke="#757575" strokeWidth="1.2" />
          <path d="M5 1V3.5" stroke="#757575" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M11 1V3.5" stroke="#757575" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span>{reservedAt ?? "2026-03-12 (목) 오후 3:00"}</span>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1 !text-[13px] !py-2.5">
          예약변경
        </Button>
        <Button variant="primary" className="flex-1 !text-[13px] !py-2.5">
          학습 및 수강
        </Button>
      </div>
    </div>
  );
}

function CompletedBody() {
  return (
    <div className="space-y-3">
      <p className="text-[14px] text-[#757575]">학습과 레슨이 완료되었습니다.</p>
      <Button variant="secondary" className="!text-[13px] !py-2.5">
        다시보기
      </Button>
    </div>
  );
}

function ConsumedBody() {
  return (
    <p className="text-[14px] leading-relaxed" style={{ color: "#FD6771" }}>
      노쇼로 차감되었습니다. 다음 회차로 진행해주세요.
    </p>
  );
}
