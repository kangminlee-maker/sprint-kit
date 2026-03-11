---
title: 데이터베이스 Enum 정의
domain: database
scope: enums
created: 2026-01-26
---

# 데이터베이스 Enum 정의

## 수업 상태 관련

### LectureStatus (별도 Enum)
**파일**: `src/main/java/com/speaking/podo/applications/lecture/domain/enums/LectureStatus.java`
**컬럼**: `GT_CLASS.CREDIT`
**타입**: Integer (DB 저장)

| Code | Status | 설명 |
|------|--------|------|
| 0 | NONE | 없음 (초기 상태) |
| 1 | REGIST | 등록 (예약됨) |
| 2 | DONE | 완료 |
| 3 | CANCEL | 취소 |

**주의**: `GT_CLASS.CREDIT` 컬럼은 Integer로 저장되며, Converter를 통해 LectureStatus Enum으로 변환됩니다.

---

### Lecture.InvoiceStatus (Inner Enum)
**파일**: `src/main/java/com/speaking/podo/applications/lecture/domain/Lecture.java`
**컬럼**: `GT_CLASS.INVOICE_STATUS`
**타입**: String (DB 저장)

| 값 | 설명 |
|----|------|
| CREATED | 생성됨 |
| RESERVED | 예약됨 |
| COMPLETED | 완료됨 |
| NOSHOW_S | 노쇼 (학생) |
| NOSHOW_BOTH | 노쇼 (양쪽) |
| CANCEL_NOSHOW_T | 취소 - 노쇼 (튜터) |
| CANCEL | 취소 |
| CANCEL_PAID | 취소 (유료) |

**차이점**:
- `LectureStatus`: 수업의 생명주기 상태 (Integer 코드)
- `InvoiceStatus`: 청구/정산 관점의 상태 (String)

---

## 쿠폰 관련

### CouponTemplate.DiscountType
**파일**: `src/main/java/com/speaking/podo/applications/coupon/domain/CouponTemplate.java`
**컬럼**: `le_coupon_template.discount_type`

| 값 | 설명 | 사용 예시 |
|----|------|----------|
| PERCENTAGE | 퍼센트 할인 | 10% 할인 |
| FIXED | 고정 금액 할인 | 5,000원 할인 |

---

### CouponTemplate.Status
**파일**: `src/main/java/com/speaking/podo/applications/coupon/domain/CouponTemplate.java`
**컬럼**: `le_coupon_template.status`

| 값 | 설명 |
|----|------|
| ACTIVE | 활성 (사용 가능) |
| HIDDEN | 숨김 (관리자만 보임) |
| DELETED | 삭제됨 |

---

### CouponTemplate.CouponType
**파일**: `src/main/java/com/speaking/podo/applications/coupon/domain/CouponTemplate.java`
**컬럼**: `le_coupon_template.type`

| 값 | 설명 | 용도 |
|----|------|------|
| DEFAULT | 기본 쿠폰 | 일반 프로모션 |
| PARTNERS | 제휴 쿠폰 | 제휴사 할인 |
| AFTER_TRIAL | 체험 후 쿠폰 | 체험 수업 완료 후 지급 |
| SUBSCRIBE_DONE | 구독 완료 쿠폰 | 구독 결제 완료 시 |
| SUBSCRIBE_PROTECTION | 구독 보호 쿠폰 | 구독 유지 유도 |
| SUBSCRIBE_EXPIRED | 구독 만료 쿠폰 | 구독 만료 후 재가입 유도 |
| SUBSCRIBE_EXPIRED_JPANDCOUNT | 구독 만료 (일본어 + 횟수) | 일본어 구독 만료 (특정 조건) |
| WELCOME | 웰컴 쿠폰 | 신규 가입 환영 |
| SMART_TALK_TRIAL_EXPIRED | 스마트톡 체험 만료 | 스마트톡 체험 종료 후 |

---

### CouponTemplate.ApplyType
**파일**: `src/main/java/com/speaking/podo/applications/coupon/domain/CouponTemplate.java`
**컬럼**: `le_coupon_template.apply_type`

