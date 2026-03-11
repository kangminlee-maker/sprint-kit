# apps/web - Next.js 15 Web Application

## 개요

### 목적
Podo 서비스의 메인 웹 애플리케이션. 학생용 영어 학습 플랫폼으로 수업 예약, AI 학습, 구독 관리, 마이페이지 등의 기능을 제공합니다.

### 기술 스택
- **프레임워크**: Next.js 15 (App Router)
- **React**: React 19
- **스타일링**: Tailwind CSS
- **상태 관리**: TanStack Query v5
- **폼 관리**: overlay-kit, nuqs
- **모니터링**: Sentry, Datadog RUM, Pyroscope
- **결제**: 아임포트 (iamport)
- **인증**: 카카오 OAuth, 자체 세션
- **피처 플래그**: Flagsmith
- **디자인 시스템**: @design-system/podo, @podo-app/design-system-temp

### 포트 정보
- **개발 서버**: `3000` (기본)
- **레거시 웹 프록시**: `3005` (apps/legacy-web)
- **스탠드얼론 빌드**: `output: 'standalone'`

### 빌드 및 실행 명령어
```bash
# 개발
pnpm dev                          # Next.js 개발 서버 실행
pnpm dev:web                      # Web + legacy-web 실행

# 빌드
pnpm build                        # 프로덕션 빌드
pnpm -C apps/web build            # 직접 빌드

# 테스트
pnpm test:unit                    # Vitest 유닛 테스트

# 환경 변수 관리 (AWS CLI 필요)
pnpm env:download                 # S3에서 모든 env 파일 다운로드
pnpm env:upload                   # S3로 모든 env 파일 업로드
pnpm env:download:development     # development 환경만
pnpm env:download:staging         # staging 환경만
pnpm env:download:production      # production 환경만
pnpm env:download:temp            # temp 환경만
```

---

## 디렉토리 구조

### 루트 구조
```
apps/web/
├── src/                         # 소스 코드
│   ├── app/                     # Next.js App Router
│   ├── views/                   # 페이지 레벨 컴포넌트
│   ├── instrumentation.ts       # Next.js instrumentation (Sentry, Pyroscope)
│   ├── instrumentation-client.ts
│   └── middleware.ts            # Next.js 미들웨어
├── public/                      # 정적 파일
│   ├── fonts/
│   ├── images/
│   ├── svg/
│   ├── .well-known/             # Apple/Android app association
│   └── trial-reports/
├── next.config.ts               # Next.js 설정
├── tailwind.config.ts           # Tailwind 설정
├── tsconfig.json                # TypeScript 설정
├── vitest.config.mts            # Vitest 설정
├── sentry.server.config.ts      # Sentry 서버 설정
├── sentry.edge.config.ts        # Sentry Edge 설정
├── cache-handler.mjs            # Redis 캐시 핸들러
├── Dockerfile                   # 컨테이너 빌드
└── package.json
```

### src/ 상세 구조
```
src/
├── app/                         # App Router (라우트 정의)
│   ├── (internal)/              # 인증 필요한 내부 페이지
│   ├── (external)/              # 인증 불필요한 외부 페이지
│   ├── open-in-app/             # 앱 열기 유도 페이지
│   ├── layout.tsx               # 루트 레이아웃
│   └── page.tsx                 # 루트 페이지
├── server/                      # Hono BFF (이전 apps/server)
│   ├── app.ts                   # Hono 앱 엔트리포인트
│   ├── domains/                 # 도메인별 비즈니스 로직
│   ├── infrastructure/          # 외부 시스템 연동
│   ├── presentation/            # HTTP 레이어
│   └── shared/                  # 공통 유틸리티
├── core/                        # 핵심 인프라 레이어 (이전 apps/layers/core)
│   ├── api/                     # API 클라이언트 유틸리티
│   ├── env/                     # 환경 변수 관리
│   ├── middlewares/             # Next.js 미들웨어
│   ├── model/                   # 핵심 데이터 모델
│   └── providers/               # React Context Providers
├── entities/                    # 엔티티 레이어 (이전 apps/layers/entities)
│   ├── authentication/          # 인증 엔티티
│   ├── lesson/                  # 수업 엔티티
│   ├── payment/                 # 결제 엔티티
│   └── ...
├── features/                    # 기능 레이어 (이전 apps/layers/features)
│   ├── auth/                    # 인증/로그인
│   ├── booking-lesson/          # 수업 예약
│   ├── lesson/                  # 수업 관리
│   └── ...
├── shared/                      # 공유 레이어 (이전 apps/layers/shared)
│   ├── analytics/               # 분석 유틸리티
│   ├── apis/                    # 공통 API 클라이언트
│   ├── config/                  # 환경 변수 설정 (이전 @podo-app/env-config)
│   ├── hooks/                   # 공통 React Hooks
│   ├── libs/                    # 라이브러리 래퍼
│   ├── ui/                      # 공통 UI 컴포넌트
│   └── utils/                   # 유틸리티 함수
├── widgets/                     # 위젯 레이어 (이전 apps/layers/widgets)
│   ├── home-banners/            # 홈 배너 캐러셀
│   ├── home-popup/              # 홈 팝업
│   ├── welcomeback-popup/       # 이탈 고객 프로모션 팝업
│   └── ...
├── views/                       # 페이지 레벨 뷰 컴포넌트
└── middleware.ts                # 미들웨어 체인
```

