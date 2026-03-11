---
domain: schedule
type: entity
language: ko
version: 1.0
last_updated: 2026-01-26
tags: [엔티티, 데이터모델, 테이블스키마, JPA]
---

# 스케줄 도메인 엔티티 상세

## 컨텍스트
포도스피킹 스케줄 도메인의 데이터 모델 및 JPA 엔티티 구조를 설명합니다.

---

## 1. MatchingWeight (매칭 가중치)

### 1.1 엔티티 개요
튜터-학생 매칭 시 사용되는 가중치 설정을 저장하는 엔티티입니다.

**테이블명**: `le_matching_weight`

### 1.2 필드 구조

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | String(32) | PK, NOT NULL | UUID 기반 고유 ID |
| weight | Short | NOT NULL | 가중치 값 (0-100) |
| type | Enum(Type) | NOT NULL | 가중치 타입 (PRICE/SCHEDULE/NPS/CURRICULUM/DEFAULT) |

### 1.3 Enum: Type

```java
public enum Type {
    PRICE,       // 가격 정책 가중치
    SCHEDULE,    // 스케줄 가용성 가중치
    NPS,         // 튜터 만족도 가중치
    CURRICULUM,  // 커리큘럼 전문성 가중치
    DEFAULT      // 기본 가중치
}
```

**DB 컬럼 타입**: `ENUM('PRICE','SCHEDULE','NPS','CURRICULUM','DEFAULT')`

### 1.4 비즈니스 로직

**Type 변환 메서드**
```java
public static Type fromString(String value) {
    // 대소문자 무시하고 문자열을 Enum으로 변환
    // 잘못된 값 입력 시 INVALID_MATCHING_WEIGHT_TYPE 예외 발생
}
```

### 1.5 사용 예시

**가중치 조회**
```java
MatchingWeight npsWeight = matchingWeightRepository
    .findByType(MatchingWeight.Type.NPS);
System.out.println(npsWeight.getWeight()); // 85
```

**가중치 업데이트**
```json
PATCH /api/schedule/matching-weight
{
  "type": "NPS",
  "weight": 90
}
```

---

## 2. ScheduleBase (기본 스케줄)

### 2.1 엔티티 개요
튜터의 주간 고정 수업 가능 시간 템플릿을 저장합니다.

**테이블명**: `le_schedule_base`

### 2.2 필드 구조

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | Integer | PK, AUTO_INCREMENT | 자동 생성 ID |
| tutorId | Integer | NOT NULL | 튜터 사용자 ID |
| scheduleDay | Enum(ScheduleDay) | NOT NULL | 요일 |
| utcStartHour | LocalTime | NOT NULL | 시작 시간 (UTC) |
| minutes | Short | NOT NULL, MAX 1440 | 지속 시간 (분) |
| utcCreatedAt | LocalDateTime | NOT NULL, 자동생성 | 생성 시각 (UTC) |

### 2.3 Enum: ScheduleDay

```java
public enum ScheduleDay {
    MON,
    TUE,
    WED,
    THU,
    FRI,
    SAT,
    SUN
}
```

### 2.4 제약조건

**분 단위 제약**
- `@Max(value = 1440)`: 최대 24시간 (1440분)
- 최소값 제한 없음 (30분 단위 권장)

### 2.5 사용 예시

**튜터 화요일 오전 9-12시 스케줄 등록** (KST 기준)
```java
ScheduleBase schedule = ScheduleBase.builder()
    .tutorId(101)
    .scheduleDay(ScheduleDay.TUESDAY)
    .utcStartHour(LocalTime.of(0, 0))  // UTC 00:00 = KST 09:00
    .minutes((short) 180)               // 3시간
    .build();
```

---

## 3. ScheduleTimeBlock (타임블록)

### 3.1 엔티티 개요
실제 예약된 30분 단위 수업 시간 슬롯을 저장합니다.

**테이블명**: `le_schedule_time_block`

### 3.2 필드 구조

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | Integer | PK, AUTO_INCREMENT | 자동 생성 ID |
| tutorId | Integer | NOT NULL | 튜터 사용자 ID |
| utcScheduleDateTime | LocalDateTime | NOT NULL | 수업 시작 시각 (UTC) |
| studentId | Integer | NULLABLE | 학생 사용자 ID (예약 전엔 NULL) |
| classId | Long | NULLABLE | 수업 ID (예약 전엔 NULL) |
| langType | Enum(LangType) | NOT NULL | 수업 언어 타입 |
| regType | Enum(ScheduleRegType) | NOT NULL | 예약 타입 |
| utcCreatedAt | LocalDateTime | NOT NULL, 자동생성 | 생성 시각 (UTC) |
| utcUpdatedAt | LocalDateTime | NOT NULL, 자동갱신 | 수정 시각 (UTC) |

