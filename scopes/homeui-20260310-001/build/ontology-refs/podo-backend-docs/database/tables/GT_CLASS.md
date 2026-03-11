---
title: GT_CLASS 테이블
domain: database
table: GT_CLASS
entity: Lecture.java
created: 2026-01-26
---

# GT_CLASS 테이블

## 개요
**테이블명**: `GT_CLASS`
**엔티티**: `com.speaking.podo.applications.lecture.domain.Lecture`
**목적**: 수업 스케줄 및 상태 관리

## 스키마

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|--------|------|------|--------|------|
| ID | Long | NO | Auto | PK, 수업 고유 ID |
| STUDENT_USER_ID | Integer | YES | - | FK → GT_USER.ID (학생) |
| TEACHER_USER_ID | Integer | YES | - | FK → GT_USER.ID (튜터) |
| SUBJECT_ID | Integer | YES | - | 과목 ID |
| ORG_CLASS_DATETIME | LocalDateTime | YES | - | 원래 수업 일시 |
| CLASS_DATE | LocalDate | YES | - | 수업 날짜 |
| CLASS_START_TIME | LocalTime | YES | - | 수업 시작 시간 |
| CLASS_END_TIME | LocalTime | YES | - | 수업 종료 시간 |
| ATTENDANCE | Boolean | YES | - | 출석 여부 |
| PREPARATIONS | String | YES | - | 준비사항 |
| CLASS_CHANGE_SEQ | Integer | YES | - | 수업 변경 순번 |
| STUDENT_CLASS_SEQ | Integer | YES | - | 학생 수업 순번 |
| PRICE | Integer | YES | - | 수업료 |
| CREDIT | Integer | YES | - | **LectureStatus** (0=NONE, 1=REGIST, 2=DONE, 3=CANCEL) |
| EVAL_YN | Boolean | YES | - | 평가 여부 |
| CLASS_EVAL1 | Integer | YES | - | 강의력 점수 |
| CLASS_EVAL2 | Integer | YES | - | 강의 준비 점수 |
| CLASS_EVAL3 | Integer | YES | - | 학습 케어 점수 |
| STUDENT_COMMENT | String | YES | - | 학생 코멘트 |
| TEACHER_COMMENT | String | YES | - | 튜터 코멘트 |
| HITS | Integer | YES | - | 조회수 |
| UPDATE_REASON | String | YES | - | 수정 사유 |
| TICKET_COUNT | Integer | YES | - | 차감된 수강권 횟수 |
| USER_TYPE | String | YES | - | RoleType (Student/Tutor/Admin) |
| TICKET_TYPE | String | YES | - | TicketType (Normal/Event) |
| UPD_COUNT | Integer | YES | - | 전체 수정 횟수 |
| STUDENT_UPD_COUNT | Integer | YES | - | 학생 수정 횟수 |
| TEACHER_UPD_COUNT | Integer | YES | - | 튜터 수정 횟수 |
| REG_FIRST_YN | String | YES | - | 최초 등록 여부 (Y/N) |
| CITY | String | YES | - | 도시 |
| SCHEDULE_REG_AT | LocalDateTime | YES | - | 스케줄 등록 일시 |
| CANCEL_AT | LocalDateTime | YES | - | 취소 일시 |
| CITY_LAT | String | YES | - | 위도 |
| CITY_LON | String | YES | - | 경도 |
| CITY_ADDRESS | String | YES | - | 주소 |
| USER_PRICE_PER_CLASS | Integer | YES | - | 학생 수업당 가격 |
| TUTOR_PRICE_PER_CLASS | Integer | YES | - | 튜터 수업당 가격 |
| DEPOSIT_YN | String | YES | - | 입금 여부 (Y/N) |
| COMP_DATETIME | LocalDateTime | YES | - | 완료 일시 |
| NOSHOW_DATETIME | LocalDateTime | YES | - | 노쇼 일시 |
| GWATOP_PRICE_PER_CLASS | Integer | YES | - | 과탑 수업당 가격 |
| DEPOSIT_DATETIME | LocalDateTime | YES | - | 입금 일시 |
| ZOOM_ACCOUNT | String | YES | - | Zoom 계정 |
| REVENUE_PER_CLASS | String | YES | - | 수업당 수익 |
| CLASS_TYPE | String | YES | - | 수업 유형 |
| LANG_TYPE | String | YES | - | 언어 유형 (EN/JP/CN) |
| CLASS_COURSE_ID | Integer | YES | - | 커리큘럼 코스 ID |
| CLASS_METHOD | String | YES | - | 수업 방식 |
| CLASS_TICKET_ID | String | YES | - | FK → GT_CLASS_TICKET.ID |
| IS_PRESTUDY | String | YES | - | 예습 여부 (Y/N) |
| PRESTUDY_TIME | BigDecimal | YES | - | 예습 시간 (분) |
| CLASS_STATE | String | YES | - | 수업 상태 |
| TALK_SEND_STATUS | String | YES | - | 카톡 발송 상태 |
| INVOICE_STATUS | String | YES | - | **Lecture.InvoiceStatus** (CREATED/RESERVED/COMPLETED/CANCEL...) |