### Import Alias (tsconfig.json)
```typescript
{
  "@svg/*": ["./public/svg/*"],              // SVG 아이콘
  "@core/*": ["./src/core/*"],               // 핵심 레이어
  "@views/*": ["./src/views/*"],             // 뷰 컴포넌트
  "@widgets/*": ["./src/widgets/*"],         // 위젯
  "@features/*": ["./src/features/*"],       // 기능 모듈
  "@entities/*": ["./src/entities/*"],       // 엔티티
  "@shared/*": ["./src/shared/*"]            // 공유 레이어
}
```

---

## App Router 라우팅 구조

### 라우트 그룹 개요
- `(internal)`: 인증이 필요한 내부 페이지 (메인 앱)
- `(external)`: 인증이 불필요한 외부 페이지 (콜백, 다이얼로그 등)
- `open-in-app`: 앱 설치/열기 유도 페이지

### (internal) 라우트 - 인증 필요

#### 파일 경로: `~/podo-app-DOC/apps/web/src/app/(internal)/`

| 라우트 | 페이지 | 설명 |
|--------|--------|------|
| `/` | `page.tsx` | 루트 리다이렉트 (홈으로) |
| `/home` | `home/page.tsx` | 메인 홈 화면 |
| `/home/ai` | `home/ai/page.tsx` | AI 홈 화면 |
| `/booking` | `booking/page.tsx` | 수업 예약 페이지 |
| `/ai-learning` | `ai-learning/page.tsx` | AI 학습 메인 |
| `/reservation` | `reservation/page.tsx` | 예약 관리 페이지 |
| `/my-podo` | `my-podo/page.tsx` | 마이포도 메인 |
| `/my-podo/coupon` | `my-podo/coupon/page.tsx` | 쿠폰 목록 |
| `/my-podo/coupon/[id]` | `my-podo/coupon/[id]/page.tsx` | 쿠폰 상세 |
| `/my-podo/notices` | `my-podo/notices/page.tsx` | 공지사항 목록 |
| `/my-podo/notices/[boardId]` | `my-podo/notices/[boardId]/page.tsx` | 공지사항 상세 |
| `/my-podo/notification-settings` | `my-podo/notification-settings/page.tsx` | 알림 설정 |
| `/my-podo/payment-methods` | `my-podo/payment-methods/page.tsx` | 결제수단 목록 |
| `/my-podo/payment-methods/register` | `my-podo/payment-methods/register/page.tsx` | 결제수단 등록 |
| `/login` | `login/page.tsx` | 로그인 페이지 |

#### Lessons 라우트
| 라우트 | 페이지 | 설명 |
|--------|--------|------|
| `/lessons/regular` | `lessons/regular/page.tsx` | 정규 수업 목록 |
| `/lessons/trial` | `lessons/trial/page.tsx` | 체험 수업 목록 |
| `/lessons/ai` | `lessons/ai/page.tsx` | AI 수업 목록 |
| `/lessons/ai/[classCourseId]` | `lessons/ai/[classCourseId]/page.tsx` | AI 수업 상세 |
| `/lessons/ai/trial-report/[uuid]` | `lessons/ai/trial-report/[uuid]/page.tsx` | AI 체험 리포트 |
| `/lessons/classroom/[classID]` | `lessons/classroom/[classID]/page.tsx` | 수업 진행 화면 |
| `/lessons/classroom/[classID]/review` | `lessons/classroom/[classID]/review/page.tsx` | 수업 리뷰 작성 |
| `/lessons/classroom/[classID]/review-complete` | `lessons/classroom/[classID]/review-complete/page.tsx` | 리뷰 완료 |
| `/lessons/classroom/[classID]/report` | `lessons/classroom/[classID]/report/page.tsx` | 수업 리포트 |

#### Subscribes 라우트
| 라우트 | 페이지 | 설명 |
|--------|--------|------|
| `/subscribes` | `subscribes/page.tsx` | 구독 목록 |
| `/subscribes/payment/[subscribeId]` | `subscribes/payment/[subscribeId]/page.tsx` | 구독 결제 |
| `/subscribes/payment/[subscribeId]/success` | `subscribes/payment/[subscribeId]/success/page.tsx` | 결제 성공 |
| `/subscribes/tickets` | `subscribes/tickets/page.tsx` | 이용권 목록 |
| `/subscribes/tickets-v2` | `subscribes/tickets-v2/page.tsx` | 이용권 목록 v2 |
| `/subscribes/tickets/smart-talk` | `subscribes/tickets/smart-talk/page.tsx` | 스마트톡 이용권 |
| `/subscribes/tickets/payback` | `subscribes/tickets/payback/page.tsx` | 페이백 이용권 |
| `/subscribes/trial` | `subscribes/trial/page.tsx` | 체험 구독 |
| `/subscribes/trial/smart-talk` | `subscribes/trial/smart-talk/page.tsx` | 스마트톡 체험 |
| `/subscribes/trial/smart-talk/[subscribeId]` | `subscribes/trial/smart-talk/[subscribeId]/page.tsx` | 스마트톡 체험 상세 |

### (external) 라우트 - 인증 불필요

#### 파일 경로: `~/podo-app-DOC/apps/web/src/app/(external)/`

