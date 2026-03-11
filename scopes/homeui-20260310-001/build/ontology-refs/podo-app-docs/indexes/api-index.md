# API Index - Podo Service

모든 API 엔드포인트 인덱스 (apps/server BFF)

## API v1 Endpoints

### Authentication (인증) - v1

| HTTP | 엔드포인트 | 파일 경로 | 설명 | 요청 | 응답 | 키워드 |
|------|-----------|----------|------|------|------|--------|
| GET | `/api/v1/auth/public-redirect` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v1/public-redirect.handler.ts` | 퍼블릭 리다이렉트 (v1) | - | Redirect | v1, redirect, public, auth |

---

## API v2 Endpoints

### Authentication (인증) - v2

| HTTP | 엔드포인트 | 파일 경로 | 설명 | 요청 | 응답 | 키워드 |
|------|-----------|----------|------|------|------|--------|
| GET | `/api/v2/auth/authorize` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/authorize.handler.ts` | OAuth 인증 시작 (카카오/Apple) | Query: provider, redirect_uri | Redirect to OAuth provider | v2, authorize, oauth, kakao, apple |
| GET | `/api/v2/auth/authorize-state` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/authorize-state.handler.ts` | OAuth 인증 상태 조회 | Query: state | JSON: { valid: boolean } | v2, state, oauth, validation |
| GET | `/api/v2/auth/callback` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/callback.handler.ts` | OAuth 콜백 처리 (토큰 교환) | Query: code, state | Redirect with session | v2, callback, oauth, token |
| POST | `/api/v2/auth/logout` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/logout.handler.ts` | 로그아웃 (세션 삭제) | - | JSON: { success: boolean } | v2, logout, session |
| GET | `/api/v2/auth/public-redirect` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/public-redirect.handler.ts` | 퍼블릭 리다이렉트 | - | Redirect | v2, redirect, public |
| POST | `/api/v2/auth/restore` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/restore.handler.ts` | 세션 복원 (리프레시) | Body: { refreshToken } | JSON: { accessToken, user } | v2, restore, session, refresh |
| POST | `/api/v2/auth/validate-and-redirect` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/validate-and-redirect.handler.ts` | 세션 검증 및 리다이렉트 | Body: { token } | Redirect | v2, validate, redirect, check |
| GET | `/api/v2/auth/verification` | `~/podo-app-DOC/apps/server/src/domains/authentication/controller/v2/verification.handler.ts` | 인증 상태 검증 | Header: Authorization | JSON: { valid: boolean, user } | v2, verification, check, session |

---

## API v1 - OAuth (소셜 로그인)

### OAuth - Kakao

| HTTP | 엔드포인트 | 파일 경로 | 설명 | 요청 | 응답 | 키워드 |
|------|-----------|----------|------|------|------|--------|
| GET | `/api/v1/oauth/kakao/login` | `~/podo-app-DOC/apps/server/src/domains/oauth/kakao/controller/login.handler.ts` | 카카오 로그인 콜백 처리 | Query: code | Redirect with session | kakao, login, oauth, callback |

**서비스**: `~/podo-app-DOC/apps/server/src/domains/oauth/kakao/service.ts`
- 카카오 OAuth 토큰 교환
- 카카오 사용자 정보 조회
- 서비스 약관 동의 정보 조회

**DTO**:
- `KakaoOAuthToken`: `~/podo-app-DOC/apps/server/src/domains/oauth/kakao/dto/kakaoOAuthToken.schema.ts`
- `KakaoUserInfo`: `~/podo-app-DOC/apps/server/src/domains/oauth/kakao/dto/kakaoUserInfo.schema.ts`
- `KakaoServiceTerms`: `~/podo-app-DOC/apps/server/src/domains/oauth/kakao/dto/kakaoServiceTerms.schema.ts`

### OAuth - Apple

