# Build Spec: 무료체험 횟수 정책 변경 (1회 → 3회)

## 1. Scope Summary

| 항목 | 값 |
|------|-----|
| scope ID | SC-2026-001 |
| 제목 | 무료체험 횟수 정책 변경 (1회 → 3회) |
| 방향 | 무료체험을 1회에서 3회로 확대하고, 회차별 순차 개방·차감·복구 규칙을 정의하며, 3회 소진 후 유료 체험레슨(5,000원/3회)으로 전환하는 정책·시스템·UI를 구현한다. PO 결정: CST-003 옵션A(노쇼·취소 모두 차감+개방), CST-004 Builder 위임(A 또는 B), CST-007 옵션B(제13조의2 신설). |
| scope type | experience |

**범위 — 포함:**
- 무료체험 3회 제공 규칙 및 백엔드 체험권 발급 로직 변경
- 회차별 순차 개방 조건 (직전 회차 정상 종료 시 다음 회차 개방)
- 학생 노쇼·취소 시 1회 차감 + 다음 회차 개방 (옵션 A 확정)
- 튜터 노쇼 시 복구 규칙 (Builder 위임: 회차 재사용 또는 보상권 발급)
- 3회 소진 후 유료 체험레슨(5,000원/3회) 전환 규칙 및 차감 정책
- 체험레슨 정상 완료 기준 (기존 정책 준용)
- 레슨 시간 변경 정책 (시작 2시간 전까지 무제한 변경)
- 체험 홈 UI — 회차 진행 표시 (1/3, 2/3, 3/3)
- UX Writing 업데이트 (노쇼/복구/진행 안내 메시지)
- 이용약관 제13조의2 체험레슨 정책 조항 신설 (옵션 B 확정)

**범위 — 제외:**
- 정규 수강권(회차권/무제한권) 정책 변경
- 크레딧 시스템 변경
- 스마트토크·AI채팅 수강권 변경
- 기존 결제·환불·해지 플로우 변경
- 튜터 매칭 알고리즘 변경
- 레슨 콘텐츠(교재/커리큘럼) 변경

## 2. Confirmed Surface

- **surface 경로**: `surface/preview/`
- **content hash**: `70df720efc76816e6283d38810741c0891056de782db7da5769b6cc30bc437c2`

**시나리오 요약:**
4개 시나리오 확정:
1. 정상 체험 완료: 1회차→2회차→3회차 순차 개방, 완료 시 전환 화면
2. 학생 노쇼: 1회 차감 바텀시트 + 잔여 N회 표시 + 다음 회차 자동 개방
3. 튜터 노쇼: 즉시 복구 바텀시트 + 잔여 3회 유지 + 재예약 유도
4. 전체 소진 후 전환: 유료 체험(5,000원/3회) CTA + 정규 수강권 CTA

## 3. Constraint Decision Map

| CST-ID | 관점 | 요약 | 결정 | Build Spec 내 처리 |
|--------|------|------|------|-------------------|
| CST-001 | Code | 체험권 발급 수량 하드코딩 (nPurchased=1) | inject | Section 4에서 구현. TicketServiceV2Impl.addTrialTicket()의 nPurchased를 1에서 3으로 변경 |
| CST-002 | Code | 회차별 순차 개방 메커니즘 부재 | inject | Section 4에서 구현. 동시 1개만 예약 가능 검증 + 레슨 완료/노쇼 시 다음 Lecture 생성 가능 플래그 |
| CST-003 | Policy | 학생 노쇼·취소 차감 범위와 '정상 종료' 정의 확정 필요 | inject | Section 4에서 구현. 옵션 A — 노쇼·2시간 이내 취소 모두 1회 차감 + 다음 회차 개방 |
| CST-004 | Policy | 튜터 노쇼 시 체험 회차 복구 방식 결정 필요 | inject | Section 4에서 구현. 옵션 A — nUsed 원복으로 해당 회차 재사용 |
| CST-005 | Code | 유료 체험레슨(5,000원/3회) 상품·결제 체계 부재 | inject | Section 4에서 구현. PODO_TRIAL_PAID 상품 타입 + processTrialPayment 패턴 재사용 (5,000원) |
| CST-006 | Experience | 체험 홈 UI의 회차 진행 표시 패턴 변경 필요 | inject | Section 4에서 구현. TrialStepper 신규 컴포넌트 + TrialLessonCard 상태 분기 + 노쇼/복구 바텀시트 업데이트 |
| CST-007 | Policy | 이용약관에 체험 관련 조항 추가 필요 | inject | Section 4에서 구현. 제13조의2 체험레슨 정책 조항 신설 |
| CST-008 | Code | 기존 1회 체험 사용자 마이그레이션 정책 필요 | inject | Section 4에서 구현. 미사용자(nUsed=0)만 3회로 업그레이드, 기사용자는 현행 유지 |
| CST-009 | Policy | 체험권 유효기간(7일) 연장 여부 결정 필요 | inject | Section 4에서 구현. 14일로 연장 (giveDays=7 → 14) |

