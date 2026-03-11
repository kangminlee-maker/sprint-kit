---
domain: partners
type: entity
language: ko
version: 1.0
last_updated: 2026-01-26
tags: [엔티티, 데이터모델, 테이블스키마, JPA]
---

# 파트너스 도메인 엔티티 상세

## 컨텍스트
포도스피킹 파트너스 도메인의 데이터 모델 및 JPA 엔티티 구조를 설명합니다.

---

## 1. Partners (파트너 회원)

### 1.1 엔티티 개요
파트너스 프로그램에 가입한 회원의 정보를 저장합니다.

**테이블명**: `le_partners`

### 1.2 필드 구조

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | String(32) | PK, NOT NULL | UUID 기반 파트너 고유 ID |
| userId | Integer | NOT NULL | 연결된 사용자 ID |
| status | Enum(Status) | NOT NULL | 파트너 상태 |
| contentLanguage | Enum(ContentLanguage) | NOT NULL | 콘텐츠 언어 |
| termsAccepted | boolean | NOT NULL | 약관 동의 여부 |
| rejectedReason | String(TEXT) | NULLABLE | 거절 사유 |
| decisionBy | String(32) | NULLABLE | 승인/거절 처리자 ID |
| utcApprovedAt | LocalDateTime | NULLABLE | 승인 시각 (UTC) |
| utcRejectedAt | LocalDateTime | NULLABLE | 거절 시각 (UTC) |
| utcRevokedAt | LocalDateTime | NULLABLE | 철회 시각 (UTC) |
| documentSubmitted | LocalDateTime | NULLABLE | 서류 제출 시각 |
| utcCreatedAt | LocalDateTime | NOT NULL, 자동생성 | 생성 시각 (UTC) |

### 1.3 Enum: Status

```java
public enum Status {
    PENDING,   // 승인 대기
    APPROVED,  // 승인됨 (활동 가능)
    REJECTED,  // 거절됨
    REVOKED    // 승인 철회됨
}
```

**DB 컬럼 타입**: `VARCHAR(20)`

### 1.4 Enum: ContentLanguage

```java
public enum ContentLanguage {
    EN,    // 영어 콘텐츠
    JP,    // 일본어 콘텐츠
    ENJP   // 영일 복합 콘텐츠
}
```

**DB 컬럼 타입**: `VARCHAR(10)`

### 1.5 제약조건

**읽기 전용 필드**
- `utcCreatedAt`: 자동 생성 후 변경 불가

**상태별 필수 필드**
- `status = APPROVED` → `utcApprovedAt` 필수
- `status = REJECTED` → `utcRejectedAt`, `rejectedReason` 필수
- `status = REVOKED` → `utcRevokedAt` 필수

### 1.6 사용 예시

**파트너 신청 생성**
```java
Partners partner = Partners.builder()
    .id(UUID.randomUUID().toString().replace("-", ""))
    .userId(1001)
    .status(Partners.Status.PENDING)
    .contentLanguage(Partners.ContentLanguage.EN)
    .termsAccepted(true)
    .documentSubmitted(LocalDateTime.now())
    .utcCreatedAt(LocalDateTime.now())
    .build();
```

---

## 2. PartnersEvent (파트너스 이벤트)

### 2.1 엔티티 개요
파트너스 추천 이벤트의 정보를 저장합니다.

**테이블명**: `le_partners_event`

### 2.2 필드 구조

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | String(32) | PK, NOT NULL | 이벤트 고유 ID |
| name | String(200) | NOT NULL | 이벤트 이름 |
| description | String(TEXT) | NULLABLE | 이벤트 설명 |
| minSubscriptionDays | Integer | NOT NULL | 최소 구독 일수 |
| utcStartDate | LocalDateTime | NOT NULL | 시작 일시 (UTC) |
| utcEndDate | LocalDateTime | NOT NULL | 종료 일시 (UTC) |
| status | Enum(Status) | NOT NULL | 이벤트 상태 |
| utcCreatedAt | LocalDateTime | NOT NULL, 자동생성 | 생성 시각 (UTC) |
| utcUpdatedAt | LocalDateTime | NOT NULL, 자동갱신 | 수정 시각 (UTC) |

### 2.3 Enum: Status

```java
public enum Status {
    ACTIVE,    // 활성 이벤트
    INACTIVE,  // 비활성 이벤트
    SYSTEM     // 상시 운영 이벤트
}
```

**DB 컬럼 타입**: `VARCHAR(20)` (EnumType.STRING)

### 2.4 비즈니스 메서드

