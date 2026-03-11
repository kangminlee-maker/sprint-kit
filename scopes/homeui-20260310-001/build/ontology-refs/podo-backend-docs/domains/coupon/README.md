---
domain: coupon
version: 1.0.0
last_updated: 2026-01-26
author: AI Documentation Generator
status: active
complexity: high
---

# 쿠폰 도메인 개요

## 목적
쿠폰 도메인은 할인 쿠폰의 생성, 발급, 사용, 관리를 담당하는 핵심 비즈니스 도메인입니다.

## 주요 기능

### 1. 쿠폰 템플릿 관리
- 쿠폰 템플릿 생성/수정/삭제 (관리자)
- 할인 유형 설정 (정액/정률)
- 발급 조건 설정 (ApplyCondition)
- 발급 기간 및 사용 기간 설정

### 2. 쿠폰 발급
- 자동 발급 (이벤트 기반)
- 관리자 수동 발급
- 선착순 발급 (Redis 기반 동시성 제어)

### 3. 쿠폰 사용
- 결제 시 쿠폰 적용
- 쿠폰 적용 가능 여부 검증
- 할인 금액 계산

### 4. 쿠폰 조회
- 사용자별 쿠폰 목록 조회
- 쿠폰 상세 정보 조회
- 결제 화면용 쿠폰 목록 조회

## 아키텍처

```
CouponController (API Layer)
       |
       v
CouponGateway (Orchestration Layer)
       |
       v
CouponService (Business Logic Layer)
       |
       v
CouponRepository / CouponTemplateRepository (Data Access Layer)
```

## 핵심 엔티티

| 엔티티 | 설명 |
|--------|------|
| `Coupon` | 발급된 개별 쿠폰 |
| `CouponTemplate` | 쿠폰 발급 기준이 되는 템플릿 |
| `ApplyCondition` | 쿠폰 적용 조건 (JSON) |

## 연관 도메인

- **User**: 쿠폰 소유자
- **Payment**: 쿠폰 사용 (결제)
- **Subscribe**: 쿠폰 적용 대상 상품
- **Partners**: 파트너스 쿠폰 연동

## 파일 인덱스

| 파일 경로 | 역할 |
|-----------|------|
| `domain/Coupon.java` | 쿠폰 엔티티 |
| `domain/CouponTemplate.java` | 쿠폰 템플릿 엔티티 |
| `domain/serialize/ApplyCondition.java` | 적용 조건 JSON 직렬화 객체 |
| `delivery/CouponController.java` | REST API 컨트롤러 |
| `gateway/CouponGateway.java` | 비즈니스 로직 오케스트레이션 |
| `usecase/CouponService.java` | 서비스 인터페이스 |
| `usecase/CouponServiceImpl.java` | 서비스 구현체 |
| `repository/CouponRepository.java` | 쿠폰 리포지토리 |
| `repository/CouponTemplateRepository.java` | 템플릿 리포지토리 |

## 관련 문서

- [정책 문서](./policies.md) - 쿠폰 발급/사용 정책 상세
- [엔티티 문서](./entities.md) - 엔티티 스키마 및 관계
