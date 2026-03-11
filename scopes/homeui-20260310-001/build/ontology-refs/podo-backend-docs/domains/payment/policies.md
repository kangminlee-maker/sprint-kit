---
domain: payment
document_type: policies
version: 1.0.0
created_at: 2026-01-26
author: Claude AI
language: ko
tags:
  - payment
  - policy
  - business-rules
description: 결제 도메인 비즈니스 정책 상세
source_files:
  - src/main/java/com/speaking/podo/applications/payment/gateway/PaymentGateway.java
  - src/main/java/com/speaking/podo/applications/payment/service/PaymentServiceImpl.java
  - src/main/java/com/speaking/podo/applications/payment/constant/PaymentType.java
---

# 결제 정책 상세

## 1. 결제 유형 정책

### 1.1 PaymentType 상세

결제 유형은 `PaymentType` Enum으로 정의되며, 각 유형별로 처리 방식이 다릅니다.

#### 체험 결제 (TRIAL)

| 속성 | 값 |
|------|-----|
| paymentDiv | T |
| 카드 파킹 | O |
| 예약 | O |
| 데이터 생성 | O |

**처리 흐름**:
1. 결제 검증 (체납자, 중복 구매)
2. 결제 처리
3. 카드 정보 저장 (파킹)
4. 7일 후 체험 종료 스케줄 등록 (스마트톡: 1일)
5. 체험 수강권 발급
6. 발음학습북 추가

#### 무료 체험 결제 (TRIAL_FREE)

| 속성 | 값 |
|------|-----|
| paymentDiv | T |
| 카드 파킹 | X |
| 예약 | X |
| 데이터 생성 | O |

**처리 흐름**:
1. 결제 검증
2. 0원 결제 처리
3. 체험 수강권 발급

#### 첫 빌링 결제 (FIRST_BILLING)

| 속성 | 값 |
|------|-----|
| paymentDiv | F |
| 카드 파킹 | O |
| 예약 | O |
| 데이터 생성 | O |

**처리 흐름**:
1. 결제 검증
2. 결제 처리
3. 카드 정보 저장
4. 정기결제 스케줄 등록
5. 정규 수강권 발급
6. 체험 수업 종료 처리
7. 발음학습북 추가

#### 일괄 결제 (LUMP_SUM)

| 속성 | 값 |
|------|-----|
| paymentDiv | F |
| 카드 파킹 | X |
| 예약 | X |
| 데이터 생성 | O |

**처리 흐름**:
1. 결제 검증
2. 결제 처리
3. 정규 수강권 발급 (전체 기간)
4. 체험 수업 종료 처리

#### 정기 결제 (BILLING)

| 속성 | 값 |
|------|-----|
| paymentDiv | S |
| 카드 파킹 | X |
| 예약 | O |
| 데이터 생성 | O |

**처리 흐름**:
1. 예약된 스케줄에 의해 자동 실행
2. 결제 처리
3. 다음 결제 스케줄 등록
4. 수강권 갱신
5. 구독 기간 연장

#### 위약금 결제 (CANCEL)

| 속성 | 값 |
|------|-----|
| paymentDiv | D |
| 카드 파킹 | X |
| 예약 | - (null) |
| 데이터 생성 | X |

**처리 흐름**:
1. 중도 해지 시 위약금 계산
2. 위약금 결제 처리

#### 미납 결제 (BEHIND)

| 속성 | 값 |
|------|-----|
| paymentDiv | D |
| 카드 파킹 | X |
| 예약 | O |
| 데이터 생성 | O |

**처리 흐름**:
1. 정기결제 실패 후 재시도
2. 미납금 결제 처리
3. 수강권 복구

---

## 2. 결제 검증 정책

### 2.1 체납자 검증

결제 시작 전 체납 이력을 확인합니다.

```
검증 조건:
- subscribeMappService.existsFailedCount(userId)
- 실패 횟수가 존재하면 DELINQUENT_PAYMENT 에러
```

