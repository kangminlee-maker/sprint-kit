---
domain: notification
type: overview
language: ko
version: 1.0
last_updated: 2026-01-26
tags: [알림, 노티피케이션, 푸시, 슬랙, 카카오톡, SMS]
---

# 알림 도메인 개요

## 컨텍스트
포도스피킹 플랫폼의 다채널 알림 발송 시스템을 관리하는 도메인입니다. 사용자 알림(PUSH, 카카오톡, SMS, 이메일)과 내부 모니터링 알림(Slack)을 통합 관리합니다.

## 주요 기능

### 1. 다채널 알림 발송
- **KAKAO**: 카카오톡 알림톡/친구톡 발송
- **PUSH**: 모바일 앱 푸시 알림
- **EMAIL**: 이메일 발송
- **SMS**: 문자 메시지 발송
- **SLACK**: 내부 모니터링용 슬랙 메시지
- **EXPO**: React Native Expo 푸시

### 2. 알림 메시지 템플릿 관리
- **메시지 코드 기반 관리**: 각 알림에 고유 코드 부여 (예: `PD_SUBSCRIBE_TICKET1`)
- **템플릿 변수 치환**: `${userName}`, `#{scheduleDate}` 등 동적 변수 지원
- **카테고리 분류**: 구독, 수업, 마케팅 등 알림 유형별 분류

### 3. Slack 연동
- **채널별 라우팅**: 메시지 코드별로 특정 Slack 채널로 자동 전송
- **예외 알림**: 에러 발생 시 자동으로 Slack 알림 전송
- **결제 알림**: 구독 결제 성공 시 실시간 Slack 알림

### 4. 사용자 알림 설정 (Alarm)
- **알림 타입별 ON/OFF**: 수업 알림, 마케팅 알림 등 타입별 설정
- **시간대별 알림**: 수업 24시간 전, 1시간 전, 5분 전 알림
- **튜터/학생 구분**: 튜터와 학생의 알림 설정 분리

## 핵심 엔티티

### Notification 도메인
| 엔티티 | 설명 | 테이블명 |
|--------|------|----------|
| NotificationMessage | 알림 메시지 템플릿 | le_notification_message |
| NotificationSlackMapping | Slack 채널 매핑 정보 | le_notification_slack_mapping |

### Alarm 도메인
| 엔티티 | 설명 | 테이블명 |
|--------|------|----------|
| Alarm | 사용자별 알림 설정 | GT_ALARM_MANAGE |

## 알림 발송 플로우

### 일반 사용자 알림 플로우
```
1. 이벤트 발생 (수업 예약, 결제 완료 등)
2. NotificationService.makeAndSend(messageCode, userId, variables)
3. NotificationMessage 템플릿 조회
4. 변수 치환 (SpEL 표현식 또는 단순 치환)
5. SQS 큐에 메시지 전송 (notification-{env})
6. 외부 알림 서비스 비동기 발송
```

### Slack 알림 플로우
```
1. 내부 이벤트 발생 (결제 성공, 예외 발생 등)
2. NotificationSlackMapping 조회 (messageCode → channelName)
3. SlackService.sendMessage(channelName, message)
4. Slack Webhook API 호출
```

## 알림 타입별 특징

### KAKAO (카카오톡)
- **발신 프로필 키 사용**: `PODO_SENDER_KEY` 또는 `PODO_MKT_SENDER_KEY`
- **템플릿 사전 등록 필요**: 카카오 비즈니스 채널 관리자 콘솔에서 템플릿 승인
- **변수 치환 형식**: `#{변수명}`

### PUSH (모바일 푸시)
- **사용자 알림 설정 확인**: `AlarmType.PUSH` 설정이 'Y'인 경우만 발송
- **디바이스 토큰 기반 발송**

### SLACK (내부 모니터링)
- **채널 라우팅**: `NotificationSlackMapping` 기반 자동 채널 선택
- **메시지 코드 예시**: `SLACK_PAYMENT_BILLING_SUCCESS`, `SLACK_PAYMENT_EXTEND_SUCCESS`

## 관련 도메인
- **구독 도메인**: 결제 완료 알림, 구독 만료 알림
- **스케줄 도메인**: 수업 예약 알림, 수업 시작 알림
- **사용자 도메인**: 알림 설정 관리

## 파일 경로 인덱스
```
src/main/java/com/speaking/podo/applications/notification/
├── domain/
│   ├── NotificationMessage.java
│   └── NotificationSlackMapping.java
├── service/
│   ├── NotificationService.java
│   └── SlackService.java
├── enums/
│   ├── NotificationType.java
│   ├── NotificationCode.java
│   └── SlackChannel.java
├── listener/
│   └── NotificationListener.java
└── aspect/
    └── SlackByExceptionAspect.java

src/main/java/com/speaking/podo/applications/alarm/
├── domain/
│   └── Alarm.java
├── service/
│   ├── AlarmService.java
│   └── AlarmServiceImpl.java
└── constant/
    └── AlarmType.java
```

## 참고 문서
- [알림 도메인 정책](./policies.md)
- [알림 엔티티 상세](./entities.md)