| 라우트 | 페이지 | 설명 |
|--------|--------|------|
| `/callback/oauth/redirect` | `callback/oauth/redirect/page.tsx` | OAuth 리다이렉트 |
| `/callback/oauth/set-local-storage` | `callback/oauth/set-local-storage/page.tsx` | 로컬스토리지 설정 |
| `/callback/oauth/delete-local-storage` | `callback/oauth/delete-local-storage/page.tsx` | 로컬스토리지 삭제 |
| `/callback/oauth/delete-apple-account/[userID]` | `callback/oauth/delete-apple-account/[userID]/page.tsx` | Apple 계정 삭제 |
| `/open-in-browser` | `open-in-browser/page.tsx` | 브라우저에서 열기 |
| `/qr/store` | `qr/store/page.tsx` | QR 스토어 페이지 |

#### (with-safearea) - Safe Area 있는 외부 페이지
| 라우트 | 페이지 | 설명 |
|--------|--------|------|
| `/level-select-dialog` | `(with-safearea)/level-select-dialog/page.tsx` | 레벨 선택 다이얼로그 |
| `/first-lesson-booster-dialog` | `(with-safearea)/first-lesson-booster-dialog/page.tsx` | 첫 수업 부스터 다이얼로그 |

#### (without-safearea) - Safe Area 없는 외부 페이지
| 라우트 | 페이지 | 설명 |
|--------|--------|------|
| `/app-install-banner` | `(without-safearea)/app-install-banner/page.tsx` | 앱 설치 배너 |
| `/drawing/[classID]` | `(without-safearea)/drawing/[classID]/page.tsx` | 그리기 화면 |

### open-in-app 라우트

#### 파일 경로: `~/podo-app-DOC/apps/web/src/app/open-in-app/`

| 라우트 | 페이지 | 설명 |
|--------|--------|------|
| `/open-in-app/install` | `install/page.tsx` | 앱 설치 유도 |
| `/open-in-app/[[...path]]` | `[[...path]]/page.tsx` | 앱 열기 유도 (catch-all) |

### API 라우트
API 라우트는 `(external)/api/` 내에 정의되지만, 실제 BFF는 `apps/server`에서 처리됩니다.

---

## 미들웨어 체인

### 파일 경로
- **미들웨어 정의**: `~/podo-app-DOC/apps/web/src/middleware.ts`
- **미들웨어 구현**: `~/podo-app-DOC/apps/web/src/core/middlewares/`

### 체인 순서
```typescript
chainMiddleware([
  withKakaoInAppBlock,    // 1. 카카오 인앱 브라우저 차단
  withNativeStore,        // 2. 네이티브 앱 정보 저장
  withSession,            // 3. 세션 인증 및 쿠키 처리
  withMarketing,          // 4. 마케팅 파라미터 처리
  withProtectedRoute      // 5. 보호된 라우트 접근 제어
])
```

### 각 미들웨어 역할

#### 1. `withKakaoInAppBlock`
- **파일**: `apps/web/src/core/middlewares/withKakaoInAppBlock.ts`
- **역할**: 카카오톡 인앱 브라우저에서 접속 시 외부 브라우저로 유도
- **동작**: User-Agent 체크 → 카카오 인앱일 경우 `/open-in-browser` 리다이렉트

#### 2. `withNativeStore`
- **파일**: `apps/web/src/core/middlewares/withNativeStore.ts`
- **역할**: 네이티브 앱에서 전달된 정보를 쿠키에 저장
- **저장 정보**:
  - `from`: 앱 출처 (podo-app-tutor, podo-app-student)
  - `os`: 운영체제 (ios, android)
  - `runtimeVersion`: 앱 런타임 버전
  - `latestRuntimeVersion`: 최신 런타임 버전
  - `userAgent`: User-Agent

#### 3. `withSession`
- **파일**: `apps/web/src/core/middlewares/withSession.ts`
- **역할**: 세션 인증 및 쿠키 관리
- **동작**:
  - `accessToken`, `uid` 쿠키 검증
  - Redis에서 토큰-uid 매핑 확인
  - 만료된 토큰 갱신 또는 삭제

#### 4. `withMarketing`
- **파일**: `apps/web/src/core/middlewares/withMarketing.ts`
- **역할**: 마케팅 파라미터 추출 및 쿠키 저장
- **저장 파라미터**:
  - UTM 파라미터 (utm_source, utm_medium, utm_campaign 등)
  - 레퍼러 정보

#### 5. `withProtectedRoute`
- **파일**: `apps/web/src/core/middlewares/withProtectedRoute.ts`
- **역할**: 인증이 필요한 라우트 접근 제어
- **동작**:
  - `(internal)` 라우트 그룹에 대해 인증 체크
  - 미인증 시 `/login`으로 리다이렉트
  - 로그인 후 원래 페이지로 복귀

### 미들웨어 매처 (Matcher)
```typescript
export const config: MiddlewareConfig = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.js$|.*\\.css$|.*\\.mp3$|favicon.ico|sitemap.xml|robots.txt|\\.well-known).*)',
  ],
}
```
- **제외 대상**: API, 정적 파일, 이미지, 아이콘, sitemap, robots.txt 등

---

## Layers 아키텍처 (Feature-Sliced Design)

