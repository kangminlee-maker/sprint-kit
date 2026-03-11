---
domain: lecture
document_type: policies
version: 1.0.0
created_at: 2026-01-26
author: Claude AI
language: ko
tags:
  - lecture
  - policy
  - business-rules
description: 수업 도메인 비즈니스 정책 상세
source_files:
  - src/main/java/com/speaking/podo/applications/lecture/service/command/LectureCommandServiceImpl.java
  - src/main/java/com/speaking/podo/applications/lecture/gateway/LectureGateway.java
  - src/main/java/com/speaking/podo/applications/lecture/repository/LectureRepository.java
---

# 수업 정책 상세

## 1. 수업 상태 전환 정책

### 1.1 두 가지 상태 Enum 구분 (CRITICAL)

수업 도메인에는 **두 가지 상태 체계**가 존재하며, 각각 다른 용도로 사용됩니다.

#### LectureStatus (기본 상태)

**파일 위치**: `src/main/java/com/speaking/podo/applications/lecture/domain/enums/LectureStatus.java`

```
+------+------+--------+
| 상태  | 코드 | 설명   |
+------+------+--------+
| NONE   | 0    | 없음   |
| REGIST | 1    | 등록   |
| DONE   | 2    | 완료   |
| CANCEL | 3    | 취소   |
+------+------+--------+
```

**사용 컬럼**: `GT_CLASS.CREDIT`

**용도**:
- 수업의 가장 기본적인 상태 표현
- 등록/완료/취소의 단순한 생명주기 관리
- 레거시 시스템과의 호환성 유지

#### InvoiceStatus (정산/청구 상태)

**파일 위치**: `src/main/java/com/speaking/podo/applications/lecture/domain/Lecture.java` (Line 224, Inner Enum)

```
+----------------+------------------------+
| 상태            | 설명                  |
+----------------+------------------------+
| CREATED        | 생성됨                 |
| RESERVED       | 예약됨                 |
| COMPLETED      | 완료됨                 |
| NOSHOW_S       | 학생 노쇼              |
| NOSHOW_BOTH    | 양측 노쇼              |
| CANCEL_NOSHOW_T| 튜터 노쇼로 인한 취소   |
| CANCEL         | 취소                  |
| CANCEL_PAID    | 유료 취소              |
+----------------+------------------------+
```

**사용 컬럼**: `GT_CLASS.INVOICE_STATUS`

**용도**:
- 정산 및 환불 처리를 위한 세부 상태
- 노쇼 유형별 구분 (학생/튜터/양측)
- 취소 유형별 구분 (일반/유료)

### 1.2 상태 전환 규칙

#### 정상 수업 흐름

```
CREATED (생성)
    --> RESERVED (예약 확정, 튜터 배정)
    --> COMPLETED (수업 완료)
```

#### 취소 흐름

```
RESERVED (예약됨)
    --> CANCEL (일반 취소, 수업 2시간 이상 전: 패널티 없음)
    --> CANCEL (일반 취소, 수업 2시간 이내 ~ 1시간 전: 수강권 차감 + 패널티)
    --> CANCEL_PAID (위약금 발생 취소, 수업 1시간 이내: 수강권 차감 + 패널티 + 튜터 정산)
```

**참고**: 무제한권 취소 시 72시간(3일) 예약 금지 패널티

#### 노쇼 흐름

```
RESERVED (예약됨)
    --> NOSHOW_S (학생 노쇼: 학생 미참석)
    --> CANCEL_NOSHOW_T (튜터 노쇼: 튜터 미참석으로 인한 취소)
    --> NOSHOW_BOTH (양측 노쇼: 모두 미참석)
```

### 1.3 상태 변경 기록

모든 상태 변경은 `le_class_status_history` 테이블에 기록됩니다.

**기록 항목**:
- `class_id`: 수업 ID
- `action_type`: 변경 주체 (STUDENT / TEACHER / ADMIN)
- `user_id`: 변경자 ID
- `before_status`: 변경 전 상태
- `after_status`: 변경 후 상태
- `utc_created_at`: 변경 시각 (UTC)

---

## 2. 수업 생성 정책

### 2.1 수업 생성 조건

수업 생성 시 다음 조건을 확인합니다:

1. **수강권(Ticket) 유효성**
   - 활성화된 수강권 보유 필수
   - 언어별, 커리큘럼별 수강권 매칭

2. **중복 수업 방지**
   - 동일 시간대 중복 예약 불가
   - 동일 코스의 진행중인 수업이 있으면 기존 수업 반환

3. **Redis 락 기반 동시성 제어**
   - 수업 생성 시 2초간 락 획득
   - 락 획득 실패 시 `TooManyRequest` 에러

### 2.2 수업 유형별 생성 로직

