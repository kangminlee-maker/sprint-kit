---
domain: notification
type: entity
language: ko
version: 1.0
last_updated: 2026-01-26
tags: [엔티티, 데이터모델, 테이블스키마, JPA]
---

# 알림 도메인 엔티티 상세

## 컨텍스트
포도스피킹 알림 도메인의 데이터 모델 및 JPA 엔티티 구조를 설명합니다.

---

## 1. NotificationMessage (알림 메시지 템플릿)

### 1.1 엔티티 개요
다채널 알림 발송에 사용되는 메시지 템플릿을 저장합니다.

**테이블명**: `le_notification_message`

### 1.2 필드 구조

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | Integer | PK, AUTO_INCREMENT | 자동 생성 ID |
| notificationCategory | String(50) | NOT NULL | 알림 카테고리 (구독, 수업, 마케팅) |
| messageCode | String(100) | NOT NULL, UNIQUE | 메시지 고유 코드 |
| messageTitle | String(200) | NOT NULL | 메시지 제목 |
| messageContent | String(TEXT) | NOT NULL | 메시지 본문 (변수 포함) |
| description | String(500) | NULLABLE | 템플릿 설명 (관리자용) |
| additionalData | String(JSON) | NULLABLE | 추가 데이터 (JSON 형식) |
| useYn | String(1) | NOT NULL, DEFAULT 'Y' | 사용 여부 (Y/N) |
| createdBy | String(50) | NOT NULL | 생성자 |
| createdAt | LocalDateTime | NOT NULL | 생성 시각 |
| updatedBy | String(50) | NULLABLE | 수정자 |
| updatedAt | LocalDateTime | NULLABLE | 수정 시각 |

### 1.3 제약조건

**UNIQUE 제약**
- `messageCode`: 중복 불가 (메시지 코드는 시스템 전체에서 고유)

**기본값**
- `useYn`: 'Y' (생성 시 자동 활성화)

### 1.4 메시지 카테고리 예시

| 카테고리 | 설명 | 예시 코드 |
|----------|------|-----------|
| SUBSCRIPTION | 구독 관련 | `PD_SUBSCRIBE_TICKET1` |
| CLASS | 수업 관련 | `PD_FIRSTCLASS_PRE` |
| PAYMENT | 결제 관련 | `PD_ROUTINEPAY_OK` |
| MARKETING | 마케팅 | `PD_MKT_REG_REMIND_1` |
| SLACK | 내부 모니터링 | `SLACK_PAYMENT_BILLING_SUCCESS` |

### 1.5 메시지 템플릿 변수 예시

**messageContent 예시**
```text
안녕하세요 ${userName}님,
${scheduleDate} #{formatTime(scheduleHour)} 수업이 예정되어 있습니다.
튜터: ${tutorName}
```

**변수 종류**
- `${변수명}`: 단순 문자열 치환
- `#{SpEL식}`: Spring Expression Language 평가

### 1.6 additionalData JSON 구조 예시

```json
{
  "kakaoTemplateCode": "T123456",
  "kakaoSenderKey": "4a715bc3c7525b6f82ec3f54bb5d7a3bd988865d",
  "priority": "high",
  "retryCount": 3
}
```

### 1.7 사용 예시

**템플릿 생성**
```java
NotificationMessage message = NotificationMessage.builder()
    .notificationCategory("CLASS")
    .messageCode("PD_CLASS_1H_BEFORE")
    .messageTitle("수업 1시간 전 알림")
    .messageContent("안녕하세요 ${userName}님, 1시간 후 ${tutorName} 튜터와 수업이 있습니다.")
    .description("수업 1시간 전 푸시 알림")
    .useYn("Y")
    .createdBy("admin")
    .createdAt(LocalDateTime.now())
    .build();
```

**템플릿 조회 및 변수 치환**
```java
NotificationMessage template = notificationMessageRepository
    .findByMessageCodeAndUseYn("PD_CLASS_1H_BEFORE", "Y")
    .orElseThrow();

String content = template.getMessageContent()
    .replace("${userName}", "홍길동")
    .replace("${tutorName}", "John");
```

---

## 2. NotificationSlackMapping (Slack 채널 매핑)

### 2.1 엔티티 개요
알림 메시지 코드와 Slack 채널 간 매핑 정보를 저장합니다.

**테이블명**: `le_notification_slack_mapping`