apps/web은 Feature-Sliced Design 계층 구조를 따릅니다. 이전에 `apps/layers/` 디렉토리에 있던 레이어들이 `apps/web/src/` 내부로 이동되었습니다 (PODOZ-1875 마이그레이션).

### Layers 위치
**디렉토리**: `~/podo-app-DOC/apps/web/src/` (core, entities, features, shared, widgets)

### 1. Core Layer (`@core/*`)
**위치**: `apps/web/src/core/`

핵심 인프라 및 전역 설정을 담당합니다.

#### 구조
```
core/src/
├── api/                # API 클라이언트 유틸리티
├── env/                # 환경 변수 관리
├── middlewares/        # Next.js 미들웨어
│   ├── chain.ts
│   ├── withKakaoInAppBlock.ts
│   ├── withNativeStore.ts
│   ├── withSession.ts
│   ├── withMarketing.ts
│   └── withProtectedRoute.ts
├── model/              # 핵심 데이터 모델
├── providers/          # React Context Providers
│   ├── AuthenticationProvider.tsx
│   ├── BottomNavigationVisibilityProvider.tsx
│   ├── FeatureFlagProvider.tsx
│   ├── NativeBridgeStoreProvider.tsx
│   ├── OverlayRootProvider.tsx
│   ├── ScriptProvider.tsx
│   ├── SentryUserProvider.tsx
│   └── TanstackQueryClientProvider.tsx
└── styles/             # 전역 스타일
    └── global.css
```

#### 주요 Providers
- **AuthenticationProvider**: 인증 상태 관리
- **TanstackQueryClientProvider**: React Query 클라이언트
- **FeatureFlagProvider**: Flagsmith 피처 플래그
- **NativeBridgeStoreProvider**: 네이티브 앱 브릿지 상태
- **OverlayRootProvider**: overlay-kit 루트
- **SentryUserProvider**: Sentry 사용자 추적

### 2. Shared Layer (`@shared/*`)
**위치**: `apps/web/src/shared/`

도메인에 독립적인 공유 유틸리티, UI, 훅을 제공합니다.

#### 구조
```
shared/src/
├── analytics/          # 분석 유틸리티 (GA4, Datadog)
├── apis/               # 공통 API 클라이언트
│   ├── auth/
│   ├── booking/
│   ├── lesson/
│   ├── payment/
│   └── subscribe/
├── constants/          # 상수 정의
├── database/           # 로컬 DB 유틸리티
├── hooks/              # 공통 React Hooks
│   ├── useBottomNavigation.ts
│   ├── useDeviceInfo.ts
│   ├── useFeatureFlag.ts
│   ├── useNativeBridge.ts
│   └── ...
├── libs/               # 라이브러리 래퍼
│   ├── iamport/        # 아임포트 결제
│   ├── kakao/          # 카카오 SDK
│   ├── sentry/         # Sentry 에러 추적
│   └── webview-bridge/ # 웹뷰 브릿지
├── marketing/          # 마케팅 유틸리티
├── models/             # 공통 데이터 모델
├── types/              # TypeScript 타입 정의
├── ui/                 # 공통 UI 컴포넌트
│   ├── BottomNavigationBar/
│   ├── BottomStickyContainer/
│   ├── ContentSection/
│   ├── PageContentView/
│   ├── SafeAreaView/
│   ├── Toaster/
│   └── ...
└── utils/              # 유틸리티 함수
```

#### 주요 Hooks
- `useBottomNavigation`: 하단 네비게이션 제어
- `useFeatureFlag`: 피처 플래그 조회
- `useNativeBridge`: 네이티브 앱과 통신
- `useAuthentication`: 인증 상태 조회
- `useDeviceInfo`: 디바이스 정보

### 3. Features Layer (`@features/*`)
**위치**: `apps/web/src/features/`

비즈니스 도메인별 기능 모듈을 제공합니다.

#### 구조
```
features/src/
├── auth/               # 인증/로그인
├── booking-lesson/     # 수업 예약
├── class-preparation/  # 수업 준비
├── coupon/             # 쿠폰
├── delivery/           # 배송
├── home-greeting/      # 홈 인사말
├── home-redirection/   # 홈 리다이렉션
├── lesson/             # 수업 관리
├── lesson-onboarding/  # 수업 온보딩
├── lesson-report/      # 수업 리포트
├── lesson-review/      # 수업 리뷰
├── my-podo-sections/   # 마이포도 섹션
├── native/             # 네이티브 앱 연동
├── payment/            # 결제
├── payment-methods/    # 결제수단
├── payment-type/       # 결제 유형
├── redirect/           # 리다이렉션
├── subscribes/         # 구독
├── trial-tutorial/     # 체험 튜토리얼
└── user/               # 사용자
```

#### Feature 구조 예시 (`booking-lesson/`)
```
booking-lesson/
├── api/                # API 호출 함수
├── hooks/              # 도메인 특화 훅
├── models/             # 데이터 모델 및 타입
├── ui/                 # Feature 전용 UI 컴포넌트
└── index.ts            # Public API
```

### 4. Entities Layer (`@entities/*`)
**위치**: `apps/web/src/entities/`

비즈니스 엔티티 및 데이터 모델을 정의합니다.