#### 정규 수업 (PODO)

```
1. 코스(classCourseId) 기반 기존 수업 존재 여부 확인
2. 수강권 조회 및 유효성 검증
3. 본 수업(GT_CLASS) 생성
4. 선행학습 수업 생성 (isPrestudy='Y')
5. 레몬보드 수업방 생성
6. 선행학습 로그 생성
```

#### 체험 수업 (PODO_TRIAL)

```
1. 체험 수강권 확인
2. 체험 수업 생성 (CITY='PODO_TRIAL')
3. 레벨 테스트 결과에 따른 코스 배정
```

#### AI 챗 수업 (AI_CHAT)

```
1. 진행중인 AI 챗 수업 확인
2. 수강권 조회
3. AI 챗 수업 생성
4. 레몬보드 룸 생성 (duration: 20분, 체험시 5분)
```

---

## 3. 선행학습(Prestudy) 정책

### 3.1 선행학습 시간 추적

선행학습 시간은 Redis 락을 통해 실시간 추적됩니다.

**락 키 형식**: `prestudy:{studentId}`
**락 값 형식**: `{studentId}|{classId}|{randomUserKey}`
**락 유효 시간**: 90초 (자동 갱신)

### 3.2 선행학습 완료 조건

| 조건 | 값 | 설명 |
|------|-----|------|
| 최소 학습 시간 | 8분 | 8분 이상 학습 시 완료 인정 |
| 자동 완료 | 락 만료 시 | 1분 감산 후 완료 처리 |
| 수동 완료 | API 호출 | `/podo/finishPreStudyTime` |

### 3.3 선행학습 완료 후 처리

선행학습 완료 시 다음 알림톡이 비활성화됩니다:

**예습 시작 독려 알림 비활성화**:
- `PD_FIRSTCLASS_PRE`: 첫 수업 예습 안내
- `PD_BIZ_PRESTUDY1`: 비즈니스 예습 안내

**예습 완료 후 알림 비활성화** (8분 이상 학습 시):
- `PD_FIRSTCLASS_PRE`, `PD_FIRSTCLASS_PRE1`, `PD_FIRSTCLASS_PRE2`
- `PD_FIRSTCLASS_RE1_A`, `PD_FIRSTCLASS_RE1_B`, `PD_FIRSTCLASS_RE1_C`
- `PD_BIZ_PRESTUDY1`, `PD_BIZ_PRESTUDY2`

---

## 4. 수업 예약 정책

### 4.1 예약 시 업데이트 항목

수업 예약(`updateLectureToReserved`) 시 다음 항목이 업데이트됩니다:

| 컬럼 | 설명 |
|------|------|
| `TEACHER_USER_ID` | 튜터 ID |
| `CLASS_TICKET_ID` | 수강권 ID |
| `INVOICE_STATUS` | RESERVED |
| `SCHEDULE_REG_AT` | 예약 등록 시각 |
| `CLASS_DATE` | 수업 날짜 |
| `CLASS_START_TIME` | 수업 시작 시간 |
| `CLASS_END_TIME` | 수업 종료 시간 |
| `ZOOM_ACCOUNT` | 학생의 레몬보드 토큰 |

### 4.2 예약 충돌 검증

튜터 및 학생의 시간 중복을 검증합니다:

**튜터 중복 검증**:
```sql
SELECT count(1) FROM GT_CLASS
WHERE teacher_user_id = :tutorId
  AND class_date = :classDate
  AND is_prestudy = 'N'
  AND invoice_status = 'RESERVED'
  AND (시간 범위 중복 조건)
```

**학생 중복 검증**:
```sql
SELECT count(1) FROM GT_CLASS
WHERE student_user_id = :studentId
  AND class_date = :classDate
  AND is_prestudy = 'N'
  AND invoice_status = 'RESERVED'
  AND (시간 범위 중복 조건)
```

---

## 5. 수업 취소 정책

### 5.1 취소 유형

| 유형 | InvoiceStatus | LectureStatus | 조건 |
|------|---------------|---------------|------|
| 일반 취소 | CANCEL | CANCEL(3) | 수업 2시간 이상 전 |
| 일반 취소 (패널티) | CANCEL | CANCEL(3) | 수업 2시간 이내 ~ 1시간 전 |
| 유료 취소 | CANCEL_PAID | CANCEL(3) | 수업 1시간 이내 |
| 튜터 노쇼 취소 | CANCEL_NOSHOW_T | CANCEL(3) | 튜터 미참석 |

