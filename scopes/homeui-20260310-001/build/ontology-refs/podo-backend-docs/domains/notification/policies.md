---
domain: notification
type: policy
language: ko
version: 1.0
last_updated: 2026-01-26
tags: [정책, 비즈니스규칙, 알림정책, 발송규칙, 개인정보보호]
---

# 알림 도메인 정책

## 컨텍스트
포도스피킹 알림 시스템의 발송 정책 및 사용자 알림 설정 관리 규칙입니다.

---

## 1. 알림 채널별 정책

### 1.1 지원 알림 타입

**NotificationType Enum**

| 타입 | 설명 | 우선순위 | 발송 시점 |
|------|------|----------|-----------|
| KAKAO | 카카오톡 알림톡 | 높음 | 중요 알림 (결제, 수업 예약) |
| PUSH | 모바일 앱 푸시 | 중간 | 실시간 알림 (수업 시작 임박) |
| EMAIL | 이메일 | 낮음 | 마케팅, 정기 리포트 |
| SMS | 문자 메시지 | 매우 높음 | 긴급 알림 (계정 보안) |
| SLACK | Slack 메시지 | - | 내부 모니터링 전용 |
| EXPO | Expo 푸시 | 중간 | React Native 앱 푸시 |

```java
public enum NotificationType {
    KAKAO,
    PUSH,
    EMAIL,
    SMS,
    SLACK,
    EXPO
}
```

### 1.2 채널별 발송 정책

**KAKAO (카카오톡) 정책**
- **발신 프로필 분리**:
  - `PODO_SENDER_KEY`: 일반 알림 (수업, 구독)
  - `PODO_MKT_SENDER_KEY`: 마케팅 알림
- **템플릿 사전 등록**: 카카오 비즈니스 채널에서 템플릿 승인 필수
- **변수 치환**: `#{변수명}` 형식 사용
- **발송 제한**: 사용자가 채널 차단 시 발송 불가

**PUSH (모바일 푸시) 정책**
- **알림 설정 확인**: 사용자의 `AlarmType.PUSH` 설정이 'Y'인 경우만 발송
- **디바이스 토큰 유효성**: 만료된 토큰 자동 제거
- **배지 카운트**: 앱 미확인 알림 개수 표시

**EMAIL (이메일) 정책**
- **스팸 방지**: 하루 최대 5개 마케팅 메일 제한
- **수신 거부**: 이메일 하단 수신 거부 링크 필수
- **트랜잭션 메일**: 수업/결제 관련 이메일은 제한 없음

**SMS (문자 메시지) 정책**
- **긴급 알림만**: 계정 보안, 결제 실패 등 중요 알림만 사용
- **비용 고려**: SMS 발송 비용 최소화를 위해 KAKAO 우선 시도
- **080 수신 거부 번호 표기**

**SLACK (내부 모니터링) 정책**
- **채널 라우팅**: `NotificationSlackMapping` 기반 자동 채널 선택
- **에러 알림**: 예외 발생 시 실시간 Slack 전송 (`SlackByExceptionAspect`)
- **결제 알림**: 모든 결제 이벤트 Slack 기록

---

## 2. 메시지 템플릿 관리 정책

### 2.1 메시지 코드 네이밍 규칙

**형식**: `{서비스}_{카테고리}_{상세}`

**예시**:
- `PD_SUBSCRIBE_TICKET1`: 포도 구독 티켓 알림 1
- `PD_ROUTINEPAY_OK`: 포도 정기 결제 성공
- `PD_FIRSTCLASS_PRE`: 포도 첫 수업 사전 안내
- `SLACK_PAYMENT_BILLING_SUCCESS`: 슬랙 정기 결제 성공 알림

**코드 관리 클래스**: `NotificationCode` Enum

```java
public enum NotificationCode {
    PD_SUBSCRIBE_TICKET1,
    PD_ROUTINEPAY_OK,
    PD_MKT_REG_REMIND_1,
    SLACK_PAYMENT_BILLING_SUCCESS,
    // ... 총 30여 개 코드
}
```

### 2.2 템플릿 변수 치환 정책

**변수 형식**
- **단순 치환**: `${변수명}` - 문자열 직접 치환
- **SpEL 표현식**: `#{SpEL식}` - Spring Expression Language 평가

