---
domain: api
type: endpoint
related_files:
  - src/main/java/com/speaking/podo/applications/lecture/controller/LectureController.java
  - src/main/java/com/speaking/podo/applications/lecture/controller/LectureControllerV2.java
  - src/main/java/com/speaking/podo/applications/lecture/gateway/LectureGateway.java
  - src/main/java/com/speaking/podo/applications/lecture/service/query/LectureQueryService.java
  - src/main/java/com/speaking/podo/applications/lecture/service/command/LectureCommandService.java
  - src/main/java/com/speaking/podo/applications/lecture/service/command/TrialLectureCommandService.java
keywords: [lecture, 수업, 레슨, 코스, 체험수업, 예습, 복습, 교재]
last_verified: 2026-01-26
---

# 수업 API

## 엔드포인트 목록

### 1. 수업 목록 조회

#### GET /api/v1/lecture/podo/getPodoClassCourseList
- **설명**: 모든 수업 목록 조회 (TRIAL 제외 정규레슨)
- **인증**: 필요
- **요청 파라미터**:
  - `langType` (String, optional): 언어 타입 (기본값: 사용자 설정 언어)
  - `classLevel` (String, optional): 수업 레벨 (BEGINNER, INTERMEDIATE, ADVANCED 등)
  - `lessonTime` (Integer, optional): 수업 시간 (기본값: 25분)
  - `curriculumType` (String, optional): 커리큘럼 타입 (기본값: BASIC)
- **헤더**:
  - `Accept-Language`: 언어 코드 (기본값: ko)
- **응답**:
```json
{
  "resultCd": "200",
  "result": [
    {
      "classCourseId": 101,
      "courseName": "일상 회화 기초",
      "courseLevel": "BEGINNER",
      "lessonTime": 25,
      "totalLessons": 20,
      "completedLessons": 5,
      "thumbnailUrl": "https://...",
      "description": "일상 생활에서 자주 사용하는 표현 학습"
    }
  ]
}
```
- **파일**: `LectureController.java:251-279`, `LectureControllerV2.java:107-130`

#### GET /api/v2/lecture/podo/getPodoClassCourseList
- **설명**: 모든 수업 목록 조회 V2 (PodoResponse 사용)
- **응답**: `PodoResponse<PodoClassCourseListGetDto>`
- **파일**: `LectureControllerV2.java:107-130`

#### GET /api/v1/lecture/podo/getPodoTrialLectureList
- **설명**: 체험 수업 목록 조회
- **인증**: 필요
- **요청 파라미터**:
  - `langType` (String, optional): 언어 타입
- **헤더**:
  - `Accept-Language`: 언어 코드 (기본값: ko)
- **응답**: 체험 수업 목록
- **파일**: `LectureController.java:228-248`, `LectureControllerV2.java:340-359`

### 2. 수업 생성

#### POST /api/v2/lecture/podo/createPodoClass
- **설명**: 수강하기 (교재ID 기반으로 수업 존재여부 조회 및 생성, 유저 랜덤ID 구축)
- **인증**: 필요
- **요청 파라미터**:
  - `classCourseId` (String): 코스 ID
  - `randomUserKey` (String): 랜덤 사용자 키
- **응답**:
```json
{
  "resultCd": "200",
  "result": {
    "classId": 12345,
    "classCourseId": 101,
    "status": "CREATED",
    "roomUrl": "https://lemonboard.com/room/..."
  }
}
```
- **에러**:
  - `404`: 수강권 없음
  - `429`: 요청 제한 초과
  - `500`: 서버 오류
- **파일**: `LectureControllerV2.java:132-167`

#### POST /api/v2/lecture/podo/createPodoChat
- **설명**: 캐릭터챗 생성
- **인증**: 필요
- **요청 파라미터**:
  - `classCourseId` (String): 코스 ID
  - `randomUserKey` (String): 랜덤 사용자 키
- **응답**: 생성된 채팅 정보
- **파일**: `LectureControllerV2.java:169-209`

### 3. 수업 정보 조회

#### GET /api/v1/lecture/podo/getNextLectureInfo
- **설명**: 다음 진행하게 될 수업 조회
- **인증**: 필요
- **헤더**:
  - `Accept-Language`: 언어 코드 (기본값: ko)
- **응답**:
```json
{
  "resultCd": "200",
  "result": {
    "classId": 12345,
    "classCourseId": 101,
    "lessonNumber": 6,
    "scheduledDate": "2026-01-27T10:00:00",
    "tutorName": "김튜터",
    "status": "SCHEDULED"
  }
}
```
- **파일**: `LectureController.java:347-367`

