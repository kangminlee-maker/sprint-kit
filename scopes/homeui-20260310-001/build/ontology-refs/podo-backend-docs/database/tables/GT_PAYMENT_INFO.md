---
title: GT_PAYMENT_INFO 테이블
domain: database
table: GT_PAYMENT_INFO
entity: PaymentInfo.java
created: 2026-01-26
---

# GT_PAYMENT_INFO 테이블

## 개요
**테이블명**: `GT_PAYMENT_INFO`
**엔티티**: `com.speaking.podo.applications.payment.domain.PaymentInfo`
**목적**: 결제 정보 및 내역 관리

## 스키마

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| ID | Integer | NO | Auto | PK, 결제 고유 ID |
| USER_UID | Integer | NO | - | FK → GT_USER.ID |
| UPDATE_DATE | LocalDateTime | NO | - | 결제 일시 |
| IMP_UID | String(1000) | YES | - | 아임포트 거래 고유 ID |
| MERCHANT_UID | String(1000) | YES | - | 주문 고유 ID |
| RECEIPT_URL | String(500) | YES | - | 영수증 URL |
| PAY_METHOD | String(50) | NO | - | 결제 수단 (card/vbank/trans) |
| PAID_AMOUNT | Integer | NO | - | 결제 금액 |
| STATUS | String(256) | NO | - | 결제 상태 (paid/failed/cancelled) |
| PAYMENT_DIV | String(2) | YES | - | 결제 구분 |
| TICKET_TYPE | String(10) | YES | - | 수강권 유형 |
| EVENT_TYPE | String(100) | YES | - | 이벤트 유형 |
| COUPON_NO | String(50) | YES | - | 쿠폰 번호 |
| REVENUE_EXPIRY_DATE | String(50) | YES | - | 수익 만료일 |
| PG_TYPE | String(10) | YES | - | PG사 (iamport/kakaopay) |
| BUYER_NAME | String(100) | YES | - | 구매자명 |
| GOODS_NAME | String(100) | YES | - | 상품명 |
| CLASS_MINUTE | String(10) | YES | - | 수업 시간 (분) |
| CASH_RECEIPT_URL | String(500) | YES | - | 현금영수증 URL |
| PAY_TICKET_TYPE | String(10) | YES | - | 결제 수강권 유형 |
| TICKET_COUNT | String(50) | YES | - | 수강권 횟수 |
| REMAIN_AMOUNT | Integer | NO | - | 남은 금액 (환불 시) |
| PARENT_PAYMENT_ID | String(50) | YES | - | 부모 결제 ID (환불 추적용) |
| CLASS_TYPE | String(50) | YES | - | 수업 유형 |
| LANG_TYPE | String(50) | YES | - | 언어 유형 (EN/JP/CN) |
| SUBSCRIBE_MAPP_ID | String(32) | YES | - | FK → GT_SUBSCRIBE_MAPP.ID |

---

## 인덱스

### Primary Key
- `PRIMARY KEY (ID)`

### 권장 인덱스
```sql
CREATE INDEX idx_payment_user_id ON GT_PAYMENT_INFO(USER_UID);
CREATE INDEX idx_payment_subscribe_mapp_id ON GT_PAYMENT_INFO(SUBSCRIBE_MAPP_ID);
CREATE INDEX idx_payment_merchant_uid ON GT_PAYMENT_INFO(MERCHANT_UID);
CREATE INDEX idx_payment_imp_uid ON GT_PAYMENT_INFO(IMP_UID);
CREATE INDEX idx_payment_status ON GT_PAYMENT_INFO(STATUS);
CREATE INDEX idx_payment_update_date ON GT_PAYMENT_INFO(UPDATE_DATE);
```

---

## 관계

### N:1 관계 (FK 참조)
- **GT_USER**: `GT_PAYMENT_INFO.USER_UID` → `GT_USER.ID`
- **GT_SUBSCRIBE_MAPP**: `GT_PAYMENT_INFO.SUBSCRIBE_MAPP_ID` → `GT_SUBSCRIBE_MAPP.ID`

### 1:N 관계 (FK로 참조됨)
- **GT_CLASS_TICKET**: `GT_PAYMENT_INFO.ID` ← `GT_CLASS_TICKET.PAYMENT_ID`
- **le_coupon**: `GT_PAYMENT_INFO.ID` ← `le_coupon.payment_id` (쿠폰 사용 추적)

