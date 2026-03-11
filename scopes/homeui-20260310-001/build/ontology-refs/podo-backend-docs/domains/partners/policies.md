---
domain: partners
type: policy
language: ko
version: 1.0
last_updated: 2026-01-26
tags: [정책, 비즈니스규칙, 파트너승인, 추천정책, 쿠폰발급]
---

# 파트너스 도메인 정책

## 컨텍스트
포도스피킹 파트너스 프로그램의 운영 정책 및 추천 시스템 비즈니스 규칙입니다.

---

## 1. 파트너 회원 상태 관리 정책

### 1.1 상태 타입 및 전환 규칙

**Partners.Status Enum**

| 상태 | 설명 | 다음 가능 상태 |
|------|------|----------------|
| PENDING | 승인 대기 | APPROVED, REJECTED |
| APPROVED | 승인됨 (활동 가능) | REVOKED |
| REJECTED | 거절됨 | - (종료 상태) |
| REVOKED | 승인 철회됨 | - (종료 상태) |

**상태 전환 흐름**
```
PENDING ──(승인)──> APPROVED ──(철회)──> REVOKED
   │
   └──(거절)──> REJECTED
```

### 1.2 승인 정책

**승인 조건**
1. `termsAccepted = true` (약관 동의 필수)
2. `documentSubmitted` 날짜 존재 (서류 제출 완료)
3. 관리자 수동 심사 통과

**승인 처리 시 기록 사항**
- `utcApprovedAt`: 승인 시각 (UTC)
- `decisionBy`: 승인 처리자 ID
- `status`: APPROVED 상태로 변경

**거절 처리 시 기록 사항**
- `utcRejectedAt`: 거절 시각 (UTC)
- `rejectedReason`: 거절 사유 (TEXT)
- `decisionBy`: 거절 처리자 ID
- `status`: REJECTED 상태로 변경

### 1.3 철회 정책

**철회 사유**
- 약관 위반 (스팸, 부정 추천 등)
- 파트너 요청에 의한 자진 탈퇴
- 장기 미활동

**철회 처리 시 기록 사항**
- `utcRevokedAt`: 철회 시각 (UTC)
- `status`: REVOKED 상태로 변경
- 기존 활동 중인 이벤트 참여 즉시 종료

---

## 2. 파트너스 이벤트 정책

### 2.1 이벤트 상태 타입

**PartnersEvent.Status Enum**

| 상태 | 설명 | 기간 제약 |
|------|------|-----------|
| ACTIVE | 활성 이벤트 | utcStartDate ~ utcEndDate 내 |
| INACTIVE | 비활성 이벤트 | 참여 불가 |
| SYSTEM | 상시 운영 이벤트 | 기간 무관 항상 활성 |

### 2.2 이벤트 활성 상태 판정 로직

**isActive() 메서드 정책**
```java
public boolean isActive(LocalDateTime dateTime) {
    LocalDateTime reference = dateTime == null ? LocalDateTime.now() : dateTime;
    return (Status.ACTIVE.equals(this.status) || Status.SYSTEM.equals(this.status))
            && !reference.isBefore(this.utcStartDate)
            && !reference.isAfter(this.utcEndDate);
}
```

**활성 조건**
1. 상태가 `ACTIVE` 또는 `SYSTEM`
2. 현재 시각이 `utcStartDate` 이후
3. 현재 시각이 `utcEndDate` 이전

**SYSTEM 타입 특징**
- 상시 운영되는 기본 추천 프로그램
- 종료일이 먼 미래로 설정됨 (예: 2099-12-31)

### 2.3 최소 구독 일수 정책

**minSubscriptionDays 필드**
- 추천 보상을 받기 위해 피추천인이 구독해야 하는 최소 일수
- 예: `minSubscriptionDays = 30` → 피추천인이 30일 이상 구독해야 쿠폰 발급

**검증 시점**
- 피추천인의 첫 구매 시점이 아닌 **구독 유지 일수 도달 시점**
- 구독 취소 시 일수 카운트 중단

---

## 3. 추천 히스토리 정책

### 3.1 추천 기록 생성 정책

**ReferralHistory 생성 시점**
- 신규 회원 가입 시 추천 코드(referralCode) 입력한 경우
- 즉시 레코드 생성 (쿠폰 발급은 별도 조건)

**필수 필드**
- `referralUserId`: 추천인 사용자 ID
- `refereeUserId`: 피추천인 사용자 ID
- `referralCode`: 사용된 추천 코드
- `eventId`: 연관된 이벤트 ID (NULLABLE)

### 3.2 중복 추천 방지 정책

**동일 피추천인 재사용 불가**
- `refereeUserId`는 단 한 번만 추천 히스토리에 기록 가능
- 이미 추천받은 회원은 다른 추천 코드 사용 불가

**예외 케이스**
- 관리자 수동 삭제 후 재추천 허용 가능 (특수 케이스)

---

## 4. 쿠폰 발급 정책

### 4.1 추천 쿠폰 발급 조건

**handleReferralCouponPublish() 정책**

1. **이벤트 참여 확인**
   - `referralCode`로 `PartnersEventParticipation` 조회
   - `utcEndAt IS NULL` (종료되지 않은 참여만 유효)