#### 구조
```
entities/src/
├── authentication/     # 인증 엔티티
├── configuration/      # 설정
├── coupon/             # 쿠폰 엔티티
├── feature-flag/       # 피처 플래그 엔티티
├── first-lesson-booster/ # 첫 수업 부스터
├── lesson/             # 수업 엔티티
│   ├── api/
│   │   └── lesson.action.ts  # 수업 관련 API 액션 (cancelBookingAction 등)
│   └── model/
│       └── schemas/
│           └── lesson.ts     # Zod 스키마 (createBaseResponseSchema 기반, data 필드 사용)
├── notice/             # 공지사항
├── payment/            # 결제 엔티티
├── payment-methods/    # 결제수단 엔티티
├── popups/             # 팝업
├── pre-study/          # 예습
├── subscribes/         # 구독 엔티티
│   ├── model/
│   ├── api/
│   └── types/
├── trial-tutorial/     # 체험 튜토리얼 엔티티
├── tutor/              # 튜터 엔티티
└── users/              # 사용자 엔티티
```

#### Lesson 엔티티 API 응답 형식 (중요)
Lesson 관련 API 응답은 `createBaseResponseSchema`를 사용하며, 데이터는 `result` 대신 `data` 필드로 접근합니다.

```typescript
// 응답 형식 (예: getBookingLectureInfoResponse)
{
  resultCd: number,        // 숫자형 결과 코드 (예: 200, 500)
  resultCdName: string,    // 결과 코드 이름
  message: string | null,  // 메시지
  data: T                  // 실제 데이터 (구 result 필드 대체)
}
```

### 5. Widgets Layer (`@widgets/*`)
**위치**: `apps/web/src/widgets/`

여러 features를 조합한 복합 UI 위젯입니다.

#### 구조
```
widgets/src/
├── bottom-navigation-with-condition/  # 조건부 하단 네비게이션
├── class-preparation/                 # 수업 준비 위젯
├── completed-lessons/                 # 완료된 수업
├── greeting/                          # 인사말 위젯
├── home-banners/                      # 홈 배너 캐러셀
│   ├── ui/home-banner-carousel.tsx    # 홈 배너 캐러셀 컴포넌트
│   └── ui/welcomeback-banner.tsx      # 이탈 고객 전용 배너 (NEW)
├── home-navigation/                   # 홈 네비게이션
├── home-popup/                        # 홈 팝업
├── lesson-card/                       # 수업 카드
├── lesson-detail-list/                # 수업 상세 목록
├── reserved-lessons/                  # 예약된 수업
├── subscribe-tabs/                    # 구독 탭
├── ticket-details-modal/              # 이용권 상세 모달
├── trial-lesson-detail-list/          # 체험 수업 상세 목록
├── tutor-profile/                     # 튜터 프로필
└── welcomeback-popup/                 # 이탈 고객 프로모션 팝업 (NEW)
    ├── ui/welcomeback-popup.tsx       # 풀페이지 프로모션 팝업
    └── ui/welcomeback-popup-client.tsx # 클라이언트 전용 팝업
```

### Layers 의존성 규칙
```
app → views → widgets → features → entities → shared → core
```
- 하위 레이어는 상위 레이어를 import할 수 없습니다.
- `shared`와 `core`는 모든 레이어에서 사용 가능합니다.

---

## Views 레이어

### 위치
**디렉토리**: `~/podo-app-DOC/apps/web/src/views/`

### 역할
페이지 레벨의 뷰 컴포넌트를 정의합니다. App Router의 `page.tsx`는 해당 view를 렌더링하는 얇은 래퍼입니다.

### 전체 View 목록

