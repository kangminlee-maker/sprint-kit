---
title: le_coupon 테이블
domain: database
table: le_coupon
entity: Coupon.java
created: 2026-01-26
---

# le_coupon 테이블

## 개요
**테이블명**: `le_coupon`
**엔티티**: `com.speaking.podo.applications.coupon.domain.Coupon`
**목적**: 사용자별 발급된 쿠폰 (쿠폰 인스턴스)

## 스키마

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| ID | String(32) | NO | - | PK, 쿠폰 고유 ID (UUID) |
| template_id | Integer | NO | - | FK → le_coupon_template.id |
| user_id | Integer | NO | - | FK → GT_USER.ID |
| utc_use_start | LocalDateTime | NO | - | 사용 시작 일시 (UTC) |
| utc_use_end | LocalDateTime | NO | - | 사용 종료 일시 (UTC) |
| status | String | NO | - | 상태 (ACTIVE/HIDDEN/DELETED/USED) |
| payment_id | Integer | YES | - | FK → GT_PAYMENT_INFO.ID (사용된 결제) |
| utc_used_at | LocalDateTime | YES | - | 사용 일시 (UTC) |
| utc_created_at | LocalDateTime | NO | - | 생성일시 (UTC, 자동) |
| utc_updated_at | LocalDateTime | NO | - | 수정일시 (UTC, 자동) |

---

## 인덱스

### Primary Key
- `PRIMARY KEY (ID)`

### 권장 인덱스
```sql
CREATE INDEX idx_coupon_user_id ON le_coupon(user_id);
CREATE INDEX idx_coupon_template_id ON le_coupon(template_id);
CREATE INDEX idx_coupon_payment_id ON le_coupon(payment_id);
CREATE INDEX idx_coupon_status ON le_coupon(status);
CREATE INDEX idx_coupon_use_period ON le_coupon(utc_use_start, utc_use_end);
```

---

## 관계

### N:1 관계 (FK 참조)
- **le_coupon_template**: `le_coupon.template_id` → `le_coupon_template.id`
- **GT_USER**: `le_coupon.user_id` → `GT_USER.ID`
- **GT_PAYMENT_INFO**: `le_coupon.payment_id` → `GT_PAYMENT_INFO.ID`

---

## Enum 정의

### status (쿠폰 상태)
| 값 | 설명 |
|----|------|
| ACTIVE | 활성 (사용 가능) |
| HIDDEN | 숨김 (사용자 목록에서 제외) |
| DELETED | 삭제됨 |
| USED | 사용됨 |

---

## 비즈니스 로직

### 쿠폰 발급 플로우

#### 1. 템플릿 조회
```sql
SELECT * FROM le_coupon_template WHERE code = 'WELCOME2026';
```

#### 2. 발급 가능 여부 확인
```
- status = ACTIVE
- utc_pub_start <= NOW() <= utc_pub_end
- pub_limit 검증 (발급 수 < pub_limit)
- 중복 발급 체크 (사용자별)
```

#### 3. 사용 기간 계산
```java
LocalDateTime useStart = template.calUtcUseStart();
LocalDateTime useEnd = template.calUtcUseEnd(useStart);
```

#### 4. 쿠폰 발급
```sql
INSERT INTO le_coupon (
  ID,
  template_id,
  user_id,
  utc_use_start,
  utc_use_end,
  status,
  utc_created_at,
  utc_updated_at
) VALUES (
  UUID(),
  ?,
  ?,
  ?,
  ?,
  'ACTIVE',
  NOW(),
  NOW()
);
```

### 쿠폰 사용 플로우

#### 1. 사용 가능 쿠폰 조회
```sql
SELECT c.*, ct.*
FROM le_coupon c
INNER JOIN le_coupon_template ct ON c.template_id = ct.id
WHERE c.user_id = ?
  AND c.status = 'ACTIVE'
  AND c.utc_use_start <= NOW()
  AND c.utc_use_end >= NOW()
ORDER BY c.utc_use_end ASC;
```

#### 2. 결제 시 쿠폰 적용
```sql
-- 1. 결제 금액 계산 (쿠폰 할인 적용)
-- 2. 결제 완료
INSERT INTO GT_PAYMENT_INFO (...) VALUES (...);

-- 3. 쿠폰 사용 처리
UPDATE le_coupon
SET status = 'USED',
    payment_id = ?,
    utc_used_at = NOW(),
    utc_updated_at = NOW()
WHERE ID = ?;
```