| HTTP | 엔드포인트 | 파일 경로 | 설명 | 요청 | 응답 | 키워드 |
|------|-----------|----------|------|------|------|--------|
| POST | `/api/v1/oauth/apple/login` | `~/podo-app-DOC/apps/server/src/domains/oauth/apple/controller/login.handler.ts` | Apple 로그인 콜백 처리 | Body: { code, id_token } | JSON: { accessToken, user } | apple, login, oauth, callback |
| POST | `/api/v1/oauth/apple/revoke` | `~/podo-app-DOC/apps/server/src/domains/oauth/apple/controller/revoke.handler.ts` | Apple 계정 탈퇴 처리 | Body: { userId } | JSON: { success: boolean } | apple, revoke, delete, withdrawal |

**서비스**: `~/podo-app-DOC/apps/server/src/domains/oauth/apple/service.ts`
- Apple OAuth 토큰 교환
- Apple ID 토큰 검증
- Apple 계정 탈퇴 처리

**DTO**:
- `AppleOAuthToken`: `~/podo-app-DOC/apps/server/src/domains/oauth/apple/dto/appleOAuthToken.schema.ts`

---

## API v1 - Coupons (쿠폰)

| HTTP | 엔드포인트 | 파일 경로 | 설명 | 요청 | 응답 | 키워드 |
|------|-----------|----------|------|------|------|--------|
| GET | `/api/v1/coupons/available` | `~/podo-app-DOC/apps/server/src/domains/coupons/controller/available.handler.ts` | 사용 가능한 쿠폰 목록 조회 | Header: Authorization | JSON: Coupon[] | coupons, available, list |
| GET | `/api/v1/coupons/detail` | `~/podo-app-DOC/apps/server/src/domains/coupons/controller/detail.handler.ts` | 쿠폰 상세 정보 조회 | Query: couponId | JSON: CouponDetail | coupons, detail |
| GET | `/api/v1/coupons/history` | `~/podo-app-DOC/apps/server/src/domains/coupons/controller/history.handler.ts` | 쿠폰 사용 이력 조회 | Header: Authorization | JSON: CouponHistory[] | coupons, history, used |

**서비스**: `~/podo-app-DOC/apps/server/src/domains/coupons/service.ts`
- 사용 가능 쿠폰 조회
- 쿠폰 상세 정보 조회
- 쿠폰 사용 이력 조회

**DTO**:
- `Coupon`: `~/podo-app-DOC/apps/server/src/domains/coupons/dto/coupon.schema.ts`
- `GetCouponDetailRes`: `~/podo-app-DOC/apps/server/src/domains/coupons/dto/getCouponDetailRes.schema.ts`
- `GetCouponRes`: `~/podo-app-DOC/apps/server/src/domains/coupons/dto/getCouponRes.schema.ts`

**어댑터**:
- `CouponResAdapter`: `~/podo-app-DOC/apps/server/src/domains/coupons/adapter/coupon-res.adapter.ts`

---

## API v1 - Lessons (수업)

| HTTP | 엔드포인트 | 파일 경로 | 설명 | 요청 | 응답 | 키워드 |
|------|-----------|----------|------|------|------|--------|
| GET | `/api/v1/lessons/history` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/history.handler.ts` | 수업 이력 조회 (정규/체험) | Header: Authorization, Query: type | JSON: Lesson[] | lessons, history, list |
| POST | `/api/v1/lessons/book-schedule` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/book-schedule.handler.ts` | 수업 예약하기 | Body: { scheduleId, ticketId } | JSON: { resultCd: number, data: unknown } | lessons, booking, schedule, reservation |
| GET | `/api/v1/lessons/tickets` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/tickets.handler.ts` | 수업권 조회 (사용 가능한 티켓) | Header: Authorization | JSON: LessonTicket[] | lessons, tickets, list |
| GET | `/api/v1/lessons/level-detail` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/level-detail.handler.ts` | 정규 수업 레벨 상세 정보 | Query: levelId | JSON: LevelDetail | lessons, level, detail, regular |
| GET | `/api/v1/lessons/ai-level-detail` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/ai-level-detail.handler.ts` | AI 수업 레벨 상세 정보 | Query: levelId | JSON: AILevelDetail | lessons, ai, level, detail |
| GET | `/api/v1/lessons/trial-level-detail` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/trial-level-detail.handler.ts` | 체험 수업 레벨 상세 정보 | Query: levelId | JSON: TrialLevelDetail | lessons, trial, level, detail |
| POST | `/api/v1/lessons/completed-pre-study` | `~/podo-app-DOC/apps/server/src/domains/lesson/controller/completed-pre-study.handler.ts` | 예습 완료 처리 | Body: { lessonId } | JSON: { success: boolean } | lessons, pre-study, complete |

