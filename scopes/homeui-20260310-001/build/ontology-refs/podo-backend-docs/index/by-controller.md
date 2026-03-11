---
domain: index
type: by-controller
last_verified: 2026-01-26
---

# 컨트롤러별 파일 인덱스

## UserController

### 파일 경로
- `src/main/java/com/speaking/podo/applications/user/controller/UserController.java`

### 의존 컴포넌트
#### Gateway
- `UserGateway` - 사용자 비즈니스 로직 게이트웨이

#### Service
- `UserStatusService` - 사용자 상태 관리
- `UserInfoService` - 사용자 정보 관리
- `UserHoldService` - 페널티/홀딩 관리
- `TutorService` - 튜터 정보
- `AppleService` - Apple 인증

#### DTO
- `AuthenticatedUserDto` - 인증된 사용자
- `UpdateUserDTO` - 사용자 정보 수정
- `PodoUserStepDto` - 체험수업 STEP
- `UserUpdateLanguageDto` - 언어 설정
- `ReqDeviceTokenDto` - 디바이스 토큰
- `ReqLemonadeUserDto` - 레모네이드 사용자 (Deprecated)
- `ReqPodoUserDto` - PODO 사용자
- Response DTO들 (`PodoUserDto`, `PrestudySkipCountGetDto` 등)

### 주요 엔드포인트
- `GET /api/v1/user/lang` - 언어 조회 (Deprecated)
- `PATCH /api/v1/user/lang` - 언어 설정 (Deprecated)
- `POST /api/v1/user/lemonade` - 레모네이드 계정 생성 (Deprecated)
- `GET /api/v1/user/getTutor` - 튜터 정보 조회
- `POST /api/v1/user/podo/isExists` - PODO 계정 존재 여부
- `POST /api/v1/user/podo` - PODO 계정 생성
- `POST /api/v1/user/podo/classTicketWithTrialClass` - 체험 수강권 지급
- `POST /api/v1/user/apple/getToken` - Apple 토큰 발급
- `GET /api/v1/user/podo/getInfo` - 사용자 정보 조회
- `GET /api/v1/user/podo/user/me` - 현재 사용자 조회 (v2)
- `GET /api/v1/user/podo/getTrialStepInfo` - 체험수업 STEP 조회
- `POST /api/v1/user/podo/insertStep` - 체험수업 STEP 저장
- `GET /api/v1/user/podo/penaltyList` - 페널티 목록
- `GET /api/v1/user/podo/holdingList` - 홀딩 목록
- `POST /api/v1/user/podo/phone/otp` - OTP 요청
- `POST /api/v1/user/podo/phone/otp/validate` - OTP 검증
- `PUT /api/v1/user/podo/user` - 사용자 정보 수정
- `GET /api/v1/user/podo/getPrestudySkipCount` - 선행학습 스킵 횟수
- `POST /api/v1/user/podo/skipPrestudy` - 선행학습 스킵
- `POST /api/v1/user/podo/device-token` - 디바이스 토큰 업데이트

---

## UserControllerV2

### 파일 경로
- `src/main/java/com/speaking/podo/applications/user/controller/UserControllerV2.java`

### 의존 컴포넌트
#### Gateway
- `UserGateway`

#### DTO
- `AuthenticatedUserDto`
- `TutorInfoGetDto`

### 주요 엔드포인트
- `GET /api/v2/user/getTutor` - 튜터 정보 조회 (v2)

---

## AuthController

### 파일 경로
- `src/main/java/com/speaking/podo/applications/auth/controller/AuthController.java`

### 의존 컴포넌트
#### Gateway
- `AuthGateway` - 인증 비즈니스 로직 게이트웨이

#### Service
- `InternalTokenService` - 내부 토큰 발급
- `AuthSidService` - Session ID 관리
- `JwtDecoder` - JWT 디코더

#### DTO
- `AuthorizeContext` - OAuth 인증 컨텍스트
- `CallbackDto` - OAuth 콜백
- `TokenDto.*` - 토큰 관련 DTO
- `SocialLoginDto.SocialLoginResponse` - 소셜 로그인 응답

