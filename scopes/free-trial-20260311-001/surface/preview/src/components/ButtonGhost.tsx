interface Props {
  children: React.ReactNode;
  onClick?: () => void;
}

export default function ButtonGhost({ children, onClick }: Props) {
  return (
    <button onClick={onClick} className="relative w-full select-none">
      <div className="absolute inset-0 rounded-xl bg-gray-200" style={{ top: 4 }} />
      <div className="relative rounded-xl border border-gray-200 bg-white px-6 py-4 text-center text-base font-bold text-gray-900 transition-transform active:translate-y-[4px]">
        {children}
      </div>
    </button>
  );
}