| 값 | 설명 | 적용 대상 |
|----|------|----------|
| SUB | 구독 상품 | GT_SUBSCRIBE |
| SUB_MAPP | 구독 매핑 | GT_SUBSCRIBE_MAPP |
| USER | 사용자 | GT_USER |

**비즈니스 의미**:
- `SUB`: 특정 구독 상품 선택 시 쿠폰 적용
- `SUB_MAPP`: 구독 활성화(결제) 시 쿠폰 적용
- `USER`: 사용자 레벨 쿠폰 (모든 상품 적용 가능)

---

### Coupon.Status
**파일**: `src/main/java/com/speaking/podo/applications/coupon/domain/Coupon.java`
**컬럼**: `le_coupon.status`

| 값 | 설명 |
|----|------|
| ACTIVE | 활성 (사용 가능) |
| HIDDEN | 숨김 (사용자 목록에서 제외) |
| DELETED | 삭제됨 |
| USED | 사용됨 |

**DisplayStatus 계산 로직**:
발급된 쿠폰의 실제 상태는 `getDisplayStatus()` 메서드로 계산:
- `DELETED`, `HIDDEN`, `USED`: DB 상태 그대로 반환
- `utcUseEnd` 지났으면: `EXPIRED` (만료)
- `utcUseStart` 전이면: `PENDING` (대기)
- 그 외: `NORMAL` (사용 가능)

---

## 기타 Enum

### Gender
**파일**: `src/main/java/com/speaking/podo/core/constant/Gender.java:8`
**컬럼**: `GT_USER.SEX`
**타입**: Integer (DB 저장, code 값)

| Code | Enum | 설명 |
|------|------|------|
| 2 | NONE | 없음 |
| 0 | MALE | 남자 |
| 1 | FEMALE | 여자 |

**주의**: DB에는 Integer code 값으로 저장되며, GenderConverter를 통해 Gender Enum으로 변환됩니다.

---

### Language
**파일**: `src/main/java/com/speaking/podo/core/constant/Language.java:13`
**컬럼**: `GT_USER.LANG_TYPE`, `GT_SUBSCRIBE.LANG_TYPE`, `GT_CLASS.LANG_TYPE` 등
**타입**: String (DB 저장, simpleCode 값)

| Enum | 한글명 | SimpleCode (DB) | LanguageCode |
|------|--------|-----------------|--------------|
| KOREAN | 한국어 | KR | ko |
| ENGLISH | 영어 | EN | en |
| CHINESE | 중국어 | CN | zh |
| JAPANESE | 일본어 | JP | ja |
| ENGLISH_JAPANESE | 영어&일본어 | ENJP | enja |

**주의**: SimpleLanguageConverter를 사용하여 DB의 simpleCode 값과 Language Enum 간 변환됩니다.

---

### RoleType
**파일**: `src/main/java/com/speaking/podo/modules/auth/enums/RoleType.java:11`
**컬럼**: `GT_CLASS.USER_TYPE` (ClassRegisterTypeConverter), Spring Security 권한
**타입**: String (DB 저장)

| Enum | Code (DB) | 설명 |
|------|-----------|------|
| Student | ROLE_STUDENT | 학생 권한 |
| Tutor | ROLE_TUTOR | 튜터 권한 |
| PreTutor | ROLE_PRE_TUTOR | 예비 튜터 권한 |
| Admin | ROLE_ADMIN | 관리자 권한 |
| Guest | ROLE_GUEST | 게스트 권한 |

**주의**:
- Spring Security의 `GrantedAuthority` 인터페이스를 구현하여 권한 관리에 사용됩니다.
- `GT_CLASS.USER_TYPE`은 ClassRegisterTypeConverter를 통해 변환됩니다.

---

### TicketType
**파일**: `src/main/java/com/speaking/podo/core/constant/TicketType.java:10`
**컬럼**: `GT_CLASS.TICKET_TYPE`
**타입**: String (DB 저장, code 값)

| Enum | Code (DB) | 설명 |
|------|-----------|------|
| Normal | N | 일반 수강권 |
| Pro | P | 전문 수강권 |

