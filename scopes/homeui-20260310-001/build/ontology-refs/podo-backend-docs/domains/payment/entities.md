---
domain: payment
document_type: entities
version: 1.0.0
created_at: 2026-01-26
author: Claude AI
language: ko
tags:
  - payment
  - entity
  - database
description: 결제 도메인 엔티티 정의
source_files:
  - src/main/java/com/speaking/podo/applications/payment/domain/PaymentInfo.java
  - src/main/java/com/speaking/podo/applications/payment/domain/PaymentDetail.java
  - src/main/java/com/speaking/podo/applications/payment/domain/PaymentFailInfo.java
  - src/main/java/com/speaking/podo/applications/payment/domain/DirectPay.java
  - src/main/java/com/speaking/podo/applications/payment/constant/PaymentType.java
---

# 결제 도메인 엔티티

## 1. PaymentInfo (결제 정보)

### 기본 정보

| 속성 | 설명 |
|------|------|
| 테이블명 | `GT_PAYMENT_INFO` |
| 엔티티 | `com.speaking.podo.applications.payment.domain.PaymentInfo` |

### 컬럼 정의

#### 기본 식별자

| 컬럼명 | 필드명 | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| `ID` | id | Integer | O | 결제 ID (PK, AUTO_INCREMENT) |
| `USER_UID` | userUid | Integer | O | 사용자 ID |
| `UPDATE_DATE` | updateDate | LocalDateTime | O | 최종 수정 일시 |

#### 결제 식별 정보

| 컬럼명 | 필드명 | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| `IMP_UID` | impUid | String(1000) | X | 포트원 결제 ID |
| `MERCHANT_UID` | merchantUid | String(1000) | X | 주문 ID |
| `RECEIPT_URL` | receiptUrl | String(500) | X | 영수증 URL |
| `CASH_RECEIPT_URL` | cashReceiptUrl | String(500) | X | 현금영수증 URL |

#### 결제 방법 및 금액

| 컬럼명 | 필드명 | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| `PAY_METHOD` | payMethod | String(50) | O | 결제 방법 (card, trans 등) |
| `PAID_AMOUNT` | paidAmount | Integer | O | 결제 금액 |
| `STATUS` | status | String(256) | O | 결제 상태 (paid, ready, failed) |
| `REMAIN_AMOUNT` | remainAmount | Integer | O | 잔여 금액 (환불 시 사용) |

#### 결제 구분

| 컬럼명 | 필드명 | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| `PAYMENT_DIV` | paymentDiv | String(2) | X | 결제 구분 (T:체험, F:첫결제, S:정기, D:위약금/미납) |
| `TICKET_TYPE` | ticketType | String(10) | X | 수강권 유형 |
| `EVENT_TYPE` | eventType | String(100) | X | 이벤트 유형 (PODO_CARD_PAY 등) |
| `PAY_TICKET_TYPE` | payTicketType | String(10) | X | 결제 수강권 유형 |

#### 상품 정보

| 컬럼명 | 필드명 | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| `BUYER_NAME` | buyerName | String(100) | X | 구매자 이름 |
| `GOODS_NAME` | goodsName | String(100) | X | 상품명 |
| `CLASS_MINUTE` | classMinute | String(10) | X | 수업 시간 (분) |
| `TICKET_COUNT` | ticketCount | String(50) | X | 수강권 횟수 |

#### 연관 정보

| 컬럼명 | 필드명 | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| `COUPON_NO` | couponNo | String(50) | X | 쿠폰 번호 |
| `PG_TYPE` | pgType | String(10) | X | PG사 유형 |
| `CLASS_TYPE` | classType | String(50) | X | 수업 유형 |
| `LANG_TYPE` | langType | String(50) | X | 언어 유형 |
| `SUBSCRIBE_MAPP_ID` | subscribeMappId | String(32) | X | 구독 매핑 ID |
| `PARENT_PAYMENT_ID` | parentPaymentId | String(50) | X | 상위 결제 ID |

#### 기타

| 컬럼명 | 필드명 | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| `REVENUE_EXPIRY_DATE` | revenueExpiryDate | String(50) | X | 매출 인식 만료일 |

---

## 2. PaymentDetail (결제 상세)

### 기본 정보

| 속성 | 설명 |
|------|------|
| 테이블명 | `le_payment_detail` (추정) |
| 엔티티 | `com.speaking.podo.applications.payment.domain.PaymentDetail` |
| 용도 | 결제별 상세 정보 (쿠폰 적용 등) |

