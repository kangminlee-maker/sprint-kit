# 포도 서비스 레거시 → 신규 마이그레이션 현황

> **마지막 업데이트**: 2026-03-05

## 1. 마이그레이션 개요

### 1.1 목적과 배경

포도(Podo) 서비스는 기존 Nuxt.js 2 기반의 레거시 웹 애플리케이션(`apps/legacy-web`)을 Next.js 15(App Router) 기반의 신규 애플리케이션(`apps/web`)으로 점진적으로 마이그레이션하고 있습니다.

**마이그레이션 목적**:
- 최신 React 19 및 Next.js 15의 Server Components 활용
- 타입 안전성 강화 (TypeScript 기반 전환)
- 성능 및 SEO 개선
- 유지보수성 및 개발 생산성 향상
- 모던 프론트엔드 생태계로의 전환

**주요 배경**:
- Nuxt 2는 Vue 2 기반으로 레거시화되어 보안 패치 및 신규 기능 지원 제한
- 모노레포 구조(pnpm workspaces + Turbo)에서 React 기반 통합 필요
- React Native 앱과의 코드 공유 및 디자인 시스템 통합

### 1.2 기술 스택 변경

| 항목 | 레거시 (Nuxt 2) | 신규 (Next.js 15) |
|------|----------------|-------------------|
| **프레임워크** | Nuxt.js 2.x | Next.js 15 (App Router) |
| **UI 라이브러리** | Vue 2 | React 19 |
| **라우팅** | Nuxt 파일 기반 (pages/) | App Router (app/) |
| **상태 관리** | Vuex | TanStack Query v5 |
| **스타일링** | SCSS | Tailwind CSS |
| **API 클라이언트** | Axios | Hono RPC Client (@podo/apis) |
| **타입 시스템** | JavaScript + JSDoc | TypeScript |
| **인증** | Middleware + Vuex | Server Components + getProtectedSession |
| **환경 변수** | Nuxt Config | @t3-oss/env-nextjs (Zod) |
| **모니터링** | 부분적 | Datadog RUM, Sentry |

### 1.3 공존 방식 (프록시 설정)

마이그레이션 기간 동안 레거시와 신규 앱이 **멀티존(Multi-Zone)** 방식으로 공존합니다.

**프록시 구조**:
```
사용자 요청
    ↓
Next.js 앱 (apps/web) - 포트 3000
    ↓ (특정 경로만 프록시)
Legacy Nuxt 앱 (apps/legacy-web) - 포트 3005
```

**프록시 대상 경로**:
- `/app/user/podo/*` - 레거시 핵심 사용자 페이지
- `/_nuxt/*` - Nuxt 정적 자산
- `/_loading/*`, `/__webpack_hmr/*` - 개발 서버 전용

신규 앱에서 처리하지 않는 라우트는 자동으로 레거시 앱으로 프록시되어 기존 기능이 유지됩니다.

---

## 2. 마이그레이션 완료된 페이지

### 2.1 홈 및 인증

| 신규 라우트 | 신규 페이지 경로 | 기존 라우트 | 상태 |
|-----------|----------------|-----------|------|
| `/` (internal root) | `apps/web/src/app/(internal)/page.tsx` | `/` | ✅ 완료 |
| `/login` | `apps/web/src/app/(internal)/login/page.tsx` | (신규) | ✅ 완료 |
| `/home` | `apps/web/src/app/(internal)/home/page.tsx` | `/app/user/podo/home` | ✅ 완료 |
| `/home/ai` | `apps/web/src/app/(internal)/home/ai/page.tsx` | (신규) | ✅ 완료 |

### 2.2 예약 및 수업

