type Props = {
  label: string
  onNext: () => void
  onPrev: () => void
  index: number
  total: number
}

export default function DebugPanel({ label, onNext, onPrev, index, total }: Props) {
  return (
    <div className="fixed top-2 right-2 z-[300] flex items-center gap-1">
      <button
        className="w-7 h-7 rounded-full bg-[#1C1C1C] text-white text-xs font-bold border-none cursor-pointer flex items-center justify-center"
        onClick={onPrev}
      >
        &lt;
      </button>
      <button
        className="px-3 py-1.5 rounded-full bg-[#1C1C1C] text-white text-xs font-bold border-none cursor-pointer"
        onClick={onNext}
      >
        {index + 1}/{total} {label}
      </button>
      <button
        className="w-7 h-7 rounded-full bg-[#1C1C1C] text-white text-xs font-bold border-none cursor-pointer flex items-center justify-center"
        onClick={onNext}
      >
        &gt;
      </button>
    </div>
  )
}
