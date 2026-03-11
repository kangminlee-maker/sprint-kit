import ButtonPrimary from "./ButtonPrimary";
import ButtonGhost from "./ButtonGhost";

interface Props {
  title?: string;
  text: string;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function Confirm({
  title,
  text,
  cancelText = "취소",
  confirmText = "확인",
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative mx-5 w-full max-w-[400px] rounded-xl bg-white p-6 shadow-xl">
        {title && (
          <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
        )}
        <p className="mb-6 text-sm leading-5 text-gray-600 whitespace-pre-line">{text}</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <ButtonGhost onClick={onCancel}>{cancelText}</ButtonGhost>
          </div>
          <div className="flex-1">
            <ButtonPrimary onClick={onConfirm}>{confirmText}</ButtonPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}