### 컬럼 정의

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| `id` | id | Integer | 상세 ID (PK) |
| `payment_id` | paymentId | Integer | 결제 ID (FK) |
| `user_id` | userId | Integer | 사용자 ID |
| `coupon_id` | couponId | String | 사용된 쿠폰 ID |
| `detail` | detail | String | 상세 설명 |

---

## 3. PaymentFailInfo (결제 실패 정보)

### 기본 정보

| 속성 | 설명 |
|------|------|
| 테이블명 | `le_payment_fail_info` (추정) |
| 엔티티 | `com.speaking.podo.applications.payment.domain.PaymentFailInfo` |
| 용도 | 결제 실패 이력 저장 |

### 컬럼 정의

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| `id` | id | Integer | 실패 ID (PK) |
| `user_id` | userId | Integer | 사용자 ID |
| `imp_uid` | impUid | String | 포트원 결제 ID |
| `merchant_uid` | merchantUid | String | 주문 ID |
| `fail_reason` | failReason | String | 실패 사유 |
| `failed_at` | failedAt | LocalDateTime | 실패 일시 |

---

## 4. DirectPay (직접 결제)

### 기본 정보

| 속성 | 설명 |
|------|------|
| 테이블명 | (추정) |
| 엔티티 | `com.speaking.podo.applications.payment.domain.DirectPay` |
| 용도 | 카드 정보 직접 입력 결제 |

---

## 5. PaymentType (결제 유형 Enum)

### 기본 정보

| 속성 | 설명 |
|------|------|
| 파일 위치 | `src/main/java/com/speaking/podo/applications/payment/constant/PaymentType.java` |
| 용도 | 결제 유형 정의 |

### 값 정의

| Enum 값 | paymentDiv | 카드 파킹 | 예약 | 데이터 | 설명 |
|---------|------------|----------|------|--------|------|
| `TRIAL` | T | O | O | O | 체험 결제 |
| `TRIAL_FREE` | T | X | X | O | 무료 체험 결제 |
| `FIRST_BILLING` | F | O | O | O | 첫 빌링 결제 |
| `LUMP_SUM` | F | X | X | O | 일괄 결제 |
| `BILLING` | S | X | O | O | 정기 결제 |
| `CANCEL` | D | X | null | X | 위약금 결제 |
| `BEHIND` | D | X | O | O | 미납 결제 |

### 필드 설명

| 필드명 | 타입 | 설명 |
|--------|------|------|
| paymentDiv | String | 결제 구분 코드 (DB 저장용) |
| cardParking | boolean | 카드 정보 저장 여부 |
| reserve | Boolean | 예약 결제 등록 여부 (null: 요청에 따름) |
| data | boolean | 데이터 처리 여부 (수강권 발급 등) |
| description | String | 결제 유형 설명 (한국어) |

---

## 6. DTO 정의

### PaymentInfoDTO

결제 정보 조회/응답용 DTO

| 필드명 | 타입 | 설명 |
|--------|------|------|
| id | Integer | 결제 ID |
| goodsName | String | 상품명 |
| impUid | String | 포트원 결제 ID |
| ticketCount | Integer | 수강권 횟수 |
| updateDate | LocalDateTime | 최종 수정 일시 |
| paidAmount | int | 결제 금액 |
| eventType | String | 이벤트 유형 |
| langType | String | 언어 유형 |

### PaymentMessageRequest

결제 처리 요청 메시지

| 필드명 | 타입 | 설명 |
|--------|------|------|
| studentId | Integer | 학생 ID |
| subscribeId | String | 구독 ID |
| impUid | String | 포트원 결제 ID |
| merchantUid | String | 주문 ID |
| customerUid | String | 고객 UID (카드 정보) |
| couponId | String | 쿠폰 ID |
| type | PaymentType | 결제 유형 |
| payToken | String | 직접 결제 토큰 |
| vendor | Vendor | 카드사 |
| reserve | Boolean | 예약 여부 |
| trialLevel | String | 체험 레벨 |

### PaymentDataMessageRequest

결제 데이터 처리 요청

| 필드명 | 타입 | 설명 |
|--------|------|------|
| studentId | Integer | 학생 ID |
| subscribeId | String | 구독 ID |
| subscribeMappId | String | 구독 매핑 ID |
| paymentLangType | String | 결제 언어 유형 |
| curriculumType | String | 커리큘럼 유형 |
| paymentId | Integer | 결제 ID |
| impUid | String | 포트원 결제 ID |
| purchasedPrice | int | 결제 금액 |
| type | PaymentType | 결제 유형 |
| nextPaymentDate | LocalDate | 다음 결제일 |
| paymentCount | Integer | 결제 횟수 |

