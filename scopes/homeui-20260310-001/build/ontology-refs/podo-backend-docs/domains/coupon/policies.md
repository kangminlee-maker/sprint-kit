---
domain: coupon
document_type: policies
version: 1.0.0
last_updated: 2026-01-26
---

# 쿠폰 정책 문서

## 1. 쿠폰 타입 (CouponType)

쿠폰은 발급 목적에 따라 다음과 같이 분류됩니다.

| 타입 | 설명 | 자동발급 |
|------|------|----------|
| `DEFAULT` | 기본 쿠폰 (일반 프로모션) | X |
| `PARTNERS` | 파트너스 제휴 쿠폰 | X |
| `AFTER_TRIAL` | 체험 수업 완료 후 발급 | O |
| `SUBSCRIBE_DONE` | 구독 완료 시 발급 | O |
| `SUBSCRIBE_PROTECTION` | 구독 보호 쿠폰 | O |
| `SUBSCRIBE_EXPIRED` | 구독 만료 쿠폰 | O |
| `SUBSCRIBE_EXPIRED_JPANDCOUNT` | 일본어+회차권 구독 만료 쿠폰 | O |
| `WELCOME` | 웰컴 쿠폰 (신규 가입) | O |
| `SMART_TALK_TRIAL_EXPIRED` | 스마트톡 체험 만료 쿠폰 | O |

### 자동 발급 정책
자동 발급 타입의 쿠폰은 시스템 이벤트에 의해 자동으로 발급됩니다:
- 체험 수업 완료 이벤트 -> `AFTER_TRIAL` 쿠폰 발급
- 구독 완료 이벤트 -> `SUBSCRIBE_DONE` 쿠폰 발급
- 구독 만료 이벤트 -> `SUBSCRIBE_EXPIRED` 쿠폰 발급

---

## 2. 할인 유형 (DiscountType)

| 유형 | 설명 | 계산 방식 |
|------|------|-----------|
| `FIXED` | 정액 할인 | 할인금액 = `discountAmount` |
| `PERCENTAGE` | 정률 할인 | 할인금액 = min(가격 * `discountAmount` / 100, `discountAmountMax`) |

### 정액 할인 제약
정액 할인인 경우 `discountAmount`와 `discountAmountMax`가 동일해야 합니다.

### ⚠️ 코드 검증 이슈 (2026-01-26)

**문제점**: `CouponServiceImpl.calDiscount()` 메서드의 정률 할인 계산 로직이 문서와 불일치

**코드 위치**: `src/main/java/com/speaking/podo/applications/coupon/usecase/CouponServiceImpl.java:923-938`

```java
public int calDiscount(Integer originalPrice, String discountType,
                       Integer discountAmount, Integer discountAmountMax) {
    if (originalPrice == 0) {
        return originalPrice;
    }

    int appliedPrice = originalPrice;
    if("FIXED".equals(discountType)) {
        appliedPrice = discountAmount; // ✓ 정액: 할인금액 반환
    } else if("PERCENTAGE".equals(discountType)) {
        // ❌ 문제: 할인금액이 아니라 "할인 적용 후 금액"을 계산함
        appliedPrice = Math.min((int) Math.floor(appliedPrice * ((double) discountAmount / 100)), discountAmountMax);
    }
    return appliedPrice;
}
```

**불일치 내용**:
- **FIXED**: 할인금액(`discountAmount`) 반환 ✓ 정상
- **PERCENTAGE**: 할인 적용 후 금액 반환 ✗ **오류**
  - 현재: `min(원가 * 할인율 / 100, 최대할인금액)` (할인 적용 후 가격)
  - 기대: 할인금액만 반환해야 함

**영향**:
- 메서드명은 `calDiscount` (할인금액 계산)인데 정률 할인 시 할인 후 금액을 반환
- 호출부에서 혼란 가능성 있음
- 실제 결제 로직에서 올바르게 처리되는지 추가 검증 필요

---

## 3. 쿠폰 상태 (Status)