### 주요 엔드포인트
- `GET /api/v1/auth/{provider}/authorize` - OAuth 인증 URL
- `GET /api/v1/auth/{provider}/callback` - OAuth 콜백
- `POST /api/v1/auth/internal/access-token` - 내부 토큰 발급
- `POST /api/v1/auth/refresh` - 토큰 갱신
- `POST /api/v1/auth/introspect` - 토큰 검증
- `GET /api/v1/auth/exchange` - SID 교환

---

## TicketController

### 파일 경로
- `src/main/java/com/speaking/podo/applications/ticket/controller/TicketController.java`

### 의존 컴포넌트
#### Gateway
- `TicketGateway` - 수강권 비즈니스 로직 게이트웨이

#### DTO
- `AuthenticatedUserDto`
- `ReqUpdatePodoTicketCountListDto` - 수강권 횟수 변경 요청
- `TicketDto` - 수강권 정보

### 주요 엔드포인트
- `GET /api/v1/ticket/podo/getList` - 수강권 목록 조회
- `POST /api/v1/ticket/podo/updateCount` - 수강권 횟수 변경

---

## LectureController

### 파일 경로
- `src/main/java/com/speaking/podo/applications/lecture/controller/LectureController.java`

### 의존 컴포넌트
#### Service
- `LectureQueryService` - 수업 조회
- `LectureCommandService` - 수업 생성/수정
- `KollusUrlGenerator` - Kollus 비디오 URL 생성

#### DTO
- `AuthenticatedUserDto`
- Response DTO들 (`LectureEnterInfoInterface`, `PodoLectureInfoInterface` 등)

### 주요 엔드포인트
#### 레모네이드 (Legacy)
- `GET /api/v1/lecture/getLeLectureEnterInfo` - 수업입장 정보
- `GET /api/v1/lecture/getLeLectureReplayInfo` - 수업 다시보기 정보
- `GET /api/v1/lecture/getLePronunciationInfo` - 발음학습북 정보
- `GET /api/v1/lecture/getLeRecentLectureInfo` - 최근 수업 정보
- `GET /api/v1/lecture/getReserveLeLectureList` - 예약 수업 목록
- `GET /api/v1/lecture/getFinishLeLectureList` - 완료 수업 목록
- `GET /api/v1/lecture/getLeLectureRoomInfo` - 수업 룸 정보

#### PODO
- `GET /api/v1/lecture/podo/getPodoTrialLectureList` - 체험 수업 목록
- `GET /api/v1/lecture/podo/getPodoClassCourseList` - 모든 수업 목록
- `GET /api/v1/lecture/podo/getPodoLectureHistoryList` - 이전 수업 목록
- `POST /api/v1/lecture/podo/createPodoClassPage` - 수업 교재 페이지 생성
- `GET /api/v1/lecture/podo/getPronunciationList` - 발음학습북 목록
- `GET /api/v1/lecture/podo/getNextLectureInfo` - 다음 수업 정보
- `GET /api/v1/lecture/podo/getNextLectureList` - 예약된 수업 목록
- `GET /api/v1/lecture/podo/getTrialClassList` - 체험학습 목록
- `GET /api/v1/lecture/podo/getPodoClassLevel` - 수업 레벨 조회

---

## LectureControllerV2

### 파일 경로
- `src/main/java/com/speaking/podo/applications/lecture/controller/LectureControllerV2.java`

### 의존 컴포넌트
#### Service
- `LectureCommandService` - 수업 생성/수정
- `TrialLectureCommandService` - 체험수업 관리
- `LectureQueryService` - 수업 조회

#### Gateway
- `LectureGateway` - 수업 비즈니스 로직 게이트웨이

#### DTO
- `AuthenticatedUserDto`
- `ChangeTrialClassLevelDto` - 체험수업 레벨 변경
- Response DTO들 (`LectureRoomCopyResponseDto`, `CompletedLectureGetDto` 등)

