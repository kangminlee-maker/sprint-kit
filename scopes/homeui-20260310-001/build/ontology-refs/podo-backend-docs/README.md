---
domain: root
type: index
title: "PODO 백엔드 정책 RAG DB - 진입점"
version: 1.0
language: ko
last_updated: 2026-01-26
tags: [PODO, 백엔드, 정책, RAG, 도메인, 네비게이션]
keywords: [구독, 결제, 수강권, 쿠폰, 수업, 튜터, 사용자, 결제]
target_audience: [기획자, UX 디자이너, 비개발 직군, 신규 개발자]
---

# PODO 백엔드 정책 RAG DB

**포도스피킹 영어/일본어 회화 서비스의 백엔드 정책을 검색 가능한 형태로 정리한 문서입니다.**

기획자, UX 디자이너, 비개발 직군을 위해 기술 용어를 최소화하고 비즈니스 관점에서 서비스 정책을 설명합니다.

---

## 빠른 네비게이션

### 자주 묻는 질문 & 답변

| 질문 | 답변 페이지 |
|------|-----------|
| "구독은 어떻게 동작해?" | [구독 플로우](./business/subscription-flow.md) |
| "수강권 타입이 뭐가 있어?" | [수강권 정책](./domains/ticket/policies.md) |
| "수업 상태가 뭐가 있어?" | [수업 엔티티](./domains/lecture/entities.md) |
| "쿠폰 발급 조건이 뭐야?" | [쿠폰 정책](./domains/coupon/policies.md) |
| "결제 플로우가 어떻게 돼?" | [결제 플로우](./business/payment-flow.md) |
| "튜터 매칭은 어떤 기준이야?" | [스케줄 정책](./domains/schedule/policies.md) |
| "알림은 어떻게 발송돼?" | [알림 정책](./domains/notification/policies.md) |
| "파트너 쿠폰은 언제 발급돼?" | [파트너스 정책](./domains/partners/policies.md) |

---

## 문서 구조

### 📁 **domains/** - 도메인 관점 (10개 도메인)

각 도메인의 비즈니스 정책, 엔티티 정보를 정리한 **가장 상세한** 문서입니다.

#### 1. **구독 (Subscription)**
- [개요](./domains/subscription/README.md) | [정책](./domains/subscription/policies.md) | [엔티티](./domains/subscription/entities.md)
- 구독 상품 정의, 사용자 구독 신청/변경/해지

#### 2. **결제 (Payment)**
- [개요](./domains/payment/README.md) | [정책](./domains/payment/policies.md) | [엔티티](./domains/payment/entities.md)
- Toss Payments 연동, 정기 결제, 결제 실패 처리

#### 3. **수강권 (Ticket)**
- [개요](./domains/ticket/README.md) | [정책](./domains/ticket/policies.md) | [엔티티](./domains/ticket/entities.md)
- 수강권 종류, 유효 기간, 차감 및 복구 정책

#### 4. **쿠폰 (Coupon)**
- [개요](./domains/coupon/README.md) | [정책](./domains/coupon/policies.md) | [엔티티](./domains/coupon/entities.md)
- 쿠폰 타입, 발급 제한, 할인 정책, 중복 사용 방지

#### 5. **수업 (Lecture)**
- [개요](./domains/lecture/README.md) | [정책](./domains/lecture/policies.md) | [엔티티](./domains/lecture/entities.md)
- 수업 진행 상태, 자료 관리, 피드백, 녹화

#### 6. **스케줄 (Schedule)**
- [개요](./domains/schedule/README.md) | [정책](./domains/schedule/policies.md) | [엔티티](./domains/schedule/entities.md)
- 튜터 매칭 가중치, 타임블록 관리, UTC 시간 정책

#### 7. **진단 (Diagnosis)**
- [개요](./domains/diagnosis/README.md) | [정책](./domains/diagnosis/policies.md) | [엔티티](./domains/diagnosis/entities.md)
- 레벨 테스트 문제 출제, 언어별 진단, 자동 채점

#### 8. **알림 (Notification)**
- [개요](./domains/notification/README.md) | [정책](./domains/notification/policies.md) | [엔티티](./domains/notification/entities.md)
- 다채널 알림 (카카오톡, 푸시, 이메일, SMS, Slack), 메시지 템플릿

#### 9. **파트너스 (Partners)**
- [개요](./domains/partners/README.md) | [정책](./domains/partners/policies.md) | [엔티티](./domains/partners/entities.md)
- 파트너 승인, 추천 히스토리, 쿠폰 발급 정책