---

## 인덱스

### Primary Key
- `PRIMARY KEY (ID)`

### 권장 인덱스
```sql
CREATE INDEX idx_class_student_id ON GT_CLASS(STUDENT_USER_ID);
CREATE INDEX idx_class_teacher_id ON GT_CLASS(TEACHER_USER_ID);
CREATE INDEX idx_class_ticket_id ON GT_CLASS(CLASS_TICKET_ID);
CREATE INDEX idx_class_date ON GT_CLASS(CLASS_DATE);
CREATE INDEX idx_class_credit ON GT_CLASS(CREDIT);
CREATE INDEX idx_class_invoice_status ON GT_CLASS(INVOICE_STATUS);
CREATE INDEX idx_class_lang_type ON GT_CLASS(LANG_TYPE);
```

---

## 관계

### N:1 관계 (FK 참조)
- **GT_USER (학생)**: `GT_CLASS.STUDENT_USER_ID` → `GT_USER.ID`
- **GT_USER (튜터)**: `GT_CLASS.TEACHER_USER_ID` → `GT_USER.ID`
- **GT_CLASS_TICKET**: `GT_CLASS.CLASS_TICKET_ID` → `GT_CLASS_TICKET.ID`

---

## 핵심 Enum 정의

### CREDIT 컬럼: LectureStatus (Integer)
**파일**: `src/main/java/com/speaking/podo/applications/lecture/domain/enums/LectureStatus.java`
**Converter**: `LectureStatusConverter`

| DB 값 (Integer) | Enum | 설명 |
|-----------------|------|------|
| 0 | NONE | 없음 (초기 상태) |
| 1 | REGIST | 등록 (예약됨) |
| 2 | DONE | 완료 |
| 3 | CANCEL | 취소 |

### INVOICE_STATUS 컬럼: Lecture.InvoiceStatus (String)
**파일**: `src/main/java/com/speaking/podo/applications/lecture/domain/Lecture.java` (Inner Enum)

| DB 값 (String) | 설명 |
|----------------|------|
| CREATED | 생성됨 |
| RESERVED | 예약됨 |
| COMPLETED | 완료됨 |
| NOSHOW_S | 노쇼 (학생) |
| NOSHOW_BOTH | 노쇼 (양쪽) |
| CANCEL_NOSHOW_T | 취소 - 노쇼 (튜터) |
| CANCEL | 취소 |
| CANCEL_PAID | 취소 (유료) |

**차이점**:
- `LectureStatus` (CREDIT): 수업 생명주기 상태
- `InvoiceStatus` (INVOICE_STATUS): 청구/정산 관점 상태

---

## 비즈니스 로직

### 수업 생명주기

#### 1. 수업 예약 (등록)
```
CREDIT = 1 (REGIST)
INVOICE_STATUS = CREATED 또는 RESERVED
CLASS_DATE, CLASS_START_TIME, CLASS_END_TIME 설정
STUDENT_USER_ID, TEACHER_USER_ID 설정
CLASS_TICKET_ID 설정
```