**주의**: TicketTypeConverter를 통해 DB의 code 값과 TicketType Enum 간 변환됩니다.

---

## Converter 매핑

| DB 컬럼 | Java Enum | Converter | DB 타입 | 소스 파일 |
|---------|-----------|-----------|---------|----------|
| GT_CLASS.CREDIT | LectureStatus | LectureStatusConverter | Integer | lecture/domain/enums/LectureStatus.java:11 |
| GT_CLASS.INVOICE_STATUS | Lecture.InvoiceStatus | (내장 @Enumerated) | String | lecture/domain/Lecture.java:224 |
| GT_CLASS.USER_TYPE | RoleType | ClassRegisterTypeConverter | String | modules/auth/enums/RoleType.java:11 |
| GT_CLASS.TICKET_TYPE | TicketType | TicketTypeConverter | String | core/constant/TicketType.java:10 |
| GT_USER.SEX | Gender | GenderConverter | Integer | core/constant/Gender.java:8 |
| GT_USER.LANG_TYPE | Language | SimpleLanguageConverter | String | core/constant/Language.java:13 |
| le_coupon_template.discount_type | CouponTemplate.DiscountType | (내장 @Enumerated) | String | coupon/domain/CouponTemplate.java:249 |
| le_coupon_template.status | CouponTemplate.Status | (내장 @Enumerated) | String | coupon/domain/CouponTemplate.java:254 |
| le_coupon_template.type | CouponTemplate.CouponType | (내장 @Enumerated) | String | coupon/domain/CouponTemplate.java:260 |
| le_coupon_template.apply_type | CouponTemplate.ApplyType | (내장 @Enumerated) | String | coupon/domain/CouponTemplate.java:272 |
| le_coupon.status | Coupon.Status | (내장 @Enumerated) | String | coupon/domain/Coupon.java:110 |

---

## 사용자 관련 Enum

### AdminType
**파일**: `src/main/java/com/speaking/podo/applications/user/domain/enums/AdminType.java:16`
**컬럼**: 관리자 권한 타입
**타입**: Integer (DB 저장, code 값)

| Code | Enum | 설명 |
|------|------|------|
| 0 | MANAGER | 운영관리자 |
| 1 | ADMINISTRATOR | 최고관리자 |
| 2 | PUBLIC | 공용운영계정 |

**주의**: AdminTypeConverter를 사용하여 변환됩니다.

---

### TutorType
**파일**: `src/main/java/com/speaking/podo/applications/user/domain/enums/TutorType.java:8`
**컬럼**: 튜터 유형
**타입**: String (DB 저장, code 값)

| Enum | Code (DB) | 설명 |
|------|-----------|------|
| NORMAL | N | 일반 튜터 |
| PRO | P | 전문 튜터 |
| NATIVE | F | 네이티브 튜터 |

---

### CountryType
**파일**: `src/main/java/com/speaking/podo/applications/user/domain/enums/CountryType.java:8`
**컬럼**: 국가 타입
**타입**: String (DB 저장, code 값)

| Enum | Code (DB) | 언어 |
|------|-----------|------|
| USA | en | 영어 |
| UK | uk | 영어 |
| JAPAN | jp | 일본어 |
| CHINA | ch | 중국어 |

---

## 수업(Lecture) 관련 Enum

### ExpType
**파일**: `src/main/java/com/speaking/podo/applications/lecture/domain/enums/ExpType.java:3`
**용도**: 경험치 타입

| 값 |
|----|
| count |

---

### LectureAiEventType
**파일**: `src/main/java/com/speaking/podo/applications/lecture/domain/enums/LectureAiEventType.java:3`
**용도**: AI 수업 이벤트 타입

| 값 | 설명 |
|----|------|
| AI_CHAT | AI 채팅 |
| SMART_TALK | 스마트톡 수업 |
| SMART_TALK_SKIP | 스마트톡 건너뛰기 |
| SMART_TALK_CANCEL_PENALTY | 스마트톡 취소 패널티 |
| SMART_TALK_NOSHOW_PENALTY | 스마트톡 노쇼 패널티 |

