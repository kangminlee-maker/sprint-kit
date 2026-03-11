interface Props {
  steps: number;
  current: number;
}

export default function Stepper({ steps, current }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: steps }, (_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`h-1 w-full rounded-full transition-colors ${
              i < current ? "bg-green-500" : "bg-gray-200"
            }`}
          />
        </div>
      ))}
      <span className="ml-1.5 text-xs font-bold text-gray-500">
        {current}/{steps}
      </span>
    </div>
  );
}
