---
title: 데이터베이스 관계도
domain: database
scope: relationships
created: 2026-01-26
---

# 데이터베이스 관계도

## 전체 ERD

```
┌─────────────┐
│  GT_USER    │
│  (회원)      │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌──────────────┐
│ GT_SUBSCRIBE│   │ le_coupon    │
│  MAPP       │   │ (발급쿠폰)    │
│ (구독매핑)   │   └──────┬───────┘
└──────┬──────┘          │
       │                 │
       │                 ▼
       │          ┌──────────────────┐
       │          │le_coupon_template│
       │          │ (쿠폰 템플릿)     │
       │          └──────────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌──────────────┐
│GT_CLASS     │   │GT_PAYMENT    │
│TICKET       │   │INFO          │
│(수강권)      │   │(결제정보)     │
└──────┬──────┘   └──────────────┘
       │
       ▼
┌─────────────┐
│  GT_CLASS   │
│  (수업)      │
└─────────────┘

       ▲
       │
       │ (참조)
       │
┌─────────────┐
│GT_SUBSCRIBE │
│(구독 상품)   │
└─────────────┘
```

---

## 주요 관계 설명

### 1. 사용자 → 구독 매핑 (1:N)
**관계**: `GT_USER.ID` ← `GT_SUBSCRIBE_MAPP.USER_ID`

**비즈니스 의미**:
- 한 사용자는 여러 구독을 활성화할 수 있음
- 구독 매핑은 실제 결제 및 활성화된 구독을 나타냄

**주요 컬럼**:
- `GT_SUBSCRIBE_MAPP.SUBSCRIBE_ID`: 어떤 상품을 구독했는지
- `GT_SUBSCRIBE_MAPP.START_DATE`, `END_DATE`: 구독 기간
- `GT_SUBSCRIBE_MAPP.SUBSCRIBE_YN`: 활성 여부
- `GT_SUBSCRIBE_MAPP.STATUS`: 구독 상태

---

### 2. 구독 상품 → 구독 매핑 (1:N)
**관계**: `GT_SUBSCRIBE.ID` ← `GT_SUBSCRIBE_MAPP.SUBSCRIBE_ID`

**비즈니스 의미**:
- 하나의 구독 상품을 여러 사용자가 구매할 수 있음
- `GT_SUBSCRIBE`는 상품 정의, `GT_SUBSCRIBE_MAPP`는 구매 인스턴스

**주요 컬럼**:
- `GT_SUBSCRIBE.SUB_NAME`: 상품명
- `GT_SUBSCRIBE.LESSON_COUNT_PER_MONTH`: 월 수업 횟수
- `GT_SUBSCRIBE.SUB_PRICE`: 가격

---

### 3. 구독 매핑 → 수강권 (1:N)
**관계**: `GT_SUBSCRIBE_MAPP.ID` ← `GT_CLASS_TICKET.SUBSCRIBE_MAPP_ID`

**비즈니스 의미**:
- 구독 활성화 시 수강권이 발급됨
- 매월 자동 결제 시 새로운 수강권 발급

**주요 컬럼**:
- `GT_CLASS_TICKET.PURCHASED_MIN`: 구매한 총 분
- `GT_CLASS_TICKET.USED_MIN`: 사용한 분
- `GT_CLASS_TICKET.START_DATE`, `EXPIRE_DATE`: 유효 기간

**JOIN 예시**:
```sql
SELECT sm.*, ct.*
FROM GT_SUBSCRIBE_MAPP sm
LEFT JOIN GT_CLASS_TICKET ct ON sm.ID = ct.SUBSCRIBE_MAPP_ID
WHERE sm.USER_ID = ?
```

---

### 4. 사용자 → 수강권 (1:N)
**관계**: `GT_USER.ID` ← `GT_CLASS_TICKET.USER_ID`

**비즈니스 의미**:
- 한 사용자는 여러 수강권을 보유할 수 있음
- 수강권은 구독 또는 일회성 구매로 발급

**주요 컬럼**:
- `GT_CLASS_TICKET.TICKET_TYPE`: 수강권 종류
- `GT_CLASS_TICKET.EVENT_TYPE`: 이벤트 유형
- `GT_CLASS_TICKET.PURCHASED_COUNT`: 구매 횟수

---

### 5. 수강권 → 수업 (1:N)
**관계**: `GT_CLASS_TICKET.ID` ← `GT_CLASS.CLASS_TICKET_ID`

**비즈니스 의미**:
- 하나의 수강권으로 여러 수업을 들을 수 있음
- 수업마다 수강권 차감