#### 10. **사용자 (User)**
- [개요](./domains/user/README.md) | [정책](./domains/user/policies.md) | [엔티티](./domains/user/entities.md)
- 회원 가입, 인증, 튜터/학생 역할 관리, 탈퇴 처리

---

### 📁 **business/** - 비즈니스 플로우 관점

**엔드-투-엔드** 비즈니스 프로세스를 설명합니다. 여러 도메인이 연결된 전체 흐름을 이해하고 싶을 때 읽으세요.

- [비즈니스 개요](./business/README.md) - 전체 플로우 소개
- [구독 플로우](./business/subscription-flow.md) - 구독 가입부터 해지까지
- [결제 플로우](./business/payment-flow.md) - 결제 시작부터 완료까지
- [수업 플로우](./business/lecture-flow.md) - 수업 생성부터 완료까지
- [쿠폰 정책](./business/coupon-policy.md) - 쿠폰 발급, 사용, 환수
- [수강권 정책](./business/ticket-policy.md) - 수강권 생성, 사용, 만료

---

### 📁 **database/** - 데이터베이스 관점

**테이블과 데이터 구조** 중심의 문서입니다. 데이터 모델을 이해하고 싶을 때 읽으세요.

- [데이터베이스 개요](./database/README.md) - 핵심 테이블 및 관계
- [테이블 스키마](./database/tables/) - 개별 테이블 상세 문서
  - [GT_USER](./database/tables/GT_USER.md)
  - [GT_SUBSCRIBE](./database/tables/GT_SUBSCRIBE.md)
  - [GT_SUBSCRIBE_MAPP](./database/tables/GT_SUBSCRIBE_MAPP.md)
  - [GT_CLASS](./database/tables/GT_CLASS.md)
  - [GT_CLASS_TICKET](./database/tables/GT_CLASS_TICKET.md)
  - [GT_PAYMENT_INFO](./database/tables/GT_PAYMENT_INFO.md)
  - [le_coupon_template](./database/tables/le_coupon_template.md)
  - [le_coupon](./database/tables/le_coupon.md)
- [Enum 타입](./database/enums.md) - 모든 Enum 정의
- [테이블 관계](./database/relationships.md) - JOIN 패턴, 관계도

---

### 📁 **api/** - REST API 관점

**API 엔드포인트**를 도메인별로 분류한 문서입니다. API 통합이나 클라이언트 개발 시 참조하세요.

- [API 개요](./api/README.md) - API 버전, 공통 규칙
- [사용자 API](./api/user-api.md)
- [인증 API](./api/auth-api.md)
- [수강권 API](./api/ticket-api.md)
- [수업 API](./api/lecture-api.md)
- [결제 API](./api/payment-api.md)
- [쿠폰 API](./api/coupon-api.md)

---

### 📁 **index/** - 파일 인덱스

**코드 파일 위치**를 검색할 때 사용합니다. 개발자 전용입니다.

- [인덱스 개요](./index/README.md)
- [도메인별 파일 인덱스](./index/by-domain.md) - 도메인 → 파일 위치
- [엔티티별 파일 인덱스](./index/by-entity.md) - 테이블 → 관련 파일
- [컨트롤러별 파일 인덱스](./index/by-controller.md) - API → 구현 파일

---

## 검색 키워드 인덱스

빠르게 원하는 문서를 찾기 위한 **비즈니스 용어 → 문서 매핑**입니다.

### 결제 관련
| 검색어 | 문서 |
|--------|------|
| 정기 결제, 자동 갱신 | [결제 정책](./domains/payment/policies.md) |
| 빌링키, PG사 | [결제 엔티티](./domains/payment/entities.md) |
| 결제 실패, 재시도 | [결제 플로우](./business/payment-flow.md) |
| 환불 | [결제 정책](./domains/payment/policies.md) |

### 구독 관련
| 검색어 | 문서 |
|--------|------|
| 구독 가입, 취소 | [구독 정책](./domains/subscription/policies.md) |
| 구독 상태 | [구독 엔티티](./domains/subscription/entities.md) |
| 구독 연장 | [구독 플로우](./business/subscription-flow.md) |
| 무제한 vs 회차권 | [구독 정책](./domains/subscription/policies.md) |

### 수강권 관련
| 검색어 | 문서 |
|--------|------|
| 수강권 종류 | [수강권 정책](./domains/ticket/policies.md) |
| 수강권 만료, 유효 기간 | [수강권 정책](./domains/ticket/policies.md) |
| 보너스 수강권 | [수강권 정책](./domains/ticket/policies.md) |
| 수강권 차감, 복구 | [수강권 정책](./domains/ticket/policies.md) |

