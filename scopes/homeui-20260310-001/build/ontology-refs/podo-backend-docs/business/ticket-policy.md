---
domain: business
type: policy
related_files:
  - src/main/java/com/speaking/podo/applications/ticket/service/TicketServiceV2Impl.java
  - src/main/java/com/speaking/podo/applications/ticket/domain/Ticket.java
keywords: [수강권, 티켓, 우선순위, 만료, 회차]
last_verified: 2026-01-26
---

# 수강권 정책

## 개요
PODO의 수강권(Ticket)은 학생이 수업을 예약하고 수강할 수 있는 권한을 나타냅니다.

## 수강권 타입

### 1. COUNT (회차권)
- **설명**: 정해진 횟수만큼 수업 가능
- **생성**: 구독 시 `lessonCountPerMonth` 기반으로 생성
- **소진**: 수업 1회 수강 시 `nUsed` +1
- **만료**: `expireDate` 도래 시 사용 불가

**예시**:
```
월 8회 구독 (EN+JP)
→ EN 티켓: nPurchased = 4
→ JP 티켓: nPurchased = 4
```

---

### 2. UNLIMIT (무제한권)
- **설명**: 기간 내 무제한 수업 가능
- **생성**: 구독 시 `nPurchased` = 999로 생성
- **소진**: 수업 1회 수강 시 `nUsed` +1 (하지만 999 이하로는 안 떨어짐)
- **만료**: `expireDate` 도래 시 사용 불가

**예시**:
```
무제한 구독 (EN)
→ EN 티켓: nPurchased = 999
→ 한 달에 100회 수업해도 OK
```

---

### 3. PODO_TRIAL (체험권)
- **설명**: 1회 무료 체험
- **생성**: 회원가입 시 또는 이벤트로 생성
- **소진**: 체험 수업 1회 후 사용 불가
- **만료**: 가입일로부터 N일 (기본 7일)

**예시**:
```
회원가입 시
→ EN 체험권: nPurchased = 1, expireDate = 가입일+7일
```

---

### 4. BONUS (보너스 수강권)
- **설명**: 이벤트/프로모션으로 무료 제공
- **생성**: 구독 해지 방지, 재가입 유도 등
- **소진**: 일반 수강권과 동일
- **회수**: 구독 해지 시 미래 보너스 수강권은 자동 회수

**예시**:
```
구독 3개월 유지 이벤트
→ 보너스 4회권 지급
→ 구독 해지 시 남은 보너스 회수
```

---

## 수강권 생성 규칙

### 정기 구독 시 생성
**비즈니스 규칙**:
- 구독 1개당 언어별로 Ticket 생성
- 다언어 구독(ENJP) → 2개 티켓 (EN 1개 + JP 1개)
- 회차권: `nPurchased` = lessonCountPerMonth / 언어 개수
- 무제한: `nPurchased` = 999

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/ticket/service/TicketServiceV2Impl.java`

**코드 위치**: TicketServiceV2Impl.java:244-297

**예시 코드**:
```java
// EN+JP 월 8회 구독
int purchasedCount = 8 / 2; // 4회

for(String langType : ["EN", "JP"]) {
    Ticket ticket = Ticket.builder()
        .nPurchased(4)       // EN: 4회, JP: 4회
        .nUsed(0)
        .langType(langType)
        .eventType("COUNT")
        .build();
}
```

---

### 일시불 구독 시 생성
**비즈니스 규칙**:
- 첫 달 Ticket만 즉시 생성
- 나머지 Ticket은 매월 자동 생성

**코드 위치**: TicketServiceV2Impl.java:300-302

---

### 체험권 생성
**비즈니스 규칙**:
- `nPurchased` = 1
- `eventType` = "PODO_TRIAL"
- `expireDate` = startDate + giveDays (기본 7일)

**코드 위置**: TicketServiceV2Impl.java:305-341

**예시 코드**:
```java
Ticket ticket = Ticket.builder()
    .nPurchased(1)
    .nUsed(0)
    .eventType("PODO_TRIAL")
    .expireDate(now.plusDays(7))
    .build();
```

---

## 수강권 사용 규칙

### 수강권 우선순위
**비즈니스 규칙**:
1. **UNLIMIT / COUNT** (정기권, 일시불)
2. **PODO_TRIAL** (체험권)
3. **기타** (보너스, 정기권 등)

**코드 위치**: TicketServiceV2Impl.java:378-388

**예시**:
```
학생이 3개의 활성 티켓 보유:
1. EN 무제한권 (UNLIMIT)
2. EN 체험권 (PODO_TRIAL)
3. EN 보너스권 (BONUS)

