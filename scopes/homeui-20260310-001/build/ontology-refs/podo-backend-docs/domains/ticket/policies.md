---
domain: ticket
title: "수강권 도메인 정책"
version: 1.0.0
last_updated: 2026-01-26
context_for: RAG
chunk_size: 500-800
---

# 수강권 도메인 정책 (Ticket Policies)

## 컨텍스트
이 문서는 수강권 도메인의 비즈니스 정책을 상세히 기술합니다.

---

## 1. eventType 정책 (핵심)

### 정의
> **중요**: `eventType`은 **String 타입** 필드입니다. Enum이 아닙니다.

### eventType 값과 발급 조건

| eventType | 설명 | 발급 조건 | 사용 규칙 |
|-----------|------|----------|----------|
| `UNLIMIT` | 무제한 수강권 | `lessonCountPerMonth == 999` | 기간 내 무제한 사용 |
| `COUNT` | 회차 수강권 | `lessonCountPerMonth != 999` | 횟수 차감 방식 |
| `PODO_TRIAL` | 체험 수강권 | 체험 구독 신청 | 1회 사용, 체험 전용 |

### eventType 결정 로직 (코드 기반)
```java
// TicketServiceV2Impl.java:280
eventType = subscribeDTO.getLessonCountPerMonth() == 999
    ? "UNLIMIT"
    : "COUNT"

// 체험 수강권 발급 시
// TicketServiceV2Impl.java:329
eventType = "PODO_TRIAL"
```

---

## 2. 수강권 발급 정책

### 정규 수강권 발급 (COUNT/UNLIMIT)
1. 구독 결제 완료 시 `addTicket()` 메서드 호출
2. `lessonCountPerMonth` 값으로 eventType 결정
3. ENJP 구독의 경우 언어별로 수강권 분리 발급

### ENJP 수강권 분배 규칙
```java
// ENJP일 경우 언어별로 횟수 분배
purchasedCount = lessonCountPerMonth / LangUtils.separateLanguage(langType).size();

// 예: 월 8회 ENJP → EN 4회, JP 4회
// 예: 무제한(999) ENJP → EN 999(무제한), JP 999(무제한)
```

### 체험 수강권 발급 (PODO_TRIAL)
```java
// 체험 수강권 고정 값
originCount = 1
nPurchased = 1
nUsed = 0
eventType = "PODO_TRIAL"
expireDate = 현재일 + giveDays (보통 7~14일)
```

---

## 3. 수강권 사용 우선순위 정책

### 우선순위 규칙
수업 예약 시 여러 수강권이 있으면 다음 순서로 선택합니다.

| 순위 | eventType | 설명 |
|------|-----------|------|
| 1 | `UNLIMIT`, `COUNT` | 정규 수강권 먼저 사용 |
| 2 | `PODO_TRIAL` | 체험권은 그 다음 |
| 3 | 기타 | 보상권 등 |

### 우선순위 결정 로직
```java
// TicketServiceV2Impl.java:378-388
private int getEventTypeOrder(String eventType) {
    switch (eventType) {
        case "UNLIMIT":
        case "COUNT":
            return 1;  // 최우선
        case "PODO_TRIAL":
            return 2;  // 두 번째
        default:
            return 3;  // 기타
    }
}
```

---

## 4. 수강권 필터링 정책

### 커리큘럼별 필터링
수업 예약 시 커리큘럼에 맞는 수강권만 사용 가능합니다.

| 수업 상황 | 필터 조건 |
|----------|----------|
| 비즈니스 수업 | `curriculumType == "BUSINESS"` |
| 스마트톡 수업 | `curriculumType == "SMART_TALK"` |
| 일반 수업 | `curriculumType == "BASIC"` |
| 프리토킹 | `curriculumType in ("BASIC", "BUSINESS")` |

### 체험 수업 필터링
```java
// 체험 수업의 경우
if (isTrial) {
    activeTickets = activeTickets.stream()
        .filter(t -> "PODO_TRIAL".equals(t.getEventType()))
        .collect(Collectors.toList());
}
```

---

## 5. 수강권 유효성 정책

### 유효 수강권 조건
```
유효 = (nPurchased - nUsed > 0) AND (현재일 <= expireDate)
```

### 잔여 횟수 계산
```java
remainCount = nPurchased - nUsed
```

### 만료 처리
- 만료일(expireDate) 초과 시 수강권 비활성화
- 구독 해지 시 `unsubscribeTickets()` 호출

---

## 6. 수강권 차감 정책

### 차감 시점
- 수업 예약 확정 시 `nUsed` 증가
- 수업 취소 시 `nUsed` 감소 (복구)

### 차감 로직
```java
// 사용 횟수 업데이트
updateUsedCount(ticketId, newUsedCount);
```

### 무제한 수강권 차감
- `UNLIMIT` 수강권도 사용 기록은 남음
- 단, 잔여 횟수 검증 없이 사용 가능

---

## 7. 연장/재발급 정책

### 구독 연장 시
```java
// 기존 수강권 만료일 연장
reExtendTicket(subscribeMappId);
```

### 구독 갱신 시
- 새로운 결제 주기에 대한 신규 수강권 발급
- 기존 미사용 수강권은 유지

---

## 8. 보너스/보상 수강권 정책

### 보너스 티켓 날짜 조정
```java
// 보너스 티켓 유효기간 조정
editBonusTicketDate(ids, subtractDays);
```

### 보상권 특성
- 운영팀 수동 발급
- 별도 eventType 없음 (기존 타입 사용)
- 구독 매핑과 별개로 관리 가능

---

## 9. 체험권 특별 정책

### 체험권 취소
```java
// 학생ID + 언어로 취소
cancelTrialTicket(studentId, langType);

// 티켓ID로 취소
cancelTrialTicket(ticketId);

// 구독매핑ID로 취소
cancelTrialTicketBySubMappId(subMappId);
```

### 체험권 제외 조건
- 잔여 횟수 0인 체험권은 목록에서 제외
```java
if("PODO_TRIAL".equals(ticket.getEventType()) && ticket.getRemainCountNum() == 0) {
    continue;
}
```

---

## 10. 수업 시간 정책

### 기본 수업 시간
```java
public static final long ClassTimePerOneTicket = 25L;  // 25분
```

### lessonTime 필드
- 구독 상품의 `lessonTime` 값을 상속
- 기본값: 25분
- 확장 가능: 50분 수업 등

---

## 11. 인증서 발급 정책

### 인증서 플래그
```java
// 수강 인증서 발급 여부
isCert: boolean (기본값: false)

// 인증서 발급
updateCertificate(ticketId);
```
