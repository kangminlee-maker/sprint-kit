import type { ScenarioData } from "../types";
import Stepper from "../components/Stepper";
import Badge from "../components/Badge";
import ButtonPrimary from "../components/ButtonPrimary";
import StickyBottom from "../components/StickyBottom";

interface Props {
  data: ScenarioData;
}

export default function TrialProgress({ data }: Props) {
  const isLast = data.completedCount === 2;

  return (
    <>
      <section className="px-5 pt-6">
        <p className="text-sm text-gray-500">무료 체험 레슨</p>
        <h1 className="mt-1 text-[22px] font-bold leading-[30px] tracking-[-0.44px] text-gray-900">
          {data.completedCount}회차 수업을 완료했어요
        </h1>
        <div className="mt-4">
          <Stepper steps={3} current={data.completedCount} />
        </div>
      </section>

      {data.couponIssued && (
        <section className="mx-5 mt-4 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-100/50 p-4">
          <span className="text-2xl">🎟️</span>
          <div>
            <p className="text-sm font-bold text-gray-900">체험 완료 쿠폰이 발급되었어요</p>
            <p className="text-xs text-gray-500">정규 수강 시 할인에 사용할 수 있어요</p>
          </div>
        </section>
      )}

      <section className="mx-5 mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900">체험 기록</h3>
        <div className="mt-3 flex flex-col gap-2">
          {Array.from({ length: data.completedCount }, (_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                  ✓
                </span>
                <span className="text-sm text-gray-700">{i + 1}회차 체험</span>
              </div>
              <Badge color="green">완료</Badge>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-400">
                {data.completedCount + 1}
              </span>
              <span className="text-sm text-gray-400">
                {isLast ? "마지막 체험" : `${data.completedCount + 1}회차 체험`}
              </span>
            </div>
            <Badge color="gray">대기</Badge>
          </div>
        </div>
      </section>

      <section className="mx-5 mt-4 rounded-xl bg-gray-50 p-4">
        <p className="text-xs text-gray-500">
          잔여 체험권 <span className="font-bold text-gray-900">{data.ticketsRemaining}장</span> / {data.ticketsTotal}장
        </p>
      </section>

      <div className="h-24" />
      <StickyBottom>
        <ButtonPrimary>
          {isLast ? "마지막 체험 예약하기" : "다음 체험 예약하기"}
        </ButtonPrimary>
      </StickyBottom>
    </>
  );
}
