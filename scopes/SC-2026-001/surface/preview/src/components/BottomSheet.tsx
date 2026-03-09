import type { ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * 하단에서 올라오는 모달 시트.
 * 배경을 누르면 닫힘.
 */
export default function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 반투명 배경 */}
      <div
        className="absolute inset-0 bg-black/50 sheet-backdrop"
        onClick={onClose}
      />
      {/* 시트 본체 */}
      <div className="sheet-content relative w-full max-w-[480px] bg-white rounded-t-3xl px-6 pt-8 pb-10 z-10">
        {/* 드래그 핸들 */}
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[#d6d6d6]" />
        {children}
      </div>
    </div>
  );
}