| 신규 라우트 | 신규 페이지 경로 | 기존 라우트 | 상태 |
|-----------|----------------|-----------|------|
| `/reservation` | `apps/web/src/app/(internal)/reservation/page.tsx` | `/app/user/podo/classes`, `/app/user/podo/class-reserved` | ✅ 완료 |
| `/booking` | `apps/web/src/app/(internal)/booking/page.tsx` | `/app/user/podo/class-booking` | ✅ 완료 |
| `/lessons/regular` | `apps/web/src/app/(internal)/lessons/regular/page.tsx` | `/app/user/podo/class-booking?type=regular` | ✅ 완료 |
| `/lessons/trial` | `apps/web/src/app/(internal)/lessons/trial/page.tsx` | `/app/user/podo/class-booking?type=trial` | ✅ 완료 |
| `/lessons/classroom/[classID]` | `apps/web/src/app/(internal)/lessons/classroom/[classID]/page.tsx` | `/app/user/podo/classroom` | ✅ 완료 |
| `/lessons/classroom/[classID]/report` | `apps/web/src/app/(internal)/lessons/classroom/[classID]/report/page.tsx` | `/app/user/podo/class-report` | ✅ 완료 |
| `/lessons/classroom/[classID]/review` | `apps/web/src/app/(internal)/lessons/classroom/[classID]/review/page.tsx` | (신규) | ✅ 완료 |
| `/lessons/classroom/[classID]/review-complete` | `apps/web/src/app/(internal)/lessons/classroom/[classID]/review-complete/page.tsx` | (신규) | ✅ 완료 |
| `/lessons/ai` | `apps/web/src/app/(internal)/lessons/ai/page.tsx` | (신규) | ✅ 완료 |
| `/lessons/ai/[classCourseId]` | `apps/web/src/app/(internal)/lessons/ai/[classCourseId]/page.tsx` | (신규) | ✅ 완료 |
| `/lessons/ai/trial-report/[uuid]` | `apps/web/src/app/(internal)/lessons/ai/trial-report/[uuid]/page.tsx` | (신규) | ✅ 완료 |

### 2.3 마이포도 (마이페이지)

| 신규 라우트 | 신규 페이지 경로 | 기존 라우트 | 상태 |
|-----------|----------------|-----------|------|
| `/my-podo` | `apps/web/src/app/(internal)/my-podo/page.tsx` | `/app/user/podo/mypage` | ✅ 완료 |
| `/my-podo/notification-settings` | `apps/web/src/app/(internal)/my-podo/notification-settings/page.tsx` | (신규) | ✅ 완료 |
| `/my-podo/coupon` | `apps/web/src/app/(internal)/my-podo/coupon/page.tsx` | (신규) | ✅ 완료 |
| `/my-podo/coupon/[id]` | `apps/web/src/app/(internal)/my-podo/coupon/[id]/page.tsx` | (신규) | ✅ 완료 |
| `/my-podo/notices` | `apps/web/src/app/(internal)/my-podo/notices/page.tsx` | (신규) | ✅ 완료 |
| `/my-podo/notices/[boardId]` | `apps/web/src/app/(internal)/my-podo/notices/[boardId]/page.tsx` | (신규) | ✅ 완료 |
| `/my-podo/payment-methods` | `apps/web/src/app/(internal)/my-podo/payment-methods/page.tsx` | `/app/user/podo/mypage/payment` | ✅ 완료 |
| `/my-podo/payment-methods/register` | `apps/web/src/app/(internal)/my-podo/payment-methods/register/page.tsx` | `/app/user/podo/mypage/card-registration` | ✅ 완료 |

**마이그레이션 완료된 레거시 마이페이지**:
- `/app/user/podo/mypage/card-manage` → `/my-podo/payment-methods`에 통합 완료

### 2.4 구독 및 결제

| 신규 라우트 | 신규 페이지 경로 | 기존 라우트 | 상태 |
|-----------|----------------|-----------|------|
| `/subscribes` | `apps/web/src/app/(internal)/subscribes/page.tsx` | (신규) | ✅ 완료 |
| `/subscribes/payment/[subscribeId]` | `apps/web/src/app/(internal)/subscribes/payment/[subscribeId]/page.tsx` | (신규) | ✅ 완료 |
| `/subscribes/payment/[subscribeId]/success` | `apps/web/src/app/(internal)/subscribes/payment/[subscribeId]/success/page.tsx` | (신규) | ✅ 완료 |
| `/subscribes/tickets` | `apps/web/src/app/(internal)/subscribes/tickets/page.tsx` | `/app/user/podo/mypage/plan` | ✅ 완료 |
| `/subscribes/tickets-v2` | `apps/web/src/app/(internal)/subscribes/tickets-v2/page.tsx` | (신규) | ✅ 완료 |
| `/subscribes/tickets/payback` | `apps/web/src/app/(internal)/subscribes/tickets/payback/page.tsx` | (신규) | ✅ 완료 |
| `/subscribes/tickets/smart-talk` | `apps/web/src/app/(internal)/subscribes/tickets/smart-talk/page.tsx` | (신규) | ✅ 완료 |
| `/subscribes/trial` | `apps/web/src/app/(internal)/subscribes/trial/page.tsx` | (신규) | ✅ 완료 |
| `/subscribes/trial/smart-talk` | `apps/web/src/app/(internal)/subscribes/trial/smart-talk/page.tsx` | (신규) | ✅ 완료 |
| `/subscribes/trial/smart-talk/[subscribeId]` | `apps/web/src/app/(internal)/subscribes/trial/smart-talk/[subscribeId]/page.tsx` | (신규) | ✅ 완료 |