### DisplayStatus (표시 상태)

DB `status`와 별도로 계산되는 표시 상태:

```java
public String getDisplayStatus() {
    LocalDateTime utcNow = LocalDateTime.now();

    if (status == DELETED || status == HIDDEN || status == USED) {
        return status.toString();
    } else if (utcNow.isAfter(utcUseEnd)) {
        return "EXPIRED";
    } else if (utcNow.isBefore(utcUseStart)) {
        return "PENDING";
    }
    return "NORMAL";
}
```

| DisplayStatus | 조건 |
|---------------|------|
| DELETED | status = DELETED |
| HIDDEN | status = HIDDEN |
| USED | status = USED |
| EXPIRED | 사용 종료일 지남 |
| PENDING | 사용 시작 전 |
| NORMAL | 사용 가능 (ACTIVE) |

---

## 주요 쿼리 예시

### 1. 사용자의 사용 가능한 쿠폰 조회
```sql
SELECT
  c.*,
  ct.code,
  ct.title,
  ct.discount_type,
  ct.discount_amount,
  ct.discount_amount_max,
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
ORDER BY c.utc_use_end ASC;
```

### 2. 사용자의 전체 쿠폰 내역
```sql
SELECT
  c.*,
  ct.code,
  ct.title,
  p.PAID_AMOUNT AS used_payment_amount
FROM le_coupon c
INNER JOIN le_coupon_template ct ON c.template_id = ct.id
LEFT JOIN GT_PAYMENT_INFO p ON c.payment_id = p.ID
WHERE c.user_id = ?
ORDER BY c.utc_created_at DESC;
```

### 3. 특정 결제에 사용된 쿠폰 조회
```sql
SELECT
  c.*,
  ct.code,
  ct.title,
  ct.discount_type,
  ct.discount_amount
FROM le_coupon c
INNER JOIN le_coupon_template ct ON c.template_id = ct.id
WHERE c.payment_id = ?;
```

### 4. 만료 예정 쿠폰 알림 (7일 이내)
```sql
SELECT
  c.*,
  ct.title,
  u.NAME,
  u.EMAIL
FROM le_coupon c
INNER JOIN le_coupon_template ct ON c.template_id = ct.id
INNER JOIN GT_USER u ON c.user_id = u.ID
WHERE c.status = 'ACTIVE'
  AND c.utc_use_end BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY);
```

### 5. 템플릿별 발급 통계
```sql
SELECT
  ct.code,
  ct.title,
  ct.pub_limit,
  COUNT(c.ID) AS issued_count,
  SUM(CASE WHEN c.status = 'USED' THEN 1 ELSE 0 END) AS used_count,
  SUM(CASE WHEN c.status = 'ACTIVE' AND c.utc_use_end >= NOW() THEN 1 ELSE 0 END) AS available_count
FROM le_coupon_template ct
LEFT JOIN le_coupon c ON ct.id = c.template_id
GROUP BY ct.id
ORDER BY issued_count DESC;
```

### 6. 미사용 쿠폰 (만료된 것 포함)
```sql
SELECT
  c.*,
  ct.title,
  DATEDIFF(c.utc_use_end, NOW()) AS days_left
FROM le_coupon c
INNER JOIN le_coupon_template ct ON c.template_id = ct.id
WHERE c.user_id = ?
  AND c.status = 'ACTIVE'
ORDER BY c.utc_use_end DESC;
```

---

## 쿠폰 검증 로직

### 1. 중복 발급 체크
```sql
SELECT COUNT(*)
FROM le_coupon
WHERE template_id = ?
  AND user_id = ?
  AND status != 'DELETED';

-- 이미 발급된 경우 재발급 불가 (템플릿 정책에 따름)
```

### 2. 발급 제한 수 검증
```sql
SELECT COUNT(*)
FROM le_coupon
WHERE template_id = ?;

-- 발급 수 < le_coupon_template.pub_limit
```

### 3. 사용 가능 여부 검증
```java
// 1. status = ACTIVE
// 2. utc_use_start <= NOW() <= utc_use_end
// 3. apply_condition 충족 (템플릿 조건)
```

---

## 타임존 처리

### WithZone() 메서드
DB에 UTC로 저장되지만 JPA는 KST로 읽음 (현재 설정)