### 3.3 Enum: LangType

```java
public enum LangType {
    EN,  // 영어
    JP   // 일본어
}
```

### 3.4 Enum: ScheduleRegType

```java
public enum ScheduleRegType {
    CRON,         // Cron Job을 통한 자동 생성
    ADMIN_BATCH,  // 관리자 배치 작업
    TUTOR         // 튜터가 직접 등록
}
```

### 3.5 특수 메서드

**시간대 변환 메서드 (주의 필요)**
```java
public LocalDateTime getUtcScheduleDateTimeWithZone() {
    // DB 연결 설정이 KST로 되어 있을 경우에만 사용
    // UTC → Asia/Seoul 시간대 변환
    // 현재는 사용 금지 (DB URL에서 kst 제거 필요)
}
```

**toString() 오버라이드**
```java
@Override
public String toString() {
    return String.format(
        "ScheduleTimeBlock = [tutorId:%s utcScheduleDateTime:%s studentId:%s classId:%s langType:%s]",
        tutorId, utcScheduleDateTime, studentId, classId, langType
    );
}
```

### 3.6 사용 예시

**30분 수업 타임블록 생성**
```java
ScheduleTimeBlock timeBlock = ScheduleTimeBlock.builder()
    .tutorId(101)
    .utcScheduleDateTime(LocalDateTime.of(2026, 1, 27, 1, 0)) // UTC 기준
    .studentId(2001)
    .classId(5001L)
    .langType(LangType.EN)
    .regType(ScheduleRegType.REG)
    .build();
```

---

## 4. LectureSchedule (레거시 수업 일정)

### 4.1 엔티티 개요
기존 시스템과의 호환성을 위한 레거시 테이블입니다.

**테이블명**: `GT_CLASS_SCHEDULE`

### 4.2 필드 구조

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | Integer | PK, AUTO_INCREMENT | 자동 생성 ID |
| createDatetime | Date | NOT NULL | 생성 시각 |
| updateDatetime | Date | NULLABLE | 수정 시각 |
| tutorId | Integer | NOT NULL | 튜터 ID |
| scheduleDate | String(10) | NOT NULL | 수업 날짜 ("YYYY-MM-DD") |
| scheduleHour | String(5) | NOT NULL | 수업 시간 ("HH:MM") |
| userId | Integer | NOT NULL | 학생 ID |
| classId | Integer | NOT NULL | 수업 ID |
| status | String(10) | NOT NULL | 상태 (OPEN/BOOKED/DONE/CANCEL) |
| regType | String(50) | NULLABLE | 예약 타입 |

### 4.3 특징

**문자열 기반 날짜/시간**
- `scheduleDate`: "2026-01-27"
- `scheduleHour`: "10:30"
- Java 8 Date/Time API 미사용

**레거시 호환성**
- 기존 시스템 조회용으로만 사용
- 신규 예약은 `ScheduleTimeBlock` 사용 권장

### 4.4 마이그레이션 전략

**읽기**: `GT_CLASS_SCHEDULE` 조회 가능
**쓰기**: 신규 예약은 `le_schedule_time_block` 사용
**동기화**: 이벤트 기반 양방향 동기화 (선택적)

---

## 5. 튜터 커리큘럼 (TutorCurriculum)

### 5.1 엔티티 개요
튜터가 가르칠 수 있는 커리큘럼 목록을 저장합니다.

**테이블명**: `le_tutor_curriculum` (추정)

### 5.2 역할
- 매칭 시 CURRICULUM 가중치 계산에 활용
- 학생이 원하는 커리큘럼을 가르칠 수 있는 튜터 필터링

---

## 6. 엔티티 간 관계도

```
ScheduleBase (1) ─────────> (N) ScheduleTimeBlock
    │                              │
    └─ tutorId                     └─ tutorId, studentId

MatchingWeight (N) ─────────> (1) 매칭 알고리즘
    │
    └─ type별 가중치 적용

LectureSchedule (레거시) ─────> 읽기 전용 조회
```

---

## 파일 경로 인덱스
```
src/main/java/com/speaking/podo/applications/podo/schedule/domain/
├── MatchingWeight.java
├── ScheduleBase.java
├── ScheduleTimeBlock.java
├── LectureSchedule.java
├── TutorCurriculum.java
└── enums/
    ├── ScheduleDay.java
    ├── LangType.java
    ├── ScheduleRegType.java
    └── ReturnCode.java
```

## 관련 문서
- [스케줄 도메인 개요](./README.md)
- [스케줄 도메인 정책](./policies.md)