**주요 컬럼**:
- `GT_CLASS.TICKET_COUNT`: 차감된 수강권 횟수
- `GT_CLASS.CLASS_START_TIME`, `CLASS_END_TIME`: 수업 시간
- `GT_CLASS.CREDIT` (LectureStatus): 수업 상태

**JOIN 예시**:
```sql
SELECT ct.*, c.*
FROM GT_CLASS_TICKET ct
LEFT JOIN GT_CLASS c ON ct.ID = c.CLASS_TICKET_ID
WHERE ct.USER_ID = ?
  AND c.CREDIT = 1 -- REGIST
```

---

### 6. 사용자 → 수업 (1:N, 학생)
**관계**: `GT_USER.ID` ← `GT_CLASS.STUDENT_USER_ID`

**비즈니스 의미**:
- 한 학생은 여러 수업을 들을 수 있음

---

### 7. 사용자 → 수업 (1:N, 튜터)
**관계**: `GT_USER.ID` ← `GT_CLASS.TEACHER_USER_ID`

**비즈니스 의미**:
- 한 튜터는 여러 수업을 진행할 수 있음

**JOIN 예시 (튜터 관점)**:
```sql
SELECT u.NAME AS tutor_name, c.*
FROM GT_CLASS c
INNER JOIN GT_USER u ON c.TEACHER_USER_ID = u.ID
WHERE c.CLASS_DATE = '2026-01-26'
  AND c.CREDIT = 1 -- REGIST
```

---

### 8. 구독 매핑 → 결제 정보 (1:N)
**관계**: `GT_SUBSCRIBE_MAPP.ID` ← `GT_PAYMENT_INFO.SUBSCRIBE_MAPP_ID`

**비즈니스 의미**:
- 구독 매핑당 여러 결제가 발생할 수 있음 (월별 자동결제)

**주요 컬럼**:
- `GT_PAYMENT_INFO.MERCHANT_UID`: 주문 ID
- `GT_PAYMENT_INFO.IMP_UID`: 아임포트 거래 ID
- `GT_PAYMENT_INFO.PAID_AMOUNT`: 결제 금액
- `GT_PAYMENT_INFO.STATUS`: 결제 상태

---

### 9. 쿠폰 템플릿 → 쿠폰 (1:N)
**관계**: `le_coupon_template.id` ← `le_coupon.template_id`

**비즈니스 의미**:
- 하나의 쿠폰 템플릿으로 여러 사용자에게 쿠폰 발급
- 템플릿은 설계도, 쿠폰은 발급 인스턴스

**주요 컬럼**:
- `le_coupon_template.code`: 쿠폰 코드
- `le_coupon_template.discount_type`: 할인 방식
- `le_coupon.utc_use_start`, `utc_use_end`: 사용 기간

**JOIN 예시**:
```sql
SELECT ct.code, ct.title, c.*
FROM le_coupon c
INNER JOIN le_coupon_template ct ON c.template_id = ct.id
WHERE c.user_id = ?
  AND c.status = 'ACTIVE'
```

---

### 10. 사용자 → 쿠폰 (1:N)
**관계**: `GT_USER.ID` ← `le_coupon.user_id`

**비즈니스 의미**:
- 한 사용자는 여러 쿠폰을 보유할 수 있음

---

### 11. 결제 → 쿠폰 (1:N)
**관계**: `GT_PAYMENT_INFO.ID` ← `le_coupon.payment_id`

**비즈니스 의미**:
- 쿠폰 사용 시 어떤 결제에 적용되었는지 추적
- `payment_id`가 있으면 사용된 쿠폰

---

## 복합 조회 패턴

### 패턴 1: 사용자의 활성 구독 + 남은 수강권
```sql
SELECT
  u.NAME,
  sm.SUBSCRIBE_YN,
  sm.END_DATE,
  SUM(ct.PURCHASED_MIN - COALESCE(ct.USED_MIN, 0)) AS remaining_min
FROM GT_USER u
LEFT JOIN GT_SUBSCRIBE_MAPP sm ON u.ID = sm.USER_ID
LEFT JOIN GT_CLASS_TICKET ct ON sm.ID = ct.SUBSCRIBE_MAPP_ID
WHERE u.ID = ?
  AND sm.SUBSCRIBE_YN = 'Y'
  AND ct.EXPIRE_DATE >= CURDATE()
GROUP BY u.ID, sm.ID
```

---