### 템플릿 상태 (CouponTemplate.Status)
| 상태 | 설명 | 상태 전환 |
|------|------|-----------|
| `ACTIVE` | 활성 상태 (발급 가능) | 생성 시 기본 상태, HIDDEN ↔ ACTIVE 전환 가능 |
| `HIDDEN` | 숨김 상태 (발급 불가, 조회 불가) | ACTIVE ↔ HIDDEN 전환 가능 |
| `DELETED` | 삭제됨 (소프트 삭제) | ACTIVE/HIDDEN → DELETED만 가능 (역방향 불가) |

**템플릿 상태 전환 규칙**:
- `DELETED` 상태의 템플릿은 수정/삭제 불가
- 템플릿 삭제 시 해당 템플릿의 미사용(`ACTIVE`, `HIDDEN`) 쿠폰도 모두 `DELETED`로 전환
- `USED` 상태 쿠폰은 템플릿 삭제 시에도 유지됨

### 쿠폰 상태 (Coupon.Status)
| 상태 | 설명 | 상태 전환 |
|------|------|-----------|
| `ACTIVE` | 사용 가능 | 발급 시 기본 상태, `USED`로 전환 가능, 관리자가 `DELETED`로 전환 가능 |
| `HIDDEN` | 숨김 (사용 불가) | 템플릿 상태 변경 시 자동 전환, 재발급 절대 불가 |
| `DELETED` | 삭제됨 | `ACTIVE`/`HIDDEN` → `DELETED`만 가능, 복구 시 `ACTIVE`로 전환 |
| `USED` | 사용 완료 | 결제 완료 시 `ACTIVE` → `USED` 전환, 복구 시 `ACTIVE`로 전환 |

**쿠폰 상태 전환 규칙**:
- **사용 처리**: `ACTIVE` → `USED` (결제 완료 시)
  - `payment_id`, `utc_used_at` 기록
  - Repository: `use(couponId, paymentId, utcUsedAt)` 메서드 사용
- **복구 처리**: `USED`/`DELETED` → `ACTIVE` (관리자 복구 시)
  - `payment_id`, `utc_used_at` 초기화
  - Repository: `restore(couponId)` 메서드 사용
- **삭제 처리**: `ACTIVE`/`HIDDEN` → `DELETED` (관리자 삭제 시)
  - `USED`, `DELETED` 상태의 쿠폰은 삭제 불가 (에러 발생)
  - Repository: `deleteById(couponId)` 메서드 사용

### 표시 상태 (DisplayStatus)
UI에서 보여지는 상태로, 실제 상태와 시간 정보를 조합하여 계산됩니다.

**계산 로직** (`Coupon.getDisplayStatus()`):
```java
if (status == DELETED || status == HIDDEN || status == USED) {
    return status.toString();  // 그대로 반환
} else if (now > utcUseEnd) {
    return "EXPIRED";
} else if (now < utcUseStart) {
    return "PENDING";
} else {
    return "NORMAL";
}
```

| 표시 상태 | 조건 |
|-----------|------|
| `NORMAL` | `ACTIVE` 상태 + 사용 기간 내 (utcUseStart ≤ now < utcUseEnd) |
| `PENDING` | `ACTIVE` 상태 + 사용 시작일 전 (now < utcUseStart) |
| `EXPIRED` | `ACTIVE` 상태 + 사용 종료일 후 (now ≥ utcUseEnd) |
| `USED` | `USED` 상태 |
| `HIDDEN` | `HIDDEN` 상태 |
| `DELETED` | `DELETED` 상태 |

**활용**:
- 쿠폰 목록 조회 시 `displayType` 필터링
  - `ACTIVE`: `NORMAL`, `PENDING` 포함
  - `USED`: `EXPIRED`, `USED` 포함

---

## 4. 적용 조건 (ApplyCondition) - CRITICAL

쿠폰이 적용될 수 있는 상품의 조건을 JSON 형태로 저장합니다.

