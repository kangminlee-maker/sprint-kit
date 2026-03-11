import ButtonPrimary from './ButtonPrimary'

type Props = {
  ctaText: string
  pulsing?: boolean
}

export default function StickyBottom({ ctaText, pulsing = false }: Props) {
  return (
    <div className="fixed bottom-[62px] left-0 right-0 max-w-[480px] mx-auto px-5 py-3 bg-white z-[100]">
      <ButtonPrimary text={ctaText} pulsing={pulsing} />
    </div>
  )
}
