import type { ScenarioData } from "../types";
import Stepper from "../components/Stepper";
import Badge from "../components/Badge";
import ButtonPrimary from "../components/ButtonPrimary";
import StickyBottom from "../components/StickyBottom";

interface Props {
  data: ScenarioData;
}

export default function StudentNoshow({ data }: Props) {
  return (
    <>
      <section className="px-5 pt-6">
        <p className="text-sm text-gray-500">무료 체험 레슨</p>
        <h1 className="mt-1 text-[22px] font-bold leading-[30px] tracking-[-0.44px] text-gray-900">
          수업에 참석하지 않았어요
        </h1>
        <div className="mt-4">
          <Stepper steps={3} current={0} />
        </div>
      </section>

      <section className="mx-5 mt-6 rounded-xl border border-red-500/30 bg-red-100/50 p-5">
        <div className="flex items-center gap-2">
          <Badge color="red">노쇼</Badge>
          <span className="text-xs text-gray-500">1회차 체험</span>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">사용된 체험권</span>
            <span className="font-medium text-red-500">−1장 (수업 사용)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">노쇼 페널티</span>
            <span className="font-medium text-red-500">−1장 (추가 소멸)</span>
          </div>
          <div className="mt-1 border-t border-gray-200 pt-2">
            <div className="flex justify-between">
              <span className="font-bold text-gray-900">잔여 체험권</span>
              <span className="font-bold text-gray-900">{data.ticketsRemaining}장 / {data.ticketsTotal}장</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-5 mt-4 rounded-xl bg-gray-50 p-4">
        <p className="text-xs leading-4 text-gray-500">
          수업 시작 2시간 전까지 취소하면 체험권이 복구돼요.
          <br />
          수업 시작 2시간 이내 취소 또는 노쇼 시 체험권 2장이 소멸돼요.
        </p>
      </section>

      <div className="h-24" />
      <StickyBottom>
        <ButtonPrimary>남은 {data.ticketsRemaining}회 예약하기</ButtonPrimary>
      </StickyBottom>
    </>
  );
}
