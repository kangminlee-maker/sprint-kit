---
domain: subscription
title: "구독 도메인 엔티티"
version: 1.0.0
last_updated: 2026-01-26
context_for: RAG
chunk_size: 500-800
source_files:
  - src/main/java/com/speaking/podo/applications/subscribe/domain/Subscribe.java
  - src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeMapp.java
  - src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeItem.java
  - src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeItemMapp.java
  - src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeMappHistory.java
  - src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeOrigin.java
---

# 구독 도메인 엔티티 (Subscription Entities)

## 컨텍스트
이 문서는 구독 도메인의 데이터베이스 엔티티 구조를 설명합니다.

---

## 1. Subscribe (구독 상품)

### 테이블 정보
- **테이블명**: `GT_SUBSCRIBE`
- **설명**: 판매 가능한 구독 상품 정의

### 필드 상세

| 컬럼명 | 필드명 | 타입 | 설명 | 예시 |
|--------|--------|------|------|------|
| ID | id | String(32) | PK, 상품 고유 ID | MD5 해시 |
| SUB_TYPE | subType | String(50) | 구독 유형 | (미사용) |
| CLASS_TYPE | classType | String(50) | 수업 유형 | PODO |
| LANG_TYPE | langType | String(50) | 언어 유형 | EN, JP, ENJP |
| PAYMENT_TYPE | paymentType | String(50) | 결제 유형 | SUBSCRIBE, LUMP_SUM |
| SUB_NAME | subName | String(100) | 상품명 | "영어 정기권 8회" |
| LESSON_MONTH | lessonMonth | Integer | 결제 주기(월) | 1, 3, 6, 12 |
| LESSON_COUNT_PER_MONTH | lessonCountPerMonth | Integer | 월 수업 횟수 | 4, 8, 999 |
| LESSON_TIME | lessonTime | Integer | 수업 시간(분) | 25 |
| CURRICULUM_TYPE | curriculumType | String | 커리큘럼 유형 | BASIC, BUSINESS |
| ORIGIN_PRICE | originPrice | Integer | 정가 | 100000 |
| SUB_PRICE | subPrice | Integer | 판매가 | 80000 |
| DISCOUNT_RATE | discountRate | Integer | 할인율(%) | 20 |
| USE_YN | useYn | String(2) | 사용 여부 | Y, N |
| START_AT | startAt | LocalDateTime | 판매 시작일 | |
| END_AT | endAt | LocalDateTime | 판매 종료일 | |
| STATUS | status | String(50) | 상품 상태 | READY, ACTIVE |
| FREE_TRIAL | freeTrial | Integer | 무료 체험일 | 7 |
| SCHEME_ID | schemeId | String(50) | 스킴 ID | |
| PROMOTION_TYPE | promotionType | String | 프로모션 유형 | |
| DESCRIPTION | description | TEXT | 상품 설명 (JSON) | |
| EVENT_DESCRIPTION | eventDescription | TEXT | 이벤트 설명 (JSON) | |

---

## 2. SubscribeMapp (사용자 구독)

### 테이블 정보
- **테이블명**: `GT_SUBSCRIBE_MAPP`
- **설명**: 사용자별 구독 신청 정보

### 필드 상세

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| ID | id | String(32) | PK |
| USER_ID | userId | Integer | 사용자 ID (FK) |
| SUBSCRIBE_ID | subscribeId | String(32) | 구독 상품 ID (FK) |
| CARD_ID | cardId | String(32) | 결제 카드 ID |
| PAYMENT_ID | paymentId | Integer | 결제 ID |
| MERCHANT_UID | merchantUid | String(1000) | 결제 고유 번호 |
| START_DATE | startDate | LocalDate | 구독 시작일 |
| END_DATE | endDate | LocalDate | 구독 종료일 |
| NEXT_PAYMENT_DATE | nextPaymentDate | LocalDate | 다음 결제 예정일 |
| FINAL_DATE | finalDate | LocalDate | 최종 이용일 |
| CANCEL_AT | cancelAt | LocalDateTime | 해지 요청일 |
| RETRY_PAYMENT_DATE | retryPaymentDate | LocalDate | 재결제 시도일 |
| SUBSCRIBE_YN | subscribeYn | String(2) | 구독 활성 여부 (Y/N) |
| PAYMENT_COUNT | paymentCount | Integer | 결제 완료 횟수 |
| FAIL_COUNT | failCount | Integer | 결제 실패 횟수 |
| STATUS | status | String(50) | 구독 상태 |
| MEMO | memo | String(200) | 메모 |
| DEL_YN | delYn | String(50) | 삭제 여부 |