---

## 비즈니스 로직

### 결제 유형

#### 1. 일회성 결제
```
SUBSCRIBE_MAPP_ID = NULL
GT_CLASS_TICKET 1개 발급
예: 10회권 구매
```

#### 2. 구독 정기결제
```
SUBSCRIBE_MAPP_ID != NULL
매월 자동 결제
GT_CLASS_TICKET 발급
GT_SUBSCRIBE_MAPP과 연결
```

#### 3. 환불
```
PARENT_PAYMENT_ID = 원래 결제 ID
PAID_AMOUNT = 음수 (-)
REMAIN_AMOUNT = 환불 후 남은 금액
```

### 결제 상태 (STATUS)

| 값 | 의미 |
|----|------|
| paid | 결제 완료 |
| ready | 결제 대기 (가상계좌 등) |
| failed | 결제 실패 |
| cancelled | 결제 취소 |

### 결제 수단 (PAY_METHOD)

| 값 | 설명 |
|----|------|
| card | 신용카드 |
| vbank | 가상계좌 |
| trans | 실시간 계좌이체 |
| kakaopay | 카카오페이 |

### PG사 (PG_TYPE)

| 값 | 설명 |
|----|------|
| iamport | 아임포트 (통합 PG) |
| kakaopay | 카카오페이 |
| tosspay | 토스페이 |

---

## 주요 쿼리 예시

### 1. 사용자의 결제 내역 조회
```sql
SELECT
  p.ID,
  p.UPDATE_DATE,
  p.GOODS_NAME,
  p.PAID_AMOUNT,
  p.PAY_METHOD,
  p.STATUS
FROM GT_PAYMENT_INFO p
WHERE p.USER_UID = ?
ORDER BY p.UPDATE_DATE DESC;
```

### 2. 구독 정기결제 내역
```sql
SELECT
  p.*,
  sm.START_DATE,
  sm.END_DATE
FROM GT_PAYMENT_INFO p
INNER JOIN GT_SUBSCRIBE_MAPP sm ON p.SUBSCRIBE_MAPP_ID = sm.ID
WHERE sm.USER_ID = ?
ORDER BY p.UPDATE_DATE DESC;
```

### 3. 오늘의 결제 통계
```sql
SELECT
  COUNT(*) AS total_count,
  SUM(PAID_AMOUNT) AS total_amount,
  SUM(CASE WHEN STATUS = 'paid' THEN PAID_AMOUNT ELSE 0 END) AS paid_amount,
  SUM(CASE WHEN STATUS = 'failed' THEN 1 ELSE 0 END) AS failed_count
FROM GT_PAYMENT_INFO
WHERE DATE(UPDATE_DATE) = CURDATE();
```

### 4. 환불 내역 조회
```sql
SELECT
  p.*,
  parent.PAID_AMOUNT AS original_amount
FROM GT_PAYMENT_INFO p
LEFT JOIN GT_PAYMENT_INFO parent ON p.PARENT_PAYMENT_ID = parent.ID
WHERE p.PAID_AMOUNT < 0
ORDER BY p.UPDATE_DATE DESC;
```

### 5. 쿠폰 사용 결제 조회
```sql
SELECT
  p.*,
  c.code AS coupon_code,
  ct.discount_amount
FROM GT_PAYMENT_INFO p
INNER JOIN le_coupon c ON p.ID = c.payment_id
INNER JOIN le_coupon_template ct ON c.template_id = ct.id
WHERE p.USER_UID = ?
ORDER BY p.UPDATE_DATE DESC;
```

### 6. 결제 수단별 통계 (월별)
```sql
SELECT
  DATE_FORMAT(UPDATE_DATE, '%Y-%m') AS month,
  PAY_METHOD,
  COUNT(*) AS count,
  SUM(PAID_AMOUNT) AS total_amount
FROM GT_PAYMENT_INFO
WHERE STATUS = 'paid'
GROUP BY DATE_FORMAT(UPDATE_DATE, '%Y-%m'), PAY_METHOD
ORDER BY month DESC, total_amount DESC;
```

---

## 아임포트 연동