### 주요 엔드포인트
- `POST /api/v2/lecture/podo/copyPodoClassRoom` - 수업방 복제
- `GET /api/v2/lecture/podo/getCompletedLecture` - 지난 수업 상세
- `GET /api/v2/lecture/podo/getLectureList` - 지난 수업 목록 (페이지네이션)
- `GET /api/v2/lecture/podo/getNextLectureList` - 예약된 수업 목록 (v2)
- `GET /api/v2/lecture/podo/getPodoClassCourseList` - 모든 수업 목록 (v2)
- `POST /api/v2/lecture/podo/createPodoClass` - 수업 생성 (v2)
- `POST /api/v2/lecture/podo/createPodoChat` - 캐릭터챗 생성
- `POST /api/v2/lecture/podo/updatePreStudyTime` - 선행학습 시간 업데이트
- `POST /api/v2/lecture/podo/finishPreStudyTime` - 선행학습 완료
- `GET /api/v2/lecture/podo/getCompPrestudyList` - 완료된 예습 목록
- `POST /api/v2/lecture/podo/changeTrialClassLevel` - 체험수업 레벨 변경
- `GET /api/v2/lecture/getLeLectureEnterInfo` - 수업입장 정보 (v2)
- `POST /api/v2/lecture/podo/changePagecallToLemonboard` - Pagecall → Lemonboard 변경
- `GET /api/v2/lecture/podo/getPodoTrialLectureList` - 체험 수업 목록 (v2)
- `GET /api/v2/lecture/getReserveClassInfo` - 5분 후 예약 수업 조회
- `GET /api/v2/lecture/getLectureCourseList` - 신규 레슨탭 조회
- `GET /api/v2/lecture/getNextCourse` - 다음 코스 조회
- `GET /api/v2/lecture/getLectureAndPrestudy` - 수업/예습 ID 조회

---

## PaymentController

### 파일 경로
- `src/main/java/com/speaking/podo/applications/payment/controller/PaymentController.java`

### 의존 컴포넌트
#### Gateway
- `PaymentGateway` - 결제 비즈니스 로직 게이트웨이

#### DTO
- `AuthenticatedUserDto`
- `PortoneWebhookRequest` - 포트원 웹훅 요청
- `PortoneDto.CustomData` - 포트원 커스텀 데이터

### 주요 엔드포인트
- `GET /api/v1/payment/podo/validate` - 결제 검증
- `POST /api/v1/payment/podo/success` - 결제 성공 콜백
- `POST /api/v1/payment/podo/webhook` - 포트원 웹훅
- `GET /api/v1/payment/podo/check/{impUid}` - 결제 상태 확인 (폴링)

---

## CouponController

### 파일 경로
- `src/main/java/com/speaking/podo/applications/coupon/delivery/CouponController.java`

### 의존 컴포넌트
#### Gateway
- `CouponGateway` - 쿠폰 비즈니스 로직 게이트웨이

#### DTO
- `AuthenticatedUserDto`
- `CouponPublishDto` - 쿠폰 발급
- `CouponTemplateReqForSubDto` - 쿠폰 템플릿 요청
- `CouponDetailGetDto` - 쿠폰 상세 정보
- `ApplyCondition` - 쿠폰 적용 조건
- 다양한 Admin DTO들

### 주요 엔드포인트
#### 사용자용
- `GET /api/v1/coupon/getCoupons` - 쿠폰 목록 조회
- `GET /api/v1/coupon/getCouponDetail` - 쿠폰 상세 정보
- `GET /api/v1/coupon/getCouponsForPayment` - 결제 시 사용 가능 쿠폰
- `GET /api/v1/coupon/canUseCoupon` - 쿠폰 사용 가능 여부
- `GET /api/v1/coupon/calculate` - 할인 금액 계산
- `POST /api/v1/coupon/apply/list` - 조건에 맞는 쿠폰 적용

#### 시스템용
- `POST /api/v1/coupon/publishCoupon` - 쿠폰 발급 (크론잡)
- `POST /api/v1/coupon/publishAfterTrialCouponForPhp` - 체험수업 완료 쿠폰 (podo-php)
- `POST /api/v1/coupon/publish` - 대량 쿠폰 발급

