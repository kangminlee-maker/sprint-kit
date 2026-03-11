---
domain: schedule
type: policy
language: ko
version: 1.0
last_updated: 2026-02-23
tags: [정책, 비즈니스규칙, 매칭가중치, 스케줄규칙]
---

# 스케줄 도메인 정책

## 컨텍스트
포도스피킹 수업 스케줄 관리 및 튜터 매칭에 적용되는 비즈니스 규칙과 정책입니다.

---

## 1. 튜터 매칭 가중치 정책

### 1.1 가중치 타입 및 우선순위

**매칭 시 고려하는 5가지 가중치 요소**

| 타입 | 설명 | 가중치 범위 | 우선순위 |
|------|------|-------------|----------|
| PRICE | 가격 정책 (수업료 적합도) | 0-100 | 높음 |
| SCHEDULE | 스케줄 가용성 | 0-100 | 매우 높음 |
| NPS | 튜터 만족도 점수 | 0-100 | 중간 |
| CURRICULUM | 커리큘럼 전문성 | 0-100 | 높음 |
| DEFAULT | 기본 가중치 | 10 | 낮음 |

**정책 코드 위치**: `MatchingWeight.java`
```java
public enum Type {
    PRICE,       // 가격 적합도
    SCHEDULE,    // 스케줄 가용성
    NPS,         // 튜터 만족도
    CURRICULUM,  // 커리큘럼 전문성
    DEFAULT      // 정의되지 않은 기본값
}
```

### 1.2 가중치 계산 정책

**총 매칭 점수 계산식**
```
총점 = (PRICE × 가중치) + (SCHEDULE × 가중치) + (NPS × 가중치) + (CURRICULUM × 가중치)
```

**가중치 업데이트 규칙**
- 관리자만 가중치 수정 가능
- 각 가중치는 0-100 사이 Short 타입
- 실시간 반영: 변경 즉시 다음 매칭부터 적용

**관련 API**: `PATCH /api/schedule/matching-weight`
```json
{
  "type": "NPS",
  "weight": 85
}
```

---

## 2. 스케줄 시간 관리 정책

### 2.1 타임블록 (Time Block) 정책

**기본 규칙**
- **최소 단위**: 30분 슬롯
- **시간 표준**: UTC 기준 저장
- **중복 방지**: 동일 시간대 튜터 중복 예약 불가

**타임블록 예약 가능 조건**
1. 튜터의 Base Schedule에 해당 시간대가 OPEN 상태
2. 해당 시간대에 기존 예약 없음
3. 학생의 수업권 잔여 횟수 존재
4. 수업 시작 2시간 전까지만 예약 가능 (소스: `PodoScheduleServiceImplV2.java:1045`)

**청크 단위 정책 설명**
타임블록은 30분 단위로 관리되며, 연속된 60분 수업의 경우 2개의 타임블록으로 분할 저장됩니다. 이는 부분 취소 및 시간 단위 집계를 용이하게 합니다.

### 2.2 기본 스케줄 (Base Schedule) 정책

**Base Schedule 역할**
- 튜터의 **주간 고정 수업 가능 시간** 템플릿
- 매주 반복되는 패턴 정의
- Time Block 생성의 기준

**요일별 스케줄 등록**
```java
public enum ScheduleDay {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY,
    FRIDAY, SATURDAY, SUNDAY
}
```

**시간 범위 설정**
- `utcStartHour`: 시작 시간 (UTC 기준)
- `minutes`: 지속 시간 (최대 1440분 = 24시간)

**예시**:
```
튜터 A의 화요일 오전 9시-12시 가능 시간 등록
→ scheduleDay: TUESDAY
→ utcStartHour: 00:00 (UTC, KST 09:00)
→ minutes: 180 (3시간)
```

### 2.3 시간대 변환 정책

**저장 시**: 모든 시간을 UTC로 변환하여 저장
**조회 시**: 사용자 로케일에 맞춰 Asia/Seoul 등으로 변환

**주의사항** (코드 주석에서 발췌)
```java
// 중요!!!!!!!!!!!!!!!!!!
// db_url 연결부분에 kst를 지우고 나서
// getUtcScheduleDateTimeWithZone()는 사용 금지
```
→ DB 연결 설정이 KST로 되어 있을 경우에만 `getUtcScheduleDateTimeWithZone()` 사용

---

## 3. 수업 예약 및 변경 정책

### 3.1 예약 타입 (Reg Type)

| 타입 | 설명 | 정책 |
|------|------|------|
| REG | 일반 예약 | 2시간 전까지 가능 |
| CHANGE | 변경 예약 | 기존 예약 취소 후 신규 예약 |
| CANCEL | 취소 | 2시간 전 취소 시 수업권 복구 |
| ADMIN | 관리자 예약 | 시간 제한 없음 |

```java
public enum ScheduleRegType {
    REG, CHANGE, CANCEL, ADMIN
}
```

### 3.2 취소 및 재배정 정책

