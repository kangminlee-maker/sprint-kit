---
domain: api
type: endpoint
related_files:
  - src/main/java/com/speaking/podo/applications/ticket/controller/TicketController.java
  - src/main/java/com/speaking/podo/applications/ticket/gateway/TicketGateway.java
  - src/main/java/com/speaking/podo/applications/ticket/service/TicketService.java
keywords: [ticket, 수강권, 이용권, 횟수, 클래스]
last_verified: 2026-01-26
---

# 수강권 API

## 엔드포인트 목록

### 1. 수강권 목록 조회

#### GET /api/v1/ticket/podo/getList
- **설명**: 사용자가 보유한 수강권 목록 조회
- **인증**: 필요
- **요청 파라미터**: 없음 (인증된 사용자 정보 사용)
- **응답**:
```json
{
  "resultCd": "200",
  "result": [
    {
      "ticketId": 1,
      "ticketName": "영어 회화 20회",
      "totalCount": 20,
      "usedCount": 5,
      "remainCount": 15,
      "startDate": "2026-01-01",
      "endDate": "2026-03-31",
      "status": "ACTIVE",
      "language": "EN",
      "lessonTime": 25
    },
    {
      "ticketId": 2,
      "ticketName": "일본어 회화 10회",
      "totalCount": 10,
      "usedCount": 0,
      "remainCount": 10,
      "startDate": "2026-01-15",
      "endDate": "2026-04-15",
      "status": "ACTIVE",
      "language": "JP",
      "lessonTime": 25
    }
  ]
}
```
- **응답 필드**:
  - `ticketId`: 수강권 ID
  - `ticketName`: 수강권 명
  - `totalCount`: 총 횟수
  - `usedCount`: 사용한 횟수
  - `remainCount`: 남은 횟수
  - `startDate`: 시작일
  - `endDate`: 종료일
  - `status`: 상태 (ACTIVE, EXPIRED, HOLD 등)
  - `language`: 언어 (EN, JP, ZH, KO 등)
  - `lessonTime`: 수업 시간 (분)
- **관련 정책**: 사용자별 수강권 조회, 유효기간 포함
- **파일**: `TicketController.java:49-66`

### 2. 수강권 횟수 변경

#### POST /api/v1/ticket/podo/updateCount
- **설명**: 수강권 횟수 변경사항 저장
- **인증**: 필요
- **요청 바디**: `ReqUpdatePodoTicketCountListDto`
```json
{
  "ticketUpdates": [
    {
      "ticketId": 1,
      "countChange": -1,
      "reason": "수업 완료"
    },
    {
      "ticketId": 2,
      "countChange": 5,
      "reason": "관리자 추가 지급"
    }
  ]
}
```
- **응답**:
```json
{
  "resultCd": "200",
  "result": {
    "updatedTickets": [
      {
        "ticketId": 1,
        "previousCount": 15,
        "newCount": 14,
        "status": "SUCCESS"
      },
      {
        "ticketId": 2,
        "previousCount": 10,
        "newCount": 15,
        "status": "SUCCESS"
      }
    ]
  }
}
```
- **관련 정책**: 수강권 차감/증가, 이력 기록
- **파일**: `TicketController.java:68-84`

### 3. Deprecated 엔드포인트

#### GET /api/v1/ticket/getInfo (Deprecated)
- **설명**: 가장 최근의 수강권 정보 1개 조회
- **상태**: Deprecated (레모네이드 전용, PODO로 마이그레이션)
- **인증**: 필요
- **요청 파라미터**:
  - `langType` (String, optional): 언어 타입
- **파일**: `TicketController.java:29-37`

#### GET /api/v1/ticket/getList (Deprecated)
- **설명**: 수강권 목록 조회 (레모네이드)
- **상태**: Deprecated
- **인증**: 필요
- **요청 파라미터**:
  - `langType` (String, optional): 언어 타입
- **파일**: `TicketController.java:39-47`

## 수강권 상태

### 상태 코드
- `ACTIVE`: 활성 (사용 가능)
- `EXPIRED`: 만료
- `HOLD`: 홀딩 (일시 정지)
- `DEPLETED`: 소진 (횟수 0)
- `INACTIVE`: 비활성

### 상태 전이
```
생성 → ACTIVE
ACTIVE → EXPIRED (유효기간 종료)
ACTIVE → DEPLETED (횟수 소진)
ACTIVE → HOLD (홀딩 요청)
HOLD → ACTIVE (홀딩 해제)
```

## 수강권 정책

### 횟수 차감 규칙
1. **수업 완료 시**: 자동으로 1회 차감
2. **노쇼/결석**: 페널티 정책에 따라 차감 (설정 가능)
3. **관리자 조정**: 수동으로 증감 가능

### 유효기간
1. **시작일**: 결제 완료일 또는 지정된 시작일
2. **종료일**: 시작일로부터 N개월 또는 지정된 종료일
3. **만료 처리**: 종료일 익일 00시에 자동으로 EXPIRED 상태로 전환

### 우선순위
여러 수강권 보유 시 사용 우선순위:
1. 만료일이 가까운 수강권
2. 남은 횟수가 적은 수강권
3. 생성일이 빠른 수강권

### 홀딩
- 홀딩 가능 기간: 수강권별 설정 (예: 최대 30일)
- 홀딩 중 유효기간 연장: 홀딩 일수만큼 자동 연장
- 홀딩 횟수 제한: 수강권당 1회 또는 설정값

## 관련 서비스

### TicketGateway
- 수강권 비즈니스 로직 게이트웨이
- 주요 메서드: `getPodoTicketList()`, `updateCount()`

### TicketService
- 수강권 CRUD 및 상태 관리
- 횟수 차감/증가, 유효기간 검증

## 주요 정책

1. **다중 수강권**: 사용자는 여러 수강권 동시 보유 가능
2. **언어별 수강권**: 언어별로 별도 수강권 필요
3. **수업 시간별 수강권**: 25분/50분 등 수업 시간별 별도 수강권
4. **자동 차감**: 수업 완료 시 자동으로 횟수 차감
5. **이력 기록**: 모든 횟수 변경사항은 이력으로 기록
6. **만료 알림**: 만료 예정 수강권에 대해 사전 알림 발송

## 에러 코드
- `404 Not Found`: 수강권을 찾을 수 없음
- `400 Bad Request`: 잘못된 요청 (횟수 부족, 만료된 수강권 등)
- `403 Forbidden`: 권한 없음 (다른 사용자의 수강권)