#### GET /api/v1/lecture/podo/getNextLectureList
- **설명**: 예약된 수업 목록 조회
- **인증**: 필요
- **헤더**:
  - `Accept-Language`: 언어 코드 (기본값: ko)
- **응답**: 예약된 수업 리스트
- **파일**: `LectureController.java:369-389`, `LectureControllerV2.java:86-105`

#### GET /api/v2/lecture/podo/getCompletedLecture
- **설명**: 지난 수업 상세 조회
- **인증**: 필요
- **요청 파라미터**:
  - `class_id` (Long): 수업 ID
- **헤더**:
  - `Accept-Language`: 언어 코드 (기본값: ko)
- **응답**: `PodoResponse<CompletedLectureGetDto>`
- **파일**: `LectureControllerV2.java:54-66`

#### GET /api/v2/lecture/podo/getLectureList
- **설명**: 지난 수업 목록 조회 (페이지네이션)
- **인증**: 필요
- **요청 파라미터**:
  - `page` (Integer): 페이지 번호
  - `limit` (Integer): 페이지당 항목 수
  - `invoice_status` (String): 청구 상태
  - `order` (String): 정렬 순서
- **헤더**:
  - `Accept-Language`: 언어 코드 (기본값: ko)
- **응답**: `PodoResponse<LectureListGetDto>`
- **파일**: `LectureControllerV2.java:68-84`

### 4. 선행학습 (Prestudy)

#### POST /api/v2/lecture/podo/updatePreStudyTime
- **설명**: 선행학습 시간 업데이트 (진행 중)
- **인증**: 불필요 (randomUserKey로 검증)
- **요청 파라미터**:
  - `studentId` (String): 학생 ID
  - `classId` (String): 수업 ID
  - `randomUserKey` (String): 랜덤 사용자 키
- **응답**:
```json
{
  "resultCd": 200,
  "result": true
}
```
- **파일**: `LectureControllerV2.java:211-244`

#### POST /api/v2/lecture/podo/finishPreStudyTime
- **설명**: 선행학습 완료 처리
- **인증**: 불필요
- **요청 파라미터**:
  - `studentId` (String): 학생 ID
  - `classId` (String): 수업 ID
  - `randomUserKey` (String): 랜덤 사용자 키
- **응답**:
```json
{
  "resultCd": 200
}
```
- **파일**: `LectureControllerV2.java:246-259`

#### GET /api/v2/lecture/podo/getCompPrestudyList
- **설명**: 완료된 예습용 수업 목록 조회
- **인증**: 필요
- **응답**: 완료된 선행학습 목록
- **파일**: `LectureControllerV2.java:261-277`

### 5. 수업 레벨 및 코스

#### GET /api/v1/lecture/podo/getPodoClassLevel
- **설명**: PODO 수업 레벨 조회
- **인증**: 필요
- **요청 파라미터**:
  - `langType` (String): 언어 타입
  - `lessonTime` (Integer, optional): 수업 시간 (기본값: 25)
- **응답**:
```json
{
  "resultCd": "200",
  "result": [
    {
      "level": "BEGINNER",
      "displayName": "초급",
      "description": "기초 회화"
    },
    {
      "level": "INTERMEDIATE",
      "displayName": "중급",
      "description": "일상 회화"
    }
  ]
}
```
- **파일**: `LectureController.java:407-420`

#### GET /api/v2/lecture/getNextCourse
- **설명**: 다음 코스 조회
- **인증**: 필요
- **요청 파라미터**:
  - `curriculumType` (String): 커리큘럼 타입
  - `lessonTime` (Integer): 수업 시간
- **헤더**:
  - `Accept-Language`: 언어 코드 (기본값: ko)
- **응답**: `PodoResponse<NextCourseGetDto>`
- **파일**: `LectureControllerV2.java:384-394`

#### GET /api/v2/lecture/getLectureAndPrestudy
- **설명**: 수업, 예습 아이디 조회
- **인증**: 필요
- **요청 파라미터**:
  - `classCourseId` (Integer): 코스 ID
- **응답**: `PodoResponse<LectureAndPrestudyGetDto>`
- **파일**: `LectureControllerV2.java:396-404`

### 6. 체험수업