### 필드 상세

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `langTypes` | String[] | 적용 가능 언어 | `["EN", "JP", "CN"]` |
| `curriculumTypes` | String[] | 적용 가능 커리큘럼 | `["REGULAR", "KIDS"]` |
| `lessonTimes` | Integer[] | 적용 가능 수업 시간 (분) | `[15, 25, 50]` |
| `paymentTypes` | String[] | 적용 가능 결제 유형 | `["SUBSCRIBE", "LUMP_SUM", "IPAD", "EXTEND"]` |
| `promotionTypes` | String[] | 적용 가능 프로모션 | `["PAYBACK"]` |
| `lessonCountPerMonths` | Integer[] | 적용 가능 월 수업 횟수 | `[4, 8, 999]` |
| `targetSubscribeIds` | String[] | 포함 대상 구독 ID | 특정 상품 ID 명시 |
| `excludeSubscribeIds` | String[] | 제외 대상 구독 ID | 제외할 상품 ID 명시 |

### 적용 로직

1. **포함 조건 (OR 로직)**
   - 각 조건 배열이 비어있지 않은 경우, 해당 배열의 값 중 하나라도 일치하면 통과
   - 배열이 비어있으면 해당 조건은 무시 (전체 통과)

2. **제외 조건**
   - `excludeSubscribeIds`에 포함된 상품은 무조건 제외

3. **타겟 직접 지정**
   - `targetSubscribeIds`가 있으면 해당 상품들만 대상
   - 비어있으면 다른 조건으로 검색

### 예시: 영어 25분 구독 상품 전용 쿠폰
```json
{
  "langTypes": ["EN"],
  "curriculumTypes": [],
  "lessonTimes": [25],
  "paymentTypes": ["SUBSCRIBE"],
  "promotionTypes": [],
  "lessonCountPerMonths": [],
  "targetSubscribeIds": [],
  "excludeSubscribeIds": []
}
```

---

## 5. 적용 유형 (ApplyType)

| 유형 | 설명 |
|------|------|
| `SUB` | 구독 상품 적용 |
| `SUB_MAPP` | 구독 상품 매핑 적용 |
| `USER` | 사용자 대상 (상품 무관) |

---

## 6. 발급 정책

### 6.1 발급 기간 (PubStart/PubEnd)
- `utcPubStart`: 발급 시작일시 (UTC)
- `utcPubEnd`: 발급 종료일시 (UTC)
- 발급 기간 외에는 쿠폰 발급 불가

### 6.2 사용 기간 설정
두 가지 방식 중 하나를 선택:

**방식 1: 고정 기간**
- `utcUseStart` / `utcUseEnd` 직접 지정
- 모든 사용자에게 동일한 사용 기간 적용

**방식 2: 상대 기간 (useDay)**
- `useDay`: 발급일로부터 사용 가능 일수
- `useDay = 0`: 당일까지만 사용 가능
- `useDay = 7`: 발급일 + 7일까지 사용 가능

### 6.3 수량 제한 (pubLimit)
- `pubLimit < 0`: 무제한 발급
- `pubLimit >= 0`: 선착순 발급 (Redis 기반 동시성 제어)

### 6.4 중복 발급 정책 (재지급 정책)

**검증 로직** (`CouponServiceImpl.checkClientCouponPublishable()` - Line 871):
```java
// 1. HIDDEN 상태 쿠폰이 있으면 무조건 재발급 불가
if (userCoupons.anyMatch(c -> c.status == HIDDEN)) {
    throw INVALID_COUPON_DUPLICATE_PUBLISH;
}

// 2. ACTIVE 상태이면서 만료되지 않은 쿠폰이 있으면 재발급 불가
if (userCoupons.anyMatch(c -> c.status == ACTIVE && c.utcUseEnd >= nowUtc)) {
    throw INVALID_COUPON_DUPLICATE_PUBLISH;
}

// 3. 그 외(USED, DELETED, ACTIVE+만료)는 재발급 가능
```

| 기존 쿠폰 상태 | 조건 | 재지급 가능 여부 | 비고 |
|----------------|------|------------------|------|
| `USED` | - | **O** | 사용 완료되어 재지급 가능 |
| `DELETED` | - | **O** | 삭제되어 재지급 가능 |
| `ACTIVE` | 사용 기간 만료 (utcUseEnd < nowUtc) | **O** | 기간 지나면 재지급 가능 |
| `ACTIVE` | 사용 기간 내 (utcUseEnd ≥ nowUtc) | **X** | 중복 발급 방지 |
| `HIDDEN` | - | **X** | 어떤 경우에도 재지급 절대 불가 |

