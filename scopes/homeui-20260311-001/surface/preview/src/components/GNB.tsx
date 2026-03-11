const TABS = [
  {
    label: '홈',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
          stroke={active ? '#1C1C1C' : '#A5A5A5'}
          strokeWidth="1.5"
          fill={active ? '#B5FD4C' : 'none'}
          strokeLinejoin="round"
        />
      </svg>
    ),
    active: true,
  },
  {
    label: '레슨',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="5" width="18" height="14" rx="2"
          stroke={active ? '#1C1C1C' : '#A5A5A5'}
          strokeWidth="1.5"
        />
        <path d="M10 9L15 12L10 15V9Z" fill={active ? '#1C1C1C' : '#A5A5A5'} />
      </svg>
    ),
    active: false,
  },
  {
    label: '예약',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="4" width="18" height="17" rx="2"
          stroke={active ? '#1C1C1C' : '#A5A5A5'}
          strokeWidth="1.5"
        />
        <path d="M3 9H21" stroke={active ? '#1C1C1C' : '#A5A5A5'} strokeWidth="1.5" />
        <path d="M8 2V5" stroke={active ? '#1C1C1C' : '#A5A5A5'} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 2V5" stroke={active ? '#1C1C1C' : '#A5A5A5'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    active: false,
  },
  {
    label: 'AI 학습',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="12" r="9"
          stroke={active ? '#1C1C1C' : '#A5A5A5'}
          strokeWidth="1.5"
        />
        <path
          d="M12 7V12L15 15"
          stroke={active ? '#1C1C1C' : '#A5A5A5'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    active: false,
  },
  {
    label: '마이포도',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="8" r="4"
          stroke={active ? '#1C1C1C' : '#A5A5A5'}
          strokeWidth="1.5"
        />
        <path
          d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
          stroke={active ? '#1C1C1C' : '#A5A5A5'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    active: false,
  },
]

export default function GNB() {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-[#E8E8E8] z-[100]">
      <div className="flex items-center justify-around h-[60px]">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            className="flex flex-col items-center justify-center gap-0.5 bg-transparent border-none cursor-pointer px-2"
          >
            {tab.icon(tab.active)}
            <span
              className={`text-[9px] font-semibold leading-[14px] tracking-[-0.27px] ${
                tab.active ? 'text-[#1C1C1C]' : 'text-[#A5A5A5]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