**응답 형식 (중요)**: Lesson 관련 API는 `createBaseResponseSchema`를 사용하며, 결과 코드는 `resultCd: number` (숫자형), 데이터는 `data` 필드로 접근합니다 (구 `result` 필드 대체).

```typescript
// BaseResponse 형식
{
  resultCd: number,        // 숫자형 결과 코드 (200, 429, 500 등)
  resultCdName: string,    // 결과 코드 이름
  message: string | null,  // 메시지 (에러 시 사용)
  data: T                  // 실제 데이터
}
```

**DTO**:
- 요청: `~/podo-app-DOC/apps/server/src/domains/lesson/dto/req.schema.ts`
- 응답: `~/podo-app-DOC/apps/server/src/domains/lesson/dto/res.schema.ts`

**엔티티**:
- `Lesson`: `~/podo-app-DOC/apps/server/src/domains/lesson/entities/lesson.entity.ts`
- `LessonTicket`: `~/podo-app-DOC/apps/server/src/domains/lesson/entities/lesson-ticket.entity.ts`

---

## API v1 - Subscribes (구독/이용권)

| HTTP | 엔드포인트 | 파일 경로 | 설명 | 요청 | 응답 | 키워드 |
|------|-----------|----------|------|------|------|--------|
| GET | `/api/v1/subscribes/tickets` | `~/podo-app-DOC/apps/server/src/domains/subscribes/controller/tickets.handler.ts` | 이용권 목록 조회 (구매 가능한 상품) | - | JSON: SubscribeTicket[] | subscribes, tickets, products, list |
| GET | `/api/v1/subscribes/lessons` | `~/podo-app-DOC/apps/server/src/domains/subscribes/controller/lessons.handler.ts` | 구독별 수업 목록 조회 | Query: subscribeId | JSON: Lesson[] | subscribes, lessons, list |
| GET | `/api/v1/subscribes/lessons/ai` | `~/podo-app-DOC/apps/server/src/domains/subscribes/controller/ai-lessons.handler.ts` | AI 수업 목록 조회 | Header: Authorization | JSON: AILesson[] | subscribes, ai, lessons, character-chat |

---

## API v1 - Payment Methods (결제 수단)

| HTTP | 엔드포인트 | 파일 경로 | 설명 | 요청 | 응답 | 키워드 |
|------|-----------|----------|------|------|------|--------|
| GET | `/api/v1/payment-methods/registered-payment` | `~/podo-app-DOC/apps/server/src/domains/payment-methods/controller/registered-payment.handler.ts` | 등록된 결제 수단 조회 | Header: Authorization | JSON: PaymentMethod[] | payment-methods, cards, list |
| POST | `/api/v1/payment-methods/register-card` | `~/podo-app-DOC/apps/server/src/domains/payment-methods/controller/register-card.handler.ts` | 카드 등록 (빌링키 발급) | Body: RegisterCardReq | JSON: RegisterCardRes | payment-methods, register, card, billing-key |

**서비스**: `~/podo-app-DOC/apps/server/src/domains/payment-methods/service.ts`
- 등록된 결제 수단 조회
- 카드 등록 (빌링키 발급)

