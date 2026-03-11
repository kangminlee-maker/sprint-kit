import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function PageLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#f0f0f0] flex justify-center">
      <div className="relative w-full max-w-[480px] bg-white min-h-screen">
        {children}
      </div>
    </div>
  )
}