### PaymentScheduleMessageRequest

정기결제 스케줄 요청

| 필드명 | 타입 | 설명 |
|--------|------|------|
| studentId | Integer | 학생 ID |
| subscribeId | String | 구독 ID |
| subscribeMappId | String | 구독 매핑 ID |
| customerUid | String | 고객 UID |
| lastPaymentDate | LocalDateTime | 마지막 결제일 |
| type | PaymentType | 결제 유형 |
| nextPaymentDate | LocalDate | 다음 결제일 |
| failed | int | 실패 횟수 |
| paymentCount | Integer | 결제 횟수 |

---

## 7. 엔티티 관계도

```
+------------------+
|   PaymentInfo    |
|------------------|
| id (PK)          |
| userUid          |----> GT_USER (사용자)
| impUid           |
| merchantUid      |
| subscribeMappId  |----> LE_SUBSCRIBE_MAPP (구독)
| couponNo         |----> LE_COUPON (쿠폰)
+------------------+
         |
         | 1:N
         v
+------------------+
|  PaymentDetail   |
|------------------|
| id (PK)          |
| paymentId (FK)   |
| userId           |
| couponId         |
+------------------+

+------------------+
| PaymentFailInfo  |
|------------------|
| id (PK)          |
| userId           |----> GT_USER
| impUid           |
| failReason       |
+------------------+
```

---

## 8. 주요 쿼리 패턴

### 사용자별 결제 이력 조회

```sql
SELECT * FROM GT_PAYMENT_INFO
WHERE USER_UID = :userId
ORDER BY UPDATE_DATE DESC
```

### 포트원 ID로 결제 조회

```sql
SELECT * FROM GT_PAYMENT_INFO
WHERE IMP_UID = :impUid
  AND STATUS = :status
```

### 구독 매핑별 결제 조회

```sql
SELECT * FROM GT_PAYMENT_INFO
WHERE SUBSCRIBE_MAPP_ID = :subscribeMappId
ORDER BY UPDATE_DATE DESC
```

### 결제 상세 조회

```sql
SELECT pd.*, pi.GOODS_NAME, pi.PAID_AMOUNT
FROM le_payment_detail pd
JOIN GT_PAYMENT_INFO pi ON pd.payment_id = pi.id
WHERE pd.payment_id = :paymentId
  AND pd.user_id = :userId
```

---

## 9. 인덱스 권장사항

### 기존 인덱스 (추정)

- PK: `ID`
- `USER_UID`
- `IMP_UID`
- `SUBSCRIBE_MAPP_ID`

### 권장 복합 인덱스

```sql
-- 포트원 ID + 상태 조회
CREATE INDEX idx_payment_impuid_status
ON GT_PAYMENT_INFO (IMP_UID, STATUS);

-- 사용자별 최신 결제 조회
CREATE INDEX idx_payment_user_date
ON GT_PAYMENT_INFO (USER_UID, UPDATE_DATE DESC);

-- 구독별 결제 조회
CREATE INDEX idx_payment_subscribe
ON GT_PAYMENT_INFO (SUBSCRIBE_MAPP_ID, UPDATE_DATE DESC);
```

---

## 10. 연관 시스템 엔티티

### Subscribe (구독 상품)

| 컬럼 | 설명 |
|------|------|
| id | 구독 상품 ID |
| langType | 언어 유형 |
| curriculumType | 커리큘럼 유형 |
| paymentType | 결제 유형 (TRIAL, SUBSCRIBE, EXTEND) |
| price | 가격 |

### SubscribeMapp (구독 매핑)

| 컬럼 | 설명 |
|------|------|
| subscribeMappId | 구독 매핑 ID (PK) |
| userId | 사용자 ID |
| subscribeId | 구독 상품 ID |
| subscribeStartDate | 구독 시작일 |
| nextPaymentDate | 다음 결제일 |
| paymentCount | 결제 횟수 |
| failedCount | 실패 횟수 |
| retryPaymentDate | 재시도 결제일 |

### Ticket (수강권)

| 컬럼 | 설명 |
|------|------|
| id | 수강권 ID |
| userId | 사용자 ID |
| subscribeMappId | 구독 매핑 ID |
| paymentId | 결제 ID |
| langType | 언어 유형 |
| curriculumType | 커리큘럼 유형 |
| expireDate | 만료일 |
| eventType | 이벤트 유형 |
