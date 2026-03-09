interface BottomNavProps {
  active?: string;
  onNavigate?: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "홈", icon: HomeIcon },
  { id: "lesson", label: "레슨", icon: BookIcon },
  { id: "reserve", label: "예약", icon: CalendarIcon },
  { id: "mypage", label: "마이포도", icon: UserIcon },
];

export default function BottomNav({ active = "home", onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-[#e8e8e8] z-40">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate?.(tab.id)}
              className="flex flex-col items-center gap-0.5 py-1 px-3"
            >
              <tab.icon active={isActive} />
              <span
                className={`text-[11px] font-medium ${
                  isActive ? "text-[#1c1c1c]" : "text-[#a5a5a5]"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- 아이콘 ---------- */

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? "#1c1c1c" : "#a5a5a5";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? color : "none"}
      />
      {active && (
        <path d="M9 21V13H15V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {!active && (
        <path d="M9 21V14H15V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  const color = active ? "#1c1c1c" : "#a5a5a5";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 19.5V4.5C4 3.67 4.67 3 5.5 3H18.5C19.33 3 20 3.67 20 4.5V19.5C20 20.33 19.33 21 18.5 21H5.5C4.67 21 4 20.33 4 19.5Z"
        stroke={color}
        strokeWidth="2"
        fill={active ? color : "none"}
      />
      <path d="M8 7H16" stroke={active ? "white" : color} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 11H13" stroke={active ? "white" : color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  const color = active ? "#1c1c1c" : "#a5a5a5";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth="2" fill={active ? color : "none"} />
      <path d="M3 9H21" stroke={active ? "white" : color} strokeWidth="2" />
      <path d="M8 2V5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 2V5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {active && (
        <>
          <circle cx="8" cy="14" r="1.5" fill="white" />
          <circle cx="12" cy="14" r="1.5" fill="white" />
        </>
      )}
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  const color = active ? "#1c1c1c" : "#a5a5a5";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill={active ? color : "none"} />
      <path
        d="M4 20C4 17.24 7.58 15 12 15C16.42 15 20 17.24 20 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill={active ? color : "none"}
      />
    </svg>
  );
}
