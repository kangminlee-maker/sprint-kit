---
title: le_coupon_template 테이블
domain: database
table: le_coupon_template
entity: CouponTemplate.java
created: 2026-01-26
---

# le_coupon_template 테이블

## 개요
**테이블명**: `le_coupon_template`
**엔티티**: `com.speaking.podo.applications.coupon.domain.CouponTemplate`
**목적**: 쿠폰 템플릿 (쿠폰 설계도)

## 스키마

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| id | Integer | NO | Auto | PK, 템플릿 ID |
| code | String(50) | NO | - | 쿠폰 코드 (Unique) |
| discount_type | String | NO | - | 할인 방식 (PERCENTAGE/FIXED) |
| discount_amount | Integer | NO | - | 할인 금액/퍼센트 |
| discount_amount_max | Integer | NO | - | 최대 할인 금액 |
| pub_limit | Integer | NO | - | 발급 제한 (최대 발급 수) |
| use_day | Integer | YES | - | 사용 가능 일수 (NULL이면 절대 날짜) |
| utc_pub_start | LocalDateTime | NO | - | 발급 시작 일시 (UTC) |
| utc_pub_end | LocalDateTime | NO | - | 발급 종료 일시 (UTC) |
| utc_use_start | LocalDateTime | YES | - | 사용 시작 일시 (UTC) |
| utc_use_end | LocalDateTime | YES | - | 사용 종료 일시 (UTC) |
| status | String | NO | - | 상태 (ACTIVE/HIDDEN/DELETED) |
| title | String(300) | NO | - | 쿠폰 제목 |
| type | String | NO | - | 쿠폰 유형 (DEFAULT/PARTNERS/...) |
| admin_desc | TEXT | YES | - | 관리자용 설명 |
| user_desc | TEXT | YES | - | 사용자용 설명 |
| apply_condition | String | YES | - | 적용 조건 (JSON) |
| apply_type | String | NO | - | 적용 대상 (SUB/SUB_MAPP/USER) |
| utc_created_at | LocalDateTime | NO | - | 생성일시 (UTC, 자동) |
| utc_updated_at | LocalDateTime | NO | - | 수정일시 (UTC, 자동) |

---

## 인덱스

### Primary Key
- `PRIMARY KEY (id)`

### Unique Key
- `UNIQUE KEY (code)`

### 권장 인덱스
```sql
CREATE INDEX idx_coupon_template_status ON le_coupon_template(status);
CREATE INDEX idx_coupon_template_type ON le_coupon_template(type);
CREATE INDEX idx_coupon_template_pub_period ON le_coupon_template(utc_pub_start, utc_pub_end);
CREATE INDEX idx_coupon_template_apply_type ON le_coupon_template(apply_type);
```

---

## 관계

### 1:N 관계 (FK로 참조됨)
- **le_coupon**: `le_coupon_template.id` ← `le_coupon.template_id`

---

## Enum 정의

### discount_type (할인 방식)
| 값 | 설명 | 예시 |
|----|------|------|
| PERCENTAGE | 퍼센트 할인 | 10% 할인 |
| FIXED | 고정 금액 할인 | 5,000원 할인 |

**계산 예시**:
```
PERCENTAGE (10%):
  원가 100,000원
  할인 = 100,000 * 10 / 100 = 10,000원
  최종 = 90,000원

FIXED (5,000원):
  원가 100,000원
  할인 = 5,000원
  최종 = 95,000원
```

### status (쿠폰 상태)
| 값 | 설명 |
|----|------|
| ACTIVE | 활성 (발급 가능) |
| HIDDEN | 숨김 (관리자만 보임, 코드 입력 시 사용 가능) |
| DELETED | 삭제됨 (사용 불가) |

### type (쿠폰 유형)
| 값 | 설명 | 용도 |
|----|------|------|
| DEFAULT | 기본 쿠폰 | 일반 프로모션 |
| PARTNERS | 제휴 쿠폰 | 제휴사 할인 |
| AFTER_TRIAL | 체험 후 쿠폰 | 체험 수업 완료 후 지급 |
| SUBSCRIBE_DONE | 구독 완료 쿠폰 | 구독 결제 완료 시 |
| SUBSCRIBE_PROTECTION | 구독 보호 쿠폰 | 구독 유지 유도 |
| SUBSCRIBE_EXPIRED | 구독 만료 쿠폰 | 구독 만료 후 재가입 유도 |
| SUBSCRIBE_EXPIRED_JPANDCOUNT | 구독 만료 (일본어 + 횟수) | 일본어 구독 만료 (특정 조건) |
| WELCOME | 웰컴 쿠폰 | 신규 가입 환영 |
| SMART_TALK_TRIAL_EXPIRED | 스마트톡 체험 만료 | 스마트톡 체험 종료 후 |

