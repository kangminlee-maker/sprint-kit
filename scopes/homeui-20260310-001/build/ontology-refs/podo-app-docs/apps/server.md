# apps/web/src/server - BFF (Backend for Frontend)

## 개요

**⚠️ 아키텍처 변경 (2026-01)**: `apps/server`는 `apps/web/src/server/`로 통합되었습니다. tsup 빌드 과정이 제거되고 Next.js API routes에서 Hono 앱을 직접 실행합니다.

`apps/web/src/server`는 Hono 기반의 Backend for Frontend (BFF) 애플리케이션입니다. Next.js 웹 앱과 React Native 네이티브 앱 사이의 중간 레이어로 동작하며, 외부 API 통합, 인증, 데이터 변환, 비즈니스 로직 처리를 담당합니다.

### 핵심 기술 스택

- **Web Framework**: Hono v4 (경량 웹 프레임워크)
- **API Schema**: `@hono/zod-openapi` (타입 안전한 OpenAPI 구현)
- **ORM**: Drizzle ORM v0.36 (타입 안전한 SQL 쿼리)
- **Validation**: Zod v3.23 (런타임 타입 검증)
- **Cache**: ioredis v5 (Redis 클라이언트)
- **Queue**: AWS SQS SDK v3 (메시지 큐)
- **Logging**: Pino v9 (고성능 로거)
- **JWT**: jose v5 (JWT 처리)
- **Pattern Matching**: ts-pattern v5 (타입 안전한 패턴 매칭)

### BFF의 역할

1. **API 통합**: 레거시 Podo API, Kakao/Apple OAuth, PortOne 결제 등 외부 API 통합
2. **인증/세션 관리**: JWT 기반 인증, Redis 세션 저장소
3. **데이터 변환**: snake_case API 응답을 camelCase로 변환
4. **비즈니스 로직**: 결제 처리, 쿠폰 적용, 구독 관리 등
5. **타입 안전성**: Zod 스키마를 통한 요청/응답 검증

---

## 프로젝트 구조

```
apps/web/src/server/
├── app.ts                    # 메인 Hono 애플리케이션 엔트리포인트
├── schemas.ts                # 공통 Zod 스키마
├── domains/                  # 도메인별 비즈니스 로직
│   ├── authentication/       # 인증 (v1, v2)
│   ├── coupons/             # 쿠폰
│   ├── lesson/              # 수업
│   ├── oauth/               # OAuth (Kakao, Apple)
│   ├── payment/             # 결제
│   ├── payment-methods/     # 결제 수단
│   ├── subscribes/          # 구독
│   └── users/               # 사용자
├── infrastructure/          # 외부 시스템 연동
│   ├── cache/              # Redis 캐시
│   ├── database/           # Drizzle ORM 스키마
│   ├── external-apis/      # 외부 API 클라이언트
│   ├── queues/             # AWS SQS
│   ├── repository/         # 데이터 액세스 레이어
│   └── rpc/                # RPC 클라이언트
├── presentation/            # HTTP 레이어
│   ├── middlewares/        # 미들웨어
│   ├── routes/             # 라우트 설정 (v1, v2)
│   ├── schema/             # 공통 스키마
│   ├── setup/              # 앱 초기화
│   └── shared/             # 공통 프레젠테이션 유틸리티
└── shared/                  # 공통 유틸리티
    ├── config/             # 환경 변수 설정
    ├── constants/          # 상수
    ├── errors/             # 에러 클래스
    ├── libs/               # 공통 라이브러리
    ├── loaders/            # 초기화 로더
    ├── types/              # 공통 타입
    └── utils/              # 유틸리티 함수
```

**Next.js 통합**:
- `apps/web/src/app/(external)/api/[...routes]/route.ts` - Hono 앱을 Next.js API route로 마운트
- tsup 빌드 제거, Next.js 런타임에서 직접 실행

---

## 도메인 구조 (domains/)

각 도메인은 독립적인 비즈니스 로직 단위로 구성됩니다.

### 도메인 아키텍처

```
domains/{domain-name}/
├── controller/              # HTTP 핸들러 (라우트 정의)
│   ├── index.ts            # 컨트롤러 팩토리 (라우터 생성)
│   └── *.handler.ts        # 개별 핸들러 (createRoute + handler)
├── dto/                     # Data Transfer Objects (Zod 스키마)
│   ├── index.ts
│   └── *.schema.ts
├── service.ts               # 비즈니스 로직
├── adapter/                 # 데이터 변환 (선택)
├── entities/                # 도메인 엔티티 (선택)
└── presenter/               # 프레젠테이션 로직 (선택)
```

### 주요 도메인

#### 1. authentication/ - 인증

**경로**: `src/domains/authentication/`

**책임**:
- JWT 토큰 생성/검증
- Redis 기반 세션 관리
- v1/v2 인증 API

**주요 파일**:
- `service.ts`: AuthenticationService (토큰 생성, 검증, Redis 저장)
- `controller/v1/index.ts`: v1 인증 API (publicRedirect)
- `controller/v2/index.ts`: v2 인증 API (authorize, callback, logout, restore, verification)
- `controller/v2/index.ts`: v2 인증 API (authorize, callback, restore, verify, logout)
- `libs/destination.api.ts`: 로그인 후 리다이렉션 목적지 관리

**API 엔드포인트**:
- `GET /api/v1/authentication/redirect` - v1 리다이렉트
- `GET /api/v2/authentication/authorize` - OAuth 인증 시작
- `GET /api/v2/authentication/callback` - OAuth 콜백
- `POST /api/v2/authentication/restore` - 토큰 복원
- `POST /api/v2/authentication/verify` - 토큰 검증
- `POST /api/v2/authentication/logout` - 로그아웃
- `GET /api/v2/authentication/validate-and-redirect` - 검증 후 리다이렉트

#### 2. oauth/ - OAuth 인증

**경로**: `src/domains/oauth/`

**책임**:
- Kakao/Apple OAuth 인증 플로우
- 소셜 로그인 처리
- 사용자 생성/매핑

**하위 도메인**:
- `kakao/`: 카카오 OAuth
  - `controller/login.handler.ts`: 카카오 로그인 콜백 처리
  - `service.ts`: KakaoService (토큰 교환, 사용자 정보 조회)
  - `dto/`: 카카오 토큰, 사용자 정보, 서비스 약관 스키마