### IMP_UID vs MERCHANT_UID
- **IMP_UID**: 아임포트가 생성한 거래 고유 ID
- **MERCHANT_UID**: 가맹점(서비스)이 생성한 주문 ID

**사용 예시**:
```
MERCHANT_UID: "order_20260126_user123_abc"
IMP_UID: "imp_123456789"
```

### 결제 플로우

#### 1. 결제 요청
```
1. 클라이언트 → 아임포트 결제창
2. 사용자 결제 진행
3. 아임포트 → 서버 Webhook 호출
```

#### 2. 결제 검증
```
1. IMP_UID로 아임포트 API 조회
2. PAID_AMOUNT 일치 확인
3. STATUS = 'paid' 확인
```

#### 3. 결제 완료 처리
```
1. GT_PAYMENT_INFO 저장
2. GT_CLASS_TICKET 발급 (또는 GT_SUBSCRIBE_MAPP 연결)
3. 쿠폰 사용 시 le_coupon 업데이트
```

---

## 환불 처리

### 전액 환불
```sql
INSERT INTO GT_PAYMENT_INFO (
  USER_UID,
  PARENT_PAYMENT_ID,
  PAID_AMOUNT,
  REMAIN_AMOUNT,
  STATUS,
  ...
) VALUES (
  ?,
  original_payment_id,
  -original_amount,
  0,
  'cancelled',
  ...
);
```

### 부분 환불
```sql
INSERT INTO GT_PAYMENT_INFO (
  USER_UID,
  PARENT_PAYMENT_ID,
  PAID_AMOUNT,
  REMAIN_AMOUNT,
  STATUS,
  ...
) VALUES (
  ?,
  original_payment_id,
  -refund_amount,
  original_amount - refund_amount,
  'cancelled',
  ...
);
```

---

## 특이 사항

### 1. USER_UID 컬럼명
- 다른 테이블은 `USER_ID`인데 여기만 `USER_UID`
- FK 참조는 동일하게 `GT_USER.ID`

### 2. MERCHANT_UID 길이
- String(1000)으로 매우 긴 값 허용
- UUID 등 긴 주문 ID 지원

### 3. COUPON_NO vs le_coupon
- `COUPON_NO`: String 필드 (레거시)
- 현재는 `le_coupon.payment_id`로 관계 관리

### 4. REMAIN_AMOUNT
- 환불 시에만 사용
- 일반 결제 시 0 또는 원래 금액

### 5. String 타입 컬럼
- `TICKET_COUNT`: String(50)인데 숫자 저장
- `CLASS_MINUTE`: String(10)인데 숫자 저장
- 레거시 타입 (향후 변경 가능성)

---

## 주의사항

### 1. ID Auto Increment
- Integer 타입 PK
- `@GeneratedValue(strategy = GenerationType.IDENTITY)`

### 2. 필수 컬럼
- `USER_UID`, `UPDATE_DATE`, `PAY_METHOD`, `PAID_AMOUNT`, `STATUS`, `REMAIN_AMOUNT`는 NOT NULL

### 3. URL 길이
- `RECEIPT_URL`, `CASH_RECEIPT_URL`: String(500)
- 긴 URL 저장 가능

### 4. 환불 추적
- `PARENT_PAYMENT_ID`로 원본 결제 추적
- `PAID_AMOUNT` 음수 값으로 환불 표시

### 5. Serializable 구현
- 엔티티가 `Serializable` 구현
- 세션 저장 등 직렬화 필요 시 사용

---

## 엔티티 파일 위치
```
src/main/java/com/speaking/podo/applications/payment/domain/PaymentInfo.java
```

---

## Builder 패턴
Lombok `@Builder` 적용:
```java
PaymentInfo.builder()
    .userUid(userId)
    .merchantUid("order_" + UUID.randomUUID())
    .paidAmount(100000)
    .payMethod("card")
    .status("paid")
    .remainAmount(100000)
    .updateDate(LocalDateTime.now())
    .build();
```

---

## toString() 메서드
Apache Commons `ToStringBuilder` 사용:
```java
@Override
public String toString() {
    return ToStringBuilder.reflectionToString(this, ToStringStyle.JSON_STYLE);
}
```
JSON 형식으로 출력되어 로깅 시 유용
