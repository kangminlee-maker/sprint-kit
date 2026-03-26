---
scope: immediate-class-post-purchase-20260325-001
title: "Post-Purchase Immediate Booking — Purchase Completion Screen"
created: 2026-03-25
compiled: 2026-03-25
service: PODO Speaking
type: experience
status: ready-for-build
stack:
  - Next.js 15
  - React 19
  - TypeScript
  - Tailwind CSS v3
  - CVA
  - "@tanstack/react-query"
  - motion
constraints_injected:
  - CST-001
  - CST-002
  - CST-003
  - CST-004
  - CST-006
  - CST-007
  - CST-008
constraints_deferred:
  - CST-005
implementation_items:
  - IMPL-001
  - IMPL-002
  - IMPL-003
  - IMPL-004
  - IMPL-005
  - IMPL-006
change_items:
  - CHG-001
  - CHG-002
  - CHG-003
  - CHG-004
  - CHG-005
  - CHG-006
  - CHG-007
  - CHG-008
  - CHG-009
---

# PRD: Post-Purchase Immediate Booking

## 1. Problem Statement

8% of PODO Speaking purchasers take zero classes and request a refund. The hypothesis is that users who book and attend at least one class have dramatically lower refund rates. The current payment flow redirects directly to the Home screen after purchase, creating no moment of commitment or guidance toward a first booking.

This scope inserts a purpose-built purchase completion experience between payment success and the Home screen. The experience celebrates the purchase, surfaces a one-time incentive for booking immediately, and guides the user through a simplified booking flow — level selection then time slot selection — without leaving the context of their purchase moment.

**Primary metric**: First-class booking rate at purchase completion
**Target outcome**: Reduce 0-class refund rate from 8% to 2–3%

---

## 2. Scope Boundaries

### In Scope

- Purchase completion screen: celebration animation, purchase summary, incentive banner, booking CTA
- One-time incentive: +1 bonus class for count-based plans; +3 days extension for unlimited plans
- Level selection screen: recommended pre-selection for trial/returning users; chooser for new users; easy level switching
- Time slot selection screen: tutor + time, minimum 2-hour advance, 3-day tab view, auto-tomorrow fallback
- Booking confirmation screen: success state, bonus award confirmation
- Exit confirmation bottom sheet: incentive-loss warning, dismiss destination is Lessons tab (not Home)
- Server-side incentive eligibility tracking and double-claim prevention

### Out of Scope

- No-show and cancellation prevention (separate scope)
- External notifications: KakaoTalk, SMS, email
- Home screen reminders and re-engagement
- Level test or placement assessment
- Refund eligibility disclosure for first-class attendance (CST-005, deferred per PO decision)

---

## 3. User Journeys

### Journey 1 — Happy Path: Count-Based Plan User (Ji-yeon)

**Persona**: Ji-yeon, 28, marketing professional. Purchased a 10-class count-based ticket on a weekday evening. First-time PODO Speaking user with no booking history. Motivated to start quickly but uncertain which level to pick.

#### Act 1 — Purchase Completion

Ji-yeon completes payment via PortOne. Instead of landing on the generic Home screen, she arrives at the purchase completion screen. A checkmark animation plays. The screen reads "결제가 완료되었습니다" with her plan name and class count confirmed. Below the purchase summary, a bright incentive banner reads: "지금 첫 수업을 예약하면 보너스 1회가 추가됩니다." A primary CTA button — "첫 수업 예약하기" — sits below the banner. A secondary text link — "나중에 할게요" — appears beneath the button.

#### Act 2 — Level Selection

Ji-yeon taps the CTA. The level selection screen slides in. Because she is a new user with no trial or class history, the level chooser is shown: a vertical list of available levels filtered by her ticket's curriculumType (XG1). Each level card shows the level name, a one-line description of what kind of learner it suits, and 4–5 representative lesson topics. No level is pre-selected. She taps "중급 (Intermediate)" and sees the card highlight with a checkmark. A "다음" button at the bottom activates. She taps it.

#### Act 3 — Time Slot Selection

The time slot selection screen appears. A 3-tab date bar shows today, tomorrow, and the day after. Because it is 10:30 PM, today's tab shows "오늘 — 예약 가능한 시간이 없습니다" and tomorrow's tab is auto-selected. Tomorrow's slots are shown as a grid of tutor-plus-time cards. Each card shows the tutor's name, photo thumbnail, and the class start time. Slots within 2 hours of the current time are filtered out. Ji-yeon selects a 7 AM slot with a tutor she likes. The "예약 확정" button activates.

