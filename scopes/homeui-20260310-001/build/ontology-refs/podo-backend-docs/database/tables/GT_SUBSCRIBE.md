---
title: GT_SUBSCRIBE 테이블
domain: database
table: GT_SUBSCRIBE
entity: Subscribe.java
created: 2026-01-26
---

# GT_SUBSCRIBE 테이블

## 개요
**테이블명**: `GT_SUBSCRIBE`
**엔티티**: `com.speaking.podo.applications.subscribe.domain.Subscribe`
**목적**: 구독 상품 정의 (마스터 데이터)

## 스키마

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| ID | String(32) | NO | - | PK, 구독 상품 고유 ID |
| SUB_TYPE | String(50) | YES | - | 구독 유형 |
| CLASS_TYPE | String(50) | YES | - | 수업 유형 |
| LANG_TYPE | String(50) | YES | - | 언어 유형 (EN/JP/CN) |
| PAYMENT_TYPE | String(50) | YES | - | 결제 유형 |
| SUB_NAME | String(100) | YES | - | 구독 상품명 |
| LESSON_MONTH | Integer | YES | - | 수업 개월 수 |
| LESSON_COUNT_PER_MONTH | Integer | YES | - | 월별 수업 횟수 |
| ORIGIN_PRICE | Integer | YES | - | 정가 |
| SUB_PRICE | Integer | YES | - | 구독 가격 (할인 적용) |
| BOOK_PRICE | Integer | YES | - | 교재비 |
| VIDEO_PRICE | Integer | YES | - | 동영상 가격 |
| LESSON_PRICE | Integer | YES | - | 수업 단가 |
| LESSON_VAT | Integer | YES | - | 수업 VAT |
| USE_YN | String(2) | YES | - | 사용 여부 (Y/N) |
| START_AT | LocalDateTime | YES | - | 판매 시작일 |
| END_AT | LocalDateTime | YES | - | 판매 종료일 |
| DISCOUNT_RATE | Integer | YES | - | 할인율 (%) |
| FREE_TRIAL | Integer | YES | - | 무료 체험 횟수 |
| REFUND_MILEAGE | Integer | YES | - | 환불 시 마일리지 |
| CRE_DATETIME | LocalDateTime | YES | - | 생성일시 (자동) |
| UPD_DATETIME | LocalDateTime | YES | - | 수정일시 (자동) |
| STATUS | String(50) | YES | - | 상태 |
| SCHEME_ID | String(50) | YES | - | 스키마 ID |
| LESSON_TIME | Integer | YES | - | 수업 시간 (분) |
| CURRICULUM_TYPE | String | YES | - | 커리큘럼 유형 |
| PROMOTION_TYPE | String | YES | - | 프로모션 유형 |
| DESCRIPTION | TEXT | YES | - | 설명 (JSON Array → List<String>) |
| EVENT_DESCRIPTION | TEXT | YES | - | 이벤트 설명 (JSON Array → List<String>) |

---

## 인덱스

### Primary Key
- `PRIMARY KEY (ID)`

### 권장 인덱스
```sql
CREATE INDEX idx_subscribe_lang_type ON GT_SUBSCRIBE(LANG_TYPE);
CREATE INDEX idx_subscribe_use_yn ON GT_SUBSCRIBE(USE_YN);
CREATE INDEX idx_subscribe_status ON GT_SUBSCRIBE(STATUS);
CREATE INDEX idx_subscribe_start_end ON GT_SUBSCRIBE(START_AT, END_AT);
```

---

## 관계

### 1:N 관계 (FK로 참조됨)
- **GT_SUBSCRIBE_MAPP**: `GT_SUBSCRIBE.ID` ← `GT_SUBSCRIBE_MAPP.SUBSCRIBE_ID`

---

## 비즈니스 로직

### 상품 마스터
- 이 테이블은 구독 상품의 정의만 저장
- 실제 사용자의 구독 활성화는 `GT_SUBSCRIBE_MAPP` 테이블

### 가격 구조
- `ORIGIN_PRICE`: 정가
- `SUB_PRICE`: 실제 판매가 (할인 적용)
- `DISCOUNT_RATE`: 할인율 (%)
- `BOOK_PRICE`, `VIDEO_PRICE`: 추가 옵션 가격

**계산 예시**:
```
정가: 300,000원
할인율: 20%
구독 가격 = 300,000 * (100 - 20) / 100 = 240,000원
```

