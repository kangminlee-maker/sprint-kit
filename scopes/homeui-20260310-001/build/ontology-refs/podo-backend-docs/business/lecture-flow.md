---
domain: business
type: flow
related_files:
  - src/main/java/com/speaking/podo/applications/lecture/service/command/LectureCommandServiceImpl.java
  - src/main/java/com/speaking/podo/applications/lecture/domain/Lecture.java
  - src/main/java/com/speaking/podo/applications/lecture/domain/LectureOnline.java
keywords: [수업, 예약, 예습, 화상, 레몬보드, 튜터]
last_verified: 2026-01-26
---

# 수업 예약 및 진행 플로우

## 개요
학생이 수업을 생성하고, 예습하고, 튜터와 실시간 수업을 진행하는 전체 비즈니스 플로우를 설명합니다.

## 수업 타입

### 1. PODO (기본 수업)
- **설명**: 25분 1:1 화상 수업
- **교재**: 레벨별 교재 제공
- **예습**: 필수 (8분 이상 권장)

---

### 2. PODO_TRIAL (체험 수업)
- **설명**: 무료 체험 수업
- **교재**: 체험용 교재 + 인트로/아웃트로
- **예습**: 필수

---

### 3. PODO_BUSINESS (비즈니스 수업)
- **설명**: 비즈니스 영어 수업
- **교재**: 비즈니스 교재
- **예습**: 필수

---

### 4. SMART_TALK (스마트톡)
- **설명**: AI 채팅 학습
- **교재**: 없음 (AI 대화)
- **예습**: 없음

---

### 5. AI_CHAT (AI 채팅)
- **설명**: AI와의 실시간 대화
- **교재**: 없음
- **예습**: 없음

---

## 전체 플로우

```
1. 활성 수강권 확인
   ↓
2. 수업 생성 (Lecture + LectureOnline)
   ↓
3. 예습 진행 (선택)
   ↓
4. 튜터 매칭 및 예약
   ↓
5. 화상 수업 진행
   ↓
6. 수업 완료 및 피드백
```

---

## 상세 단계

### 1단계: 활성 수강권 확인
**비즈니스 규칙**:
- 언어 타입 일치
- 커리큘럼 타입 일치
- 잔여 횟수 > 0
- 만료일 >= 오늘

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/ticket/service/TicketServiceV2Impl.java`

**코드 위치**: TicketServiceV2Impl.java:122-169

**예시**:
```java
Ticket activeTicket = ticketService.getActiveTicketForLecture(
    studentId,
    "EN",
    DateTimeUtils.kstNow(),
    false,  // isBusiness
    false   // isSmartTalk
);
```

---

### 2단계: 수업 생성
**비즈니스 규칙**:
- Lecture 엔티티 생성 (수업 메타데이터)
- LectureOnline 엔티티 생성 (화상 수업 룸 정보)
- 레몬보드 룸 생성 (화상 수업 플랫폼)

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/lecture/service/command/LectureCommandServiceImpl.java`
- `modules/lemonboard/adapter/LemonBoardAdapter.java`

**코드 위置**: LectureCommandServiceImpl.java:264-325

---

#### 2-1. Lecture 생성
**비즈니스 규칙**:
- `status` = "REGIST" (예약 대기)
- `invoiceStatus` = "CREATED" (생성됨)
- `classDate` = 2999-12-31 (예약 전)
- `classCourseId` = 선택한 코스 ID
- `ticketId` = 활성 티켓 ID

**코드 위置**: LectureCommandServiceImpl.java:737-771

**예시**:
```java
Lecture lecture = new Lecture(
    studentId,
    0,  // tutorId (아직 배정 안됨)
    "PODO_BASIC",
    LocalDateTime.now(),
    LocalDate.of(2999, 12, 31),  // 예약 전
    LocalTime.of(0, 0, 0),
    LocalTime.of(0, 0, 0),
    LectureStatus.REGIST,
    "0",
    1,
    "PODO",
    courseId,
    ticketId,
    "EN",
    null,
    Lecture.InvoiceStatus.CREATED,
    "N"  // isPrestudy
);
```

---

#### 2-2. LectureOnline 생성
**비즈니스 규칙**:
- 레몬보드 룸 ID 저장
- 학생용 URL 생성
- 튜터용 URL은 예약 시 생성

**코드 위치**: LectureCommandServiceImpl.java:775-825

---

#### 2-3. 레몬보드 룸 생성
**비즈니스 규칙**:
- 수업용: PUBLIC 타입 룸
- 예습용: PERSONAL 타입 룸
- 템플릿: 코스별 레몬보드 템플릿 키

**코드 위치**: LectureCommandServiceImpl.java:98-115

**예시**:
```java
LemonBoardRoom room = lemonBoardAdapter.createRoom(
    String.valueOf(studentId),
    String.valueOf(courseId),
    RoomType.PUBLIC.getValue(),  // 수업용
    lemonboardTemplateKey
);
```

