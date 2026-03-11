---
domain: business
type: flow
related_files:
  - src/main/java/com/speaking/podo/applications/subscribe/usecase/SubscribeMappServiceImpl.java
  - src/main/java/com/speaking/podo/applications/subscribe/domain/Subscribe.java
  - src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeMapp.java
keywords: [구독, 연장, 해지, 정기결제, 수강권]
last_verified: 2026-01-26
---

# 구독 플로우

## 개요
사용자가 PODO 구독 상품을 가입하고, 연장하고, 해지하는 전체 비즈니스 플로우를 설명합니다.

## 구독 타입

### 1. TRIAL (체험권)
- **설명**: 1회 무료 체험 수업
- **결제**: 무료 (0원)
- **기간**: 가입일로부터 N일 (기본 7일)
- **자동 연장**: 없음

### 2. SUBSCRIBE (정기 구독)
- **설명**: 월 단위 자동 결제
- **결제**: 매월 정해진 날짜에 자동 결제
- **기간**: 1개월 단위 자동 갱신
- **자동 연장**: 포트원 스케줄로 자동 결제

### 3. LUMP_SUM (일시불)
- **설명**: 전체 기간 한 번에 결제
- **결제**: 최초 1회만 결제
- **기간**: 3개월, 6개월, 12개월 등
- **자동 연장**: 없음

### 4. EXTEND (연장 구독)
- **설명**: 기존 구독 만료 전 연장
- **결제**: 할인 적용 (5일 전 20%, 0~4일 전 10%)
- **기간**: 기존 구독 종료일 + 1개월
- **자동 연장**: 선택 가능

### 5. BONUS (보너스 수강권)
- **설명**: 무료로 제공되는 수강권
- **결제**: 무료
- **기간**: 이벤트에 따라 다름
- **특징**: 구독 해지 시 자동 회수

## 전체 플로우

```
1. 구독 상품 선택
   ↓
2. 쿠폰 적용 (선택)
   ↓
3. 결제 처리
   ↓
4. SubscribeMapp 생성
   ↓
5. Ticket 생성
   ↓
6. 수업 예약 가능
```

## 상세 단계

### 1단계: 구독 상품 선택
**비즈니스 규칙**:
- 언어별 구독 가능: EN (영어), JP (일본어), ENJP (다언어)
- 커리큘럼별 구독: BASIC, BUSINESS, SMART_TALK
- 회차/무제한 선택: COUNT (월 4/8/12회) 또는 UNLIMIT (무제한)

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/subscribe/domain/Subscribe.java`

**코드 위치**: SubscribeMappServiceImpl.java:131-219

---

### 2단계: 쿠폰 적용 (선택)
**비즈니스 규칙**:
- 쿠폰은 결제 전에만 적용 가능
- 1개의 결제에 1개의 쿠폰만 사용 가능
- 할인 타입: FIXED (정액), PERCENTAGE (정률)

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/coupon/usecase/CouponServiceImpl.java`

**참고**: [쿠폰 정책 문서](./coupon-policy.md)

---

### 3단계: 결제 처리
**비즈니스 규칙**:
- 포트원 API로 결제 처리
- 결제 성공 시 PaymentInfo 생성
- 결제 실패 시 PaymentFailInfo 생성 후 슬랙 알림

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/payment/service/PaymentServiceImpl.java`
- `modules/portone/service/PortoneService.java`

**코드 위치**: PaymentServiceImpl.java:57-60

---

### 4단계: SubscribeMapp 생성
**비즈니스 규칙**:
- SubscribeMapp = 사용자 + 구독 상품 매핑
- `startDate`: 구독 시작일 (결제일 기준)
- `endDate`: 구독 종료일 (startDate + lessonMonth)
- `nextPaymentDate`: 다음 결제 예정일 (정기 구독만)
- `finalDate`: 최종 종료일 (해지하지 않는 한 계속 갱신)

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/subscribe/domain/SubscribeMapp.java`

**코드 위치**: SubscribeMappServiceImpl.java:1272-1321