- `apple/`: 애플 OAuth
  - `controller/login.handler.ts`: 애플 로그인 콜백 처리
  - `controller/revoke.handler.ts`: 애플 계정 연동 해제
  - `service.ts`: AppleService
- `common/`: 공통 OAuth 타입
  - `dto/provider.schema.ts`: OAuth 제공자 enum (KAKAO, APPLE)
  - `dto/common.schema.ts`: destination enum (HOME, TRIAL, SUBSCRIBE 등)

**API 엔드포인트**:
- `GET /api/v1/oauth/kakao/` - 카카오 로그인 콜백
- `GET /api/v1/oauth/apple/` - 애플 로그인 콜백
- `POST /api/v1/oauth/apple/revoke` - 애플 계정 연동 해제

#### 3. users/ - 사용자 관리

**경로**: `src/domains/users/`

**책임**:
- 사용자 프로필 조회
- 디바이스 토큰 등록
- Podo API와의 사용자 데이터 동기화

**주요 파일**:
- `service.ts`: UserService (getUserProfile, createPodoUser, updateDeviceToken)
- `controller/profile.handler.ts`: 사용자 프로필 조회
- `controller/device-token.handler.ts`: FCM 디바이스 토큰 등록
- `dto/getPodoUserInfoResBody.schema.ts`: 사용자 정보 응답 스키마
- `dto/createPodoUserResBody.schema.ts`: 사용자 생성 응답 스키마

**API 엔드포인트**:
- `GET /api/v1/users/profile` - 사용자 프로필 조회 (인증 필요)
- `POST /api/v1/users/device-token` - 디바이스 토큰 등록 (인증 필요)

#### 4. coupons/ - 쿠폰 관리

**경로**: `src/domains/coupons/`

**책임**:
- 사용 가능한 쿠폰 목록 조회
- 쿠폰 사용 내역 조회
- 쿠폰 상세 정보 조회

**주요 파일**:
- `service.ts`: CouponService (Podo API 호출)
- `controller/available.handler.ts`: 사용 가능한 쿠폰 목록
- `controller/history.handler.ts`: 쿠폰 사용 내역
- `controller/detail.handler.ts`: 쿠폰 상세 정보
- `adapter/coupon-res.adapter.ts`: 쿠폰 응답 데이터 변환

**API 엔드포인트**:
- `GET /api/v1/coupons/available` - 사용 가능한 쿠폰 목록 (인증 필요)
- `GET /api/v1/coupons/history` - 쿠폰 사용 내역 (인증 필요)
- `GET /api/v1/coupons/detail/:couponId` - 쿠폰 상세 정보 (인증 필요)

#### 5. subscribes/ - 구독 관리

**경로**: `src/domains/subscribes/`

**책임**:
- 구독 티켓 조회
- 수업 목록 조회
- AI 수업 정보 조회

**주요 파일**:
- `service.ts`: SubscribesService
- `controller/tickets.handler.ts`: 구독 티켓 목록/상세
- `controller/lessons.handler.ts`: 수업 목록 조회
- `controller/ai-lessons.handler.ts`: AI 수업 조회
- `domain/entity/`: 도메인 엔티티 (SubscriptionEntity, TrialClassEntity)
- `presenter/subscription.presenter.ts`: 프레젠테이션 로직

**API 엔드포인트**:
- `GET /api/v1/subscribes/tickets` - 구독 티켓 목록 (인증 필요)
- `GET /api/v1/subscribes/tickets/:ticketId` - 구독 티켓 상세 (인증 필요)
- `GET /api/v1/subscribes/lessons` - 수업 목록 (보호/비보호 라우트)
- `GET /api/v1/subscribes/lessons/ai` - AI 수업 목록 (보호/비보호 라우트)

#### 6. lesson/ - 수업 관리

**경로**: `src/domains/lesson/`

**책임**:
- 수업 예약/변경
- 수업 상세 정보 조회
- 수업 히스토리 조회
- 예습 완료 처리

**주요 파일**:
- `controller/book-schedule.handler.ts`: 수업 예약/변경
- `controller/level-detail.handler.ts`: 레벨별 수업 상세
- `controller/trial-level-detail.handler.ts`: 체험 수업 상세
- `controller/ai-level-detail.handler.ts`: AI 수업 상세
- `controller/history.handler.ts`: 수업 히스토리
- `controller/tickets.handler.ts`: 수업 티켓 목록
- `controller/completed-pre-study.handler.ts`: 예습 완료 처리
- `entities/lesson.entity.ts`: Lesson 엔티티
- `entities/lesson-ticket.entity.ts`: LessonTicket 엔티티

**API 엔드포인트**:
- `POST /api/v1/lesson/book` - 수업 예약 (인증 필요)
- `PUT /api/v1/lesson/change` - 수업 변경 (인증 필요)
- `GET /api/v1/lesson/level-detail` - 레벨별 수업 상세 (인증 필요)
- `GET /api/v1/lesson/trial-level-detail` - 체험 수업 상세 (인증 필요)
- `GET /api/v1/lesson/ai-level-detail` - AI 수업 상세 (인증 필요)
- `GET /api/v1/lesson/history` - 수업 히스토리 (인증 필요)
- `GET /api/v1/lesson/tickets` - 수업 티켓 목록 (인증 필요)
- `POST /api/v1/lesson/completed-pre-study` - 예습 완료 처리 (인증 필요)

#### 7. payment/ - 결제 관리

**경로**: `src/domains/payment/`

**책임**:
- PortOne 결제 웹훅 처리
- AWS SQS 메시지 전송
- 결제 수단 파킹
- Slack 로깅

**주요 파일**:
- `service.ts`: PaymentService (SQS 메시지 전송, 결제 검증)
- `strategy.ts`: PaymentStrategy (결제 타입별 처리 분기)
- `controller/notification-web-hook.handler.ts`: PortOne 웹훅
- `controller/subscribe-sqs-message.handler.ts`: 구독 결제 SQS
- `controller/trial-sqs-message.handler.ts`: 체험 결제 SQS
- `controller/lumpsum-sqs-message.handler.ts`: 일시불 결제 SQS
- `controller/ipad-sqs-message.handler.ts`: iPad 결제 SQS
- `controller/smart-talk-trial-sqs-message.handler.ts`: 스마트톡 체험 결제 SQS
- `controller/parking-payment-methods.handler.ts`: 결제 수단 파킹
- `controller/logging-slack.handler.ts`: Slack 로깅
- `dto/send-sqs-message.dto.ts`: SQS 메시지 DTO