| View 디렉토리 | 설명 | 파일 경로 |
|---------------|------|-----------|
| `ai-learning/` | AI 학습 메인 페이지 | `src/views/ai-learning/` |
| `app-redirect/` | 앱 리다이렉트 페이지 | `src/views/app-redirect/` |
| `booking/` | 수업 예약 페이지 | `src/views/booking/` |
| `character-chat-detail/` | 캐릭터 채팅 상세 | `src/views/character-chat-detail/` |
| `character-chat-home/` | 캐릭터 채팅 홈 | `src/views/character-chat-home/` |
| `class-room/` | 수업 진행 화면 | `src/views/class-room/` |
| `coupon-detail/` | 쿠폰 상세 | `src/views/coupon-detail/` |
| `delete-local-storage/` | 로컬스토리지 삭제 | `src/views/delete-local-storage/` |
| `external-lesson-booster-dialog/` | 외부 수업 부스터 다이얼로그 | `src/views/external-lesson-booster-dialog/` |
| `external-level-select-dialog/` | 외부 레벨 선택 다이얼로그 | `src/views/external-level-select-dialog/` |
| `external-pre-study-dialog/` | 외부 예습 다이얼로그 | `src/views/external-pre-study-dialog/` |
| `external-redirect-subscribe-list/` | 외부 구독 목록 리다이렉트 | `src/views/external-redirect-subscribe-list/` |
| `gateway/` | 게이트웨이 페이지 | `src/views/gateway/` |
| `home/` | 홈 페이지 | `src/views/home/` |
| `lesson-report/` | 수업 리포트 | `src/views/lesson-report/` |
| `lesson-review/` | 수업 리뷰 작성 | `src/views/lesson-review/` |
| `lesson-review-complete/` | 리뷰 작성 완료 | `src/views/lesson-review-complete/` |
| `login/` | 로그인 페이지 | `src/views/login/` |
| `my-coupon/` | 내 쿠폰 목록 | `src/views/my-coupon/` |
| `notice-detail/` | 공지사항 상세 | `src/views/notice-detail/` |
| `notice-list/` | 공지사항 목록 | `src/views/notice-list/` |
| `notification-setting/` | 알림 설정 | `src/views/notification-setting/` |
| `register-payment-methods/` | 결제수단 등록 | `src/views/register-payment-methods/` |
| `registered-payment-methods/` | 등록된 결제수단 목록 | `src/views/registered-payment-methods/` |
| `regular-lesson-detail-page/` | 정규 수업 상세 | `src/views/regular-lesson-detail-page/` |
| `reservation/` | 예약 관리 | `src/views/reservation/` |
| `smart-talk-payment/` | 스마트톡 결제 | `src/views/smart-talk-payment/` |
| `smart-talk-tickets/` | 스마트톡 이용권 | `src/views/smart-talk-tickets/` |
| `smart-talk-trial-subscribes/` | 스마트톡 체험 구독 | `src/views/smart-talk-trial-subscribes/` |
| `subscribe-list/` | 구독 목록 | `src/views/subscribe-list/` |
| `subscribe-payment/` | 구독 결제 | `src/views/subscribe-payment/` |
| `subscribe-payment-success/` | 구독 결제 성공 | `src/views/subscribe-payment-success/` |
| `subscribes-payment-type/` | 구독 결제 유형 | `src/views/subscribes-payment-type/` |
| `subscribes-tickets-v2/` | 이용권 목록 v2 | `src/views/subscribes-tickets-v2/` |
| `trial-lesson-detail-page/` | 체험 수업 상세 | `src/views/trial-lesson-detail-page/` |
| `trial-subscribes/` | 체험 구독 | `src/views/trial-subscribes/` |
| `tutor-lesson-topics-select/` | 튜터 수업 주제 선택 | `src/views/tutor-lesson-topics-select/` |

### View 구조 예시 (`home/`)
```
home/
├── view.tsx            # 메인 뷰 컴포넌트 (Client Component)
├── error.tsx           # 에러 폴백
└── index.ts            # Public export
```

### class-room/ 뷰 구조
```
class-room/
├── view.tsx                   # 수업 진행 메인 뷰 (Client Component)
├── check-device-pen-mode.ts   # 디바이스 펜 모드 지원 여부 감지 유틸리티 (NEW)
├── custom-audio-player.tsx    # 커스텀 오디오 플레이어
└── index.ts                   # Public export
```

### booking/ 뷰 구조
```
booking/
├── api/
│   └── booking.action.ts      # 예약/변경 API 액션 (ScheduleResponse 타입: resultCd는 number, data 필드 사용)
├── hooks/
│   ├── use-booking-data.ts    # 예약 데이터 훅 (lectureInfoData?.data 접근)
│   ├── use-booking-mutation.ts # 예약/변경 뮤테이션 훅 (resultCd 숫자 비교, message 필드 사용)
│   └── use-schedule.ts        # 스케줄 조회 훅 (res.resultCd === 200, res.data 접근)
└── ...
```

**booking/ API 응답 형식 (중요)**: `ScheduleResponse`는 `resultCd: number`, `data` 필드를 사용합니다 (구 `result` 필드 대체). 에러 메시지는 `response.message`로 접근합니다.

### View 사용 패턴
```tsx
// app/(internal)/home/page.tsx
import { HomePageView } from '@views/home'

export default async function HomePage({ searchParams }) {
  const params = await searchParams
  return <HomePageView tutorIdParam={params.tutorId} />
}
```

---

## 환경 변수 관리

### 환경 변수 파일 구조
```
apps/web/
├── .env.local           # 로컬 개발 (git ignored)
├── .env.development     # 개발 환경 (S3 동기화)
├── .env.staging         # 스테이징 환경 (S3 동기화)
├── .env.production      # 프로덕션 환경 (S3 동기화)
└── .env.temp            # 임시 환경 (S3 동기화)
```

### S3 버킷 위치
- **버킷**: `podo-config`
- **경로**: `podo-config/podo-web/`

### 환경별 사용 목적
| 환경 | APP_ENV | 용도 |
|------|---------|------|
| local | `local` | 로컬 개발 (localhost:3000) |
| development | `development` | 개발 서버 |
| staging | `staging` | 스테이징 서버 |
| qa | `qa` | QA 전용 배포 환경 (NEW) |
| production | `production` | 프로덕션 서버 |
| temp | `temp` | 임시 테스트 환경 |

### 환경 변수 스키마 검증
환경 변수는 `apps/web/src/shared/config/env/` 모듈에서 Zod로 검증됩니다.

**스키마 위치**: `apps/web/src/shared/config/env/schemas.ts`

