interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export default function ButtonPrimary({ children, onClick, disabled }: Props) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className="relative w-full select-none"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* Shadow layer */}
      <div
        className={`absolute inset-0 rounded-xl ${
          disabled ? "bg-gray-300" : "bg-green-700"
        }`}
        style={{ top: 4 }}
      />
      {/* Surface layer */}
      <div
        className={`relative rounded-xl px-6 py-4 text-center text-base font-bold text-white transition-transform active:translate-y-[4px] ${
          disabled ? "bg-gray-400" : "bg-podo-green"
        }`}
      >
        {children}
      </div>
    </button>
  );
}
