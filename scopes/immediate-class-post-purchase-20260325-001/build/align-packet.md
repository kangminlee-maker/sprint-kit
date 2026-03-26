## Align Packet: 수강권 구매 직후 수업 예약을 유도하여 환불률을 낮춘다. 현재 전체 구매자의 8%가 수업을 한 번도 듣지 않고 환불하고 있다. 수업을 1회라도 수강한 사용자는 환불 가능성이 크게 낮아진다는 가설에 기반하여, 구매 완료 시점에 즉시 수업 예약을 강하게 권유하는 경험을 만든다.

### 1. 당신이 요청한 것 (To-be)

**원문:** "Prompt or strongly encourage people to book a class immediately after they purchase. 8% of all people who purchase take 0 classes and then refund. Hypothesis: if you take that down to 2-3%, people will be much more likely to not refund. Audience is everyone who has just completed a purchase, on the very page where the purchase completion takes place."

**시스템이 해석한 방향:**
Maximize the first-class booking rate at the moment of purchase completion. Reduce the 0-class-then-refund rate from 8% to 2-3% by inserting a purchase completion screen with a celebration, a simplified booking flow, and a one-time incentive (bonus class or days extension) that disappears if the user leaves.

**제안된 범위:**

| 포함 | 동의하시나요? |
|------|-------------|
| Purchase completion screen with celebration/confirmation UI | |
| Strong booking CTA with one-time incentive messaging | |
| Simplified lesson selection: pre-selected level for trial/returning users, level chooser for new users. 4-5 lessons per level. Easy level switching. | |
| Time slot selection (tutor + time, min 2hr out). Pre-study skipped/deferred. | |
| One-time incentive: +1 bonus class (count-based) or +3 days extension (unlimited). Only on completion screen. | |
| Exit confirmation pop-up: clear messaging that incentive is lost forever. | |
| Dismiss destination: lesson tab (not Home). | |

| 제외 | 동의하시나요? |
|------|-------------|
| No-show / cancellation prevention after booking (separate scope) | |
| External channel notifications — KakaoTalk, SMS, email (deferred) | |
| Post-purchase reminders on Home screen | |
| Level test / placement assessment (not building) | |

**시나리오:**

> Student completes purchase → sees celebration screen with ticket summary → taps "Book Your First Class" CTA with incentive badge → level pre-selected (trial/returning) or student picks level → browses 4-5 lessons per level, easily switches → picks lesson → selects tutor and time slot (2+ hours out) → booking confirmed, bonus ticket/days awarded.
>
> Student completes purchase → tries to dismiss CTA → pop-up warns "Are you sure? This bonus cannot be recovered." → student reconsiders or confirms exit → if exit, lands on lesson tab.
>
> Student completes purchase late at night → no tutor slots within reasonable hours → shown "Book for tomorrow morning" with earliest available slots.
>

---

### 2. 현재 현실 (As-is)

#### Experience 관점 — 지금 사용자가 보는 것

After payment succeeds via PortOne, the student is redirected straight to the Home screen. No purchase confirmation, no summary, no next-step guidance. Booking requires 5 manual steps: find booking section → select course matching ticket type → choose lesson material → complete/skip pre-study → pick tutor and time slot. No quick-book path exists.

#### Policy 관점 — 지금 적용되는 규칙

Terms of Service Section 15: Refund within 7 days requires no digital content access and no 1:1 lesson conducted. Taking 1 class forfeits cooling-off right (10% penalty applies). Section 13: Unlimited ticket = 1 concurrent booking only. Count-based tickets have session expiry per billing period. All plans: minimum 2-hour advance booking.

#### Code 관점 — 지금 시스템이 할 수 있는 것

Payment flow: PortOne callback → PaymentGateway.processPayment() → SubscribeMapp + Ticket (TKT-1) → Home redirect. Class creation: LectureCommandServiceImpl.createNewPodoLecture() requires valid ticket + matching LectureCourse + Redis lock. Booking: min 2hr advance (BOOKING_ADVANCE_HOURS). Pre-study skippable (LEC-6). Bonus mechanisms: TKT-3 admin count adjustment, BONUS acquisitionType (pending from duplicate-ticket-purchase scope), additional_days on GT_SUBSCRIBE for unlimited extension.

<details>
<summary>기술 상세 (Builder 참고용)</summary>

APIs: POST /podo/createPodoClass (LEC-1), GET /podo/getPodoClassCourseList, GET /podo/getLectureList. Trial level: GT_CLASS where CITY=PODO_TRIAL with LectureCourse attached. Guard XG1: ticket-course type matching. UNLIMIT: originCount=999, no decrement.
</details>

---

### 2.5 미검증 가정 — 소스 탐색에서 발견

아래 항목은 정책 문서에서 확인되지 않은 가정입니다. Approve 전에 확인을 권장합니다.

| CST-ID | 가정 출처 | 요약 | 확인 필요 사항 |
|--------|----------|------|--------------|
| CST-004 | 현재 작동 중이나 정책 문서에 근거 없음 | No purchase completion screen exists — users go directly to Home | Inferred from app navigation flow. No completion screen component found. |
| CST-006 | 현재 작동 중이나 정책 문서에 근거 없음 | BONUS acquisitionType from duplicate-ticket-purchase scope may not be in production | Field in PRD but may not be deployed. Builder to confirm. |

### 2.6 미검증 가정 — 대화 탐색에서 발견

아래 항목은 Exploration 대화에서 발견된 PO 결정의 전제입니다. 아직 검증되지 않았습니다.