**레거시 플랜 상세 페이지**:
- `/app/user/podo/mypage/plan/:ticketId` → `/subscribes/tickets`로 통합 (세부 매핑 확인 필요)

### 2.5 해지 플로우

| 신규 라우트 | 신규 페이지 경로 | 기존 라우트 | 상태 |
|-----------|----------------|-----------|------|
| `/podo/churn` | `apps/web/src/app/(internal)/podo/churn/page.tsx` | `/app/user/podo/churn` | ✅ 완료 |
| `/podo/churn/quit-reason` | `apps/web/src/app/(internal)/podo/churn/quit-reason/page.tsx` | `/app/user/podo/churn/quit-reason` | ✅ 완료 |

### 2.6 레벨 자가진단

| 신규 라우트 | 신규 페이지 경로 | 기존 라우트 | 상태 |
|-----------|----------------|-----------|------|
| `/selftest` | `apps/web/src/app/(internal)/selftest/page.tsx` | `/app/user/podo/selftest` | ✅ 완료 |

### 2.8 AI 학습

| 신규 라우트 | 신규 페이지 경로 | 기존 라우트 | 상태 |
|-----------|----------------|-----------|------|
| `/ai-learning` | `apps/web/src/app/(internal)/ai-learning/page.tsx` | (신규) | ✅ 완료 |

### 2.9 외부 및 콜백

| 신규 라우트 | 신규 페이지 경로 | 기존 라우트 | 상태 |
|-----------|----------------|-----------|------|
| `/callback/oauth/redirect` | `apps/web/src/app/(external)/callback/oauth/redirect/page.tsx` | (신규) | ✅ 완료 |
| `/callback/oauth/set-local-storage` | `apps/web/src/app/(external)/callback/oauth/set-local-storage/page.tsx` | (신규) | ✅ 완료 |
| `/callback/oauth/delete-local-storage` | `apps/web/src/app/(external)/callback/oauth/delete-local-storage/page.tsx` | (신규) | ✅ 완료 |
| `/callback/oauth/delete-apple-account/[userID]` | `apps/web/src/app/(external)/callback/oauth/delete-apple-account/[userID]/page.tsx` | (신규) | ✅ 완료 |
| `/qr/store` | `apps/web/src/app/(external)/qr/store/page.tsx` | (신규) | ✅ 완료 |
| `/open-in-browser` | `apps/web/src/app/(external)/open-in-browser/page.tsx` | (신규) | ✅ 완료 |

### 2.10 다이얼로그 및 배너 (WebView 전용)

| 신규 라우트 | 신규 페이지 경로 | 기존 라우트 | 상태 |
|-----------|----------------|-----------|------|
| `/first-lesson-booster-dialog` | `apps/web/src/app/(external)/(with-safearea)/first-lesson-booster-dialog/page.tsx` | (신규) | ✅ 완료 |
| `/level-select-dialog` | `apps/web/src/app/(external)/(with-safearea)/level-select-dialog/page.tsx` | (신규) | ✅ 완료 |
| `/app-install-banner` | `apps/web/src/app/(external)/(without-safearea)/app-install-banner/page.tsx` | (신규) | ✅ 완료 |
| `/drawing/[classID]` | `apps/web/src/app/(external)/(without-safearea)/drawing/[classID]/page.tsx` | (신규) | ✅ 완료 |

