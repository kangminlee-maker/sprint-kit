import type { ScreenId } from "../types";
import { userName } from "../mock-data";
import Button from "./Button";

interface PostTrialConversionProps {
  onBack: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export default function PostTrialConversion({
  onBack,
}: PostTrialConversionProps) {
  return (
    <div className="min-h-screen bg-white pb-12 screen-enter">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#e8e8e8]">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center -ml-1"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M13 4L7 10L13 16"
                stroke="#1c1c1c"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className="text-[17px] font-bold text-[#1c1c1c]">
            체험 완료
          </h2>
        </div>
      </header>

      {/* 축하 영역 */}
      <section className="px-6 pt-10 pb-6 text-center">
        {/* 축하 아이콘 */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F2FCEC" }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="16" fill="#9BEB26" />
            <path d="M13 20L18 25L27 15" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="text-[22px] font-bold text-[#1c1c1c] leading-tight">
          체험이 모두 완료되었어요!
        </h2>
        <p className="text-[15px] text-[#757575] mt-2 leading-relaxed">
          {userName}님의 3회 무료 체험이 끝났습니다.
          <br />
          다음 단계를 선택해주세요.
        </p>
      </section>

      {/* 요약 카드 */}
      <section className="px-5 pb-6">
        <div className="bg-[#fafafa] rounded-2xl p-5 space-y-3">
          <h3 className="text-[15px] font-bold text-[#1c1c1c]">
            3회 체험 완료 리포트 요약
          </h3>
          <div className="space-y-2">
            <ReportRow label="참여 회차" value="3회 / 3회" />
            <ReportRow label="측정 레벨" value="Beginner → Elementary" />
            <ReportRow label="추천 수강 과정" value="기초 회화 집중반" />
            <ReportRow label="학습 태도 평가" value="매우 적극적" highlight />
          </div>
        </div>
      </section>

      {/* CTA 영역 */}
      <section className="px-5 space-y-3">
        <Button variant="ghost" fullWidth className="!py-4">
          <span className="flex items-center gap-2">
            유료 체험레슨 구매
            <span className="text-[#6184FF] font-bold text-[14px]">
              5,000원/3회
            </span>
          </span>
        </Button>

        <Button variant="primary" fullWidth className="!py-4">
          정규 수강권 둘러보기
        </Button>
      </section>

      {/* 안내 문구 */}
      <section className="px-6 pt-4">
        <p className="text-[12px] text-[#a5a5a5] leading-relaxed">
          * 유료 체험레슨에도 동일한 순차 개방 정책이 적용됩니다.
        </p>
      </section>
    </div>
  );
}

function ReportRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-[#757575]">{label}</span>
      <span
        className={`text-[13px] font-semibold ${
          highlight ? "text-[#6ABE36]" : "text-[#1c1c1c]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
