# Build Spec: 수강권 구매 직후 수업 예약을 유도하여 환불률을 낮춘다. 현재 전체 구매자의 8%가 수업을 한 번도 듣지 않고 환불하고 있다. 수업을 1회라도 수강한 사용자는 환불 가능성이 크게 낮아진다는 가설에 기반하여, 구매 완료 시점에 즉시 수업 예약을 강하게 권유하는 경험을 만든다.

## 1. Scope Summary

| 항목 | 값 |
|------|-----|
| scope ID | immediate-class-post-purchase-20260325-001 |
| 제목 | 수강권 구매 직후 수업 예약을 유도하여 환불률을 낮춘다. 현재 전체 구매자의 8%가 수업을 한 번도 듣지 않고 환불하고 있다. 수업을 1회라도 수강한 사용자는 환불 가능성이 크게 낮아진다는 가설에 기반하여, 구매 완료 시점에 즉시 수업 예약을 강하게 권유하는 경험을 만든다. |
| 방향 | Maximize first-class booking rate at purchase completion. Reduce 0-class refund rate from 8% to 2-3% via completion screen with celebration, simplified booking, and one-time incentive. |
| scope type | experience |

**범위 — 포함:**
- Purchase completion screen with celebration/confirmation UI
- Strong booking CTA with one-time incentive messaging
- Simplified lesson selection: pre-selected level for trial/returning users, level chooser for new users. 4-5 lessons per level. Easy level switching.
- Time slot selection (tutor + time, min 2hr out). Pre-study skipped/deferred.
- One-time incentive: +1 bonus class (count-based) or +3 days extension (unlimited). Only on completion screen.
- Exit confirmation pop-up: clear messaging that incentive is lost forever.
- Dismiss destination: lesson tab (not Home).

**범위 — 제외:**
- No-show / cancellation prevention after booking (separate scope)
- External channel notifications — KakaoTalk, SMS, email (deferred)
- Post-purchase reminders on Home screen
- Level test / placement assessment (not building)

## 2. Confirmed Surface

- **surface 경로**: `surface/preview/`
- **content hash**: `cb260746ceaf07dde202fc1b37c6a8f7167fe21bcd46ada5722fcac24e76cc63`

**시나리오 요약:**
Celebration → level select (recommended) → time select → booking confirmed + bonus. Exit: warning popup → lesson tab.

## 3. Constraint Decision Map

| CST-ID | 관점 | 요약 | 결정 | Build Spec 내 처리 |
|--------|------|------|------|-------------------|
| CST-001 | Code | 2-hour minimum advance booking requirement prevents immediate class start | inject | Section 4에서 구현. Show earliest available slots, auto-select tomorrow if today empty |
| CST-002 | Code | Course must match ticket curriculumType (XG1 guard) | inject | Section 4에서 구현. Filter levels by ticket curriculumType before display |
| CST-003 | Code | Unlimited ticket allows only 1 concurrent booking | inject | Section 4에서 구현. Check existing bookings, show alternative message if one exists |
| CST-004 | Experience | No purchase completion screen exists — users go directly to Home | inject | Section 4에서 구현. Build new purchase completion screen as confirmed in surface |
| CST-005 | Policy | Taking 1 class forfeits 7-day cooling-off refund right | defer | 이번 범위에서 제외. 이유: PO decided during Align: no refund disclosure needed, standard ToS applies. |
| CST-006 | Code | BONUS acquisitionType from duplicate-ticket-purchase scope may not be in production | inject | Section 4에서 구현. Check acquisitionType availability, fallback to TKT-3 |
| CST-007 | Code | Each level must map to exactly one auto-assigned first lesson (LectureCourse) | inject | Section 4에서 구현. Level-to-first-lesson mapping table using first active LectureCourse |
| CST-008 | Code | One-time incentive requires server-side tracking to prevent double-claim on app restart | inject | Section 4에서 구현. Server-side incentive eligibility flag on payment record |
| CST-008-dup-check | Code | duplicate check | inject | Section 4에서 구현. duplicate check - handled by CST-008 |

## 4. Implementation Plan

### IMPL-001 | CST-004

- **요약:** Purchase completion screen with celebration UI
- **변경 대상:** podo-app (frontend)
- **변경 내용:** New screen after PortOne payment success. Checkmark animation, purchase summary, replaces Home redirect.

### IMPL-002 | CST-008, CST-008-dup-check

- **요약:** One-time incentive banner and booking CTA
- **변경 대상:** podo-app + podo-backend
- **변경 내용:** Incentive banner (+1 class or +3 days). Server-side flag tracks eligibility. Marked claimed on booking, expired on exit.

### IMPL-003 | CST-002, CST-007

- **요약:** Level selection with recommendation
- **변경 대상:** podo-app + podo-backend
- **변경 내용:** Levels filtered by ticket curriculumType. Pre-select from trial/history. Recommended badge. Auto-assign first LectureCourse.

### IMPL-004 | CST-001, CST-003

- **요약:** Time slot selection
- **변경 대상:** podo-app (frontend)
- **변경 내용:** Tutor+time slots 2+ hours out. 3-day tabs. Auto-select tomorrow if empty. Check unlimited concurrent booking.

### IMPL-005 | CST-006

- **요약:** Booking confirmation and bonus award
- **변경 대상:** podo-backend
- **변경 내용:** Issue bonus ticket (BONUS type or TKT-3 fallback) or extend days. Mark incentive claimed. Skip pre-study.

### IMPL-006 | CST-008

- **요약:** Exit confirmation and dismiss flow
- **변경 대상:** podo-app (frontend)
- **변경 내용:** Bottom sheet warning. Mark incentive expired server-side. Navigate to Lessons tab.

## 5. Delta Set Reference

- **delta-set 경로**: `build/delta-set.json`
- **변경 파일 수**: create 8건, modify 1건
- **content hash**: `d20f196677e764f4d2f4d48d931aaa790e7f736e559f75212aa693fdc5dfcf70`
## 6. Validation Plan Reference

- **validation-plan 경로**: `build/validation-plan.md`
- **검증 항목 수**: 9건
- **content hash**: `dfdb976de6d2abbfc662afcb875d8de68ff8c92ba86f6b5525057292f31914fa`
## 7. Brownfield Context

상세: [`build/brownfield-detail.md`](brownfield-detail.md) (hash: `32309956`)

### 변경 대상 파일 (2건)

| 경로 | 역할 | 상세 |
|------|------|------|
| `apps/web/src/pages/payment/index.tsx` | Payment page | [→ 상세](brownfield-detail.md#undefined) |
| `src/main/java/com/speaking/podo/applications/payment/gateway/PaymentGateway.java` | Payment processing | [→ 상세](brownfield-detail.md#undefined) |

### 직접 의존 모듈 (2건)

| 모듈 | 의존 대상 | 상세 |
|------|----------|------|
| undefined | undefined | [→ 상세](brownfield-detail.md#undefined) |
| undefined | undefined | [→ 상세](brownfield-detail.md#undefined) |