### 패턴 2: 수업 내역 (학생 + 튜터 + 수강권 정보)
```sql
SELECT
  c.ID,
  c.CLASS_DATE,
  c.CLASS_START_TIME,
  s.NAME AS student_name,
  t.NAME AS tutor_name,
  ct.TICKET_TYPE,
  c.CREDIT AS status,
  c.INVOICE_STATUS
FROM GT_CLASS c
INNER JOIN GT_USER s ON c.STUDENT_USER_ID = s.ID
INNER JOIN GT_USER t ON c.TEACHER_USER_ID = t.ID
LEFT JOIN GT_CLASS_TICKET ct ON c.CLASS_TICKET_ID = ct.ID
WHERE c.CLASS_DATE BETWEEN ? AND ?
ORDER BY c.CLASS_DATE, c.CLASS_START_TIME
```

---

### 패턴 3: 사용 가능한 쿠폰 조회 (만료일 계산 포함)
```sql
SELECT
  ct.code,
  ct.title,
  ct.discount_type,
  ct.discount_amount,
  c.utc_use_start,
  c.utc_use_end,
  c.status,
  CASE
    WHEN c.status = 'USED' THEN 'USED'
    WHEN c.status = 'DELETED' THEN 'DELETED'
    WHEN c.utc_use_end < NOW() THEN 'EXPIRED'
    WHEN c.utc_use_start > NOW() THEN 'PENDING'
    ELSE 'NORMAL'
  END AS display_status
FROM le_coupon c
INNER JOIN le_coupon_template ct ON c.template_id = ct.id
WHERE c.user_id = ?
  AND c.status = 'ACTIVE'
  AND c.utc_use_start <= NOW()
  AND c.utc_use_end >= NOW()
```

---

### 패턴 4: 구독 결제 내역 (정기결제 추적)
```sql
SELECT
  sm.ID AS subscribe_mapp_id,
  sm.START_DATE,
  sm.END_DATE,
  sm.NEXT_PAYMENT_DATE,
  p.UPDATE_DATE AS payment_date,
  p.PAID_AMOUNT,
  p.STATUS AS payment_status
FROM GT_SUBSCRIBE_MAPP sm
LEFT JOIN GT_PAYMENT_INFO p ON sm.ID = p.SUBSCRIBE_MAPP_ID
WHERE sm.USER_ID = ?
ORDER BY p.UPDATE_DATE DESC
```

---

## 인덱스 권장사항

### 주요 FK 컬럼 인덱스
```sql
-- GT_SUBSCRIBE_MAPP
CREATE INDEX idx_subscribe_mapp_user_id ON GT_SUBSCRIBE_MAPP(USER_ID);
CREATE INDEX idx_subscribe_mapp_subscribe_id ON GT_SUBSCRIBE_MAPP(SUBSCRIBE_ID);

-- GT_CLASS_TICKET
CREATE INDEX idx_class_ticket_user_id ON GT_CLASS_TICKET(USER_ID);
CREATE INDEX idx_class_ticket_subscribe_mapp_id ON GT_CLASS_TICKET(SUBSCRIBE_MAPP_ID);

-- GT_CLASS
CREATE INDEX idx_class_student_id ON GT_CLASS(STUDENT_USER_ID);
CREATE INDEX idx_class_teacher_id ON GT_CLASS(TEACHER_USER_ID);
CREATE INDEX idx_class_ticket_id ON GT_CLASS(CLASS_TICKET_ID);
CREATE INDEX idx_class_date ON GT_CLASS(CLASS_DATE);

-- GT_PAYMENT_INFO
CREATE INDEX idx_payment_user_id ON GT_PAYMENT_INFO(USER_UID);
CREATE INDEX idx_payment_subscribe_mapp_id ON GT_PAYMENT_INFO(SUBSCRIBE_MAPP_ID);

-- le_coupon
CREATE INDEX idx_coupon_user_id ON le_coupon(user_id);
CREATE INDEX idx_coupon_template_id ON le_coupon(template_id);
CREATE INDEX idx_coupon_payment_id ON le_coupon(payment_id);
```

---

## 주의사항

### 1. 타임존 처리
- DB에 UTC로 저장되지만 JPA는 KST로 읽음 (현재 설정)
- 향후 DB 연결 설정 변경 예정 (`WithZone()` 메서드 사용 금지 예정)

### 2. Soft Delete 패턴
- 일부 테이블은 `DEL_YN` 컬럼으로 논리 삭제 관리
- 쿠폰은 `status = 'DELETED'`로 논리 삭제

### 3. NULL 허용
- 대부분의 컬럼이 `nullable = true`
- JOIN 시 `LEFT JOIN` 권장

### 4. String vs Enum
- DB에 String으로 저장되는 Enum은 JPA Converter로 변환
- 쿼리 작성 시 String 값 직접 사용 가능