---

### LectureCourseLevel
**파일**: `src/main/java/com/speaking/podo/applications/lecture/domain/enums/LectureCourseLevel.java:12`
**용도**: 수업 난이도 레벨
**타입**: String (Enum name)

| Enum | 한글명 | 지원 언어 |
|------|--------|----------|
| BEGINNER | 초급 | ENGLISH, JAPANESE |
| UPPER_BEGINNER | 초중급 | JAPANESE |
| INTERMEDIATE | 중급 | ENGLISH, JAPANESE |
| UPPER_INTERMEDIATE | 중고급 | ENGLISH, JAPANESE |
| ADVANCED | 고급 | ENGLISH, JAPANESE |

**특징**:
- 언어별로 지원하는 레벨이 다름 (`supportedLangs` 필드)
- `getLectureCourseDifficulties(Language)` 메서드로 언어별 레벨 조회 가능

---

### LectureType
**파일**: `src/main/java/com/speaking/podo/applications/lecture/domain/enums/LectureType.java:6`
**용도**: 수업 표시 타입 (비트 플래그)
**타입**: Integer (비트 연산)

| Enum | Bit Position | Flag Value | 설명 |
|------|--------------|------------|------|
| THUMB_LIST | 0 | 1 (1 << 0) | 썸네일 리스트 |
| THUMB_CARD | 1 | 2 (1 << 1) | 썸네일 카드 |
| LIST | 2 | 4 (1 << 2) | 일반 리스트 |

**주의**: 비트 플래그로 사용되어 여러 타입을 조합할 수 있습니다.

---

## 진단(Diagnosis) 관련 Enum

### DiagnosisEventType
**파일**: `src/main/java/com/speaking/podo/applications/diagnosis/enums/DiagnosisEventType.java:3`
**용도**: 진단 이벤트 타입

| 값 | 설명 |
|----|------|
| SAVE_DIAGNOSIS_ALL | 전체 진단 결과 저장 |
| SAVE_QUESTION_SUBMIT | 문제 제출 저장 |

---

## 로그(Log) 관련 Enum

### AlimEventType
**파일**: `src/main/java/com/speaking/podo/applications/log/enums/AlimEventType.java:3`
**용도**: 알림 이벤트 타입

| 값 | 설명 |
|----|------|
| PRESTUDY_START | 사전학습 시작 |
| PRESTUDY_FINISH | 사전학습 완료 |
| BOOK | 예약 |
| PURCHASE_REGULAR | 정기결제 |
| DELETE_ACCOUNT | 계정 삭제 |
| REFUND | 환불 |
| ALIM_SENT | 알림 발송됨 |
| NONE | 없음 |

---

### ClassType
**파일**: `src/main/java/com/speaking/podo/applications/log/enums/ClassType.java:3`
**용도**: 수업 서비스 타입

| 값 | 설명 |
|----|------|
| RESPEAK | 리스픽 |
| LEMONADE | 레모네이드 |
| NEWSPRESSO | 뉴프레소 |
| PODO | 포도 |
| PODO_MKT | 포도 마케팅 |

---

### SendLogType
**파일**: `src/main/java/com/speaking/podo/applications/log/enums/SendLogType.java:3`
**용도**: 전송 로그 타입

| 값 | 설명 |
|----|------|
| SLACK | 슬랙 |
| TALK | 카카오톡 |
| SMS | 문자 메시지 |
| PUSH | 푸시 알림 |

---

### SendTalkType
**파일**: `src/main/java/com/speaking/podo/applications/log/enums/SendTalkType.java:3`
**용도**: 카카오톡 전송 타입

| 값 |
|----|
| TOAST |

---

### ServerType
**파일**: `src/main/java/com/speaking/podo/applications/log/enums/ServerType.java:3`
**용도**: 서버 타입

| 값 |
|----|
| JAVA |

---