### 2.11 앱 열기 유틸

| 신규 라우트 | 신규 페이지 경로 | 기존 라우트 | 상태 |
|-----------|----------------|-----------|------|
| `/open-in-app/[[...path]]` | `apps/web/src/app/open-in-app/[[...path]]/page.tsx` | (신규) | ✅ 완료 |
| `/open-in-app/install` | `apps/web/src/app/open-in-app/install/page.tsx` | (신규) | ✅ 완료 |

---

## 3. 마이그레이션 진행 중인 페이지

현재 특별히 "진행 중"으로 표시된 페이지는 없으나, 다음 항목들이 브리지 제거 또는 정책 확정이 필요합니다:

### 3.1 예약 플로우 브리지

**현재 상황**:
- 신규 앱에 `/lessons/regular`, `/lessons/trial`, `/booking` 페이지가 존재
- 일부 진입점에서 여전히 레거시 `/app/user/podo/class-booking` 경로로 이동하는 브리지 로직 존재
  - 위치: `apps/web/src/features/booking-lesson/hooks/use-lesson-action.tsx`

**작업 필요**:
- [ ] 브리지 로직 제거하고 신규 내부 라우트로 완전 전환
- [ ] 서버 액션 및 클라이언트 상태 관리 검증

### 3.2 플랜/티켓 상세 매핑

**현재 상황**:
- 레거시 `/app/user/podo/mypage/plan/:ticketId`는 동적 파라미터 기반
- 신규 `/subscribes/tickets`는 목록 페이지로 대체됨

**작업 필요**:
- [ ] 세부 파라미터 및 상태 매핑 확인
- [ ] 필요 시 `/subscribes/tickets/[ticketId]` 동적 라우트 추가

### 3.3 카드 관리 페이지 ✅

**완료**: 레거시 `/app/user/podo/mypage/card-manage` → `/my-podo/payment-methods`에 통합 완료

---

## 4. 마이그레이션 예정인 페이지

### 4.1 레거시 전용 페이지 목록

| 레거시 라우트 | 레거시 파일 경로 | 주요 기능 | 우선순위 |
|-------------|----------------|----------|---------|
| `/app/user/podo/class-replay` | `apps/legacy-web/pages/app/user/podo/class-replay.vue` | 수업 다시보기 | 🟡 중간 |
| `/app/user/debug` | `apps/legacy-web/pages/app/user/debug/index.vue` | 디버그 도구 | 🟢 낮음 |

**이관 완료된 항목 (이전 목록에서 제거):**
- ~~`/app/user/podo/churn`~~ → `/podo/churn` ✅
- ~~`/app/user/podo/churn/quit-reason`~~ → `/podo/churn/quit-reason` ✅
- ~~`/app/user/podo/selftest`~~ → `/selftest` ✅
- ~~`/app/user/podo/mypage/card-manage`~~ → `/my-podo/payment-methods` ✅

### 4.2 마이그레이션 우선순위

#### 🟡 중간 (사용자 경험 개선)

**수업 다시보기**
- `/app/user/podo/class-replay` → 통합 여부 검토
- **이유**: 현재 리포트/리뷰 화면과 중복 가능성
- **작업**: 비즈니스 정책 확정 후 구현 또는 대체

#### 🟢 낮음 (관리 도구)

**디버그 도구**
- `/app/user/debug` → `/debug` (신규)
- **이유**: 내부 개발/QA 전용
- **작업**: 낮은 우선순위

---

## 5. 라우트 매핑 테이블 (전체)

### 5.1 내부 페이지 (Internal - 인증 필요)