| # | 가정 내용 | 발견 Phase | 상태 |
|---|----------|-----------|------|
| 1 | Users who book at least 1 class are significantly less likely to refund | Phase 1 | 미검증 |
| 2 | Trial class level data can be retrieved at purchase completion time | Phase 4 | 미검증 |
| 3 | Returning user last lesson data is available | Phase 4 | 미검증 |
| 4 | Pre-study can be deferred without breaking the booking flow | Phase 4 | 미검증 |
| 5 | BONUS acquisitionType from duplicate-ticket-purchase scope may not be in production yet | Phase 4 | 미검증 |
| 6 | Existing TKT-3 admin API can be used as fallback for bonus ticket issuance | Phase 4 | 미검증 |
| 7 | additional_days field on GT_SUBSCRIBE can handle unlimited plan extension | Phase 4 | 미검증 |
| 8 | Incentive one-time-only messaging must be explicit and clear on the completion screen and in the exit pop-up | Phase 5 | 미검증 |

---

### 3. 충돌 지점 (Tension)

요청한 것(to-be)과 현재 현실(as-is) 사이에 5건의 충돌이 발견되었습니다.

| CST-ID | 관점 | 요약 |
|--------|------|------|
| CST-001 | Code | 2-hour minimum advance booking requirement prevents immediate class start |
| CST-002 | Code | Course must match ticket curriculumType (XG1 guard) |
| CST-003 | Code | Unlimited ticket allows only 1 concurrent booking |
| CST-005 | Policy | Taking 1 class forfeits 7-day cooling-off refund right |
| CST-006 | Code | BONUS acquisitionType from duplicate-ticket-purchase scope may not be in production |

---

#### CST-001 | Code | 2-hour minimum advance booking requirement prevents immediate class start

**이것이 무엇인가:**
2-hour minimum advance booking window

**왜 충돌하는가:**
Users expect to book "right now" but earliest slot is 2+ hours out. Late-night purchasers may see no reasonable slots.

**처리하지 않으면:**
System will reject bookings less than 2 hours in advance. Users booking late at night may see no available slots.

**변경 규모:** All users. Most impactful for late-night purchases.

**선택지:**

| 선택 | 이점 | 리스크 | 내용 |
|------|------|--------|------|
| Show earliest available slots with clear time | Honest, no system change | Lower conversion for late-night buyers |  |
| Add "Book for tomorrow morning" preset after 9pm | Better late-night UX | Slight additional implementation |  |

**추천:** Show earliest available. Add tomorrow-morning preset for off-hours.

---

#### CST-002 | Code | Course must match ticket curriculumType (XG1 guard)

**이것이 무엇인가:**
Course must match ticket curriculumType

**왜 충돌하는가:**
Simplified selection must filter by ticket type. Wrong match = rejection.

**처리하지 않으면:**
Mismatched course-ticket combination rejected by LEC-1 precondition. User sees error.

**변경 규모:** All users. Transparent if filtering is correct.

**추천:** Builder: filter courses by ticket curriculumType before display.

---

#### CST-003 | Code | Unlimited ticket allows only 1 concurrent booking

**이것이 무엇인가:**
Unlimited ticket: only 1 concurrent booking

**왜 충돌하는가:**
Returning unlimited users with existing booking cannot book again.

**처리하지 않으면:**
Returning unlimited users with existing booking cannot book again from completion screen.

**변경 규모:** Rare — returning unlimited users with pending class.

**추천:** Check existing bookings. Show alternative message if one exists.

---

#### CST-005 | Policy | Taking 1 class forfeits 7-day cooling-off refund right

**이것이 무엇인가:**
Taking 1 class forfeits 7-day cooling-off refund right

**왜 충돌하는가:**
Incentive encourages immediate booking → class attendance → lost refund safety net. Users not informed.

**처리하지 않으면:**
Users may not realize booking+attending a class changes refund eligibility.

**변경 규모:** All first-time purchasers within 7-day window.

**선택지:**

| 선택 | 이점 | 리스크 | 내용 |
|------|------|--------|------|
| No disclosure — standard, policy in ToS | No friction | Complaints if users want to refund later |  |
| Subtle fine-print disclosure on completion screen | Transparent, reduces complaints | May slightly reduce conversion |  |

**추천:** Product Owner decision: transparency vs. conversion trade-off.

---

#### CST-006 | Code | BONUS acquisitionType from duplicate-ticket-purchase scope may not be in production

**이것이 무엇인가:**
BONUS acquisitionType may not be deployed

**왜 충돌하는가:**
Bonus ticket cannot be tagged as BONUS type without this field.

**처리하지 않으면:**
Bonus ticket cannot be tagged as BONUS type. Fallback: TKT-3 admin API.

**변경 규모:** UI/tracking only. Core function unaffected.

**추천:** Builder checks. Fallback: TKT-3. No scope delay.

---

### 4. 지금 결정할 것

1. CST-005: Should the completion screen disclose that attending a class changes refund eligibility? (transparency vs. conversion trade-off)

다음 중 번호로 선택해 주세요:

1. **Approve** — 이 방향과 범위에 동의합니다. Surface(화면 설계) 단계로 진행합니다.
2. **Revise** — Align Packet을 수정하고 싶습니다. 피드백을 주시면 수정 후 다시 보여드립니다. 소스는 다시 읽지 않습니다.
3. **Reject** — 이 scope를 거절하고 종료합니다.
4. **Redirect** — 소스를 다시 읽은 뒤 처음부터 재분석합니다. 소스 정보가 오래되었거나 부족한 경우에 선택하세요.

<details><summary>추가 선택지</summary>

5. **Review** — 6-Agent Panel Review를 요청합니다. 전문가 6인이 검토 후 보강된 Packet을 다시 제시합니다.

</details>

번호(1~4) 또는 자연어로 말씀해 주세요.
