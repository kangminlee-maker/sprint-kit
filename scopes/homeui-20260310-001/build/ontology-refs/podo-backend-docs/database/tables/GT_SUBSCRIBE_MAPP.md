---
title: GT_SUBSCRIBE_MAPP 테이블
domain: database
table: GT_SUBSCRIBE_MAPP
entity: SubscribeMapp.java
created: 2026-01-26
---

# GT_SUBSCRIBE_MAPP 테이블

## 개요
**테이블명**: `GT_SUBSCRIBE_MAPP`
**엔티티**: `com.speaking.podo.applications.subscribe.domain.SubscribeMapp`
**목적**: 사용자별 구독 활성화 매핑 (구독 인스턴스)

## 스키마

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| ID | String(32) | NO | - | PK, 구독 매핑 고유 ID |
| CRE_DATETIME | LocalDateTime | YES | - | 생성일시 (자동) |
| UPD_DATETIME | LocalDateTime | YES | - | 수정일시 (자동) |
| USER_ID | Integer | YES | - | FK → GT_USER.ID |
| SUBSCRIBE_ID | String(32) | YES | - | FK → GT_SUBSCRIBE.ID |
| CARD_ID | String(32) | YES | - | 카드 ID (결제 수단) |
| MERCHANT_UID | String(1000) | YES | - | 주문 고유 ID |
| PAYMENT_ID | Integer | YES | - | FK → GT_PAYMENT_INFO.ID |
| START_DATE | LocalDate | YES | - | 구독 시작일 |
| END_DATE | LocalDate | YES | - | 구독 종료일 |
| NEXT_PAYMENT_DATE | LocalDate | YES | - | 다음 결제일 (정기결제) |
| FINAL_DATE | LocalDate | YES | - | 최종 종료일 |
| CANCEL_AT | LocalDateTime | YES | - | 해지 요청일시 |
| RETRY_PAYMENT_DATE | LocalDate | YES | - | 결제 재시도 날짜 |
| SUBSCRIBE_YN | String(2) | YES | - | 구독 활성 여부 (Y/N) |
| PAYMENT_COUNT | Integer | YES | - | 결제 횟수 (누적) |
| FAIL_COUNT | Integer | YES | - | 결제 실패 횟수 |
| STATUS | String(50) | YES | - | 구독 상태 |
| MEMO | String(200) | YES | - | 메모 |
| DEL_YN | String(50) | YES | - | 삭제 여부 |

---

## 인덱스

### Primary Key
- `PRIMARY KEY (ID)`

### 권장 인덱스
```sql
CREATE INDEX idx_subscribe_mapp_user_id ON GT_SUBSCRIBE_MAPP(USER_ID);
CREATE INDEX idx_subscribe_mapp_subscribe_id ON GT_SUBSCRIBE_MAPP(SUBSCRIBE_ID);
CREATE INDEX idx_subscribe_mapp_subscribe_yn ON GT_SUBSCRIBE_MAPP(SUBSCRIBE_YN);
CREATE INDEX idx_subscribe_mapp_next_payment ON GT_SUBSCRIBE_MAPP(NEXT_PAYMENT_DATE);
CREATE INDEX idx_subscribe_mapp_end_date ON GT_SUBSCRIBE_MAPP(END_DATE);
```

---

## 관계

### N:1 관계 (FK 참조)
- **GT_USER**: `GT_SUBSCRIBE_MAPP.USER_ID` → `GT_USER.ID`
- **GT_SUBSCRIBE**: `GT_SUBSCRIBE_MAPP.SUBSCRIBE_ID` → `GT_SUBSCRIBE.ID`
- **GT_PAYMENT_INFO**: `GT_SUBSCRIBE_MAPP.PAYMENT_ID` → `GT_PAYMENT_INFO.ID`