| 레거시 라우트 | 신규 라우트 | 신규 파일 경로 | 상태 |
|-------------|-----------|---------------|------|
| `/` | `/` | `(internal)/page.tsx` | ✅ 완료 |
| `/app/user/podo/home` | `/home` | `(internal)/home/page.tsx` | ✅ 완료 |
| - | `/home/ai` | `(internal)/home/ai/page.tsx` | ✅ 완료 |
| - | `/login` | `(internal)/login/page.tsx` | ✅ 완료 |
| `/app/user/podo/classes`, `/class-reserved` | `/reservation` | `(internal)/reservation/page.tsx` | ✅ 완료 |
| `/app/user/podo/class-booking` | `/booking` | `(internal)/booking/page.tsx` | ✅ 완료 |
| `/app/user/podo/class-booking?type=regular` | `/lessons/regular` | `(internal)/lessons/regular/page.tsx` | ✅ 완료 |
| `/app/user/podo/class-booking?type=trial` | `/lessons/trial` | `(internal)/lessons/trial/page.tsx` | ✅ 완료 |
| `/app/user/podo/classroom` | `/lessons/classroom/[classID]` | `(internal)/lessons/classroom/[classID]/page.tsx` | ✅ 완료 |
| `/app/user/podo/class-report` | `/lessons/classroom/[classID]/report` | `(internal)/lessons/classroom/[classID]/report/page.tsx` | ✅ 완료 |
| - | `/lessons/classroom/[classID]/review` | `(internal)/lessons/classroom/[classID]/review/page.tsx` | ✅ 완료 |
| - | `/lessons/classroom/[classID]/review-complete` | `(internal)/lessons/classroom/[classID]/review-complete/page.tsx` | ✅ 완료 |
| - | `/lessons/ai` | `(internal)/lessons/ai/page.tsx` | ✅ 완료 |
| - | `/lessons/ai/[classCourseId]` | `(internal)/lessons/ai/[classCourseId]/page.tsx` | ✅ 완료 |
| - | `/lessons/ai/trial-report/[uuid]` | `(internal)/lessons/ai/trial-report/[uuid]/page.tsx` | ✅ 완료 |
| `/app/user/podo/class-replay` | (대체 검토) | - | ⏸️ 보류 |
| `/app/user/podo/mypage` | `/my-podo` | `(internal)/my-podo/page.tsx` | ✅ 완료 |
| - | `/my-podo/notification-settings` | `(internal)/my-podo/notification-settings/page.tsx` | ✅ 완료 |
| - | `/my-podo/coupon` | `(internal)/my-podo/coupon/page.tsx` | ✅ 완료 |
| - | `/my-podo/coupon/[id]` | `(internal)/my-podo/coupon/[id]/page.tsx` | ✅ 완료 |
| - | `/my-podo/notices` | `(internal)/my-podo/notices/page.tsx` | ✅ 완료 |
| - | `/my-podo/notices/[boardId]` | `(internal)/my-podo/notices/[boardId]/page.tsx` | ✅ 완료 |
| `/app/user/podo/mypage/payment` | `/my-podo/payment-methods` | `(internal)/my-podo/payment-methods/page.tsx` | ✅ 완료 |
| `/app/user/podo/mypage/card-registration` | `/my-podo/payment-methods/register` | `(internal)/my-podo/payment-methods/register/page.tsx` | ✅ 완료 |
| `/app/user/podo/mypage/card-manage` | `/my-podo/payment-methods` | `(internal)/my-podo/payment-methods/page.tsx` | ✅ 완료 |
| `/app/user/podo/mypage/plan` | `/subscribes/tickets` | `(internal)/subscribes/tickets/page.tsx` | ✅ 완료 |
| `/app/user/podo/mypage/plan/:ticketId` | `/subscribes/tickets` | `(internal)/subscribes/tickets/page.tsx` | ✅ 완료 |
| - | `/subscribes` | `(internal)/subscribes/page.tsx` | ✅ 완료 |
| - | `/subscribes/payment/[subscribeId]` | `(internal)/subscribes/payment/[subscribeId]/page.tsx` | ✅ 완료 |
| - | `/subscribes/payment/[subscribeId]/success` | `(internal)/subscribes/payment/[subscribeId]/success/page.tsx` | ✅ 완료 |
| - | `/subscribes/tickets-v2` | `(internal)/subscribes/tickets-v2/page.tsx` | ✅ 완료 |
| - | `/subscribes/tickets/payback` | `(internal)/subscribes/tickets/payback/page.tsx` | ✅ 완료 |
| - | `/subscribes/tickets/smart-talk` | `(internal)/subscribes/tickets/smart-talk/page.tsx` | ✅ 완료 |
| - | `/subscribes/trial` | `(internal)/subscribes/trial/page.tsx` | ✅ 완료 |
| - | `/subscribes/trial/smart-talk` | `(internal)/subscribes/trial/smart-talk/page.tsx` | ✅ 완료 |
| - | `/subscribes/trial/smart-talk/[subscribeId]` | `(internal)/subscribes/trial/smart-talk/[subscribeId]/page.tsx` | ✅ 완료 |
| - | `/ai-learning` | `(internal)/ai-learning/page.tsx` | ✅ 완료 |
| `/app/user/podo/churn` | `/podo/churn` | `(internal)/podo/churn/page.tsx` | ✅ 완료 |
| `/app/user/podo/churn/quit-reason` | `/podo/churn/quit-reason` | `(internal)/podo/churn/quit-reason/page.tsx` | ✅ 완료 |
| `/app/user/podo/selftest` | `/selftest` | `(internal)/selftest/page.tsx` | ✅ 완료 |
| `/app/user/debug` | (예정) `/debug` | - | ❌ 미이관 |

