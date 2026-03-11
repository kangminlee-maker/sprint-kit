---
domain: ticket
title: "수강권 도메인 엔티티"
version: 1.0.0
last_updated: 2026-01-26
context_for: RAG
chunk_size: 500-800
source_files:
  - src/main/java/com/speaking/podo/applications/ticket/domain/Ticket.java
  - src/main/java/com/speaking/podo/applications/ticket/dto/response/TicketDto.java
  - src/main/java/com/speaking/podo/applications/ticket/service/TicketServiceV2Impl.java
---

# 수강권 도메인 엔티티 (Ticket Entities)

## 컨텍스트
이 문서는 수강권 도메인의 데이터베이스 엔티티 구조를 설명합니다.

---

## 1. Ticket (수강권)

### 테이블 정보
- **테이블명**: `GT_CLASS_TICKET`
- **설명**: 사용자의 수강권 정보

### 상수
```java
public static final long ClassTimePerOneTicket = 25L;  // 1회 수업 = 25분
```

### 필드 상세 - 기본 정보

| 컬럼명 | 필드명 | 타입 | 설명 | 예시 |
|--------|--------|------|------|------|
| ID | id | String(32) | PK, 수강권 고유 ID | MD5 해시 |
| USER_ID | studentId | Integer | 학생(사용자) ID | 12345 |
| TUTOR_ID | tutorId | Integer | 튜터 ID (0: 미지정) | 0 |
| SUBSCRIBE_MAPP_ID | subscribeMappId | String(32) | 구독 매핑 ID (FK) | |
| PAYMENT_ID | paymentId | Integer | 결제 ID | |

### 필드 상세 - 수강권 유형

| 컬럼명 | 필드명 | 타입 | 설명 | 예시 값 |
|--------|--------|------|------|---------|
| TICKET_TYPE | type | String(50) | 티켓 타입 | "N" |
| EVENT_TYPE | eventType | String(100) | 이벤트 타입 (핵심!) | "UNLIMIT", "COUNT", "PODO_TRIAL" |
| APPLY_TYPE | applyType | String(50) | 적용 타입 | |
| LANG_TYPE | langType | String(50) | 언어 타입 | "EN", "JP" |
| CURRICULUM_TYPE | curriculumType | String(50) | 커리큘럼 타입 | "BASIC", "BUSINESS", "SMART_TALK" |
| CLASS_TYPE | classType | String(50) | 수업 타입 | "PODO" |

### 필드 상세 - 횟수 관리

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| ORIGIN_COUNT | originCount | Integer | 원래 발급 횟수 |
| PURCHASED_COUNT | nPurchased | Integer | 구매 횟수 (현재 총 횟수) |
| USED_COUNT | nUsed | Integer | 사용 횟수 |
| DESTROY_COUNT | destroyCount | Integer | 소멸 횟수 |
| REFUND_COUNT | refundCount | Integer | 환불 횟수 |

> **잔여 횟수**: `nPurchased - nUsed`

### 필드 상세 - 기간 관리

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| TICKET_START_DATE | startDate | LocalDate | 수강권 시작일 |
| TICKET_EXPIRE_DATE | expireDate | LocalDate | 수강권 만료일 |
| CREATE_DATETIME | createDatetime | LocalDateTime | 생성일시 |
| UPDATE_DATETIME | updateDatetime | LocalDateTime | 수정일시 |

### 필드 상세 - 가격/수업 정보

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| PURCHASED_PRICE | purchasedPrice | Integer | 구매 가격 |
| CLASS_PRICE_PER_HOUR | classPricePerHour | Integer | 시간당 수업료 |
| PURCHASED_MIN | purchasedMin | Integer | 구매 분 (레거시) |
| USED_MIN | usedMin | Integer | 사용 분 (레거시) |
| CLASS_MINUTE | classMinute | String(10) | 수업 시간 (분) |
| LESSON_TIME | lessonTime | Integer | 수업 시간 |
| REVENUE_PER_CLASS | revenuePerClass | String(10) | 수업당 수익 |

### 필드 상세 - 기타

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| REASON | reason | String(200) | 발급 사유 |
| GOODS_NAME | goodsName | String(50) | 상품명 |
| IS_CERT | isCert | boolean | 인증서 발급 여부 |

---

## 2. eventType 상세 (핵심)

### 타입 정의
> **주의**: `eventType`은 Enum이 아닌 **String** 필드입니다.

| 값 | 의미 | 발급 조건 | 특성 |
|----|------|----------|------|
| `UNLIMIT` | 무제한 수강권 | `lessonCountPerMonth == 999` | 기간 내 무제한 사용 |
| `COUNT` | 회차 수강권 | `lessonCountPerMonth != 999` | 횟수 차감 |
| `PODO_TRIAL` | 체험 수강권 | 체험 신청 시 | 1회, 단기간 |