### 쿠폰 관련
| 검색어 | 문서 |
|--------|------|
| 쿠폰 발급 조건 | [쿠폰 정책](./domains/coupon/policies.md) |
| 정액 vs 정률 할인 | [쿠폰 정책](./domains/coupon/policies.md) |
| 쿠폰 중복 사용 방지 | [쿠폰 정책](./domains/coupon/policies.md) |
| 쿠폰 만료, 회수 | [쿠폰 정책](./domains/coupon/policies.md) |
| 파트너 쿠폰 | [파트너스 정책](./domains/partners/policies.md) |

### 수업 관련
| 검색어 | 문서 |
|--------|------|
| 수업 상태, 라이프사이클 | [수업 엔티티](./domains/lecture/entities.md) |
| 녹화 영상 | [수업 정책](./domains/lecture/policies.md) |
| 수업 자료, 교재 | [수업 정책](./domains/lecture/policies.md) |
| 수업 평가, 피드백 | [수업 정책](./domains/lecture/policies.md) |

### 사용자 관련
| 검색어 | 문서 |
|--------|------|
| 튜터 매칭 | [스케줄 정책](./domains/schedule/policies.md) |
| 매칭 가중치 | [스케줄 정책](./domains/schedule/policies.md) |
| 회원 탈퇴, 휴면 | [사용자 정책](./domains/user/policies.md) |
| 역할 (튜터/학생) | [사용자 엔티티](./domains/user/entities.md) |

### 알림 관련
| 검색어 | 문서 |
|--------|------|
| 카카오톡 알림 | [알림 정책](./domains/notification/policies.md) |
| 푸시 알림 | [알림 정책](./domains/notification/policies.md) |
| 이메일, SMS | [알림 정책](./domains/notification/policies.md) |
| 메시지 템플릿 | [알림 정책](./domains/notification/policies.md) |

---

## 문서 활용 가이드

### 신규 팀원 온보딩

**추천 학습 순서:**

1. 이 문서 (README.md) - 전체 구조 파악
2. [비즈니스 플로우 개요](./business/README.md) - 핵심 플로우 이해
3. 관심 도메인의 README.md - 각 도메인 컨텍스트 파악
4. 관심 도메인의 policies.md - 비즈니스 규칙 상세 학습
5. [데이터베이스 개요](./database/README.md) - 데이터 모델 이해

**예시 - "구독 시스템 이해하기":**
1. [구독 개요](./domains/subscription/README.md)
2. [구독 플로우](./business/subscription-flow.md)
3. [구독 정책](./domains/subscription/policies.md)
4. [결제 정책](./domains/payment/policies.md) (연관)

### 기획/UX 작업

**기획 문서 작성 전:**
- 해당 도메인의 policies.md 읽기
- 기존 정책과 신규 기획의 충돌 확인
- 관련 도메인의 정책도 함께 검토

**예시 - "새로운 쿠폰 할인 정책 기획":**
1. [쿠폰 정책](./domains/coupon/policies.md) - 기존 할인 정책 확인
2. [쿠폰 엔티티](./domains/coupon/entities.md) - 데이터 구조 이해
3. [결제 정책](./domains/payment/policies.md) - 결제와의 연관성 확인
4. [쿠폰 플로우](./business/coupon-policy.md) - 전체 플로우 이해

### 개발자 작업

**새로운 기능 개발:**
1. [도메인별 파일 인덱스](./index/by-domain.md) - 해당 도메인 파일 찾기
2. 해당 도메인의 policies.md - 비즈니스 규칙 상세 학습
3. 해당 도메인의 entities.md - 데이터 모델 파악
4. 코드 파일 위치 확인

**버그 수정/리팩토링:**
1. [컨트롤러별 파일 인덱스](./index/by-controller.md) - API 관련 파일 추적
2. [엔티티별 파일 인덱스](./index/by-entity.md) - 데이터 레이어 추적
3. 해당 도메인의 policies.md - 비즈니스 규칙 재확인

---

## 문서 통계

| 항목 | 수량 |
|------|------|
| **총 도메인 수** | 10개 |
| **총 문서 파일 수** | 50+ 개 |
| **총 문서 라인 수** | 3,000+ 줄 |
| **평균 도메인 문서** | ~300줄 |
| **메타데이터 포함** | YAML front matter (RAG 최적화) |

---

## 문서 메타데이터

모든 문서는 RAG 시스템 최적화를 위해 YAML 메타데이터를 포함합니다:

```yaml
---
domain: {도메인명}
type: overview | policy | entity
language: ko
version: 1.0
last_updated: 2026-01-26
tags: [태그1, 태그2, ...]
keywords: [키워드1, 키워드2, ...]
---
```

