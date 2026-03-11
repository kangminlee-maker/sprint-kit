---
domain: business
type: policy
related_files:
  - src/main/java/com/speaking/podo/applications/coupon/usecase/CouponServiceImpl.java
  - src/main/java/com/speaking/podo/applications/coupon/domain/Coupon.java
  - src/main/java/com/speaking/podo/applications/coupon/domain/CouponTemplate.java
keywords: [쿠폰, 할인, 선착순, 이벤트, 발급]
last_verified: 2026-01-26
---

# 쿠폰 정책

## 개요
PODO의 쿠폰은 구독 상품 결제 시 할인을 제공하는 마케팅 도구입니다.

## 쿠폰 구조

### CouponTemplate (쿠폰 템플릿)
- **설명**: 쿠폰의 설계도 (1개 템플릿 → N개 쿠폰 발급)
- **주요 속성**:
  - `code`: 쿠폰 코드 (고유값)
  - `discountType`: FIXED (정액) 또는 PERCENTAGE (정률)
  - `discountAmount`: 할인 금액 또는 할인율
  - `pubLimit`: 발급 수량 제한 (-1 = 무제한)
  - `utcPubStart ~ utcPubEnd`: 발급 가능 기간
  - `utcUseStart ~ utcUseEnd`: 사용 가능 기간
  - `applyCondition`: 적용 조건 (언어, 커리큘럼, 결제 타입 등)

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/coupon/domain/CouponTemplate.java`

---

### Coupon (쿠폰)
- **설명**: 사용자에게 발급된 쿠폰 (1개 템플릿 → 여러 사용자에게 발급)
- **주요 속성**:
  - `id`: 쿠폰 ID (고유값)
  - `templateId`: 쿠폰 템플릿 ID (FK)
  - `userId`: 발급받은 사용자 ID
  - `status`: ACTIVE, USED, EXPIRED, DELETED, HIDDEN
  - `utcUseStart ~ utcUseEnd`: 사용 가능 기간 (템플릿에서 상속)
  - `utcUsedAt`: 사용 시각

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/coupon/domain/Coupon.java`

---

## 쿠폰 타입

### 1. WELCOME (웰컴 쿠폰)
- **설명**: 회원가입 시 자동 발급
- **발급 시점**: 회원가입 직후
- **발급 조건**: 신규 회원만
- **사용 조건**: 첫 구독 시만

**예시**:
```
회원가입 시
→ 10,000원 할인 쿠폰 자동 발급
→ 첫 구독 결제 시 사용 가능
```

---

### 2. AFTER_TRIAL (체험 후 쿠폰)
- **설명**: 체험 수업 완료 후 자동 발급
- **발급 시점**: 체험 수업 종료 직후
- **발급 조건**: 체험 수업 완료
- **사용 조건**: 정규 구독 전환 시

**예시**:
```
체험 수업 완료
→ 20% 할인 쿠폰 자동 발급
→ 7일 내 정규 구독 시 사용 가능
```

---

### 3. SUBSCRIBE_DONE (구독 완료 쿠폰)
- **설명**: 구독 결제 완료 후 자동 발급
- **발급 시점**: 결제 성공 직후
- **발급 조건**: 첫 구독 결제 완료
- **사용 조건**: 다음 구독 결제 시

---

### 4. SUBSCRIBE_PROTECTION (구독 보호 쿠폰)
- **설명**: 구독 해지 방지용 쿠폰
- **발급 시점**: 구독 해지 요청 시
- **발급 조건**: 구독 해지 시도
- **사용 조건**: 구독 유지 선택 시

---

### 5. SUBSCRIBE_EXPIRED (구독 만료 쿠폰)
- **설명**: 구독 만료 후 재가입 유도
- **발급 시점**: 구독 만료 후 D+1
- **발급 조건**: 구독 만료
- **사용 조건**: 재가입 시

---

### 6. MANUAL (수동 발급 쿠폰)
- **설명**: 관리자가 수동 발급
- **발급 시점**: 관리자 요청 시
- **발급 조건**: 관리자 설정
- **사용 조건**: 관리자 설정

---

## 쿠폰 발급 규칙