### 2.2 필드 구조

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | Integer | PK, AUTO_INCREMENT | 자동 생성 ID |
| messageCode | String(50) | NOT NULL | 메시지 코드 (FK) |
| slackChannelName | String(100) | NOT NULL | Slack 채널명 |
| useYn | String(1) | DEFAULT 'Y' | 사용 여부 (Y/N) |
| description | String(TEXT) | NULLABLE | 매핑 설명 |
| createdBy | String(50) | NULLABLE | 생성자 |
| createdAt | LocalDateTime | NULLABLE | 생성 시각 |
| updatedBy | String(50) | NULLABLE | 수정자 |
| updatedAt | LocalDateTime | NULLABLE | 수정 시각 |

### 2.3 라이프사이클 콜백

**@PrePersist**
```java
@PrePersist
public void prePersist() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
    if (this.useYn == null) {
        this.useYn = "Y";
    }
}
```

**@PreUpdate**
```java
@PreUpdate
public void preUpdate() {
    this.updatedAt = LocalDateTime.now();
}
```

### 2.4 Slack 채널명 규칙

**채널명 형식**
- `#payment-notifications`: 결제 관련 알림
- `#class-notifications`: 수업 관련 알림
- `#error-monitoring`: 에러 모니터링
- `#marketing-campaigns`: 마케팅 이벤트

### 2.5 매핑 예시

| messageCode | slackChannelName | 용도 |
|-------------|------------------|------|
| SLACK_PAYMENT_BILLING_SUCCESS | #payment-notifications | 정기 결제 성공 |
| SLACK_PAYMENT_EXTEND_SUCCESS | #payment-notifications | 구독 연장 성공 |
| SLACK_PAYMENT_TRIAL_SUCCESS | #payment-notifications | 무료 체험 시작 |
| EXCEPTION_500 | #error-monitoring | 서버 에러 |

### 2.6 사용 예시

**매핑 생성**
```java
NotificationSlackMapping mapping = NotificationSlackMapping.builder()
    .messageCode("SLACK_PAYMENT_BILLING_SUCCESS")
    .slackChannelName("#payment-notifications")
    .useYn("Y")
    .description("정기 결제 성공 시 Slack 알림")
    .createdBy("admin")
    .build();

notificationSlackMappingRepository.save(mapping);
```

**매핑 조회 및 Slack 전송**
```java
NotificationSlackMapping mapping = notificationSlackMappingRepository
    .findByMessageCodeAndUseYn("SLACK_PAYMENT_BILLING_SUCCESS", "Y")
    .orElse(null);

if (mapping != null) {
    slackService.sendMessage(
        mapping.getSlackChannelName(),
        "정기 결제 성공: 사용자 ID 1001"
    );
}
```

---

## 3. Alarm (사용자 알림 설정)

### 3.1 엔티티 개요
사용자별 알림 수신 설정을 저장합니다.

**테이블명**: `GT_ALARM_MANAGE`

### 3.2 필드 구조

| 필드명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | Integer | PK, AUTO_INCREMENT | 자동 생성 ID |
| userId | Integer | NOT NULL | 사용자 ID |
| alarmType | Enum(AlarmType) | NOT NULL | 알림 타입 |
| alarmYn | String(1) | NOT NULL | 알림 수신 여부 (Y/N) |
| createDateTime | LocalDateTime | NULLABLE | 생성 시각 |
| updateDateTime | LocalDateTime | NULLABLE | 수정 시각 |

### 3.3 Enum: AlarmType

```java
public enum AlarmType {
    CHILD,          // 자녀 알림
    CLASS_12H,      // 수업 12시간 전 알림
    CLASS_1H,       // 수업 1시간 전 알림
    CLASS_24H,      // 수업 24시간 전 알림
    CLASS_B5,       // 수업 5분 전 알림
    LIVE,           // 라이브 이벤트 알림
    MAIL_LINK,      // 이메일 링크 알림
    MARKETING,      // 마케팅 알림
    PUSH,           // 푸시 알림 전체
    RECORD,         // 수업 녹화 알림
    TALK,           // 카카오톡 알림
    T_CLASS_PUSH,   // 튜터 수업 푸시
    T_CLASS_TALK,   // 튜터 수업 카카오톡
    T_MAIL_24H,     // 튜터 24시간 전 이메일
    T_TALK_24H      // 튜터 24시간 전 카카오톡
}
```

**DB 컬럼 타입**: `VARCHAR(20)` (EnumType.STRING)

### 3.4 인덱스

**복합 인덱스**
- `(userId, alarmType)`: 사용자별 특정 알림 설정 조회 최적화
- UNIQUE 제약: 동일 사용자의 동일 알림 타입 중복 방지

### 3.5 사용 예시

