const tabs = [
  { label: "홈", icon: "🏠" },
  { label: "레슨", icon: "📚" },
  { label: "예약", icon: "📅" },
  { label: "마이포도", icon: "👤" },
];

export default function GNB() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-[480px] items-center justify-around border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab, i) => (
        <button
          key={tab.label}
          className={`flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] ${
            i === 0 ? "font-bold text-gray-900" : "text-gray-400"
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