---

## 주요 용어 정리

### 구독 타입
- **TRIAL**: 체험권 (1회 무료)
- **SUBSCRIBE**: 정기 구독 (월 단위 자동 결제)
- **LUMP_SUM**: 일시불 (전체 금액 선결제)
- **EXTEND**: 연장 구독 (기존 구독 연장)
- **BONUS**: 보너스 수강권 (무료 제공)

### 수강권 타입
- **COUNT**: 회차권 (정해진 횟수)
- **UNLIMIT**: 무제한권 (기간 내 무제한)
- **PODO_TRIAL**: 체험권
- **REGULAR**: 정기권

### 수업 상태
- **PRESTUDY**: 예습 중
- **REGIST**: 예약 대기
- **RESERVED**: 예약 완료
- **START**: 수업 시작
- **FINISH**: 수업 완료
- **CANCEL**: 취소

### 언어 타입
- **EN**: 영어
- **JP**: 일본어
- **ENJP**: 영어+일본어 (다언어 패키지)

### 쿠폰 할인 타입
- **FIXED**: 정액 할인 (예: 5,000원 할인)
- **RATIO**: 정률 할인 (예: 10% 할인)
- **EXTENSION**: 기간 연장 (예: 3개월 추가)

---

## 문서 유지보수

### 업데이트 주기
- **정기 업데이트**: 분기별 (3개월)
- **긴급 업데이트**: 중요 정책 변경 시 즉시

### 버전 관리
- `version` 필드: 주요 변경 시 증가
- `last_updated` 필드: 최종 업데이트 날짜

### 변경 대상
- 신규 기능 추가
- 정책 변경 (할인율, 가중치 등)
- Enum 타입 추가
- 테이블 스키마 변경

---

## 다음 단계

### 단기 (1주 내)
- [ ] RAG 시스템에 모든 문서 임베딩
- [ ] 질의응답 시스템 테스트
- [ ] 팀원 피드백 수집

### 중기 (1개월 내)
- [ ] 나머지 도메인 문서 보강
- [ ] API 문서 자동 생성 연동
- [ ] 문서 검색 UI 개발

### 장기 (3개월 내)
- [ ] 다국어 번역 (영어, 일본어)
- [ ] 인터랙티브 다이어그램 추가
- [ ] 버전 관리 자동화

---

## 피드백 및 문의

문서에 대한 피드백이나 수정 사항이 있으시면:

1. 해당 문서의 이슈 등록
2. PR 제출
3. 팀 채널에 피드백 공유

---

## 참고 자료

### 전체 구조
```
.omc/docs/
├── README.md (이 파일)
├── domains/ (10개 도메인, 각 3개 파일)
│   ├── subscription/
│   ├── payment/
│   ├── ticket/
│   ├── coupon/
│   ├── lecture/
│   ├── schedule/
│   ├── diagnosis/
│   ├── notification/
│   ├── partners/
│   └── user/
├── business/ (비즈니스 플로우)
│   ├── README.md
│   ├── subscription-flow.md
│   ├── payment-flow.md
│   ├── lecture-flow.md
│   ├── coupon-policy.md
│   └── ticket-policy.md
├── database/ (스키마, 관계)
│   ├── README.md
│   ├── tables/
│   ├── enums.md
│   └── relationships.md
├── api/ (API 엔드포인트)
│   ├── README.md
│   ├── user-api.md
│   ├── auth-api.md
│   ├── ticket-api.md
│   ├── lecture-api.md
│   ├── payment-api.md
│   └── coupon-api.md
└── index/ (파일 위치 인덱스)
    ├── README.md
    ├── by-domain.md
    ├── by-entity.md
    └── by-controller.md
```

### 코드 위치
```
src/main/java/com/speaking/podo/applications/
├── subscription/
├── payment/
├── ticket/
├── lecture/
├── schedule/
├── diagnosis/
├── notification/
├── partners/
└── user/
```

---

## 작성 정보

- **작성일**: 2026-01-26
- **작성자**: Claude Code (AI Documentation Generator)
- **대상**: 기획자, UX 디자이너, 비개발 직군, 신규 개발자
- **언어**: 한국어
- **버전**: 1.0

---

## 라이센스

이 문서는 포도스피킹 내부 사용 목적으로만 작성되었습니다.
외부 공개 시 민감한 비즈니스 로직 및 개인정보 관련 내용 제거 필요합니다.

---

**마지막 업데이트**: 2026-01-26
**다음 정기 검토**: 2026-04-26
