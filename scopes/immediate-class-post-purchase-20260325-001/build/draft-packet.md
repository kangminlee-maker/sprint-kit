## Draft Packet: 수강권 구매 직후 수업 예약을 유도하여 환불률을 낮춘다. 현재 전체 구매자의 8%가 수업을 한 번도 듣지 않고 환불하고 있다. 수업을 1회라도 수강한 사용자는 환불 가능성이 크게 낮아진다는 가설에 기반하여, 구매 완료 시점에 즉시 수업 예약을 강하게 권유하는 경험을 만든다.

### 1. 확정된 Surface

- **scope type**: experience
- **surface location**: `surface/preview/`
- **실행 방법**: `cd surface/preview && npm install && npm run dev`
- **mockup 반복**: 1회 수정 후 사용자 확정

**시나리오 가이드:**

| 시나리오 | 시작 | 동작 순서 | 확인된 동작 |
|---------|------|----------|------------|
| Happy path: purchase → book first class | Celebration screen after payment success | Tap "Book Your First Class" → level pre-selected (Recommended badge) → tap Next → pick time slot → Confirm Booking | Bonus (+1 class or +3 days) awarded on confirmation. Lands on booking confirmed screen. |
| Dismiss path: user declines booking | Celebration screen | Tap "Maybe later" or X → bottom sheet: "Are you sure? Bonus gone forever" → "Leave" or "Stay and Book" | If leave: drops into Lesson tab. Incentive permanently lost. |
| Late-night purchase | Celebration screen after 9pm purchase | Same flow, but time slots show tomorrow's availability since no tutors available within 2 hours | System shows earliest available slots (next day). "Book for tomorrow morning" experience. |

---

### 2. 현재까지의 결정 현황

- Align에서 결정: 방향 승인, 범위 확정, CST-001, CST-002, CST-003, CST-004, CST-005, CST-006 인지 완료
- Draft에서 결정 필요: 아래 9건 (0건 결정 완료, 9건 미결정)
- 잠금 전 필수 해소: `clarify` 상태 항목이 있으면 잠글 수 없음

---

### 3. 결정이 필요한 항목 — 확정된 mockup 기준

#### 요약

| CST-ID | 관점 | 요약 | severity(중요도) |
|--------|------|------|--------|
| CST-001 | Code | 2-hour minimum advance booking requirement prevents immediate class start | 필수 (Builder 결정) |
| CST-002 | Code | Course must match ticket curriculumType (XG1 guard) | 필수 (Builder 결정) |
| CST-003 | Code | Unlimited ticket allows only 1 concurrent booking | 필수 (Builder 결정) |
| CST-007 | Code | Each level must map to exactly one auto-assigned first lesson (LectureCourse) | 필수 (Builder 결정) |
| CST-008 | Code | One-time incentive requires server-side tracking to prevent double-claim on app restart | 필수 (Builder 결정) |
| CST-006 | Code | BONUS acquisitionType from duplicate-ticket-purchase scope may not be in production | 권장 (Builder 결정) |

---

#### CST-001 | Code | 2-hour minimum advance booking requirement prevents immediate class start — 필수 (Builder 결정 항목)

**상황:** 2-hour minimum advance booking. The surface shows time slots starting 2+ hours from now. For late-night purchases, today's slots may be empty.

**처리하지 않으면:** System will reject bookings less than 2 hours in advance. Users booking late at night may see no available slots.

**Builder가 결정할 사항:** Show earliest available slots across today and tomorrow. If today has no slots, auto-select tomorrow.

**이 작업 관점에서의 판단:** Low risk. Standard booking logic applies. Reversal cost: negligible — just UI filtering.

Builder 결정 예정 — 제품 관점 제약 조건 없음. 승인: ___

---

#### CST-002 | Code | Course must match ticket curriculumType (XG1 guard) — 필수 (Builder 결정 항목)

**상황:** Course must match ticket curriculumType (XG1 guard). The simplified level-select flow auto-assigns a first lesson per level.

**처리하지 않으면:** Mismatched course-ticket combination rejected by LEC-1 precondition. User sees error.

**Builder가 결정할 사항:** Filter available levels/courses by the purchased ticket's curriculumType before display. Only show levels with compatible courses.

**이 작업 관점에서의 판단:** Low risk. Existing guard XG1 already enforces this server-side. Frontend filtering prevents user-visible errors. Reversal cost: none.

Builder 결정 예정 — 제품 관점 제약 조건 없음. 승인: ___

