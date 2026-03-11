import { BodyContentType } from '../types'

type Props = {
  bodyContent: BodyContentType
}

/* ── Shared card wrapper ── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#E8E8E8] bg-[#F5F5F5] p-5 ${className}`}>
      {children}
    </div>
  )
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg leading-6 shrink-0">{icon}</span>
      <span className="text-sm font-medium text-[#1C1C1C] leading-5 tracking-[-0.28px]">
        {text}
      </span>
    </div>
  )
}

/* ── NOT_APPLIED ── */
function ApplyContent() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-[#1C1C1C] leading-6 tracking-[-0.32px]">
            무료 체험에 포함된 혜택
          </h3>
          <div className="flex flex-col gap-3">
            <InfoRow icon="👩‍🏫" text="원어민 튜터와 1:1 실시간 레슨 (25분)" />
            <InfoRow icon="📊" text="AI 스피킹 분석 리포트 제공" />
            <InfoRow icon="🎁" text="무료 3회 체험 (추가 비용 없음)" />
          </div>
        </div>
      </Card>

      <Card className="bg-[#F2FCEC] border-[#6ABE36]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#B5FD4C] flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-[#1C1C1C]">3</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1C1C1C] leading-5 tracking-[-0.28px]">
              무료 체험 3회 제공
            </p>
            <p className="text-xs text-[#757575] leading-4 tracking-[-0.24px] mt-0.5">
              신청 후 원하는 시간에 예약하세요
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ── WAITING ── */
function PrestudyContent() {
  return (
    <div className="flex flex-col gap-4">
      {/* Countdown */}
      <Card>
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-[#757575] leading-5 tracking-[-0.28px]">
            레슨까지 남은 시간
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-[32px] font-bold text-[#1C1C1C] leading-10 tracking-[-0.64px]">
              3일 14:32:08
            </span>
          </div>
        </div>
      </Card>

      {/* Pre-study progress */}
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1C1C1C] leading-6 tracking-[-0.32px]">
              예습 진행률
            </h3>
            <span className="text-sm font-bold text-[#6ABE36] leading-5 tracking-[-0.28px]">
              40%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#E8E8E8]">
            <div className="h-2 rounded-full bg-[#B5FD4C]" style={{ width: '40%' }} />
          </div>
          <div className="flex flex-col gap-2 mt-1">
            <PrestutyItem done label="오늘의 표현 학습" />
            <PrestutyItem done label="핵심 단어 암기" />
            <PrestutyItem done={false} label="발음 연습" />
            <PrestutyItem done={false} label="롤플레이 예습" />
            <PrestutyItem done={false} label="퀴즈 풀기" />
          </div>
        </div>
      </Card>

      {/* Lesson info */}
      <Card>
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-[#1C1C1C] leading-6 tracking-[-0.32px]">
            레슨 정보
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#E8E8E8] flex items-center justify-center">
              <span className="text-lg">👩</span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1C1C1C] leading-5 tracking-[-0.28px]">
                Sarah Kim 튜터
              </p>
              <p className="text-xs text-[#757575] leading-4 tracking-[-0.24px] mt-0.5">
                비즈니스 영어 전문 · 경력 5년
              </p>
            </div>
          </div>
          <div className="h-[1px] bg-[#E8E8E8]" />
          <div className="flex flex-col gap-2">
            <DetailRow label="일시" value="2026.03.15 (토) 14:00~14:25" />
            <DetailRow label="주제" value="자기소개 & 일상 대화" />
            <DetailRow label="레벨" value="Beginner" />
          </div>
        </div>
      </Card>
    </div>
  )
}

function PrestutyItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
          done ? 'bg-[#B5FD4C] border-[1.5px] border-[#1C1C1C]' : 'border-[1.5px] border-[#E8E8E8] bg-white'
        }`}
      >
        {done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 3.5L3.5 6L9 1" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span
        className={`text-sm leading-5 tracking-[-0.28px] ${
          done ? 'font-medium text-[#757575] line-through' : 'font-medium text-[#1C1C1C]'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-medium text-[#A5A5A5] leading-4 tracking-[-0.24px] w-8 shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-[#1C1C1C] leading-5 tracking-[-0.28px]">
        {value}
      </span>
    </div>
  )
}

