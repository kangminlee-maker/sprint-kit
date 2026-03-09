# Brownfield Detail

scope: SC-2026-001

<a id="ticket-service"></a>

## TicketServiceV2Impl.java

**소스:** podo-backend

체험권 발급: addTrialTicket() (L305-341) — nPurchased=1 하드코딩.
활성 수강권 조회: getActiveTicket() (L122-169) — 우선순위 정렬 후 잔여 횟수 확인.
사용 횟수 업데이트: updateUsedCount() (L116-119) — nUsed += 1.

<a id="ticket-entity"></a>

## Ticket.java (Domain Entity)

**소스:** podo-backend

핵심 필드: nPurchased, nUsed, eventType(PODO_TRIAL), expireDate.
신규 필드 필요: currentOpenRound (Integer, default 1) — 현재 개방된 회차 번호.

<a id="lecture-service"></a>

## LectureCommandServiceImpl.java

**소스:** podo-backend

수업 생성: createPodoClassV3() (L266) — Lecture + LectureOnline 엔티티 생성.
예약 확정: updateLectureToReserved() (L701) — tutorId, classDate, 시간 배정.
체험 교재: createPagecallRoomPages() (L505) — 인트로/아웃트로 페이지 추가.

<a id="schedule-service"></a>

## PodoScheduleServiceImplV2.java

**소스:** podo-backend

취소 처리 (L1192-1243): 2시간 기준 분기. between < 120이면 소진(nUsed+=1), 아니면 복구.
NOSHOW_MINUTES = 5 (L99) — 노쇼 시간 판별.

<a id="payment-gateway"></a>

## PaymentGateway.java

**소스:** podo-backend

체험 결제: processTrialPayment() (L538) — giveDays=7(일반)/1(스마트톡).
정규 결제 시 체험 종료: closeTrialClass() (L1389) — CREATED/CANCEL_NOSHOW_T 상태 체험 수업 자동 취소.

<a id="trial-card"></a>

## trial-lesson-card.tsx

**소스:** podo-app

4가지 상태 분기: RESERVED(변경가능), RESERVED(변경불가), COMPLETED, 기타.
신규 추가 필요: LOCKED, CONSUMED(노쇼 차감) 상태.

<a id="trial-list"></a>

## trial-lesson-detail-list.tsx

**소스:** podo-app

기존 진행 카운터: {completedLessons.length} / {trialLessons?.length ?? 0}.
TrialStepper 컴포넌트 통합 필요.

<a id="home-view"></a>

## home/view.tsx

**소스:** podo-app

useGreetingStatus 훅: NO_TICKET, RECOMMEND_BOOKING_TRIAL_CLASS, RECOMMEND_BOOKING_REGULAR_CLASS, SCHEDULED_CLASS.
Trial Tutorial 5단계 가이드 — 1회차에만 표시, 이후 회차는 간소화.

<a id="dep-ticket"></a>

## Ticket JPA 의존성

**소스:** podo-backend

TicketServiceV2Impl → ticketRepository (JPA) → GT_CLASS_TICKET 테이블.
currentOpenRound 컬럼 추가 시 엔티티 + 리포지토리 쿼리 동시 수정.

<a id="dep-lecture-ticket"></a>

## Lecture → Ticket 의존성

**소스:** podo-backend

LectureCommandServiceImpl → TicketServiceV2Impl.getActiveTicket().
수업 생성 시 활성 수강권 조회. currentOpenRound 검증 추가 필요.

<a id="dep-payment"></a>

## Payment 의존성

**소스:** podo-backend

PaymentGateway → TicketServiceV2Impl.addTrialTicket(), SubscribeMappServiceImpl.
체험 결제 시 Ticket 생성 + SubscribeMapp 생성.

<a id="dep-schedule"></a>

## Schedule 의존성

**소스:** podo-backend

PodoScheduleServiceImplV2 → LectureCommandServiceImpl(수업 취소), TicketServiceV2Impl(수강권 소진).
노쇼/취소 시 currentOpenRound 업데이트 필요.

<a id="api-trial-payment"></a>

## POST /api/v2/trial/payment

**소스:** podo-backend

요청: studentId, subscribeId, langType, trialLevel, paymentMethod.
응답: ticketId, lectureId, expireDate.
변경: 유료 체험(5000원) 시 실결제 처리 추가.

<a id="api-create-class"></a>

## POST /api/v2/lecture/class

**소스:** podo-backend

요청: studentId, ticketId, courseId.
응답: lectureId, lemonboardUrl.
변경: currentOpenRound 검증 추가 — 현재 진행 중인 Lecture가 없고 currentOpenRound 이내일 때만 생성.

<a id="api-cancel"></a>

## PUT /api/v2/schedule/cancel

**소스:** podo-backend

요청: lectureId.
응답: cancelResult.
변경: PODO_TRIAL + 2시간 이내 취소 시 currentOpenRound += 1.

<a id="api-active-ticket"></a>

## GET /api/v2/ticket/active

**소스:** podo-backend

요청: studentId, langType.
응답: ticketId, nPurchased, nUsed, eventType, expireDate.
변경: currentOpenRound 필드 응답에 추가.

<a id="schema-ticket"></a>

## GT_CLASS_TICKET 스키마

**소스:** podo-backend

PURCHASED_COUNT: 3 (기존 1).
USED_COUNT: 사용 횟수.
EVENT_TYPE: PODO_TRIAL.
TICKET_EXPIRE_DATE: 가입일+14일 (기존 7일).
currentOpenRound: 신규 컬럼 (INT, DEFAULT 1).

<a id="schema-class"></a>

## GT_CLASS 스키마

**소스:** podo-backend

CITY: PODO_TRIAL (체험 수업 식별).
INVOICE_STATUS: CREATED→RESERVED→COMPLETED/NOSHOW_S/CANCEL.
변경 없음 — 기존 스키마 유지.

<a id="schema-subscribe"></a>

## GT_SUBSCRIBE 스키마

**소스:** podo-backend

유료 체험 상품 레코드 추가: PAYMENT_TYPE=TRIAL, SUB_PRICE=5000, LESSON_COUNT_PER_MONTH=3.
FREE_TRIAL 필드는 현재 미사용 — 활용 가능.

<a id="config-givedays"></a>

## giveDays 설정

**소스:** podo-backend

PaymentGateway.processTrialPayment() 내 하드코딩.
일반 체험: 7 → 14.
스마트톡 체험: 1 (변경 없음).
