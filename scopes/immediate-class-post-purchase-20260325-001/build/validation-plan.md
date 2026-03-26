# Validation Plan: 수강권 구매 직후 수업 예약을 유도하여 환불률을 낮춘다. 현재 전체 구매자의 8%가 수업을 한 번도 듣지 않고 환불하고 있다. 수업을 1회라도 수강한 사용자는 환불 가능성이 크게 낮아진다는 가설에 기반하여, 구매 완료 시점에 즉시 수업 예약을 강하게 권유하는 경험을 만든다.

scope: immediate-class-post-purchase-20260325-001

---

### VAL-001 | CST-001 | inject

**검증 대상:** Time slots
**검증 방법:** Verify 2hr minimum
**통과 조건:** No slots within 2hr
**실패 시 조치:** Client-side filter

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| Purchase at 11pm | Tomorrow auto-selected |

---

### VAL-002 | CST-002 | inject

**검증 대상:** Level filter
**검증 방법:** Verify curriculumType match
**통과 조건:** Only matching levels shown
**실패 시 조치:** Server XG1 rejection

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| SMART_TALK ticket | Only SMART_TALK levels |

---

### VAL-003 | CST-003 | inject

**검증 대상:** Concurrent booking
**검증 방법:** Check existing bookings
**통과 조건:** Alternative message if exists
**실패 시 조치:** Server reject

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| Unlimited with pending class | Alternative message shown |

---

### VAL-004 | CST-004 | inject

**검증 대상:** Completion screen
**검증 방법:** Verify redirect
**통과 조건:** Shows celebration
**실패 시 조치:** Fallback Home

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| Webhook before redirect | Screen renders correctly |

---

### VAL-005 | CST-006 | inject

**검증 대상:** Bonus issuance
**검증 방법:** Verify correct type
**통과 조건:** +1 or +3 days
**실패 시 조치:** TKT-3 fallback

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| BONUS type unavailable | TKT-3 fallback works |

---

### VAL-006 | CST-007 | inject

**검증 대상:** Level mapping
**검증 방법:** Verify auto-assign
**통과 조건:** Booking succeeds
**실패 시 조치:** Manual selection fallback

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| No active course for level | Level hidden |

---

### VAL-007 | CST-008 | inject

**검증 대상:** Double-claim prevention
**검증 방법:** Server-side flag
**통과 조건:** Second claim rejected
**실패 시 조치:** Server rejects

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| Force-quit during booking | Incentive expired |
| Concurrent claims | Only one succeeds |

---

### VAL-008 | CST-008-dup-check | inject

**검증 대상:** Duplicate prevention
**검증 방법:** Same as CST-008
**통과 조건:** Covered by CST-008 validation
**실패 시 조치:** N/A

**Edge cases:**

| 시나리오 | 예상 결과 |
|---------|----------|
| Same as CST-008 | Handled by CST-008 |

---

### VAL-009 | CST-005 | defer

**검증 대상:** Taking 1 class forfeits 7-day cooling-off refund right 비간섭 확인
**검증 방법:** 검증 파일: Terms of Service Section 15. 해당 파일이 이번 변경에서 수정되지 않았는지 확인
**통과 조건:** Terms of Service Section 15 변경 없음
**실패 시 조치:** 의도하지 않은 간섭 발견 시 constraints_resolved로 복귀하여 재결정

---