#### 2. 수업 완료
```
CREDIT = 2 (DONE)
INVOICE_STATUS = COMPLETED
COMP_DATETIME = NOW()
수강권 차감 (GT_CLASS_TICKET.USED_COUNT++)
```

#### 3. 수업 취소
```
CREDIT = 3 (CANCEL)
INVOICE_STATUS = CANCEL 또는 CANCEL_PAID
CANCEL_AT = NOW()
```

#### 4. 노쇼 처리
```
CREDIT = 2 또는 3
INVOICE_STATUS = NOSHOW_S (학생), NOSHOW_BOTH (양쪽)
NOSHOW_DATETIME = NOW()
```

### 수업 시간 계산
```
수업 시간 = CLASS_END_TIME - CLASS_START_TIME
일반적으로 25분 (1회권)
```

### 수강권 차감
```
TICKET_COUNT: 이 수업에서 차감한 횟수 (보통 1)
GT_CLASS_TICKET.USED_COUNT += TICKET_COUNT
```

### 평가 시스템
```
EVAL_YN = true (평가 완료)
CLASS_EVAL1: 강의력 점수 (1~5)
CLASS_EVAL2: 강의 준비 점수 (1~5)
CLASS_EVAL3: 학습 케어 점수 (1~5)
STUDENT_COMMENT: 학생 코멘트
```

---

## 주요 쿼리 예시

### 1. 학생의 예약된 수업 조회
```sql
SELECT
  c.*,
  u.NAME AS tutor_name
FROM GT_CLASS c
INNER JOIN GT_USER u ON c.TEACHER_USER_ID = u.ID
WHERE c.STUDENT_USER_ID = ?
  AND c.CREDIT = 1 -- REGIST
  AND c.CLASS_DATE >= CURDATE()
ORDER BY c.CLASS_DATE, c.CLASS_START_TIME;
```

### 2. 튜터의 오늘 수업 목록
```sql
SELECT
  c.*,
  s.NAME AS student_name,
  s.PHONE AS student_phone
FROM GT_CLASS c
INNER JOIN GT_USER s ON c.STUDENT_USER_ID = s.ID
WHERE c.TEACHER_USER_ID = ?
  AND c.CLASS_DATE = CURDATE()
  AND c.CREDIT = 1 -- REGIST
ORDER BY c.CLASS_START_TIME;
```

### 3. 완료된 수업 내역 (평가 포함)
```sql
SELECT
  c.*,
  t.NAME AS tutor_name,
  c.CLASS_EVAL1,
  c.CLASS_EVAL2,
  c.CLASS_EVAL3,
  c.STUDENT_COMMENT
FROM GT_CLASS c
INNER JOIN GT_USER t ON c.TEACHER_USER_ID = t.ID
WHERE c.STUDENT_USER_ID = ?
  AND c.CREDIT = 2 -- DONE
  AND c.EVAL_YN = true
ORDER BY c.CLASS_DATE DESC;
```

### 4. 노쇼 수업 조회
```sql
SELECT
  c.*,
  s.NAME AS student_name,
  t.NAME AS tutor_name
FROM GT_CLASS c
INNER JOIN GT_USER s ON c.STUDENT_USER_ID = s.ID
INNER JOIN GT_USER t ON c.TEACHER_USER_ID = t.ID
WHERE c.INVOICE_STATUS IN ('NOSHOW_S', 'NOSHOW_BOTH', 'CANCEL_NOSHOW_T')
  AND c.CLASS_DATE = CURDATE();
```

### 5. 특정 기간 수업 통계
```sql
SELECT
  c.LANG_TYPE,
  COUNT(*) AS total_classes,
  SUM(CASE WHEN c.CREDIT = 2 THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN c.CREDIT = 3 THEN 1 ELSE 0 END) AS cancelled_count,
  SUM(CASE WHEN c.INVOICE_STATUS LIKE 'NOSHOW%' THEN 1 ELSE 0 END) AS noshow_count
FROM GT_CLASS c
WHERE c.CLASS_DATE BETWEEN ? AND ?
GROUP BY c.LANG_TYPE;
```