**2시간 전 취소**
- 수업권 자동 복구
- 페널티 없음

**2시간 이내 취소** (소스: `PodoScheduleServiceImplV2.java:1195`)
- 수업권 차감
- 무제한권(UNLIMIT)은 72시간 예약 금지 패널티
- 1시간 이내 취소 시 `CANCEL_PAID` (튜터 정산)

**패널티 적용 조건 강화** (2026-02-23 변경, 소스: `PodoScheduleServiceImplV2.java:748`):
- 패널티는 구독 매핑(`SubscribeMapp`)이 활성 상태(`subscribeYn = "Y"`)이고 유효 기간 내인 경우에만 적용
- `subscribeMapp.startDate`와 `subscribeMapp.finalDate` 사이의 기간 외에는 패널티 적용 안 함
- 구독 매핑이 없거나 비활성 상태이면 패널티 무시

**관리자 취소 및 재배정**
- 시스템 장애 등 불가피한 경우
- 학생에게 보상 수업권 지급
- API: `POST /api/schedule/admin/cancel-and-reassign`

---

## 4. 언어 타입별 정책

### 4.1 지원 언어

```java
public enum LangType {
    EN,   // 영어
    JP,   // 일본어
    CN    // 중국어 (예정)
}
```

### 4.2 언어별 매칭 규칙

**영어 수업 (EN)**
- 원어민/비원어민 튜터 모두 배정 가능
- NPS 가중치 높게 적용

**일본어 수업 (JP)**
- 일본어 전문 튜터만 배정
- CURRICULUM 가중치 높게 적용

---

## 5. 레거시 시스템 연동 정책

### 5.1 GT_CLASS_SCHEDULE 테이블 정책

**레거시 테이블 특징**
- 기존 시스템과 호환성 유지
- `SCHEDULE_DATE`: "YYYY-MM-DD" 문자열 형식
- `SCHEDULE_HOUR`: "HH:MM" 문자열 형식

**신규 시스템 연동 규칙**
- 신규 예약: `le_schedule_time_block` 사용
- 레거시 조회: `GT_CLASS_SCHEDULE` 읽기 전용
- 양방향 동기화 필요 시 이벤트 기반 처리

---

## 6. 제약 조건 및 예외 처리

### 6.1 데이터 제약

**ScheduleBase**
- `minutes` 최대값: 1440분 (24시간)
- `tutorId` 필수
- `scheduleDay` 필수

**ScheduleTimeBlock**
- `utcScheduleDateTime` 필수
- `langType` 필수
- `regType` 필수

### 6.2 예외 상황 처리

Schedule 도메인은 개별 예외 클래스 대신 `BaseException(PodoStatusCode)` 방식으로 통합 처리됩니다 (2026-02-23 변경).

| 예외 상황 | PodoStatusCode | HTTP 상태 |
|-----------|----------------|-----------|
| 중복 예약 시도 | `BOOK_ALREADY_PROCESSING` | 429 |
| 잘못된 가중치 타입 | `INVALID_MATCHING_WEIGHT_TYPE` | 400 |
| 2시간 이내 예약 시도 | `INVALID_TWO_HOUR_BEFORE` | 400 |
| 수업 정보 없음 | `LECTURE_NOT_FOUND` | 404 |
| 코스 정보 없음 | `COURSE_NOT_FOUND` | 404 |
| 수강권 구독 매핑 없음 | `SUBSCRIBE_MAPP_NOT_FOUND` | 404 |
| 구독 정보 없음 | `SUBSCRIBE_NOT_FOUND` | 404 |
| 튜터 없음 | `TUTOR_NOT_FOUND` | 404 |
| 유효하지 않은 수업 | `INVALID_LECTURE` | 400 |
| 수업 시간 불일치 | `INVALID_LESSON_TIME` | 400 |
| 온라인 수업 없음 | `LECTURE_ONLINE_NOT_FOUND` | 404 |
| 패널티 사용자 | `INVALID_PENALTY_USER` | 400 |
| 홀딩 사용자 | `INVALID_HOLDING_USER` | 400 |
| 잘못된 청구 상태 | `INVALID_LECTURE_INVOICE_STATUS` | 400 |

---

## 파일 경로 인덱스
```
src/main/java/com/speaking/podo/applications/podo/schedule/
├── domain/
│   ├── MatchingWeight.java (가중치 정책)
│   ├── ScheduleBase.java (기본 스케줄 정책)
│   ├── ScheduleTimeBlock.java (타임블록 정책)
│   └── enums/
│       ├── ScheduleRegType.java (예약 타입)
│       ├── LangType.java (언어 타입)
│       └── ScheduleDay.java (요일)
└── dto/request/
    ├── MatchingWeightUpdateReqDto.java (가중치 수정 요청)
    ├── BookDto.java (예약 요청)
    └── CancelDto.java (취소 요청)
```

## 관련 문서
- [스케줄 도메인 개요](./README.md)
- [스케줄 엔티티 상세](./entities.md)
