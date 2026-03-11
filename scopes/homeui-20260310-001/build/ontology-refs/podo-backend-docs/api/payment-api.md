---
domain: api
type: endpoint
related_files:
  - src/main/java/com/speaking/podo/applications/payment/controller/PaymentController.java
  - src/main/java/com/speaking/podo/applications/payment/gateway/PaymentGateway.java
  - src/main/java/com/speaking/podo/applications/payment/service/PaymentService.java
  - src/main/java/com/speaking/podo/modules/portone/dto/response/PortoneDto.java
keywords: [payment, 결제, 구독, 포트원, webhook, 검증]
last_verified: 2026-01-26
---

# 결제 API

## 엔드포인트 목록

### 1. 결제 검증

#### GET /api/v1/payment/podo/validate
- **설명**: 결제 가능 여부 사전 검증
- **인증**: 불필요
- **요청 파라미터**:
  - `userId` (Integer): 사용자 ID
  - `subscribeId` (String): 구독 상품 ID
  - `couponId` (String, optional): 쿠폰 ID
- **응답**: `PodoResponse<?>`
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "결제 가능",
    "originalPrice": 50000,
    "discountAmount": 5000,
    "finalPrice": 45000
  }
}
```
- **검증 항목**:
  - 사용자 존재 여부
  - 구독 상품 유효성
  - 쿠폰 사용 가능 여부
  - 중복 결제 여부
- **관련 정책**: 결제 전 검증, 쿠폰 적용 가능 여부
- **파일**: `PaymentController.java:27-30`

### 2. 결제 성공 콜백

#### POST /api/v1/payment/podo/success
- **설명**: 결제 성공 후 클라이언트 콜백 (현재 비활성)
- **인증**: 불필요
- **요청 바디**: `PortoneWebhookRequest`
- **응답**: 200 OK
- **파일**: `PaymentController.java:32-35`

### 3. 결제 웹훅

#### POST /api/v1/payment/podo/webhook
- **설명**: 포트원(Portone) 결제 웹훅 처리
- **인증**: 불필요 (포트원 서버에서 호출)
- **요청 바디**: `PortoneWebhookRequest`
```json
{
  "type": "Transaction.Paid",
  "data": {
    "transactionId": "tx_abc123",
    "paymentId": "payment_xyz",
    "status": "PAID",
    "amount": 50000,
    "currency": "KRW",
    "customData": {
      "userId": 123,
      "subscribeId": "sub_001",
      "couponId": "coupon_123"
    }
  }
}
```
- **쿼리 파라미터** (관리자 재결제 시):
  - `admin` (String, optional): 관리자 모드 플래그
  - `user_id` (String, optional): 사용자 ID
  - `payment_id` (String, optional): 결제 ID
  - `subscribe_id` (String, optional): 구독 ID
  - `subscribe_mapp_id` (String, optional): 구독 매핑 ID
  - `coupon_id` (String, optional): 쿠폰 ID
  - `admin_re_paid` (String, optional): 관리자 재결제 플래그
- **응답**: `PodoResponse<?>`
```json
{
  "success": true,
  "data": "success to request webhook"
}
```
- **처리 로직**:
  1. 웹훅 요청 검증
  2. 결제 정보 조회 및 검증
  3. 구독/수강권 활성화
  4. 쿠폰 사용 처리
  5. 결제 이력 기록
  6. 사용자 알림 발송
- **관련 정책**: 웹훅 보안, 멱등성 보장, 재시도 처리
- **파일**: `PaymentController.java:37-76`

### 4. 결제 상태 확인 (Polling)

#### GET /api/v1/payment/podo/check/{impUid}
- **설명**: 결제 상태 확인 (폴링용)
- **인증**: 필요
- **경로 파라미터**:
  - `impUid` (String): 포트원 거래 고유 ID
- **쿼리 파라미터**:
  - `isFree` (Boolean, optional): 무료 결제 여부 (기본값: false)
- **응답**: `PodoResponse<?>`
```json
{
  "success": true,
  "data": {
    "status": "PAID",
    "paymentId": 12345,
    "subscribeId": "sub_001",
    "activatedAt": "2026-01-26T10:00:00",
    "expiresAt": "2026-02-26T23:59:59"
  }
}
```
- **상태 코드**:
  - `PENDING`: 결제 대기 중
  - `PAID`: 결제 완료
  - `FAILED`: 결제 실패
  - `CANCELLED`: 결제 취소
- **사용 시나리오**: 클라이언트가 결제 완료 후 상태를 주기적으로 확인
- **관련 정책**: 폴링 간격 제한 (권장: 1초), 최대 30초 폴링 후 타임아웃
- **파일**: `PaymentController.java:78-82`

## 결제 플로우

### 일반 결제 플로우
```
1. Client → GET /payment/podo/validate (사전 검증)
2. Client → 포트원 결제 SDK 호출
3. 포트원 → 결제 처리
4. 포트원 → POST /payment/podo/webhook (비동기 웹훅)
5. Server → 구독/수강권 활성화
6. Server → 사용자 알림 발송
7. Client → GET /payment/podo/check/{impUid} (폴링으로 확인)
```

### 관리자 재결제 플로우
```
1. Admin → POST /payment/podo/webhook?admin=true&user_id=123&...
2. Server → 관리자 권한 검증 (현재는 쿼리 파라미터로 전달)
3. Server → 결제 없이 구독 활성화
4. Server → 이력 기록 (admin_re_paid=true)
```

### 무료 결제 플로우
```
1. Client → 포트원 무료 결제 SDK 호출 (0원)
2. 포트원 → POST /payment/podo/webhook
3. Server → isFree=true로 처리
4. Server → 무료 구독/수강권 활성화
```

## 웹훅 보안

### 검증 항목
1. **Host 헤더 검증**: 포트원 서버에서 호출되었는지 확인
2. **서명 검증**: 포트원 제공 서명 검증 (구현 필요)
3. **멱등성 보장**: 동일 impUid에 대해 중복 처리 방지
4. **재시도 처리**: 웹훅 실패 시 포트원에서 자동 재시도

### 헤더 로깅
```java
Enumeration<String> headerNames = request.getHeaderNames();
headerNames.asIterator().forEachRemaining(headerName ->
    log.trace("header: {} = {}", headerName, request.getHeader(headerName))
);
```

## 관련 서비스

### PaymentGateway
- 결제 비즈니스 로직 게이트웨이
- 주요 메서드: `validate()`, `processWebhook()`, `checkPayment()`

### PaymentService
- 결제 처리 및 이력 관리
- 구독 활성화, 수강권 발급, 쿠폰 적용

## 주요 정책

1. **결제 검증**: 결제 전 사전 검증 필수
2. **웹훅 멱등성**: 동일 거래에 대해 중복 처리 방지
3. **폴링 제한**: 최대 30초, 1초 간격 권장
4. **무료 결제**: 0원 결제도 웹훅 처리 필요
5. **관리자 재결제**: 쿼리 파라미터로 전달 (보안 강화 필요)
6. **쿠폰 적용**: 결제 시 쿠폰 자동 사용 처리
7. **자동 활성화**: 결제 완료 시 즉시 구독/수강권 활성화

## 에러 처리

### 클라이언트 에러
- `400 Bad Request`: 잘못된 요청 파라미터
- `401 Unauthorized`: 인증 실패
- `404 Not Found`: 결제 정보 없음
- `409 Conflict`: 중복 결제

### 서버 에러
- `500 Internal Server Error`: 서버 오류
- `502 Bad Gateway`: 포트원 통신 오류
- `503 Service Unavailable`: 서비스 일시 중단

### 재시도 정책
- 웹훅 실패 시 포트원에서 자동 재시도 (최대 10회)
- 재시도 간격: 1분, 5분, 30분, 1시간, 6시간, 24시간

## CustomData 구조

### 일반 결제
```json
{
  "userId": 123,
  "paymentId": 0,
  "subscribeId": "sub_001",
  "subscribeMapId": "map_123",
  "subscribeMappId": "map_123",
  "couponId": "coupon_123",
  "adminRePaid": false
}
```

### 관리자 재결제
```json
{
  "userId": 123,
  "paymentId": 456,
  "subscribeId": "sub_001",
  "subscribeMapId": "map_123",
  "subscribeMappId": "map_123",
  "couponId": "coupon_123",
  "adminRePaid": true
}
```
