---
domain: subscription
title: "구독 도메인 개요"
version: 1.0.0
last_updated: 2026-01-26
context_for: RAG
file_index:
  - entities.md
  - policies.md
related_domains:
  - ticket
  - payment
---

# 구독 도메인 (Subscription Domain)

## 컨텍스트
이 문서는 포도(PODO) 영어/일본어 회화 서비스의 **구독 시스템**을 설명합니다. 구독은 사용자가 수업을 받기 위해 선택하는 **결제 상품**을 정의하며, 수강권(Ticket) 발급의 기준이 됩니다.

---

## 도메인 목적
- 다양한 구독 상품 정의 및 관리
- 사용자의 구독 신청/변경/해지 처리
- 결제 주기 및 수업 횟수 관리
- 구독 이력 추적

---

## 핵심 개념 요약

### 1. 구독 상품 (Subscribe)
결제 가능한 상품 정보를 정의합니다.

| 속성 | 설명 | 예시 값 |
|------|------|---------|
| `subType` | 구독 유형 | 정기권, 회차권 |
| `classType` | 수업 유형 | PODO |
| `langType` | 언어 유형 | EN, JP, ENJP |
| `paymentType` | 결제 유형 | SUBSCRIBE, LUMP_SUM, TRIAL, EXTEND, BONUS |
| `curriculumType` | 커리큘럼 유형 | BASIC, BUSINESS, SMART_TALK |
| `lessonMonth` | 결제 주기(월) | 1, 3, 6, 12 |
| `lessonCountPerMonth` | 월 수업 횟수 | 4, 8, 12, 999(무제한) |
| `lessonTime` | 수업 시간(분) | 25 |

### 2. 구독 매핑 (SubscribeMapp)
사용자가 실제로 신청한 구독 정보입니다.

| 속성 | 설명 |
|------|------|
| `userId` | 구독자 ID |
| `subscribeId` | 구독 상품 ID |
| `startDate` | 구독 시작일 |
| `endDate` | 구독 종료일 |
| `nextPaymentDate` | 다음 결제 예정일 |
| `status` | 구독 상태 |
| `paymentCount` | 결제 완료 횟수 |

### 3. 구독 상태 흐름
```
신규가입 → SUBSCRIBE(정기) / LUMP_SUM(일괄)
                    ↓
    수업 이용 중 (수강권 차감)
                    ↓
    해지요청 → FINISH / DELETE
```

---

## 주요 비즈니스 규칙

### 언어 조합 (langType)
- **EN**: 영어 전용
- **JP**: 일본어 전용
- **ENJP**: 영어+일본어 동시 구독 (수강권이 언어별로 분리 발급됨)

### 무제한 vs 회차 구독
- `lessonCountPerMonth == 999`: 무제한 수강권 (UNLIMIT) 발급
- `lessonCountPerMonth != 999`: 회차 수강권 (COUNT) 발급

### 결제 유형별 특성
| 유형 | 설명 | 갱신 방식 |
|------|------|----------|
| SUBSCRIBE | 정기 결제 | 매월 자동 결제 |
| LUMP_SUM | 일괄 결제 | 한 번에 전체 기간 결제 |
| TRIAL | 체험 | 무료 또는 할인 체험 |
| EXTEND | 연장 | 기존 구독 연장 |
| BONUS | 보상권 | 운영팀 지급 |

---

## 관련 엔티티 파일
| 엔티티 | 파일 경로 |
|--------|----------|
| Subscribe | `src/main/java/.../subscribe/domain/Subscribe.java` |
| SubscribeMapp | `src/main/java/.../subscribe/domain/SubscribeMapp.java` |
| SubscribeItem | `src/main/java/.../subscribe/domain/SubscribeItem.java` |
| SubscribeMappHistory | `src/main/java/.../subscribe/domain/SubscribeMappHistory.java` |
| SubscribeOrigin | `src/main/java/.../subscribe/domain/SubscribeOrigin.java` |

---

## 연관 도메인
- **Ticket (수강권)**: 구독에 따라 수강권이 발급됨
- **Payment (결제)**: 구독 결제 처리
- **Schedule (스케줄)**: 수업 예약 시 수강권 사용