**변수 치환 우선순위**
1. `@TemplateVariable` 어노테이션 필드
2. 전달된 객체의 public 필드/게터
3. 기본 타입 (String, Integer 등) 직접 사용

**성능 최적화**
- 클래스 메타데이터 캐싱: `CLASS_METADATA_CACHE` 활용
- 변수 치환 결과 캐싱: `CASE_CONVERSION_CACHE`
- 정규식 재사용: `VARIABLE_PATTERN` 상수

### 2.3 템플릿 사용 여부 정책

**useYn 필드**
- `Y`: 활성 템플릿 (발송 가능)
- `N`: 비활성 템플릿 (발송 불가)

**비활성화 사유**
- 이벤트 종료
- 정책 변경으로 메시지 내용 부적합
- 채널 정책 위반 (카카오 템플릿 승인 거부)

---

## 3. 사용자 알림 설정 정책 (Alarm)

### 3.1 알림 타입별 설정

**AlarmType Enum**

| 타입 | 설명 | 기본값 | 변경 가능 |
|------|------|--------|-----------|
| CHILD | 자녀 알림 (학부모용) | Y | O |
| CLASS_12H | 수업 12시간 전 알림 | Y | O |
| CLASS_1H | 수업 1시간 전 알림 | Y | O |
| CLASS_24H | 수업 24시간 전 알림 | Y | O |
| CLASS_B5 | 수업 5분 전 알림 | Y | O |
| LIVE | 라이브 이벤트 알림 | Y | O |
| MAIL_LINK | 이메일 링크 알림 | Y | O |
| MARKETING | 마케팅 알림 | N | O |
| PUSH | 푸시 알림 전체 | Y | O |
| RECORD | 수업 녹화 알림 | Y | O |
| TALK | 카카오톡 알림 | Y | X (자동 설정) |
| T_CLASS_PUSH | 튜터 수업 푸시 | Y | O |
| T_CLASS_TALK | 튜터 수업 카카오톡 | Y | X |
| T_MAIL_24H | 튜터 24시간 전 이메일 | Y | O |
| T_TALK_24H | 튜터 24시간 전 카카오톡 | Y | X |

```java
public enum AlarmType {
    CHILD,
    CLASS_12H,
    CLASS_1H,
    CLASS_24H,
    CLASS_B5,
    LIVE,
    MAIL_LINK,
    MARKETING,
    PUSH,
    RECORD,
    TALK,
    T_CLASS_PUSH,
    T_CLASS_TALK,
    T_MAIL_24H,
    T_TALK_24H
}
```

### 3.2 알림 설정 변경 정책

**변경 가능 알림**
- 수업 시간대별 알림 (12H, 1H, 24H, B5)
- 마케팅 알림
- 푸시 알림 전체 ON/OFF

**변경 불가 알림**
- TALK (카카오톡): 카카오 채널 차단/해제로만 관리
- T_CLASS_TALK, T_TALK_24H: 튜터 전용 카카오톡 알림

**알림 설정 API**
```http
PATCH /api/alarm/{userId}
{
  "alarmType": "MARKETING",
  "alarmYn": "N"
}
```

### 3.3 기본 알림 설정 정책

**신규 회원 기본값**
- 모든 수업 알림: `Y` (활성)
- 마케팅 알림: `N` (비활성)
- 카카오톡 알림: `Y` (카카오 채널 추가 시)

**튜터 기본값**
- 튜터 전용 알림 (T_*): `Y` (활성)
- 수업 관련 알림: `Y` (활성)

---

## 4. Slack 연동 정책

### 4.1 Slack 채널 매핑 정책

**NotificationSlackMapping 구조**
- `messageCode`: 알림 메시지 코드
- `slackChannelName`: 전송할 Slack 채널명
- `useYn`: 사용 여부 (Y/N)

**채널 라우팅 예시**
```
SLACK_PAYMENT_BILLING_SUCCESS → #payment-notifications
SLACK_PAYMENT_EXTEND_SUCCESS → #payment-notifications
EXCEPTION_500 → #error-monitoring
```

### 4.2 예외 자동 알림 정책