#### Act 4 — Booking Confirmed, Bonus Pending

Ji-yeon taps "예약 확정." The server calls `POST /podo/createPodoClass` and marks the incentive as pending on her payment record. The booking confirmation screen displays: her class time, tutor name, and a celebration message. A secondary callout reads "수업을 완료하면 보너스 1회가 지급됩니다." A single CTA — "수업 탭으로 이동" — takes her to the Lessons tab.

When Ji-yeon attends and completes the class, the server awards the +1 bonus class via the BONUS acquisitionType (or TKT-3 fallback if BONUS is unavailable) and marks the incentive as claimed on her payment record. If she reschedules the class to a different time, the incentive remains pending and is still awarded upon class completion. If she cancels the class outright, the incentive is forfeited permanently.

---

### Journey 2 — Happy Path: Unlimited Plan User (Min-jun)

**Persona**: Min-jun, 35, returning user. Renewed his unlimited subscription after a 3-month break. Has booking history and a known level from previous sessions.

#### Act 1 — Purchase Completion

Min-jun completes renewal. The completion screen appears with the celebration animation and his plan name: "무제한 수강권 (30일)." The incentive banner reads: "지금 예약하시면 수강 기간이 3일 연장됩니다." The same primary CTA appears. The system checks: Min-jun has no concurrent booking (CST-003 satisfied), so the full booking flow is available.

#### Act 2 — Level Selection (Pre-Selected)

Because Min-jun is a returning user with booking history, the level selection screen opens with his last-used level pre-selected and marked "추천" (Recommended). The other levels are listed below as alternatives. A "다른 레벨 선택" link is visible for easy switching. Min-jun glances at the pre-selected level, confirms it matches where he left off, and taps "다음" immediately. No re-selection required.

#### Act 3 — Time Slot Selection

Min-jun's preferred morning slot is a Saturday. The 3-day tab shows Saturday as today. He sees available slots and picks a 9 AM slot. The server checks concurrent booking status: he has no existing booking, so the selection is allowed.

#### Act 4 — Booking Confirmed, Extension Pending

The server calls `POST /podo/createPodoClass` and marks the incentive as pending on his payment record. The booking confirmation screen shows class time, tutor, and a callout: "수업을 완료하면 수강 기간이 3일 연장됩니다." The "수업 탭으로 이동" CTA sends him to the Lessons tab.

When Min-jun attends and completes the class, the server applies the +3 day extension to his `GT_SUBSCRIBE` record's `additional_days` field and marks the incentive as claimed. If he reschedules the class to a different time, the incentive remains pending and is still awarded upon class completion. If he cancels the class outright, the incentive is forfeited permanently.

---

### Journey 3 — Dismiss Path: User Declines Booking (Soo-hyun)

**Persona**: Soo-hyun, 31, busy professional. Purchased a class pack during lunch break on a mobile device. Does not have time to book right now and intends to do it later.

#### Act 1 — Purchase Completion

Soo-hyun completes payment. The completion screen appears with celebration and incentive banner. She reads it but is pressed for time.

#### Act 2 — Dismissal Attempt

Soo-hyun taps "나중에 할게요." Instead of immediately navigating away, the exit confirmation bottom sheet slides up.

#### Act 3 — Exit Confirmation Warning

The bottom sheet displays a warning: "지금 나가시면 보너스 혜택이 사라집니다." Two buttons: "계속 예약하기" (primary, keeps her in the flow) and "혜택 포기하고 나가기" (secondary, destructive). She reads the warning and decides to leave anyway. She taps "혜택 포기하고 나가기."

#### Act 4 — Dismissed to Lessons Tab

The server marks her incentive as expired on her payment record (CST-008). She lands on the Lessons tab, not the Home screen. The incentive cannot be re-shown or re-claimed in future sessions.

---

## 4. Functional Requirements

### Screen 1: Purchase Completion (CHG-001 — `purchase-complete/index.tsx`)

**FR-1.1 — Celebration animation**
On screen mount, play a checkmark animation using `motion`. Animation should complete within 1.5 seconds and settle into a static success state. Do not loop.

**FR-1.2 — Purchase summary**
Display the purchased plan name and, for count-based plans, the total class count. For unlimited plans, display the subscription duration in days. Source from the payment confirmation response.

**FR-1.3 — Incentive banner**
Display a visually distinct banner above the CTA. Banner copy:
- Count-based plans: "지금 첫 수업을 예약하면 보너스 1회가 추가됩니다."
- Unlimited plans: "지금 예약하시면 수강 기간이 3일 연장됩니다."

