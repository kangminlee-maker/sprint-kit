---
domain: api
type: endpoint
related_files:
  - src/main/java/com/speaking/podo/applications/coupon/delivery/CouponController.java
  - src/main/java/com/speaking/podo/applications/coupon/gateway/CouponGateway.java
  - src/main/java/com/speaking/podo/applications/coupon/usecase/CouponService.java
  - src/main/java/com/speaking/podo/applications/coupon/domain/serialize/ApplyCondition.java
keywords: [coupon, 쿠폰, 할인, 템플릿, 발급, 사용]
last_verified: 2026-01-26
---

# 쿠폰 API

## 엔드포인트 목록

### 1. 쿠폰 조회

#### GET /api/v1/coupon/getCoupons
- **설명**: 사용자 쿠폰 목록 조회
- **인증**: 필요
- **요청 파라미터**:
  - `displayStatus` (String): 표시 상태 (AVAILABLE, USED, EXPIRED, ALL)
- **응답**: `PodoResponse<?>`
```json
{
  "success": true,
  "data": [
    {
      "couponId": "coupon_123",
      "couponName": "신규 가입 10% 할인",
      "discountType": "PERCENTAGE",
      "discountValue": 10,
      "minOrderAmount": 30000,
      "maxDiscountAmount": 10000,
      "startDate": "2026-01-01",
      "endDate": "2026-03-31",
      "status": "AVAILABLE"
    }
  ]
}
```
- **관련 정책**: 상태별 쿠폰 필터링
- **파일**: `CouponController.java:129-138`

#### GET /api/v1/coupon/getCouponDetail
- **설명**: 쿠폰 상세정보 조회
- **인증**: 필요
- **요청 파라미터**:
  - `couponId` (String): 쿠폰 ID
- **응답**:
```json
{
  "resultCd": "200",
  "result": {
    "couponId": "coupon_123",
    "couponName": "신규 가입 10% 할인",
    "description": "첫 구매 시 10% 할인",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "minOrderAmount": 30000,
    "maxDiscountAmount": 10000,
    "applicableSubscribes": ["sub_001", "sub_002"],
    "startDate": "2026-01-01",
    "endDate": "2026-03-31",
    "termsAndConditions": "..."
  }
}
```
- **파일**: `CouponController.java:140-151`

#### GET /api/v1/coupon/getCouponsForPayment
- **설명**: 결제 시 사용 가능한 쿠폰 목록 조회
- **인증**: 필요
- **요청 파라미터**:
  - `subscribeId` (String): 구독 상품 ID
- **응답**: `PodoResponse<?>` - 해당 구독 상품에 적용 가능한 쿠폰 목록
- **파일**: `CouponController.java:118-127`

### 2. 쿠폰 사용 가능 여부

#### GET /api/v1/coupon/canUseCoupon
- **설명**: 쿠폰 사용 가능 여부 체크
- **인증**: 필요
- **요청 파라미터**:
  - `subscribeId` (String): 구독 상품 ID
  - `couponId` (String): 쿠폰 ID
- **응답**: `PodoResponse<Boolean>`
```json
{
  "success": true,
  "data": true
}
```
- **검증 항목**:
  - 쿠폰 유효기간
  - 최소 주문 금액
  - 적용 가능한 상품 여부
  - 쿠폰 사용 상태
- **파일**: `CouponController.java:67-78`

#### GET /api/v1/coupon/calculate
- **설명**: 쿠폰 적용 시 할인 금액 계산
- **인증**: 불필요
- **요청 파라미터**:
  - `subscribeId` (String): 구독 상품 ID
  - `couponId` (String): 쿠폰 ID
- **응답**: `PodoResponse<?>`
```json
{
  "success": true,
  "data": {
    "originalPrice": 50000,
    "discountAmount": 5000,
    "finalPrice": 45000,
    "couponApplied": true
  }
}
```
- **파일**: `CouponController.java:343-346`

### 3. 쿠폰 발급

#### POST /api/v1/coupon/publishCoupon
- **설명**: 쿠폰 발급 (크론잡용)
- **인증**: 필요
- **요청 바디**: `CouponPublishDto`
```json
{
  "templateId": 1,
  "userId": 123,
  "publishReason": "신규 가입 이벤트"
}
```
- **쿼리 파라미터**:
  - `subscribeIdOrNull` (String, optional): 구독 ID (특정 구독에 대한 쿠폰)
- **응답**: `PodoResponse<?>`
- **파일**: `CouponController.java:80-89`

