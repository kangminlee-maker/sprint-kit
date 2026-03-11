import ButtonPrimary from "../components/ButtonPrimary";
import StickyBottom from "../components/StickyBottom";

export default function TrialIdle() {
  return (
    <>
      <section className="px-5 pt-6">
        <h1 className="text-[22px] font-bold leading-[30px] tracking-[-0.44px] text-gray-900">
          무료 체험 레슨
          <br />
          <span className="text-podo-green">3회</span> 제공
        </h1>
        <p className="mt-2 text-sm leading-5 text-gray-500">
          1:1 스피킹 레슨을 무료로 3회 체험해 보세요.
          <br />
          체험 후 나에게 맞는 플랜을 선택할 수 있어요.
        </p>
      </section>

      <section className="mx-5 mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h3 className="text-sm font-bold text-gray-900">체험 레슨 진행 방식</h3>
        <ul className="mt-3 flex flex-col gap-2.5">
          {[
            { step: "1", text: "체험 시작 시 체험권 3장이 발급돼요" },
            { step: "2", text: "1회차 수업을 예약하고 완료하면 다음 회차가 열려요" },
            { step: "3", text: "3회 모두 완료하면 맞춤 쿠폰을 드려요" },
          ].map((item) => (
            <li key={item.step} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                {item.step}
              </span>
              <span className="text-sm leading-5 text-gray-700">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-5 mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-bold text-gray-900">예약 규칙</h3>
        <ul className="mt-3 flex flex-col gap-1.5 text-xs leading-4 text-gray-500">
          <li>• 예약 시 3일 이내 수업만 선택 가능해요</li>
          <li>• 수업 시작 2시간 전까지 무료 취소할 수 있어요</li>
          <li>• 2시간 이내 취소 또는 노쇼 시 체험권 2장이 소멸돼요</li>
          <li>• 튜터 노쇼 시 체험권이 복구돼요</li>
        </ul>
      </section>

      <div className="h-24" />
      <StickyBottom>
        <ButtonPrimary>무료 체험 시작하기</ButtonPrimary>
      </StickyBottom>
    </>
  );
}