### ToastTemplateCode
**파일**: `src/main/java/com/speaking/podo/applications/log/enums/ToastTemplateCode.java:12`
**용도**: Toast 카카오톡 템플릿 코드
**특징**:
- 일부 템플릿은 파라미터 목록을 가지고 있음 (생성자 인자)
- `ParamBuilder`를 통해 타입 안전한 파라미터 생성 가능

**주요 템플릿** (파라미터가 있는 템플릿만 일부 표시):

| 템플릿 코드 | 카테고리 | 설명 |
|------------|---------|------|
| request_to_teacher | 리스픽 | 튜터 요청 |
| ml_complete_buy | 스피킹탭 | 신규 구매 |
| ml_complete_rebuy | 스피킹탭 | 재구매 |
| ml_remind_class | 스피킹탭 | 수업 알림 (12시간/1시간 전) |
| ml_remind_class_1 | 스피킹탭 | 수업 알림 (1일 전) |
| news_complete_buy | 뉴프스피킹 | 신규 구매 |
| pd_infinityticket1 | 포도 | 무제한권 구매 (레벨테스트 x) |
| pd_infinityticket2 | 포도 | 무제한권 구매 (레벨테스트 o) |
| pd_infinityticket3 | 포도 | 무제한권 구매 (레벨테스트 미완료) |
| pd_routinepay_ok | 포도 | 정기결제 성공 |
| pd_cancel_class | 포도 | 수업 취소 |
| pd_joincoupon_7day | 포도 쿠폰 | 가입 쿠폰 (7일) |
| pd_firstclass_re1_a | 포도 | 첫수업 독려 v2 |
| pd_biz_prestudy1 | 포도 비즈니스 | 사전학습 알림 |

**파라미터 예시** (pd_infinityticket1):
```
gtUserId, templateCode, classType, recipientNo, studentName,
ClassPackageName, Lessonterm, ClassPackagePrice, ClassPackageStartDate,
ClassPackageExpireDate, Lessonperiod, TicketStartDate, TicketExpireDate,
Paymentday, MoReserveLink, PcReserveLink
```

**주의**: AlimTemplateCode.java는 전체가 주석 처리되어 사용 중지된 상태입니다.

---

## 공지(Notice) 관련 Enum

### NoticeAction
**파일**: `src/main/java/com/speaking/podo/applications/notice/enums/NoticeAction.java:3`
**용도**: 공지 액션 타입

| 값 | 설명 |
|----|------|
| REQUEST_MATCHING | 매칭 요청 |
| CANCEL_PODO_CLASS | 포도 수업 취소 |

---

### PhpPage
**파일**: `src/main/java/com/speaking/podo/applications/notice/enums/PhpPage.java:9`
**용도**: PHP 페이지 매핑

| Enum | Code (DB) |
|------|-----------|
| t_match_manage | t_match_manage.php |

---

## 알림(Notification) 관련 Enum

### NotificationType
**파일**: `src/main/java/com/speaking/podo/applications/notification/enums/NotificationType.java:3`
**용도**: 알림 전송 타입

| 값 | 설명 |
|----|------|
| KAKAO | 카카오톡 |
| PUSH | 푸시 알림 |
| EMAIL | 이메일 |
| SMS | 문자 메시지 |
| SLACK | 슬랙 |
| EXPO | Expo 푸시 |

---

### NotificationCode
**파일**: `src/main/java/com/speaking/podo/applications/notification/enums/NotificationCode.java:3`
**용도**: 알림 코드 (ToastTemplateCode의 대문자 버전)

**주요 알림 코드**:

| 코드 | 설명 |
|------|------|
| PD_SUBSCRIBE_TICKET1 | 구독 티켓 |
| PD_ROUTINEPAY_OK | 정기결제 성공 |
| PD_MKT_REG_REMIND_1/4/5 | 마케팅 등록 리마인드 |
| PD_INFINITYTICKET2/3 | 무제한권 구매 |
| PD_WEEKLYTICKET_BUY2/3 | 주간권 구매 |
| PD_FIRSTCLASS_PRE/PRE1 | 첫수업 준비 |
| PD_FIRSTCLASS_RE1_A/B/C | 첫수업 독려 |
| PD_BIZ_PRESTUDY1/2 | 비즈니스 사전학습 |
| PD_PAYBACK_BUY1/2 | 페이백 구매 |
| SLACK_PAYMENT_BILLING_SUCCESS | 슬랙 정기결제 성공 |
| SLACK_PAYMENT_EXTEND_SUCCESS | 슬랙 연장 성공 |
| SLACK_PAYMENT_DEFAULT_SUCCESS | 슬랙 일반 결제 성공 |
| SLACK_PAYMENT_TRIAL_SUCCESS | 슬랙 체험 결제 성공 |
| SLACK_PAYMENT_FIRST_BILLING_SUCCESS | 슬랙 첫 정기결제 성공 |