**API 엔드포인트**:
- `POST /api/v1/payment/subscribe/sqs-message` - 구독 결제 SQS (인증 필요)
- `POST /api/v1/payment/trial/sqs-message` - 체험 결제 SQS (인증 필요)
- `POST /api/v1/payment/lumpsum/sqs-message` - 일시불 결제 SQS (인증 필요)
- `POST /api/v1/payment/ipad/sqs-message` - iPad 결제 SQS (인증 필요)
- `POST /api/v1/payment/smart-talk-trial/sqs-message` - 스마트톡 체험 결제 SQS (인증 필요)
- `POST /api/v1/payment/parking` - 결제 수단 파킹 (인증 필요)
- `POST /api/v1/payment/logging/slack` - Slack 로깅 (인증 필요)
- `POST /api/v1/portone/notification` - PortOne 웹훅 (공개)

#### 8. payment-methods/ - 결제 수단 관리

**경로**: `src/domains/payment-methods/`

**책임**:
- 등록된 결제 수단 조회
- 카드 등록

**주요 파일**:
- `service.ts`: PaymentMethodsService
- `controller/registered-payment.handler.ts`: 등록된 결제 수단 조회
- `controller/register-card.handler.ts`: 카드 등록
- `dto/registerCardReq.schema.ts`: 카드 등록 요청 스키마
- `dto/getRegisteredPaymentRes.schema.ts`: 결제 수단 조회 응답 스키마

**API 엔드포인트**:
- `GET /api/v1/payment-methods/registered` - 등록된 결제 수단 조회 (인증 필요)
- `POST /api/v1/payment-methods/register-card` - 카드 등록 (인증 필요)

---

## Infrastructure 레이어 (infrastructure/)

외부 시스템과의 통합을 담당합니다.

### 1. external-apis/ - 외부 API 클라이언트

**경로**: `src/infrastructure/external-apis/`

**구성**:
- `podo/`: Podo 레거시 API 클라이언트
  - `client.ts`: podoApiFetcher, podoBaseResponseFetcher
- `kakao/`: Kakao API 클라이언트
  - `client.ts`: kakaoOauthFetcher, kakaoApiFetcher
- `apple/`: Apple API 클라이언트
  - `client.ts`: appleOauthFetcher
- `portone/`: PortOne 결제 API 클라이언트
- `types.ts`: 공통 API 타입 (ApiFetcher, BaseResponse)
- `index.ts`: 모든 fetcher export

**주요 기능**:
- HTTP 클라이언트 추상화
- 에러 핸들링
- 타입 안전한 API 호출

### 2. cache/ - Redis 캐시

**경로**: `src/infrastructure/cache/`

**주요 파일**:
- `redis.ts`: IoRedis 클라이언트 인스턴스
- `types.ts`: Redis 타입 정의

**구성**:
```typescript
export const redis = new IoRedis({
  port: isProduction ? env.REDIS_PORT : 6379,
  host: isProduction ? env.REDIS_HOST : 'localhost',
})
```

**사용처**:
- JWT 토큰 저장 (key: token, value: userId)
- 세션 정보 저장
- 로그인 후 리다이렉션 목적지 임시 저장

### 3. database/ - Drizzle ORM

**경로**: `src/infrastructure/database/`

**주요 파일**:
- `schema/board.ts`: 게시판 스키마
- `schema/dropUser.ts`: 탈퇴 사용자 스키마
- `schema/lecture.ts`: 수업 스키마
- `schema/lectureCourse.ts`: 수업 코스 스키마
- `schema/lectureOnline.ts`: 온라인 수업 스키마
- `schema/lectureOnlineLog.ts`: 온라인 수업 로그 스키마
- `schema/lectureTicket.ts`: 수업 티켓 스키마
- `schema/tutor.ts`: 튜터 스키마
- `schema/tutorLevel.ts`: 튜터 레벨 스키마
- `schema/tutorMemo.ts`: 튜터 메모 스키마
- `schema/user.ts`: 사용자 스키마

**특징**:
- Drizzle ORM으로 타입 안전한 스키마 정의
- MySQL 데이터베이스 스키마 매핑

### 4. queues/ - AWS SQS

**경로**: `src/infrastructure/queues/`

**주요 파일**:
- `sqs.ts`: SQS 클라이언트 생성, URL 생성 유틸리티
- `index.ts`: getSqsClient, createSQSurl export

**기능**:
- AWS SQS 클라이언트 초기화
- 결제 메시지 큐 전송
- SQS URL 생성

### 5. repository/ - 데이터 액세스 레이어

**경로**: `src/infrastructure/repository/`

**주요 파일**:
- `index.ts`: 모든 repository 인스턴스 생성 및 export
- `apple-oauth-api.repository.ts`: AppleOauthApiRepository
- `kakao-api.repository.ts`: KakaoApiRepository
- `kakao-oauth-api.repository.ts`: KakaoOauthApiRepository
- `lesson.repository.ts`: LessonRepository
- `payment.repository.ts`: PaymentRepository
- `portone.repository.ts`: PortOneRepository
- `subscribe.repository.ts`: SubscribeRepository

**패턴**:
- Repository 패턴으로 데이터 액세스 추상화
- 각 외부 API를 Repository로 래핑
- Dependency Injection을 통한 Service 주입

### 6. rpc/ - RPC 클라이언트

**경로**: `src/infrastructure/rpc/`

**주요 파일**:
- `server.ts`: Hono RPC 클라이언트 (hc)
- URL 생성 헬퍼

**사용**:
```typescript
import { rpc } from '@/infrastructure/rpc/server'
const url = rpc.api.v1.oauth.kakao.$url().toString()
```

---

## Presentation 레이어 (presentation/)

HTTP 요청/응답 처리를 담당합니다.

### 1. middlewares/ - 미들웨어

**경로**: `src/presentation/middlewares/`

