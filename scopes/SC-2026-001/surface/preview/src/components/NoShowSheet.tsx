import BottomSheet from "./BottomSheet";
import Button from "./Button";

interface NoShowSheetProps {
  open: boolean;
  onClose: () => void;
  remaining: number;
}

/**
 * 학생 노쇼 알림 바텀시트.
 * 체험 1회가 차감되었음을 알리고 다음 예약을 유도.
 */
export default function NoShowSheet({ open, onClose, remaining }: NoShowSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-center">
        {/* 캐릭터 영역 (플레이스홀더) */}
        <div className="w-24 h-24 mx-auto mb-5 rounded-3xl bg-[#FFF0F1] flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="20" r="12" fill="#FD6771" opacity="0.2" />
            <circle cx="24" cy="20" r="8" fill="#FD6771" opacity="0.4" />
            {/* 슬픈 표정 */}
            <circle cx="20" cy="18" r="1.5" fill="#FD6771" />
            <circle cx="28" cy="18" r="1.5" fill="#FD6771" />
            <path d="M20 24C20 24 22 22 24 22C26 22 28 24 28 24" stroke="#FD6771" strokeWidth="1.5" strokeLinecap="round" />
            {/* 느낌표 */}
            <rect x="22.5" y="35" width="3" height="6" rx="1.5" fill="#FD6771" />
            <circle cx="24" cy="44" r="1.5" fill="#FD6771" />
          </svg>
        </div>

        {/* 안내 텍스트 */}
        <h3 className="text-[18px] font-bold text-[#1c1c1c] leading-snug">
          체험 1회가 차감되었어요.
        </h3>
        <p className="text-[15px] text-[#757575] mt-2 leading-relaxed">
          남은 {remaining}회로 다시 예약해보세요!
        </p>

        {/* 잔여 횟수 뱃지 */}
        <div className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full bg-[#FFF0F1]">
          <span className="text-[13px] font-semibold" style={{ color: "#FD6771" }}>
            잔여 체험: {remaining}회
          </span>
        </div>

        {/* CTA */}
        <div className="mt-6">
          <Button fullWidth onClick={onClose}>
            다음 회차 예약하기
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