**신규 회원 기본 알림 설정 생성**
```java
List<Alarm> defaultAlarms = Arrays.asList(
    Alarm.builder()
        .userId(1001)
        .alarmType(AlarmType.PUSH)
        .alarmYn("Y")
        .createDateTime(LocalDateTime.now())
        .build(),
    Alarm.builder()
        .userId(1001)
        .alarmType(AlarmType.MARKETING)
        .alarmYn("N")
        .createDateTime(LocalDateTime.now())
        .build()
);

alarmRepository.saveAll(defaultAlarms);
```

**알림 설정 조회**
```java
Alarm pushSetting = alarmRepository
    .findByUserIdAndAlarmType(1001, AlarmType.PUSH)
    .orElse(null);

if (pushSetting != null && "Y".equals(pushSetting.getAlarmYn())) {
    // 푸시 알림 발송
}
```

**알림 설정 수정**
```java
Alarm setting = alarmRepository
    .findByUserIdAndAlarmType(1001, AlarmType.MARKETING)
    .orElseThrow();

setting = Alarm.builder()
    .id(setting.getId())
    .userId(setting.getUserId())
    .alarmType(setting.getAlarmType())
    .alarmYn("N")  // 마케팅 알림 OFF
    .updateDateTime(LocalDateTime.now())
    .build();

alarmRepository.save(setting);
```

---

## 4. 엔티티 간 관계도

```
NotificationMessage (1) ─────────> (N) NotificationSlackMapping
    │                                       │
    └─ messageCode                          └─ slackChannelName → Slack API

Alarm (N) ─────────> (1) User
    │
    └─ userId, alarmType
```

**관계 설명**
1. **NotificationMessage ↔ NotificationSlackMapping**: 1:N
   - 하나의 메시지 코드가 여러 Slack 채널에 매핑될 수 있음 (예: 동시 전송)

2. **Alarm ↔ User**: N:1
   - 한 사용자가 여러 알림 타입 설정 보유 (userId + alarmType 복합키)

---

## 5. 데이터 타입 및 저장 형식

### 5.1 날짜/시간 필드

**LocalDateTime 사용**
- 모든 timestamp 필드는 `LocalDateTime` 타입
- DB 저장: `DATETIME` 또는 `TIMESTAMP` 컬럼

### 5.2 JSON 필드

**additionalData (NotificationMessage)**
- DB 컬럼 타입: `JSON` (MySQL 5.7+)
- Java 타입: `String` (직렬화/역직렬화 필요)
- 파싱: Jackson ObjectMapper 사용

```java
ObjectMapper mapper = new ObjectMapper();
Map<String, Object> data = mapper.readValue(
    message.getAdditionalData(),
    new TypeReference<Map<String, Object>>() {}
);
```

### 5.3 Enum 저장 방식

**EnumType.STRING 사용**
```java
@Enumerated(EnumType.STRING)
@Column(name = "ALARM_TYPE")
private AlarmType alarmType;
```

**장점**
- DB에 "PUSH", "MARKETING" 등 문자열로 저장
- Enum 순서 변경 시에도 데이터 무결성 유지

---

## 6. 성능 최적화 전략

### 6.1 인덱스 전략

| 테이블 | 인덱스 컬럼 | 용도 |
|--------|-------------|------|
| le_notification_message | messageCode (UNIQUE) | 메시지 코드 조회 |
| le_notification_message | notificationCategory | 카테고리별 조회 |
| le_notification_slack_mapping | messageCode | Slack 채널 조회 |
| GT_ALARM_MANAGE | (userId, alarmType) UNIQUE | 사용자별 알림 설정 조회 |

### 6.2 캐싱 전략

**NotificationService 내부 캐싱**
```java
private static final Map<Class<?>, List<FieldMetadata>> CLASS_METADATA_CACHE = new ConcurrentHashMap<>();
private static final Map<String, String> CASE_CONVERSION_CACHE = new ConcurrentHashMap<>();
```

**메시지 템플릿 캐싱**
- 자주 사용되는 메시지 템플릿은 Redis 캐싱
- TTL: 1시간
- 캐시 키: `notification:template:{messageCode}`

---

## 파일 경로 인덱스
```
src/main/java/com/speaking/podo/applications/notification/domain/
├── NotificationMessage.java
└── NotificationSlackMapping.java

src/main/java/com/speaking/podo/applications/alarm/domain/
└── Alarm.java

src/main/java/com/speaking/podo/applications/alarm/constant/
└── AlarmType.java
```

## 관련 문서
- [알림 도메인 개요](./README.md)
- [알림 도메인 정책](./policies.md)
