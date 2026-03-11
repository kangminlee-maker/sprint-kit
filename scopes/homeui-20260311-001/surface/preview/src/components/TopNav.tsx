import { Scenario } from '../types'

type Props = {
  scenario: Scenario
}

export default function TopNav({ scenario }: Props) {
  const showTicketCount = scenario.id === 'STUDENT_ABSENT' || scenario.id === 'EXHAUSTED'

  return (
    <div className="sticky top-0 z-[100] bg-white">
      <div className="flex items-center justify-between h-[56px] px-5">
        {/* PODO Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#B5FD4C] flex items-center justify-center">
            <span className="text-[11px] font-extrabold text-[#1C1C1C] leading-none">P</span>
          </div>
          <span className="text-lg font-bold text-[#1C1C1C] leading-[26px] tracking-[-0.36px]">
            PODO
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {showTicketCount && (
            <span className="text-sm font-medium text-[#757575] leading-5 tracking-[-0.28px]">
              잔여 수강권 0
            </span>
          )}
          <button className="h-8 px-3 rounded-full border border-[#E8E8E8] bg-white">
            <span className="text-xs font-semibold text-[#1C1C1C] leading-4 tracking-[-0.24px]">
              수강권 구매
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
