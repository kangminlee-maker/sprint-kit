interface Props {
  children: React.ReactNode;
}

export default function StickyBottom({ children }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[480px] border-t border-gray-100 bg-white px-5 py-3">
      {children}
    </div>
  );
}
