---
title: GT_CLASS_TICKET 테이블
domain: database
table: GT_CLASS_TICKET
entity: Ticket.java
created: 2026-01-26
---

# GT_CLASS_TICKET 테이블

## 개요
**테이블명**: `GT_CLASS_TICKET`
**엔티티**: `com.speaking.podo.applications.ticket.domain.Ticket`
**목적**: 수강권 (분 단위 또는 횟수 단위)

## 스키마

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| ID | String(32) | NO | - | PK, 수강권 고유 ID |
| USER_ID | Integer | NO | - | FK → GT_USER.ID (학생) |
| TUTOR_ID | Integer | NO | - | FK → GT_USER.ID (튜터) |
| PURCHASED_MIN | Integer | NO | - | 구매한 총 분 |
| USED_MIN | Integer | YES | - | 사용한 분 |
| CLASS_PRICE_PER_HOUR | Integer | NO | - | 시간당 수업료 |
| TICKET_START_DATE | LocalDate | NO | - | 수강권 시작일 |
| TICKET_EXPIRE_DATE | LocalDate | NO | - | 수강권 만료일 |
| CREATE_DATETIME | LocalDateTime | NO | - | 생성일시 (자동) |
| UPDATE_DATETIME | LocalDateTime | YES | - | 수정일시 (자동) |
| PURCHASED_PRICE | Integer | YES | - | 구매 금액 |
| TICKET_TYPE | String(50) | YES | - | 수강권 유형 |
| EVENT_TYPE | String(100) | YES | - | 이벤트 유형 |
| APPLY_TYPE | String(50) | YES | - | 적용 유형 |
| ORIGIN_COUNT | Integer | YES | - | 원래 횟수 |
| PURCHASED_COUNT | Integer | YES | - | 구매 횟수 |
| USED_COUNT | Integer | YES | - | 사용 횟수 |
| DESTROY_COUNT | Integer | YES | - | 파기 횟수 |
| REFUND_COUNT | Integer | YES | - | 환불 횟수 |
| REASON | String(200) | YES | - | 발급 사유 |
| CLASS_MINUTE | String(10) | YES | - | 수업 시간 (분, 문자열) |
| REVENUE_PER_CLASS | String(10) | YES | - | 수업당 수익 |
| PAYMENT_ID | Integer | YES | - | FK → GT_PAYMENT_INFO.ID |
| SUBSCRIBE_MAPP_ID | String(32) | YES | - | FK → GT_SUBSCRIBE_MAPP.ID |
| LANG_TYPE | String(50) | YES | - | 언어 유형 (EN/JP/CN) |
| CURRICULUM_TYPE | String(50) | YES | - | 커리큘럼 유형 |
| CLASS_TYPE | String(50) | YES | - | 수업 유형 |
| GOODS_NAME | String(50) | YES | - | 상품명 |
| LESSON_TIME | Integer | YES | - | 수업 시간 (분, Integer) |
| IS_CERT | boolean | YES | - | 인증 여부 |

---

## 인덱스

### Primary Key
- `PRIMARY KEY (ID)`

### 권장 인덱스
```sql
CREATE INDEX idx_class_ticket_user_id ON GT_CLASS_TICKET(USER_ID);
CREATE INDEX idx_class_ticket_tutor_id ON GT_CLASS_TICKET(TUTOR_ID);
CREATE INDEX idx_class_ticket_subscribe_mapp_id ON GT_CLASS_TICKET(SUBSCRIBE_MAPP_ID);
CREATE INDEX idx_class_ticket_payment_id ON GT_CLASS_TICKET(PAYMENT_ID);
CREATE INDEX idx_class_ticket_expire_date ON GT_CLASS_TICKET(TICKET_EXPIRE_DATE);
CREATE INDEX idx_class_ticket_lang_type ON GT_CLASS_TICKET(LANG_TYPE);
```

---

## 관계

### N:1 관계 (FK 참조)
- **GT_USER (학생)**: `GT_CLASS_TICKET.USER_ID` → `GT_USER.ID`
- **GT_USER (튜터)**: `GT_CLASS_TICKET.TUTOR_ID` → `GT_USER.ID`
- **GT_SUBSCRIBE_MAPP**: `GT_CLASS_TICKET.SUBSCRIBE_MAPP_ID` → `GT_SUBSCRIBE_MAPP.ID`
- **GT_PAYMENT_INFO**: `GT_CLASS_TICKET.PAYMENT_ID` → `GT_PAYMENT_INFO.ID`

### 1:N 관계 (FK로 참조됨)
- **GT_CLASS**: `GT_CLASS_TICKET.ID` ← `GT_CLASS.CLASS_TICKET_ID`

---

## 비즈니스 로직

### 수강권 발급 방식

#### 1. 구독 수강권 (정기)
```
SUBSCRIBE_MAPP_ID != NULL
구독 결제 시 자동 발급
예: 1개월 20회 → PURCHASED_COUNT = 20
```

#### 2. 일회성 수강권
```
SUBSCRIBE_MAPP_ID = NULL
PAYMENT_ID != NULL
일회 결제로 발급
예: 10회권 구매
```

#### 3. 이벤트 수강권
```
EVENT_TYPE != NULL
무료 체험, 프로모션 등
예: 체험 3회권
```

### 분(MIN) vs 횟수(COUNT)

시스템은 두 가지 단위를 병행 사용:

#### 분 단위
- `PURCHASED_MIN`: 구매한 총 분 (예: 500분)
- `USED_MIN`: 사용한 분 (예: 125분)
- **남은 분**: `PURCHASED_MIN - USED_MIN`