**주요 파일**:
- `base.ts`: baseMiddleware (sessionId, isPodoApp 설정)
- `authentication.ts`: authorizationMiddleware (Bearer 토큰 검증)

**baseMiddleware**:
```typescript
// User-Agent에서 PodoApp 앱 감지
// 쿠키에서 sessionId 추출
ctx.set('isPodoApp', isPodoApp)
ctx.set('sessionId', sessionId)
```

**authorizationMiddleware**:
```typescript
// Authorization 헤더에서 Bearer 토큰 추출
// bearerToken을 context에 설정
ctx.set('bearerToken', bearerToken)
```

### 2. routes/ - 라우트 설정

**경로**: `src/presentation/routes/`

**주요 파일**:
- `v1.ts`: createV1Router() - v1 API 라우트 정의
- `v2.ts`: createV2Router() - v2 API 라우트 정의
- `health.ts`: createHealthRouter() - 헬스체크 라우트

**v1 라우트 구성**:
```
/api/v1/
├── oauth/kakao          # 카카오 OAuth
├── oauth/apple          # 애플 OAuth
├── authentication       # 인증 (v1)
├── users                # 사용자
├── subscribes           # 구독
├── coupons              # 쿠폰
├── payment-methods      # 결제 수단
├── payment              # 결제 (보호)
├── portone              # PortOne 웹훅 (공개)
└── lesson               # 수업
```

**v2 라우트 구성**:
```
/api/v2/
└── authentication       # 인증 (v2)
```

### 3. setup/ - 앱 초기화

**경로**: `src/presentation/setup/`

**주요 파일**:
- `routes.ts`: setupRoutes() - 전체 라우트 설정
- `error-handlers.ts`: setupErrorHandlers() - 에러 핸들러 설정

**에러 핸들러**:
- 404 Not Found 처리
- Global onError 핸들러
- HttpError를 JSON 응답으로 변환

### 4. schema/ - 공통 스키마

**경로**: `src/presentation/schema/`

**공통 Zod 스키마 정의**:
- 공통 요청/응답 스키마
- 공통 파라미터 스키마

### 5. shared/ - 공통 프레젠테이션 유틸리티

**경로**: `src/presentation/shared/`

**공통 프레젠테이션 로직**

---

## Shared 레이어 (shared/)

공통 유틸리티와 라이브러리를 제공합니다.

### 1. constants/ - 상수

**경로**: `src/shared/constants/`

**주요 파일**:
- `env.ts`: 환경 변수 스키마 (Zod 검증)
- `oauth-provider.ts`: OAUTH_PROVIDER enum
- `token.ts`: 토큰 관련 상수
  - COOKIE_KEYS (ACCESS_TOKEN, REFRESH_TOKEN, USER_UID, USER_TOKEN, SESSION_ID)
  - 쿠키 옵션 (ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS 등)
  - 만료 시간 (ACCESS_TOKEN_EXPIRE_SECONDS, REFRESH_TOKEN_EXPIRE_SECONDS)

### 2. errors/ - 에러 클래스

**경로**: `src/shared/errors/`

**주요 파일**:
- `http.ts`: HttpError 클래스
- `server.ts`: ServerError 클래스, getServerErrorFromUnknown()
- `index.ts`: 에러 클래스 export

**HttpError 클래스**:
```typescript
export class HttpError<Cause = unknown> extends Error {
  public readonly status: StatusCode
  public readonly code: string
  public readonly message: string
  public readonly reason?: unknown
  public readonly cause?: Cause

  constructor(status: StatusCode, options: HttpErrorOptions<Cause>)
  
  getResponseBody(options?: { debug: boolean })
  toPlain<Cause = unknown>(): PlainHttpError<Cause>
}
```

**사용 예시**:
```typescript
throw new HttpError(400, {
  code: 'BAD_PARAMETER',
  message: 'Authorization Header is required.',
})
```

### 3. libs/ - 공통 라이브러리

**경로**: `src/shared/libs/`

**주요 파일**:
- `router.ts`: createRouter() - OpenAPIHono 라우터 생성
- `logger.ts`: Pino 로거 인스턴스
- `crypto.ts`: JWT 생성/검증 (jose)

**BaseAppBindings**:
```typescript
export type BaseAppBindings = {
  Variables: {
    isPodoApp: boolean
    sessionId: string
  }
}
```

**ProtectedAppBindings**:
```typescript
export type ProtectedAppBindings = {
  Variables: {
    bearerToken: string
    accessToken: string
    refreshToken: string
    isPodoApp: boolean
    sessionId: string
  }
}
```

### 4. loaders/ - 초기화 로더

**경로**: `src/shared/loaders/`

**주요 파일**:
- `swagger.ts`: setupSwagger() - Swagger UI 설정

**Swagger 설정**:
- `/api/swagger.json` - OpenAPI 스키마
- `/api/swagger` - Swagger UI
- Bearer 인증 스키마 등록

### 5. types/ - 공통 타입

**경로**: `src/shared/types/`

**공통 TypeScript 타입 정의**

### 6. utils/ - 유틸리티 함수

**경로**: `src/shared/utils/`

**주요 파일**:
- `case-adapter.ts`: toCamelCase, toSnakeCase (snake_case ↔ camelCase 변환)
- `validation.ts`: defaultZodResultHandler (Zod 검증 에러 핸들러)
- `performance.ts`: getTime() (성능 측정)

---

## API 엔드포인트 전체 목록

### 헬스체크

- `GET /api/health` - 헬스체크

### v1 API

#### OAuth

- `GET /api/v1/oauth/kakao/` - 카카오 로그인 콜백
  - 파일: `src/domains/oauth/kakao/controller/login.handler.ts`
- `GET /api/v1/oauth/apple/` - 애플 로그인 콜백
  - 파일: `src/domains/oauth/apple/controller/login.handler.ts`
- `POST /api/v1/oauth/apple/revoke` - 애플 계정 연동 해제
  - 파일: `src/domains/oauth/apple/controller/revoke.handler.ts`

#### 인증 (v1)

- `GET /api/v1/authentication/redirect` - 공개 리다이렉트
  - 파일: `src/domains/authentication/controller/v1/public-redirect.handler.ts`

#### 사용자