**DTO**:
- `GetRegisteredPaymentRes`: `~/podo-app-DOC/apps/server/src/domains/payment-methods/dto/getRegisteredPaymentRes.schema.ts`
- `RegisterCardReq`: `~/podo-app-DOC/apps/server/src/domains/payment-methods/dto/registerCardReq.schema.ts`
- `RegisterCardRes`: `~/podo-app-DOC/apps/server/src/domains/payment-methods/dto/registerCardRes.schema.ts`

---

## API v1 - Users (사용자)

| HTTP | 엔드포인트 | 파일 경로 | 설명 | 요청 | 응답 | 키워드 |
|------|-----------|----------|------|------|------|--------|
| GET | `/api/v1/users/profile` | `~/podo-app-DOC/apps/server/src/domains/users/controller/profile.handler.ts` | 사용자 프로필 조회 | Header: Authorization | JSON: UserProfile | users, profile |
| POST | `/api/v1/users/device-token` | `~/podo-app-DOC/apps/server/src/domains/users/controller/device-token.handler.ts` | 디바이스 토큰 등록 (푸시 알림용) | Body: { deviceToken, platform } | JSON: { success: boolean } | users, device-token, push, fcm |
| GET | `/api/v1/users/welcomeback-promotion` | `~/podo-app-DOC/apps/server/src/domains/users/controller/welcomeback-promotion.handler.ts` | 만료 고객 프로모션 자격 조회 | Header: Authorization | JSON: WelcomeBackPromotion | users, welcomeback, promotion, churn-prevention |

---

## API v1 - Payment (결제 처리)

### Payment - SQS Message Handlers (비동기 결제 처리)

| HTTP | 엔드포인트 | 파일 경로 | 설명 | 요청 | 응답 | 키워드 |
|------|-----------|----------|------|------|------|--------|
| POST | `/api/v1/payment/subscribe-sqs-message` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/subscribe-sqs-message.handler.ts` | 구독 결제 SQS 메시지 처리 | Body: SQS Message | JSON: { success: boolean } | payment, sqs, subscribe, async |
| POST | `/api/v1/payment/trial-sqs-message` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/trial-sqs-message.handler.ts` | 체험 결제 SQS 메시지 처리 | Body: SQS Message | JSON: { success: boolean } | payment, sqs, trial, async |
| POST | `/api/v1/payment/lumpsum-sqs-message` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/lumpsum-sqs-message.handler.ts` | 일시불 결제 SQS 메시지 처리 | Body: SQS Message | JSON: { success: boolean } | payment, sqs, lumpsum, async |
| POST | `/api/v1/payment/ipad-sqs-message` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/ipad-sqs-message.handler.ts` | iPad 결제 SQS 메시지 처리 | Body: SQS Message | JSON: { success: boolean } | payment, sqs, ipad, async |
| POST | `/api/v1/payment/smart-talk-trial-sqs-message` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/smart-talk-trial-sqs-message.handler.ts` | 스마트톡 체험 결제 SQS | Body: SQS Message | JSON: { success: boolean } | payment, sqs, smart-talk, trial, async |

### Payment - Webhooks & Utilities

| HTTP | 엔드포인트 | 파일 경로 | 설명 | 요청 | 응답 | 키워드 |
|------|-----------|----------|------|------|------|--------|
| POST | `/api/v1/payment/notification-web-hook` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/notification-web-hook.handler.ts` | PG사 결제 웹훅 (실시간 결제 알림) | Body: Webhook Payload | JSON: { success: boolean } | payment, webhook, notification, pg |
| POST | `/api/v1/payment/logging-slack` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/logging-slack.handler.ts` | 결제 로그 Slack 전송 | Body: LogData | JSON: { success: boolean } | payment, slack, logging, monitoring |
| POST | `/api/v1/payment/parking-payment-methods` | `~/podo-app-DOC/apps/server/src/domains/payment/controller/parking-payment-methods.handler.ts` | 결제 수단 파킹 (임시 저장) | Body: PaymentMethodData | JSON: { success: boolean } | payment, parking, temporary |

---

## BFF Infrastructure

### Middleware
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/server/src/presentation/middlewares/base.ts` | 기본 미들웨어 (로깅, 에러 처리) | middleware, base, logging |