#### 횟수 단위
- `PURCHASED_COUNT`: 구매 횟수 (예: 20회)
- `USED_COUNT`: 사용 횟수 (예: 5회)
- **남은 횟수**: `PURCHASED_COUNT - USED_COUNT`

**변환 기준**:
```java
public static final long ClassTimePerOneTicket = 25L;
```
- 1회 = 25분
- 20회 = 500분

### 수강권 차감

수업 완료 시:
```
USED_MIN += 실제_수업_시간 (예: 25분)
USED_COUNT += 1
```

수업 취소 시:
```
DESTROY_COUNT += 1 (또는 REFUND_COUNT)
```

### 유효성 검증

#### 사용 가능 조건
```sql
TICKET_EXPIRE_DATE >= CURDATE()
AND (PURCHASED_MIN - USED_MIN) >= 25
AND (PURCHASED_COUNT - USED_COUNT) >= 1
```

#### 만료 조건
```sql
TICKET_EXPIRE_DATE < CURDATE()
```

---

## 주요 쿼리 예시

### 1. 사용자의 유효한 수강권 조회
```sql
SELECT
  ID,
  LANG_TYPE,
  PURCHASED_COUNT,
  USED_COUNT,
  (PURCHASED_COUNT - USED_COUNT) AS remaining_count,
  TICKET_EXPIRE_DATE
FROM GT_CLASS_TICKET
WHERE USER_ID = ?
  AND TICKET_EXPIRE_DATE >= CURDATE()
  AND (PURCHASED_COUNT - USED_COUNT) > 0
ORDER BY TICKET_EXPIRE_DATE ASC;
```

### 2. 남은 분으로 조회
```sql
SELECT
  ID,
  PURCHASED_MIN,
  USED_MIN,
  (PURCHASED_MIN - COALESCE(USED_MIN, 0)) AS remaining_min,
  TICKET_EXPIRE_DATE
FROM GT_CLASS_TICKET
WHERE USER_ID = ?
  AND TICKET_EXPIRE_DATE >= CURDATE()
  AND (PURCHASED_MIN - COALESCE(USED_MIN, 0)) >= 25
ORDER BY TICKET_EXPIRE_DATE ASC;
```

### 3. 구독 매핑별 수강권 조회
```sql
SELECT ct.*
FROM GT_CLASS_TICKET ct
WHERE ct.SUBSCRIBE_MAPP_ID = ?
ORDER BY ct.CREATE_DATETIME DESC;
```

### 4. 수강권 사용 내역 (수업 포함)
```sql
SELECT
  ct.ID AS ticket_id,
  ct.PURCHASED_COUNT,
  ct.USED_COUNT,
  c.CLASS_DATE,
  c.CLASS_START_TIME,
  c.TICKET_COUNT AS used_in_this_class
FROM GT_CLASS_TICKET ct
LEFT JOIN GT_CLASS c ON ct.ID = c.CLASS_TICKET_ID
WHERE ct.USER_ID = ?
ORDER BY c.CLASS_DATE DESC;
```

### 5. 만료 예정 수강권 (7일 이내)
```sql
SELECT
  ct.*,
  u.NAME,
  u.EMAIL,
  (ct.PURCHASED_COUNT - ct.USED_COUNT) AS remaining_count
FROM GT_CLASS_TICKET ct
INNER JOIN GT_USER u ON ct.USER_ID = u.ID
WHERE ct.TICKET_EXPIRE_DATE BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  AND (ct.PURCHASED_COUNT - ct.USED_COUNT) > 0;
```

---

## 특이 사항

### 1. TUTOR_ID 필드
- 학생의 수강권인데 TUTOR_ID 존재
- 특정 튜터 전용 수강권 가능성
- 일반적으로는 미사용 (0 또는 NULL)

### 2. CLASS_MINUTE vs LESSON_TIME
- `CLASS_MINUTE`: String(10)
- `LESSON_TIME`: Integer
- 같은 정보를 다른 타입으로 중복 저장 (레거시)

### 3. ORIGIN_COUNT
- 원래 횟수 (환불/파기 전)
- 계산 예시:
  ```
  ORIGIN_COUNT = PURCHASED_COUNT + REFUND_COUNT + DESTROY_COUNT
  ```

### 4. String ID
- PK가 String(32) UUID
- 생성 시 UUID 직접 생성 필요

---

## Constant

```java
public static final long ClassTimePerOneTicket = 25L;
```
- 1회당 25분 기준
- 분 ↔ 횟수 변환 시 사용

---

## 주의사항

### 1. PURCHASED_MIN vs PURCHASED_COUNT
- 두 값 모두 관리 필요
- 변환 공식: `PURCHASED_COUNT * 25 = PURCHASED_MIN`

### 2. USED_MIN NULL 허용
- `COALESCE(USED_MIN, 0)` 사용 권장

### 3. @CreationTimestamp / @UpdateTimestamp
- `CREATE_DATETIME`: INSERT 시 자동 생성
- `UPDATE_DATETIME`: UPDATE 시 자동 갱신

### 4. TICKET_TYPE 값
- 다양한 타입 존재 (상수 정의 확인 필요)
- 예: `NORMAL`, `EVENT`, `TRIAL`

### 5. 만료일 우선순위
- 여러 수강권 보유 시 만료일 빠른 순서대로 사용 권장

---

## 엔티티 파일 위치
```
src/main/java/com/speaking/podo/applications/ticket/domain/Ticket.java
```

---

## Builder 패턴

Mock 용도로 간단한 Builder 제공:
```java
Ticket.builder()
    .eventType("TRIAL")
    .langType("EN")
    .lessonTime(25)
    .build();
```

전체 필드 Builder는 Lombok `@Builder` + `@AllArgsConstructor` 사용