- `GET /api/v1/users/profile` - 사용자 프로필 조회 (인증)
  - 파일: `src/domains/users/controller/profile.handler.ts`
- `POST /api/v1/users/device-token` - 디바이스 토큰 등록 (인증)
  - 파일: `src/domains/users/controller/device-token.handler.ts`

#### 구독

- `GET /api/v1/subscribes/tickets` - 구독 티켓 목록 (인증)
  - 파일: `src/domains/subscribes/controller/tickets.handler.ts`
- `GET /api/v1/subscribes/tickets/:ticketId` - 구독 티켓 상세 (인증)
  - 파일: `src/domains/subscribes/controller/tickets.handler.ts`
- `GET /api/v1/subscribes/lessons` - 수업 목록
  - 파일: `src/domains/subscribes/controller/lessons.handler.ts`
- `GET /api/v1/subscribes/lessons/ai` - AI 수업 목록
  - 파일: `src/domains/subscribes/controller/ai-lessons.handler.ts`

#### 쿠폰

- `GET /api/v1/coupons/available` - 사용 가능한 쿠폰 목록 (인증)
  - 파일: `src/domains/coupons/controller/available.handler.ts`
- `GET /api/v1/coupons/history` - 쿠폰 사용 내역 (인증)
  - 파일: `src/domains/coupons/controller/history.handler.ts`
- `GET /api/v1/coupons/detail/:couponId` - 쿠폰 상세 정보 (인증)
  - 파일: `src/domains/coupons/controller/detail.handler.ts`

#### 결제 수단

- `GET /api/v1/payment-methods/registered` - 등록된 결제 수단 조회 (인증)
  - 파일: `src/domains/payment-methods/controller/registered-payment.handler.ts`
- `POST /api/v1/payment-methods/register-card` - 카드 등록 (인증)
  - 파일: `src/domains/payment-methods/controller/register-card.handler.ts`

#### 결제

- `POST /api/v1/payment/subscribe/sqs-message` - 구독 결제 SQS (인증)
  - 파일: `src/domains/payment/controller/subscribe-sqs-message.handler.ts`
- `POST /api/v1/payment/trial/sqs-message` - 체험 결제 SQS (인증)
  - 파일: `src/domains/payment/controller/trial-sqs-message.handler.ts`
- `POST /api/v1/payment/lumpsum/sqs-message` - 일시불 결제 SQS (인증)
  - 파일: `src/domains/payment/controller/lumpsum-sqs-message.handler.ts`
- `POST /api/v1/payment/ipad/sqs-message` - iPad 결제 SQS (인증)
  - 파일: `src/domains/payment/controller/ipad-sqs-message.handler.ts`
- `POST /api/v1/payment/smart-talk-trial/sqs-message` - 스마트톡 체험 결제 SQS (인증)
  - 파일: `src/domains/payment/controller/smart-talk-trial-sqs-message.handler.ts`
- `POST /api/v1/payment/parking` - 결제 수단 파킹 (인증)
  - 파일: `src/domains/payment/controller/parking-payment-methods.handler.ts`
- `POST /api/v1/payment/logging/slack` - Slack 로깅 (인증)
  - 파일: `src/domains/payment/controller/logging-slack.handler.ts`
- `POST /api/v1/portone/notification` - PortOne 웹훅 (공개)
  - 파일: `src/domains/payment/controller/notification-web-hook.handler.ts`

#### 수업

- `POST /api/v1/lesson/book` - 수업 예약 (인증)
  - 파일: `src/domains/lesson/controller/book-schedule.handler.ts`
- `PUT /api/v1/lesson/change` - 수업 변경 (인증)
  - 파일: `src/domains/lesson/controller/book-schedule.handler.ts`
- `GET /api/v1/lesson/level-detail` - 레벨별 수업 상세 (인증)
  - 파일: `src/domains/lesson/controller/level-detail.handler.ts`
- `GET /api/v1/lesson/trial-level-detail` - 체험 수업 상세 (인증)
  - 파일: `src/domains/lesson/controller/trial-level-detail.handler.ts`
- `GET /api/v1/lesson/ai-level-detail` - AI 수업 상세 (인증)
  - 파일: `src/domains/lesson/controller/ai-level-detail.handler.ts`
- `GET /api/v1/lesson/history` - 수업 히스토리 (인증)
  - 파일: `src/domains/lesson/controller/history.handler.ts`
- `GET /api/v1/lesson/tickets` - 수업 티켓 목록 (인증)
  - 파일: `src/domains/lesson/controller/tickets.handler.ts`
- `POST /api/v1/lesson/completed-pre-study` - 예습 완료 처리 (인증)
  - 파일: `src/domains/lesson/controller/completed-pre-study.handler.ts`

### v2 API

#### 인증 (v2)

- `GET /api/v2/authentication/authorize-state` - OAuth 상태 조회
  - 파일: `src/domains/authentication/controller/v2/authorize-state.handler.ts`
- `GET /api/v2/authentication/authorize` - OAuth 인증 시작
  - 파일: `src/domains/authentication/controller/v2/authorize.handler.ts`
- `GET /api/v2/authentication/callback` - OAuth 콜백
  - 파일: `src/domains/authentication/controller/v2/callback.handler.ts`
- `POST /api/v2/authentication/restore` - 토큰 복원
  - 파일: `src/domains/authentication/controller/v2/restore.handler.ts`
- `POST /api/v2/authentication/verify` - 토큰 검증
  - 파일: `src/domains/authentication/controller/v2/verification.handler.ts`
- `GET /api/v2/authentication/redirect` - 공개 리다이렉트
  - 파일: `src/domains/authentication/controller/v2/public-redirect.handler.ts`
- `POST /api/v2/authentication/logout` - 로그아웃
  - 파일: `src/domains/authentication/controller/v2/logout.handler.ts`
- `GET /api/v2/authentication/validate-and-redirect` - 검증 후 리다이렉트
  - 파일: `src/domains/authentication/controller/v2/validate-and-redirect.handler.ts`

---

## 인증 및 세션 관리

### 인증 플로우

#### 1. OAuth 로그인 (Kakao/Apple)