The banner is only shown if the server confirms `incentiveEligible: true` for this payment record. If `incentiveEligible: false` (already claimed or expired), the banner is hidden. The CTA remains visible and functional regardless.

**FR-1.4 — Primary booking CTA**
Label: "첫 수업 예약하기." Navigates to the level selection screen. Always visible.

**FR-1.5 — Dismiss link**
Label: "나중에 할게요." Triggers the exit confirmation bottom sheet (see Screen 4). Never navigates directly away.

**FR-1.6 — Redirect from payment page**
`apps/web/src/pages/payment/index.tsx` must be modified (CHG-005) to redirect to `/purchase-complete` instead of Home after `PaymentGateway.processPayment()` succeeds.

---

### Screen 2: Level Selection (CHG-002 — `purchase-complete/level-select.tsx`)

**FR-2.1 — Level list filtered by curriculumType**
Fetch available levels via `GET /podo/getPodoClassCourseList`. Filter client-side to only show levels whose `curriculumType` matches the purchased ticket's `curriculumType` (XG1 enforcement). If no levels match, show an error state with a support contact link.

**FR-2.2 — Pre-selection for trial and returning users**
- If the user has a trial completion on record: pre-select the recommended post-trial level.
- If the user has prior booking history: pre-select their last booked level.
- If neither: show the chooser with no pre-selection.

Pre-selected level is marked with a "추천" badge. The selection can be changed by tapping any other level card.

**FR-2.3 — Level cards**
Each level card displays: level name, one-line learner description, and 4–5 representative lesson topic labels. Tapping a card selects it (highlighted state). Only one card can be selected at a time.

**FR-2.4 — Level-to-lesson mapping (CST-007)**
`LevelRecommendationService.java` (CHG-009) maintains a mapping table from each level to its first active `LectureCourse`. This mapping is used server-side during booking creation (`IMPL-003`). If a level has no active `LectureCourse`, hide that level from the list.

**FR-2.5 — Proceed button**
Label: "다음." Active only when a level is selected. Navigates to time slot selection, passing the selected level identifier.

**FR-2.6 — Back navigation**
Returns to the purchase completion screen. Preserves purchase context.

---

### Screen 3: Time Slot Selection (CHG-003 — `purchase-complete/time-select.tsx`)

**FR-3.1 — Date tabs**
Three tabs: today, tomorrow, day after tomorrow. Displayed as formatted dates (e.g., "3월 26일 (수)"). Default tab is today.

**FR-3.2 — 2-hour minimum advance filtering (CST-001)**
Fetch slots via `GET /podo/getLectureList`. Filter out any slot whose start time is less than 2 hours from the current client time. If today has zero valid slots after filtering, auto-select the tomorrow tab and display a notice: "오늘 예약 가능한 시간이 없어 내일 일정을 보여드립니다."

**FR-3.3 — Slot cards**
Each slot card displays: tutor name, tutor photo thumbnail, class start time. Cards are arranged in a scrollable grid. Tapping a card selects it (highlighted state). Only one slot can be selected at a time.

**FR-3.4 — Empty state**
If a date tab has no valid slots, show "해당 날짜에 예약 가능한 시간이 없습니다."

**FR-3.5 — Unlimited concurrent booking check (CST-003)**
Before rendering the slot grid, call the server to check if the user has an existing concurrent booking. If a concurrent booking exists, replace the slot grid with an informational message: "현재 예약된 수업이 있습니다. 해당 수업 이후 새로운 수업을 예약해 주세요." The booking CTA is hidden in this state.

**FR-3.6 — Confirm booking button**
Label: "예약 확정." Active only when a slot is selected. Triggers the booking API call.

**FR-3.7 — Loading and error states**
Show a loading skeleton while fetching slots. On API error, show a retry prompt.

---

### Screen 4: Booking Confirmation (CHG-004 — `purchase-complete/booking-confirmed.tsx`)

**FR-4.1 — Booking success display**
Show the confirmed class date, time, and tutor name. Show a success icon (animated via `motion`).

**FR-4.2 — Bonus pending notice**
The booking confirmation screen shows that the bonus is pending, not yet awarded. The bonus is awarded only when the user completes the booked class.
- Count-based: "수업을 완료하면 보너스 1회가 지급됩니다."
- Unlimited: "수업을 완료하면 수강 기간이 3일 연장됩니다."
- If the user was not incentive-eligible (banner was hidden on completion screen), do not show any bonus callout.