### apply_type (적용 대상)
| 값 | 설명 | 적용 범위 |
|----|------|----------|
| SUB | 구독 상품 | 특정 GT_SUBSCRIBE 상품 선택 시 |
| SUB_MAPP | 구독 매핑 | GT_SUBSCRIBE_MAPP 결제 시 |
| USER | 사용자 | 사용자 레벨 (모든 상품 가능) |

---

## 비즈니스 로직

### 쿠폰 발급 기간
- `utc_pub_start` ~ `utc_pub_end`: 쿠폰을 발급받을 수 있는 기간
- 이 기간 외에는 쿠폰 발급 불가

### 쿠폰 사용 기간

#### 1. 절대 날짜 방식 (`use_day = NULL`)
```
utc_use_start ~ utc_use_end: 정해진 날짜 동안만 사용 가능
예: 2026-01-01 ~ 2026-01-31
```

#### 2. 상대 날짜 방식 (`use_day != NULL`)
```
발급일로부터 N일 동안 사용 가능

use_day = 7:
  발급일: 2026-01-01
  사용 시작: 2026-01-01 00:00:00
  사용 종료: 2026-01-08 23:59:59 (7일 후)

use_day = 0:
  발급 당일까지만 사용 가능
```

**계산 메서드**:
```java
public LocalDateTime calUtcUseStart() {
    if (this.useDay != null) {
        return LocalDateTime.now(); // 발급 시점
    } else {
        return this.utcUseStart; // 절대 날짜
    }
}

public LocalDateTime calUtcUseEnd(LocalDateTime start) {
    if (this.useDay == null) {
        return this.utcUseEnd; // 절대 날짜
    } else if (this.useDay == 0) {
        return DateTimeUtils.saturate(start); // 당일 23:59:59
    } else {
        return DateTimeUtils.saturate(start.plusDays(this.useDay)); // N일 후 23:59:59
    }
}
```

### 발급 제한
- `pub_limit`: 최대 발급 가능 수
- 0 또는 NULL이면 무제한

**검증 쿼리**:
```sql
SELECT COUNT(*) FROM le_coupon WHERE template_id = ?;
-- 이 값이 pub_limit 미만이어야 발급 가능
```

### 최대 할인 금액
- `discount_amount_max`: PERCENTAGE 타입에서 최대 할인 금액 제한

**예시**:
```
discount_type = PERCENTAGE
discount_amount = 20 (20%)
discount_amount_max = 10000 (10,000원)

원가 100,000원:
  할인 = 100,000 * 20 / 100 = 20,000원
  최대 할인 = 10,000원
  최종 할인 = min(20,000, 10,000) = 10,000원
```

### DisplayStatus (표시 상태)

DB `status`와 별도로 계산되는 표시 상태:

```java
public String getDisplayStatus() {
    LocalDateTime utcNow = LocalDateTime.now();

    if (status == DELETED || status == HIDDEN) {
        return status.toString();
    } else if (utcNow.isAfter(utcPubEnd)) {
        return "EXPIRED";
    } else if (utcNow.isBefore(utcPubStart)) {
        return "PENDING";
    }
    return "NORMAL";
}
```

| DisplayStatus | 조건 |
|---------------|------|
| DELETED | status = DELETED |
| HIDDEN | status = HIDDEN |
| EXPIRED | 발급 종료일 지남 |
| PENDING | 발급 시작 전 |
| NORMAL | 발급 가능 (ACTIVE) |

---

## 주요 쿼리 예시

### 1. 발급 가능한 쿠폰 템플릿 조회
```sql
SELECT *
FROM le_coupon_template
WHERE status = 'ACTIVE'
  AND utc_pub_start <= NOW()
  AND utc_pub_end >= NOW()
ORDER BY utc_pub_start DESC;
```

### 2. 코드로 쿠폰 조회
```sql
SELECT *
FROM le_coupon_template
WHERE code = 'WELCOME2026'
  AND status IN ('ACTIVE', 'HIDDEN');
```

### 3. 발급 가능 여부 확인 (제한 수 검증)
```sql
SELECT
  ct.*,
  (SELECT COUNT(*) FROM le_coupon c WHERE c.template_id = ct.id) AS issued_count
FROM le_coupon_template ct
WHERE ct.id = ?;

-- issued_count < pub_limit 이면 발급 가능
```

### 4. 특정 유형 쿠폰 조회
```sql
SELECT *
FROM le_coupon_template
WHERE type = 'AFTER_TRIAL'
  AND status = 'ACTIVE'
ORDER BY discount_amount DESC;
```