```
1. 클라이언트 → OAuth Provider: 인증 요청
2. OAuth Provider → BFF: 콜백 (code)
3. BFF → OAuth Provider: code로 토큰 교환
4. BFF → Podo API: 사용자 정보 조회/생성
5. BFF → Redis: JWT 토큰 저장 (key: token, value: userId)
6. BFF → 클라이언트: 쿠키 설정 (accessToken, refreshToken, userUid, userToken)
```

**파일 경로**:
- 카카오: `src/domains/oauth/kakao/controller/login.handler.ts`
- 애플: `src/domains/oauth/apple/controller/login.handler.ts`

#### 2. JWT 토큰 생성

**파일**: `src/domains/authentication/service.ts`

```typescript
async createAccessToken(userId: string): Promise<string> {
  // ACCESS_TOKEN_EXPIRE_SECONDS = 86400 (1일)
  return await this.createTokenWithRedis(userId, ACCESS_TOKEN_EXPIRE_SECONDS)
}

async createRefreshToken(userId: string): Promise<string> {
  // REFRESH_TOKEN_EXPIRE_SECONDS = 2592000 (30일)
  return await this.createTokenWithRedis(userId, REFRESH_TOKEN_EXPIRE_SECONDS)
}

private async createTokenWithRedis(userId: string, expireSeconds: number): Promise<string> {
  const now = (Date.now() / 1000) | 0
  const token = await jwt.sign({ sub: userId, exp: now + expireSeconds })
  // Redis에 토큰 저장 (TTL 설정)
  await this.redis.set(token, userId, 'EX', expireSeconds)
  return token
}
```

#### 3. JWT 토큰 검증

**파일**: `src/domains/authentication/service.ts`

```typescript
async verifyToken(token: string) {
  // Redis에서 토큰 조회
  const userId = await this.redis.get(token)
  if (!userId) {
    throw new HttpError(401, {
      code: 'INVALID_TOKEN',
      message: 'Invalid token.',
    })
  }
  
  // JWT 서명 검증
  const payload = await jwt.verify(token)
  if (payload.sub !== userId) {
    throw new HttpError(401, {
      code: 'INVALID_TOKEN',
      message: 'Token verification failed.',
    })
  }
  
  return userId
}
```

#### 4. 인증 미들웨어

**파일**: `src/presentation/middlewares/authentication.ts`

```typescript
export const authorizationMiddleware = createMiddleware<ProtectedAppBindings>(async (ctx, next) => {
  const authorizationHeader = ctx.req.header('Authorization')

  if (!authorizationHeader) {
    throw new HttpError(400, {
      code: 'BAD_PARAMETER',
      message: 'Authorization Header is required.',
    })
  }

  const [_, bearerToken] = authorizationHeader.split('Bearer ')

  if (!bearerToken) {
    throw new HttpError(400, {
      code: 'BAD_PARAMETER',
      message: 'Bearer token is required.',
    })
  }

  // bearerToken을 context에 설정 (검증은 Service에서 수행)
  ctx.set('bearerToken', bearerToken)

  await next()
})
```

### 쿠키 관리

**파일**: `src/shared/constants/token.ts`

```typescript
export const COOKIE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_UID: 'userUid',
  USER_TOKEN: 'userToken',
  SESSION_ID: 'sessionId',
} as const

export const ACCESS_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  maxAge: ACCESS_TOKEN_EXPIRE_SECONDS,
  path: '/',
}

export const APP_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: false, // React Native 앱에서 접근 가능
  secure: false,
  sameSite: 'None',
  maxAge: ACCESS_TOKEN_EXPIRE_SECONDS,
  path: '/',
}
```

### 세션 관리

**Redis 키 패턴**:
- `{token}` → `{userId}` (JWT 토큰 검증)
- `session:{sessionId}:destination` → `{destination}` (로그인 후 리다이렉션)
- `session:{sessionId}:params` → `{params}` (리다이렉션 파라미터)

---

## 에러 처리 패턴

### 1. HttpError - HTTP 에러

**파일**: `src/shared/errors/http.ts`

**사용 케이스**:
- 클라이언트 에러 (4xx)
- 비즈니스 로직 에러
- 명시적 에러 응답

**예시**:
```typescript
// 400 Bad Request
throw new HttpError(400, {
  code: 'BAD_PARAMETER',
  message: 'Invalid request data.',
  reason: ['email is required.'],
})

// 401 Unauthorized
throw new HttpError(401, {
  code: 'UNAUTHORIZED',
  message: 'Invalid credentials.',
})

// 404 Not Found
throw new HttpError(404, {
  code: 'NOT_FOUND',
  message: 'Resource not found.',
})

// 500 Internal Server Error
throw new HttpError(500, {
  code: 'INTERNAL_ERROR',
  message: 'An unexpected error occurred.',
  cause: originalError,
})
```

**응답 형식**:
```json
{
  "error": {
    "code": "BAD_PARAMETER",
    "message": "Invalid request data.",
    "reason": ["email is required."]
  }
}
```

### 2. ServerError - 서버 에러

**파일**: `src/shared/errors/server.ts`

**사용 케이스**:
- 예상치 못한 에러
- 외부 API 에러
- 시스템 에러

**getServerErrorFromUnknown()**:
```typescript
export function getServerErrorFromUnknown(error: unknown): HttpError {
  // HttpError는 그대로 반환
  if (error instanceof HttpError) {
    return error
  }
  
  // 일반 Error는 500으로 변환
  if (error instanceof Error) {
    return new HttpError(500, {
      code: 'INTERNAL_ERROR',
      message: error.message,
      cause: error,
    })
  }
  
  // 알 수 없는 에러는 500으로 변환
  return new HttpError(500, {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred.',
    cause: error,
  })
}
```

### 3. 글로벌 에러 핸들러

**파일**: `src/presentation/setup/error-handlers.ts`

```typescript
export const setupErrorHandlers = (app: OpenAPIHono) => {
  // 404 Not Found
  app.notFound(() => {
    throw new HttpError(404, {
      code: 'NOT_FOUND',
      message: 'Not found resource.',
    })
  })

  // 글로벌 에러 핸들러
  app.onError(async (error, ctx) => {
    logger.error({
      requestId: ctx.get('requestId'),
      request: ctx.req,
      method: ctx.req.method,
      path: ctx.req.path,
    })

    const httpError = getServerErrorFromUnknown(error)

    return ctx.json(
      httpError.getResponseBody({ debug: true }),
      httpError.status as ContentfulStatusCode
    )
  })
}
```

