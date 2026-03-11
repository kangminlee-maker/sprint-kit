# Podo 서비스 아키텍처 개요

## 문서 정보
- **작성일**: 2026-01-26
- **대상**: 개발자, 아키텍트, 테크니컬 PM
- **목적**: Podo 서비스 전체 아키텍처 이해 및 RAG 최적화 문서

---

## 1. 서비스 개요

### 1.1 Podo란?
Podo는 **화상 영어 교육 서비스**로, 학생(학부모)과 튜터를 연결하는 플랫폼입니다.

### 1.2 주요 기능
- **예약 시스템**: 학생이 튜터의 가능한 시간대에 수업을 예약
- **수업 진행**: 화상 통화 기반 1:1 영어 교육
- **구독/결제**: 수업권(티켓) 구매 및 정기 결제 관리
- **튜터 관리**: 튜터 프로필, 수업 주제, 스케줄 관리
- **AI 학습**: AI 기반 학습 콘텐츠 및 캐릭터 챗봇
- **수업 후기**: 튜터 피드백 및 복습 자료 제공

### 1.3 사용자 유형
| 사용자 유형 | 플랫폼 | 설명 |
|------------|--------|------|
| **학생 (학부모)** | Web, Native (제한적) | 수업 예약, 구독 관리, 학습 진행 |
| **튜터** | Native (전용) | 수업 스케줄 관리, 학생 피드백 작성 |
| **관리자** | Legacy Web (Nuxt) | CS, 운영 관리 (마이그레이션 예정) |

---

## 2. 모노레포 구조

### 2.1 전체 구조 개요
Podo는 **pnpm workspaces + Turbo**를 사용하는 모노레포로 구성되어 있습니다.

```
podo-app/
├── apps/                    # 애플리케이션 레이어
│   ├── web/                 # Next.js 15 (메인 웹앱, App Router)
│   │   └── src/
│   │       ├── server/      # Hono BFF (이전 apps/server, 2026-01 통합)
│   │       ├── core/        # 핵심 인프라 레이어
│   │       ├── entities/    # 비즈니스 엔티티
│   │       ├── features/    # 기능 모듈
│   │       ├── shared/      # 공유 유틸리티
│   │       └── widgets/     # 재사용 가능한 위젯
│   ├── native/              # React Native + Expo 53 (튜터앱)
│   └── legacy-web/          # Nuxt.js (레거시, 마이그레이션 중)
│
├── packages/                # 공유 패키지
│   ├── config/              # ESLint, Prettier, TypeScript, Env 설정
│   ├── design-token/        # 디자인 토큰 (색상, 간격, 타이포그래피)
│   ├── assets/              # 정적 에셋, 아이콘
│   ├── flags/               # 피처 플래그 유틸리티
│   ├── navigation/          # 네비게이션 유틸리티
│   └── design-system-temp/  # 임시 디자인 시스템 (v3 마이그레이션 중)
│
├── design-system/           # 디자인 시스템 (Storybook 9)
│   ├── core/                # 기본 컴포넌트 (Button, Input 등)
│   └── podo/                # Podo 전용 컴포넌트 (v1, v2, v3 버전 공존)
│
└── docs/                    # 문서 (Docusaurus)
    └── web/                 # 마이그레이션 가이드, API 문서
```

### 2.2 pnpm Workspace 설정
```yaml
# pnpm-workspace.yaml
packages:
  - apps/*
  - packages/*
  - packages/config/*
  - shared/*
  - design-system/*
  - docs/*
```

### 2.3 Turbo 빌드 시스템
- **파이프라인 캐싱**: 불필요한 재빌드 방지
- **병렬 실행**: 독립적인 패키지 동시 빌드
- **의존성 관리**: `dependsOn` 설정으로 빌드 순서 보장

```json
// turbo.json 주요 설정
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### 2.4 앱 간 의존성 관계
```
┌────────────────────────────────────────┐
│           apps/web                     │
│  (Next.js 15 + Hono BFF 통합)          │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │  src/server/ (Hono BFF)         │  │
│  │   - domains/                    │  │
│  │   - infrastructure/             │  │─────┐
│  │   - presentation/               │  │     │ External API
│  └─────────────────────────────────┘  │     ↓
│                                        │  [Legacy API]
│  ┌─────────────────────────────────┐  │  [Payment Gateway]
│  │  Client Layers                  │  │  [Redis, DB]
│  │   - core/                       │  │
│  │   - features/                   │  │
│  │   - entities/                   │  │
│  │   - shared/                     │  │
│  │   - widgets/                    │  │
│  └─────────────────────────────────┘  │
└────────────────────────────────────────┘
       │
       ↓