### 수업 제공량
- `LESSON_MONTH`: 총 개월 수 (예: 1개월, 3개월)
- `LESSON_COUNT_PER_MONTH`: 월별 제공 횟수 (예: 20회)
- `LESSON_TIME`: 수업 시간 (예: 25분)

**총 수업 횟수**:
```
LESSON_MONTH * LESSON_COUNT_PER_MONTH
예: 3개월 * 20회 = 60회
```

### 판매 기간
- `START_AT` ~ `END_AT`: 이 기간에만 구매 가능
- `USE_YN`: 추가 활성화 플래그

### 무료 체험
- `FREE_TRIAL`: 무료 체험 제공 횟수
- 0이면 무료 체험 없음

---

## Converter 매핑

### DESCRIPTION / EVENT_DESCRIPTION
**Converter**: `StringListConverter`

DB에 JSON 배열로 저장:
```json
["첫 번째 설명", "두 번째 설명", "세 번째 설명"]
```

Java에서는 `List<String>`으로 변환:
```java
List<String> description = subscribe.getDescription();
// ["첫 번째 설명", "두 번째 설명", "세 번째 설명"]
```

---

## 주요 쿼리 예시

### 1. 활성 구독 상품 목록 (영어)
```sql
SELECT *
FROM GT_SUBSCRIBE
WHERE LANG_TYPE = 'EN'
  AND USE_YN = 'Y'
  AND START_AT <= NOW()
  AND END_AT >= NOW()
ORDER BY SUB_PRICE ASC;
```

### 2. 할인율 높은 순서
```sql
SELECT
  SUB_NAME,
  ORIGIN_PRICE,
  SUB_PRICE,
  DISCOUNT_RATE,
  (ORIGIN_PRICE - SUB_PRICE) AS discount_amount
FROM GT_SUBSCRIBE
WHERE USE_YN = 'Y'
ORDER BY DISCOUNT_RATE DESC;
```

### 3. 무료 체험 제공 상품
```sql
SELECT *
FROM GT_SUBSCRIBE
WHERE FREE_TRIAL > 0
  AND USE_YN = 'Y';
```

### 4. 특정 상품의 구매 현황
```sql
SELECT
  s.SUB_NAME,
  COUNT(sm.ID) AS purchase_count,
  SUM(CASE WHEN sm.SUBSCRIBE_YN = 'Y' THEN 1 ELSE 0 END) AS active_count
FROM GT_SUBSCRIBE s
LEFT JOIN GT_SUBSCRIBE_MAPP sm ON s.ID = sm.SUBSCRIBE_ID
WHERE s.ID = ?
GROUP BY s.ID;
```

---

## 주의사항

### 1. String ID
- PK가 String(32) UUID
- 생성 시 UUID 직접 생성 필요 (Auto Increment 아님)

### 2. DESCRIPTION 컬럼
- TEXT 타입에 JSON 배열 저장
- `StringListConverter`로 자동 변환
- 직접 쿼리 시 JSON 파싱 필요

### 3. @CreationTimestamp / @UpdateTimestamp
- `CRE_DATETIME`: INSERT 시 자동 생성
- `UPD_DATETIME`: UPDATE 시 자동 갱신

### 4. 판매 기간 vs USE_YN
- 두 조건 모두 충족해야 판매 가능:
  - `USE_YN = 'Y'`
  - `START_AT <= NOW() <= END_AT`

### 5. NULL 허용
- 대부분 컬럼이 nullable
- 조회 시 NULL 체크 필요

---

## 엔티티 파일 위치
```
src/main/java/com/speaking/podo/applications/subscribe/domain/Subscribe.java
```

---

## 생성자

엔티티에 간단한 생성자 제공:
```java
public Subscribe(
    String id,
    String langType,
    String subName,
    Integer lessonMonth,
    Integer lessonCountPerMonth,
    Integer originPrice,
    Integer subPrice,
    Integer discountRate,
    LocalDateTime creDatetime
)
```

---

## 샘플 데이터

| ID | LANG_TYPE | SUB_NAME | LESSON_MONTH | LESSON_COUNT_PER_MONTH | ORIGIN_PRICE | SUB_PRICE | DISCOUNT_RATE |
|----|-----------|----------|--------------|------------------------|--------------|-----------|---------------|
| abc-123 | EN | 영어 1개월 20회 | 1 | 20 | 300000 | 240000 | 20 |
| def-456 | JP | 일본어 3개월 60회 | 3 | 20 | 800000 | 640000 | 20 |
| ghi-789 | EN | 영어 체험 3회 | 1 | 3 | 0 | 0 | 0 |