**적용 범위**:
- 자동 발급 쿠폰 (이벤트 쿠폰)만 적용
- 관리자 수동 발급은 중복 검증 없음 (관리자 판단에 따름)

---

## 7. 사용 정책

### 7.1 사용 조건
- 쿠폰 상태가 `ACTIVE`
- 현재 시간이 사용 기간 내
- 적용 조건(ApplyCondition)에 맞는 상품

### 7.2 쿠폰 사용 처리

**사용 메서드**: `CouponServiceImpl.useCoupon(couponId, reuse, paymentId)` - Line 335

```java
// DB 업데이트
UPDATE le_coupon
SET payment_id = :paymentId,
    status = 'USED',
    utc_used_at = :utcUsedAtOrNull
WHERE id = :couponId
```

**상태 전환**:
- `ACTIVE` → `USED`
- `payment_id` 기록
- `utc_used_at` 기록

**구독 상품 쿠폰 재사용**:
- 3개월 구독 상품의 경우 1개월차, 2개월차, 3개월차 모두 동일 쿠폰 적용
- `reuse = true`: 기존 `utc_used_at` 유지 (2개월차)
- `reuse = false`: 현재 시각으로 `utc_used_at` 갱신 (3개월차)

### 7.3 최소 결제 금액
~~쿠폰 적용 후 결제 금액이 500원 이상이어야 적용 가능~~

**⚠️ 검증 필요**:
- 코드에서 최소 결제 금액(500원) 검증 로직을 찾을 수 없음
- `CouponServiceImpl.calDiscount()` 메서드에 최소 금액 제약 없음
- `PaymentGateway.processPayment()` 메서드에도 500원 검증 로직 없음
- 실제 구현 여부 재확인 필요 (2026-01-26 검증)

---

## 8. 관리자 정책

### 8.1 쿠폰 삭제

**삭제 메서드**: `CouponServiceImpl.deleteCouponByAdmin(couponId)` - Line 650

**검증 로직**:
```java
if (coupon.displayStatus == "DELETED" || coupon.displayStatus == "USED") {
    throw InvalidCouponDelete;  // 삭제 불가
}
```

**규칙**:
- `DELETED`, `USED` 상태의 쿠폰은 삭제 불가 (에러 발생)
- `ACTIVE`, `HIDDEN` 상태만 삭제 가능
- 삭제 시 상태를 `DELETED`로 변경 (소프트 삭제)

**DB 업데이트**:
```sql
UPDATE le_coupon SET status = 'DELETED' WHERE id = :couponId
```

### 8.2 쿠폰 복구

**복구 메서드**: `CouponServiceImpl.restoreCoupon(couponId)` - Line 352

**상태 전환**: `USED`/`DELETED` → `ACTIVE`

**DB 업데이트**:
```sql
UPDATE le_coupon
SET payment_id = NULL,
    utc_used_at = NULL,
    status = 'ACTIVE'
WHERE id = :couponId
```

### 8.3 템플릿 삭제

**삭제 메서드**: `CouponServiceImpl.deleteCouponTemplateByAdmin(templateId)` - Line 659

**검증 로직**:
```java
if (template.displayStatus == "DELETED") {
    throw InvalidCouponAlreadyDeleted;  // 이미 삭제됨
}
```

**삭제 프로세스**:
1. 템플릿 상태를 `DELETED`로 변경
2. 해당 템플릿으로 발급된 쿠폰 중 미사용 쿠폰만 삭제
   - `displayStatus != "USED"` 조건 (즉, `ACTIVE`, `HIDDEN`, `PENDING`, `EXPIRED` 삭제)
   - `USED` 상태 쿠폰은 보존
3. 선착순 쿠폰(`pubLimit > 0`)의 경우 Redis Lock 키 삭제