#### POST /api/v1/coupon/publishAfterTrialCouponForPhp
- **설명**: 체험수업 완료 쿠폰 발급 (podo-php용)
- **인증**: Basic Auth (podo:podo)
- **헤더**:
  - `Authorization`: Basic cG9kbzpwb2Rv
- **요청 파라미터**:
  - `userId` (Integer): 사용자 ID
- **응답**: `PodoResponse<String>`
- **파일**: `CouponController.java:92-116`

#### POST /api/v1/coupon/publish
- **설명**: 대량 쿠폰 발급 (크론잡용)
- **인증**: Basic Auth (podo:podo)
- **헤더**:
  - `Authorization`: Basic cG9kbzpwb2Rv
- **요청 바디**: `List<PublishingDto>`
```json
[
  {
    "templateId": 1,
    "userId": 123,
    "publishReason": "이벤트"
  },
  {
    "templateId": 1,
    "userId": 124,
    "publishReason": "이벤트"
  }
]
```
- **응답**: `PodoResponse<Boolean>`
- **파일**: `CouponController.java:353-378`

### 4. 쿠폰 적용 조건

#### POST /api/v1/coupon/apply/list
- **설명**: 조건에 맞는 쿠폰 적용 대상 조회
- **인증**: 필요
- **요청 바디**: `ApplyCondition`
```json
{
  "subscribeId": "sub_001",
  "minOrderAmount": 30000,
  "targetLanguage": "EN"
}
```
- **응답**: `PodoResponse<?>` - 조건에 맞는 쿠폰 목록
- **파일**: `CouponController.java:348-351`

### 5. 관리자용 쿠폰 관리

#### POST /api/v1/coupon/createCouponTemplateByAdmin
- **설명**: 쿠폰 템플릿 생성
- **인증**: Basic Auth (podo:podo)
- **헤더**:
  - `Authorization`: Basic cG9kbzpwb2Rv
- **쿼리 파라미터**:
  - `admin_name` (String, optional): 관리자 이름 (로그용)
- **요청 바디**: `CouponTemplateReqForSubDto`
```json
{
  "templateName": "신규 가입 10% 할인",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "minOrderAmount": 30000,
  "maxDiscountAmount": 10000,
  "applicableSubscribes": ["sub_001", "sub_002"],
  "validityDays": 30,
  "description": "첫 구매 시 10% 할인"
}
```
- **응답**:
```json
{
  "resultCd": "200",
  "result": "success"
}
```
- **파일**: `CouponController.java:153-182`

#### POST /api/v1/coupon/updateCouponTemplateByAdmin
- **설명**: 쿠폰 템플릿 수정
- **인증**: Basic Auth (podo:podo)
- **헤더**:
  - `Authorization`: Basic cG9kbzpwb2Rv
- **쿼리 파라미터**:
  - `templateId` (Integer): 템플릿 ID
  - `admin_name` (String, optional): 관리자 이름
- **요청 바디**: `CouponTemplateReqForSubDto`
- **응답**: 성공 메시지
- **파일**: `CouponController.java:184-215`

#### POST /api/v1/coupon/deleteCouponTemplateByAdmin
- **설명**: 쿠폰 템플릿 삭제
- **인증**: Basic Auth (podo:podo)
- **헤더**:
  - `Authorization`: Basic cG9kbzpwb2Rv
- **쿼리 파라미터**:
  - `admin_name` (String, optional): 관리자 이름
- **요청 바디**: `CouponTemplateDeleteByAdminDto`
```json
{
  "templateId": 1
}
```
- **응답**: 성공 메시지
- **파일**: `CouponController.java:217-246`

#### POST /api/v1/coupon/publishCouponByAdmin
- **설명**: 관리자가 직접 쿠폰 발급
- **인증**: Basic Auth (podo:podo)
- **헤더**:
  - `Authorization`: Basic cG9kbzpwb2Rv
- **쿼리 파라미터**:
  - `admin_name` (String, optional): 관리자 이름
- **요청 바디**: `CouponPublishByAdminDto`
```json
{
  "templateId": 1,
  "userIds": [123, 124, 125],
  "publishReason": "이벤트 보상"
}
```
- **응답**:
```json
{
  "resultCd": "200",
  "result": {
    "successCount": "3",
    "failCount": "0"
  }
}
```
- **파일**: `CouponController.java:279-308`

#### POST /api/v1/coupon/updateCouponByAdmin
- **설명**: 쿠폰 정보 수정
- **인증**: Basic Auth (podo:podo)
- **헤더**:
  - `Authorization`: Basic cG9kbzpwb2Rv