**취소 정책 상세** (소스: `PodoScheduleServiceImplV2.java:1192-1243`):
- **2시간 이상 전 취소**: 수강권 미차감, 패널티 없음
- **2시간 이내 ~ 1시간 전 취소**: 수강권 차감, CANCEL 상태, 무제한권은 72시간 패널티 (소스: `PodoScheduleServiceImplV2.java:1195` - `between < 120`)
- **1시간 이내 취소**: 수강권 차감, CANCEL_PAID 상태 (튜터 정산), 무제한권은 72시간 패널티 (소스: `PodoScheduleServiceImplV2.java:1229` - `between < 60`)

### 5.2 취소 시 업데이트

```sql
UPDATE GT_CLASS
SET credit = 3,  -- LectureStatus.CANCEL
    update_reason = '학생의 취소 요청',
    cancel_at = :kstNow,
    invoice_status = :invoiceStatus
WHERE id = :lectureId
```

### 5.3 선행학습 취소

본 수업 취소 시 연관된 선행학습도 취소됩니다:

```sql
UPDATE GT_CLASS
SET class_state = 'CANCEL_PRESTUDY',
    cancel_at = :kstNow
WHERE id = :prestudyId
```

---

## 6. 수업 완료 정책

### 6.1 완료 가능 상태

다음 상태의 수업만 "완료" 목록에 표시됩니다:

- `COMPLETED`: 정상 완료
- `NOSHOW_S`: 학생 노쇼
- `NOSHOW_BOTH`: 양측 노쇼
- `CANCEL_NOSHOW_T`: 튜터 노쇼 취소
- `PREFINISH` (classState) + `RESERVED`: 가완료 상태

### 6.2 진단(Diagnosis) 상태 처리

수업 완료 후 AI 진단 처리 상태:

| 상태 | 설명 | 표시 상태 |
|------|------|----------|
| `DONE` | 진단 완료 | DONE |
| `FAILED_CRITICAL` | 크리티컬 실패 | FAILED |
| `FAILED_MERGE` | 병합 실패 | FAILED |
| `FAILED_CHUNKING` | 청킹 실패 | FAILED |
| `FAILED_FEEDBACK` | 피드백 실패 | FAILED |
| `FAILED_QUESTION` | 질문 실패 | FAILED |

---

## 7. 다음 수업 조회 정책

### 7.1 조회 기준

1. **수업 이력이 있는 경우**
   - 가장 최근 완료된 수업의 다음 레슨 표시
   - 동일 레벨 내 다음 주차 코스 조회

2. **수업 이력이 없는 경우**
   - 레벨 테스트 결과 기반 시작 레슨 표시
   - 해당 레벨의 대표 주차 코스 표시

### 7.2 수강권 기반 필터링

- `TRIAL` 구독은 제외
- `BASIC` 커리큘럼 수강권만 레벨 기반 조회 지원
- 언어별 수강권 매칭 필수

---

## 8. 수업 통계 조회 (Repository)

### 8.1 사용자 리캡 메트릭 조회

**파일**: `src/main/java/com/speaking/podo/applications/lecture/repository/dsl/LectureDslRepository.java`

사용자의 전체 수업 통계를 조회하는 쿼리 메서드:

```java
RecapMetricsDTO getUserRecapMetrics(Integer userId);
```

**조회 조건**:
- `studentId = userId`
- `status = DONE` (완료된 수업만)
- `tutorId != 0` (튜터가 배정된 수업만)
- `city = 'PODO_BASIC'` (PODO 기본 수업만)

**반환 필드**:
- `totalLessonCount`: 총 수업 횟수
- `totalTutorCount`: 수업한 튜터 수 (DISTINCT)
- `totalLessonTime`: 총 수업 시간 (분) = `totalLessonCount * 39`

**사용처**: Recap 서비스에서 사용자 학습 이력 요약에 활용

---

## 9. 수업방 관리 정책

### 8.1 수업방 플랫폼

| 플랫폼 | 용도 | 상태 |
|--------|------|------|
| 레몬보드(Lemonboard) | 실시간 화상 수업 | 현행 |
| 페이지콜(Pagecall) | 교재 기반 수업 | 레거시 |

### 8.2 수업방 복제

완료된 수업의 복습을 위해 수업방 복제 기능 제공:

```
1. 기존 수업(Lecture) 조회
2. 기존 수업방(LectureOnline) 조회
3. 레몬보드 룸 복제 생성 (PERSONAL 타입)
4. 학생 멤버 추가
5. 새 수업방 URL 반환
```

### 8.3 페이지콜에서 레몬보드 전환

기존 페이지콜 수업을 레몬보드로 전환:

```
1. 수업 코스의 레몬보드 템플릿 키 조회
2. 레몬보드 룸 생성 (PUBLIC 타입)
3. 학생/튜터 멤버 추가
4. 수업방 URL 생성 및 저장
5. 기존 페이지콜 온라인 정보 삭제
```