When class completion is confirmed server-side, a separate completion event triggers `claimIncentive`. The user sees the awarded state (count-based: "보너스 1회 적립 완료!", unlimited: "수강 기간 3일 연장 완료!") in the Lessons tab or a push notification — not on this screen.

**FR-4.3 — CTA**
Label: "수업 탭으로 이동." Navigates to the Lessons tab. No other navigation option on this screen.

---

### Screen 5: Exit Confirmation (CHG-008 — `purchase-complete/exit-confirm.tsx`)

**FR-5.1 — Trigger condition**
Shown as a bottom sheet when the user taps "나중에 할게요" on the purchase completion screen, or attempts to use the system back gesture while on the completion screen.

**FR-5.2 — Warning message**
Header: "지금 나가시면 보너스 혜택이 사라집니다."
Body: "이 혜택은 구매 직후에만 제공되며 다시 받을 수 없습니다."

**FR-5.3 — Continue button**
Label: "계속 예약하기." Dismisses the bottom sheet. Returns user to the purchase completion screen. The incentive remains eligible.

**FR-5.4 — Exit button**
Label: "혜택 포기하고 나가기." Calls the server to mark the incentive as expired for this payment record (CST-008). On success, navigates to the Lessons tab.

**FR-5.5 — Incentive expiry is permanent**
Once expired server-side, the incentive banner will not be shown on subsequent visits to the completion screen URL for this payment record. The server must enforce this.

---

### Backend Services

**PostPurchaseIncentiveService.java (CHG-006)**

- `checkEligibility(paymentId)` — returns `{eligible: boolean, incentiveType: COUNT_BONUS | DAY_EXTENSION}` based on payment record state (not yet claimed, not yet expired).
- `pendingIncentive(paymentId, userId)` — called immediately after booking creation. Sets `incentivePending = true` on payment record. Does not issue any bonus yet.
- `claimIncentive(paymentId, userId)` — called when class completion is confirmed. Idempotency-safe. Issues +1 class via BONUS acquisitionType or TKT-3 fallback (CST-006), or applies +3 days to `GT_SUBSCRIBE.additional_days`. Sets `incentiveClaimed = true` and clears `incentivePending` on payment record. If the booking is rescheduled, `incentivePending` remains true and this call is deferred to the rescheduled class completion. If the booking is cancelled, calls `expireIncentive` instead.
- `expireIncentive(paymentId)` — sets `incentiveExpired = true` on payment record. Called on user dismissal.
- Double-claim prevention (CST-008): both `claimIncentive` and `expireIncentive` are atomic. A payment record with `incentiveClaimed = true` or `incentiveExpired = true` will reject any further mutation.

**PostPurchaseController.java (CHG-007)**

- `GET /post-purchase/incentive-status?paymentId=` — returns eligibility status. Called on completion screen mount.
- `POST /post-purchase/expire-incentive` — body: `{paymentId}`. Called when user confirms exit.
- Booking confirmation uses existing `POST /podo/createPodoClass`; after successful booking creation, `pendingIncentive` is called server-side to record the incentive as pending. Bonus issuance is NOT triggered at booking time.
- Class completion triggers `claimIncentive` server-side. This can be wired to the existing class-completion event (e.g., tutor marks class done) or a webhook from the scheduling system. The incentive is awarded at that point, not before.
- `POST /post-purchase/cancel-incentive` — body: `{paymentId}`. Called when user cancels the booked class (distinct from user dismissing the flow). Calls `expireIncentive` to permanently forfeit the bonus.

**LevelRecommendationService.java (CHG-009)**

- `getRecommendedLevel(userId, ticketCurriculumType)` — returns the recommended level identifier based on trial completion or booking history.
- `getLevelCourseMapping(curriculumType)` — returns the mapping of level → first active `LectureCourse` ID, filtered by curriculumType. Used to hide levels with no active course and to auto-assign the `LectureCourse` at booking time.

---

## 5. Constraints (All Injected)

| ID | Summary | Implementation |
|----|---------|----------------|
| CST-001 | 2-hour minimum advance booking | Client-side slot filter on `GET /podo/getLectureList`. Auto-select tomorrow tab if today is empty. |
| CST-002 | Course must match ticket `curriculumType` (XG1) | Client-side level list filter + server-side rejection on booking. |
| CST-003 | Unlimited: 1 concurrent booking only | Server check before slot grid render. Replace grid with alternative message if concurrent booking exists. |
| CST-004 | No completion screen exists | Build new screen at `/purchase-complete`. Redirect from `payment/index.tsx`. |
| CST-005 | Attending 1 class forfeits 7-day refund right | Deferred. No disclosure shown. Standard ToS applies. Do not modify ToS Section 15. |
| CST-006 | BONUS `acquisitionType` may not be in production | `PostPurchaseIncentiveService` checks availability; falls back to TKT-3 admin API if BONUS unavailable. |
| CST-007 | Level must map to exactly one auto-assigned `LectureCourse` | `LevelRecommendationService.getLevelCourseMapping()`. Levels with no active course are hidden from the chooser. |
| CST-008 | Incentive double-claim prevention | Server-side `incentiveClaimed` / `incentiveExpired` flags on payment record. Atomic writes. Both claim and expire paths check flags before executing. |