---

### SlackChannel
**파일**: `src/main/java/com/speaking/podo/applications/notification/enums/SlackChannel.java:8`
**용도**: 슬랙 채널별 웹훅 URL 매핑
**타입**: String (slackUri)

| Enum | 설명 |
|------|------|
| Test | 테스트 채널 |
| Operation | 운영 채널 |
| GwatopTf | 과탑 TF |
| GwatopEvent | 과탑 이벤트 |
| TeamCx | CX 팀 |
| DevQueryErr | 개발 쿼리 에러 |
| Devyoon | 개발팀(윤) |
| PAYMENT_FAIL | 결제 실패 |
| PAYMENT_DELEVERY | 결제 배송 |
| PAYMENT_SUCCESS | 결제 성공 |
| PAYMENT_TRIAL_SUCCESS | 체험 결제 성공 |
| PAYMENT_TRIAL_FAIL | 체험 결제 실패 |

**주의**: 각 Enum은 실제 Slack Webhook URL을 포함하고 있습니다.

---

## 스케줄 관련 Enum

### LangType (스케줄용)
**파일**: `src/main/java/com/speaking/podo/applications/podo/schedule/domain/enums/LangType.java:3`
**용도**: 스케줄 언어 타입 (간소화 버전)

| 값 |
|----|
| EN |
| JP |

**주의**: `core.constant.Language`와는 별도의 간소화된 Enum입니다.

---

### ScheduleDay
**파일**: `src/main/java/com/speaking/podo/applications/podo/schedule/domain/enums/ScheduleDay.java:3`
**용도**: 요일 표현

| Enum | toLower() | toFullName() |
|------|-----------|--------------|
| MON | mon | monday |
| TUE | tue | tuesday |
| WED | wed | wednesday |
| THU | thu | thursday |
| FRI | fri | friday |
| SAT | sat | saturday |
| SUN | sun | sunday |

---

### ScheduleRegType
**파일**: `src/main/java/com/speaking/podo/applications/podo/schedule/domain/enums/ScheduleRegType.java:3`
**용도**: 스케줄 등록 타입

| 값 | 설명 |
|----|------|
| CRON | 크론 작업 |
| ADMIN_BATCH | 관리자 배치 |
| TUTOR | 튜터가 등록 |

---

### ReturnCode (Schedule)
**파일**: `src/main/java/com/speaking/podo/applications/podo/schedule/domain/enums/ReturnCode.java:3`
**용도**: 스케줄 처리 결과 코드
**타입**: String (message)

**주요 에러 코드**:

| Enum | 메시지 |
|------|--------|
| INVALID_DATE | 올바르지 않은 날짜입니다. |
| INVALID_TIME_DUPLICATED | 중복된 시간이 존재합니다. |
| INVALID_TIME_EXCEEDED_24_HOUR | 24시간을 초과하는 시간은 등록할 수 없습니다. |
| INVALID_TWO_HOUR_BEFORE | 수업 시작 2시간 전에는 수업을 예약할 수 없습니다. |
| INVALID_TIME_PAST | 과거 시간은 예약할수 없습니다. |
| INVALID_HOLDING_USER | 수강권 홀딩 상태입니다. |
| INVALID_RUN_OUT_OF_CLASS_TICKET | 보유한 수강권이 부족합니다. |
| INVALID_LESSON_TIME | 레슨권의 수업시간이랑 예약하려는 수업시간이 일치하지 않습니다. |
| CLASS_NOT_FOUND | 수업정보가 없습니다. |
| SCHEDULE_NOT_FOUND | 등록된 선생님 스케줄이 없습니다. |
| CLASS_TICKET_NOT_FOUND | 수강권이 없습니다. |
| ALREADY_MY_BOOKING_EXIST | 예약된 수업이 존재합니다. |
| ALREADY_BOOKING_IN_PROGRESS | 이미 예약이 진행중입니다. |
| TUTOR_NOT_FOUND | 선택된 일시에 수업가능한 튜터가 없습니다. |
| STUDENT_NOT_FOUND | 학생 정볼르 찾을 수 없습니다. |
| SUCCESS | 성공 |