---

### 3단계: 예습 진행
**비즈니스 규칙**:
- 예습 수업 자동 생성 (Lecture with isPrestudy = "Y")
- 예습 로그 기록 (LecturePrestudyLog)
- Redis Lock으로 동시 예습 방지
- 8분 이상 권장 (완료 조건 아님)

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/lecture/service/command/LectureCommandServiceImpl.java`

**코드 위치**: LectureCommandServiceImpl.java:395-432

---

#### 3-1. 예습 수업 생성
**비즈니스 규칙**:
- 본 수업과 동일한 코스
- `isPrestudy` = "Y"
- 레몬보드 PERSONAL 룸

**코드 위치**: LectureCommandServiceImpl.java:280-281

---

#### 3-2. 예습 로그 생성
**비즈니스 규칙**:
- 예습 시작 시: `createdAt` 기록
- 예습 중: 1분마다 락 연장 (90초 TTL)
- 예습 종료 시: `finishedAt` 기록

**코드 위치**: LectureCommandServiceImpl.java:293, 624-632

**예시**:
```java
// 예습 시작
preStudyRepository.insertPreStudyLog(studentId, classId);

// 예습 중 (1분마다 폴링)
lockManager.extendLock(lockKey, lockValue, 90);

// 예습 종료
preStudyRepository.updateByIdIn(targetIds, finishedAt);
```

---

#### 3-3. 예습 락 메커니즘
**비즈니스 규칙**:
- Lock Key: `prestudy:{studentId}`
- Lock Value: `{studentId}|{classId}|{randomUserKey}`
- 동일 학생이 다른 수업 예습 시작 시 기존 예습 자동 종료

**코드 위置**: LectureCommandServiceImpl.java:302-318

**예시**:
```
학생이 EN 코스 예습 중
→ JP 코스 예습 시작
→ EN 코스 예습 자동 종료
→ JP 코스 예습 락 생성
```

---

#### 3-4. 예습 완료 처리
**비즈니스 규칙**:
- 락 해제
- `finishedAt` 기록
- 예습 독려 알림톡 비활성화

**코드 위치**: LectureCommandServiceImpl.java:635-677

---

### 4단계: 튜터 매칭 및 예약
**비즈니스 규칙**:
- 학생이 원하는 날짜/시간 선택
- 가능한 튜터 목록 조회
- 학생이 튜터 선택
- 예약 확정

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/user/service/TutorService.java` (별도 문서 참조)

---

#### 4-1. 예약 확정
**비즈니스 규칙**:
- Lecture 업데이트:
  - `tutorId` = 선택한 튜터 ID
  - `classDate` = 예약 날짜
  - `classStartTime` = 수업 시작 시간
  - `classEndTime` = 수업 종료 시간
  - `status` = "RESERVED"
  - `invoiceStatus` = "RESERVED"
- LectureOnline 업데이트:
  - 튜터용 레몬보드 URL 생성

**코드 위치**: LectureCommandServiceImpl.java:701-716

**예시**:
```java
lectureRepository.updateLectureToReserved(
    lectureId,
    tutorId,
    ticketId,
    "RESERVED",
    DateTimeUtils.kstNow(),
    "2026-01-27",  // classDate
    "10:00:00",    // startAt
    "10:25:00"     // endAt
);
```

---

### 5단계: 화상 수업 진행
**비즈니스 규칙**:
- 수업 시작 5분 전부터 입장 가능
- 레몬보드 룸으로 학생/튜터 입장
- 실시간 화상 수업 진행
- 교재 자동 로드 (레몬보드)

**관련 파일**:
- `modules/lemonboard/adapter/LemonBoardAdapter.java`

---

#### 5-1. 수업 상태 전환
**비즈니스 규칙**:
- 수업 시작 시: `status` = "START"
- 수업 진행 중: 상태 유지
- 수업 종료 시: `status` = "FINISH"

**코드 위치**: LectureCommandServiceImpl.java:689-691

---

#### 5-2. 교재 로드
**비즈니스 규칙**:
- 레몬보드 룸에 교재 페이지 자동 업로드
- 체험 수업: 인트로 + 교재 + 아웃트로
- 일반 수업: 교재만

**코드 위치**: LectureCommandServiceImpl.java:488-593

**예시**:
```
체험 수업 (레벨 A)
→ 인트로 3페이지
→ 교재 5페이지
→ 아웃트로 2페이지
→ 총 10페이지
```

---

### 6단계: 수업 완료 및 피드백
**비즈니스 규칙**:
- Lecture 업데이트:
  - `status` = "FINISH"
  - `invoiceStatus` = "FINISHED"
- Ticket 업데이트:
  - `nUsed` += 1
  - `usedMin` += 25 (수업 시간)
