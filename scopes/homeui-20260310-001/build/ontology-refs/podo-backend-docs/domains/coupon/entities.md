---
domain: coupon
document_type: entities
version: 1.0.0
last_updated: 2026-01-26
---

# 쿠폰 엔티티 문서

## 1. Coupon (le_coupon)

발급된 개별 쿠폰을 나타내는 엔티티입니다.

### 스키마

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | VARCHAR(32) | PK, NOT NULL | 쿠폰 고유 ID (UUID 기반 MD5) |
| `template_id` | INT | NOT NULL | 쿠폰 템플릿 ID (FK) |
| `user_id` | INT | NOT NULL | 소유자 사용자 ID |
| `utc_use_start` | DATETIME | NOT NULL | 사용 시작일시 (UTC) |
| `utc_use_end` | DATETIME | NOT NULL | 사용 종료일시 (UTC) |
| `status` | ENUM | NOT NULL | 쿠폰 상태 |
| `payment_id` | INT | - | 사용된 결제 ID |
| `utc_used_at` | DATETIME | - | 사용일시 (UTC) |
| `utc_created_at` | DATETIME | NOT NULL | 생성일시 (UTC) |
| `utc_updated_at` | DATETIME | NOT NULL | 수정일시 (UTC) |

### Status Enum
```java
public enum Status {
    ACTIVE,   // 사용 가능
    HIDDEN,   // 숨김
    DELETED,  // 삭제됨
    USED      // 사용 완료
}
```

**상태 전환 규칙**:
- `ACTIVE` → `USED`: 결제 완료 시 (`useCoupon()`)
- `ACTIVE` → `DELETED`: 관리자 삭제 시 (`deleteCouponByAdmin()`)
- `USED` → `ACTIVE`: 관리자 복구 시 (`restoreCoupon()`)
- `DELETED` → `ACTIVE`: 관리자 복구 시 (`restoreCoupon()`)
- `HIDDEN`: 템플릿 상태 변경 시 자동 전환, 재발급 절대 불가

### 주요 메서드

```java
// 표시 상태 계산 (시간 정보 포함)
// 코드 위치: Coupon.java Line 93
public String getDisplayStatus() {
    LocalDateTime utcNow = LocalDateTime.now();

    if (DELETED.equals(status) || HIDDEN.equals(status) || USED.equals(status)) {
        return status.toString();
    } else if (utcNow.isAfter(utcUseEndWithZone)) {
        return "EXPIRED";
    } else if (utcNow.isBefore(utcUseStartWithZone)) {
        return "PENDING";
    }
    return "NORMAL";
}
```

**Repository 메서드**:

```java
// 쿠폰 사용 처리 (ACTIVE -> USED)
// CouponRepository.java Line 46
@Query("UPDATE le_coupon SET payment_id = :paymentId, status = 'USED',
        utc_used_at = :utcUsedAt WHERE id = :couponId")
int use(String couponId, Integer paymentId, String utcUsedAt);

// 쿠폰 복구 (USED/DELETED -> ACTIVE)
// CouponRepository.java Line 52
@Query("UPDATE le_coupon SET payment_id = NULL, utc_used_at = NULL,
        status = 'ACTIVE' WHERE id = :couponId")
int restore(String couponId);

// 쿠폰 삭제 (ACTIVE/HIDDEN -> DELETED)
// CouponRepository.java Line 57
@Query("UPDATE le_coupon SET status = 'DELETED' WHERE id = :couponId")
void deleteById(String couponId);

// 쿠폰 정보 수정 (상태, 사용 기간)
// CouponRepository.java Line 71
@Query("UPDATE le_coupon SET status = :status, utc_use_start = :utcUseStart,
        utc_use_end = :utcUseEnd WHERE id = :id")
void updateById(String id, String status, String utcUseStart, String utcUseEnd);
```

### 시간대 처리 주의사항
DB에 저장된 시간은 UTC이나, JPA 조회 시 KST 변환이 필요합니다.
`WithZone` 접미사가 붙은 메서드를 사용해야 합니다:
- `getUtcUseStartWithZone()`
- `getUtcUseEndWithZone()`
- `getUtcCreatedAtWithZone()`
- `getUtcUsedAtWithZone()`

---

## 2. CouponTemplate (le_coupon_template)