---

## 6. Event Tracking

All events use a shared `post_purchase_` prefix. Properties common to all events: `user_id`, `payment_id`, `ticket_type` (COUNT | UNLIMIT | PODO_TRIAL), `plan_name`.

| Event Name | Trigger | Additional Properties |
|-----------|---------|----------------------|
| `purchase_complete_viewed` | Purchase completion screen mounts | `incentive_eligible: boolean`, `incentive_type: COUNT_BONUS \| DAY_EXTENSION \| null` |
| `booking_cta_tapped` | User taps "첫 수업 예약하기" | `incentive_visible: boolean` |
| `level_selected` | User taps a level card | `level_id`, `level_name`, `is_recommended: boolean`, `selection_method: pre_selected \| user_chosen` |
| `time_selected` | User taps a time slot card | `slot_date`, `slot_time`, `tutor_id`, `date_tab: today \| tomorrow \| day_after` |
| `booking_confirmed` | Booking API returns success | `level_id`, `tutor_id`, `class_datetime`, `incentive_pending: boolean` |
| `incentive_pending` | Server sets incentive to pending after booking | `incentive_type: COUNT_BONUS \| DAY_EXTENSION` |
| `incentive_awarded` | Server confirms incentive issued on class completion | `incentive_type: COUNT_BONUS \| DAY_EXTENSION`, `bonus_source: BONUS_TYPE \| TKT3_FALLBACK` |
| `incentive_forfeited` | User cancels the booked class — incentive permanently lost | `incentive_type: COUNT_BONUS \| DAY_EXTENSION`, `forfeit_reason: class_cancelled` |
| `exit_attempted` | User taps "나중에 할게요" or uses back gesture | `current_screen: completion \| level_select \| time_select` |
| `exit_confirmed` | User taps "혜택 포기하고 나가기" in bottom sheet | `incentive_was_eligible: boolean` |

All events must be fired client-side via the existing analytics wrapper. `incentive_pending` is fired client-side on booking confirmation. `incentive_awarded` and `incentive_forfeited` are fired server-side (from class completion or class cancellation handlers respectively) to ensure accuracy, since neither event occurs within the purchase flow UI.

---

## 7. QA Considerations

Derived from the validation plan (`build/validation-plan.md`).

### VAL-001 — 2-Hour Minimum Slot Filter (CST-001)

**What to test**: Time slot screen shows no slots within 2 hours of current time.

- Purchase at 11:00 PM → today tab shows 0 slots, tomorrow auto-selected with notice.
- Purchase at 10:00 AM → slots before 12:00 PM are hidden from today tab.
- At midnight boundary: verify date rollover does not cause duplicate or missing slots.

**Failure mode**: Client-side filter not applied, or server does not enforce `BOOKING_ADVANCE_HOURS`. Verify both layers reject early slots.

---

### VAL-002 — curriculumType Level Filter (CST-002)

**What to test**: Level selection only shows levels matching the purchased ticket's `curriculumType`.

- Purchase a SMART_TALK ticket → only SMART_TALK levels appear.
- Attempt booking with a mismatched level via modified client → server returns rejection.

**Failure mode**: All levels shown regardless of ticket type. Server must enforce XG1 guard independently of client filter.

---

### VAL-003 — Unlimited Concurrent Booking (CST-003)

**What to test**: Unlimited plan user with an existing pending booking sees alternative message instead of slot grid.

- Create an unlimited ticket booking, then complete a new unlimited purchase → slot grid is replaced.
- User completes the existing class, then returns to a saved completion URL → slot grid shows normally (re-check concurrent state on each visit).

**Failure mode**: Slot grid shown to user with existing concurrent booking, allowing a second booking that the server will reject.

---

### VAL-004 — Purchase Completion Screen Redirect (CST-004)

**What to test**: After `PaymentGateway.processPayment()` succeeds, user lands on `/purchase-complete` not Home.