**isActive() 메서드**
```java
public boolean isActive(LocalDateTime dateTime) {
    LocalDateTime reference = dateTime == null ? LocalDateTime.now() : dateTime;
    return (Status.ACTIVE.equals(this.status) || Status.SYSTEM.equals(this.status))
            && !reference.isBefore(this.utcStartDate)
            && !reference.isAfter(this.utcEndDate);
}
```

**활성 판정 조건**
1. 상태가 `ACTIVE` 또는 `SYSTEM`
2. 기준 시각이 `utcStartDate` 이후
3. 기준 시각이 `utcEndDate` 이전

### 2.5 사용 예시

**이벤트 생성**
```java
PartnersEvent event = PartnersEvent.builder()
    .id(UUID.randomUUID().toString().replace("-", ""))
    .name("신규 회원 추천 이벤트")
    .description("친구 추천 시 쿠폰 지급")
    .minSubscriptionDays(30)
    .utcStartDate(LocalDateTime.of(2026, 1, 1, 0, 0))
    .utcEndDate(LocalDateTime.of(2026, 12, 31, 23, 59))
    .status(PartnersEvent.Status.ACTIVE)
    .utcCreatedAt(LocalDateTime.now())
    .utcUpdatedAt(LocalDateTime.now())
    .build();
```

**활성 이벤트 조회**
```java
List<PartnersEvent> activeEvents = eventRepository.findAll().stream()
    .filter(e -> e.isActive(LocalDateTime.now()))
    .collect(Collectors.toList());
```

---

## 3. PartnersReferralHistory (추천 히스토리)

### 3.1 엔티티 개요
파트너의 회원 추천 이력을 기록합니다.

**테이블명**: `le_partners_referral_history`

### 3.2 필드 구조

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | String(32) | PK, NOT NULL | 히스토리 고유 ID |
| referralUserId | Integer | NOT NULL | 추천인 사용자 ID |
| refereeUserId | Integer | NOT NULL | 피추천인 사용자 ID |
| referralCode | String(50) | NULLABLE | 사용된 추천 코드 |
| eventId | String(32) | NULLABLE | 연관된 이벤트 ID |
| utcCreatedAt | LocalDateTime | NOT NULL, 자동생성 | 생성 시각 (UTC) |
| utcUpdatedAt | LocalDateTime | NOT NULL, 자동갱신 | 수정 시각 (UTC) |

### 3.3 Builder 패턴 지원

**Builder 사용 예시**
```java
PartnersReferralHistory history = PartnersReferralHistory.builder()
    .id(UUID.randomUUID().toString().replace("-", ""))
    .referralUserId(1001)
    .refereeUserId(2001)
    .referralCode("PARTNER101")
    .eventId("event_abc123")
    .build();
```

### 3.4 라이프사이클 콜백

**@PrePersist 동작**
```java
@PrePersist
protected void onCreate() {
    if (this.id == null) {
        this.id = UUID.randomUUID().toString().replace("-", "");
    }
    LocalDateTime now = LocalDateTime.now();
    if (this.utcCreatedAt == null) {
        this.utcCreatedAt = now;
    }
    this.utcUpdatedAt = now;
}
```

**자동 처리 항목**
- `id` 미설정 시 UUID 자동 생성
- `utcCreatedAt` 자동 설정
- `utcUpdatedAt` 자동 갱신

### 3.5 제약조건

**유니크 제약** (DB 레벨)
- `refereeUserId`는 단 한 번만 히스토리에 기록 가능 (중복 추천 방지)

**인덱스**
- `referralUserId` 인덱스 (추천인별 집계 조회)
- `referralCode` 인덱스 (코드 기반 조회)
- `eventId` 인덱스 (이벤트별 집계)

---

## 4. PartnersEventParticipation (이벤트 참여)

### 4.1 엔티티 개요
파트너가 특정 이벤트에 참여한 정보를 저장합니다.

**테이블명**: `le_partners_event_participation`

### 4.2 필드 구조

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | String(32) | PK, NOT NULL | 참여 고유 ID |
| eventId | String(32) | NOT NULL, FK | 이벤트 ID |
| partnerId | String(32) | NOT NULL, FK | 파트너 ID |
| couponTemplateIds | String(32) | NOT NULL | 쿠폰 템플릿 ID 목록 (쉼표 구분) |
| referralCode | String(50) | NOT NULL, UNIQUE | 파트너별 추천 코드 |
| utcJoinedAt | LocalDateTime | NOT NULL | 참여 시작 시각 (UTC) |
| utcCreatedAt | LocalDateTime | NOT NULL, 자동생성 | 생성 시각 (UTC) |
| utcEndAt | LocalDateTime | NULLABLE | 참여 종료 시각 (UTC) |