---

## 구독(Subscribe) 관련 Enum

### ReturnCode (Subscribe)
**파일**: `src/main/java/com/speaking/podo/applications/subscribe/domain/enums/ReturnCode.java:3`
**용도**: 구독 처리 결과 코드
**타입**: String (message)

| Enum | 메시지 |
|------|--------|
| SUCCESS | Success |
| SUCCESS_UPDATE | SuccessUpdate |
| SUCCESS_CREATE | SuccessCreate |
| SUCCESS_ALREADY_CANCELLED | SuccessAlreadyCancelled |
| SUBSCRIBE_MAPP_NOT_FOUND | SubscribeMappNotFound |
| SUBSCRIBE_NOT_FOUND | SubscribeNotFound |
| USER_NOT_FOUND | UserNotFound |
| PORTONE_SUBSCRIBE_SCHEDULE_NOT_FOUND | PortoneSubscribeScheduleNotFound |
| PORTONE_SUBSCRIBE_NOT_SCHEDULED | PortoneSubscribeNotScheduled |
| PORTONE_UNSCHEDULE_FAILED | PortoneUnscheduleFailed |
| PORTONE_SCHEDULE_FAILED | PortoneScheduleFailed |
| TOO_MANY_EXTEND_SUBSCRIBE_MAPP | TooManyExtendSubscribeMapp |
| INVALID_ACTION | InvalidAction |

---

## 공통 상태 코드 Enum

### PodoStatusCode (Schedule 관련 신규 추가)
**파일**: `src/main/java/com/speaking/podo/modules/exception/PodoStatusCode.java`
**용도**: 전역 HTTP 상태 코드 기반 예외 처리
**변경 이력**: 2026-02-23 Schedule 도메인의 개별 예외 클래스들을 `PodoStatusCode` 기반 `BaseException`으로 통합

**Schedule BAD_REQUEST (400)**:

| Enum | HTTP | 메시지 |
|------|------|--------|
| INVALID_DATE_FORMAT | 400 | 날짜 형식이 올바르지 않습니다. |
| FAIL_PAGE_CREATE | 400 | 페이지 생성에 실패했습니다. |
| INVALID_LECTURE | 400 | 유효하지 않은 수업입니다. |
| INVALID_HOLDING_USER | 400 | 보류 중인 사용자입니다. |
| INVALID_LESSON_TIME | 400 | 유효하지 않은 수업 시간입니다. |
| INVALID_RUN_OUT_OF_CLASS_TICKET | 400 | 수강권이 소진되었습니다. |
| INVALID_TIME_PAST | 400 | 과거 시간은 선택할 수 없습니다. |
| INVALID_TWO_HOUR_BEFORE | 400 | 2시간 전에는 예약/취소할 수 없습니다. |
| INVALID_PENALTY_USER | 400 | 패널티 상태의 사용자입니다. |
| INVALID_TICKET_DUPLICATE | 400 | 중복된 수강권입니다. |
| INVALID_DOUBLE_PACK_DUPLICATE_BOOK | 400 | 더블팩 중복 예약입니다. |
| INVALID_LECTURE_INVOICE_STATUS | 400 | 유효하지 않은 수업 결제 상태입니다. |
| INVALID_RESERVATION_TIME_DUPLICATED | 400 | 중복된 예약 시간입니다. |
| INVALID_LECTURE_NOT_UPDATED | 400 | 수업 정보 업데이트에 실패했습니다. |
| INVALID_PRESTUDY_NOT_UPDATED | 400 | 예습 정보 업데이트에 실패했습니다. |
| INVALID_TIME_EXCEEDED_24_HOUR | 400 | 24시간을 초과할 수 없습니다. |
| INVALID_TIME_DUPLICATED | 400 | 중복된 시간입니다. |
| INVALID_DATE | 400 | 유효하지 않은 날짜입니다. |
| INVALID_SCHEDULE_BLOCK_EXIST | 400 | 이미 등록된 스케줄 블록이 있습니다. |