**SlackByExceptionAspect 정책**
- **감지 대상**: `@RestController` 메서드에서 발생한 예외
- **전송 조건**: 500 Internal Server Error 발생 시
- **메시지 포맷**:
  ```
  [ERROR] {환경}
  Class: {클래스명}
  Method: {메서드명}
  Message: {예외 메시지}
  StackTrace: {스택 트레이스}
  ```

### 4.3 Slack 메시지 형식 정책

**결제 알림 메시지 형식**
```
🎉 정기 결제 성공
사용자: {userName} (ID: {userId})
금액: {amount}원
상품: {productName}
시각: {timestamp}
```

**에러 알림 메시지 형식**
```
🚨 서버 에러 발생
환경: {env}
API: {endpoint}
에러: {errorMessage}
시각: {timestamp}
```

---

## 5. 알림 발송 큐 정책

### 5.1 SQS 큐 사용 정책

**큐 이름 규칙**
- 형식: `notification-{env}`
- 예시: `notification-prod`, `notification-dev`

**환경별 큐 분리**
```java
String envStr = env.getActiveProfiles()[0];
if(envStr.equalsIgnoreCase("prod-temp")) envStr = "prod";
String queue = String.format("notification-%s", envStr);
```

### 5.2 비동기 발송 정책

**병렬 처리**
```java
messages.parallelStream().forEach(message -> sqsService.sendMessage(queue, message));
```

**재시도 정책**
- SQS Dead Letter Queue 활용
- 최대 3회 재시도
- 실패 시 Slack 알림

---

## 6. 개인정보 보호 정책

### 6.1 개인정보 수집 및 활용

**수집 정보**
- 알림 발송 대상: 사용자 ID, 이름, 전화번호, 이메일
- 알림 설정: 사용자별 AlarmType 설정 값

**보관 기간**
- 알림 로그: 6개월 보관 후 자동 삭제
- 알림 설정: 회원 탈퇴 시 즉시 삭제

### 6.2 마케팅 정보 수신 동의

**정보통신망법 준수**
- 마케팅 알림 발송 전 사용자 동의 필수
- `AlarmType.MARKETING` 설정 확인
- 수신 거부 링크 제공

---

## 7. 알림 발송 제한 정책

### 7.1 채널별 발송 제한

**현재 상태 (2026-01-26 검증)**
- ⚠️ 애플리케이션 레벨의 발송 제한 로직은 구현되어 있지 않음
- 채널별 발송 제한은 외부 서비스(카카오, AWS SQS 등)의 기본 정책을 따름
- 향후 필요 시 아래 정책 구현 권장:

| 채널 | 권장 제한 | 제한 기간 | 예외 |
|------|----------|-----------|------|
| KAKAO | 하루 10개 | 24시간 | 트랜잭션 알림 (수업, 결제) |
| PUSH | 하루 20개 | 24시간 | 긴급 알림 (수업 임박) |
| EMAIL | 하루 5개 | 24시간 | 트랜잭션 이메일 |
| SMS | 하루 3개 | 24시간 | 긴급 보안 알림 |

### 7.2 중복 발송 방지

**현재 상태 (2026-01-26 검증)**
- ⚠️ 중복 발송 방지 로직은 구현되어 있지 않음
- 동일 메시지가 짧은 시간 내 여러 번 발송될 수 있음
- 향후 구현 시 권장 사항:
  - 동일 `messageCode` + `userId` 조합
  - 5분 이내 중복 발송 차단
  - Redis 캐싱으로 중복 검증

**구현 위치**: `NotificationService.java` 내 `makeAndSend()` 메서드

---

## 파일 경로 인덱스
```
src/main/java/com/speaking/podo/applications/notification/
├── service/
│   └── NotificationService.java (발송 정책 구현)
├── enums/
│   ├── NotificationType.java (채널 타입 정의)
│   └── NotificationCode.java (메시지 코드 정의)
├── aspect/
│   └── SlackByExceptionAspect.java (예외 자동 알림)
└── domain/
    ├── NotificationMessage.java (템플릿 엔티티)
    └── NotificationSlackMapping.java (Slack 매핑 엔티티)

src/main/java/com/speaking/podo/applications/alarm/
├── constant/
│   └── AlarmType.java (알림 타입 정의)
└── service/
    └── AlarmServiceImpl.java (알림 설정 정책)
```

## 관련 문서
- [알림 도메인 개요](./README.md)
- [알림 엔티티 상세](./entities.md)