### eventType 결정 코드
```java
// 일반 수강권 (TicketServiceV2Impl.java:280)
.eventType(subscribeDTO.getLessonCountPerMonth() == 999 ? "UNLIMIT" : "COUNT")

// 체험 수강권 (TicketServiceV2Impl.java:329)
.eventType("PODO_TRIAL")
```

---

## 3. 수강권 발급 빌더 패턴

### 일반 수강권 발급
```java
Ticket ticket = Ticket.builder()
    .id(UuidGenerator.generateMD5FromUUID())
    .studentId(studentId)
    .tutorId(0)
    .type("N")
    .originCount(purchasedCount)
    .nPurchased(purchasedCount)
    .nUsed(0)
    .destroyCount(0)
    .refundCount(0)
    .purchasedPrice(purchasedPrice)
    .classPricePerHour(0)
    .purchasedMin(0)
    .usedMin(0)
    .startDate(startDate)
    .expireDate(nextPaymentDate)
    .createDatetime(nowTime)
    .classMinute("25")
    .revenuePerClass("0")
    .paymentId(paymentId)
    .langType(langType)              // EN 또는 JP
    .classType("PODO")
    .curriculumType(subscribeDTO.getCurriculumType())
    .eventType(/* UNLIMIT 또는 COUNT */)
    .reason(subscribeDTO.getSubName())
    .subscribeMappId(subscribeMappId)
    .goodsName(subscribeDTO.getSubName())
    .lessonTime(subscribeDTO.getLessonTime())
    .isCert(false)
    .build();
```

### 체험 수강권 발급
```java
Ticket ticket = Ticket.builder()
    .id(UuidGenerator.generateMD5FromUUID())
    .studentId(studentId)
    .tutorId(0)
    .type("N")
    .originCount(1)      // 체험권은 1회
    .nPurchased(1)
    .nUsed(0)
    .destroyCount(0)
    .refundCount(0)
    .purchasedPrice(subscribeDTO.getSubPrice())
    .classPricePerHour(0)
    .purchasedMin(0)
    .usedMin(0)
    .startDate(now.toLocalDate())
    .expireDate(now.toLocalDate().plusDays(giveDays))
    .createDatetime(now)
    .classMinute("25")
    .revenuePerClass("0")
    .paymentId(paymentId)
    .langType(subscribeDTO.getLangType())
    .classType("PODO")
    .eventType("PODO_TRIAL")         // 체험권 고정
    .curriculumType(subscribeDTO.getCurriculumType())
    .reason(subscribeDTO.getSubName())
    .subscribeMappId(subscribeMappId)
    .goodsName(subscribeDTO.getSubName())
    .lessonTime(subscribeDTO.getLessonTime())
    .isCert(false)
    .build();
```

---

## 4. 엔티티 관계도

```
SubscribeMapp (구독)
    │
    └──── Ticket (수강권)
              │
              ├── eventType: UNLIMIT / COUNT / PODO_TRIAL
              │
              ├── langType: EN / JP
              │
              └── curriculumType: BASIC / BUSINESS / SMART_TALK
                          │
                          └──── Schedule (수업 예약) [schedule 도메인]
```

---

## 5. 주요 조회 쿼리 패턴

### 활성 수강권 조회
```java
// 학생 + 언어 + 날짜 기준 활성 수강권
findActivePodoTicket(studentId, langType, kstStdDate)
    .stream()
    .filter(t -> t.getNPurchased() - t.getNUsed() > 0)
```

### 구독별 수강권 조회
```java
// 구독 매핑 ID로 수강권 목록
getSubscribedTickets(subscribeMappId)
```

### 체험권 조회
```java
// 학생의 체험권만 필터
getTickets(studentId, "PODO", null)
    .stream()
    .filter(dto -> dto.getEventType().equals("PODO_TRIAL"))
```

---

## 6. 관련 Repository

| Repository | 설명 | 파일 경로 |
|------------|------|----------|
| TicketRepository | JPA Repository | `ticket/repository/TicketRepository.java` |
| TicketDslRepository | QueryDSL Repository | `ticket/repository/TicketDslRepository.java` |
| TicketDslRepositoryImpl | QueryDSL 구현체 | `ticket/repository/TicketDslRepositoryImpl.java` |

---

## 7. 관련 DTO

### TicketDto
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String | 수강권 ID |
| studentId | Integer | 학생 ID |
| langType | String | 언어 |
| eventType | String | 이벤트 타입 |
| curriculumType | String | 커리큘럼 |
| nPurchased | Integer | 구매 횟수 |
| nUsed | Integer | 사용 횟수 |
| startDate | LocalDate | 시작일 |
| expireDate | LocalDate | 만료일 |
| lessonTime | Integer | 수업 시간 |
| remainCountNum | Long | 잔여 횟수 (계산) |
