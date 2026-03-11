import type { ScenarioData } from "../types";
import Stepper from "../components/Stepper";
import Badge from "../components/Badge";
import ButtonPrimary from "../components/ButtonPrimary";
import ButtonGhost from "../components/ButtonGhost";
import StickyBottom from "../components/StickyBottom";

interface Props {
  data: ScenarioData;
}

export default function TrialBooked({ data }: Props) {
  const lesson = data.lessonInfo!;

  return (
    <>
      <section className="px-5 pt-6">
        <p className="text-sm text-gray-500">무료 체험 레슨</p>
        <h1 className="mt-1 text-[22px] font-bold leading-[30px] tracking-[-0.44px] text-gray-900">
          1회차 수업이 예약되었어요
        </h1>
        <div className="mt-4">
          <Stepper steps={3} current={0} />
        </div>
      </section>

      <section className="mx-5 mt-6 rounded-xl border border-green-500 bg-white p-5">
        <div className="flex items-center justify-between">
          <Badge color="green">예약 확정</Badge>
          <span className="text-xs text-gray-400">체험 1회차</span>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">날짜</span>
            <span className="font-medium text-gray-900">{lesson.date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">시간</span>
            <span className="font-medium text-gray-900">{lesson.time}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">튜터</span>
            <span className="font-medium text-gray-900">{lesson.tutorName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">언어</span>
            <span className="font-medium text-gray-900">{lesson.language} · {lesson.level}</span>
          </div>
        </div>
      </section>

      <section className="mx-5 mt-4 flex gap-2">
        <div className="flex-1">
          <ButtonGhost>일정 변경</ButtonGhost>
        </div>
        <div className="flex-1">
          <ButtonGhost>예약 취소</ButtonGhost>
        </div>
      </section>

      <section className="mx-5 mt-6 rounded-xl bg-gray-50 p-4">
        <p className="text-xs text-gray-500">
          잔여 체험권 <span className="font-bold text-gray-900">{data.ticketsRemaining}장</span> / {data.ticketsTotal}장
        </p>
      </section>

      <div className="h-24" />
      <StickyBottom>
        <ButtonPrimary>예습하기</ButtonPrimary>
      </StickyBottom>
    </>
  );
}
