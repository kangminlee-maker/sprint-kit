---
domain: index
type: by-domain
last_verified: 2026-01-26
---

# 도메인별 파일 인덱스

## Admin (관리자)

> **참고**: `domains/admin/` 문서 폴더가 아직 생성되지 않았습니다. 코드 패키지(`applications/admin/`)는 존재하나 도메인 문서는 추후 생성 예정입니다.

### Controller
- `src/main/java/com/speaking/podo/applications/admin/sample/controller/AdminSampleController.java` - Admin API 샘플 (헬스 체크)

---

## User (사용자)

### Controller
- `src/main/java/com/speaking/podo/applications/user/controller/UserController.java`
- `src/main/java/com/speaking/podo/applications/user/controller/UserControllerV2.java`

### Gateway
- `src/main/java/com/speaking/podo/applications/user/gateway/UserGateway.java`

### Service
- `src/main/java/com/speaking/podo/applications/user/service/UserInfoService.java` - 사용자 정보 CRUD
- `src/main/java/com/speaking/podo/applications/user/service/UserStatusService.java` - 사용자 상태 관리
- `src/main/java/com/speaking/podo/applications/user/service/UserHoldService.java` - 페널티/홀딩 관리
- `src/main/java/com/speaking/podo/applications/user/service/TutorService.java` - 튜터 정보 관리
- `src/main/java/com/speaking/podo/applications/user/service/PagecallUserService.java` - Pagecall 연동
- `src/main/java/com/speaking/podo/applications/user/service/UserTokenService.java` - 디바이스 토큰 관리

### DTO
- `src/main/java/com/speaking/podo/applications/user/dto/AuthenticatedUserDto.java` - 인증된 사용자 정보
- `src/main/java/com/speaking/podo/applications/user/dto/PodoUserStepDto.java` - 체험수업 STEP
- `src/main/java/com/speaking/podo/applications/user/dto/UpdateUserDTO.java` - 사용자 정보 수정
- `src/main/java/com/speaking/podo/applications/user/dto/UserUpdateLanguageDto.java` - 언어 설정
- `src/main/java/com/speaking/podo/applications/user/dto/request/` - 요청 DTO
- `src/main/java/com/speaking/podo/applications/user/dto/response/` - 응답 DTO

---

## Auth (인증)

### Controller
- `src/main/java/com/speaking/podo/applications/auth/controller/AuthController.java`

### Gateway
- `src/main/java/com/speaking/podo/applications/auth/gateway/AuthGateway.java`

### Service
- `src/main/java/com/speaking/podo/applications/auth/service/InternalTokenService.java` - 내부 토큰 발급
- `src/main/java/com/speaking/podo/applications/auth/service/RefreshTokenService.java` - Refresh Token 관리
- `src/main/java/com/speaking/podo/applications/auth/service/AuthSidService.java` - Session ID 관리
- `src/main/java/com/speaking/podo/applications/auth/service/OAuthStateService.java` - OAuth State 관리

### DTO
- `src/main/java/com/speaking/podo/applications/auth/dto/AuthorizeContext.java` - OAuth 인증 컨텍스트
- `src/main/java/com/speaking/podo/applications/auth/dto/CallbackDto.java` - OAuth 콜백
- `src/main/java/com/speaking/podo/applications/auth/dto/TokenDto.java` - 토큰 관련 DTO
- `src/main/java/com/speaking/podo/applications/auth/dto/SocialLoginDto.java` - 소셜 로그인

### Constant
- `src/main/java/com/speaking/podo/applications/auth/constant/OauthProvider.java` - OAuth 제공자 enum

---

## Ticket (수강권)

### Controller
- `src/main/java/com/speaking/podo/applications/ticket/controller/TicketController.java`

### Gateway
- `src/main/java/com/speaking/podo/applications/ticket/gateway/TicketGateway.java`

### Service
- `src/main/java/com/speaking/podo/applications/ticket/service/TicketService.java`

### DTO
- `src/main/java/com/speaking/podo/applications/ticket/dto/request/ReqUpdatePodoTicketCountListDto.java`
- `src/main/java/com/speaking/podo/applications/ticket/dto/response/TicketDto.java`

---

## Lecture (수업)

