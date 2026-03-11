---
domain: partners
type: overview
language: ko
version: 1.0
last_updated: 2026-01-26
tags: [파트너스, 제휴, 추천, 이벤트, 쿠폰]
---

# 파트너스 도메인 개요

## 컨텍스트
포도스피킹 플랫폼의 제휴 파트너 프로그램 및 추천 시스템을 관리하는 도메인입니다.

## 주요 기능

### 1. 파트너스 회원 관리
- **파트너 신청 및 승인**: 콘텐츠 크리에이터/인플루언서의 파트너 등록 관리
- **상태 관리**: PENDING → APPROVED → ACTIVE 또는 REJECTED/REVOKED 워크플로우
- **언어별 콘텐츠**: 영어(EN), 일본어(JP), 영일 복합(ENJP) 파트너 분류

### 2. 파트너스 이벤트
- **이벤트 기간 관리**: UTC 기준 시작/종료일 관리
- **구독 기간 제약**: 최소 구독 일수 요구사항 설정
- **이벤트 상태**: ACTIVE, INACTIVE, SYSTEM (상시 운영)

### 3. 추천 히스토리 (Referral History)
- **추천인-피추천인 관계 추적**: 파트너 코드 기반 신규 회원 유입 경로 기록
- **이벤트별 추천 집계**: 특정 이벤트 기간 중 추천 실적 추적
- **쿠폰 자동 발급**: 조건 만족 시 추천인/피추천인 모두에게 쿠폰 지급

### 4. 이벤트 참여 (Event Participation)
- **파트너별 이벤트 참여**: 파트너가 특정 이벤트에 참여하여 전용 추천 코드 발급
- **쿠폰 템플릿 연결**: 이벤트별 지급할 쿠폰 템플릿 ID 목록 관리
- **참여 기간 추적**: 이벤트 참여 시작일 및 종료일 기록

## 핵심 엔티티

| 엔티티 | 설명 | 테이블명 |
|--------|------|----------|
| Partners | 파트너스 회원 정보 | le_partners |
| PartnersEvent | 파트너스 이벤트 정보 | le_partners_event |
| PartnersReferralHistory | 추천 히스토리 | le_partners_referral_history |
| PartnersEventParticipation | 이벤트 참여 정보 | le_partners_event_participation |

## 비즈니스 플로우

### 파트너 등록 플로우
```
1. 사용자가 파트너 신청 (termsAccepted = true)
2. 관리자 심사 (documentSubmitted 체크)
3. 승인/거절 결정 (Status: APPROVED/REJECTED)
4. 승인된 경우 이벤트 참여 가능
```

### 추천 쿠폰 발급 플로우
```
1. 신규 회원이 파트너 추천 코드 입력하여 가입
2. ReferralHistory 레코드 생성 (referralCode 기록)
3. 구독 구매 시 최소 구독 일수 검증
4. 조건 만족 시 쿠폰 발급 (추천인/피추천인 모두)
5. EventParticipation의 couponTemplateIds 참조
```

## 관련 도메인
- **구독 도메인**: 구독 구매 시 추천 검증
- **쿠폰 도메인**: 추천 보상 쿠폰 발급
- **사용자 도메인**: 파트너 회원 정보

## 파일 경로 인덱스
```
src/main/java/com/speaking/podo/applications/partners/
├── domain/
│   ├── Partners.java
│   ├── PartnersEvent.java
│   ├── PartnersReferralHistory.java
│   └── PartnersEventParticipation.java
├── usecase/
│   ├── PartnersService.java
│   └── PartnersServiceImpl.java
├── repository/
│   ├── PartnersRepository.java
│   ├── PartnersEventRepository.java
│   ├── PartnersReferralHistoryRepository.java
│   └── PartnersEventParticipationRepository.java
└── dto/
    ├── request/ReferralHistoryCreateRequest.java
    └── PartnersCouponPublishRequest.java
```

## 참고 문서
- [파트너스 도메인 정책](./policies.md)
- [파트너스 엔티티 상세](./entities.md)