┌──────────────────────┐
│  packages/*          │
│  design-system/*     │
└──────────────────────┘
```

### 2.5 패키지 공유 방식
- **Workspace Protocol**: `workspace:^` 사용하여 로컬 패키지 의존성 관리
- **Import Alias**:
  - `@podo/*`: 모노레포 패키지
  - `@design-system/*`: 디자인 시스템 패키지
  - `@packages/*`: 유틸리티 패키지
  - `@podo-app/*`: 설정 패키지
  - `@core/*`, `@features/*`, `@entities/*`, `@shared/*`, `@widgets/*`: Web 앱 레이어

---

## 3. 앱 아키텍처 요약

### 3.1 apps/web - Next.js 15 메인 웹앱

#### 개요
- **프레임워크**: Next.js 15 (App Router)
- **렌더링**: React Server Components (RSC) 우선
- **상태 관리**: TanStack Query v5
- **스타일링**: Tailwind CSS + 디자인 토큰

#### 디렉토리 구조
```
apps/web/src/
├── app/                        # Next.js App Router
│   ├── (internal)/             # 인증 필요한 내부 페이지
│   ├── (external)/             # 외부 접근 가능한 페이지
│   ├── open-in-app/            # 앱 오픈 핸들러
│   └── layout.tsx              # 루트 레이아웃
│
├── views/                      # 페이지 레벨 컴포넌트 (40+ 페이지)
│   ├── home/                   # 홈 화면
│   ├── booking/                # 예약 페이지
│   ├── reservation/            # 예약 내역
│   ├── subscribe-payment/      # 구독 결제
│   ├── class-room/             # 수업방
│   └── ...                     # 기타 페이지
│
└── middleware.ts               # 미들웨어 체이닝
```

#### 미들웨어 체이닝
```typescript
// apps/web/src/middleware.ts
export default chainMiddleware([
  withKakaoInAppBlock,      // 카카오 인앱 브라우저 차단
  withNativeStore,          // 네이티브 앱 정보 저장
  withSession,              // 세션 관리 (Redis 연동)
  withMarketing,            // 마케팅 파라미터 처리
  withProtectedRoute        // 인증 경로 보호
])
```

#### Feature-Sliced 아키텍처 (apps/web/src/)
웹 앱은 Feature-Sliced Design 계층 구조를 따릅니다 (이전 `apps/layers/`에서 `apps/web/src/`로 통합, PODOZ-1875).

| 레이어 | 위치 | 역할 | 예시 |
|--------|------|------|------|
| **core** | `apps/web/src/core/` | 전역 프로바이더, API, 미들웨어 | QueryProvider, SessionProvider |
| **entities** | `apps/web/src/entities/` | 비즈니스 엔티티 | lesson, coupon, user, subscribes |
| **features** | `apps/web/src/features/` | 기능 모듈 | auth, booking-lesson, payment, lesson-review |
| **shared** | `apps/web/src/shared/` | 공유 유틸리티 | hooks, utils, constants |
| **widgets** | `apps/web/src/widgets/` | 재사용 위젯 | home-banners, home-popup, welcomeback-popup |

#### 주요 기술 스택
- React 19, Next.js 15
- TanStack Query v5 (서버 상태 관리)
- Tailwind CSS (스타일링)
- Zod (런타임 검증)
- nuqs (URL 쿼리스트링 상태 관리)
- overlay-kit (모달/오버레이 관리)
- @use-funnel/browser (퍼널 플로우)

---

### 3.2 apps/native - React Native 튜터 앱

#### 개요
- **프레임워크**: React Native 0.79 + Expo 53
- **라우팅**: Expo Router v5
- **플랫폼**: iOS, Android
- **대상**: 튜터 전용 앱

#### 주요 기능
- 튜터 스케줄 관리
- 수업 진행 및 피드백 작성
- 튜터 프로필 관리
- 푸시 알림 (expo-notifications)
- 딥링크 (expo-linking)
- WebView 브리지 (@webview-bridge/react-native)

#### 디렉토리 구조
```
apps/native/
├── app/                       # Expo Router 기반 라우트
├── src/
│   ├── components/            # 네이티브 컴포넌트
│   ├── screens/               # 화면 컴포넌트
│   └── utils/                 # 유틸리티
└── dist/                      # 빌드 출력 (app-bridge.mjs)
```

#### 빌드 프로파일
- **local**: 로컬 개발 환경
- **development**: 개발 환경 (EAS Build)
- **staging**: 스테이징 환경
- **production**: 프로덕션 환경

---

### 3.3 apps/server - Hono BFF

#### 개요
- **프레임워크**: Hono (Edge-first Web Framework)
- **아키텍처**: Domain-Driven Design (DDD)
- **배포**: Vercel Edge Functions
- **역할**: Backend for Frontend (BFF) - 클라이언트와 레거시 API 사이의 중간 계층

#### Domain-Driven 구조
```
apps/server/src/
├── domains/                   # 비즈니스 로직 (도메인별)
│   ├── oauth/                 # OAuth 인증 (Kakao, Apple)
│   ├── payment/               # 결제 처리
│   ├── coupons/               # 쿠폰 관리
│   ├── users/                 # 사용자 관리
│   ├── payment-methods/       # 결제수단 관리
│   ├── lesson/                # 수업 관리
│   ├── subscribes/            # 구독 관리
│   └── authentication/        # 인증/세션 관리
│
├── infrastructure/            # 인프라 레이어
│   ├── database/              # Drizzle ORM (PostgreSQL)
│   ├── repository/            # 데이터 저장소
│   ├── cache/                 # Redis 캐싱
│   ├── external-apis/         # 외부 API 클라이언트
│   ├── queues/                # AWS SQS 큐
│   └── rpc/                   # RPC 클라이언트
│
├── presentation/              # 프레젠테이션 레이어
│   ├── routes/                # API 라우트 정의
│   ├── middlewares/           # 미들웨어 (auth, error handling)
│   ├── schema/                # Zod 스키마 (OpenAPI)
│   └── setup/                 # 라우트 및 에러 핸들러 설정
│
└── shared/                    # 공유 유틸리티
    ├── utils/                 # 유틸리티 함수
    ├── libs/                  # 라이브러리 (logger, router)
    ├── constants/             # 상수 (env)
    ├── errors/                # 에러 클래스
    └── types/                 # 공유 타입
```

#### 핵심 기능
- **OpenAPI 스펙**: `@hono/zod-openapi`를 사용한 타입 안전 API 정의
- **Swagger UI**: `/api/doc` 경로에서 API 문서 제공
- **RPC Client**: Hono RPC를 통해 타입 안전한 클라이언트 제공
- **CORS 설정**: Web, Native 앱에서 접근 가능하도록 CORS 구성
- **Request ID**: 모든 요청에 고유 ID 부여 (추적 용이)
- **Timeout**: 10초 타임아웃 설정

#### 미들웨어 체인
```typescript
server.use(requestId())        // 요청 ID 생성
server.use(timeout(10_000))    // 10초 타임아웃
server.use('*', cors({ ... })) // CORS 설정
server.use('*', baseMiddleware) // 인증, 로깅
```

#### 주요 기술 스택
- Hono (Web Framework)
- Drizzle ORM (PostgreSQL ORM)
- Zod (스키마 검증)
- ioredis (Redis 클라이언트)
- jose (JWT 처리)
- pino (로깅)
- AWS SDK (SQS, STS)

---

### 3.4 apps/legacy-web - Nuxt.js 레거시

#### 개요
- **프레임워크**: Nuxt.js 2
- **상태**: 마이그레이션 진행 중
- **포트**: 3005 (로컬 개발)

#### 현재 역할
- 관리자(CS) 페이지 제공
- `/app/user/podo/*` 경로 일부 페이지 제공 (Next.js에서 프록시)

#### 프록시 설정 (apps/web/next.config.ts)
```typescript
// Next.js에서 Nuxt.js로 프록시
async rewrites() {
  return [
    {
      source: '/_nuxt/:path+',
      destination: 'http://localhost:3005/_nuxt/:path+'
    },
    {
      source: '/app/user/podo/:path+',
      destination: 'http://localhost:3005/app/user/podo/:path+'
    }
  ]
}
```

#### 마이그레이션 전략
1. **페이지 단위 마이그레이션**: Nuxt 페이지를 Next.js로 점진적 이동
2. **프록시 공존**: 마이그레이션 완료 전까지 프록시로 연결
3. **API 통합**: BFF(apps/server)로 API 호출 통합
4. **디자인 시스템 정렬**: 레거시 컴포넌트를 design-system/podo로 마이그레이션

#### 마이그레이션 현황 (docs/web/docs/migrations/todo.md)
- **완료**: 예약, 결제, 수업 관련 주요 페이지
- **진행 중**: 관리자 페이지, 일부 다이얼로그
- **예정**: churn, selftest, debug 페이지

---

## 4. 기술 스택 전체 맵

### 4.1 프론트엔드
| 레이어 | 기술 스택 | 버전 |
|--------|-----------|------|
| **프레임워크** | React, Next.js App Router | React 19, Next.js 15.5 |
| **스타일링** | Tailwind CSS, CSS Modules | 3.4.17 |
| **상태 관리** | TanStack Query, nuqs | TanStack Query v5.59 |
| **폼 관리** | React Hook Form, Zod | - |
| **UI 라이브러리** | overlay-kit, embla-carousel | - |
| **애니메이션** | motion (Framer Motion fork) | 12.4.7 |
| **번들러** | Turbopack (Next.js 15 내장) | - |

### 4.2 모바일 (Native)
| 레이어 | 기술 스택 | 버전 |
|--------|-----------|------|
| **프레임워크** | React Native, Expo | RN 0.79.6, Expo 53 |
| **라우팅** | Expo Router | v5 |
| **내비게이션** | React Navigation | v7 |
| **WebView** | react-native-webview, @webview-bridge | 13.13.5 |
| **결제** | @tosspayments/widget-sdk-react-native | 1.4.0 |
| **푸시 알림** | expo-notifications | 0.31.4 |
| **빌드** | EAS Build | - |

### 4.3 백엔드 (BFF)
| 레이어 | 기술 스택 | 버전 |
|--------|-----------|------|
| **프레임워크** | Hono | 4.6.5 |
| **ORM** | Drizzle ORM | 0.36.0 |
| **데이터베이스** | PostgreSQL (외부 레거시 DB) | - |
| **캐시** | ioredis (Redis) | 5.4.1 |
| **검증** | Zod, @hono/zod-openapi | 3.23.8 |
| **로깅** | pino, pino-pretty | 9.6.0 |
| **JWT** | jose | 5.9.6 |
| **큐** | AWS SQS | - |

### 4.4 공통 인프라
| 레이어 | 기술 스택 | 비고 |
|--------|-----------|------|
| **패키지 매니저** | pnpm | 10.12.1 |
| **모노레포** | Turbo | 2.1.2 |
| **CI/CD** | GitHub Actions | EKS 배포 |
| **컨테이너** | Docker, ECR | - |
| **오케스트레이션** | AWS EKS (Kubernetes) | - |
| **환경 변수 관리** | AWS S3 (podo-config bucket) | - |

### 4.5 모니터링 및 분석
| 레이어 | 기술 스택 | 용도 |
|--------|-----------|------|
| **에러 추적** | Sentry | 클라이언트/서버 에러 모니터링 |
| **RUM** | Datadog RUM | 사용자 세션 추적 |
| **로깅** | pino (서버), Datadog | 구조화 로깅 |
| **분석** | Google Analytics 4, GTM | 사용자 행동 분석 |
| **프로파일링** | Pyroscope | 성능 프로파일링 |

### 4.6 개발 도구
| 레이어 | 기술 스택 | 버전 |
|--------|-----------|------|
| **언어** | TypeScript | 5.6.3 |
| **린팅** | ESLint | 9.37.0 |
| **포매팅** | Prettier | 3.6.2 |
| **테스팅** | Vitest, Testing Library | Vitest 3.0.2 |
| **스토리북** | Storybook | 9.0.14 (design-system/core) |
| **문서** | Docusaurus | (docs/web) |

---

## 5. 레거시 마이그레이션 현황

### 5.1 Nuxt → Next.js 마이그레이션 전략

#### Phase 1: 공존 (현재)
- Next.js와 Nuxt.js가 동시 실행
- Next.js에서 프록시를 통해 Nuxt.js 경로 연결
- 점진적 페이지 이관

#### Phase 2: 페이지 마이그레이션
1. **라우트 분석**: 마이그레이션할 페이지 식별
2. **디자인 시스템 정렬**: 레거시 컴포넌트를 design-system/podo로 이동
3. **API 통합**: BFF(apps/server)로 API 호출 통합
4. **테스트**: 기능 검증 및 E2E 테스트
5. **배포**: 단계적 배포 (feature flag 활용)

#### Phase 3: 완전 전환
- Nuxt.js 서버 종료
- 프록시 설정 제거
- 레거시 의존성 제거

### 5.2 마이그레이션 완료/진행중/예정 페이지

#### 완료 (Next.js 15로 이관 완료)
- ✅ 홈 (`/`)
- ✅ 예약 (`/booking`, `/reservation`)
- ✅ 수업 내역 (`/class-room`)
- ✅ 구독/결제 (`/subscribe-payment`, `/subscribe-list`)
- ✅ 결제 수단 (`/registered-payment-methods`, `/register-payment-methods`)
- ✅ 쿠폰 (`/coupon-detail`)
- ✅ AI 학습 (`/ai-learning`, `/character-chat-*`)
- ✅ 공지사항 (`/notice-list`)
- ✅ 수업 후기 (`/lesson-review-complete`)

#### 진행 중 (개발/테스트 단계)
- 🔄 다이얼로그 시스템 (외부 콜백 다이얼로그)
- 🔄 마이페이지 일부 기능
- 🔄 QR 스토어 페이지

#### 예정 (미이관)
- ⏳ 관리자(CS) 페이지 (`/app/user/podo/*` 일부)
- ⏳ churn (이탈 방지) 페이지
- ⏳ selftest (자가 진단) 페이지
- ⏳ debug (디버그) 페이지

### 5.3 프록시 설정과 공존 방식

#### Nuxt.js 프록시 라우트 (apps/web/next.config.ts)
```typescript
// Next.js에서 처리하지 못하는 경로는 Nuxt.js로 프록시
{
  source: '/_nuxt/:path+',
  destination: 'http://localhost:3005/_nuxt/:path+'
},
{
  source: '/app/user/podo/:path+',
  destination: 'http://localhost:3005/app/user/podo/:path+'
}
```

#### 로컬 개발 시 주의사항
- **Nuxt.js 서버 필수**: `pnpm dev`로 전체 실행 시 legacy-web도 자동 실행
- **선택적 실행**: `pnpm dev:web`으로 Web + legacy-web만 실행 가능
- **포트**: Next.js(3000), Nuxt.js(3005)

### 5.4 마이그레이션 관련 문서
- `docs/web/docs/migrations/todo.md`: 마이그레이션 TODO 보드
- `docs/web/docs/migrations/pages/*.md`: 페이지별 마이그레이션 가이드
  - `login.md`: 로그인 페이지 마이그레이션
  - `lessons-booking.md`: 예약 페이지 마이그레이션
  - `my-podo.md`: 마이페이지 마이그레이션
  - `dialogs.md`: 다이얼로그 시스템 마이그레이션
  - 기타 페이지별 문서

---

## 6. 데이터 흐름

### 6.1 전체 데이터 흐름 아키텍처
```
┌───────────────────────────────────────────────────────────┐
│                        클라이언트                          │
│  ┌────────────┐              ┌────────────┐              │
│  │ Web (Next) │              │   Native   │              │
│  │ React 19   │              │ React Native│              │
│  └─────┬──────┘              └──────┬──────┘              │
│        │                            │                     │
│        │ TanStack Query             │ WebView Bridge      │
│        │                            │                     │
└────────┼────────────────────────────┼─────────────────────┘
         │                            │
         └────────────┬───────────────┘
                      │
                      │ HTTPS (API 호출)
                      ↓
         ┌────────────────────────────┐
         │    BFF (apps/server)       │
         │    Hono + Vercel Edge      │
         │                            │
         │  - 인증/세션 관리          │
         │  - 데이터 변환/집계        │
         │  - 에러 처리               │
         │  - 로깅/모니터링           │
         └─────────┬──────────────────┘
                   │
         ┌─────────┼──────────┐
         │         │          │
         ↓         ↓          ↓
   ┌─────────┐ ┌────────┐ ┌──────────┐
   │ Redis   │ │ Legacy │ │ External │
   │ (Cache, │ │  API   │ │   API    │
   │ Session)│ │(Nuxt)  │ │ (결제 등) │
   └─────────┘ └────┬───┘ └──────────┘
                    │
                    ↓
              ┌──────────┐
              │PostgreSQL│
              │  (DB)    │
              └──────────┘
```

### 6.2 클라이언트 → BFF → 외부 API

#### 일반적인 API 호출 플로우
1. **클라이언트 (Web/Native)**
   - TanStack Query를 사용한 데이터 페칭
   - RPC Client로 타입 안전 호출 (Hono RPC)

2. **BFF (apps/server)**
   - 미들웨어 체이닝: 인증 → 로깅 → 비즈니스 로직
   - 도메인 서비스에서 비즈니스 로직 처리
   - Infrastructure 레이어에서 외부 API 호출
   - 응답 데이터 변환 및 집계

3. **외부 API / 데이터베이스**
   - 레거시 API (Nuxt.js 서버)
   - PostgreSQL (Drizzle ORM)
   - Redis (세션, 캐시)
   - 외부 서비스 (결제 게이트웨이, Kakao API 등)

#### 예시: 수업 예약 플로우
```typescript
// 1. 클라이언트 (Web)
const { mutate: bookLesson } = useMutation({
  mutationFn: (data) => api.lesson.book.$post({ json: data })
})

// 2. BFF (apps/server/src/domains/lesson/routes.ts)
app.openapi(bookLessonRoute, async (ctx) => {
  const userId = ctx.get('userId')  // 미들웨어에서 주입
  const body = ctx.req.valid('json')

  // 비즈니스 로직
  const result = await bookLessonService(userId, body)

  return ctx.json({ success: true, data: result })
})

// 3. Infrastructure (외부 API 호출)
const response = await legacyApiClient.post('/api/lessons/book', {
  userId,
  lessonId,
  tutorId,
  startTime
})
```

---

### 6.3 인증 흐름 (Kakao, Apple OAuth)

#### OAuth 인증 플로우
```
┌─────────┐                                        ┌─────────┐
│  User   │                                        │  Kakao  │
│ (Web/   │                                        │  API    │
│ Native) │                                        └────┬────┘
└────┬────┘                                             │
     │                                                  │
     │ 1. 카카오 로그인 버튼 클릭                        │
     ├──────────────────────────────────────────────────>
     │                                                  │
     │ 2. OAuth 동의 화면                               │
     │<──────────────────────────────────────────────────
     │                                                  │
     │ 3. 인가 코드 (Authorization Code)                 │
     │<──────────────────────────────────────────────────
     │                                                  │
     │ 4. 인가 코드 → BFF 전송                           │
     ├────────────────────>                             │
     │                    │                             │
     │                    │ 5. 액세스 토큰 요청           │
     │                    ├──────────────────────────────>
     │                    │                             │
     │                    │ 6. 액세스 토큰 응답           │
     │                    │<──────────────────────────────
     │                    │                             │
     │                    │ 7. 사용자 정보 요청           │
     │                    ├──────────────────────────────>
     │                    │                             │
     │                    │ 8. 사용자 정보 응답           │
     │                    │<──────────────────────────────
     │                    │
     │                    │ 9. 세션 생성 (Redis)
     │                    │    - accessToken → uid 매핑
     │                    │    - Set-Cookie: sessionId
     │                    │
     │ 10. 세션 쿠키 응답  │
     │<────────────────────
     │
```

#### 세션 관리 (Redis)
```typescript
// BFF에서 세션 생성
await redis.set(`session:${sessionId}`, JSON.stringify({
  uid: user.uid,
  accessToken: kakaoAccessToken,
  expiresAt: Date.now() + 3600000 // 1시간
}))

// 미들웨어에서 세션 검증
const session = await redis.get(`session:${sessionId}`)
if (!session) {
  throw new UnauthorizedError()
}
```

#### Apple OAuth 플로우
- 기본적으로 Kakao OAuth와 동일한 플로우
- Apple ID 토큰 (JWT) 검증 필요
- `apps/server/src/domains/oauth/apple.ts`에서 처리

---

### 6.4 세션 관리

#### 세션 저장소: Redis
- **키 패턴**: `session:{sessionId}`
- **값**: JSON 형태의 세션 데이터
  - `uid`: 사용자 고유 ID
  - `accessToken`: OAuth 액세스 토큰
  - `expiresAt`: 만료 시간

#### 세션 검증 미들웨어 (Web)
```typescript
// apps/web/src/middleware.ts
export const withSession = async (request: NextRequest) => {
  const sessionId = request.cookies.get('sessionId')?.value

  if (!sessionId) {
    // 비로그인 사용자
    return NextResponse.next()
  }

  // BFF에 세션 검증 요청
  const session = await api.auth.validateSession.$post({
    json: { sessionId }
  })

  if (!session.valid) {
    // 세션 만료 → 로그인 페이지로 리다이렉트
    return NextResponse.redirect('/login')
  }

  return NextResponse.next()
}
```

#### 세션 갱신
- **TTL**: 1시간 (기본)
- **갱신 전략**: Sliding Expiration (활동 시 자동 연장)
- **로그아웃**: Redis에서 세션 키 삭제 + 쿠키 제거

---

## 7. 디자인 시스템

### 7.1 3-Tier 토큰 계층

Podo 디자인 시스템은 **세 가지 계층**으로 구성되어 일관성과 확장성을 제공합니다.

```
┌───────────────────────────────────────────────────────┐
│ Layer 3: Scale Token (제품별 특화)                     │
│ @design-system/podo, @design-system/tutor-web        │
│                                                       │
│ 예시: --podo-button-primary, --tutor-header-bg       │
└────────────────────┬──────────────────────────────────┘
                     │ 참조
┌────────────────────▼──────────────────────────────────┐
│ Layer 2: Semantic Token (의미론적 토큰)                │
│ @design-system/core                                   │
│                                                       │
│ 예시: --color-primary, --color-bg, --spacing-md      │
└────────────────────┬──────────────────────────────────┘
                     │ 참조
┌────────────────────▼──────────────────────────────────┐
│ Layer 1: Static Token (정적 토큰)                      │
│ @design-system/core                                   │
│                                                       │
│ 예시: --color-blue-500, --spacing-16, --font-size-lg │
└───────────────────────────────────────────────────────┘
```

#### Static Token (정적 토큰)
- **위치**: `@design-system/core`
- **역할**: 가장 기본이 되는 원시 값
- **예시**:
  - 색상: `--color-blue-500`, `--color-gray-100`
  - 간격: `--spacing-4`, `--spacing-16`, `--spacing-24`
  - 타이포그래피: `--font-size-sm`, `--font-size-lg`, `--font-weight-bold`

#### Semantic Token (의미론적 토큰)
- **위치**: `@design-system/core`, `@design-system/podo`, `@design-system/tutor-web`
- **역할**: Static Token을 기반으로 실제 사용 목적에 따른 의미 부여
- **예시**:
  - `--color-primary`: 주요 브랜드 색상 (`--color-blue-500` 참조)
  - `--color-bg`: 배경 색상 (`--color-gray-50` 참조)
  - `--spacing-md`: 중간 간격 (`--spacing-16` 참조)

#### Scale Token (스케일 토큰)
- **위치**: `@design-system/podo`, `@design-system/tutor-web`
- **역할**: Semantic Token을 기반으로 각 제품별 특화된 토큰 정의
- **예시**:
  - Podo: `--podo-button-primary`, `--podo-header-bg`
  - Tutor Web: `--tutor-button-primary`, `--tutor-header-bg`

### 7.2 컴포넌트 버저닝 (v1, v2, v3)

디자인 시스템 컴포넌트는 **버전별로 관리**되며, 점진적 마이그레이션을 지원합니다.

#### 버전 전략
```
design-system/podo/src/
├── v1/                       # 레거시 컴포넌트 (Nuxt 시절)
│   ├── Button/
│   ├── Input/
│   └── Card/
│
├── v2/                       # Next.js 초기 버전
│   ├── Button/
│   ├── Input/
│   └── Card/
│
└── v3/                       # 최신 버전 (디자인 토큰 기반)
    ├── Button/
    ├── Input/
    └── Card/
```

#### 버전별 특징
| 버전 | 프레임워크 | 스타일링 | 상태 | 용도 |
|------|-----------|---------|------|------|
| **v1** | React 18 | CSS Modules | Deprecated | 레거시 페이지 호환 |
| **v2** | React 19 | Tailwind CSS | Maintenance | 기존 Next.js 페이지 |
| **v3** | React 19 | Tailwind + 디자인 토큰 | Active | 신규 개발 권장 |

#### 마이그레이션 전략
1. **신규 페이지**: v3 컴포넌트 사용
2. **기존 페이지**: v2 유지 (점진적 v3 전환)
3. **레거시 페이지**: v1 유지 (Next.js 마이그레이션 시 v3로 전환)

### 7.3 디자인 시스템 패키지 구조

```
design-system/
├── core/                     # 기본 컴포넌트 (Storybook 9)
│   ├── src/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── ...
│   └── package.json          # @design-system/core
│
└── podo/                     # Podo 전용 컴포넌트
    ├── src/
    │   ├── v1/               # 레거시
    │   ├── v2/               # 기존
    │   └── v3/               # 최신
    └── package.json          # @design-system/podo
```

### 7.4 Storybook 9
- **위치**: `design-system/core`
- **버전**: Storybook 9.0.14
- **목적**: 컴포넌트 카탈로그 및 개발 환경
- **실행**: `pnpm watch:design-system`

---

## 8. 환경 변수 및 설정

### 8.1 환경 변수 관리 (AWS S3)

#### 개요
- **저장소**: AWS S3 (`s3://podo-config/podo-web/`)
- **검증**: `@t3-oss/env-nextjs` + Zod
- **스테이지**: local, development, staging, production, temp

#### 환경별 파일
```
apps/web/
├── .env.local             # 로컬 개발 (git ignore)
├── .env.development       # 개발 환경
├── .env.staging           # 스테이징 환경
├── .env.production        # 프로덕션 환경
└── .env.temp              # 임시 환경 (테스트)
```

#### 다운로드/업로드
```bash
# 모든 환경 파일 다운로드 (AWS CLI 필요)
pnpm -C apps/web env:download

# 특정 환경 파일 다운로드
pnpm -C apps/web env:download:production

# 환경 파일 업로드 (S3에 저장)
pnpm -C apps/web env:upload
```

### 8.2 환경 변수 스키마 (Zod 검증)

#### 파일 위치
- `apps/web/src/shared/config/env/schemas.ts`

#### 스키마 구조
```typescript
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // 서버 전용 환경 변수
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    KAKAO_CLIENT_SECRET: z.string(),
  },
  client: {
    // 클라이언트 환경 변수 (NEXT_PUBLIC_ 접두사)
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_GA_ID: z.string(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  },
})
```

#### 환경 변수 접근
```typescript
import { env } from '@shared/config/env'

// 타입 안전한 환경 변수 접근
const apiUrl = env.NEXT_PUBLIC_API_URL  // 자동 완성 지원
const dbUrl = env.DATABASE_URL          // 서버 전용
```

### 8.3 주요 환경 변수

#### 클라이언트 (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_API_URL`: BFF API 엔드포인트
- `NEXT_PUBLIC_PODO_WEB_URL`: 웹앱 URL
- `NEXT_PUBLIC_PODO_APP_URL`: 레거시 앱 URL (프록시)
- `NEXT_PUBLIC_GA_ID`: Google Analytics ID
- `NEXT_PUBLIC_FLAGSMITH_KEY`: Flagsmith API 키

#### 서버
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `REDIS_URL`: Redis 연결 문자열
- `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`: Kakao OAuth
- `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`: Apple OAuth
- `IAMPORT_KEY`, `IAMPORT_SECRET`: 결제 게이트웨이
- `SENTRY_DSN`: Sentry 에러 추적
- `DATADOG_API_KEY`: Datadog 모니터링

---

## 9. 배포 및 인프라

### 9.1 배포 파이프라인 (GitHub Actions → EKS)

```
┌─────────────────────────────────────────────────────┐
│ 1. Developer Push (GitHub)                          │
│    - main, develop, staging 브랜치 푸시              │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│ 2. GitHub Actions (CI)                              │
│    - Lint, Type Check, Test                        │
│    - Docker 이미지 빌드                             │
│    - ECR에 이미지 푸시                              │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│ 3. ECR (Elastic Container Registry)                 │
│    - Docker 이미지 저장                             │
│    - 태그: {branch}-{commit-sha}                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│ 4. EKS (Kubernetes)                                 │
│    - Deployment 업데이트                            │
│    - Rolling Update (무중단 배포)                    │
│    - Health Check                                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│ 5. Production (AWS EKS)                             │
│    - Load Balancer (ALB)                            │
│    - Auto Scaling                                   │
│    - CloudWatch Monitoring                          │
└─────────────────────────────────────────────────────┘
```

### 9.2 Docker 컨테이너화

#### Dockerfile 구조 (Multi-stage Build)
```dockerfile
# Stage 1: 의존성 설치
FROM node:22-alpine AS deps
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: 빌드
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 3: 프로덕션 런타임
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
CMD ["pnpm", "start"]
```

### 9.3 Kubernetes 리소스

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: podo-web
spec:
  replicas: 3                     # 3개 Pod 실행
  strategy:
    type: RollingUpdate           # 무중단 배포
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: podo-web
        image: <ECR_IMAGE>
        ports:
        - containerPort: 3000
        env:
        - name: APP_ENV
          value: "production"
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
```

#### Service (Load Balancer)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: podo-web-service
spec:
  type: LoadBalancer
  selector:
    app: podo-web
  ports:
  - port: 80
    targetPort: 3000
```

### 9.4 환경별 배포 전략

| 환경 | 브랜치 | 도메인 | 배포 방식 | 승인 |
|------|--------|--------|-----------|------|
| **Development** | develop | dev.podo.com | 자동 배포 | 불필요 |
| **Staging** | staging | staging.podo.com | 자동 배포 | 불필요 |
| **Production** | main | podo.com | 수동 승인 후 배포 | 필요 |

---

## 10. 피처 플래그 (Flagsmith)

### 10.1 개요
- **서비스**: Flagsmith (피처 플래그 관리 SaaS)
- **목적**: 코드 배포 없이 기능 활성화/비활성화
- **패키지**: `@podo/flags`

### 10.2 주요 사용 사례
- A/B 테스트
- 점진적 기능 출시 (Gradual Rollout)
- 긴급 기능 비활성화 (Kill Switch)
- 환경별 기능 토글

### 10.3 사용 예시
```typescript
import { useFeatureFlag } from '@podo/flags'

const MyComponent = () => {
  const { enabled } = useFeatureFlag('new_payment_ui')

  if (enabled) {
    return <NewPaymentUI />
  }

  return <LegacyPaymentUI />
}
```

---

## 11. 모니터링 및 로깅

### 11.1 에러 추적 (Sentry)
- **클라이언트**: `@sentry/nextjs` (Web), `@sentry/react-native` (Native)
- **서버**: `@sentry/node` (BFF)
- **기능**: 에러 스택 추적, 사용자 세션 리플레이, 성능 모니터링

### 11.2 사용자 행동 분석
- **Datadog RUM**: 페이지 로드 시간, 사용자 세션 추적
- **Google Analytics 4**: 사용자 행동 분석, 이벤트 추적
- **GTM (Google Tag Manager)**: 이벤트 태깅 관리

### 11.3 서버 로깅 (pino)
```typescript
import { logger } from '@/shared/libs/logger'

logger.info({
  requestId: ctx.get('requestId'),
  userId: ctx.get('userId'),
  method: ctx.req.method,
  path: ctx.req.path,
  duration: '120ms'
}, 'API Request Completed')
```

---

## 12. 개발 워크플로우

### 12.1 로컬 개발 시작하기

#### 1단계: 환경 설정
```bash
# Node.js 22+ 설치 필요
node --version  # v22.x.x

# pnpm 설치
corepack enable pnpm

# 의존성 설치
pnpm install

# 환경 변수 다운로드 (AWS CLI 필요)
pnpm -C apps/web env:download
```

#### 2단계: 개발 서버 실행
```bash
# 옵션 1: 전체 앱 실행 (Web + Native + Server + Legacy)
pnpm dev

# 옵션 2: Web + Legacy만 실행 (권장)
pnpm dev:web

# 옵션 3: 개별 앱 실행
pnpm -C apps/web dev        # Web만
pnpm -C apps/native dev      # Native만
pnpm -C apps/server dev      # Server만
```

#### 3단계: 접속
- Web: http://localhost:3000
- Legacy Web: http://localhost:3005
- Storybook: `pnpm watch:design-system` 후 http://localhost:6006

### 12.2 테스트 실행
```bash
# 전체 유닛 테스트 (Vitest)
pnpm test:unit

# 특정 앱 테스트
pnpm -C apps/web test:unit
```

### 12.3 린팅 및 포매팅
```bash
# ESLint 실행
pnpm -C apps/web lint

# Prettier 포맷팅 (자동 적용)
pnpm format
```

### 12.4 빌드
```bash
# 전체 빌드
pnpm build

# 특정 앱 빌드
pnpm -C apps/web build
pnpm -C apps/server build
```

---

## 13. 주요 컨벤션 및 베스트 프랙티스

### 13.1 React/Next.js 컨벤션 (.cursor/rules)
- **RSC 우선**: 가능한 경우 React Server Components 사용
- **'use client' 최소화**: 클라이언트 컴포넌트는 필요한 경우에만
- **useActionState 사용**: deprecated된 `useFormState` 대신
- **비동기 런타임 API**: `await cookies()`, `await headers()`, `await props.params`
- **interface 선호**: type보다 interface 사용
- **enum 대신 const map**: `const STATUS = { ... } as const`

### 13.2 네이밍 컨벤션
- **이벤트 핸들러**: "handle" 접두사 (`handleClick`, `handleSubmit`)
- **Boolean 상태**: 조동사 사용 (`isLoading`, `hasError`, `canSubmit`)
- **디렉토리**: 소문자 + 대시 (`components/auth-wizard`)
- **컴포넌트**: PascalCase (`AuthWizard.tsx`)

### 13.3 Import Alias 사용
```typescript
// ✅ Good (alias 사용)
import { Button } from '@design-system/podo/v3'
import { useAuth } from '@features/auth'
import { formatDate } from '@shared/utils'

// ❌ Bad (상대 경로)
import { Button } from '../../../design-system/podo/v3/Button'
```

### 13.4 에러 처리
- **에러 바운더리**: `react-error-boundary` 사용
- **Zod 검증**: 런타임 데이터 검증 필수
- **try-catch**: 비동기 작업에 try-catch 적용
- **에러 로깅**: Sentry로 자동 전송

---

## 14. 참고 문서

### 14.1 내부 문서
- `CLAUDE.md`: Claude Code용 프로젝트 가이드
- `README.md`: 프로젝트 개요
- `design-system/DESIGN-SYSTEM.md`: 디자인 시스템 개요
- `docs/web/docs/migrations/`: 마이그레이션 가이드

### 14.2 외부 문서
- [Next.js 15 문서](https://nextjs.org/docs)
- [Hono 문서](https://hono.dev)
- [Drizzle ORM 문서](https://orm.drizzle.team)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Expo 문서](https://docs.expo.dev)

---

## 15. FAQ

### Q1. 로컬 개발 시 레거시 웹이 필요한가?
**A**: 특정 페이지(예: `/app/user/podo/*`)를 테스트하지 않는다면 불필요합니다. `pnpm dev:web`으로 Web + Legacy만 실행하거나, `pnpm -C apps/web dev`로 Web만 실행 가능합니다.

### Q2. 환경 변수는 어떻게 관리하나?
**A**: AWS S3에 저장되며, `pnpm -C apps/web env:download` 명령으로 다운로드합니다. AWS CLI 설정이 필요합니다.

### Q3. 디자인 시스템 v1, v2, v3 중 어떤 것을 사용해야 하나?
**A**: 신규 개발은 **v3**을 사용하세요. v1은 레거시 호환용, v2는 기존 페이지 유지보수용입니다.

### Q4. BFF(apps/server)는 왜 필요한가?
**A**:
1. 레거시 API와 클라이언트 사이의 중간 계층 역할
2. 인증/세션 관리 중앙화
3. 데이터 변환 및 집계
4. 타입 안전한 API (Hono RPC)

### Q5. 피처 플래그는 어떻게 관리하나?
**A**: Flagsmith 대시보드에서 관리하며, 코드에서는 `@podo/flags` 패키지를 사용합니다.

---

## 16. 용어 정리

| 용어 | 설명 |
|------|------|
| **BFF** | Backend for Frontend - 클라이언트와 백엔드 사이의 중간 계층 |
| **RSC** | React Server Components - 서버에서 렌더링되는 React 컴포넌트 |
| **RPC** | Remote Procedure Call - 타입 안전한 원격 함수 호출 |
| **DDD** | Domain-Driven Design - 도메인 중심 설계 |
| **Feature Flag** | 피처 플래그 - 코드 배포 없이 기능 활성화/비활성화 |
| **Monorepo** | 모노레포 - 여러 프로젝트를 하나의 저장소에서 관리 |
| **Turbo** | Turborepo - 모노레포 빌드 시스템 |
| **EKS** | Elastic Kubernetes Service - AWS 쿠버네티스 서비스 |
| **ECR** | Elastic Container Registry - AWS Docker 레지스트리 |
| **OAuth** | 개방형 인증 표준 (Kakao, Apple 로그인) |

---

## 17. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2026-01-26 | 1.0.0 | 초기 문서 작성 | Claude Code |

---

**문서 끝**