### 상수
- `ClassTimePerOneTicket = 25L`: 1회 수업 시간 (분)

---

## 3. SubscribeItem (구독 아이템)

### 테이블 정보
- **테이블명**: `GT_SUBSCRIBE_ITEM`
- **설명**: 구독에 포함된 개별 아이템 (교재, 동영상 등)

### 필드 상세

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| ID | id | int | PK |
| ITEM_NAME | itemName | String | 아이템명 |
| ITEM_TYPE | itemType | String | 아이템 유형 |
| TAX_YN | taxYn | String | 과세 여부 |
| TOTAL_PRICE | totalPrice | int | 총 가격 |
| SUPPLY_PRICE | supplyPrice | int | 공급가 |
| TAX_PRICE | taxPrice | int | 세금 |
| USE_YN | useYn | String | 사용 여부 |

---

## 4. SubscribeItemMapp (구독-아이템 매핑)

### 테이블 정보
- **테이블명**: `GT_SUBSCRIBE_ITEM_MAPP`
- **설명**: 구독 상품과 아이템 간 N:M 관계

### 필드 상세

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| ID | id | int | PK |
| SUBSCRIBE_ID | subscribeId | String | 구독 상품 ID (FK) |
| ITEM_ID | itemId | int | 아이템 ID (FK) |

---

## 5. SubscribeMappHistory (구독 이력)

### 테이블 정보
- **테이블명**: `le_subscribe_mapp_history`
- **설명**: 구독 상태 변경 이력 기록

### 필드 상세

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| id | id | Integer | PK (AUTO_INCREMENT) |
| user_id | userId | Integer | 사용자 ID |
| subscribe_mapp_id | subscribeMappId | String(32) | 구독 매핑 ID |
| type | type | Enum | 이벤트 유형 |
| content | content | TEXT | 이벤트 상세 내용 (JSON) |
| utc_created_at | utcCreatedAt | LocalDate | 생성일시 (UTC) |

### SubscriptionType Enum
```java
public enum SubscriptionType {
    CANCEL,              // 해지
    SUBSCRIBE,           // 구독
    HOLD,                // 일시 중지
    EXTEND,              // 연장
    RE_EXTEND,           // 재연장
    CHANGE_EXTEND,       // 연장 변경
    EXTEND_SCHEDULE,     // 연장 예약
    RE_EXTEND_SCHEDULE,  // 재연장 예약
    CHANGE_EXTEND_SCHEDULE  // 연장 예약 변경
}
```

---

## 6. SubscribeOrigin (원본 구독 정보)

### 테이블 정보
- **테이블명**: `le_subscribe_origin`
- **설명**: 구독 상품 원본 정보 (기준 가격 등)

### 필드 상세

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| id | id | String(100) | PK |
| lang_type | langType | String(32) | 언어 유형 |
| curriculum_type | curriculumType | String(32) | 커리큘럼 유형 |
| payment_type | paymentType | String(32) | 결제 유형 |
| lesson_count_per_month | lessonCountPerMonth | Integer | 월 수업 횟수 |
| lesson_time | lessonTime | Integer | 수업 시간 |
| price | price | Integer | 기준 가격 |
| start_at | startAt | LocalDateTime | 적용 시작일 |
| end_at | endAt | LocalDateTime | 적용 종료일 |
| status | status | String(32) | 상태 (기본: READY) |
| use_yn | useYn | String(2) | 사용 여부 (기본: N) |
| created_at | createdAt | LocalDateTime | 생성일시 |
| updated_at | updatedAt | LocalDateTime | 수정일시 |

---

## 엔티티 관계도

```
Subscribe (구독 상품)
    │
    ├─── SubscribeItemMapp ───→ SubscribeItem (아이템)
    │
    └─── SubscribeMapp (사용자 구독)
              │
              └─── SubscribeMappHistory (이력)
              │
              └─── Ticket (수강권) [ticket 도메인]
```

---

## 관련 Enum/상수 파일

| 파일 | 경로 |
|------|------|
| LangType | `applications/podo/schedule/domain/enums/LangType.java` |
| CurriculumType | `applications/lecture/constant/CurriculumType.java` |
| PaymentType | `applications/payment/constant/PaymentType.java` |