**코드**:
```java
Set<String> deletingCouponIds = coupons.stream()
    .filter(c -> !"USED".equals(c.getDisplayStatus()))
    .map(Coupon::getId)
    .collect(Collectors.toSet());

couponTemplateRepository.deleteById(templateId);  // 템플릿 DELETED
couponRepository.deleteByIds(deletingCouponIds);  // 쿠폰들 DELETED

if (template.getPubLimit() > 0) {
    lockManager.removeKey(makeCouponLockKey(code, pubLimit));
}
```

### 8.4 템플릿 수정 제약

**수정 메서드**: `CouponServiceImpl.updateCouponTemplateByAdmin()` - Line 477

발급된 쿠폰이 있는 경우 다음 필드 수정 불가:
- `discountType`
- `discountAmount`
- `discountAmountMax`
- `applyCondition`
- `pubLimit` (증가만 가능, 감소 불가)

**발급된 쿠폰 자동 동기화**:
템플릿 수정 시 발급된 쿠폰 중 `USED`, `DELETED`가 아닌 쿠폰들의 정보 자동 갱신:
- `utc_use_start` / `utc_use_end` 동기화
- 템플릿이 `ACTIVE` ↔ `HIDDEN` 전환 시 쿠폰 상태도 동일하게 전환

**코드** (Line 585-605):
```java
for (Coupon coupon : coupons) {
    if (!USED.equals(coupon.status) && !DELETED.equals(coupon.status)) {
        // 사용 기간 동기화
        newUtcUseStart = coupon.getUtcUseStartWithZone();
        newUtcUseEnd = coupon.getUtcUseEndWithZone();

        // 템플릿 상태가 변경되면 쿠폰 상태도 따라감
        newStatus = template.getStatus().toString();

        updateCoupon(coupon.id, newStatus, newUtcUseStart, newUtcUseEnd);
    }
}
```

### 8.5 상태 변경 제약
- 템플릿 상태를 `DELETED`로 직접 변경 불가 (삭제 API 사용 필수)
- `DELETED` 상태의 템플릿은 수정 불가

---

## 9. API 엔드포인트

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/v1/coupon/getCoupons` | 쿠폰 목록 조회 | 사용자 |
| GET | `/api/v1/coupon/getCouponDetail` | 쿠폰 상세 조회 | 사용자 |
| GET | `/api/v1/coupon/getCouponsForPayment` | 결제용 쿠폰 목록 | 사용자 |
| GET | `/api/v1/coupon/canUseCoupon` | 사용 가능 여부 확인 | 사용자 |
| POST | `/api/v1/coupon/publishCoupon` | 쿠폰 발급 | 사용자 |
| POST | `/api/v1/coupon/createCouponTemplateByAdmin` | 템플릿 생성 | 관리자 |
| POST | `/api/v1/coupon/updateCouponTemplateByAdmin` | 템플릿 수정 | 관리자 |
| POST | `/api/v1/coupon/deleteCouponTemplateByAdmin` | 템플릿 삭제 | 관리자 |
| POST | `/api/v1/coupon/publishCouponByAdmin` | 쿠폰 발급 (벌크) | 관리자 |
| POST | `/api/v1/coupon/deleteCouponByAdmin` | 쿠폰 삭제 | 관리자 |
| POST | `/api/v1/coupon/restoreCouponByAdmin` | 쿠폰 복구 | 관리자 |
| GET | `/api/v1/coupon/calculate` | 할인 금액 계산 | 공개 |
| POST | `/api/v1/coupon/apply/list` | 적용 가능 쿠폰 목록 | 사용자 |

---

## 10. 이벤트 처리

### SQS 기반 비동기 발급
대량 발급 시 SQS를 통한 비동기 처리:
1. 쿠폰 발급 요청 -> SQS 메시지 발행
2. Consumer가 메시지 수신 -> 쿠폰 DB 저장

### 알림 연동
체험 후 쿠폰 발급 시 알림 발송:
- 발급 즉시: 쿠폰 발급 알림
- 만료 6시간 전: 만료 임박 알림
- 만료 후 10분: 만료 알림
