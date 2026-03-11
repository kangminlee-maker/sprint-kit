import ButtonPrimary from "../components/ButtonPrimary";
import ButtonGhost from "../components/ButtonGhost";
import StickyBottom from "../components/StickyBottom";

export default function TrialExhausted() {
  return (
    <>
      <section className="px-5 pt-6">
        <p className="text-sm text-gray-500">무료 체험 레슨</p>
        <h1 className="mt-1 text-[22px] font-bold leading-[30px] tracking-[-0.44px] text-gray-900">
          무료 체험을 모두 사용했어요
        </h1>
      </section>

      <section className="mx-5 mt-6 overflow-hidden rounded-xl border border-gray-200">
        <div className="bg-gray-900 px-5 py-4">
          <p className="text-xs text-gray-400">더 체험해보고 싶다면</p>
          <h3 className="mt-1 text-lg font-bold text-white">
            유료 체험 레슨 <span className="text-podo-green">3회</span>
          </h3>
        </div>
        <div className="bg-white p-5">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">체험 횟수</span>
              <span className="font-medium text-gray-900">3회</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">금액</span>
              <span className="font-bold text-gray-900">5,000원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">회당 가격</span>
              <span className="text-xs text-gray-500">1,667원</span>
            </div>
          </div>
          <p className="mt-3 text-xs leading-4 text-gray-400">
            유료 체험도 무료 체험과 동일한 규칙이 적용돼요.
          </p>
        </div>
      </section>

      <section className="mx-5 mt-4">
        <div className="rounded-xl bg-gray-50 p-4 text-center">
          <p className="text-sm font-medium text-gray-700">
            바로 정규 수강을 시작할 수도 있어요
          </p>
          <p className="mt-1 text-xs text-gray-400">
            발급된 쿠폰으로 할인 혜택을 받으세요
          </p>
        </div>
      </section>

      <div className="h-28" />
      <StickyBottom>
        <div className="flex flex-col gap-2">
          <ButtonPrimary>유료 체험 5,000원 구매하기</ButtonPrimary>
          <ButtonGhost>수강권 보러가기</ButtonGhost>
        </div>
      </StickyBottom>
    </>
  );
}