/* ── LESSON_READY ── */
function LessonEntryContent() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="border-[#6ABE36] bg-[#F2FCEC]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#6ABE36] animate-pulse" />
            <span className="text-sm font-bold text-[#6ABE36] leading-5 tracking-[-0.28px]">
              입장 가능
            </span>
          </div>
          <p className="text-sm font-medium text-[#1C1C1C] leading-5 tracking-[-0.28px]">
            레슨이 곧 시작됩니다. 튜터가 교실에서 기다리고 있어요.
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#E8E8E8] flex items-center justify-center">
              <span className="text-lg">👩</span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1C1C1C] leading-5 tracking-[-0.28px]">
                Sarah Kim 튜터
              </p>
              <p className="text-xs text-[#757575] leading-4 tracking-[-0.24px] mt-0.5">
                오늘의 주제: 자기소개 & 일상 대화
              </p>
            </div>
          </div>
          <div className="h-[1px] bg-[#E8E8E8]" />
          <div className="flex flex-col gap-2">
            <DetailRow label="시간" value="14:00~14:25 (25분)" />
            <DetailRow label="예습" value="완료 (5/5)" />
          </div>
        </div>
      </Card>

      <div className="rounded-xl bg-[#FFFBE6] border border-[#FFE58F] px-4 py-3">
        <p className="text-xs font-medium text-[#757575] leading-4 tracking-[-0.24px]">
          레슨 시작 10분 전부터 입장할 수 있어요. 안정적인 와이파이 환경에서 접속해주세요.
        </p>
      </div>
    </div>
  )
}