### 자동 발급 (이벤트 쿠폰)
**비즈니스 규칙**:
- 특정 이벤트 발생 시 자동 발급
- 중복 발급 방지: 사용자당 1회만
- SQS 큐를 통한 비동기 발급

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/coupon/usecase/CouponServiceImpl.java`

**코드 위치**: CouponServiceImpl.java:76-190

**예시**:
```java
// 체험 수업 완료 시 자동 발급
publishEventCoupon(userId, CouponType.AFTER_TRIAL);
```

---

### 수동 발급 (관리자)
**비즈니스 규칙**:
- 관리자가 특정 사용자에게 발급
- 대량 발급 가능 (최대 6000개/배치)
- 중복 발급 허용 (관리자 판단)

**코드 위치**: CouponServiceImpl.java:686-794

**예시**:
```java
// 관리자가 100명에게 쿠폰 발급
publishCouponByAdmin(
    templateId,
    userValidMap,  // Map<userId, isValid>
    publishCount   // 1인당 발급 개수
);
```

---

### 선착순 쿠폰 (Race Coupon)
**비즈니스 규칙**:
- Redis Lock으로 동시성 제어
- 발급 수량 초과 시 실패
- Lock 획득 순서 = 발급 순서

**코드 위치**: CouponServiceImpl.java:1030-1052

**예시**:
```
템플릿 설정: pubLimit = 100
→ 100명까지만 발급 가능
→ 101번째 사용자는 발급 실패
```

---

## 쿠폰 사용 규칙

### 사용 조건 확인
**비즈니스 규칙**:
1. **쿠폰 상태**: ACTIVE 또는 PENDING
2. **사용 기간**: utcUseStart <= 현재 < utcUseEnd
3. **적용 조건**: applyCondition 만족

**코드 위치**: CouponServiceImpl.java:940-969

---

### 적용 조건 (ApplyCondition)
**비즈니스 규칙**:
- **langTypes**: 언어 타입 (EN, JP, ENJP)
- **curriculumTypes**: 커리큘럼 타입 (BASIC, BUSINESS, SMART_TALK)
- **lessonTimes**: 수업 시간 (25분, 50분)
- **paymentTypes**: 결제 타입 (SUBSCRIBE, LUMP_SUM, EXTEND)
- **lessonCountPerMonths**: 월 수업 횟수 (4, 8, 12, 999)
- **targetSubscribeIds**: 특정 구독 상품만
- **excludeSubscribeIds**: 특정 구독 상품 제외

**코드 위치**: CouponServiceImpl.java:356-408

**예시**:
```json
{
  "langTypes": ["EN"],
  "paymentTypes": ["SUBSCRIBE", "EXTEND"],
  "lessonCountPerMonths": [8, 12],
  "excludeSubscribeIds": ["sub_trial_123"]
}
```

위 조건은:
- 영어 구독만
- 정기 구독 또는 연장 구독만
- 월 8회 또는 12회 상품만
- 체험권(sub_trial_123) 제외

---

### 할인 계산
**비즈니스 규칙**:
- **FIXED (정액)**: 할인 금액 = discountAmount
- **PERCENTAGE (정률)**: 할인 금액 = min(원가 × (discountAmount / 100), discountAmountMax)

**코드 위치**: CouponServiceImpl.java:923-938

**⚠️ 코드 검증 이슈 (2026-01-26)**:
`calDiscount()` 메서드가 정률 할인 시 **할인 금액이 아니라 할인 적용 후 금액**을 반환하는 구조적 문제 발견. 실제 결제 로직에서 올바르게 처리되는지 추가 검증 필요.

**예시**:
```
원가: 50,000원
쿠폰: 20% 할인, 최대 10,000원