**예시**:
```java
// 정기 구독 (SUBSCRIBE) 생성
SubscribeMapp subscribeMapp = SubscribeMapp.builder()
    .id(subscribeMappId)
    .userId(studentId)
    .subscribeId(subscribeDTO.getId())
    .startDate(now)                       // 2026-01-26
    .endDate(now.plusMonths(1))           // 2026-02-26
    .nextPaymentDate(now.plusMonths(1))   // 2026-02-26
    .finalDate(now.plusMonths(1))         // 계속 갱신됨
    .status("SUBSCRIBE")
    .build();
```

---

### 5단계: Ticket 생성
**비즈니스 규칙**:
- 구독 1개당 Ticket N개 생성 (N = 언어 개수)
- EN+JP 구독 → EN Ticket 1개 + JP Ticket 1개
- COUNT 타입: `nPurchased` = lessonCountPerMonth / 언어 개수
- UNLIMIT 타입: `nPurchased` = 999

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/ticket/service/TicketServiceV2Impl.java`
- `src/main/java/com/speaking/podo/applications/ticket/domain/Ticket.java`

**코드 위치**: TicketServiceV2Impl.java:244-297

**예시**:
```java
// EN+JP 무제한권 구독 시 Ticket 생성
// Ticket 1: EN 언어, nPurchased = 999
// Ticket 2: JP 언어, nPurchased = 999