쿠폰 발급의 기준이 되는 템플릿입니다.

### 스키마

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | INT | PK, AUTO_INCREMENT | 템플릿 ID |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | 쿠폰 코드 |
| `discount_type` | ENUM | NOT NULL | 할인 유형 |
| `discount_amount` | INT | NOT NULL | 할인 금액/비율 |
| `discount_amount_max` | INT | NOT NULL | 최대 할인 금액 |
| `pub_limit` | INT | NOT NULL | 발급 제한 수량 (-1: 무제한) |
| `use_day` | INT | - | 발급 후 사용 가능 일수 |
| `utc_pub_start` | DATETIME | NOT NULL | 발급 시작일시 |
| `utc_pub_end` | DATETIME | NOT NULL | 발급 종료일시 |
| `utc_use_start` | DATETIME | - | 사용 시작일시 (고정) |
| `utc_use_end` | DATETIME | - | 사용 종료일시 (고정) |
| `status` | ENUM | NOT NULL | 템플릿 상태 |
| `title` | VARCHAR(300) | NOT NULL | 쿠폰 제목 |
| `type` | ENUM | NOT NULL | 쿠폰 타입 |
| `admin_desc` | TEXT | - | 관리자용 설명 |
| `user_desc` | TEXT | - | 사용자용 설명 |
| `apply_condition` | JSON | - | 적용 조건 |
| `apply_type` | ENUM | NOT NULL | 적용 유형 |
| `utc_created_at` | DATETIME | NOT NULL | 생성일시 |
| `utc_updated_at` | DATETIME | NOT NULL | 수정일시 |

### Enums

```java
// 할인 유형
public enum DiscountType {
    PERCENTAGE,  // 정률 할인
    FIXED        // 정액 할인
}

// 템플릿 상태
public enum Status {
    ACTIVE,   // 활성 (발급 가능)
    HIDDEN,   // 숨김 (발급 불가, 조회 불가)
    DELETED   // 삭제됨 (소프트 삭제)
}

// 상태 전환 규칙:
// - ACTIVE ↔ HIDDEN: 양방향 전환 가능 (관리자가 수정 시)
// - ACTIVE/HIDDEN → DELETED: 삭제 시 (역방향 불가)
// - DELETED 상태의 템플릿은 수정/삭제 불가
// - 템플릿 상태 변경 시 발급된 쿠폰 중 ACTIVE/HIDDEN 쿠폰도 동일하게 전환

// 쿠폰 타입
public enum CouponType {
    DEFAULT,                      // 기본
    PARTNERS,                     // 파트너스
    AFTER_TRIAL,                  // 체험 후
    SUBSCRIBE_DONE,               // 구독 완료
    SUBSCRIBE_PROTECTION,         // 구독 보호
    SUBSCRIBE_EXPIRED,            // 구독 만료
    SUBSCRIBE_EXPIRED_JPANDCOUNT, // 일본어+회차권 만료
    WELCOME,                      // 웰컴
    SMART_TALK_TRIAL_EXPIRED      // 스마트톡 체험 만료
}

// 적용 유형
public enum ApplyType {
    SUB,      // 구독 상품
    SUB_MAPP, // 구독 매핑
    USER      // 사용자
}
```

### 주요 메서드

```java
// 사용 시작일 계산
public LocalDateTime calUtcUseStart() {
    if (useDay != null) {
        return LocalDateTime.now();  // 발급 시점
    }
    return getUtcUseStartWithZone(); // 고정 시작일
}

// 사용 종료일 계산
public LocalDateTime calUtcUseEnd(LocalDateTime start) {
    if (useDay == null) {
        return getUtcUseEndWithZone(); // 고정 종료일
    }
    if (useDay == 0) {
        return DateTimeUtils.saturate(start); // 당일 23:59:59
    }
    return DateTimeUtils.saturate(start.plusDays(useDay)); // 시작일 + N일
}
```

---

## 3. ApplyCondition (JSON 직렬화 객체)

쿠폰이 적용될 수 있는 조건을 정의하는 JSON 객체입니다.

### 구조