→ 수업 예약 시 1번 무제한권 우선 사용
```

---

### 활성 티켓 조회
**비즈니스 규칙**:
- `expireDate` >= 오늘
- `nPurchased - nUsed` > 0
- 우선순위에 따라 정렬 후 첫 번째 반환

**코드 위置**: TicketServiceV2Impl.java:122-169

**예시 코드**:
```java
Ticket activeTicket = ticketRepository.findActivePodoTicket(
    studentId, langType, kstStdDate
)
.stream()
.filter(t -> t.getNPurchased() - t.getNUsed() > 0)  // 잔여 횟수 확인
.min((t1, t2) -> Integer.compare(
    getEventTypeOrder(t1.getEventType()),
    getEventTypeOrder(t2.getEventType())
))  // 우선순위 정렬
.orElseThrow();
```

---

### 커리큘럼별 필터링
**비즈니스 규칙**:
- **BASIC**: BASIC 또는 BUSINESS 티켓 사용 가능
- **BUSINESS**: BUSINESS 티켓만 사용 가능
- **SMART_TALK**: SMART_TALK 티켓만 사용 가능
- **FREE_TALKING**: BASIC 또는 BUSINESS 티켓 사용 가능

**코드 위置**: TicketServiceV2Impl.java:138-158

---

## 수강권 소진 규칙

### 수업 완료 시
**비즈니스 규칙**:
- `nUsed` += 1
- `usedMin` += 수업 시간 (분)

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/lecture/service/command/LectureCommandServiceImpl.java`

---

### 수업 취소 시
**비즈니스 규칙**:
- 수업 시작 2시간 전 취소: `nUsed` 변동 없음 (복구)
- 수업 시작 2시간 이내 취소: `nUsed` += 1 (소진됨)
- 무제한권(UNLIMIT)의 경우: 72시간 예약 금지 패널티

**소스 코드**: `PodoScheduleServiceImplV2.java:1195` - `if (between < 120)`

---

### 노쇼 시
**비즈니스 규칙**:
- `nUsed` += 1 (소진됨)
- 패널티 부과 (별도 정책)

---

## 수강권 만료 규칙

### 만료 조건
**비즈니스 규칙**:
- `expireDate` < 오늘
- 또는 구독 해지 시

**코드 위치**: TicketServiceV2Impl.java:188-195

---

### 만료 시 처리
**비즈니스 규칙**:
- 더 이상 수업 예약 불가
- 잔여 횟수는 소멸 (환불 없음)
- 예외: 보너스 수강권은 회수 가능

---

### 만료일 연장
**비즈니스 규칙**:
- 정기 구독 갱신 시: `expireDate` += 1개월
- 연장 구독 시: `expireDate` = 기존 만료일 + 1개월

**코드 위置**: TicketServiceV2Impl.java:188-195

---

## 보너스 수강권 회수 규칙

### 회수 조건
**비즈니스 규칙**:
- 구독 해지 시
- 보너스 수강권의 startDate > 구독 해지일

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/subscribe/usecase/SubscribeMappServiceImpl.java`

**코드 위置**: SubscribeMappServiceImpl.java:984-1000

---

### 회수 방법
**비즈니스 규칙**:
- `startDate` -= (startDate - 해지일)
- `expireDate` -= (startDate - 해지일)

**예시**:
```
구독 해지일: 2026-02-01
보너스 수강권 startDate: 2026-03-01
→ 차이: 28일
→ 회수 후 startDate: 2026-02-01 (28일 앞당김)
→ 회수 후 expireDate: 2026-02-28 (28일 앞당김)
```

---

## 수강권 조회 규칙

### 마이페이지 조회
**비즈니스 규칙**:
- 활성 수강권 (expireDate >= 오늘)
- 사용 종료 수강권 (expireDate < 오늘)
- 상태별 정렬:
  1. 사용중
  2. 홀딩중
  3. 종료예정
  4. 보너스
  5. 사용종료

**코드 위치**: TicketServiceV2Impl.java:56-67

---

### 수업 예약 시 조회
**비즈니스 규칙**:
- 언어 타입 일치
- 커리큘럼 타입 일치
- 활성 상태
- 우선순위 높은 순

**코드 위置**: TicketServiceV2Impl.java:122-169

---

## 예외 처리

### 활성 티켓 없음
**에러 코드**: `TicketNotFound`
**처리**:
- 수업 예약 불가
- 사용자에게 구독 안내

**코드 위置**: TicketServiceV2Impl.java:128-131

---

### 잔여 횟수 0
**처리**:
- 다음 우선순위 티켓 조회
- 모든 티켓 소진 시 예약 불가

---

### 만료일 지남
**처리**:
- 해당 티켓 필터링
- 다른 활성 티켓 조회

---

## 관련 도메인

### 구독 관리
- [구독 플로우](./subscription-flow.md)

### 수업 예약
- [수업 플로우](./lecture-flow.md)

---

## 주요 메서드 요약

| 메서드 | 설명 | 파일 라인 |
|--------|------|-----------|
| `addTicket()` | 수강권 생성 | TicketServiceV2Impl.java:244 |
| `addTrialTicket()` | 체험권 생성 | TicketServiceV2Impl.java:305 |
| `getActiveTicket()` | 활성 수강권 조회 | TicketServiceV2Impl.java:122 |
| `updateUsedCount()` | 사용 횟수 업데이트 | TicketServiceV2Impl.java:116 |
| `updateExpireDate()` | 만료일 연장 | TicketServiceV2Impl.java:188 |
| `editBonusTicketDate()` | 보너스 수강권 회수 | TicketServiceV2Impl.java:102 |

---

**최종 업데이트**: 2026-01-26