### 4. Zod 검증 에러

**파일**: `src/shared/utils/validation.ts`

```typescript
export const defaultZodResultHandler: Hook<any, any, any, any> = (result, ctx) => {
  if (!result.success) {
    return ctx.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          reason: result.error.errors,
        },
      },
      422
    )
  }
}
```

**응답 예시**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "reason": [
      {
        "path": ["email"],
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## 데이터 플로우

### 1. 요청 → 응답 플로우

```
1. 클라이언트 요청
   ↓
2. Hono 미들웨어 체인
   - requestId 생성
   - timeout 설정
   - CORS 처리
   - 로깅
   - baseMiddleware (sessionId, isPodoApp)
   - authorizationMiddleware (선택적, Bearer 토큰 검증)
   ↓
3. 라우트 핸들러 (controller/*.handler.ts)
   - Zod 스키마 검증 (자동)
   - ctx.req.valid('query'|'json'|'param') 으로 데이터 추출
   ↓
4. Service 레이어 (service.ts)
   - 비즈니스 로직 실행
   - Repository 호출
   ↓
5. Repository 레이어 (infrastructure/repository/)
   - 외부 API 호출
   - Fetcher 사용
   ↓
6. 외부 API (Podo, Kakao, Apple, PortOne)
   - HTTP 요청/응답
   ↓
7. Adapter (선택적, adapter/)
   - snake_case → camelCase 변환
   - 데이터 변환 로직
   ↓
8. 응답 반환
   - ctx.json(data, status)
   ↓
9. 에러 핸들러 (선택적)
   - HttpError → JSON 응답
   ↓
10. 클라이언트 응답
```

### 2. OAuth 로그인 플로우 (상세)

```
1. 클라이언트 → BFF: GET /api/v1/oauth/kakao/?code=xxx&state=HOME
   ↓
2. kakaoLoginHandler (src/domains/oauth/kakao/controller/login.handler.ts)
   - code, state 파라미터 추출
   - sessionId 추출
   ↓
3. kakaoService.handleKakaoLogin() (src/domains/oauth/kakao/service.ts)
   ↓
4. kakaoOauthApiRepository.getToken() (src/infrastructure/repository/kakao-oauth-api.repository.ts)
   - Kakao OAuth API로 code → 토큰 교환
   ↓
5. kakaoApiRepository.getUserInfo() (src/infrastructure/repository/kakao-api.repository.ts)
   - Kakao API로 사용자 정보 조회
   ↓
6. userService.getPodoUserByProviderId() (src/domains/users/service.ts)
   - Podo API로 사용자 조회
   - 없으면 userService.createPodoUser() 호출
   ↓
7. authenticationService.createAccessToken() (src/domains/authentication/service.ts)
   - JWT 생성
   - Redis에 저장
   ↓
8. 쿠키 설정 (setCookie)
   - accessToken, refreshToken, userUid, userToken
   ↓
9. 리다이렉트 응답
   - /callback/oauth/redirect?destination=HOME
```

### 3. 결제 웹훅 플로우

```
1. PortOne → BFF: POST /api/v1/portone/notification (웹훅)
   ↓
2. notificationWebHookHandler (src/domains/payment/controller/notification-web-hook.handler.ts)
   - 웹훅 데이터 검증
   ↓
3. paymentStrategy.execute() (src/domains/payment/strategy.ts)
   - 결제 타입별 처리 분기 (ts-pattern 사용)
   ↓
4. paymentService.sendSqsMessage() (src/domains/payment/service.ts)
   - AWS SQS 메시지 전송
   ↓
5. AWS SQS
   - 메시지 큐에 저장
   ↓
6. (백그라운드) Lambda Function
   - SQS 메시지 소비
   - Podo API 호출 (결제 처리)
```

---

## 개발 가이드

### 1. 새로운 도메인 추가하기

```bash
# 1. 도메인 디렉토리 생성
mkdir -p src/domains/new-domain/{controller,dto}

# 2. 파일 생성
touch src/domains/new-domain/service.ts
touch src/domains/new-domain/controller/index.ts
touch src/domains/new-domain/controller/list.handler.ts
touch src/domains/new-domain/dto/index.ts
touch src/domains/new-domain/dto/list-res.schema.ts
```

**service.ts** (비즈니스 로직):
```typescript
import { podoApiFetcher } from '@/infrastructure/external-apis'

export class NewDomainService {
  constructor(private readonly repository: SomeRepository) {}

  async getList(bearerToken: string) {
    return await this.repository.getList(bearerToken)
  }
}
```

**controller/list.handler.ts** (라우트 핸들러):
```typescript
import { createRoute, z } from '@hono/zod-openapi'
import { ProtectedAppRouteHandler } from '@/shared/libs/router'
import { listResSchema } from '../dto'

export const listRoute = createRoute({
  summary: '목록 조회',
  tags: ['NewDomain'],
  method: 'get',
  path: '/list',
  responses: {
    200: {
      description: '목록 조회 성공',
      content: {
        'application/json': {
          schema: listResSchema,
        },
      },
    },
  },
})

export const listHandler: ProtectedAppRouteHandler<typeof listRoute> = async (ctx) => {
  const bearerToken = ctx.get('bearerToken')
  const list = await newDomainService.getList(bearerToken)
  return ctx.json(list, 200)
}
```

**controller/index.ts** (컨트롤러 팩토리):
```typescript
import { authorizationMiddleware } from '@/presentation/middlewares/authentication'
import { createRouter, ProtectedAppBindings } from '@/shared/libs/router'
import { listHandler, listRoute } from './list.handler'

export const createNewDomainController = () => {
  const router = createRouter<ProtectedAppBindings>()
  router.use(authorizationMiddleware)
  return router.openapi(listRoute, listHandler)
}
```

**presentation/routes/v1.ts** (라우트 등록):
```typescript
import { createNewDomainController } from '@/domains/new-domain/controller'

export const createV1Router = () => {
  const router = createRouter()
  return router
    // ... 기존 라우트
    .route('/new-domain', createNewDomainController())
}
```

### 2. 새로운 외부 API 클라이언트 추가하기

```typescript
// src/infrastructure/external-apis/new-api/client.ts
import type { ApiFetcher } from '../types'

export const newApiFetcher: ApiFetcher = async ({ method, url, header, body }) => {
  const response = await fetch(`https://api.example.com${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...header,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new HttpError(response.status, {
      code: 'EXTERNAL_API_ERROR',
      message: `New API error: ${response.statusText}`,
    })
  }

  return await response.json()
}
```

### 3. 로컬 개발

```bash
# Redis 실행 (Docker)
docker run -d -p 6379:6379 redis:alpine

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집

