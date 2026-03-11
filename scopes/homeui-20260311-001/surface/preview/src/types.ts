export type TrialStatus =
  | 'NOT_APPLIED'
  | 'WAITING'
  | 'LESSON_READY'
  | 'COMPLETED'
  | 'TUTOR_NOSHOW'
  | 'STUDENT_ABSENT'
  | 'EXHAUSTED'

export type BodyContentType =
  | 'apply'
  | 'prestudy'
  | 'lesson-entry'
  | 'payment-cta'
  | 'noshow-tutor'
  | 'noshow-student'
  | 'exhausted'

export type Scenario = {
  id: TrialStatus
  label: string
  greeting: string
  subtitle: string
  progressStep: number // 0-3
  ctaText: string
  ctaAction: string
  bodyContent: BodyContentType
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'NOT_APPLIED',
    label: '미신청',
    greeting: '민수님, 안녕하세요!',
    subtitle: '무료 체험 레슨으로 포도와 함께 영어 스피킹을 시작해보세요!',
    progressStep: 0,
    ctaText: '무료 체험 신청하기',
    ctaAction: '/trial/apply',
    bodyContent: 'apply',
  },
  {
    id: 'WAITING',
    label: '대기',
    greeting: '민수님, 레슨이 예정되어 있어요!',
    subtitle: '2026.03.15 (토) 14:00~14:25',
    progressStep: 1,
    ctaText: '예습하기',
    ctaAction: '/trial/prestudy',
    bodyContent: 'prestudy',
  },
  {
    id: 'LESSON_READY',
    label: '입장 가능',
    greeting: '민수님, 레슨 시간이에요!',
    subtitle: '지금 바로 입장하세요',
    progressStep: 2,
    ctaText: '수업 입장하기',
    ctaAction: '/lesson/enter',
    bodyContent: 'lesson-entry',
  },
  {
    id: 'COMPLETED',
    label: '완료',
    greeting: '첫 레슨을 완료했어요! 🎉',
    subtitle: '지금 수강권을 구매하면 특별 혜택을 받을 수 있어요',
    progressStep: 3,
    ctaText: '수강권 구매하기',
    ctaAction: '/purchase',
    bodyContent: 'payment-cta',
  },
  {
    id: 'TUTOR_NOSHOW',
    label: '튜터 노쇼',
    greeting: '민수님, 죄송합니다',
    subtitle: '튜터 사정으로 레슨이 진행되지 못했어요. 체험 1회가 복구되었습니다.',
    progressStep: 1,
    ctaText: '다시 신청하기',
    ctaAction: '/trial/apply',
    bodyContent: 'noshow-tutor',
  },
  {
    id: 'STUDENT_ABSENT',
    label: '학생 노쇼',
    greeting: '민수님, 레슨에 참여하지 못하셨네요',
    subtitle: '잔여 무료체험: 2회 남음',
    progressStep: 1,
    ctaText: '다시 예약하기',
    ctaAction: '/trial/apply',
    bodyContent: 'noshow-student',
  },
  {
    id: 'EXHAUSTED',
    label: '3회 소진',
    greeting: '민수님, 무료 체험을 모두 사용했어요',
    subtitle: '유료 체험으로 레슨을 계속 경험해보세요',
    progressStep: 3,
    ctaText: '유료 체험 신청하기 · 5,000원',
    ctaAction: '/trial/paid-apply',
    bodyContent: 'exhausted',
  },
]