#### 관리자용 (Basic Auth)
- `POST /api/v1/coupon/createCouponTemplateByAdmin` - 쿠폰 템플릿 생성
- `POST /api/v1/coupon/updateCouponTemplateByAdmin` - 쿠폰 템플릿 수정
- `POST /api/v1/coupon/deleteCouponTemplateByAdmin` - 쿠폰 템플릿 삭제
- `POST /api/v1/coupon/publishCouponByAdmin` - 쿠폰 발급
- `POST /api/v1/coupon/updateCouponByAdmin` - 쿠폰 수정
- `POST /api/v1/coupon/deleteCouponByAdmin` - 쿠폰 삭제
- `POST /api/v1/coupon/restoreCouponByAdmin` - 쿠폰 복구

---

## PodoScheduleControllerV3

### 파일 경로
- `src/main/java/com/speaking/podo/applications/podo/schedule/delivery/PodoScheduleControllerV3.java`

### 의존 컴포넌트
#### Service
- `PodoScheduleServiceImplV2` - 스케줄 비즈니스 로직 (V2)

#### DTO
- `PodoScheduleLectureInterface` - 수업 정보 인터페이스
- `StudentScheduleResponseDto` - 학생용 스케줄 응답
- `AuthenticatedUserDto` - 인증된 사용자
- `PodoResponse<T>` - 표준 응답 래퍼

### 주요 엔드포인트
- `GET /getLectureInfo` - 선택된 날짜에 가능한 튜터 스케줄 목록 조회 (예약용)
- `GET /getTutorSchedulesForReg` - 선택된 날짜에 가능한 튜터 스케줄 목록 조회 (예약용)
- `GET /getTutorSchedulesForAdmin` - 튜터 스케줄 블록 조회 : 5분 단위 (관리자용, Basic Auth)
- `GET /getUnscheduledHoursForAdmin` - 선생님이 등록하지 않은 시간 조회 : 1시간 단위 (관리자용, Basic Auth)

### 변경 이력 (2026-02-23)
- **응답 형식 통일**: 레거시 `Map<String, Object>` (`resultCd`, `result`) 방식에서 `PodoResponse<T>` 표준 응답으로 전환
- **예외 처리 통일**: 개별 `try-catch` 블록 제거, `PodoExceptionHandler`에서 전역 처리
- **인증 로직 분리**: Basic Auth 검증을 `validateBasicAuth()` 메서드로 추출

---

## AdminSampleController

### 파일 경로
- `src/main/java/com/speaking/podo/applications/admin/sample/controller/AdminSampleController.java`

### 의존 컴포넌트
#### DTO
- `PodoResponse` - 표준 응답 래퍼

### 주요 엔드포인트
- `GET /admin/sample/health` - Admin API 헬스 체크 (상태 및 타임스탬프 반환)

> **참고**: Admin 도메인 (`applications/admin`)은 별도 Swagger 그룹(`admin`)으로 분리되어 있습니다.
> `SwaggerConfig`의 `clientApi` 빈에서 `com.speaking.podo.applications.admin` 패키지를 제외하고 별도 `adminApi` 빈에서 관리합니다.

---

## 컨트롤러 공통 패턴

### 인증
대부분의 엔드포인트는 `@AuthenticationPrincipal AuthenticatedUserDto user`로 인증된 사용자 정보를 받습니다.

### 응답 형식
- **레거시 API**: `Map<String, Object>` 방식 (`resultCd`, `result`) - 점진적으로 표준 응답으로 전환 중
- **표준 API**: `PodoResponse<T>` 표준 응답 (신규 및 리팩토링된 컨트롤러)
- **예**: `PodoScheduleControllerV3`은 2026-02-23에 레거시 → 표준 응답으로 전환 완료

### 관리자 API 인증
관리자 API는 Basic Auth (podo:podo) 사용:
```
Authorization: Basic cG9kbzpwb2Rv
```

### 다국어 지원
다국어 지원 API는 `Accept-Language` 헤더 사용 (기본값: ko)

### 의존성 주입
모든 컨트롤러는 `@RequiredArgsConstructor`로 final 필드 의존성 주입 사용