**Schedule NOT_FOUND (404)**:

| Enum | HTTP | 메시지 |
|------|------|--------|
| STUDENT_NOT_FOUND | 404 | 학생 정보를 찾을 수 없습니다. |
| SCHEDULE_BLOCK_NOT_FOUND | 404 | 스케줄 블록을 찾을 수 없습니다. |
| COURSE_NOT_FOUND | 404 | 코스 정보를 찾을 수 없습니다. |
| SUBSCRIBE_MAPP_NOT_FOUND | 404 | 구독 매핑 정보를 찾을 수 없습니다. |
| SUBSCRIBE_NOT_FOUND | 404 | 구독 정보를 찾을 수 없습니다. |
| SCHEDULE_BASE_NOT_FOUND | 404 | 베이스 스케줄을 찾을 수 없습니다. |

**Schedule TOO_MANY_REQUESTS (429)**:

| Enum | HTTP | 메시지 |
|------|------|--------|
| BOOK_ALREADY_PROCESSING | 429 | 예약이 이미 처리 중입니다. |

**참고**: `LECTURE_NOT_FOUND`, `TUTOR_NOT_FOUND`, `LECTURE_ONLINE_NOT_FOUND` 등은 기존 `PodoStatusCode`에 이미 정의된 코드 활용

---

## 캐시 관련 Enum

### CacheType
**파일**: `src/main/java/com/speaking/podo/core/cache/CacheType.java`
**용도**: 캐시 타입 정의 (Redis 계층 캐시)

| Enum | CacheName | Expire (초) | MaxSize | 설명 |
|------|-----------|-------------|---------|------|
| LOGIN_USER | LOGIN_USER | 3600 (1시간) | 1000 | 로그인 사용자 정보 |
| CLASS_COURSE | CLASS_COURSE | 3600 (1시간) | 5 | 수업 코스 정보 (안쓰는중) |
| GET_USER | GET_USER | 3600 (1시간) | 1000 | 사용자 정보 |
| NOTIFICATION_MESSAGE_LIST | NOTIFICATION_MESSAGE_LIST | 3600 (1시간) | 5 | 알림 메시지 목록 |
| USER_RECAP | USER_RECAP | 86400 (24시간) | 10000 | 사용자 리캡 정보 |

**사용 방식**:
```java
@Cacheable(cacheNames = "USER_RECAP", key = "#userId + ':' + #subscribeMappId", cacheManager = "hierarchicalCacheManager")
public Recap getRecap(Integer userId, String subscribeMappId) { ... }
```

---

## 참고사항

### @Enumerated 어노테이션
- `@Enumerated(EnumType.STRING)`: DB에 Enum 이름 그대로 저장 (권장)
- `@Enumerated(EnumType.ORDINAL)`: DB에 순서(0, 1, 2...)로 저장 (비권장)

### Custom Converter
일부 Enum은 Custom Converter를 사용하여 DB 값과 Java Enum 간 변환:
- `LectureStatusConverter`: Integer ↔ LectureStatus
- `GenderConverter`: String ↔ Gender
- `SimpleLanguageConverter`: String ↔ Language

### DisplayStatus vs DB Status
쿠폰의 경우 DB 저장 상태(`status`)와 실제 표시 상태(`displayStatus`)가 다를 수 있음:
- DB `ACTIVE`지만 사용 기간이 지나면 → `EXPIRED`로 표시
- DB `ACTIVE`지만 사용 시작 전이면 → `PENDING`으로 표시