#### 주요 환경 변수 예시
```typescript
// Server-side variables
PODO_API_URL                    // Podo API 엔드포인트
PODO_APP_URL                    // Podo App URL (legacy-web proxy)
REDIS_HOST                      // Redis 호스트
REDIS_PORT                      // Redis 포트
REDIS_PASSWORD                  // Redis 비밀번호
KAKAO_CLIENT_ID                 // 카카오 OAuth 클라이언트 ID
KAKAO_REDIRECT_URI              // 카카오 OAuth Redirect URI

// Client-side variables (NEXT_PUBLIC_*)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID      // GA4 Measurement ID
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID    // GTM Container ID
NEXT_PUBLIC_KAKAO_APP_KEY            // 카카오 JavaScript 키
NEXT_PUBLIC_DATADOG_APPLICATION_ID   // Datadog RUM Application ID
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN     // Datadog RUM Client Token
NEXT_PUBLIC_SENTRY_DSN               // Sentry DSN

// Build & Deploy
CDN_BASE_URL                    // CDN 베이스 URL (assetPrefix)
APP_ENV                         // 환경 구분 (local, development, staging, production)
```

### 환경 변수 사용 방법
```typescript
import { env } from '@shared/config/env'

// 서버 컴포넌트 또는 API 라우트에서
const apiUrl = env.PODO_API_URL

// 클라이언트 컴포넌트에서
const gaId = env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
```

---

## 레거시 연동 (legacy-web)

### 프록시 설정

apps/web은 일부 경로를 `apps/legacy-web` (Nuxt.js, 포트 3005)로 프록시합니다.

#### 프록시 경로 (next.config.ts)
```typescript
// 1. Nuxt 프록시
{
  source: '/_nuxt/:path+',
  destination: 'http://localhost:3005/_nuxt/:path+'
}
{
  source: '/app/user/podo/:path+',
  destination: 'http://localhost:3005/app/user/podo/:path+'
}

// 2. Gwatop (Admin) 프록시
{
  source: '/js/:path+',
  destination: 'https://dev-grape.re-speak.com/js/:path+'
}
{
  source: '/app/android/:path+',
  destination: 'https://dev-grape.re-speak.com/app/android/:path+'
}

// 3. Podolingo 프록시
{
  source: '/beta/pl/:path*',
  destination: 'http://localhost:3000/beta/pl/:path*'
}
```

### 로컬 개발 시 주의사항
1. **legacy-web 실행 필수**
   ```bash
   pnpm -C apps/legacy-web dev
   ```
   - 레거시 서버가 실행되지 않으면 `ECONNREFUSED` 에러 발생
   - 프록시 대상: `/_nuxt/*`, `/app/user/podo/*`

2. **Redis 설정**
   - `accessToken` → `uid` 매핑이 Redis에 저장되어야 함
   - 로컬 Redis에 dev 환경 토큰 등록 필요

3. **카카오 OAuth Redirect URI**
   - 반드시 `http://localhost:3000/api/v1/oauth/kakao`로 설정
   - 카카오 개발자 콘솔에서 URI 등록 필요

---

## 모니터링 및 분석

### Sentry
- **설정 파일**:
  - `sentry.server.config.ts`: 서버 사이드
  - `sentry.edge.config.ts`: Edge 런타임
- **터널 라우트**: `/monitoring` (광고 차단 우회)
- **활성화 조건**: `SENTRY_ENABLED=true`

### Datadog RUM
- **클라이언트 초기화**: `@shared/analytics/datadog`
- **환경 변수**:
  - `NEXT_PUBLIC_DATADOG_APPLICATION_ID`
  - `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN`

### Pyroscope (성능 프로파일링)
- **설정 파일**: `PYROSCOPE_SETUP.md`
- **초기화**: `src/instrumentation.ts`

### Google Analytics 4 (GA4)
- **초기화**: `app/layout.tsx` (Script 태그)
- **Measurement ID**: `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`

### Google Tag Manager (GTM)
- **초기화**: `app/layout.tsx` (Script 태그)
- **Container ID**: `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`

---

## Next.js 설정 (next.config.ts)

### 주요 설정

#### Output
```typescript
output: 'standalone'
```
- 독립 실행형 빌드 (Docker 최적화)

#### Transpile Packages
```typescript
transpilePackages: [
  '@design-system/podo',
  '@design-system/core',
  '@podo/assets',
  '@tanstack/react-query',
  '@tanstack/query-core',
  '@layers/shared',
]
```
- 구 버전 브라우저 지원

#### CDN (Asset Prefix)
```typescript
assetPrefix: env.CDN_BASE_URL  // production만
```
- 정적 파일을 CloudFront CDN에서 서빙

#### SVG 지원
```typescript
webpack: (config) => {
  config.module.rules.push({
    test: /\.svg$/,
    use: ['@svgr/webpack'],
  })
  return config
}
```
- SVG를 React 컴포넌트로 import

#### Cache Handler
```typescript
cacheHandler: require.resolve('./cache-handler.mjs')
```
- Redis 기반 ISR 캐싱 (cache-handler.mjs)

#### ESLint
```typescript
eslint: {
  ignoreDuringBuilds: false,  // 빌드 시 ESLint 에러 차단
  dirs: ['src'],
}
```

#### Console 제거 (Production)
```typescript
compiler: {
  removeConsole: true  // production만
}
```

---

## 테스트

### Vitest 설정
- **설정 파일**: `vitest.config.mts`
- **Setup 파일**: `vitest.setup.ts`
- **테스트 파일**: `**/*.test.{ts,tsx}`

### 실행 명령어
```bash
pnpm test:unit          # 유닛 테스트 실행
```

### 테스트 환경
- **환경**: jsdom
- **라이브러리**:
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `vitest`

---

## 디자인 시스템

