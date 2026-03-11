---
domain: ticket
title: "수강권 도메인 개요"
version: 1.0.0
last_updated: 2026-01-26
context_for: RAG
file_index:
  - entities.md
  - policies.md
related_domains:
  - subscription
  - schedule
  - lecture
---

# 수강권 도메인 (Ticket Domain)

## 컨텍스트
이 문서는 포도(PODO) 서비스의 **수강권 시스템**을 설명합니다. 수강권은 사용자가 **수업을 예약하고 이용할 수 있는 권한**을 나타내며, 구독 결제 시 자동으로 발급됩니다.

---

## 도메인 목적
- 사용자별 수강권 발급 및 관리
- 수업 예약 시 수강권 차감
- 수강권 유효기간 관리
- 수강권 유형별 사용 규칙 적용

---

## 핵심 개념 요약

### 1. 수강권 유형 (eventType)
> **중요**: `eventType`은 String 필드이며, Enum이 아닙니다.

| eventType 값 | 설명 | 발급 조건 |
|--------------|------|----------|
| `UNLIMIT` | 무제한 수강권 | `lessonCountPerMonth == 999` |
| `COUNT` | 회차 수강권 | `lessonCountPerMonth != 999` |
| `PODO_TRIAL` | 체험 수강권 | 체험 구독 신청 시 |

### 2. 수강권 주요 속성

| 속성 | 설명 |
|------|------|
| `studentId` | 학생(사용자) ID |
| `langType` | 언어 (EN, JP) |
| `curriculumType` | 커리큘럼 (BASIC, BUSINESS, SMART_TALK) |
| `nPurchased` | 구매한 수업 횟수 |
| `nUsed` | 사용한 수업 횟수 |
| `startDate` | 수강권 시작일 |
| `expireDate` | 수강권 만료일 |
| `lessonTime` | 수업 시간 (기본 25분) |

### 3. 수강권 상태 계산
```
남은 횟수 = nPurchased - nUsed
유효 여부 = 남은 횟수 > 0 AND 현재일 <= expireDate
```

---

## 주요 비즈니스 규칙

### 수강권 발급
1. **구독 결제 시** → 수강권 자동 발급
2. **ENJP 구독** → EN, JP 수강권 각각 발급 (횟수 균등 분배)
3. **체험 신청 시** → PODO_TRIAL 수강권 발급

### 수강권 사용 우선순위
수업 예약 시 다음 순서로 수강권 선택:
1. `UNLIMIT` 또는 `COUNT` (정규 수강권)
2. `PODO_TRIAL` (체험 수강권)
3. 기타 보상권

### 수강권-커리큘럼 매칭
| 수업 유형 | 사용 가능한 커리큘럼 |
|----------|---------------------|
| 일반 회화 | BASIC |
| 비즈니스 회화 | BUSINESS |
| 스마트톡 | SMART_TALK |
| 프리토킹 | BASIC, BUSINESS |

---

## 관련 엔티티 파일
| 엔티티 | 파일 경로 |
|--------|----------|
| Ticket | `src/main/java/.../ticket/domain/Ticket.java` |
| TicketDto | `src/main/java/.../ticket/dto/response/TicketDto.java` |
| TicketService | `src/main/java/.../ticket/service/TicketServiceV2Impl.java` |

---

## 연관 도메인
- **Subscription (구독)**: 구독에서 수강권이 발급됨
- **Schedule (스케줄)**: 수업 예약 시 수강권 차감
- **Lecture (수업)**: 수업 완료 시 수강권 사용 처리
