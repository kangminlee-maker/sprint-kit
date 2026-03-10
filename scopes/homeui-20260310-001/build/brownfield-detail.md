# Brownfield Detail

scope: homeui-20260310-001

<a id="greeting-status"></a>

## 홈 Greeting 상태 모델

**소스:** podo-app/apps/web/src/widgets/greeting/

greetingStatusSchema(Zod enum 4개) + useGreetingStatus()(4 boolean 기반 ts-pattern match). 기존 상태: NO_TICKET, RECOMMEND_BOOKING_TRIAL_CLASS, RECOMMEND_BOOKING_REGULAR_CLASS, SCHEDULED_CLASS. ErrorBoundary + Suspense 패턴으로 각 섹션 보호.

<a id="home-redirection"></a>

## 홈 리다이렉트 로직

**소스:** podo-app/apps/web/src/features/home-redirection/

HomeRedirection 컴포넌트. trialClassCompYn=Y && paymentYn=N이면 /subscribes/tickets로 AUTO_REDIRECT. localStorage AUTO_REDIRECTED 플래그로 1회만 실행.

<a id="home-page-ssr"></a>

## 홈 SSR Prefetch

**소스:** podo-app/apps/web/src/app/(internal)/home/page.tsx

현재 getCurrentUser + getSubscribeMappList만 prefetch. getTrialStepInfo, getNextLectureList 미포함. HydrationBoundary로 클라이언트 전달.

<a id="design-system"></a>

## 디자인 시스템 컴포넌트

**소스:** podo-app/packages/design-system-temp/

Button(3D press, variants: primary/ghost/warn/blue), Stepper, Progress, Badge, Chip, BottomSheet, ConfirmDialog. CVA 기반. FSD 구조: entities/ → features/ → widgets/ → views/ 의존 방향.

<a id="conventions"></a>

## 코드 컨벤션

**소스:** podo-app 전체

FSD(Feature-Sliced Design) 구조. CVA variants로 스타일 관리. ErrorBoundary + Suspense 패턴 필수. greetingStatusSchema 변경 시 ts-pattern .exhaustive()에서 컴파일 에러 발생 — 8개 상태 모두에 대해 컴포넌트가 존재해야 함.