### 1:N 관계 (FK로 참조됨)
- **GT_CLASS_TICKET**: `GT_SUBSCRIBE_MAPP.ID` ← `GT_CLASS_TICKET.SUBSCRIBE_MAPP_ID`
- **GT_PAYMENT_INFO**: `GT_SUBSCRIBE_MAPP.ID` ← `GT_PAYMENT_INFO.SUBSCRIBE_MAPP_ID`

---

## 비즈니스 로직

### 구독 인스턴스
- `GT_SUBSCRIBE`: 상품 정의 (마스터)
- `GT_SUBSCRIBE_MAPP`: 사용자별 구독 활성화 (인스턴스)

**예시**:
```
GT_SUBSCRIBE: "영어 1개월 20회" (상품)
  ↓
GT_SUBSCRIBE_MAPP:
  - 사용자 A: 2026-01-01 ~ 2026-01-31 (인스턴스 1)
  - 사용자 B: 2026-01-15 ~ 2026-02-14 (인스턴스 2)
```

### 구독 생명주기

#### 1. 구독 시작
```
SUBSCRIBE_YN = 'Y'
START_DATE = 결제일
END_DATE = START_DATE + LESSON_MONTH
NEXT_PAYMENT_DATE = END_DATE (정기결제인 경우)
PAYMENT_COUNT = 1
```

#### 2. 정기 결제
```
PAYMENT_COUNT++
START_DATE = END_DATE
END_DATE = START_DATE + LESSON_MONTH
NEXT_PAYMENT_DATE = END_DATE
```

#### 3. 해지 요청
```
CANCEL_AT = NOW()
SUBSCRIBE_YN = 'N' (또는 END_DATE까지 유지)
```

#### 4. 결제 실패
```
FAIL_COUNT++
RETRY_PAYMENT_DATE = NEXT_PAYMENT_DATE + N일
```

### 활성 구독 조건
```sql
SUBSCRIBE_YN = 'Y'
AND END_DATE >= CURDATE()
AND (DEL_YN IS NULL OR DEL_YN != 'Y')
```

### 수강권 발급
- 구독 활성화 시 `GT_CLASS_TICKET` 생성
- `SUBSCRIBE_MAPP_ID`로 연결

---

## 상태 값

### SUBSCRIBE_YN
| 값 | 의미 |
|----|------|
| Y | 활성 (구독 중) |
| N | 비활성 (해지, 만료) |

### STATUS
상태 코드는 커스텀 값 사용 (예시):
- `ACTIVE`: 정상 구독 중
- `PAUSED`: 일시 정지
- `CANCELLED`: 해지됨
- `EXPIRED`: 만료됨

### DEL_YN
| 값 | 의미 |
|----|------|
| Y | 삭제됨 (soft delete) |
| N 또는 NULL | 정상 |

---

## 주요 쿼리 예시

### 1. 사용자의 활성 구독 조회
```sql
SELECT sm.*, s.SUB_NAME
FROM GT_SUBSCRIBE_MAPP sm
INNER JOIN GT_SUBSCRIBE s ON sm.SUBSCRIBE_ID = s.ID
WHERE sm.USER_ID = ?
  AND sm.SUBSCRIBE_YN = 'Y'
  AND sm.END_DATE >= CURDATE()
ORDER BY sm.END_DATE DESC;
```

### 2. 오늘 결제 예정 구독
```sql
SELECT sm.*, u.NAME, u.EMAIL
FROM GT_SUBSCRIBE_MAPP sm
INNER JOIN GT_USER u ON sm.USER_ID = u.ID
WHERE sm.NEXT_PAYMENT_DATE = CURDATE()
  AND sm.SUBSCRIBE_YN = 'Y';
```

### 3. 결제 실패 재시도 대상
```sql
SELECT sm.*, u.NAME, u.EMAIL
FROM GT_SUBSCRIBE_MAPP sm
INNER JOIN GT_USER u ON sm.USER_ID = u.ID
WHERE sm.RETRY_PAYMENT_DATE = CURDATE()
  AND sm.FAIL_COUNT > 0
  AND sm.SUBSCRIBE_YN = 'Y';
```

