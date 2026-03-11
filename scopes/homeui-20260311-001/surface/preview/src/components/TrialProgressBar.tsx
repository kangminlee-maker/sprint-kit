import { TrialStatus } from '../types'

type Props = {
  step: number // 0-3
  status: TrialStatus
}

const STEPS = ['신청', '예습', '레슨', '완료']

export default function TrialProgressBar({ step, status }: Props) {
  const isException = status === 'TUTOR_NOSHOW' || status === 'STUDENT_ABSENT'
  const isExhausted = status === 'EXHAUSTED'

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const isActive = i <= step
        const isCurrent = i === step

        // Exception states: show warning color on current step
        const isWarning = isCurrent && (isException || isExhausted)

        // Determine dot color
        let dotBg = 'bg-[#E8E8E8]' // inactive
        if (isWarning) {
          dotBg = isExhausted ? 'bg-[#757575]' : 'bg-[#FD6771]'
        } else if (isActive) {
          dotBg = 'bg-[#B5FD4C]'
        }

        // Determine dot border
        let dotBorder = 'border-[#E8E8E8]'
        if (isWarning) {
          dotBorder = isExhausted ? 'border-[#757575]' : 'border-[#FD6771]'
        } else if (isActive) {
          dotBorder = 'border-[#1C1C1C]'
        }

        // Label color
        let labelColor = 'text-[#A5A5A5]'
        if (isWarning) {
          labelColor = isExhausted ? 'text-[#757575]' : 'text-[#FD6771]'
        } else if (isCurrent) {
          labelColor = 'text-[#1C1C1C]'
        } else if (isActive) {
          labelColor = 'text-[#6ABE36]'
        }

        // Connector line
        const showConnector = i < STEPS.length - 1
        const connectorActive = i < step

        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full border-[1.5px] ${dotBorder} ${dotBg} flex items-center justify-center`}
              >
                {isActive && !isWarning && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 3.5L3.5 6L9 1"
                      stroke="#1C1C1C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {isWarning && !isExhausted && (
                  <span className="text-[10px] font-bold text-white leading-none">!</span>
                )}
                {isWarning && isExhausted && (
                  <span className="text-[10px] font-bold text-white leading-none">-</span>
                )}
              </div>
              <span
                className={`text-[11px] font-semibold leading-4 tracking-[-0.22px] ${labelColor} whitespace-nowrap`}
              >
                {label}
              </span>
            </div>

            {showConnector && (
              <div
                className={`flex-1 h-[2px] mx-1 mt-[-18px] ${
                  connectorActive ? 'bg-[#B5FD4C]' : 'bg-[#E8E8E8]'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