### 6. 수강권별 수업 사용 내역
```sql
SELECT
  ct.ID AS ticket_id,
  ct.PURCHASED_COUNT,
  ct.USED_COUNT,
  c.CLASS_DATE,
  c.CLASS_START_TIME,
  c.TICKET_COUNT,
  c.CREDIT
FROM GT_CLASS_TICKET ct
LEFT JOIN GT_CLASS c ON ct.ID = c.CLASS_TICKET_ID
WHERE ct.USER_ID = ?
ORDER BY c.CLASS_DATE DESC;
```

---

## 타임존 처리

### CANCEL_AT 컬럼
DB는 UTC로 저장하지만 JPA는 KST로 읽음 (현재 설정)

**getter 메서드**:
```java
public LocalDateTime getCancelAtWithZone() {
    if (cancelAt == null) return null;
    Instant instant = this.cancelAt
        .atZone(ZoneId.of("UTC"))
        .toInstant();
    return instant.atZone(ZoneId.of("Asia/Seoul")).toLocalDateTime();
}
```

**주의사항**:
- JPA가 만든 Lecture 객체: `getCancelAtWithZone()` 사용
- 코드에서 직접 만든 객체: `getCancelAt()` 사용
- 향후 DB 연결 설정에서 KST 제거 시 `WithZone()` 메서드 사용 금지 예정

---

## 특이 사항

### 1. CREDIT 컬럼명
- 실제 의미는 LectureStatus (수업 상태)
- 레거시 네이밍

### 2. USER_TYPE 컬럼
- 수업 등록자 구분 (Student/Tutor/Admin)
- Converter: `ClassRegisterTypeConverter`

### 3. ORG_CLASS_DATETIME
- 원래 수업 일시 (변경 전)
- 수업 변경 시 이력 추적용

### 4. CLASS_CHANGE_SEQ
- 수업 변경 순번
- 변경 횟수 제한용

### 5. 예습(PRESTUDY) 관련
- `IS_PRESTUDY`: 예습 여부 (Y/N)
- `PRESTUDY_TIME`: 예습 시간 (BigDecimal)

### 6. Zoom 관련
- `ZOOM_ACCOUNT`: 사용된 Zoom 계정
- 온라인 수업 추적용

---

## Converter 매핑

| DB 컬럼 | Java 타입 | Converter | DB 타입 |
|---------|-----------|-----------|---------|
| CREDIT | LectureStatus | LectureStatusConverter | Integer |
| USER_TYPE | RoleType | ClassRegisterTypeConverter | String |
| TICKET_TYPE | TicketType | TicketTypeConverter | String |
| REG_FIRST_YN | Boolean | BooleanToStringConverter | String |
| DEPOSIT_YN | Boolean | BooleanToStringConverter | String |
| CLASS_START_TIME | LocalTime | TimeStraightener | Time |
| CLASS_END_TIME | LocalTime | TimeStraightener | Time |

---

## 주의사항

### 1. @DynamicUpdate
- 엔티티에 `@DynamicUpdate` 적용
- UPDATE 시 변경된 컬럼만 쿼리에 포함

### 2. ID Auto Increment
- Long 타입 PK
- `@GeneratedValue(strategy = GenerationType.IDENTITY)`

### 3. NULL 허용
- 대부분 컬럼이 nullable
- 조회 시 NULL 체크 필수

### 4. Cloneable 구현
- `clone()` 메서드 제공
- 수업 복사 시 사용

### 5. toDto() 메서드
- `LectureDto` 변환 메서드 제공

---

## 엔티티 파일 위치
```
src/main/java/com/speaking/podo/applications/lecture/domain/Lecture.java
src/main/java/com/speaking/podo/applications/lecture/domain/enums/LectureStatus.java
```

---

## 생성자

간단한 생성자 제공:
```java
public Lecture(
    Integer studentId,
    Integer tutorId,
    String city,
    LocalDateTime registedAt,
    LocalDate date,
    LocalTime startAt,
    LocalTime endAt,
    LectureStatus status,
    String talkSendStatus,
    int nTicket,
    String classType,
    Integer classCourseId,
    String classTicketId,
    String langType,
    String zoomAccount,
    InvoiceStatus invoiceStatus,
    String prestudyYn
)
```