```java
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApplyCondition implements Serializable {
    String[] langTypes;              // 언어 타입
    String[] curriculumTypes;        // 커리큘럼 타입
    Integer[] lessonTimes;           // 수업 시간 (분)
    String[] paymentTypes;           // 결제 유형
    String[] promotionTypes;         // 프로모션 타입
    Integer[] lessonCountPerMonths;  // 월 수업 횟수
    String[] targetSubscribeIds;     // 포함 대상 구독 ID
    String[] excludeSubscribeIds;    // 제외 대상 구독 ID
}
```

### 필드별 가능한 값

| 필드 | 가능한 값 |
|------|-----------|
| `langTypes` | `EN`, `JP`, `CN` |
| `curriculumTypes` | `REGULAR`, `KIDS`, `BUSINESS` 등 |
| `lessonTimes` | `15`, `25`, `50` |
| `paymentTypes` | `SUBSCRIBE`, `LUMP_SUM`, `IPAD`, `EXTEND` |
| `promotionTypes` | `PAYBACK` 등 |
| `lessonCountPerMonths` | `1`, `4`, `8`, `999` (무제한) |

### 저장 예시

```json
{
  "langTypes": ["EN", "JP"],
  "curriculumTypes": ["REGULAR"],
  "lessonTimes": [25],
  "paymentTypes": ["SUBSCRIBE"],
  "promotionTypes": [],
  "lessonCountPerMonths": [4, 8],
  "targetSubscribeIds": [],
  "excludeSubscribeIds": ["sub_001", "sub_002"]
}
```

---

## 4. 엔티티 관계도

```
+-------------------+       +----------------------+
|      User         |       |   CouponTemplate     |
+-------------------+       +----------------------+
| id (PK)           |       | id (PK)              |
| ...               |       | code (UNIQUE)        |
+-------------------+       | discount_type        |
         |                  | discount_amount      |
         |                  | apply_condition(JSON)|
         |                  | ...                  |
         v                  +----------------------+
+-------------------+                |
|     Coupon        |                |
+-------------------+                |
| id (PK)           |<---------------+
| template_id (FK)  |
| user_id (FK)      |
| status            |
| payment_id (FK)   |------> Payment
| ...               |
+-------------------+
```

---

## 5. 인덱스 권장사항

### Coupon 테이블
```sql
CREATE INDEX idx_coupon_user_id ON le_coupon(user_id);
CREATE INDEX idx_coupon_template_id ON le_coupon(template_id);
CREATE INDEX idx_coupon_status ON le_coupon(status);
CREATE INDEX idx_coupon_user_template ON le_coupon(user_id, template_id);
```

### CouponTemplate 테이블
```sql
CREATE UNIQUE INDEX idx_template_code ON le_coupon_template(code);
CREATE INDEX idx_template_type ON le_coupon_template(type);
CREATE INDEX idx_template_status ON le_coupon_template(status);
```

---

## 6. JPA Converter

`ApplyCondition`은 JSON 형태로 DB에 저장되며, JPA Converter를 통해 직렬화/역직렬화됩니다.

```java
@Converter
public class ApplyConditionConverter implements AttributeConverter<ApplyCondition, String> {

    @Override
    public String convertToDatabaseColumn(ApplyCondition attribute) {
        // ApplyCondition -> JSON String
    }

    @Override
    public ApplyCondition convertToEntityAttribute(String dbData) {
        // JSON String -> ApplyCondition
    }
}
```

---

## 7. 파일 위치 인덱스

| 파일 | 경로 |
|------|------|
| Coupon Entity | `src/main/java/com/speaking/podo/applications/coupon/domain/Coupon.java` |
| CouponTemplate Entity | `src/main/java/com/speaking/podo/applications/coupon/domain/CouponTemplate.java` |
| ApplyCondition | `src/main/java/com/speaking/podo/applications/coupon/domain/serialize/ApplyCondition.java` |
| ApplyConditionConverter | `src/main/java/com/speaking/podo/applications/coupon/jpa/converter/ApplyConditionConverter.java` |
| CouponRepository | `src/main/java/com/speaking/podo/applications/coupon/repository/CouponRepository.java` |
| CouponTemplateRepository | `src/main/java/com/speaking/podo/applications/coupon/repository/CouponTemplateRepository.java` |
| CouponSpecification | `src/main/java/com/speaking/podo/applications/coupon/domain/specification/CouponSpecification.java` |