### 4. 구독별 결제 내역
```sql
SELECT
  sm.ID,
  sm.START_DATE,
  sm.END_DATE,
  p.UPDATE_DATE AS payment_date,
  p.PAID_AMOUNT,
  p.STATUS
FROM GT_SUBSCRIBE_MAPP sm
LEFT JOIN GT_PAYMENT_INFO p ON sm.ID = p.SUBSCRIBE_MAPP_ID
WHERE sm.USER_ID = ?
ORDER BY p.UPDATE_DATE DESC;
```

### 5. 구독 만료 예정 (7일 이내)
```sql
SELECT sm.*, u.NAME, u.EMAIL
FROM GT_SUBSCRIBE_MAPP sm
INNER JOIN GT_USER u ON sm.USER_ID = u.ID
WHERE sm.END_DATE BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  AND sm.SUBSCRIBE_YN = 'Y';
```

---

## 정기 결제 플로우

### 1. 초회 결제
```
1. GT_SUBSCRIBE_MAPP 생성
   - START_DATE = 2026-01-01
   - END_DATE = 2026-02-01
   - NEXT_PAYMENT_DATE = 2026-02-01
   - PAYMENT_COUNT = 1

2. GT_PAYMENT_INFO 생성
   - SUBSCRIBE_MAPP_ID = sm.ID

3. GT_CLASS_TICKET 발급
   - SUBSCRIBE_MAPP_ID = sm.ID
```

### 2. 정기 결제 (1개월 후)
```
1. 결제 성공
   - PAYMENT_COUNT = 2
   - START_DATE = 2026-02-01
   - END_DATE = 2026-03-01
   - NEXT_PAYMENT_DATE = 2026-03-01

2. GT_PAYMENT_INFO 추가 생성

3. GT_CLASS_TICKET 추가 발급
```

### 3. 결제 실패
```
1. FAIL_COUNT++
2. RETRY_PAYMENT_DATE = NEXT_PAYMENT_DATE + 3일
3. 재시도 최대 N회
4. 실패 시 SUBSCRIBE_YN = 'N'
```

---

## 주의사항

### 1. String ID
- PK가 String(32) UUID
- 생성 시 UUID 직접 생성 필요

### 2. MERCHANT_UID
- 결제 주문 고유 ID
- String(1000)으로 매우 긴 값 허용

### 3. PAYMENT_ID vs GT_PAYMENT_INFO.SUBSCRIBE_MAPP_ID
- **PAYMENT_ID**: 최초 결제 ID (단일 참조)
- **GT_PAYMENT_INFO.SUBSCRIBE_MAPP_ID**: 모든 결제 내역 (다중 참조)
- 정기결제는 GT_PAYMENT_INFO에 여러 레코드 생성

### 4. END_DATE vs FINAL_DATE
- **END_DATE**: 현재 구독 종료일 (갱신 가능)
- **FINAL_DATE**: 최종 종료 예정일 (해지 요청 시 사용)

### 5. @CreationTimestamp / @UpdateTimestamp
- `CRE_DATETIME`: INSERT 시 자동 생성
- `UPD_DATETIME`: UPDATE 시 자동 갱신

### 6. Constant
```java
public static final long ClassTimePerOneTicket = 25L;
```
- 수강권 1회당 25분 기준

---

## 엔티티 파일 위치
```
src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeMapp.java
```

---

## Builder 패턴
엔티티에 Lombok `@Builder` 적용:
```java
SubscribeMapp.builder()
    .id(UUID.randomUUID().toString())
    .userId(userId)
    .subscribeId(subscribeId)
    .startDate(LocalDate.now())
    .endDate(LocalDate.now().plusMonths(1))
    .subscribeYn("Y")
    .build();
```