### 5. 적용 대상별 쿠폰 조회
```sql
SELECT *
FROM le_coupon_template
WHERE apply_type = 'SUB'
  AND status = 'ACTIVE';
```

---

## ApplyCondition (적용 조건)

### JSON 구조
`apply_condition` 컬럼은 JSON으로 저장:

```json
{
  "minPurchaseAmount": 50000,
  "targetSubscribeIds": ["sub_abc", "sub_def"],
  "targetLangTypes": ["EN", "JP"]
}
```

**Converter**: `ApplyConditionConverter`

### 조건 검증 예시
```java
ApplyCondition condition = couponTemplate.getApplyCondition();

// 최소 구매 금액
if (purchaseAmount < condition.getMinPurchaseAmount()) {
    throw new Exception("최소 구매 금액 미달");
}

// 특정 구독 상품만
if (!condition.getTargetSubscribeIds().contains(subscribeId)) {
    throw new Exception("적용 불가 상품");
}
```

---

## 타임존 처리

### WithZone() 메서드
DB에 UTC로 저장되지만 JPA는 KST로 읽음 (현재 설정)

```java
public LocalDateTime getUtcPubStartWithZone() {
    Instant instant = this.utcPubStart
        .atZone(ZoneId.of("UTC"))
        .toInstant();
    return instant.atZone(ZoneId.of("Asia/Seoul")).toLocalDateTime();
}

public LocalDateTime getUtcPubEndWithZone() { ... }
public LocalDateTime getUtcUseStartWithZone() { ... }
public LocalDateTime getUtcUseEndWithZone() { ... }
```

**주의사항**:
- JPA가 만든 객체: `WithZone()` 메서드 사용
- 코드에서 직접 만든 객체: Lombok getter 사용
- 향후 DB 연결 설정에서 KST 제거 시 `WithZone()` 메서드 사용 금지 예정

---

## 특이 사항

### 1. 테이블명 소문자
- `le_coupon_template` (소문자 + 언더스코어)
- 다른 테이블은 `GT_*` 대문자

### 2. 컬럼명 소문자
- 모든 컬럼이 snake_case 소문자
- 다른 테이블은 UPPER_CASE

### 3. id Auto Increment
- Integer 타입 PK
- `@GeneratedValue(strategy = GenerationType.IDENTITY)`

### 4. code Unique
- 쿠폰 코드는 중복 불가
- 사용자가 직접 입력하는 경우도 있음

### 5. apply_condition JSON
- TEXT 타입에 JSON 저장
- `ApplyConditionConverter`로 자동 변환

---

## 주의사항

### 1. 필수 컬럼
NOT NULL 컬럼:
- `code`, `discount_type`, `discount_amount`, `discount_amount_max`
- `pub_limit`, `utc_pub_start`, `utc_pub_end`
- `status`, `title`, `type`, `apply_type`
- `utc_created_at`, `utc_updated_at`

### 2. use_day vs utc_use_start/end
- `use_day`가 NULL이 아니면 → 상대 날짜 방식
- `use_day`가 NULL이면 → 절대 날짜 방식 (`utc_use_start`, `utc_use_end` 사용)

### 3. pub_limit = 0
- 0이면 무제한 발급

### 4. discount_amount_max
- PERCENTAGE 타입에서만 의미 있음
- FIXED 타입에서는 무시

### 5. Builder 패턴
Lombok `@Builder` 적용:
```java
CouponTemplate.builder()
    .code("WELCOME2026")
    .discountType(DiscountType.PERCENTAGE)
    .discountAmount(10)
    .discountAmountMax(10000)
    .pubLimit(1000)
    .useDay(7)
    .utcPubStart(LocalDateTime.now())
    .utcPubEnd(LocalDateTime.now().plusDays(30))
    .status(Status.ACTIVE)
    .title("신규 가입 10% 할인")
    .type(CouponType.WELCOME)
    .applyType(ApplyType.SUB)
    .build();
```

---

## 엔티티 파일 위치
```
src/main/java/com/speaking/podo/applications/coupon/domain/CouponTemplate.java
```

---

## toDto() 메서드
DTO 변환 메서드 제공:
```java
public CouponTemplateGetDto toDto() {
    return new CouponTemplateGetDto(
        this.id,
        this.code,
        this.discountType,
        this.discountAmount,
        this.discountAmountMax,
        this.pubLimit,
        this.useDay,
        this.utcPubStart,
        this.utcPubEnd,
        this.utcUseStart,
        this.utcUseEnd,
        this.status,
        this.title,
        this.type,
        this.adminDesc,
        this.userDesc,
        this.applyCondition,
        this.applyType,
        this.utcCreatedAt,
        this.utcUpdatedAt,
        this.getDisplayStatus() // 계산된 표시 상태
    );
}
```