- Standard purchase flow → confirm URL is `/purchase-complete`.
- Webhook arrives before redirect → screen renders correctly (payment context passed via URL param or session, not dependent on webhook timing).
- Direct navigation to `/purchase-complete` without valid `paymentId` → redirect to Home.

---

### VAL-005 — Bonus Issuance on Class Completion with Fallback (CST-006)

**What to test**: Correct bonus is issued only after the booked class is completed — not at booking time.

- Count-based plan + BONUS acquisitionType available → booking confirmed, no bonus yet; class completed → +1 class issued via BONUS type.
- Count-based plan + BONUS acquisitionType unavailable → booking confirmed, no bonus yet; class completed → +1 class issued via TKT-3 fallback.
- Unlimited plan → booking confirmed, no extension yet; class completed → +3 days applied to `GT_SUBSCRIBE.additional_days`, not a class count.
- User reschedules the class → incentive remains pending; bonus issued after the rescheduled class is completed.
- User cancels the class → incentive is permanently forfeited; no bonus issued even if user books another class later.
- Verify bonus does not affect refund eligibility calculation.

---

### VAL-006 — Level-to-Course Mapping (CST-007)

**What to test**: Each selectable level maps to exactly one active `LectureCourse`; booking succeeds with auto-assigned course.

- All available levels have at least one active course → all show in chooser.
- Level X has no active `LectureCourse` → Level X hidden from chooser.
- User selects Level Y → booking is created with the correct first `LectureCourse` for Level Y, no manual selection required.

---

### VAL-007 — Double-Claim Prevention (CST-008)

**What to test**: Incentive cannot be claimed more than once per payment record.

- Complete booking → incentive banner not shown on returning to the completion URL (incentive is now pending, not claimable again).
- Class completed → bonus issued once; second class completion event for same `paymentId` → server rejects (`incentiveClaimed = true`).
- Force-quit app during booking confirmation → incentive flag status is consistent (either pending or not; not in a partial state).
- Two concurrent API calls to `claimIncentive` with same `paymentId` (e.g., duplicate class-completion webhook) → only one succeeds, other returns error.
- User reschedules class → `incentivePending` remains true, `incentiveClaimed` remains false; no duplicate award on original slot.

---

### VAL-008 — Exit Flow: Incentive Expiry (CST-008)

**What to test**: Incentive is permanently expired on user dismissal.

- User taps "나중에 할게요" → bottom sheet appears (no navigation yet).
- User taps "계속 예약하기" → bottom sheet closes, incentive still eligible.
- User taps "혜택 포기하고 나가기" → server marks `incentiveExpired = true`, user lands on Lessons tab.
- User returns to completion URL after expiry → incentive banner not shown.

---

### VAL-010 — Reschedule and Cancellation Incentive Behavior

**What to test**: Incentive state is preserved on reschedule and permanently forfeited on cancellation.

- User books class through the post-purchase flow → incentive state is `pending`.
- User reschedules the booked class to a different time (via Lessons tab or scheduling system) → incentive state remains `pending`; no forfeiture occurs.
- Rescheduled class is completed → `claimIncentive` fires, bonus is awarded, state becomes `claimed`.
- User cancels the booked class outright → `expireIncentive` fires, state becomes `expired`; no bonus is awarded.
- User who cancelled then books another class through normal flow → incentive is NOT re-offered; the one-time flag remains `expired`.

**Failure mode**: Reschedule incorrectly triggers `expireIncentive`, causing the user to lose their bonus when they did not cancel. Or cancellation does not trigger `expireIncentive`, leaving a dangling `pending` incentive that could be exploited.

---

### VAL-009 — ToS Section 15 Non-Interference (CST-005, deferred)

**What to verify**: Terms of Service Section 15 (refund rights) is not modified by any file in this change set.

- Review delta set: confirm none of the 9 created/modified files touch ToS content.
- No disclosure UI is added to any screen in this scope.

---

## 8. Text Wireframes

### Wireframe 1: Purchase Completion Screen

```
┌─────────────────────────────────────────┐
│                                         │
│           [✓ Checkmark Animation]       │
│                                         │
│         결제가 완료되었습니다             │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  플랜명: 10회 수강권              │   │
│  │  수강 횟수: 10회                  │   │
│  │  결제 금액: ₩XXX,XXX             │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  🎁 지금 첫 수업을 예약하면       │   │
│  │     보너스 1회가 추가됩니다       │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │       첫 수업 예약하기           │   │   ← Primary CTA
│  └──────────────────────────────────┘   │
│                                         │
│          나중에 할게요                   │   ← Dismiss link
│                                         │
└─────────────────────────────────────────┘
```