### Controller
- `src/main/java/com/speaking/podo/applications/lecture/controller/LectureController.java`
- `src/main/java/com/speaking/podo/applications/lecture/controller/LectureControllerV2.java`

### Gateway
- `src/main/java/com/speaking/podo/applications/lecture/gateway/LectureGateway.java`

### Service
- `src/main/java/com/speaking/podo/applications/lecture/service/query/LectureQueryService.java` - 수업 조회
- `src/main/java/com/speaking/podo/applications/lecture/service/command/LectureCommandService.java` - 수업 생성/수정
- `src/main/java/com/speaking/podo/applications/lecture/service/command/TrialLectureCommandService.java` - 체험수업 관리
- `src/main/java/com/speaking/podo/applications/lecture/service/external/LectureExternalTutorQueryService.java` - 튜터 연동

### DTO
- `src/main/java/com/speaking/podo/applications/lecture/dto/LectureEnterInfoDto.java` - 수업 입장 정보
- `src/main/java/com/speaking/podo/applications/lecture/dto/LectureSimpleDto.java` - 수업 간단 정보
- `src/main/java/com/speaking/podo/applications/lecture/dto/request/ChangeTrialClassLevelDto.java`
- `src/main/java/com/speaking/podo/applications/lecture/dto/response/` - 다양한 응답 DTO

---

## Payment (결제)

### Controller
- `src/main/java/com/speaking/podo/applications/payment/controller/PaymentController.java`

### Gateway
- `src/main/java/com/speaking/podo/applications/payment/gateway/PaymentGateway.java`

### Service
- `src/main/java/com/speaking/podo/applications/payment/service/PaymentService.java` - 결제 처리
- `src/main/java/com/speaking/podo/applications/payment/service/DirectPayService.java` - 직접 결제

### DTO
- `src/main/java/com/speaking/podo/applications/payment/dto/PortoneWebhookRequest.java` - 포트원 웹훅

### 외부 모듈
- `src/main/java/com/speaking/podo/modules/portone/dto/response/PortoneDto.java` - 포트원 DTO

---

## Coupon (쿠폰)

### Controller (Delivery)
- `src/main/java/com/speaking/podo/applications/coupon/delivery/CouponController.java`

### Gateway
- `src/main/java/com/speaking/podo/applications/coupon/gateway/CouponGateway.java`

### UseCase
- `src/main/java/com/speaking/podo/applications/coupon/usecase/CouponService.java`

### Domain
- `src/main/java/com/speaking/podo/applications/coupon/domain/serialize/ApplyCondition.java` - 쿠폰 적용 조건

### DTO
- `src/main/java/com/speaking/podo/applications/coupon/dto/request/` - 요청 DTO
- `src/main/java/com/speaking/podo/applications/coupon/dto/response/` - 응답 DTO

---

## Subscribe (구독)

### UseCase
- `src/main/java/com/speaking/podo/applications/subscribe/usecase/SubscribeService.java`
- `src/main/java/com/speaking/podo/applications/subscribe/usecase/SubscribeOriginService.java`
- `src/main/java/com/speaking/podo/applications/subscribe/usecase/SubscribeMappHistoryService.java`

### Domain Action
- `src/main/java/com/speaking/podo/applications/subscribe/domain/action/SubscribeMappService.java`

---

## Diagnosis (진단)

### Service
- `src/main/java/com/speaking/podo/applications/diagnosis/service/DiagnosisService.java` - 진단 로직
- `src/main/java/com/speaking/podo/applications/diagnosis/service/DiagnosisPersistenceService.java` - 진단 저장
- `src/main/java/com/speaking/podo/applications/diagnosis/service/PromptService.java` - AI 프롬프트
- `src/main/java/com/speaking/podo/applications/diagnosis/service/SrtAnalysisService.java` - SRT 분석
- `src/main/java/com/speaking/podo/applications/diagnosis/service/SrtAnalyzeService.java` - SRT 분석 v2

---

## Discount (할인)

### Service
- `src/main/java/com/speaking/podo/applications/discount/service/DiscountService.java`
- `src/main/java/com/speaking/podo/applications/discount/service/DiscountDetailService.java`

---

## Log (로그)