**에러 코드**: `DELINQUENT_PAYMENT`

### 2.2 중복 구매 검증

동일 커리큘럼/언어의 활성 구독이 있는지 확인합니다.

```
검증 조건:
- 동일 언어(langType)의 활성 구독 존재
- 동일 커리큘럼(curriculumType)의 활성 구독 존재
```

**에러 코드**: `DUPLICATE_SUBSCRIPTION`

### 2.3 금액 검증

포트원 실결제 금액과 예상 금액이 일치하는지 확인합니다.

```
검증 항목:
- 구독 상품 가격
- 쿠폰 할인 금액
- 실결제 금액
```

---

## 3. 정기결제 정책

### 3.1 다음 결제일 계산

정기결제 시 다음 결제일은 다음 규칙으로 계산됩니다.

#### 체험/첫결제 (TRIAL, FIRST_BILLING, LUMP_SUM)

```
- TRIAL: 현재일 + 7일 (스마트톡: +1일)
- FIRST_BILLING/LUMP_SUM: 현재일 기준 다음 결제일 계산
```

#### 정기결제 (BILLING, BEHIND)

```
1. 기존 SubscribeMapp 조회
2. 누적 홀딩일 수 계산
3. 과거 결제일 목록 생성
4. 홀딩 기간에 따른 결제일 조정
5. 다음 결제일 산출
```

### 3.2 홀딩 적용 규칙

홀딩(일시정지) 기간은 정기결제일 계산에 반영됩니다.

```
for each 홀딩기록:
    if 홀딩시작일 <= 결제예정일:
        결제예정일 += 홀딩일수
```

### 3.3 결제 실패 처리

정기결제 실패 시 다음 프로세스가 진행됩니다.

**재시도 정책**:
- 최대 **14일간** 매일 재시도 (PaymentGateway.java:950)
- 1-2차 실패: 알림톡 발송
- 3차 이상 실패: 재시도는 계속하되 알림톡 발송 중단

**failedCount 관리**:
- 실패 시마다 +1
- 성공 시 0으로 리셋
- 14일 초과 시 체납 처리 및 서비스 제한

**소스 파일**: `src/main/java/com/speaking/podo/applications/payment/gateway/PaymentGateway.java:950-977`

---

## 4. 쿠폰 정책

### 4.1 쿠폰 적용 조건

| 결제 유형 | 조건 |
|----------|------|
| 첫결제 (FIRST_BILLING 등) | 쿠폰 상태가 `NORMAL`인 경우 |
| 정기결제 (BILLING) | 쿠폰 상태가 `USED`이고 구독 유형이 `SUBSCRIBE`/`EXTEND`인 경우 |

### 4.2 쿠폰 사용 처리

```
1. 쿠폰 상태 검증
2. 쿠폰 사용 처리 (상태 변경)
3. le_coupon_detail 이력 추가
4. 결제 상세(PaymentDetail)에 쿠폰 정보 기록
```

---

## 5. 결제 후 처리 정책

### 5.1 체험 수업 종료 처리

정규 수강권 결제 시 기존 체험 수업을 종료합니다.

| 결제 유형 | 처리 |
|----------|------|
| 스마트톡 정규 | 스마트톡 체험 + 베이직 체험 종료 |
| 일반 정규 | 해당 언어 베이직 체험 + 스마트톡 체험 종료 |
| 스마트톡 체험 | 베이직 체험 종료 |
| 일반 체험 | 스마트톡 체험 종료 |

### 5.2 수강권 발급

결제 완료 후 수강권이 자동 발급됩니다.

```
발급 정보:
- studentId: 학생 ID
- subscribeMappId: 구독 매핑 ID
- paymentId: 결제 ID
- subscribeDto: 구독 상품 정보
- purchasedPrice: 결제 금액
- startDate: 시작일
- nextPaymentDate: 만료일 (다음 결제일)
```