Unlimited variant — incentive banner reads:
"지금 예약하시면 수강 기간이 3일 연장됩니다."

---

### Wireframe 2: Level Selection Screen

```
┌─────────────────────────────────────────┐
│  ←  수업 레벨을 선택해 주세요            │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  [추천] 중급 (Intermediate)      │   │   ← Pre-selected (returning user)
│  │  일상 대화와 의견 표현이 가능한   │   │
│  │  학습자에게 적합합니다            │   │
│  │  • Daily Conversations           │   │
│  │  • Expressing Opinions           │   │
│  │  • Travel & Situations           │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  초급 (Beginner)                 │   │
│  │  기초 문장과 기본 표현을 배우는   │   │
│  │  단계입니다                      │   │
│  │  • Greetings & Introductions     │   │
│  │  • Numbers & Time                │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  고급 (Advanced)                 │   │
│  │  ...                             │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │            다음                  │   │   ← Active when level selected
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

New user variant: No level pre-selected, no "추천" badge. User must tap a card to activate "다음."

---

### Wireframe 3: Time Slot Selection Screen

```
┌─────────────────────────────────────────┐
│  ←  수업 시간을 선택해 주세요            │
│                                         │
│  ┌──────────┬──────────┬────────────┐   │
│  │  3월26일  │  3월27일  │   3월28일  │   │   ← Date tabs
│  │   (수)   │   (목)   │    (금)    │   │
│  └──────────┴──────────┴────────────┘   │
│                                         │
│  [오늘 예약 가능한 시간이 없어            │   ← Auto-tomorrow notice (if applicable)
│   내일 일정을 보여드립니다]              │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ 김선생님  │  │ 이선생님  │            │   ← Slot cards
│  │  [사진]  │  │  [사진]  │            │
│  │  07:00   │  │  08:00   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ 박선생님  │  │ 최선생님  │            │
│  │  [사진]  │  │  [사진]  │            │
│  │  09:00   │  │  10:00   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │          예약 확정               │   │   ← Active when slot selected
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

Unlimited concurrent booking state — slot grid replaced with:

```
│  현재 예약된 수업이 있습니다.             │
│  해당 수업 이후 새로운 수업을             │
│  예약해 주세요.                          │
```

---

### Wireframe 4: Booking Confirmation Screen