#### POST /api/v2/lecture/podo/changeTrialClassLevel
- **설명**: 체험수업 레벨 변경
- **인증**: 필요 (향후 추가 예정)
- **요청 바디**: `ChangeTrialClassLevelDto`
```json
{
  "userId": 123,
  "langType": "EN",
  "paymentId": 456,
  "classLevel": "INTERMEDIATE"
}
```
- **응답**:
```json
{
  "resultCd": "200",
  "result": "Success"
}
```
- **에러 코드**:
  - `404`: ClassTicketNotFound, TutorNotFound
  - `400`: LangTypeNotMatch, NotTrialClass
  - `500`: InternalServerError
- **파일**: `LectureControllerV2.java:279-316`

#### GET /api/v1/lecture/podo/getTrialClassList
- **설명**: 언어별 체험학습 조회
- **인증**: 필요
- **응답**: 체험 수업 목록
- **파일**: `LectureController.java:391-405`

### 7. 수업 이력

#### GET /api/v1/lecture/podo/getPodoLectureHistoryList
- **설명**: 이전 수업 목록 조회 (특정 코스)
- **인증**: 필요
- **요청 파라미터**:
  - `classCourseId` (String): 코스 ID
- **헤더**:
  - `Accept-Language`: 언어 코드 (기본값: ko)
- **응답**: 해당 코스의 이전 수업 리스트
- **파일**: `LectureController.java:281-297`

### 8. 수업방 관리

#### POST /api/v2/lecture/podo/copyPodoClassRoom
- **설명**: 수업방 복제
- **인증**: 필요
- **요청 파라미터**:
  - `class_id` (Long): 복제할 수업 ID
- **응답**: `PodoResponse<LectureRoomCopyResponseDto>`
- **파일**: `LectureControllerV2.java:42-52`

#### POST /api/v1/lecture/podo/createPodoClassPage
- **설명**: 수업 교재 페이지 생성
- **인증**: 불필요
- **요청 파라미터**:
  - `classId` (String): 수업 ID
- **응답**: 생성된 페이지 정보
- **파일**: `LectureController.java:317-329`

#### POST /api/v2/lecture/podo/changePagecallToLemonboard
- **설명**: Pagecall 수업을 Lemonboard로 변경
- **인증**: 불필요
- **요청 파라미터**:
  - `classId` (String): 수업 ID
  - `studentId` (String): 학생 ID
- **응답**:
```json
{
  "resultCd": "200",
  "result": "Success"
}
```
- **파일**: `LectureControllerV2.java:331-338`

### 9. 레모네이드 (Legacy)

#### GET /api/v1/lecture/getLeLectureEnterInfo
- **설명**: 레모네이드 수업입장 정보 조회
- **인증**: 필요
- **요청 파라미터**:
  - `classId` (Integer): 수업 ID
- **파일**: `LectureController.java:48-61`

#### GET /api/v2/lecture/getLeLectureEnterInfo
- **설명**: 레모네이드 수업입장 정보 조회 V2
- **인증**: 필요
- **요청 파라미터**:
  - `classId` (Integer): 수업 ID
- **응답**: `LectureEnterInfoDto`
- **파일**: `LectureControllerV2.java:318-329`

#### GET /api/v1/lecture/getLeRecentLectureInfo
- **설명**: 레모네이드 최근 진행 수업 조회
- **인증**: 필요
- **파일**: `LectureController.java:104-133`

### 10. 신규 레슨탭

#### GET /api/v2/lecture/getLectureCourseList
- **설명**: 신규 레슨탭 조회
- **인증**: 필요
- **요청 파라미터**:
  - `langType` (String): 언어 타입
- **헤더**:
  - `Accept-Language`: 언어 코드 (기본값: ko)
- **응답**: `LectureTabDto`
- **파일**: `LectureControllerV2.java:369-382`

## 수업 상태

### 상태 코드
- `SCHEDULED`: 예약됨
- `IN_PROGRESS`: 진행 중
- `COMPLETED`: 완료
- `CANCELLED`: 취소
- `NO_SHOW`: 노쇼

## 관련 서비스

### LectureGateway
- 수업 비즈니스 로직 게이트웨이

### LectureQueryService
- 수업 조회 서비스

### LectureCommandService
- 수업 생성/수정/삭제 서비스

### TrialLectureCommandService
- 체험수업 전용 서비스

## 주요 정책

1. **수업 생성**: 수강권이 있어야 수업 생성 가능
2. **선행학습**: 수업 전 선행학습 완료 권장
3. **수업 시간**: 25분/50분 옵션
4. **체험수업**: 레벨 변경 가능 (1회)
5. **랜덤 사용자 키**: 동시 접속 방지용