### 5.3 알림톡 비활성화

정규 결제 완료 후 다음 알림톡이 비활성화됩니다.

```
비활성화 대상:
- PD_MKT_REG_REMIND_4: 정규 가입 리마인드 4
- PD_MKT_REG_REMIND_5: 정규 가입 리마인드 5
- PD_JOINCOUPON_6HOURS: 가입 쿠폰 6시간
- PD_TIRALCOUPON_7DAY: 체험 쿠폰 7일
- PD_TIRALCOUPON_6HOUR: 체험 쿠폰 6시간
```

---

## 6. 예약 결제 정책

### 6.1 스케줄 등록

카드 파킹이 필요한 결제 유형은 포트원에 예약 결제를 등록합니다.

**등록 정보**:
- studentId
- subscribeId
- impUid
- merchantUid
- customerUid
- subscribeMappId
- nextPaymentDate
- couponId (있는 경우)

### 6.2 예약 실행

등록된 스케줄에 따라 자동으로 결제가 실행됩니다.

```
실행 시점: 다음 결제일 00:00 (KST)
결제 금액: 구독 상품 가격 - 쿠폰 할인
할부 개월: 0 (일시불)
```

### 6.3 할부 정책

포트원 V2 빌링키 결제 시 할부 개월 수(`installmentMonth`)는 **0 (일시불)**으로 설정합니다.

| 파라미터 | 값 | 의미 |
|---------|-----|------|
| `installmentMonth` | `0` | 일시불 (무이자 할부 없음) |

**소스 파일**: `src/main/java/com/speaking/podo/modules/portone/service/PortoneV2Service.java`

### 6.4 예약 결제 스케줄 조회 범위

포트원 V2 API의 빌링키 기반 예약 스케줄 조회(`getPaymentSchedulesByBillingKey`) 시 반드시 `from`/`until`을 명시적으로 설정해야 합니다.

**이유**: 포트원 V2 API는 `from`/`until` 미지정 시 `until=now`, `from=until-90일`을 기본값으로 사용하므로, 미래 예약건 조회가 불가합니다.

| 파라미터 | 값 | 설명 |
|---------|-----|------|
| `from` | `현재 시각 - 90일` | 과거 예약건 포함 |
| `until` | `현재 시각 + 365일` | 미래 예약건 조회 보장 |
| `status` | `Scheduled` | 예약 완료 상태만 조회 |

**소스 파일**: `src/main/java/com/speaking/podo/modules/portone/service/PortoneV2Service.java` (`getPaymentSchedulesByBillingKey` 메서드)

---

## 7. 특수 정책

### 7.1 일본어 더블팩 이벤트

일정 기간 동안 일본어 구매 시 영어 수강권도 함께 제공합니다.

**조건**:
```
- 이벤트 기간 내
- 구매 언어: JP
- 기존 영어(EN) BASIC 수강권 없음
```

**처리**:
```
원래 구독 상품을 더블팩 상품으로 변경
(시스템 코드: PODO_JP_DOUBLE_UP_EVENT_{구독ID})
```

### 7.2 레벨 테스트 결과 반영

체험/첫결제 시 레벨 테스트 결과가 있으면 시작 레벨로 설정합니다.

**처리**:
```
1. 언어별 최신 레벨 테스트 결과 조회
2. 테스트 레벨 → 코스 레벨 변환
3. 해당 레벨 코스 정보 저장
```

---

## 8. 에러 처리 정책

### 8.1 에러 코드

| 코드 | 설명 | 처리 |
|------|------|------|
| `DELINQUENT_PAYMENT` | 체납자 결제 시도 | 결제 차단 |
| `DUPLICATE_SUBSCRIPTION` | 중복 구독 | 결제 차단 |
| `INVALID_AMOUNT` | 금액 불일치 | 결제 취소 |
| `PAYMENT_FAILED` | 결제 실패 | 재시도/알림 |

### 8.2 결제 실패 정보 저장