### 4.3 정적 메서드

**parseCouponTemplateIds() 메서드**
```java
public static List<Integer> parseCouponTemplateIds(String couponTemplateIds) {
    if (couponTemplateIds == null || couponTemplateIds.trim().isEmpty()) {
        return Collections.emptyList();
    }

    return Arrays.stream(couponTemplateIds.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .filter(s -> s.matches("\\d+")) // 숫자만 허용
            .map(Integer::valueOf)
            .collect(Collectors.toList());
}
```

**파싱 규칙**
- 쉼표(`,`)로 구분된 문자열 → List<Integer>
- 공백 자동 제거
- 숫자가 아닌 값은 무시
- null 또는 빈 문자열 → 빈 리스트 반환

**파싱 예시**
```java
parseCouponTemplateIds("101,102,103")      // [101, 102, 103]
parseCouponTemplateIds("101, 102 , 103 ")  // [101, 102, 103]
parseCouponTemplateIds("101,abc,103")      // [101, 103]
parseCouponTemplateIds(null)               // []
parseCouponTemplateIds("")                 // []
```

### 4.4 제약조건

**유니크 제약**
- `referralCode` UNIQUE (중복 추천 코드 방지)
- `(partnerId, eventId)` 복합 유니크 (동일 파트너의 이벤트 중복 참여 방지)

**외래키 제약**
- `eventId` → `le_partners_event.id`
- `partnerId` → `le_partners.id`

### 4.5 사용 예시

**이벤트 참여 생성**
```java
PartnersEventParticipation participation = PartnersEventParticipation.builder()
    .id(UUID.randomUUID().toString().replace("-", ""))
    .eventId("event_abc123")
    .partnerId("partner_101")
    .couponTemplateIds("101,102,103")
    .referralCode("PARTNER101_EVENT")
    .utcJoinedAt(LocalDateTime.now())
    .utcCreatedAt(LocalDateTime.now())
    .utcEndAt(null) // 활성 참여
    .build();
```

**활성 참여 조회**
```java
// utcEndAt이 NULL인 활성 참여만 조회
List<PartnersEventParticipation> activeParticipations =
    participationRepository.findByReferralCodeAndUtcEndAtIsNull("PARTNER101");
```

---

## 5. 엔티티 간 관계도

```
Partners (1) ─────────> (N) PartnersEventParticipation
    │                           │
    │                           └─> (1) PartnersEvent
    └──────────────────> (N) PartnersReferralHistory
                                │
                                └─> (1) PartnersEvent
```

**관계 설명**
1. **Partners ↔ PartnersEventParticipation**: 1:N
   - 한 파트너가 여러 이벤트에 참여 가능

2. **PartnersEvent ↔ PartnersEventParticipation**: 1:N
   - 한 이벤트에 여러 파트너 참여 가능

3. **Partners ↔ PartnersReferralHistory**: 1:N
   - 한 파트너가 여러 회원 추천 가능

4. **PartnersEvent ↔ PartnersReferralHistory**: 1:N
   - 한 이벤트에서 여러 추천 발생 가능

---

## 6. 인덱스 전략

### 6.1 조회 성능 최적화 인덱스

| 테이블 | 인덱스 컬럼 | 용도 |
|--------|-------------|------|
| le_partners | userId | 사용자 기반 파트너 조회 |
| le_partners | status | 상태별 파트너 집계 |
| le_partners_event | status, utcStartDate, utcEndDate | 활성 이벤트 조회 |
| le_partners_referral_history | referralUserId | 추천인별 히스토리 조회 |
| le_partners_referral_history | refereeUserId | 피추천인 중복 검증 (UNIQUE) |
| le_partners_referral_history | referralCode | 코드 기반 조회 |
| le_partners_event_participation | referralCode | 추천 코드 조회 (UNIQUE) |
| le_partners_event_participation | (partnerId, eventId) | 중복 참여 방지 (UNIQUE) |

---

## 파일 경로 인덱스
```
src/main/java/com/speaking/podo/applications/partners/domain/
├── Partners.java
├── PartnersEvent.java
├── PartnersReferralHistory.java
└── PartnersEventParticipation.java
```

## 관련 문서
- [파트너스 도메인 개요](./README.md)
- [파트너스 도메인 정책](./policies.md)