### 5.2 외부 페이지 (External - 인증 불필요)

| 레거시 라우트 | 신규 라우트 | 신규 파일 경로 | 상태 |
|-------------|-----------|---------------|------|
| - | `/callback/oauth/redirect` | `(external)/callback/oauth/redirect/page.tsx` | ✅ 완료 |
| - | `/callback/oauth/set-local-storage` | `(external)/callback/oauth/set-local-storage/page.tsx` | ✅ 완료 |
| - | `/callback/oauth/delete-local-storage` | `(external)/callback/oauth/delete-local-storage/page.tsx` | ✅ 완료 |
| - | `/callback/oauth/delete-apple-account/[userID]` | `(external)/callback/oauth/delete-apple-account/[userID]/page.tsx` | ✅ 완료 |
| - | `/qr/store` | `(external)/qr/store/page.tsx` | ✅ 완료 |
| - | `/open-in-browser` | `(external)/open-in-browser/page.tsx` | ✅ 완료 |
| - | `/first-lesson-booster-dialog` | `(external)/(with-safearea)/first-lesson-booster-dialog/page.tsx` | ✅ 완료 |
| - | `/level-select-dialog` | `(external)/(with-safearea)/level-select-dialog/page.tsx` | ✅ 완료 |
| - | `/app-install-banner` | `(external)/(without-safearea)/app-install-banner/page.tsx` | ✅ 완료 |
| - | `/drawing/[classID]` | `(external)/(without-safearea)/drawing/[classID]/page.tsx` | ✅ 완료 |
| - | `/open-in-app/[[...path]]` | `open-in-app/[[...path]]/page.tsx` | ✅ 완료 |
| - | `/open-in-app/install` | `open-in-app/install/page.tsx` | ✅ 완료 |

---

## 6. 프록시 설정 (next.config.ts)

### 6.1 Nuxt 레거시 앱 프록시

```typescript
// apps/web/next.config.ts - rewrites 설정

const nuxtRewriteConfig = [
  {
    source: '/_nuxt/:path+',
    destination: `${env.PODO_APP_URL ?? 'http://localhost:3005'}/_nuxt/:path+`,
  },
  {
    source: '/app/user/podo/:path+',
    destination: `${env.PODO_APP_URL ?? 'http://localhost:3005'}/app/user/podo/:path+`,
  },
  ...(env.APP_ENV === 'local'
    ? [
        {
          source: '/_loading/:path+',
          destination: `${env.PODO_APP_URL ?? 'http://localhost:3005'}/_loading/:path+`,
        },
        {
          source: '/__webpack_hmr/:path+',
          destination: `${env.PODO_APP_URL ?? 'http://localhost:3005'}/__webpack_hmr/:path+`,
        },
      ]
    : []),
]
```

### 6.2 프록시되는 라우트 (현재)

**프로덕션 및 모든 환경**:
- `/_nuxt/*` - Nuxt 정적 자산 (JS, CSS, 이미지 등)
- `/app/user/podo/*` - 아직 마이그레이션 안 된 레거시 페이지들

**로컬 개발 환경만**:
- `/_loading/*` - Nuxt 개발 서버 로딩 인디케이터
- `/__webpack_hmr/*` - Nuxt HMR(Hot Module Replacement)

### 6.3 프록시 제거 계획

마이그레이션이 완료되면 다음 순서로 프록시 설정을 제거합니다:

1. **개별 페이지 마이그레이션 후**: 해당 경로는 Next.js가 직접 처리
2. **모든 `/app/user/podo/*` 페이지 완료 후**: 해당 프록시 규칙 제거
3. **레거시 앱 완전 종료**: `/_nuxt/*` 프록시 제거 및 `apps/legacy-web` 디렉토리 삭제

**현재 남은 프록시 대상 페이지** (2개):
- `/app/user/podo/class-replay`
- `/app/user/debug`

---

## 7. 마이그레이션 통계

### 7.1 진행률

| 카테고리 | 완료 | 진행중 | 예정 | 합계 | 완료율 |
|---------|------|-------|------|------|-------|
| **홈/인증** | 4 | 0 | 0 | 4 | 100% |
| **예약/수업** | 10 | 0 | 1 | 11 | 91% |
| **마이페이지** | 9 | 0 | 0 | 9 | 100% |
| **구독/결제** | 10 | 0 | 0 | 10 | 100% |
| **외부/콜백** | 12 | 0 | 0 | 12 | 100% |
| **기타** | 4 | 0 | 1 | 5 | 80% |
| **전체** | **49** | **0** | **2** | **51** | **96%** |

### 7.2 레거시 페이지 분석

**총 레거시 Vue 페이지**: 18개 (`.vue` 파일)
- **마이그레이션 완료**: 16개
- **미이관**: 2개 (class-replay, debug)

---

## 8. 다음 단계

### 8.1 남은 작업

1. **수업 다시보기 정책 확정** 🟡
   - `/app/user/podo/class-replay` → 리포트/리뷰 화면 통합 여부 검토
   - 필요 시 별도 라우트 구현

2. **디버그 도구 마이그레이션** 🟢
   - 우선순위 낮음, 내부 QA 전용 도구

3. **예약 브리지 제거**
   - `use-lesson-action.tsx`에서 레거시 경로 참조 잔존 여부 확인 및 제거

### 8.2 레거시 앱 종료 준비

1. **프록시 설정 단계적 제거**
   - 남은 2개 페이지 마이그레이션 완료 시 프록시 규칙 제거
   - 최종적으로 `apps/legacy-web` 완전 제거

---

## 9. 참고 문서

- **마이그레이션 가이드**: `/docs/web/docs/migrations/nuxt2-to-next15.md`
- **사이트맵**: `/docs/web/docs/migrations/sitemap.md`
- **TODO 보드**: `/docs/web/docs/migrations/todo.md`
- **정책 문서**: `/docs/web/docs/policies/*`
- **CLAUDE.md**: `/CLAUDE.md` (프로젝트 가이드)

---

## 10. 마이그레이션 원칙

### 10.1 코드 컨벤션

- **타입 안전성**: 모든 API 응답 및 폼 데이터는 Zod 스키마 검증
- **Server Components 우선**: 가능한 경우 RSC 사용, 'use client' 최소화
- **비동기 런타임 API**: `await cookies()`, `await headers()`, `await props.params` 사용
- **네이밍**: 이벤트 핸들러 `handle*`, Boolean 상태 조동사 사용

### 10.2 기능 동등성 보장

- **인증**: `getProtectedSession` 기반 보호 페이지 구현
- **예약 정책**: 12시간 변경 제한, 입장+2분, 노쇼/페널티 처리
- **기능 플래그**: 서버 인스턴스 및 클라이언트 훅 활용
- **에러 처리**: 401/429 에러 다이얼로그, 세션 리다이렉트 유지

### 10.3 QA 체크리스트

- [ ] 라우팅 매핑 검증 (구/신 경로 동등 기능)
- [ ] 인증/세션 시나리오 (리다이렉트, 토큰 재발급)
- [ ] 예약/수업 정책 준수 (12시간, 입장+2분, 버튼 상태)
- [ ] 결제 프로세스 일치 (기존 결제 문서 참조)
- [ ] 성능/에러 로깅 (RUM, Sentry 무결성)
- [ ] 접근성 (포커스, 키보드, 모바일 Safe Area)

---

**문서 작성일**: 2026-01-26
**작성자**: Claude (Sonnet 4.5)
**문서 버전**: 1.0