## 4. Implementation Plan

### IMPL-001 | CST-001

- **요약:** 체험권 발급 수량 3회로 변경
- **변경 대상:** TicketServiceV2Impl.addTrialTicket()
- **변경 내용:** nPurchased=1 → 3, originCount=1 → 3 변경. PODO_TRIAL eventType 유지.

### IMPL-002 | CST-002

- **요약:** 회차별 순차 개방 로직 추가
- **변경 대상:** TicketServiceV2Impl + LectureCommandServiceImpl
- **변경 내용:** Ticket에 currentOpenRound 필드 추가 (기본값 1). 수업 완료/노쇼 시 currentOpenRound += 1. 예약 시 '현재 Lecture 수 < currentOpenRound' 검증. createPodoClassV3()에 검증 추가.
- **의존성:** IMPL-001

### IMPL-003 | CST-003

- **요약:** 학생 노쇼·취소 차감 + 다음 회차 개방
- **변경 대상:** PodoScheduleServiceImplV2 노쇼/취소 핸들러
- **변경 내용:** 노쇼(NOSHOW_S) 및 2시간 이내 취소 시: nUsed += 1 + currentOpenRound += 1. 2시간 전 취소 시: 기존 정책 유지(복구). 체험권(PODO_TRIAL) 전용 분기 추가.
- **의존성:** IMPL-002

### IMPL-004 | CST-004

- **요약:** 튜터 노쇼 시 nUsed 원복 + 순차 상태 원복
- **변경 대상:** 튜터 노쇼 처리 로직 (어드민/외부 시스템)
- **변경 내용:** CANCEL_NOSHOW_T 발생 시: nUsed -= 1 + currentOpenRound 유지(원복). 기존 '체험 즉시 복구' 관행을 코드로 명시화.
- **의존성:** IMPL-002

### IMPL-005 | CST-005

- **요약:** 유료 체험레슨 상품 및 결제 플로우 구현
- **변경 대상:** Subscribe + PaymentGateway + TicketServiceV2Impl
- **변경 내용:** GT_SUBSCRIBE에 유료 체험 상품 등록(subPrice=5000, paymentType=TRIAL, lessonCountPerMonth=3). PaymentGateway.processTrialPayment()에서 금액>0일 때 실결제 처리. Ticket 생성 시 동일한 순차 개방 로직 적용.

### IMPL-006 | CST-006

- **요약:** 체험 홈 UI 3회차 진행 표시 구현
- **변경 대상:** podo-app: views/home, widgets/trial-lesson-detail-list, widgets/lesson-card
- **변경 내용:** TrialStepper 컴포넌트 신규 구현(3회차 ●/○/🔒). TrialLessonCard 상태 분기 추가(locked/available/reserved/completed/consumed). 노쇼 바텀시트 메시지 업데이트('체험 1회 차감, 남은 N회'). 튜터 노쇼 바텀시트 메시지 업데이트('즉시 복구'). 전체 소진 후 전환 화면(유료 체험 + 정규 수강권 CTA).

### IMPL-007 | CST-007

- **요약:** 이용약관 제13조의2 체험레슨 정책 신설
- **변경 대상:** terms-of-service.md
- **변경 내용:** 제13조의2(체험레슨 정책) 신설: 무료 3회 제공, 순차 개방(직전 완료 시 다음 개방), 학생 노쇼·취소 시 1회 차감 + 다음 개방, 튜터 노쇼 시 즉시 복구, 유효기간 14일, 3회 소진 후 유료 체험(5,000원/3회) 전환 가능, 유료 체험에도 동일 정책 적용.

### IMPL-008 | CST-008

- **요약:** 기존 미사용 체험 사용자 마이그레이션
- **변경 대상:** DB 마이그레이션 스크립트
- **변경 내용:** 배포 시 1회성 실행: UPDATE GT_CLASS_TICKET SET PURCHASED_COUNT=3, ORIGIN_COUNT=3 WHERE EVENT_TYPE='PODO_TRIAL' AND USED_COUNT=0 AND TICKET_EXPIRE_DATE >= NOW(). 기사용자(USED_COUNT>0)는 변경하지 않음.
- **의존성:** IMPL-001
- **guardrail:** 배포 전 대상 사용자 수 사전 집계 필수. 롤백 스크립트 준비.