```
┌─────────────────────────────────────────┐
│                                         │
│           [✓ Success Animation]         │
│                                         │
│           예약이 완료되었습니다!          │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  날짜: 2026년 3월 27일 (목)       │   │
│  │  시간: 오전 7:00                  │   │
│  │  강사: 김선생님                   │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  🎉 보너스 1회 적립 완료!         │   │   ← Count-based variant
│  └──────────────────────────────────┘   │
│     (or: 수강 기간 3일 연장 완료!)       │   ← Unlimited variant
│                                         │
│  ┌──────────────────────────────────┐   │
│  │        수업 탭으로 이동           │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

### Wireframe 5: Exit Confirmation Bottom Sheet

```
┌─────────────────────────────────────────┐
│                                         │
│  ████████████████████████████████████   │   ← Dimmed backdrop
│  ████████████████████████████████████   │
│  ████████████████████████████████████   │
│                                         │
│  ╔═════════════════════════════════════╗ │
│  ║                                     ║ │
│  ║  지금 나가시면 보너스 혜택이          ║ │
│  ║  사라집니다                          ║ │
│  ║                                     ║ │
│  ║  이 혜택은 구매 직후에만 제공되며     ║ │
│  ║  다시 받을 수 없습니다               ║ │
│  ║                                     ║ │
│  ║  ┌─────────────────────────────┐    ║ │
│  ║  │      계속 예약하기           │    ║ │   ← Primary
│  ║  └─────────────────────────────┘    ║ │
│  ║                                     ║ │
│  ║    혜택 포기하고 나가기              ║ │   ← Destructive secondary
│  ║                                     ║ │
│  ╚═════════════════════════════════════╝ │
└─────────────────────────────────────────┘
```

---

## 9. Traceability Matrix

| Implementation Item | Constraints Addressed | Change Items | Validation Items |
|--------------------|----------------------|--------------|-----------------|
| IMPL-001: Purchase completion screen | CST-004 | CHG-001, CHG-005 | VAL-004 |
| IMPL-002: Incentive banner + booking CTA | CST-008 | CHG-001, CHG-006, CHG-007 | VAL-007, VAL-008 |
| IMPL-003: Level selection with recommendation | CST-002, CST-007 | CHG-002, CHG-009 | VAL-002, VAL-006 |
| IMPL-004: Time slot selection | CST-001, CST-003 | CHG-003 | VAL-001, VAL-003 |
| IMPL-005: Booking confirmation + bonus award | CST-006 | CHG-004, CHG-006, CHG-007 | VAL-005 |
| IMPL-006: Exit confirmation + dismiss flow | CST-008 | CHG-008, CHG-006, CHG-007 | VAL-008 |

| Change Item | File Path | Operation | IMPL Reference |
|-------------|-----------|-----------|----------------|
| CHG-001 | `apps/web/src/pages/purchase-complete/index.tsx` | CREATE | IMPL-001, IMPL-002 |
| CHG-002 | `apps/web/src/pages/purchase-complete/level-select.tsx` | CREATE | IMPL-003 |
| CHG-003 | `apps/web/src/pages/purchase-complete/time-select.tsx` | CREATE | IMPL-004 |
| CHG-004 | `apps/web/src/pages/purchase-complete/booking-confirmed.tsx` | CREATE | IMPL-005 |
| CHG-005 | `apps/web/src/pages/payment/index.tsx` | MODIFY | IMPL-001 |
| CHG-006 | `PostPurchaseIncentiveService.java` | CREATE | IMPL-002, IMPL-005, IMPL-006 |
| CHG-007 | `PostPurchaseController.java` | CREATE | IMPL-002, IMPL-005, IMPL-006 |
| CHG-008 | `apps/web/src/pages/purchase-complete/exit-confirm.tsx` | CREATE | IMPL-006 |
| CHG-009 | `LevelRecommendationService.java` | CREATE | IMPL-003 |

| Constraint | Status | Addressed In |
|-----------|--------|--------------|
| CST-001 | Injected | IMPL-004, FR-3.2, VAL-001 |
| CST-002 | Injected | IMPL-003, FR-2.1, VAL-002 |
| CST-003 | Injected | IMPL-004, FR-3.5, VAL-003 |
| CST-004 | Injected | IMPL-001, FR-1.6, VAL-004 |
| CST-005 | Deferred | Not implemented. ToS Section 15 unchanged. VAL-009. |
| CST-006 | Injected | IMPL-005, FR backend, VAL-005 |
| CST-007 | Injected | IMPL-003, FR-2.4, VAL-006 |
| CST-008 | Injected | IMPL-002, IMPL-006, FR-5.4, VAL-007, VAL-008 |

---

## 10. Guardrails

1. **Incentive is strictly one-time and awarded only on class completion.** The server enforces three mutually exclusive states on the payment record: `incentivePending` (booking made, class not yet completed), `incentiveClaimed` (class completed, bonus awarded), and `incentiveExpired` (user dismissed the flow or cancelled the booked class). All three flags are written atomically. No client-side state is trusted for eligibility determination. Rescheduling preserves the `pending` state. Cancellation permanently sets `expired`. There is no path from `expired` back to `pending` or `claimed`.

2. **Bonus does not affect refund calculation.** Bonus class tickets and day extensions are issued as separate records. They must not be included in refund eligibility or refund amount calculations. This must be explicitly verified in VAL-005.

3. **Pre-study never blocks booking.** The `LEC-6` pre-study step is skipped or deferred. Booking confirmation must not wait for or require pre-study completion.

4. **XG1 curriculumType enforced at both layers.** Client filters the level list. Server rejects any booking where the `LectureCourse.curriculumType` does not match the ticket's `curriculumType`.

5. **Incentive disappears on exit — messaging must be clear.** The exit confirmation bottom sheet must use unambiguous language that the bonus cannot be recovered. UI copy is fixed as specified in FR-5.2. Do not soften the language.

---

## 11. Open Questions

| ID | Question | Owner | Status |
|----|----------|-------|--------|
| OQ-001 | What is the exact API response shape for `GET /post-purchase/incentive-status`? Does it return `incentiveType` directly, or must the client infer it from `ticketType`? | Backend | Open |
| OQ-002 | For the level chooser, is there a maximum number of levels that can appear? Does the mapping table need a display order field? | Product | Open |
| OQ-003 | If BONUS acquisitionType is unavailable and TKT-3 fallback is used, should the confirmation screen show a different message? Or is "+1 class" the user-facing message regardless of the mechanism? | Product | Open |
| OQ-004 | Should the 3-day tab for time slot selection use calendar dates or relative labels ("오늘", "내일", "모레")? | Design | Open |
