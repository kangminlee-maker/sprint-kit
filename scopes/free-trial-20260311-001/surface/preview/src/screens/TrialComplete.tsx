import Stepper from "../components/Stepper";
import Badge from "../components/Badge";
import ButtonPrimary from "../components/ButtonPrimary";
import StickyBottom from "../components/StickyBottom";

export default function TrialComplete() {
  return (
    <>
      <section className="px-5 pt-6">
        <p className="text-sm text-gray-500">무료 체험 레슨</p>
        <h1 className="mt-1 text-[22px] font-bold leading-[30px] tracking-[-0.44px] text-gray-900">
          체험 레슨 <span className="text-podo-green">3회</span>를
          <br />
          모두 완료했어요!
        </h1>
        <div className="mt-4">
          <Stepper steps={3} current={3} />
        </div>
      </section>

      <section className="mx-5 mt-6 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-100/50 p-4">
        <span className="text-2xl">🎟️</span>
        <div>
          <p className="text-sm font-bold text-gray-900">체험 완료 쿠폰 3장이 발급되었어요</p>
          <p className="text-xs text-gray-500">정규 수강 시 할인에 사용할 수 있어요</p>
        </div>
      </section>

      <section className="mx-5 mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900">체험 기록</h3>
        <div className="mt-3 flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                  ✓
                </span>
                <span className="text-sm text-gray-700">{i}회차 체험</span>
              </div>
              <Badge color="green">완료</Badge>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-5 mt-4 rounded-xl bg-gray-50 p-4 text-center">
        <p className="text-sm font-medium text-gray-700">
          포도와 함께 실력을 키워보세요
        </p>
        <p className="mt-1 text-xs text-gray-400">
          정규 수강권으로 매일 1:1 레슨을 받을 수 있어요
        </p>
      </section>

      <div className="h-24" />
      <StickyBottom>
        <ButtonPrimary>수강권 보러가기</ButtonPrimary>
      </StickyBottom>
    </>
  );
}
