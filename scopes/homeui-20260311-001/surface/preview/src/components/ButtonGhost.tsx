type Props = {
  text: string
  onClick?: () => void
}

export default function ButtonGhost({ text, onClick }: Props) {
  return (
    <button
      className="w-full h-[52px] bg-transparent border-none p-0 cursor-pointer group"
      onClick={onClick}
    >
      <div className="w-full rounded-lg pb-1 bg-[#1C1C1C] transition-all duration-100 group-hover:translate-y-[2px] group-hover:pb-[2px] group-active:translate-y-1 group-active:pb-0">
        <div className="w-full h-12 rounded-lg border-[1.5px] border-[#1C1C1C] bg-white flex items-center justify-center transition-colors duration-100 group-hover:bg-[#F5F5F5] group-active:bg-[#F5F5F5]">
          <span className="text-base font-bold leading-6 tracking-[-0.48px] text-[#1C1C1C]">
            {text}
          </span>
        </div>
      </div>
    </button>
  )
}
