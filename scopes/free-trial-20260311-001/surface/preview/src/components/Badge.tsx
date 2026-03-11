interface Props {
  children: React.ReactNode;
  color?: "green" | "red" | "blue" | "gray";
}

const colorMap = {
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-500",
  blue: "bg-blue-50 text-blue-500",
  gray: "bg-gray-100 text-gray-500",
};

export default function Badge({ children, color = "green" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${colorMap[color]}`}
    >
      {children}
    </span>
  );
}
