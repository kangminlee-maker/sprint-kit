# Scope: 수강권 구매 직후 수업 예약을 유도하여 환불률을 낮춘다. 현재 전체 구매자의 8%가 수업을 한 번도 듣지 않고 환불하고 있다. 수업을 1회라도 수강한 사용자는 환불 가능성이 크게 낮아진다는 가설에 기반하여, 구매 완료 시점에 즉시 수업 예약을 강하게 권유하는 경험을 만든다.

## 현황

- **상태**: 종료됨
- **방향**: Maximize first-class booking rate at purchase completion. Reduce 0-class refund rate from 8% to 2-3% via completion screen with celebration, simplified booking, and one-time incentive.
- **마지막 업데이트**: revision 52

## 다음 행동

- 이 scope는 완료되었습니다

## 범위

**포함:**
- Purchase completion screen with celebration/confirmation UI
- Strong booking CTA with one-time incentive messaging
- Simplified lesson selection: pre-selected level for trial/returning users, level chooser for new users. 4-5 lessons per level. Easy level switching.
- Time slot selection (tutor + time, min 2hr out). Pre-study skipped/deferred.
- One-time incentive: +1 bonus class (count-based) or +3 days extension (unlimited). Only on completion screen.
- Exit confirmation pop-up: clear messaging that incentive is lost forever.
- Dismiss destination: lesson tab (not Home).

**제외:**
- No-show / cancellation prevention after booking (separate scope)
- External channel notifications — KakaoTalk, SMS, email (deferred)
- Post-purchase reminders on Home screen
- Level test / placement assessment (not building)

## 스캔 소스

- `github-tarball`: https://github.com/re-speak/podo-backend
- `github-tarball`: https://github.com/re-speak/podo-app
- `github-tarball`: https://github.com/re-speak/podo-ontology
- `github-tarball`: https://github.com/re-speak/vibe-design/tree/feat/prevent-purchase-duplication
- `add-dir`: ./sources
- `mcp`: clickhouse

## Constraint 현황

- 전체: 9건 (필수 6, 권장 3)
- 결정 완료: 9건

## 검증 결과

- **결과**: 통과
- **통과**: 9건, **실패**: 0건

<details>
<summary>Constraint 결정 상세 (9건)</summary>

| CST-ID | 결정 | 선택 |
|--------|------|------|
| CST-001 | inject | Show earliest available slots, auto-select tomorrow if today empty |
| CST-002 | inject | Filter levels by ticket curriculumType before display |
| CST-003 | inject | Check existing bookings, show alternative message if one exists |
| CST-004 | inject | Build new purchase completion screen as confirmed in surface |
| CST-005 | defer | No disclosure — standard ToS applies |
| CST-006 | inject | Check acquisitionType availability, fallback to TKT-3 |
| CST-007 | inject | Level-to-first-lesson mapping table using first active LectureCourse |
| CST-008 | inject | Server-side incentive eligibility flag on payment record |
| CST-008-dup-check | inject | duplicate check - handled by CST-008 |

</details>

## 최근 결정

- rev 38: CST-007 → inject (builder)
- rev 39: CST-008 → inject (builder)
- rev 40: CST-008-dup-check → inject (builder)
- rev 41: CST-004 → inject (builder)
- rev 42: CST-005 → defer (product_owner)