# 개발 서버 실행
pnpm dev

# TypeScript 타입 체크
pnpm type-check

# 빌드
pnpm build
```

### 4. 테스트

현재 유닛 테스트는 설정되어 있지 않습니다. 향후 Vitest를 활용한 테스트 추가 예정.

---

## 환경 변수

**파일**: `src/shared/constants/env.ts`

```typescript
import { z } from 'zod'

const envSchema = z.object({
  // 앱 환경
  APP_ENV: z.enum(['local', 'development', 'staging', 'production', 'temp']),
  
  // URL
  PUBLIC_API_URL: z.string().url(),
  PODO_APP_URL: z.string().url(),
  PODO_WEB_URL: z.string().url(),
  
  // Redis
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  
  // AWS SQS
  AWS_SQS_QUEUE_URL: z.string(),
  AWS_REGION: z.string(),
  
  // JWT
  JWT_SECRET: z.string(),
  
  // OAuth
  KAKAO_CLIENT_ID: z.string(),
  KAKAO_CLIENT_SECRET: z.string(),
  APPLE_CLIENT_ID: z.string(),
  APPLE_TEAM_ID: z.string(),
  APPLE_KEY_ID: z.string(),
  APPLE_PRIVATE_KEY: z.string(),
  
  // PortOne
  PORTONE_API_KEY: z.string(),
  PORTONE_API_SECRET: z.string(),
})

export const env = envSchema.parse(process.env)
```

---

## 배포

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.mjs"]
```

### EKS Deployment

GitHub Actions를 통해 EKS에 자동 배포됩니다.

**배포 플로우**:
1. GitHub Push → main 브랜치
2. GitHub Actions 트리거
3. Docker 이미지 빌드 → ECR 푸시
4. Kubernetes Deployment 업데이트
5. Rolling Update 실행

---

## 모니터링 및 로깅

### Pino Logger

**파일**: `src/shared/libs/logger.ts`

```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
})
```

**사용 예시**:
```typescript
import { logger } from '@/shared/libs/logger'

logger.info({ userId: '123' }, 'User logged in')
logger.error({ error: err }, 'Payment failed')
```

### Request ID

모든 요청에 `requestId`가 자동으로 할당됩니다 (`hono/request-id` 미들웨어).

```typescript
logger.info({
  requestId: ctx.get('requestId'),
  method: ctx.req.method,
  path: ctx.req.path,
}, 'Request received')
```

---

## 주요 패턴

### 1. Repository Pattern

외부 API 호출을 Repository로 추상화:

```typescript
// infrastructure/repository/payment.repository.ts
export class PaymentRepository {
  constructor(private readonly fetcher: ApiFetcher) {}

  async getPaymentMethods(bearerToken: string) {
    return await this.fetcher({
      method: 'GET',
      url: '/api/v1/payment/methods',
      header: { Authorization: `Bearer ${bearerToken}` },
    })
  }
}
```

### 2. Adapter Pattern

API 응답 데이터를 변환:

```typescript
// domains/coupons/adapter/coupon-res.adapter.ts
export const couponResAdapter = (raw: RawCoupon): Coupon => {
  return {
    id: raw.coupon_id,
    name: raw.coupon_name,
    discountAmount: raw.discount_amount,
    expiresAt: raw.expires_at,
  }
}
```

### 3. Strategy Pattern

결제 타입별 처리 분기:

```typescript
// domains/payment/strategy.ts
export class PaymentStrategy {
  execute(paymentType: string, data: PaymentData) {
    return match(paymentType)
      .with('SUBSCRIBE', () => this.handleSubscribe(data))
      .with('TRIAL', () => this.handleTrial(data))
      .with('LUMPSUM', () => this.handleLumpsum(data))
      .otherwise(() => {
        throw new HttpError(400, {
          code: 'INVALID_PAYMENT_TYPE',
          message: 'Invalid payment type',
        })
      })
  }
}
```

### 4. Dependency Injection

Service 간 의존성 주입:

```typescript
// domains/index.ts
export const userService = new UserService(podoApiFetcher)
export const authenticationService = new AuthenticationService(redis)
export const kakaoService = new KakaoService(
  kakaoOauthApiRepository,
  kakaoApiRepository,
  userService,
  authenticationService,
)
```

---

## FAQ

### Q1. v1과 v2 인증의 차이는?

- **v1**: 단순 리다이렉트 API (`/redirect`)
- **v2**: 완전한 OAuth 플로우 (`/authorize`, `/callback`, `/restore`, `/verify`, `/logout`)

### Q2. Redis는 어떤 용도로 사용되나?

- JWT 토큰 저장 (key: token, value: userId)
- 세션 정보 저장 (로그인 후 리다이렉션 목적지)
- 토큰 TTL 관리

### Q3. SQS는 어떤 용도로 사용되나?

- PortOne 결제 웹훅 수신 후 비동기 처리
- Lambda Function으로 메시지 전달
- 결제 완료 후 Podo API 호출 (백그라운드)

### Q4. snake_case → camelCase 변환은 어디서?

- Adapter 레이어에서 수동 변환
- 예: `coupon-res.adapter.ts`
- 향후 자동 변환 유틸리티 추가 예정

### Q5. OpenAPI 문서는 어디서 볼 수 있나?

- 로컬: `http://localhost:3000/api/swagger`
- Swagger JSON: `http://localhost:3000/api/swagger.json`
- 프로덕션에서는 비활성화됨 (`env.APP_ENV !== 'production'`)

---

## 관련 문서

- [apps/web 문서](./web.md) - Next.js 웹 앱
- [apps/native 문서](./native.md) - React Native 네이티브 앱
- [전체 아키텍처](../architecture.md) - 모노레포 아키�ecture