2. **이벤트 활성 상태 검증**
   - 해당 이벤트가 `isActive(now)` 조건 만족
   - 중복 이벤트 방지: 활성 이벤트가 2개 이상이면 `PARTNERS_EVENT_DUPLICATED` 예외

3. **파트너 승인 상태 확인**
   - 파트너의 상태가 `Status.APPROVED`인지 검증
   - 아닐 경우 `PARTNERS_NOT_APPROVED` 예외

4. **쿠폰 템플릿 ID 추출**
   - `couponTemplateIds` 문자열 파싱 (쉼표 구분)
   - 숫자 유효성 검증 후 List<Integer> 반환

### 4.2 쿠폰 템플릿 ID 파싱 정책

**parseCouponTemplateIds() 메서드**
```java
"101,102,103" → [101, 102, 103]
"101, 102 , 103 " → [101, 102, 103] (공백 제거)
"101,abc,103" → [101, 103] (숫자 아닌 값 제외)
null 또는 빈 문자열 → [] (빈 리스트)
```

**발급 쿠폰 개수**
- 파싱된 템플릿 ID 개수만큼 쿠폰 발급
- 예: `[101, 102]` → 2개 쿠폰 발급

### 4.3 쿠폰 발급 대상

**추천인 쿠폰 발급**
- `referralUserId`에게 쿠폰 지급
- 발급 조건: 피추천인이 `minSubscriptionDays` 이상 구독 유지

**피추천인 쿠폰 발급**
- `refereeUserId`에게 첫 구매 시 쿠폰 지급 (이벤트 설정에 따라 다름)
- 일부 이벤트는 추천인에게만 보상 지급

---

## 5. 이벤트 참여 정책

### 5.1 참여 자격

**참여 가능 조건**
- 파트너 상태가 `APPROVED`
- 이벤트 상태가 `ACTIVE` 또는 `SYSTEM`
- 이벤트 기간 내 (`utcStartDate ~ utcEndDate`)

### 5.2 추천 코드 발급

**referralCode 형식**
- 파트너별 고유한 추천 코드
- 예: `PARTNER_101_EVENT_ABC123`
- 대소문자 구분 없음 (조회 시 case-insensitive)

### 5.3 참여 종료

**utcEndAt 설정**
- 파트너가 이벤트 참여 중단 요청 시 설정
- 이벤트 종료일 도래 시 자동 설정
- NULL인 경우에만 활성 참여로 간주

---

## 6. 콘텐츠 언어 정책

### 6.1 ContentLanguage Enum

```java
public enum ContentLanguage {
    EN,    // 영어 콘텐츠
    JP,    // 일본어 콘텐츠
    ENJP   // 영일 복합 콘텐츠
}
```

### 6.2 언어별 정책

**영어 파트너 (EN)**
- 글로벌 대상 콘텐츠 제작
- 영어권 회원 추천 시 가중치 높음

**일본어 파트너 (JP)**
- 일본 시장 대상 콘텐츠 제작
- 일본어 학습 회원 추천 시 보상 추가

**복합 파트너 (ENJP)**
- 영어/일본어 모두 다루는 콘텐츠
- 양쪽 타깃 모두 추천 가능

---

## 7. 예외 상황 처리

### 7.1 예외 코드

| 예외 코드 | 발생 상황 | 처리 방법 |
|-----------|-----------|-----------|
| PARTNERS_NOT_FOUND | 파트너 ID 조회 실패 | 404 반환 |
| PARTNERS_NOT_APPROVED | 승인되지 않은 파트너 | 403 반환 |
| PARTNERS_EVENT_NOT_ACTIVE | 비활성 이벤트 | 400 반환 |
| PARTNERS_EVENT_DUPLICATED | 활성 이벤트 중복 | 500 반환 (관리자 조치 필요) |
| PARTNERS_EVENT_COUPON_NOT_FOUND | 쿠폰 템플릿 없음 | 400 반환 |

### 7.2 데이터 정합성 보장

**트랜잭션 정책**
- 추천 히스토리 생성 + 쿠폰 발급: 단일 트랜잭션
- 롤백 조건: 쿠폰 발급 실패 시 전체 롤백

**동시성 제어**
- 동일 추천 코드 동시 사용 방지: DB UNIQUE 제약조건
- 이벤트 참여 중복 방지: `(partnerId, eventId)` 복합 유니크 키

---

## 파일 경로 인덱스
```
src/main/java/com/speaking/podo/applications/partners/
├── domain/
│   ├── Partners.java (파트너 상태 정책)
│   ├── PartnersEvent.java (이벤트 활성 상태 정책)
│   ├── PartnersReferralHistory.java (추천 기록 정책)
│   └── PartnersEventParticipation.java (쿠폰 템플릿 파싱 정책)
├── usecase/
│   └── PartnersServiceImpl.java (비즈니스 로직 구현)
└── dto/
    ├── PartnersCouponPublishRequest.java
    └── PartnersCouponPublishResult.java
```

## 관련 문서
- [파트너스 도메인 개요](./README.md)
- [파트너스 엔티티 상세](./entities.md)
