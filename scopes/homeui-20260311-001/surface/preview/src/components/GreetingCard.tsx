type Props = {
  greeting: string
  subtitle: string
}

export default function GreetingCard({ greeting, subtitle }: Props) {
  return (
    <div>
      <h1 className="text-[22px] font-bold text-[#1C1C1C] leading-[30px] tracking-[-0.44px]">
        {greeting}
      </h1>
      <p className="mt-2 text-sm font-medium text-[#757575] leading-5 tracking-[-0.28px]">
        {subtitle}
      </p>
    </div>
  )
}