- **쿼리 파라미터**:
  - `couponId` (String): 쿠폰 ID
  - `admin_name` (String, optional): 관리자 이름
- **요청 바디**: `CouponUpdateDto`
```json
{
  "endDate": "2026-06-30",
  "status": "AVAILABLE"
}
```
- **응답**: 성공 메시지
- **파일**: `CouponController.java:310-341`

#### POST /api/v1/coupon/deleteCouponByAdmin
- **설명**: 쿠폰 삭제
- **인증**: Basic Auth (podo:podo)
- **헤더**:
  - `Authorization`: Basic cG9kbzpwb2Zu
- **쿼리 파라미터**:
  - `admin_name` (String, optional): 관리자 이름
- **요청 바디**: `CouponDeleteByAdminDto`
```json
{
  "couponId": "coupon_123"
}
```
- **응답**: 성공 메시지
- **파일**: `CouponController.java:248-277`

#### POST /api/v1/coupon/restoreCouponByAdmin
- **설명**: 쿠폰 복구 (삭제된 쿠폰 복원)
- **인증**: Basic Auth (podo:podo)
- **헤더**:
  - `Authorization`: Basic cG9kbzpwb2Rv
- **쿼리 파라미터**:
  - `admin_name` (String, optional): 관리자 이름
- **요청 바디**: `CouponRestoreReqDto`
```json
{
  "couponIds": ["coupon_123", "coupon_124"]
}
```
- **응답**: `PodoResponse<Map<String, Boolean>>`
```json
{
  "success": true,
  "data": {
    "coupon_123": true,
    "coupon_124": true
  }
}
```
- **파일**: `CouponController.java:36-65`

## 쿠폰 상태

### 상태 코드
- `AVAILABLE`: 사용 가능
- `USED`: 사용 완료
- `EXPIRED`: 만료
- `DELETED`: 삭제됨

### 상태 전이
```
생성 → AVAILABLE
AVAILABLE → USED (쿠폰 사용)
AVAILABLE → EXPIRED (유효기간 종료)
AVAILABLE → DELETED (관리자 삭제)
DELETED → AVAILABLE (관리자 복구)
```

## 할인 타입

### PERCENTAGE (퍼센트)
- `discountValue`: 할인율 (예: 10 = 10%)
- `maxDiscountAmount`: 최대 할인 금액 (예: 10000원)
- 계산: `min(원가 * discountValue / 100, maxDiscountAmount)`

### FIXED (고정 금액)
- `discountValue`: 할인 금액 (예: 5000원)
- `maxDiscountAmount`: 사용 안 함
- 계산: `discountValue`

## 쿠폰 발급 정책

### 자동 발급 트리거
1. **신규 가입**: 회원가입 시 웰컴 쿠폰
2. **체험수업 완료**: 체험수업 완료 후 첫 구매 할인 쿠폰
3. **구독 갱신 실패**: 재결제 유도 쿠폰
4. **이벤트**: 특정 이벤트 참여 시

### 수동 발급
- 관리자가 직접 발급 (`publishCouponByAdmin`)
- 대량 발급 지원 (`publish`)

## 쿠폰 사용 제한

### 사용 조건
1. **유효기간**: `startDate` ~ `endDate` 내에만 사용 가능
2. **최소 주문 금액**: `minOrderAmount` 이상 구매 시 사용 가능
3. **적용 가능 상품**: `applicableSubscribes`에 포함된 상품에만 적용
4. **1회 사용**: 쿠폰은 1회만 사용 가능
5. **중복 사용 불가**: 1회 결제에 1개 쿠폰만 적용

## 관련 서비스

### CouponGateway
- 쿠폰 비즈니스 로직 게이트웨이
- 주요 메서드: `getCoupons()`, `publishCoupon()`, `canUseCoupon()`, `calculateDiscount()`

### CouponService
- 쿠폰 CRUD 및 상태 관리

## 관리자 로그

### @AdminActionLog
관리자 API는 `@AdminActionLog` 애노테이션으로 모든 작업을 로그에 기록합니다.
- 작업 내용
- 관리자 이름 (`admin_name` 파라미터)
- 작업 시간
- 요청 데이터

## 에러 코드
- `400 Bad Request`: 잘못된 요청 (만료된 쿠폰, 최소 금액 미달 등)
- `401 Unauthorized`: 인증 실패
- `404 Not Found`: 쿠폰을 찾을 수 없음
- `409 Conflict`: 이미 사용된 쿠폰