### Service
- `src/main/java/com/speaking/podo/applications/log/service/BizLogCommandService.java` - 비즈니스 로그 기록
- `src/main/java/com/speaking/podo/applications/log/service/BizLogQueryService.java` - 비즈니스 로그 조회
- `src/main/java/com/speaking/podo/applications/log/service/CommonSendLogQueryService.java` - 발송 로그
- `src/main/java/com/speaking/podo/applications/log/service/SysLogService.java` - 시스템 로그
- `src/main/java/com/speaking/podo/applications/log/service/external/UserExternalService.java` - 외부 사용자 서비스

---

## Notification (알림)

### Service
- `src/main/java/com/speaking/podo/applications/notification/service/NotificationService.java` - 푸시 알림
- `src/main/java/com/speaking/podo/applications/notification/service/SlackService.java` - Slack 알림

---

## Alarm (알람)

### Service
- `src/main/java/com/speaking/podo/applications/alarm/service/AlarmService.java`

---

## Mail (메일)

### Service
- `src/main/java/com/speaking/podo/applications/mail/service/MailService.java`

---

## AI

### Service
- `src/main/java/com/speaking/podo/applications/ai/service/AiService.java`

---

## Board (게시판)

### Service
- `src/main/java/com/speaking/podo/applications/board/service/BoardQueryService.java`

---

## Card (카드)

### Service
- `src/main/java/com/speaking/podo/applications/card/service/CardQueryService.java`

---

## Notice (공지사항)

### Service
- `src/main/java/com/speaking/podo/applications/notice/service/NoticeQueryService.java`

---

## Partners (파트너)

### UseCase
- `src/main/java/com/speaking/podo/applications/partners/usecase/PartnersService.java`

---

## Podo (PODO 전용 도메인)

### LevelTest (레벨테스트)
- `src/main/java/com/speaking/podo/applications/podo/leveltest/domain/action/LevelTestService.java`

### Schedule (스케줄)
- `src/main/java/com/speaking/podo/applications/podo/schedule/domain/action/PodoScheduleService.java`

---

## Popup (팝업)

### Domain Action
- `src/main/java/com/speaking/podo/applications/popup/domain/action/PopupService.java`

---

## Recap (복습)

### Domain Action
- `src/main/java/com/speaking/podo/applications/recap/domain/action/RecapService.java`

---

## System (시스템)

### Service
- `src/main/java/com/speaking/podo/applications/system/service/SystemCodeService.java`

---

## Code (코드)

### Service
- `src/main/java/com/speaking/podo/applications/code/service/CodeCommandService.java`

---

## Common (공통)

### Service
- `src/main/java/com/speaking/podo/applications/common/service/CommonService.java`

---

## Cache (캐시)

### Service
- `src/main/java/com/speaking/podo/applications/cache/service/CacheService.java`

---

## Modules / Web (웹 설정)

### Swagger 설정
- `src/main/java/com/speaking/podo/modules/web/swagger/SwaggerConfig.java` - OpenAPI 설정, API 그룹 분리
- `src/main/java/com/speaking/podo/modules/web/swagger/SwaggerProperties.java` - 환경별 Swagger 서버 URL 설정 (`springdoc.server.*`)

**Swagger API 그룹**:
| 그룹 이름 | 표시 이름 | 대상 경로 |
|-----------|----------|----------|
| `client` | (기본) | `com.speaking.podo.applications` (admin 제외) |
| `general` | PODO API | `/api/**` (admin 경로 제외) |
| `admin` | PODO Admin API | `/api/**/*ByAdmin`, `/api/**/*ForAdmin`, `/api/admin/**` |

**환경별 서버 URL** (`springdoc.server`):
| 환경 | URL |
|------|-----|
| local | `http://localhost:9285` |
| dev | `https://dev-api.podospeaking.com` |
| stage | `https://stage-api.podospeaking.com` |

---

## 도메인 의존 관계

### 핵심 도메인
```
User ← Auth
User → Ticket → Lecture
Payment → Subscribe → Ticket
Coupon → Payment
```

### 지원 도메인
```
Notification → User, Lecture, Payment
Log → 모든 도메인
Cache → 모든 도메인
```

### 외부 연동 도메인
```
AI → Diagnosis
Mail → User, Payment
Slack → Notification
```
