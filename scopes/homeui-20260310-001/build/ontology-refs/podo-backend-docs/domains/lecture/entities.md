---
domain: lecture
document_type: entities
version: 1.0.0
created_at: 2026-01-26
author: Claude AI
language: ko
tags:
  - lecture
  - entity
  - database
description: 수업 도메인 엔티티 정의
source_files:
  - src/main/java/com/speaking/podo/applications/lecture/domain/Lecture.java
  - src/main/java/com/speaking/podo/applications/lecture/domain/enums/LectureStatus.java
  - src/main/java/com/speaking/podo/applications/lecture/domain/LectureStatusHistory.java
---

# 수업 도메인 엔티티

## 1. Lecture (수업)

### 기본 정보

| 속성 | 설명 |
|------|------|
| 테이블명 | `GT_CLASS` |
| 엔티티 | `com.speaking.podo.applications.lecture.domain.Lecture` |
| 전략 | DynamicUpdate |

### 컬럼 정의

#### 기본 식별자

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| `ID` | id | Long | 수업 고유 ID (PK, AUTO_INCREMENT) |
| `STUDENT_USER_ID` | studentId | Integer | 학생 ID |
| `TEACHER_USER_ID` | tutorId | Integer | 튜터 ID |

#### 수업 일시

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| `ORG_CLASS_DATETIME` | registedAt | LocalDateTime | 수업 등록 일시 |
| `CLASS_DATE` | date | LocalDate | 수업 날짜 |
| `CLASS_START_TIME` | startAt | LocalTime | 수업 시작 시간 |
| `CLASS_END_TIME` | endAt | LocalTime | 수업 종료 시간 |
| `SCHEDULE_REG_AT` | scheduleRegAt | LocalDateTime | 예약 등록 일시 |
| `CANCEL_AT` | cancelAt | LocalDateTime | 취소 일시 |
| `COMP_DATETIME` | compDateTime | LocalDateTime | 완료 일시 |
| `NOSHOW_DATETIME` | noShowDateTime | LocalDateTime | 노쇼 처리 일시 |
| `DEPOSIT_DATETIME` | depositDateTime | LocalDateTime | 입금 일시 |

#### 수업 상태 (CRITICAL - 두 가지 상태)

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| `CREDIT` | status | LectureStatus | **기본 상태** (0:없음, 1:등록, 2:완료, 3:취소) |
| `INVOICE_STATUS` | invoiceStatus | InvoiceStatus | **정산 상태** (CREATED, RESERVED, COMPLETED 등) |
| `CLASS_STATE` | classState | String | 수업 세부 상태 (PRESTUDY, PREFINISH 등) |

#### 수업 유형 및 코스

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| `CITY` | city | String | 수업 유형 (PODO, PODO_TRIAL 등) |
| `CLASS_TYPE` | classType | String | 클래스 타입 (PODO) |
| `LANG_TYPE` | langType | String | 언어 타입 (EN, JP) |
| `CLASS_COURSE_ID` | classCourseId | Integer | 수업 코스 ID |
| `CLASS_TICKET_ID` | classTicketId | String | 수강권 ID |

#### 선행학습

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| `IS_PRESTUDY` | isPrestudy | String | 선행학습 여부 (Y/N) |
| `PRESTUDY_TIME` | preStudyTime | BigDecimal | 선행학습 시간 (분) |

#### 평가 정보

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| `EVAL_YN` | didEval | Boolean | 평가 여부 |
| `CLASS_EVAL1` | classScore | Integer | 강의력 점수 |
| `CLASS_EVAL2` | prepareClassScore | Integer | 강의 준비 점수 |
| `CLASS_EVAL3` | careScore | Integer | 학습 케어 점수 |
| `STUDENT_COMMENT` | studentComment | String | 학생 코멘트 |
| `TEACHER_COMMENT` | tutorComment | String | 튜터 코멘트 |

