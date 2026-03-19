interface WelcomeBackPopupProps {
  onCTA: () => void;
  onDismiss: () => void;
}

export function WelcomeBackPopup({ onCTA, onDismiss }: WelcomeBackPopupProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center animate-[fadeIn_200ms_ease]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Popup Card */}
      <div className="relative z-[201] w-full max-w-[480px] min-h-dvh bg-white flex flex-col animate-[slideUp_300ms_ease]">
        {/* Content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          {/* Headline */}
          <h1 className="text-xl font-bold text-gray-900 leading-[30px] tracking-[-0.48px] text-center mb-3">
            지금 역대 최대 할인가로
            <br />
            다시 시작하세요!
          </h1>

          {/* Sub-copy */}
          <p className="text-base font-medium text-gray-500 leading-6 tracking-[-0.32px] text-center mb-10">
            포도와 열심히 쌓은 외국어 실력이
            <br />
            사라지고 있어요ㅠㅠ
          </p>

          {/* Price image placeholder */}
          <div className="w-full max-w-[320px] rounded-2xl bg-gray-900 p-8 mb-10 flex flex-col items-center">
            <span className="text-sm font-medium text-gray-400 tracking-[-0.28px] leading-5 mb-1">
              하루 약 1,300원으로
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[40px] font-bold text-white leading-[48px] tracking-[-0.8px]">
                월 4만원
              </span>
              <span className="text-lg font-bold text-podo-green leading-[26px] tracking-[-0.36px]">
                대
              </span>
            </div>
            <span className="text-sm text-gray-400 tracking-[-0.28px] leading-5 mt-2 line-through">
              정가 ₩59,000
            </span>
          </div>
        </div>

        {/* Bottom CTA area */}
        <div className="px-5 pb-8">
          {/* CTA Button - ButtonPrimary style */}
          <button
            onClick={onCTA}
            className="relative w-full"
          >
            <div className="absolute inset-0 rounded-xl bg-gray-900 translate-y-[3px]" />
            <div className="relative w-full py-4 rounded-xl bg-podo-green text-base font-bold text-gray-900 leading-6 tracking-[-0.48px] text-center active:translate-y-[3px] active:shadow-none transition-transform">
              4만원대로 다시 시작 &gt;
            </div>
          </button>

          {/* Dismiss link */}
          <button
            onClick={onDismiss}
            className="w-full mt-4 py-2 text-sm font-medium text-gray-400 tracking-[-0.28px] leading-5 text-center"
          >
            할인 혜택 포기하기
          </button>
        </div>
      </div>
    </div>
  );
}