### IMPL-009 | CST-009

- **요약:** 체험권 유효기간 7일 → 14일 변경
- **변경 대상:** PaymentGateway.processTrialPayment()
- **변경 내용:** giveDays = 7 → 14 변경. 스마트톡 체험(1일)은 현행 유지.

## 5. Delta Set Reference

- **delta-set 경로**: `build/delta-set.json`
- **변경 파일 수**: create 3건, modify 10건
- **content hash**: `f0f30c3acd241ca5ba70c59d02c0343da22660fe7ff2954d5f3d5721ef28d90a`
## 6. Validation Plan Reference

- **validation-plan 경로**: `build/validation-plan.md`
- **검증 항목 수**: 9건
- **content hash**: `6f74178da160b269c085a4d6ea1930447698150a0ffd88d0ad9270857b650142`
## 7. Brownfield Context

상세: [`build/brownfield-detail.md`](brownfield-detail.md) (hash: `c05868fe`)

### 변경 대상 파일 (8건)

| 경로 | 역할 | 상세 |
|------|------|------|
| `TicketServiceV2Impl.java` | 체험권 발급/조회/소진 서비스 | [→ 상세](brownfield-detail.md#ticket-service) |
| `Ticket.java` | 수강권 도메인 엔티티 | [→ 상세](brownfield-detail.md#ticket-entity) |
| `LectureCommandServiceImpl.java` | 수업 생성/예습/완료 서비스 | [→ 상세](brownfield-detail.md#lecture-service) |
| `PodoScheduleServiceImplV2.java` | 예약/취소/노쇼 스케줄 서비스 | [→ 상세](brownfield-detail.md#schedule-service) |
| `PaymentGateway.java` | 결제 처리 게이트웨이 | [→ 상세](brownfield-detail.md#payment-gateway) |
| `trial-lesson-card.tsx` | 체험 레슨 카드 위젯 | [→ 상세](brownfield-detail.md#trial-card) |
| `trial-lesson-detail-list.tsx` | 체험 레슨 상세 목록 위젯 | [→ 상세](brownfield-detail.md#trial-list) |
| `home/view.tsx` | 홈 화면 뷰 | [→ 상세](brownfield-detail.md#home-view) |

### 직접 의존 모듈 (4건)

| 모듈 | 의존 대상 | 상세 |
|------|----------|------|
| TicketServiceV2Impl | Ticket (JPA entity) | [→ 상세](brownfield-detail.md#dep-ticket) |
| LectureCommandServiceImpl | TicketServiceV2Impl | [→ 상세](brownfield-detail.md#dep-lecture-ticket) |
| PaymentGateway | TicketServiceV2Impl, SubscribeMappServiceImpl | [→ 상세](brownfield-detail.md#dep-payment) |
| PodoScheduleServiceImplV2 | LectureCommandServiceImpl, TicketServiceV2Impl | [→ 상세](brownfield-detail.md#dep-schedule) |

<details>
<summary>API 계약 (4건)</summary>

| endpoint | method | 설명 | 상세 |
|----------|--------|------|------|
| /api/v2/trial/payment | POST | 체험 결제 요청 | [→ 상세](brownfield-detail.md#api-trial-payment) |
| /api/v2/lecture/class | POST | 수업 생성 (createPodoClassV3) | [→ 상세](brownfield-detail.md#api-create-class) |
| /api/v2/schedule/cancel | PUT | 수업 취소 | [→ 상세](brownfield-detail.md#api-cancel) |
| /api/v2/ticket/active | GET | 활성 수강권 조회 | [→ 상세](brownfield-detail.md#api-active-ticket) |

</details>

<details>
<summary>DB 스키마 (3건)</summary>

| 테이블 | 컬럼 | 상세 |
|--------|------|------|
| GT_CLASS_TICKET | PURCHASED_COUNT, USED_COUNT, EVENT_TYPE, TICKET_EXPIRE_DATE + currentOpenRound(신규) | [→ 상세](brownfield-detail.md#schema-ticket) |
| GT_CLASS | CITY(=PODO_TRIAL), INVOICE_STATUS, CREDIT | [→ 상세](brownfield-detail.md#schema-class) |
| GT_SUBSCRIBE | FREE_TRIAL, PAYMENT_TYPE, SUB_PRICE | [→ 상세](brownfield-detail.md#schema-subscribe) |

</details>

<details>
<summary>설정/환경 변수 (1건)</summary>

| 키 | 설명 | 상세 |
|-----|------|------|
| giveDays (하드코딩) | 체험권 유효기간 일수. 현행 7 → 14 | [→ 상세](brownfield-detail.md#config-givedays) |

</details>