#### 가격 정보

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| `PRICE` | price | Integer | 기본 가격 |
| `USER_PRICE_PER_CLASS` | userPricePerClass | Integer | 수업당 학생 가격 |
| `TUTOR_PRICE_PER_CLASS` | tutorPricePerClass | Integer | 수업당 튜터 가격 |
| `GWATOP_PRICE_PER_CLASS` | gwatopPricePerClass | Integer | 과탑 가격 |
| `REVENUE_PER_CLASS` | revenuePerClass | String | 수업당 매출 |

#### 기타

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| `ATTENDANCE` | attendance | Boolean | 출석 여부 |
| `PREPARATIONS` | preparation | String | 준비물 |
| `UPDATE_REASON` | updateReason | String | 수정 사유 |
| `TICKET_COUNT` | nTicket | Integer | 수강권 횟수 |
| `ZOOM_ACCOUNT` | zoomAccount | String | 레몬보드 계정 토큰 |

---

## 2. LectureStatus (수업 기본 상태 Enum)

### 기본 정보

| 속성 | 설명 |
|------|------|
| 파일 위치 | `src/main/java/com/speaking/podo/applications/lecture/domain/enums/LectureStatus.java` |
| 용도 | 수업의 기본 생명주기 상태 |

### 값 정의

| Enum 값 | 코드 | 한국어 | 설명 |
|---------|------|--------|------|
| `NONE` | 0 | 없음 | 상태 없음 |
| `REGIST` | 1 | 등록 | 수업 등록됨 |
| `DONE` | 2 | 완료 | 수업 완료됨 |
| `CANCEL` | 3 | 취소 | 수업 취소됨 |

### 코드 변환

```java
// 코드로 변환
LectureStatus status = LectureStatus.of(1); // REGIST

// 문자열로 변환
LectureStatus status = LectureStatus.of("등록"); // REGIST
```

---

## 3. InvoiceStatus (정산/청구 상태 Enum)

### 기본 정보

| 속성 | 설명 |
|------|------|
| 파일 위치 | `src/main/java/com/speaking/podo/applications/lecture/domain/Lecture.java` (Line 224) |
| 용도 | 정산, 노쇼, 환불 등 세부 처리 상태 |
| 타입 | Inner Enum (Lecture 클래스 내부) |

### 값 정의

| Enum 값 | 설명 | 비즈니스 의미 |
|---------|------|---------------|
| `CREATED` | 생성됨 | 수업 초기 생성 상태 |
| `RESERVED` | 예약됨 | 튜터 배정 및 시간 확정 완료 |
| `COMPLETED` | 완료됨 | 정상적으로 수업 완료 |
| `NOSHOW_S` | 학생 노쇼 | 학생이 수업에 참석하지 않음 |
| `NOSHOW_BOTH` | 양측 노쇼 | 학생과 튜터 모두 미참석 |
| `CANCEL_NOSHOW_T` | 튜터 노쇼 취소 | 튜터 미참석으로 인한 수업 취소 |
| `CANCEL` | 취소 | 일반 취소 (수업 2시간 이전) |
| `CANCEL_PAID` | 유료 취소 | 튜터 정산 발생 취소 (수업 2시간 이내) |

### 상태 그룹

#### 완료 그룹 (수업 완료로 간주)
- `COMPLETED`
- `NOSHOW_S` (학생 노쇼도 튜터 정산에는 완료 처리)
- `NOSHOW_BOTH`

#### 취소 그룹 (수업 취소로 간주)
- `CANCEL`
- `CANCEL_PAID`
- `CANCEL_NOSHOW_T`

#### 진행 중 그룹
- `CREATED`
- `RESERVED`

---

## 4. LectureStatusHistory (수업 상태 변경 이력)

### 기본 정보

| 속성 | 설명 |
|------|------|
| 테이블명 | `le_class_status_history` |
| 엔티티 | `com.speaking.podo.applications.lecture.domain.LectureStatusHistory` |
| 용도 | 수업 상태 변경 이력 추적 |

