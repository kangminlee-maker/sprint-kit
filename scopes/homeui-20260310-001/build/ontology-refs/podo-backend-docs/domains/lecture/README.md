---
domain: lecture
version: 1.0.0
created_at: 2026-01-26
author: Claude AI
language: ko
tags:
  - lecture
  - class
  - lesson
  - podo
  - lemonade
description: 수업(Lecture) 도메인 개요 문서
source_files:
  - src/main/java/com/speaking/podo/applications/lecture/domain/Lecture.java
  - src/main/java/com/speaking/podo/applications/lecture/domain/enums/LectureStatus.java
  - src/main/java/com/speaking/podo/applications/lecture/domain/LectureStatusHistory.java
  - src/main/java/com/speaking/podo/applications/lecture/controller/LectureController.java
  - src/main/java/com/speaking/podo/applications/lecture/controller/LectureControllerV2.java
  - src/main/java/com/speaking/podo/applications/lecture/service/command/LectureCommandService.java
  - src/main/java/com/speaking/podo/applications/lecture/gateway/LectureGateway.java
---

# 수업(Lecture) 도메인

## 개요

수업 도메인은 포도(PODO) 서비스의 핵심 도메인으로, 학생과 튜터 간의 수업 예약, 진행, 완료에 이르는 전체 수업 생명주기를 관리합니다.

## 핵심 개념

### 수업 유형

| 유형 | 코드 | 설명 |
|------|------|------|
| 포도 정규 수업 | `PODO` | 정규 커리큘럼 기반 수업 |
| 체험 수업 | `PODO_TRIAL` | 신규 회원 체험 수업 |
| 스마트톡 | `SMART_TALK` | AI 기반 스마트톡 수업 |
| AI 챗 | `AI_CHAT` | AI 캐릭터 채팅 수업 |
| 발음학습북 | Pronunciation | 발음 학습 전용 컨텐츠 |

### 수업 상태 체계 (중요)

수업 도메인에는 **두 가지 상태 체계**가 존재합니다. 이를 명확히 구분하는 것이 중요합니다.

#### 1. LectureStatus (기본 상태)
> DB 컬럼: `CREDIT`
> 용도: 수업의 기본 등록/완료/취소 상태

| 상태 | 코드 | 설명 |
|------|------|------|
| `NONE` | 0 | 없음 |
| `REGIST` | 1 | 등록됨 |
| `DONE` | 2 | 완료됨 |
| `CANCEL` | 3 | 취소됨 |

#### 2. InvoiceStatus (정산/청구 상태)
> DB 컬럼: `INVOICE_STATUS`
> 용도: 정산, 노쇼, 환불 등 세부 처리 상태

| 상태 | 설명 | 비고 |
|------|------|------|
| `CREATED` | 생성됨 | 수업 초기 생성 상태 |
| `RESERVED` | 예약됨 | 튜터 배정 및 시간 확정 |
| `COMPLETED` | 완료됨 | 정상 수업 완료 |
| `NOSHOW_S` | 학생 노쇼 | 학생이 수업 불참 |
| `NOSHOW_BOTH` | 양측 노쇼 | 학생/튜터 모두 불참 |
| `CANCEL_NOSHOW_T` | 튜터 노쇼 취소 | 튜터 노쇼로 인한 취소 |
| `CANCEL` | 취소 | 일반 취소 |
| `CANCEL_PAID` | 유료 취소 | 위약금 발생 취소 |

### 수업 흐름

```
[생성] CREATED
    |
    v
[예약] RESERVED (튜터 배정, 시간 확정)
    |
    +---> [완료] COMPLETED (정상 완료)
    |
    +---> [노쇼] NOSHOW_S / NOSHOW_BOTH / CANCEL_NOSHOW_T
    |
    +---> [취소] CANCEL / CANCEL_PAID
```

## 주요 기능

### 1. 수업 생성 및 예약

- **수업 생성**: 수강권(Ticket) 기반으로 수업 생성
- **선행학습(Prestudy)**: 본 수업 전 예습 컨텐츠 제공
- **튜터 배정**: 예약 시 튜터 자동/수동 배정

### 2. 수업 진행

- **레몬보드(Lemonboard)**: 실시간 화상 수업 플랫폼
- **페이지콜(Pagecall)**: 교재 기반 수업 도구 (레거시)
- **수업 입장**: 학생/튜터 각각의 수업방 URL 생성

### 3. 수업 완료 및 평가

- **수업 완료 처리**: 정산 상태 업데이트
- **수업 평가**: 강의력, 준비도, 케어 점수 기록
- **수업 다시보기**: 완료된 수업 녹화본 제공

### 4. 선행학습 관리

- **선행학습 시간 추적**: Redis 락 기반 실시간 추적
- **선행학습 완료**: 일정 시간(8분) 이상 학습 시 완료 처리
- **알림톡 연동**: 선행학습 독려 알림 발송/비활성화

## API 엔드포인트

### V1 API (`/api/v1/lecture`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/getLeLectureEnterInfo` | 수업 입장 정보 조회 |
| GET | `/getLeLectureReplayInfo` | 수업 다시보기 정보 |
| GET | `/getLeRecentLectureInfo` | 최근 수업 조회 |
| GET | `/getReserveLeLectureList` | 예정 수업 목록 |
| GET | `/getFinishLeLectureList` | 완료 수업 목록 |
| GET | `/podo/getPodoTrialLectureList` | 체험 수업 목록 |
| GET | `/podo/getNextLectureInfo` | 다음 수업 조회 |
| GET | `/podo/getNextLectureList` | 예약된 수업 목록 |

### V2 API (`/api/v2/lecture`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/podo/createPodoClass` | 수업 생성 (V2) |
| POST | `/podo/createPodoChat` | AI 챗 수업 생성 |
| POST | `/podo/updatePreStudyTime` | 선행학습 시간 업데이트 |
| POST | `/podo/finishPreStudyTime` | 선행학습 완료 |
| GET | `/podo/getLectureList` | 수업 목록 조회 |
| GET | `/podo/getCompletedLecture` | 완료된 수업 상세 |
| POST | `/podo/copyPodoClassRoom` | 수업방 복제 |
| POST | `/podo/changeTrialClassLevel` | 체험 수업 레벨 변경 |

## 관련 문서

- [수업 정책 상세](./policies.md)
- [엔티티 정의](./entities.md)
- [결제 도메인](../payment/README.md)