### Setup
| 파일 경로 | 설명 | 키워드 |
|----------|------|--------|
| `~/podo-app-DOC/apps/server/src/presentation/setup/routes.ts` | 라우트 설정 | routes, setup, registration |
| `~/podo-app-DOC/apps/server/src/presentation/setup/error-handlers.ts` | 에러 핸들러 설정 | error-handlers, setup |

### Domain Services (비즈니스 로직)
| 도메인 | 파일 경로 | 설명 | 키워드 |
|--------|----------|------|--------|
| Authentication | `~/podo-app-DOC/apps/server/src/domains/authentication/service.ts` | 인증 서비스 | auth, service, oauth |
| OAuth Kakao | `~/podo-app-DOC/apps/server/src/domains/oauth/kakao/service.ts` | 카카오 OAuth 서비스 | kakao, oauth, service |
| OAuth Apple | `~/podo-app-DOC/apps/server/src/domains/oauth/apple/service.ts` | Apple OAuth 서비스 | apple, oauth, service |
| Coupons | `~/podo-app-DOC/apps/server/src/domains/coupons/service.ts` | 쿠폰 서비스 | coupons, service |
| Payment Methods | `~/podo-app-DOC/apps/server/src/domains/payment-methods/service.ts` | 결제 수단 서비스 | payment-methods, service |

---

## API Response Patterns

### 성공 응답
```typescript
{
  success: true,
  data: T,
  message?: string
}
```

### 에러 응답
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### 리다이렉트 응답
- HTTP 302 Redirect
- Location 헤더에 리다이렉트 URL 포함

---

## Authentication Flow

### OAuth 인증 플로우 (v2)
1. `GET /api/v2/auth/authorize` - OAuth 인증 시작 (카카오/Apple 선택)
2. OAuth Provider에서 인증 후 콜백
3. `GET /api/v2/auth/callback` - 콜백 처리 및 세션 생성
4. `GET /api/v2/auth/verification` - 세션 검증 (매 요청마다)
5. `POST /api/v2/auth/logout` - 로그아웃

### 세션 복원 플로우
1. `POST /api/v2/auth/restore` - 리프레시 토큰으로 세션 복원

---

## Payment Flow

### 결제 프로세스
1. **결제 수단 등록**: `POST /api/v1/payment-methods/register-card`
2. **구독 선택**: `GET /api/v1/subscribes/tickets`
3. **결제 요청**: 클라이언트에서 PG사 API 호출
4. **웹훅 수신**: `POST /api/v1/payment/notification-web-hook`
5. **SQS 메시지 처리**:
   - 구독: `POST /api/v1/payment/subscribe-sqs-message`
   - 체험: `POST /api/v1/payment/trial-sqs-message`
   - 일시불: `POST /api/v1/payment/lumpsum-sqs-message`

---

## Integration Points

### 외부 API 통합
- **PG사 (결제)**: 웹훅 및 SQS를 통한 비동기 처리
- **Kakao API**: OAuth 로그인, 사용자 정보 조회
- **Apple API**: OAuth 로그인, ID 토큰 검증
- **Slack API**: 결제 로그 알림

### 내부 서비스 통합
- **Redis**: 세션 저장소 (accessToken → uid 매핑)
- **SQS**: 비동기 결제 처리 큐
- **Database**: 사용자, 구독, 수업 데이터

---

## API Versioning

### v1 (현재 활성)
- 대부분의 비즈니스 로직 API
- 쿠폰, 수업, 구독, 결제, 사용자 API

### v2 (신규 인증)
- 개선된 OAuth 인증 플로우
- 세션 관리 개선
- 보안 강화

### 마이그레이션 가이드
- v1 → v2: 인증 API만 v2로 마이그레이션
- 나머지 도메인 API는 v1 유지
