type Props = {
  text: string
  disabled?: boolean
  pulsing?: boolean
  onClick?: () => void
}

export default function ButtonPrimary({ text, disabled = false, pulsing = false, onClick }: Props) {
  if (disabled) {
    return (
      <button
        className="w-full h-[52px] bg-transparent border-none p-0 cursor-not-allowed group"
        disabled
      >
        <div className="w-full rounded-lg pb-1 bg-[#E8E8E8]">
          <div className="w-full h-12 rounded-lg border-[1.5px] border-[#E8E8E8] bg-[#F5F5F5] flex items-center justify-center">
            <span className="text-base font-bold leading-6 tracking-[-0.48px] text-[#D6D6D6]">
              {text}
            </span>
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      className="w-full h-[52px] bg-transparent border-none p-0 cursor-pointer group"
      onClick={onClick}
    >
      <div
        className={`w-full rounded-lg pb-1 bg-[#1C1C1C] transition-all duration-100 group-hover:translate-y-[2px] group-hover:pb-[2px] group-active:translate-y-1 group-active:pb-0 ${
          pulsing ? 'animate-pulse-border rounded-lg' : ''
        }`}
      >
        <div className="w-full h-12 rounded-lg border-[1.5px] border-[#1C1C1C] bg-[#B5FD4C] flex items-center justify-center transition-colors duration-100 group-hover:bg-[#9BEB26] group-active:bg-[#9BEB26]">
          <span className="text-base font-bold leading-6 tracking-[-0.48px] text-[#1C1C1C]">
            {text}
          </span>
        </div>
      </div>
    </button>
  )
}