- 피드백 작성 (튜터)

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/ticket/service/TicketServiceV2Impl.java`

**코드 위치**: TicketServiceV2Impl.java:116-119

---

## 수업 취소 플로우

### 1. 취소 요청
**비즈니스 규칙**:
- 언제든지 취소 가능
- 수업 시작 2시간 전: 수강권 복구
- 수업 시작 2시간 이내: 수강권 소진, 무제한권은 72시간 패널티

---

### 2. 수업 취소 처리
**비즈니스 규칙**:
- Lecture 업데이트:
  - `status` = "CANCEL"
  - `invoiceStatus` = "CANCELED" 또는 "CANCEL_PAID"
  - `cancelReason` = "학생의 취소 요청"
- 2시간 전 취소:
  - Ticket: `nUsed` 변동 없음
- 2시간 이내 ~ 1시간 전 취소:
  - Ticket: `nUsed` += 1, invoiceStatus = "CANCEL"
  - 소스: `PodoScheduleServiceImplV2.java:1195` - `between < 120` (분)
- 1시간 이내 취소:
  - Ticket: `nUsed` += 1, invoiceStatus = "CANCEL_PAID" (튜터 정산)
  - 소스: `PodoScheduleServiceImplV2.java:1229` - `between < 60` (분)

**소스 코드**: `PodoScheduleServiceImplV2.java:1192-1243`

**코드 위置**: LectureCommandServiceImpl.java:718-735

---

### 3. 예습 취소 처리
**비즈니스 규칙**:
- 예습 Lecture 상태: "CANCEL_PRESTUDY"
- 예습 로그: `finishedAt` 기록
- 락 해제

**코드 위治**: LectureCommandServiceImpl.java:722-735

---

## 예습 관련 특수 규칙

### 예습 패스 기능
**비즈니스 규칙**:
- 예습 없이 바로 수업 예약 가능
- 예습 시간 8분 자동 기록 (강제 완료)
- 예습 독려 알림톡 비활성화

**코드 위置**: LectureCommandServiceImpl.java:828-850

**예시**:
```java
passPrestudy(studentId, lectureId, prestudyId);
→ 예습 시간 8분 자동 기록
→ 예습 완료 처리
→ 수업 예약 가능
```

---

### 예습 시간 제한
**비즈니스 규칙**:
- 최소 시간: 없음 (1초도 OK)
- 권장 시간: 8분 이상
- 최대 시간: 없음

---

### 예습 만료
**비즈니스 규칙**:
- 예습 시작 후 90초간 활동 없으면 자동 종료
- 락 만료 → 예습 로그 `finishedAt` 기록

**코드 위置**: LectureCommandServiceImpl.java:635-677

---

## 스마트톡 특수 규칙

### 스마트톡 수업 생성
**비즈니스 규칙**:
- 예습 없음
- 레몬보드 룸 duration = 5분 (체험) or 20분 (정규)
- AI와의 대화 학습

**코드 위치**: LectureCommandServiceImpl.java:372

---

### AI 채팅 수업 생성
**비즈니스 규칙**:
- 예습 없음
- 레몬보드 룸 없음 (AI 채팅만)
- 수업 시간 제한 없음

**코드 위치**: LectureCommandServiceImpl.java:328-393

---

## 예외 처리

### 활성 티켓 없음
**에러 코드**: `TicketNotFound`
**처리**: 수업 생성 불가, 구독 안내

---

### 레몬보드 룸 생성 실패
**처리**:
- 재시도 (3회)
- 실패 시 슬랙 알림
- 사용자에게 에러 안내

---

### 예약 충돌
**처리**:
- 학생 또는 튜터가 이미 예약된 시간
- 에러 반환

---

## 관련 도메인

### 수강권 정책
- [수강권 정책](./ticket-policy.md)

### 튜터 매칭
- [튜터 매칭](./tutor-matching.md)

---

## 주요 메서드 요약

| 메서드 | 설명 | 파일 라인 |
|--------|------|-----------|
| `createPodoClassV3()` | 수업 생성 | LectureCommandServiceImpl.java:266 |
| `processPrestudy()` | 예습 처리 | LectureCommandServiceImpl.java:396 |
| `updatePreStudyTime()` | 예습 시간 업데이트 | LectureCommandServiceImpl.java:624 |
| `finishPreStudy()` | 예습 완료 | LectureCommandServiceImpl.java:638 |
| `updateLectureToReserved()` | 예약 확정 | LectureCommandServiceImpl.java:701 |
| `updateLectureToCancel()` | 취소 처리 | LectureCommandServiceImpl.java:718 |
| `passPrestudy()` | 예습 패스 | LectureCommandServiceImpl.java:828 |
| `createPagecallRoomPages()` | 교재 로드 | LectureCommandServiceImpl.java:505 |

---

**최종 업데이트**: 2026-01-26