결제 실패 시 `PaymentFailInfo`에 기록합니다.

```
저장 정보:
- userId
- impUid
- merchantUid
- failReason
- failedAt
```

---

## 9. 웹훅 처리 정책

### 9.1 웹훅 수신

포트원에서 결제 상태 변경 시 웹훅을 수신합니다.

**엔드포인트**: `POST /api/v1/payment/podo/webhook`

**파라미터**:
| 파라미터 | 설명 |
|---------|------|
| imp_uid | 포트원 결제 ID |
| merchant_uid | 주문 ID |
| status | 결제 상태 |

### 9.1.1 포트원 V2 웹훅 필터링 정책

포트원 V2 웹훅은 형식에 따라 처리 대상을 필터링합니다. 중간 상태 웹훅(예: `Transaction.Ready` - 결제창 열림)은 거짓 실패 알림 방지를 위해 무시합니다.

#### V2 DataWrapper 형식 (`isV2DataWrapper()`)

| 처리 여부 | 웹훅 타입 |
|----------|----------|
| 처리 | `Transaction.Paid` |
| 처리 | `Transaction.Failed` |
| **무시** | 그 외 모든 타입 (`Transaction.Ready` 등) |

#### V2 Flat 형식 (`isV2Flat()`)

| 처리 여부 | 결제 상태 (`status`) |
|----------|---------------------|
| 처리 | `Paid` (대소문자 무관) |
| 처리 | `Failed` (대소문자 무관) |
| **무시** | 그 외 모든 상태 |

**소스 파일**: `src/main/java/com/speaking/podo/applications/payment/gateway/PaymentGateway.java` (`processWebhook` 메서드)

### 9.2 관리자 결제 처리

관리자가 직접 결제를 처리하는 경우 추가 파라미터를 전달합니다.

**추가 파라미터**:
- admin: 관리자 모드 플래그
- user_id: 대상 사용자 ID
- payment_id: 결제 ID
- subscribe_id: 구독 ID
- subscribe_mapp_id: 구독 매핑 ID
- coupon_id: 쿠폰 ID
- admin_re_paid: 재결제 여부

### 9.3 결제 상태 폴링

클라이언트에서 결제 완료를 확인하기 위해 폴링 API를 제공합니다.

**엔드포인트**: `GET /api/v1/payment/podo/check/{impUid}`

**응답**:
```json
{
  "status": "paid",  // paid, ready, failed
  "extras": { ... }   // 추가 정보
}
```

---

## 10. 환불 정책

**⚠️ 문서화 필요**:

코드에서 환불 관련 필드/상태가 확인되었으나 상세 정책이 문서화되지 않음.

**확인된 환불 관련 요소**:
- `SubscribeMapp.status = "REFUND"` (구독 매핑 환불 상태)
- `Ticket.refundCount` (수강권 환불 횟수)
- `SubscribeMappGateway.java:480` - REFUND 상태 체크 로직 존재

**문서화 필요 항목**:
1. **환불 조건**
   - 환불 가능 기간 (예: 결제 후 7일 이내)
   - 환불 불가 조건 (예: 수업 3회 이상 수강 시)
   - 체험/정규 구독 환불 조건 차이

2. **환불 금액 계산**
   - 전액 환불 조건
   - 부분 환불 계산식
   - 쿠폰 사용 시 환불 정책

3. **환불 프로세스**
   - 환불 신청 방법
   - 환불 처리 기간
   - 환불 완료 후 서비스 이용 제한

4. **환불 이력 관리**
   - `refundCount` 필드 관리 방식
   - 환불 이력 조회

**관련 소스 파일**:
- `src/main/java/com/speaking/podo/applications/subscribe/gateway/SubscribeMappGateway.java:473-480`
- `src/main/java/com/speaking/podo/applications/ticket/domain/Ticket.java`
- `src/main/java/com/speaking/podo/applications/subscribe/domain/Subscribe.java`