// EN+JP 월 8회 구독 시 Ticket 생성
// Ticket 1: EN 언어, nPurchased = 4 (8/2)
// Ticket 2: JP 언어, nPurchased = 4 (8/2)
```

---

## 연장 구독 플로우

### 1. 연장 가능 조건 확인
**비즈니스 규칙**:
- 현재 구독이 만료 10일 이내
- 이미 연장 구독을 하지 않았을 것
- 결제 수단이 등록되어 있을 것

**코드 위치**: SubscribeMappServiceImpl.java:131-219

---

### 2. 연장 상품 필터링
**비즈니스 규칙**:
- **언어 일치**: 현재 구독 언어와 동일한 상품만
- **회차/무제한 매칭**:
  - 무제한권 → 무제한권만 추천
  - 회차권 → 회차권, 무제한권 모두 추천
- **다언어 조건**:
  - 다언어 구독 중 → 다언어 상품만 추천
  - 단일언어 구독 중 → 단일언어 상품 추천 (다언어는 무제한만)
- **다른 언어 구독 제외**:
  - EN 구독 중 + JP도 구독 중 → EN 연장만 가능

**코드 위치**: SubscribeMappServiceImpl.java:164-217

---

### 3. 할인율 적용
**비즈니스 규칙**:
- **20% 할인**: 만료 5~10일 전
- **10% 할인**: 만료 0~4일 전
- **할인 없음**: 만료 11일 이상 남음

**코드 위치**: SubscribeMappServiceImpl.java:196-211

**예시**:
```
현재 구독 만료일: 2026-02-01
오늘 날짜: 2026-01-27
남은 일수: 5일
→ 20% 할인 적용
```

---

### 4. 연장 구독 결제
**비즈니스 규칙**:
- 포트원 스케줄 API로 자동 결제 예약
- 결제일: 현재 구독 `nextPaymentDate`
- 결제 금액: 할인 적용 후 금액

**코드 위치**: SubscribeMappServiceImpl.java:1110-1124

---

### 5. SubscribeMapp 업데이트
**비즈니스 규칙**:
- 새로운 SubscribeMapp 생성 (연장용)
- `status` = "EXTEND"
- `startDate` = 기존 구독 `finalDate`
- `endDate` = startDate + 1개월

**코드 위치**: SubscribeMappServiceImpl.java:1272-1321

---

## 구독 해지 플로우

### 1. 해지 요청
**비즈니스 규칙**:
- 언제든지 해지 가능
- 해지 시점 이후 자동 결제 중지
- 현재 구독 기간은 유지 (환불 없음)

**관련 파일**:
- `src/main/java/com/speaking/podo/applications/subscribe/usecase/SubscribeMappServiceImpl.java`

**코드 위치**: SubscribeMappServiceImpl.java:942-1048

---

### 2. 포트원 스케줄 취소
**비즈니스 규칙**:
- 포트원 API로 다음 결제 스케줄 취소
- 취소 성공 시 SubscribeMapp 상태 업데이트
- 취소 실패 시 슬랙 알림 후 에러 반환

**코드 위치**: SubscribeMappServiceImpl.java:960-1015

**예시**:
```
scheduled → 정상 스케줄 → 취소 처리
revoked   → 이미 취소됨 → 데이터만 업데이트
```

---

### 3. 보너스 수강권 회수
**비즈니스 규칙**:
- 구독 해지 시 미래의 보너스 수강권은 자동 회수
- 회수 방법: startDate, finalDate를 앞당김

**코드 위치**: SubscribeMappServiceImpl.java:984-1000

**예시**:
```
구독 해지일: 2026-02-01
보너스 수강권 시작일: 2026-03-01 (원래)
→ 회수 후: 2026-02-01 (앞당김)
```

---

### 4. SubscribeMapp 상태 업데이트
**비즈니스 규칙**:
- `subscribeYn` = "N"
- `cancelAt` = 현재 시각
- `finalDate` = `nextPaymentDate` (더 이상 갱신 안됨)

**코드 위치**: SubscribeMappServiceImpl.java:973

---

### 5. 이력 기록
**비즈니스 규칙**:
- SubscribeMappHistory 생성
- 타입: CANCEL
- 사유: 사용자가 입력한 해지 사유

**코드 위치**: SubscribeMappServiceImpl.java:975-982

---

## 정기 결제 자동 갱신 플로우

### 1. 스케줄러 트리거
**비즈니스 규칙**:
- 매일 자정 포트원 스케줄 확인
- `nextPaymentDate` = 오늘인 구독 대상

**관련 파일**:
- `src/main/java/com/speaking/podo/modules/scheduler/` (배치 작업)

---

### 2. 포트원 자동 결제
**비즈니스 규칙**:
- 등록된 결제 수단으로 자동 결제
- 결제 성공 → PaymentInfo 생성
- 결제 실패 → PaymentFailInfo 생성 + 재시도

---

### 3. 성공 시 처리
**비즈니스 규칙**:
- 새로운 Ticket 생성
- SubscribeMapp 업데이트:
  - `paymentCount` += 1
  - `nextPaymentDate` += 1개월
  - `finalDate` += 1개월

**코드 위치**: SubscribeMappServiceImpl.java:1459

---

### 4. 실패 시 처리
**비즈니스 규칙**:
- `failCount` += 1
- 3회 실패 시:
  - 구독 자동 해지
  - 사용자에게 알림톡 발송
  - 슬랙 알림

**코드 위置**: SubscribeMappServiceImpl.java:1503-1509

---

## 예외 처리

### 중복 구독 방지
**비즈니스 규칙**:
- 동일 언어 타입의 활성 구독이 이미 있으면 에러
- 예외: 연장 구독은 허용

---

### 결제 실패 처리
**비즈니스 규칙**:
- 1~2회 실패: 익일 재시도
- 3회 실패: 구독 자동 해지
- 슬랙 #pd_bot_billing_fail 채널 알림

---

### 쿠폰 적용 실패
**비즈니스 규칙**:
- 쿠폰 만료/사용됨 → 원가로 결제 진행
- 쿠폰 조건 불일치 → 에러 반환 (결제 중단)

---

## 관련 도메인

### 결제 시스템
- [결제 플로우](./payment-flow.md)

### 수강권 정책
- [수강권 정책](./ticket-policy.md)

### 쿠폰 정책
- [쿠폰 정책](./coupon-policy.md)

---

## 주요 메서드 요약

| 메서드 | 설명 | 파일 라인 |
|--------|------|-----------|
| `addSubscribeMapp()` | 구독 생성 | SubscribeMappServiceImpl.java:1272 |
| `getExtendSubscribeList()` | 연장 가능 상품 조회 | SubscribeMappServiceImpl.java:131 |
| `unsubscribe()` | 구독 해지 | SubscribeMappServiceImpl.java:942 |
| `updateSubscribeMapp()` | 정기 결제 후 구독 갱신 | SubscribeMappServiceImpl.java:1444 |
| `editBonusSubscribeMappDate()` | 보너스 수강권 회수 | SubscribeMappServiceImpl.java:1190 |

---

**최종 업데이트**: 2026-01-26
