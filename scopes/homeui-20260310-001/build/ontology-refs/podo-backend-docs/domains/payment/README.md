---
domain: payment
version: 1.0.0
created_at: 2026-01-26
author: Claude AI
language: ko
tags:
  - payment
  - billing
  - subscription
  - portone
description: 결제(Payment) 도메인 개요 문서
source_files:
  - src/main/java/com/speaking/podo/applications/payment/domain/PaymentInfo.java
  - src/main/java/com/speaking/podo/applications/payment/service/PaymentService.java
  - src/main/java/com/speaking/podo/applications/payment/gateway/PaymentGateway.java
  - src/main/java/com/speaking/podo/applications/payment/controller/PaymentController.java
  - src/main/java/com/speaking/podo/applications/payment/constant/PaymentType.java
---

# 결제(Payment) 도메인

## 개요

결제 도메인은 포도(PODO) 서비스의 모든 결제 처리를 담당합니다. 체험 결제부터 정기 구독 결제까지, 포트원(Portone) PG사 연동을 통한 다양한 결제 시나리오를 지원합니다.

## 핵심 개념

### 결제 유형 (PaymentType)

| 유형 | 코드 | 카드 파킹 | 예약 | 설명 |
|------|------|----------|------|------|
| `TRIAL` | T | O | O | 체험 결제 |
| `TRIAL_FREE` | T | X | X | 무료 체험 결제 |
| `FIRST_BILLING` | F | O | O | 첫 빌링 결제 |
| `LUMP_SUM` | F | X | X | 일괄 결제 (현물 포함) |
| `BILLING` | S | X | O | 정기 결제 |
| `CANCEL` | D | X | - | 위약금 결제 |
| `BEHIND` | D | X | O | 미납 결제 |

### 결제 상태

| 상태 | 설명 |
|------|------|
| `paid` | 결제 완료 |
| `ready` | 결제 대기 |
| `failed` | 결제 실패 |
| `cancelled` | 결제 취소/환불 |

### 결제 흐름

```
[결제 시작]
    |
    v
[포트원 결제 처리]
    |
    v
[웹훅 수신] (/api/v1/payment/podo/webhook)
    |
    v
[검증 및 처리]
    |
    +---> [예약 처리] (정기결제 스케줄 등록)
    |
    +---> [데이터 처리] (수강권 생성, 구독 갱신)
    |
    v
[완료]
```

## 주요 기능

### 1. 결제 검증

- **체납자 검증**: 미납 이력 확인
- **중복 구매 검증**: 동일 커리큘럼/언어 중복 방지
- **금액 검증**: 포트원 실결제 금액과 예상 금액 일치 확인

### 2. 결제 처리

- **인증 결제**: 사용자가 직접 결제 진행
- **비인증 결제**: 카드 등록 후 자동 결제
- **직접 결제 (DirectPay)**: 카드 정보 직접 입력 결제

### 3. 정기 결제

- **첫 빌링 등록**: 카드 파킹 및 예약 등록
- **정기 결제 실행**: 예약된 일시에 자동 결제
- **실패 재시도**: 결제 실패 시 재시도 로직

### 4. 결제 후 처리

- **수강권 생성**: 결제 완료 후 수강권 자동 발급
- **구독 갱신**: 정기결제 시 구독 기간 연장
- **쿠폰 사용**: 결제 시 쿠폰 적용 및 사용 처리
- **알림 발송**: 결제 완료 알림톡 발송

## API 엔드포인트

### 결제 API (`/api/v1/payment/podo`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/validate` | 결제 전 검증 |
| POST | `/webhook` | 포트원 웹훅 수신 |
| POST | `/success` | 결제 성공 콜백 |
| GET | `/check/{impUid}` | 결제 상태 확인 (폴링) |

## 주요 연동 시스템

### 포트원 (Portone)

- 결제 게이트웨이 연동
- 웹훅 기반 결제 상태 수신
- 정기결제 스케줄 관리

### 수강권 시스템 (Ticket)

- 결제 완료 시 수강권 자동 발급
- 정기결제 시 수강권 갱신

### 구독 시스템 (Subscribe)

- 구독 상품 정보 관리
- 구독 매핑(SubscribeMapp) 생성/갱신

### 쿠폰 시스템 (Coupon)

- 결제 시 쿠폰 적용
- 쿠폰 사용 처리 및 이력 관리

## 관련 문서

- [결제 정책 상세](./policies.md)
- [엔티티 정의](./entities.md)
- [수업 도메인](../lecture/README.md)