계산: 50,000 × 0.2 = 10,000원
→ 최대 할인 금액 = 10,000원
→ 최종 할인 금액 = 10,000원
→ 결제 금액 = 40,000원
```

---

### 사용 처리
**비즈니스 규칙**:
- `status` = "USED"
- `utcUsedAt` = 현재 시각
- 구독 상품의 경우 재사용 가능 (2개월차, 3개월차)

**코드 위置**: CouponServiceImpl.java:335-350

**예시**:
```
3개월 구독 상품 결제 시 쿠폰 사용
→ 1개월차: 쿠폰 사용 (utcUsedAt 기록)
→ 2개월차: 동일 쿠폰 재사용 (reuse = true)
→ 3개월차: 동일 쿠폰 재사용 (reuse = false, 최종 사용)
```

---

## 쿠폰 상태

### 실제 상태 (Status)

쿠폰 엔티티의 `status` 필드에 저장되는 값:

#### ACTIVE
- **설명**: 사용 가능 상태
- **전환 규칙**:
  - 발급 시 기본 상태
  - `ACTIVE` → `USED`: 결제 완료 시
  - `ACTIVE` → `DELETED`: 관리자 삭제 시
  - `USED`/`DELETED` → `ACTIVE`: 관리자 복구 시

#### USED
- **설명**: 사용 완료
- **전환 규칙**:
  - `ACTIVE` → `USED`: 결제 완료 시 (`useCoupon()`)
  - `USED` → `ACTIVE`: 관리자 복구 시 (`restoreCoupon()`)
- **기록 정보**: `payment_id`, `utc_used_at` 함께 저장

#### DELETED
- **설명**: 관리자가 삭제 (소프트 삭제)
- **전환 규칙**:
  - `ACTIVE`/`HIDDEN` → `DELETED`: 관리자 삭제 시 (`deleteCouponByAdmin()`)
  - `DELETED` → `ACTIVE`: 관리자 복구 시 (`restoreCoupon()`)
- **삭제 불가**: `USED`, `DELETED` 상태의 쿠폰은 삭제 불가

#### HIDDEN
- **설명**: 사용자에게 보이지 않음
- **전환 규칙**: 템플릿 상태가 `HIDDEN`으로 변경 시 자동 전환
- **특징**: 재발급 절대 불가 (중복 발급 체크에서 무조건 에러)

---

### 표시 상태 (DisplayStatus)

UI에 보여지는 상태로, 실제 상태 + 시간 정보 조합:

#### NORMAL
- **설명**: 사용 가능 기간 내
- **조건**: `status = ACTIVE` AND `utcUseStart <= 현재 < utcUseEnd`

#### PENDING
- **설명**: 발급됨, 아직 사용 가능 기간 전
- **조건**: `status = ACTIVE` AND `현재 < utcUseStart`

#### EXPIRED
- **설명**: 기간 만료
- **조건**: `status = ACTIVE` AND `utcUseEnd <= 현재`

#### USED
- **설명**: 사용 완료
- **조건**: `status = USED`

#### DELETED
- **설명**: 삭제됨
- **조건**: `status = DELETED`

#### HIDDEN
- **설명**: 숨김
- **조건**: `status = HIDDEN`

---

### 상태 전환 다이어그램

```
발급 시
  ↓
[ACTIVE] ←→ [HIDDEN] (템플릿 상태 변경 시)
  ↓ ↓
  ↓ └→ [DELETED] (관리자 삭제)
  ↓         ↓
  ↓         └→ [ACTIVE] (관리자 복구)
  ↓
[USED] (결제 완료)
  ↓
[ACTIVE] (관리자 복구)
```

---

## 중복 발급 방지 규칙

### 자동 발급 쿠폰

**검증 로직**: `CouponServiceImpl.checkClientCouponPublishable()` - Line 871

```java
// 1. HIDDEN 상태 쿠폰이 있으면 무조건 재발급 불가
if (userCoupons.anyMatch(c -> c.status == HIDDEN)) {
    throw INVALID_COUPON_DUPLICATE_PUBLISH;
}

// 2. ACTIVE 상태이면서 만료되지 않은 쿠폰이 있으면 재발급 불가
LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
boolean hasNotExpiredActiveCoupon = userCoupons.stream()
    .filter(c -> c.status == ACTIVE)
    .anyMatch(c -> c.utcUseEnd == null || !c.utcUseEnd.isBefore(nowUtc));

if (hasNotExpiredActiveCoupon) {
    throw INVALID_COUPON_DUPLICATE_PUBLISH;
}