```java
public LocalDateTime getUtcUseStartWithZone() {
    Instant instant = this.utcUseStart
        .atZone(ZoneId.of("UTC"))
        .toInstant();
    return instant.atZone(ZoneId.of("Asia/Seoul")).toLocalDateTime();
}

public LocalDateTime getUtcUseEndWithZone() { ... }
public LocalDateTime getUtcCreatedAtWithZone() { ... }
public LocalDateTime getUtcUsedAtWithZone() { ... }
```

**주의사항**:
- JPA가 만든 객체: `WithZone()` 메서드 사용
- 코드에서 직접 만든 객체: Lombok getter 사용
- 향후 DB 연결 설정에서 KST 제거 시 `WithZone()` 메서드 사용 금지 예정

---

## 특이 사항

### 1. String ID
- PK가 String(32) UUID
- 생성 시 UUID 직접 생성 필요:
  ```java
  String id = UUID.randomUUID().toString();
  ```

### 2. 테이블명/컬럼명 소문자
- `le_coupon` (소문자 + 언더스코어)
- 모든 컬럼 snake_case 소문자

### 3. payment_id NULL 허용
- 사용 전: `payment_id = NULL`
- 사용 후: `payment_id = 결제 ID`

### 4. utc_used_at NULL 허용
- 사용 전: `utc_used_at = NULL`
- 사용 후: `utc_used_at = 사용 시점`

### 5. status vs display_status
- `status`: DB 저장 상태 (4가지)
- `display_status`: 계산된 표시 상태 (6가지)

---

## 쿠폰 라이프사이클

### 1. 발급
```
status = ACTIVE
utc_use_start = 계산됨
utc_use_end = 계산됨
payment_id = NULL
utc_used_at = NULL
```

### 2. 사용 대기
```
status = ACTIVE
utc_use_start > NOW() (아직 사용 시작 전)
display_status = PENDING
```

### 3. 사용 가능
```
status = ACTIVE
utc_use_start <= NOW() <= utc_use_end
display_status = NORMAL
```

### 4. 사용 완료
```
status = USED
payment_id = 결제 ID
utc_used_at = 사용 시점
display_status = USED
```

### 5. 만료
```
status = ACTIVE
utc_use_end < NOW()
display_status = EXPIRED
```

### 6. 삭제
```
status = DELETED
display_status = DELETED
```

---

## 주의사항

### 1. 필수 컬럼
NOT NULL 컬럼:
- `ID`, `template_id`, `user_id`
- `utc_use_start`, `utc_use_end`
- `status`
- `utc_created_at`, `utc_updated_at`

### 2. UUID 생성
- ID는 UUID 직접 생성:
  ```java
  String id = UUID.randomUUID().toString();
  ```

### 3. 사용 처리
- `status` → `USED` 변경
- `payment_id` 설정
- `utc_used_at` 설정
- 모두 동시에 처리 (원자적 트랜잭션)

### 4. 만료 쿠폰
- `status = ACTIVE`지만 `utc_use_end < NOW()`
- DB에서는 삭제하지 않음 (이력 보존)
- `display_status = EXPIRED`로 표시

### 5. Builder 패턴
Lombok `@Builder` 적용:
```java
Coupon.builder()
    .id(UUID.randomUUID().toString())
    .templateId(templateId)
    .userId(userId)
    .utcUseStart(useStart)
    .utcUseEnd(useEnd)
    .status(Status.ACTIVE)
    .build();
```

---

## 엔티티 파일 위치
```
src/main/java/com/speaking/podo/applications/coupon/domain/Coupon.java
```

---

## 할인 계산 예시

### PERCENTAGE 타입
```java
CouponTemplate template = ...;
int originalPrice = 100000;

int discountAmount = originalPrice * template.getDiscountAmount() / 100;
int maxDiscount = template.getDiscountAmountMax();
int actualDiscount = Math.min(discountAmount, maxDiscount);

int finalPrice = originalPrice - actualDiscount;

// 예: 20% 할인, 최대 10,000원
// 원가 100,000원
// 할인 = min(20,000, 10,000) = 10,000원
// 최종 = 90,000원
```

### FIXED 타입
```java
CouponTemplate template = ...;
int originalPrice = 100000;

int discountAmount = template.getDiscountAmount();
int finalPrice = originalPrice - discountAmount;

// 예: 5,000원 할인
// 원가 100,000원
// 할인 = 5,000원
// 최종 = 95,000원
```
