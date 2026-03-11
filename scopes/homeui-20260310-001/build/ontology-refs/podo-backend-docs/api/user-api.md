---
domain: api
type: endpoint
related_files:
  - src/main/java/com/speaking/podo/applications/user/controller/UserController.java
  - src/main/java/com/speaking/podo/applications/user/controller/UserControllerV2.java
  - src/main/java/com/speaking/podo/applications/user/gateway/UserGateway.java
  - src/main/java/com/speaking/podo/applications/user/service/UserInfoService.java
  - src/main/java/com/speaking/podo/applications/user/service/UserStatusService.java
  - src/main/java/com/speaking/podo/applications/user/service/UserHoldService.java
  - src/main/java/com/speaking/podo/applications/user/service/TutorService.java
keywords: [user, 사용자, 회원, 프로필, 튜터, 페널티, 홀딩, OTP]
last_verified: 2026-01-26
---

# 사용자 API

## 엔드포인트 목록

### 1. 사용자 정보 조회

#### GET /api/v1/user/podo/getInfo
- **설명**: PODO 사용자 계정 정보 조회
- **인증**: 필요
- **요청 파라미터**: 없음 (인증된 사용자 정보 사용)
- **응답**:
```json
{
  "resultCd": "200",
  "result": {
    "id": "123",
    "email": "user@example.com",
    "name": "홍길동",
    "classType": "PODO",
    ...
  }
}
```
- **관련 정책**: 사용자 인증, 클래스 타입별 정보 조회
- **파일**: `UserController.java:233-263`

#### GET /api/v1/user/podo/user/me
- **설명**: 현재 사용자 정보 조회 (v2 스타일)
- **인증**: 필요
- **응답**: `PodoResponse<PodoUserDto>`
- **파일**: `UserController.java:265-270`

### 2. 사용자 계정 생성/확인

#### POST /api/v1/user/podo/isExists
- **설명**: PODO 계정 존재 여부 조회
- **인증**: 불필요
- **요청 바디**: `ReqPodoUserDto`
```json
{
  "email": "user@example.com",
  "classType": "PODO"
}
```
- **응답**:
```json
{
  "resultCd": "200",
  "result": {
    "exists": true,
    "userId": "123"
  }
}
```
- **파일**: `UserController.java:148-162`

#### POST /api/v1/user/podo
- **설명**: PODO 계정 생성
- **인증**: 불필요
- **요청 바디**: `ReqPodoUserDto`
- **응답**: 생성된 사용자 정보
- **파일**: `UserController.java:164-177`

#### POST /api/v1/user/podo/classTicketWithTrialClass
- **설명**: 체험 수강권 지급 및 체험 수업 생성
- **인증**: 불필요
- **요청 바디**: `ReqPodoUserDto` (id, email, classType 포함)
- **응답**: 생성된 수강권 및 수업 정보
- **파일**: `UserController.java:179-202`

### 3. 체험수업 STEP 관리

#### GET /api/v1/user/podo/getTrialStepInfo
- **설명**: 체험수업 STEP 정보 조회
- **인증**: 필요
- **응답**:
```json
{
  "resultCd": "200",
  "result": {
    "stepCode": "STEP_01",
    "completedAt": "2026-01-20T..."
  }
}
```
- **파일**: `UserController.java:272-290`

#### POST /api/v1/user/podo/insertStep
- **설명**: 체험수업 STEP 저장
- **인증**: 필요
- **요청 바디**: `PodoUserStepDto`
```json
{
  "stepCode": "STEP_02"
}
```
- **응답**: 저장 결과
- **파일**: `UserController.java:292-307`

### 4. 페널티 및 홀딩 조회

#### GET /api/v1/user/podo/penaltyList
- **설명**: 페널티 목록 조회
- **인증**: 필요
- **요청 파라미터**:
  - `classId` (Integer): 수업 ID
- **응답**: `List<PodoUserHoldInterface>`
- **파일**: `UserController.java:309-333`

#### GET /api/v1/user/podo/holdingList
- **설명**: 홀딩 목록 조회
- **인증**: 필요
- **요청 파라미터**:
  - `classId` (Integer): 수업 ID
- **응답**: `List<PodoUserHoldInterface>`
- **파일**: `UserController.java:335-359`

### 5. 튜터 정보

#### GET /api/v1/user/getTutor
- **설명**: 튜터 정보 조회 (v1)
- **인증**: 필요
- **요청 파라미터**:
  - `tutorId` (Integer): 튜터 ID
- **응답**: `LemonadeTutorInfoInterface`
- **파일**: `UserController.java:108-127`

#### GET /api/v2/user/getTutor
- **설명**: 튜터 정보 조회 (v2, PodoResponse 사용)
- **인증**: 필요
- **요청 파라미터**:
  - `tutorId` (Integer): 튜터 ID
- **응답**: `PodoResponse<TutorInfoGetDto>`
- **파일**: `UserControllerV2.java:26-35`