// 3. 그 외(USED, DELETED, ACTIVE+만료)는 재발급 가능
```

**비즈니스 규칙**:

| 기존 쿠폰 상태 | 조건 | 재발급 가능 여부 | 비고 |
|----------------|------|------------------|------|
| `USED` | - | **O** | 사용 완료되어 재지급 가능 |
| `DELETED` | - | **O** | 삭제되어 재지급 가능 |
| `ACTIVE` | 사용 기간 만료 (utcUseEnd < nowUtc) | **O** | 기간 지나면 재지급 가능 |
| `ACTIVE` | 사용 기간 내 (utcUseEnd ≥ nowUtc) | **X** | 중복 발급 방지 |
| `HIDDEN` | - | **X** | 어떤 경우에도 재지급 절대 불가 |

**예시**:
```
사용자가 이미 WELCOME 쿠폰 보유
→ 상태가 ACTIVE이고 만료 전 (utcUseEnd >= nowUtc)
→ 재발급 요청 시 에러 반환 (INVALID_COUPON_DUPLICATE_PUBLISH)
```

---

### 수동 발급 쿠폰
**비즈니스 규칙**:
- 관리자 판단에 따라 중복 발급 가능
- 중복 발급 시 경고 메시지 표시

**코드 위置**: CouponServiceImpl.java:735-737

---

## 선착순 쿠폰 (Race Coupon)

### Redis Lock 메커니즘
**비즈니스 규칙**:
- Lock Key: `coupon:{code}:{pubLimit}`
- Lock Value: 현재 발급 개수
- Lock 획득 실패 시: 수량 초과 에러

**코드 위치**: CouponServiceImpl.java:1030-1052

**예시**:
```
pubLimit = 100
현재 발급 개수 = 99

101번째 사용자 요청:
1. Lock 획득 시도
2. Value = 99 < 100 → 성공
3. Value += 1 → 100
4. 쿠폰 발급
```

---

### 발급 수량 확인
**비즈니스 규칙**:
- DB 조회: `SELECT COUNT(*) FROM le_coupon WHERE template_id = ? AND status != 'DELETED'`
- Redis 조회: `GET coupon:{code}:{pubLimit}`
- 두 값 비교 후 발급 여부 결정

---

## 쿠폰 템플릿 관리

### 생성
**비즈니스 규칙**:
- 중복 코드 검증
- 발급/사용 기간 검증 (시작일 < 종료일)
- 적용 조건 검증 (applyTarget XOR applyCondition)

**코드 위치**: CouponServiceImpl.java:432-474

---

### 수정
**비즈니스 규칙**:
- 이미 발급된 쿠폰이 있으면:
  - 할인 금액/할인율 변경 불가
  - 적용 조건 변경 불가
  - 발급 수량 감소 불가
- 발급된 쿠폰이 없으면:
  - 모든 필드 변경 가능

**코드 위治**: CouponServiceImpl.java:477-616

---

### 삭제
**비즈니스 규칙**:
- Soft Delete (status = DELETED)
- 발급된 쿠폰 중 USED 제외 모두 삭제
- 선착순 쿠폰인 경우 Redis Lock 삭제

**코드 위置**: CouponServiceImpl.java:659-682

---

## 예외 처리

### 쿠폰 없음
**에러 코드**: `COUPON_NOT_FOUND`
**처리**: 에러 반환

---

### 중복 발급
**에러 코드**: `INVALID_COUPON_DUPLICATE_PUBLISH`
**처리**: 에러 반환 (자동 발급만)

---

### 수량 초과
**에러 코드**: `COUPON_RACE_FAILED`
**처리**: 에러 반환

---

### 적용 조건 불일치
**에러 코드**: `INVALID_COUPON_APPLY_CONDITION`
**처리**: 결제 시 쿠폰 미적용 (원가 결제)

---

## 관련 도메인

### 구독 관리
- [구독 플로우](./subscription-flow.md)

### 결제 시스템
- [결제 플로우](./payment-flow.md)

---

## 주요 메서드 요약

| 메서드 | 설명 | 파일 라인 |
|--------|------|-----------|
| `publishEventCoupon()` | 이벤트 쿠폰 자동 발급 | CouponServiceImpl.java:77 |
| `publishCoupon()` | 쿠폰 발급 | CouponServiceImpl.java:799 |
| `publishCouponByAdmin()` | 관리자 수동 발급 | CouponServiceImpl.java:686 |
| `useCoupon()` | 쿠폰 사용 | CouponServiceImpl.java:335 |
| `calDiscount()` | 할인 금액 계산 | CouponServiceImpl.java:923 |
| `getApplyCouponList()` | 적용 가능 쿠폰 조회 | CouponServiceImpl.java:940 |
| `raceCoupon()` | 선착순 쿠폰 발급 | CouponServiceImpl.java:1030 |

---

**최종 업데이트**: 2026-01-26