### 사용 중인 디자인 시스템
1. **@design-system/podo**: Podo 전용 디자인 시스템 (Storybook)
2. **@podo-app/design-system-temp**: 임시 디자인 시스템 (마이그레이션 중)
3. **Tailwind CSS**: 유틸리티 CSS

### 디자인 토큰
- **패키지**: `@packages/design-token`
- **토큰 계층**: Static Tokens → Semantic Tokens → Scale Tokens

### Tailwind 플러그인
- `tailwindcss-safe-area`: iOS/Android Safe Area 대응
- `tailwind-scrollbar-hide`: 스크롤바 숨김

---

## 빌드 및 배포

### Docker 빌드
```bash
docker build -f apps/web/Dockerfile .
```

### 빌드 출력
```
.next/standalone/       # 독립 실행형 서버
.next/static/           # 정적 파일 (CDN 업로드)
```

### 배포 환경
- **인프라**: AWS EKS (Kubernetes)
- **이미지 레지스트리**: Amazon ECR
- **CI/CD**: GitHub Actions
- **CDN**: CloudFront

### Blue/Green 배포
환경 변수 파일도 Blue/Green을 지원합니다:
- `.env.blue`
- `.env.green`

---

## 주요 외부 서비스 연동

### 1. Kakao
- **OAuth 로그인**: Kakao Login
- **SDK**: Kakao JavaScript SDK
- **환경 변수**:
  - `KAKAO_CLIENT_ID` (서버)
  - `NEXT_PUBLIC_KAKAO_APP_KEY` (클라이언트)

### 2. 아임포트 (Iamport)
- **용도**: PG 결제 통합
- **SDK**: `@shared/libs/iamport`
- **스크립트**: `https://cdn.iamport.kr/v1/iamport.js`

### 3. Flagsmith
- **용도**: 피처 플래그 관리
- **Provider**: `FeatureFlagProvider`
- **사용**: `useFeatureFlag` 훅

### 4. Redis
- **용도**:
  - 세션 관리 (accessToken → uid)
  - ISR 캐싱
- **연결**: `ioredis`

---

## 개발 가이드

### 로컬 개발 시작

#### 1. 환경 변수 다운로드
```bash
pnpm env:download
```
- AWS CLI 설치 및 로그인 필요
- S3 `podo-config` 버킷 접근 권한 필요

#### 2. 레거시 웹 실행
```bash
pnpm -C apps/legacy-web dev
```

#### 3. Redis 설정
로컬 Redis에 dev 환경 토큰 등록:
```bash
# Redis CLI
SET "dev-access-token-value" "dev-uid-value"
```

#### 4. 개발 서버 실행
```bash
pnpm dev
# 또는
pnpm dev:web  # Web + legacy-web 동시 실행
```

### 자주 발생하는 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| 401/500 (유저 정보 조회 실패) | Redis에 토큰 미등록 | dev Redis에 accessToken 등록 |
| ECONNREFUSED localhost:3005 | legacy-web 미실행 | `pnpm -C apps/legacy-web dev` |
| 카카오 로그인 실패 | Redirect URI 불일치 | `http://localhost:3000/api/v1/oauth/kakao` 등록 |
| 빌드 실패 (ESLint 에러) | Lint 규칙 위반 | `pnpm lint` 실행 후 수정 |

---

## RAG 검색 최적화 키워드

### 주요 개념
- Next.js 15, App Router, React 19
- Feature-Sliced Design, Layers Architecture
- Middleware Chain, Protected Routes
- TanStack Query, React Query
- Tailwind CSS, Design System
- Sentry, Datadog RUM, Pyroscope
- Flagsmith Feature Flags
- Kakao OAuth, Iamport Payment
- Redis Session, ISR Caching
- Monorepo, pnpm workspaces, Turbo
- Docker Standalone Build
- CloudFront CDN, EKS Deployment

### 파일 경로 인덱스
- `~/podo-app-DOC/apps/web/src/middleware.ts`
- `~/podo-app-DOC/apps/web/src/app/layout.tsx`
- `~/podo-app-DOC/apps/web/src/app/(internal)/layout.tsx`
- `~/podo-app-DOC/apps/web/next.config.ts`
- `~/podo-app-DOC/apps/web/package.json`
- `~/podo-app-DOC/apps/web/tsconfig.json`
- `~/podo-app-DOC/apps/web/src/core/middlewares/`
- `~/podo-app-DOC/apps/layers/core/src/providers/`
- `~/podo-app-DOC/apps/layers/shared/src/`
- `~/podo-app-DOC/apps/layers/features/src/`
- `~/podo-app-DOC/apps/layers/entities/src/`
- `~/podo-app-DOC/apps/layers/widgets/src/`
- `~/podo-app-DOC/apps/web/src/views/`

### 검색 질의 예시
- "Next.js 15 App Router 라우트 구조는?"
- "미들웨어 체인 순서와 역할은?"
- "인증은 어떻게 처리되나?"
- "레거시 웹과 프록시 설정은?"
- "환경 변수는 어디서 관리하나?"
- "Layers 아키텍처 의존성 규칙은?"
- "Redis는 어디에 사용되나?"
- "카카오 OAuth 설정 방법은?"
- "결제는 어떻게 구현되어 있나?"
- "디자인 시스템은 무엇을 쓰나?"