---

#### CST-003 | Code | Unlimited ticket allows only 1 concurrent booking — 필수 (Builder 결정 항목)

**상황:** Unlimited ticket holders can only have 1 concurrent booking. Returning unlimited users who already have an active class cannot book.

**처리하지 않으면:** Returning unlimited users with existing booking cannot book again from completion screen.

**Builder가 결정할 사항:** Check for existing active bookings before showing the booking CTA. If booking exists, show "You already have a class scheduled" with a link to their upcoming lesson.

**이 작업 관점에서의 판단:** Edge case — only affects returning unlimited users with a pending class. Reversal cost: none.

Builder 결정 예정 — 제품 관점 제약 조건 없음. 승인: ___

---

#### CST-007 | Code | Each level must map to exactly one auto-assigned first lesson (LectureCourse) — 필수 (Builder 결정 항목)

**상황:** Each level must map to exactly one auto-assigned first lesson (LectureCourse). LEC-1 requires a specific course selection.

**처리하지 않으면:** System cannot auto-create a class without a specific LectureCourse. Must define mapping from level to first lesson.

**Builder가 결정할 사항:** Create a level-to-first-lesson mapping table. Use the first active LectureCourse for each level as the default. Configurable via backend.

**이 작업 관점에서의 판단:** Medium complexity. Requires a new mapping, but LectureCourse data already exists. Reversal cost: low — mapping is a config change.

Builder 결정 예정 — 제품 관점 제약 조건 없음. 승인: ___

---

#### CST-008 | Code | One-time incentive requires server-side tracking to prevent double-claim on app restart — 필수 (Builder 결정 항목)

**상황:** One-time incentive must be tracked server-side to prevent double-claim. If user force-quits and reopens, the incentive screen should not reappear.

**처리하지 않으면:** User could force-quit and reopen app to claim incentive multiple times. Must track claim status server-side.

**Builder가 결정할 사항:** Record incentive eligibility in a new field on the payment/subscription record. Check this flag when rendering the post-purchase screen. Mark as claimed or expired on first exit/booking.

**이 작업 관점에서의 판단:** Required for correctness. Without this, users could exploit the incentive. Reversal cost: low — simple boolean flag.

Builder 결정 예정 — 제품 관점 제약 조건 없음. 승인: ___

---

#### CST-006 | Code | BONUS acquisitionType from duplicate-ticket-purchase scope may not be in production — 권장 (Builder 결정 항목)

**상황:** BONUS acquisitionType may not be deployed yet (introduced in duplicate-ticket-purchase scope).

**처리하지 않으면:** Bonus ticket cannot be tagged as BONUS type. Fallback: TKT-3 admin API.

**Builder가 결정할 사항:** Check if acquisitionType field exists. If yes, use BONUS type. If not, use TKT-3 admin API to issue bonus ticket without type distinction.

**이 작업 관점에서의 판단:** Low risk. Core bonus functionality works either way. UI distinction is nice-to-have. Reversal cost: none — can upgrade to BONUS type later.

Builder 결정 예정 — 제품 관점 제약 조건 없음. 승인: ___

---

### 5. 제약 조건 (구현 시 반드시 지켜야 할 것)

- Incentive must be one-time only: once the user leaves the completion screen or books, the incentive cannot be re-offered
- Bonus ticket for count-based plans must not affect refund calculation (issued as separate bonus, not part of original purchase)
- Pre-study is skipped/deferred — do not block the booking flow for pre-study completion
- Course-ticket type matching (XG1) must be enforced both client-side and server-side
- The completion screen must clearly communicate that the incentive disappears if the user leaves

---

### 6. 지금 결정할 것

1. All constraints are Builder decisions. Please confirm: approve all Builder decisions as described above?

모든 결정이 완료되면 compile을 시작합니다.

- **Approve**: 위 결정에 동의하며, compile 단계로 진행합니다. 각 CST에 대한 결정을 함께 제출해 주세요.
- **Revise**: 피드백을 주시면 Draft Packet을 수정하여 다시 보여드립니다.
- **Reject**: 이 scope를 거절하고 종료합니다.
- **Redirect to Align**: 방향 자체를 재검토하기 위해 Align 단계로 돌아갑니다.
- **Review**: 이 Packet 전체에 대해 6-Agent Panel Review를 요청합니다.

선택: **Approve** + 각 CST 결정 / **Revise** / **Reject** / **Redirect to Align** / **Review**
