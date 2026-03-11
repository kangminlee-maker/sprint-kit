---
domain: schedule
type: overview
language: ko
version: 1.0
last_updated: 2026-01-26
tags: [스케줄, 튜터매칭, 수업관리, 타임블록]
---

# 스케줄 도메인 개요

## 컨텍스트
포도스피킹 플랫폼의 수업 스케줄 관리 및 튜터-학생 매칭을 담당하는 핵심 도메인입니다.

## 주요 기능

### 1. 튜터 매칭 시스템
- **매칭 가중치 기반 자동 배정**: 가격, 스케줄, NPS, 커리큘럼 요소를 종합하여 최적의 튜터를 학생에게 매칭
- **실시간 가용성 검증**: 튜터의 스케줄 가용 여부 실시간 확인
- **언어별 매칭**: 영어/일본어 등 학습 언어 타입에 따른 전문 튜터 배정

### 2. 스케줄 관리
- **기본 스케줄 (Base Schedule)**: 튜터의 주간 고정 수업 가능 시간대 관리
- **타임블록 (Time Block)**: 실제 예약된 30분 단위의 수업 시간 슬롯
- **수업 일정 변경**: 예약, 변경, 취소 및 재배정 워크플로우

### 3. 수업 시간 정책
- **30분 단위 슬롯**: 모든 수업은 30분 단위로 관리
- **UTC 기준 시간 저장**: 글로벌 서비스를 위한 UTC 표준시 적용
- **시간대 변환**: 사용자별 로케일에 맞는 시간 표시

## 핵심 엔티티

| 엔티티 | 설명 | 테이블명 |
|--------|------|----------|
| MatchingWeight | 튜터 매칭 가중치 설정 | le_matching_weight |
| ScheduleBase | 튜터 주간 기본 스케줄 | le_schedule_base |
| ScheduleTimeBlock | 예약된 30분 수업 슬롯 | le_schedule_time_block |
| LectureSchedule | 레거시 수업 일정 (GT_CLASS_SCHEDULE) | GT_CLASS_SCHEDULE |

## 관련 도메인
- **사용자 도메인**: 튜터/학생 정보
- **구독 도메인**: 수업권 및 이용권 관리
- **알림 도메인**: 수업 예약 알림

## 파일 경로 인덱스
```
src/main/java/com/speaking/podo/applications/podo/schedule/
├── domain/
│   ├── MatchingWeight.java
│   ├── ScheduleBase.java
│   ├── ScheduleTimeBlock.java
│   └── LectureSchedule.java
├── usecase/
│   ├── PodoScheduleServiceImpl.java
│   └── PodoScheduleServiceImplV2.java
├── delivery/
│   ├── PodoScheduleController.java
│   └── PodoScheduleControllerV3.java
└── repository/
    ├── MatchingWeightRepository.java
    └── MatchingWeightDslRepository.java
```

## 참고 문서
- [스케줄 도메인 정책](./policies.md)
- [스케줄 엔티티 상세](./entities.md)
