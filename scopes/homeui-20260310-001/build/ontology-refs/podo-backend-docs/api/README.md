---
domain: api
type: overview
last_verified: 2026-01-26
---

# PODO Backend API 개요

## 목적
PODO 백엔드 API의 엔드포인트를 도메인별로 분류하고 문서화합니다.

## API 버전
- **v1**: `/api/v1/*` - 레거시 API (점진적으로 v2로 마이그레이션 중)
- **v2**: `/api/v2/*` - 신규 API (PodoResponse 표준 응답 사용)

## 도메인별 API 문서

### 1. 사용자 (User)
- [사용자 API 문서](./user-api.md)
- 경로: `/api/v1/user`, `/api/v2/user`
- 주요 기능: 사용자 정보 조회/수정, 체험수업 STEP, 페널티/홀딩 조회

### 2. 인증 (Auth)
- [인증 API 문서](./auth-api.md)
- 경로: `/api/v1/auth`
- 주요 기능: OAuth 인증, 토큰 발급/갱신, 토큰 검증

### 3. 수강권 (Ticket)
- [수강권 API 문서](./ticket-api.md)
- 경로: `/api/v1/ticket`
- 주요 기능: 수강권 목록 조회, 횟수 변경

### 4. 수업 (Lecture)
- [수업 API 문서](./lecture-api.md)
- 경로: `/api/v1/lecture`, `/api/v2/lecture`
- 주요 기능: 수업 생성/조회, 코스 조회, 예습/복습, 체험수업

### 5. 결제 (Payment)
- [결제 API 문서](./payment-api.md)
- 경로: `/api/v1/payment/podo`
- 주요 기능: 결제 검증, 웹훅 처리, 결제 상태 확인

### 6. 쿠폰 (Coupon)
- [쿠폰 API 문서](./coupon-api.md)
- 경로: `/api/v1/coupon`
- 주요 기능: 쿠폰 발행/조회/사용, 쿠폰 템플릿 관리

## 공통 규칙

### 인증
대부분의 API는 `@AuthenticationPrincipal AuthenticatedUserDto` 를 통해 인증된 사용자 정보를 요구합니다.

### 응답 형식

#### v1 API (레거시)
```json
{
  "resultCd": "200",
  "result": { ... }
}
```

#### v2 API (표준)
```json
{
  "success": true,
  "data": { ... },
  "message": null,
  "timestamp": "2026-01-26T..."
}
```

### HTTP 상태 코드
- `200 OK`: 성공
- `404 Not Found`: 리소스 없음
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `429 Too Many Requests`: 요청 제한 초과
- `500 Internal Server Error`: 서버 오류

### Accept-Language 헤더
다국어 지원 API는 `Accept-Language` 헤더를 통해 언어를 지정합니다.
- 기본값: `ko` (한국어)
- 지원: `ko`, `en`, `ja`, `zh` 등

## 관련 파일

### 컨트롤러
- `UserController.java` - 사용자 API v1
- `UserControllerV2.java` - 사용자 API v2
- `AuthController.java` - 인증 API
- `TicketController.java` - 수강권 API
- `LectureController.java` - 수업 API v1
- `LectureControllerV2.java` - 수업 API v2
- `PaymentController.java` - 결제 API
- `CouponController.java` - 쿠폰 API

### Gateway 레이어
Gateway 패턴을 통해 비즈니스 로직을 추상화합니다.
- `UserGateway.java`
- `AuthGateway.java`
- `TicketGateway.java`
- `LectureGateway.java`
- `PaymentGateway.java`
- `CouponGateway.java`

## 다음 단계
각 도메인별 상세 API 문서를 참조하여 엔드포인트별 요청/응답 스펙을 확인하세요.