/* ── COMPLETED ── */
function PaymentCtaContent() {
  return (
    <div className="flex flex-col gap-4">
      {/* Benefit card */}
      <Card className="bg-[#F2FCEC] border-[#6ABE36]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#6ABE36] text-[10px] font-bold text-white leading-4">
              첫 수강 혜택
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <BenefitRow text="정규 수강권 20% 할인" />
            <BenefitRow text="AI 학습 리포트 1개월 무료" />
            <BenefitRow text="프리미엄 교재 PDF 무료 제공" />
          </div>
          <div className="h-[1px] bg-[#6ABE36] opacity-30" />
          <p className="text-xs text-[#757575] leading-4 tracking-[-0.24px]">
            혜택은 체험 완료 후 7일간 유효합니다
          </p>
        </div>
      </Card>

      {/* Lesson summary */}
      <Card>
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-[#1C1C1C] leading-6 tracking-[-0.32px]">
            체험 레슨 결과
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#757575] leading-5 tracking-[-0.28px]">
              스피킹 점수
            </span>
            <span className="text-lg font-bold text-[#6ABE36] leading-[26px] tracking-[-0.36px]">
              82점
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#E8E8E8]">
            <div className="h-2 rounded-full bg-[#6ABE36]" style={{ width: '82%' }} />
          </div>
          <p className="text-xs text-[#757575] leading-4 tracking-[-0.24px]">
            동일 레벨 학습자 상위 30% 수준이에요!
          </p>
        </div>
      </Card>

      {/* Promo banner */}
      <div className="rounded-2xl bg-[#1C1C1C] p-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-[#B5FD4C] leading-5 tracking-[-0.28px]">
            지금 구매 시 특별 가격
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-[#A5A5A5] line-through">월 89,000원</span>
            <span className="text-lg font-bold text-white leading-[26px] tracking-[-0.36px]">
              월 69,000원
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function BenefitRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="8" fill="#6ABE36" />
        <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm font-medium text-[#1C1C1C] leading-5 tracking-[-0.28px]">{text}</span>
    </div>
  )
}

/* ── TUTOR_NOSHOW ── */
function NoshowTutorContent() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="border-[#009688]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E0F2F1] flex items-center justify-center">
              <span className="text-sm">🔄</span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#009688] leading-5 tracking-[-0.28px]">
                체험 1회 복구 완료
              </p>
            </div>
          </div>
          <p className="text-sm font-medium text-[#1C1C1C] leading-5 tracking-[-0.28px]">
            튜터의 사정으로 레슨이 진행되지 못해 무료 체험 1회가 자동으로 복구되었습니다.
          </p>
          <div className="h-[1px] bg-[#E8E8E8]" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#757575] leading-5 tracking-[-0.28px]">잔여 무료 체험</span>
            <span className="text-sm font-bold text-[#009688] leading-5 tracking-[-0.28px]">3회</span>
          </div>
        </div>
      </Card>

      <div className="rounded-xl bg-[#F5F5F5] px-4 py-3">
        <p className="text-xs font-medium text-[#757575] leading-4 tracking-[-0.24px]">
          불편을 드려 죄송합니다. 다시 신청하시면 다른 튜터와 매칭해 드릴게요.
        </p>
      </div>
    </div>
  )
}

/* ── STUDENT_ABSENT ── */
function NoshowStudentContent() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-bold text-[#1C1C1C] leading-6 tracking-[-0.32px]">
            무료 체험 현황
          </h3>
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    n === 1
                      ? 'bg-[#FD6771] border-[1.5px] border-[#FD6771]'
                      : 'bg-[#E8E8E8] border-[1.5px] border-[#E8E8E8]'
                  }`}
                >
                  {n === 1 ? (
                    <span className="text-xs font-bold text-white">불참</span>
                  ) : (
                    <span className="text-xs font-bold text-[#A5A5A5]">{n}회</span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-[#A5A5A5] leading-4">
                  {n === 1 ? '사용' : '잔여'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="rounded-xl bg-[#FFFBE6] border border-[#FFE58F] px-4 py-3">
        <p className="text-xs font-medium text-[#757575] leading-4 tracking-[-0.24px]">
          레슨 시작 시간에 참여하지 않으면 무료 체험 1회가 차감됩니다. 다음에는 꼭 참여해주세요!
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[#1C1C1C] leading-5 tracking-[-0.28px]">
            다시 예약하고 무료 체험을 이어가세요.
          </p>
          <p className="text-xs text-[#757575] leading-4 tracking-[-0.24px]">
            예약 취소는 레슨 시작 2시간 전까지 가능합니다.
          </p>
        </div>
      </Card>
    </div>
  )
}

/* ── EXHAUSTED ── */
function ExhaustedContent() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-[#757575] border-[1.5px] border-[#757575] flex items-center justify-center">
                  <svg width="12" height="10" viewBox="0 0 10 8" fill="none">
                    <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[11px] font-medium text-[#757575] leading-4">{n}회 완료</span>
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-[#757575] leading-5 tracking-[-0.28px] text-center mt-1">
            무료 체험 3회를 모두 사용했어요
          </p>
        </div>
      </Card>

      <Card className="bg-[#F2FCEC] border-[#6ABE36]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1C1C1C] leading-6 tracking-[-0.32px]">
              유료 체험 패키지
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#6ABE36] text-[10px] font-bold text-white leading-4">
              추천
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold text-[#1C1C1C] leading-[30px] tracking-[-0.44px]">
              5,000원
            </span>
            <span className="text-sm text-[#757575] leading-5 tracking-[-0.28px]">/ 3회</span>
          </div>
          <div className="h-[1px] bg-[#6ABE36] opacity-30" />
          <div className="flex flex-col gap-2">
            <BenefitRow text="1:1 튜터 레슨 3회 (25분)" />
            <BenefitRow text="AI 스피킹 리포트 제공" />
            <BenefitRow text="정규 수강권 구매 시 5,000원 할인" />
          </div>
        </div>
      </Card>

      <div className="rounded-2xl bg-[#1C1C1C] p-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-white leading-5 tracking-[-0.28px]">
            정규 수강권과 비교
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-[#A5A5A5] leading-4">유료 체험 (3회)</span>
            <span className="text-sm font-bold text-[#B5FD4C] leading-5">5,000원</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A5A5A5] leading-4">정규 월 구독</span>
            <span className="text-sm font-bold text-white leading-5">월 89,000원~</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Switch ── */
export default function ContentSection({ bodyContent }: Props) {
  switch (bodyContent) {
    case 'apply':
      return <ApplyContent />
    case 'prestudy':
      return <PrestudyContent />
    case 'lesson-entry':
      return <LessonEntryContent />
    case 'payment-cta':
      return <PaymentCtaContent />
    case 'noshow-tutor':
      return <NoshowTutorContent />
    case 'noshow-student':
      return <NoshowStudentContent />
    case 'exhausted':
      return <ExhaustedContent />
  }
}