### 6. 사용자 업데이트

#### PUT /api/v1/user/podo/user
- **설명**: 사용자 정보 수정
- **인증**: 필요
- **요청 바디**: `UpdateUserDTO`
```json
{
  "name": "홍길동",
  "phone": "01012345678",
  ...
}
```
- **응답**: `PodoResponse<?>`
- **파일**: `UserController.java:388-391`

### 7. OTP 인증

#### POST /api/v1/user/podo/phone/otp
- **설명**: OTP 요청 (SMS 발송)
- **인증**: 필요
- **요청 파라미터**:
  - `phone` (String): 전화번호
- **응답**: 성공 메시지
- **파일**: `UserController.java:373-378`

#### POST /api/v1/user/podo/phone/otp/validate
- **설명**: OTP 검증
- **인증**: 필요
- **요청 파라미터**:
  - `phone` (String): 전화번호
  - `otp` (String): OTP 코드
- **응답**: 검증 결과 (Boolean)
- **파일**: `UserController.java:380-385`

### 8. 선행학습 스킵

#### GET /api/v1/user/podo/getPrestudySkipCount
- **설명**: 선행학습 스킵 가능 횟수 조회
- **인증**: 필요
- **응답**: `PodoResponse<PrestudySkipCountGetDto>`
- **파일**: `UserController.java:393-396`

#### POST /api/v1/user/podo/skipPrestudy
- **설명**: 선행학습 스킵 실행
- **인증**: 필요
- **요청 파라미터**:
  - `classCourseId` (Integer): 코스 ID
- **응답**: `PodoResponse<PrestudySkippedLectureDto>`
- **파일**: `UserController.java:398-405`

### 9. 디바이스 토큰

#### POST /api/v1/user/podo/device-token
- **설명**: 푸시 알림용 디바이스 토큰 업데이트
- **인증**: 필요
- **요청 바디**: `ReqDeviceTokenDto`
```json
{
  "deviceToken": "fcm_token_here"
}
```
- **응답**: `PodoResponse<Boolean>`
- **파일**: `UserController.java:407-413`

### 10. 언어 설정 (Deprecated)

#### GET /api/v1/user/lang
- **설명**: 최근 선택한 언어 조회
- **상태**: Deprecated
- **인증**: 필요
- **파일**: `UserController.java:52-66`

#### PATCH /api/v1/user/lang
- **설명**: 최근 선택 언어 등록
- **상태**: Deprecated
- **인증**: 필요
- **파일**: `UserController.java:68-77`

### 11. 레모네이드 (Legacy)

#### POST /api/v1/user/lemonade
- **설명**: 레모네이드 결제 계정 생성
- **상태**: Deprecated
- **인증**: 불필요
- **요청 바디**: `ReqLemonadeUserDto`
- **파일**: `UserController.java:79-106`

#### GET /api/v1/user/getNewPagecallAccount
- **설명**: 새 Pagecall 계정 조회
- **인증**: 필요
- **파일**: `UserController.java:129-146`

### 12. Apple 토큰

#### POST /api/v1/user/apple/getToken
- **설명**: Apple JWT 토큰 및 Refresh Token 발급
- **인증**: 불필요
- **요청 바디**: `ReqPodoUserDto` (appleCode 포함)
- **응답**:
```json
{
  "resultCd": "200",
  "result": {
    "appleJwt": "...",
    "appleRefreshToken": "..."
  }
}
```
- **파일**: `UserController.java:204-229`

### 13. 캐시 무효화 (Deprecated)

#### GET /api/v1/user/podo/invalidate-cache
- **설명**: 현재 사용자 캐시 무효화
- **상태**: Deprecated
- **인증**: 필요
- **파일**: `UserController.java:361-365`

#### GET /api/v1/user/podo/invalidate-cache/{userId}
- **설명**: 특정 사용자 캐시 무효화
- **상태**: Deprecated
- **인증**: 필요
- **파일**: `UserController.java:367-371`

## 관련 서비스

### UserGateway
- 사용자 관련 비즈니스 로직 게이트웨이
- 주요 메서드: `getUser()`, `updateUserInfo()`, `requestOTP()`, `validateOTP()`, `skipPrestudy()`

### UserInfoService
- 사용자 정보 CRUD
- 계정 생성, 수강권 발급, Apple 토큰 처리

### UserStatusService
- 사용자 언어 설정 관리

### UserHoldService
- 페널티 및 홀딩 정보 조회

### TutorService
- 튜터 정보 조회

## 주요 정책

1. **인증**: 대부분의 엔드포인트는 JWT 토큰 기반 인증 필요
2. **ClassType**: 사용자는 PODO, LEMONADE 등의 클래스 타입을 가짐
3. **OTP**: 전화번호 변경 시 OTP 인증 필수
4. **선행학습 스킵**: 제한된 횟수만큼 스킵 가능
5. **캐시**: 사용자 정보는 캐시되며, 필요 시 무효화 가능