### 컬럼 정의

| 컬럼명 | 필드명 | 타입 | 설명 |
|--------|--------|------|------|
| `id` | id | Integer | 이력 ID (PK, AUTO_INCREMENT) |
| `utc_created_at` | utcCreatedAt | LocalDateTime | 생성 일시 (UTC) |
| `class_id` | classId | Integer | 수업 ID |
| `action_type` | actionType | ActionType | 변경 주체 |
| `user_id` | userId | String | 변경자 ID |
| `before_status` | beforeStatus | String | 변경 전 상태 |
| `after_status` | afterStatus | String | 변경 후 상태 |

### ActionType Enum

| 값 | 설명 |
|----|------|
| `STUDENT` | 학생이 변경 |
| `TEACHER` | 튜터가 변경 |
| `ADMIN` | 관리자가 변경 |

---

## 5. 엔티티 관계도

```
+------------------+
|     Lecture      |
|------------------|
| id (PK)          |
| studentId        |----> GT_USER (학생)
| tutorId          |----> GT_TUTOR (튜터)
| status           |----> LectureStatus (Enum)
| invoiceStatus    |----> InvoiceStatus (Enum)
| classCourseId    |----> GT_CLASS_COURSE (코스)
| classTicketId    |----> LE_CLASS_TICKET (수강권)
+------------------+
         |
         | 1:N
         v
+------------------------+
| LectureStatusHistory   |
|------------------------|
| id (PK)                |
| classId (FK)           |
| actionType             |----> ActionType (Enum)
| beforeStatus           |
| afterStatus            |
+------------------------+
```

---

## 6. 주요 쿼리 패턴

### 활성 수업 조회 (예약된 수업)

```sql
SELECT * FROM GT_CLASS
WHERE student_user_id = :studentId
  AND invoice_status = 'RESERVED'
  AND is_prestudy = 'N'
  AND class_date >= CURRENT_DATE
ORDER BY class_date, class_start_time
```

### 완료된 수업 조회

```sql
SELECT * FROM GT_CLASS
WHERE city <> 'PODO_TRIAL'
  AND is_prestudy = 'N'
  AND class_type = 'PODO'
  AND class_ticket_id IN :ticketIds
  AND (
    invoice_status = 'COMPLETED'
    OR (invoice_status = 'RESERVED' AND class_state = 'PREFINISH')
  )
```

### 체험 수업 조회

```sql
SELECT * FROM GT_CLASS
WHERE class_ticket_id = :ticketId
  AND city = 'PODO_TRIAL'
  AND credit = 1  -- REGIST
  AND class_state IS NULL
ORDER BY org_class_datetime DESC
LIMIT 1
```

### 선행학습 조회

```sql
SELECT * FROM GT_CLASS
WHERE student_user_id = :studentId
  AND class_course_id = :courseId
  AND city = 'PODO_TRIAL'
  AND credit = 1  -- REGIST
  AND class_state = 'PRESTUDY'
ORDER BY org_class_datetime DESC
LIMIT 1
```

---

## 7. 인덱스 권장사항

### 기존 인덱스 (추정)

- PK: `id`
- `student_user_id`
- `teacher_user_id`
- `class_ticket_id`

### 권장 복합 인덱스

```sql
-- 학생별 예약 수업 조회
CREATE INDEX idx_lecture_student_reserved
ON GT_CLASS (student_user_id, invoice_status, class_date, class_start_time)
WHERE invoice_status = 'RESERVED' AND is_prestudy = 'N';

-- 튜터별 수업 조회
CREATE INDEX idx_lecture_tutor_date
ON GT_CLASS (teacher_user_id, class_date, invoice_status);

-- 코스별 수업 조회
CREATE INDEX idx_lecture_course
ON GT_CLASS (class_course_id, student_user_id, invoice_status);
```
