---
title: 데이터베이스 스키마 개요
domain: database
scope: overview
created: 2026-01-26
---

# 데이터베이스 스키마 개요

## 목적
정책 RAG DB의 핵심 테이블과 관계를 데이터베이스 관점에서 설명합니다.

## 핵심 도메인

### 1. 사용자 도메인
- **GT_USER**: 회원 정보 (학생 및 튜터)
- **GT_SUBSCRIBE**: 구독 상품 정의
- **GT_SUBSCRIBE_MAPP**: 사용자별 구독 활성화 매핑

### 2. 수업 도메인
- **GT_CLASS**: 수업 스케줄 및 상태
- **GT_CLASS_TICKET**: 수강권 (분 단위 또는 횟수 단위)

### 3. 결제 도메인
- **GT_PAYMENT_INFO**: 결제 정보

### 4. 쿠폰 도메인
- **le_coupon_template**: 쿠폰 템플릿
- **le_coupon**: 사용자별 발급된 쿠폰

## 주요 관계

```
GT_USER (1) ─── (N) GT_SUBSCRIBE_MAPP
              └─── (N) GT_CLASS_TICKET
              └─── (N) GT_CLASS (학생)
              └─── (N) GT_CLASS (튜터)
              └─── (N) le_coupon

GT_SUBSCRIBE (1) ─── (N) GT_SUBSCRIBE_MAPP

GT_SUBSCRIBE_MAPP (1) ─── (N) GT_CLASS_TICKET
                      └─── (N) GT_PAYMENT_INFO

GT_CLASS_TICKET (1) ─── (N) GT_CLASS

le_coupon_template (1) ─── (N) le_coupon
```

## 문서 구조

### 테이블 문서
각 테이블별 상세 문서는 `tables/` 하위에 위치:
- [GT_USER.md](tables/GT_USER.md)
- [GT_SUBSCRIBE.md](tables/GT_SUBSCRIBE.md)
- [GT_SUBSCRIBE_MAPP.md](tables/GT_SUBSCRIBE_MAPP.md)
- [GT_CLASS_TICKET.md](tables/GT_CLASS_TICKET.md)
- [GT_CLASS.md](tables/GT_CLASS.md)
- [GT_PAYMENT_INFO.md](tables/GT_PAYMENT_INFO.md)
- [le_coupon_template.md](tables/le_coupon_template.md)
- [le_coupon.md](tables/le_coupon.md)

### Enum 문서
모든 Enum 정의는 [enums.md](enums.md) 참조

### 관계 문서
테이블 간 관계 및 JOIN 패턴은 [relationships.md](relationships.md) 참조

## 엔티티 파일 위치

```
src/main/java/com/speaking/podo/applications/
├── user/domain/User.java
├── subscribe/domain/
│   ├── Subscribe.java
│   └── SubscribeMapp.java
├── ticket/domain/Ticket.java
├── lecture/domain/
│   ├── Lecture.java
│   └── enums/LectureStatus.java
├── payment/domain/PaymentInfo.java
└── coupon/domain/
    ├── CouponTemplate.java
    └── Coupon.java
```

## 참고사항

### 타임존 처리
- DB는 UTC 저장, JPA는 KST로 읽음 (현재)
- `WithZone()` 메서드로 타임존 변환 제공
- 향후 DB 연결 설정에서 KST 제거 예정

### Enum vs Inner Enum
- **LectureStatus**: 별도 Enum 파일 (NONE, REGIST, DONE, CANCEL)
- **Lecture.InvoiceStatus**: Inner Enum (CREATED, RESERVED, COMPLETED, ...)

### 네이밍 규칙
- 테이블명: `GT_*` (일반), `le_*` (쿠폰)
- 컬럼명: UPPER_SNAKE_CASE (일부 소문자 예외)
