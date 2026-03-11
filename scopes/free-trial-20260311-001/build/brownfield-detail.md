# Brownfield Detail

scope: free-trial-20260311-001

<a id="dup-validator"></a>

## DuplicateLessonValidator

**소스:** podo-backend

line 93-98: trialLectureList.isEmpty() → 기존 체험 수업 존재 시 DUPLICATE_TRIAL_LESSON 에러. 변경: usedCount < totalCount 조건으로 완화.

<a id="ticket-service"></a>

## TicketServiceV2Impl

**소스:** podo-backend

line 318-319: .originCount(1), .nPurchased(1). 변경: 3으로 변경. 발급 호출 위치를 결제→예약으로 이동.

<a id="trial-payment"></a>

## TrialPaymentProcessor

**소스:** podo-backend

line 40: giveDays=7, line 62-71: createPodoTrialClass() 1회 호출. 변경: giveDays 만료 제거, 수업 생성을 예약 시점으로 이동.

<a id="user-gateway"></a>

## UserGateway

**소스:** podo-backend

line 97: hasCompletedTrialClass = anyMatch(DONE). 변경: count 기반으로 변경. remainingTrialCount = totalCount - usedCount.

<a id="user-repo"></a>

## UserRepository

**소스:** podo-backend

line 482-492: PODO_TRIAL DONE 1건 기준 STEP 판정. 변경: 3건 기준. 순차 개방 확인 쿼리 추가.

<a id="schedule-service"></a>

## PodoScheduleServiceImplV2

**소스:** podo-backend

line 1224-1251: 취소 시 수강권 차감. 변경: 체험 전용 분기 추가 (노쇼=2장, 2h전 취소=복구).

<a id="payment-gateway"></a>

## PaymentGateway

**소스:** podo-backend

line 642: cancelTrialTicketBySubMappId(). 변경 없음 — 기존 자동 취소 유지.

<a id="home-redirect"></a>

## home-redirection.tsx

**소스:** podo-app

line 88,128: trialPaymentYn/trialClassCompYn 기반 리다이렉트. 변경: remainingTrialCount 기반.

<a id="home-banners"></a>

## home-banners.tsx

**소스:** podo-app

line 183: trialPaymentYn==='N' 기준 배너. 변경: remainingTrialCount > 0.

<a id="trial-subscribes"></a>

## trial-subscribes/view.tsx

**소스:** podo-app

line 678: '단 1회' Badge, line 633: 30,000원 하드코딩. 변경: 3회 정책 반영.

<a id="cancel-dialog"></a>

## lesson-cancel-confirm-dialog.tsx

**소스:** podo-app

line 159-162: '다시 체험 레슨을 들을 수 없어요'. 변경: 잔여 체험권 수 기반 메시지 분기.

<a id="dep-trial-ticket"></a>

## TrialPaymentProcessor → TicketServiceV2Impl

**소스:** podo-backend

체험 결제 시 수강권 발급 호출 체인. 발급 시점 변경으로 호출 위치 이동.

<a id="dep-schedule-ticket"></a>

## PodoScheduleServiceImplV2 → TicketGateway

**소스:** podo-backend

수업 예약/취소 시 수강권 잔여 확인. 체험 전용 차감 분기 추가.

<a id="dep-home-user"></a>

## home-redirection → userEntityQueries

**소스:** podo-app

사용자 정보 API 응답에 remainingTrialCount 추가 필요.

<a id="schema-student"></a>

## GT_STUDENT 테이블

**소스:** podo-backend

trial_payment_yn(VARCHAR Y/N), trial_class_comp_yn(VARCHAR Y/N). 추가: trial_used_count(INT DEFAULT 0), trial_total_count(INT DEFAULT 0).

<a id="schema-subscribe"></a>

## GT_SUBSCRIBE 테이블

**소스:** podo-backend

FREE_TRIAL 컬럼 존재. 유료 체험 상품 레코드 추가 필요 (SUB_PRICE=5000, nPurchased=3).

<a id="schema-ticket"></a>

## GT_TICKET 테이블

**소스:** podo-backend

origin_count, n_purchased, expire_date. origin_count=3, n_purchased=3, expire_date=null로 변경.

<a id="api-user-info"></a>

## /api/user/info API

**소스:** podo-backend

응답에 trialPaymentYn 포함. 추가: remainingTrialCount(Integer).

<a id="api-trial-schedule"></a>

## /api/schedule/trial API

**소스:** podo-backend

체험 수업 예약 엔드포인트. 3일 이내 필터 + 순차 개방 검증 추가.

<a id="api-trial-payment"></a>

## /api/payment/trial API

**소스:** podo-backend

체험 결제 엔드포인트. TRIAL_FREE/TRIAL 분기 변경.
