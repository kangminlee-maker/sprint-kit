import BottomSheet from "./BottomSheet";
import Button from "./Button";

interface TutorNoShowSheetProps {
  open: boolean;
  onClose: () => void;
  remaining: number;
}

/**
 * 튜터 노쇼 복구 알림 바텀시트.
 * 튜터 사유로 레슨이 진행되지 못했을 때 복구를 알림.
 */
export default function TutorNoShowSheet({
  open,
  onClose,
  remaining,
}: TutorNoShowSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-center">
        {/* 캐릭터 영역 (플레이스홀더) */}
        <div className="w-24 h-24 mx-auto mb-5 rounded-3xl bg-[#F2F5FF] flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="20" r="12" fill="#6184FF" opacity="0.15" />
            <circle cx="24" cy="20" r="8" fill="#6184FF" opacity="0.3" />
            {/* 복구 화살표 아이콘 */}
            <path
              d="M18 20C18 16.69 20.69 14 24 14C27.31 14 30 16.69 30 20"
              stroke="#6184FF"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M28 14L30 20L24 18" fill="#6184FF" opacity="0.5" />
            <path
              d="M17 22L18 20L19 22"
              stroke="#6184FF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 체크 */}
            <path
              d="M20 36L24 40L32 32"
              stroke="#6184FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* 사과 텍스트 */}
        <p className="text-[14px] text-[#757575] leading-relaxed mb-2">
          금일 체험 레슨 진행에
          <br />
          불편을 드려 죄송합니다.
        </p>

        {/* 복구 안내 */}
        <h3 className="text-[18px] font-bold text-[#1c1c1c] leading-snug">
          진행되지 못한 체험 레슨이
          <br />
          즉시 복구되었습니다.
        </h3>

        {/* 잔여 횟수 뱃지 */}
        <div className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-full bg-[#F2F5FF]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7L5.5 9.5L11 4" stroke="#6184FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] font-semibold text-[#6184FF]">
            잔여 체험: {remaining}회
          </span>
        </div>

        {/* CTA */}
        <div className="mt-6">
          <Button fullWidth onClick={onClose}>
            재예약하기
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
