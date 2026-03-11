## Align Packet: 홈 화면 체험 상태 기반 재설계

### 1. 당신이 요청한 것 (To-be)

**원문:** "홈 화면을 학생의 체험 상태에 따라 동적으로 전환되는 구조로 재설계하여, 각 단계에서 다음 행동을 명확히 유도하고, 예외 상황에서도 결제 유도 화면에 도달하게 만든다."

**시스템이 해석한 방향:**
현재 4개 상태(NO_TICKET, SCHEDULED_CLASS, RECOMMEND_BOOKING_TRIAL_CLASS, RECOMMEND_BOOKING_REGULAR_CLASS)로 분기되는 홈 화면 Greeting 영역을 체험 진행 상태(미신청 → 대기 → 레슨 중 → 완료 → 예외) 기반으로 확장하고, 체험 완료 학생의 강제 리다이렉트를 제거하여 홈 화면 내에서 결제 전환 CTA를 노출하는 방향. 디자인 온톨로지의 기존 5개 홈 변형(trial, no_plan, no_booking, booking_waiting, booking_imminent)에 새 상태를 매핑하여 디자인 시스템 변경을 최소화한다.

**제안된 범위:**

| 포함 | 동의하시나요? |
|------|-------------|
| 홈 화면 Greeting 상태 분기 확장 (4개 → 8개+: 미신청, 체험대기, 예약완료, 레슨입장, 체험완료, 튜터노쇼, 학생노쇼/취소, 전체소진) | |
| HomeRedirection 강제 리다이렉트 제거 → 체험완료 학생도 홈 화면에 머무르도록 변경 | |
| 상태별 메인 문구, 프로그레스 활성 단계, 본문 카드, CTA 버튼 라벨/동작 전환 | |
| 체험 완료 후 결제 유도 카드(첫 수강 혜택, AFTER_TRIAL 쿠폰, 프로모션 배너) 홈 화면 내 노출 | |
| 예외 상태(노쇼, 취소) 안내 UI 및 재신청/복귀 경로 제공 | |
| 디자인 온톨로지 기존 home_variants 5개에 새 체험 상태를 매핑 (온톨로지 확장 없이) | |

| 제외 | 동의하시나요? |
|------|-------------|
| GNB 구조 변경 (현재 5탭 유지) | |
| 백엔드 API 신규 개발 (기존 API 조합으로 처리) | |
| 결제 페이지(/subscribes/tickets) 자체의 UI 변경 | |
| 정규 수강생(paymentYn=Y)의 홈 화면 변경 | |
| 스마트토크 전용 홈(/home/ai) 변경 | |
| 디자인 온톨로지(ontology.yaml) 자체의 변형 추가/수정 | |

**시나리오:**

> 시나리오 1 [→ trial 변형]: 미신청 학생이 앱에 진입한다. 홈 화면에 "무료체험으로 가볍게 시작해요" 문구와 체험 안내 카드가 표시된다. CTA "무료 체험 시작하기"를 누르면 체험 신청 플로우(/subscribes/trial)로 이동한다.
>
> 시나리오 2 [→ booking_waiting 변형]: 체험 결제 완료 후 수업 미예약 학생이 홈에 진입한다. 프로그레스바가 "신청 완료" 단계를 활성으로 표시하고, AI학습 유도 카드가 노출된다. 수업 예약이 가능해지면 CTA가 "수업 예약하기"로 전환된다.
>
> 시나리오 3 [→ booking_imminent 변형]: 수업 시작 10분 전 학생이 홈에 진입한다. Greeting이 "레슨 N분 전"으로 전환되고, CTA가 "수업 입장하기"로 바뀌어 교실로 직접 이동할 수 있다.
>
> 시나리오 4 [→ no_plan 변형 재활용]: 체험 수업을 정상 완료한 학생이 홈에 진입한다. 강제 리다이렉트 대신, 홈 화면에 "첫 수강 혜택" 카드와 AFTER_TRIAL 쿠폰 정보가 표시된다. CTA는 "수강권 구매하기"로 결제 페이지를 연결한다.
>
> 시나리오 5 [→ no_booking 변형 재활용]: 튜터 노쇼로 수업이 비정상 종료된 학생이 홈에 진입한다. "선생님 사정으로 수업이 취소되었어요" 안내와 함께 체험 1회 복구 사실이 표시된다. CTA는 "다시 예약하기"로 재신청 플로우에 진입한다.
>
> 시나리오 6 [→ no_booking 변형 재활용]: 학생 노쇼로 체험 1회가 소진된 학생이 홈에 진입한다. 잔여 횟수 안내와 함께 "다음 체험 예약하기" CTA가 노출된다. 약관에 따라 횟수는 복구되지 않음이 안내된다.
>

---

### 2. 현재 현실 (As-is)

#### Experience 관점 — 지금 사용자가 보는 것

현재 홈 화면은 4가지 상태(수강권 없음, 예약된 수업 있음, 체험 예약 권장, 정규 예약 권장)로만 분기됩니다. 체험 결제를 완료했지만 아직 수업을 예약하지 않은 "대기" 상태나, 체험을 완료한 직후의 "결제 전환" 상태는 별도 화면이 없습니다. 체험 완료 학생은 HomeRedirection에 의해 홈 화면을 보지 못하고 /subscribes/tickets로 강제 이동됩니다. 예외 상태(노쇼, 취소)에 대한 홈 화면 안내도 없습니다.

#### Policy 관점 — 지금 적용되는 규칙

이용약관 제13조에서 수업 예약은 최소 2시간 이후만 가능하고, 레슨 전 최소 조건(스마트토크: AI 6회) 수행이 필요합니다. 제14조에서 학생 노쇼 시 회차 미복구, 튜터 노쇼 시 보상 1회 추가가 규정됩니다. 노쇼 판정은 약관상 10분이지만 실제 백엔드는 5분으로 동작합니다. 체험권은 유효기간 7일(일반)/1일(스마트토크)이며 일시정지 불가합니다. "무료체험 3회", "유료 체험 5,000원/3회" 정책은 온톨로지·약관·백엔드 어디에도 근거가 없어 PO 확인이 필요합니다.

#### Code 관점 — 지금 시스템이 할 수 있는 것

백엔드에 "체험 상태" 전용 필드는 없습니다. Student 엔티티의 trialPaymentYn(체험 결제 여부)과 trialClassCompYn(체험 완료 여부) 두 플래그와, Lecture의 InvoiceStatus(8개 값) 및 classState 조합으로 체험 상태를 추론해야 합니다. 프론트엔드의 greetingStatusSchema는 4개 상태만 지원하며 ts-pattern exhaustive로 강제됩니다. 정기권 구매 시 closeTrialClass()가 체험 수업/수강권을 일괄 취소합니다.

<details>
<summary>기술 상세 (Builder 참고용)</summary>

**Lecture InvoiceStatus 상태 기계**: CREATED(미예약) → book() → RESERVED(예약) → 완료/노쇼/취소 분기. CANCEL_NOSHOW_T는 비종료 상태(재매칭 가능).

**체험 완료 판정 로직** (UserGateway.java): city=PODO_TRIAL이고 (DONE 또는 PREFINISH/FINISH 또는 튜터노쇼(CANCEL+noShowDateTime+tutorPricePerClass>0))이면 trialClassCompYn=Y.

**PodoUserDto 핵심 필드**: trialPaymentYn, trialClassCompYn, paymentYn, remainTicketCount, regClassCount, isUnlimitedTicket.

**체험권 생성**: originCount=1, nPurchased=1, eventType=PODO_TRIAL, classMinute=25. Subscribe.freeTrial 필드 존재하나 실사용 미확인.

**프론트엔드 패턴**: useSuspenseQuery + useQuery 조합, ts-pattern match.with().exhaustive(), overlay-kit 다이얼로그, zod 스키마 검증, feature flag(enable_react_home).

**홈 변형 매핑 (PO 결정 반영)**:
- 미신청 → trial 변형
- 체험대기/예약완료 → booking_waiting 변형
- 레슨입장 → booking_imminent 변형
- 체험완료/전체소진 → no_plan 변형 재활용 (결제 유도 콘텐츠로 교체)
- 튜터노쇼/학생노쇼/취소 → no_booking 변형 재활용 (재신청 유도 콘텐츠로 교체)
</details>

---

### 2.5 미검증 가정 (주의)

아래 항목은 정책 문서에서 확인되지 않은 가정입니다. Approve 전에 확인을 권장합니다.

| CST-ID | 가정 출처 | 요약 | 확인 필요 사항 |
|--------|----------|------|--------------|
| CST-001 | 코드에서 파악, 문서 미확인 | HomeRedirection이 체험완료 학생을 강제 리다이렉트하여 홈 화면을 보여주지 않음 | 코드에서 직접 확인. 정책 문서에는 이 리다이렉트 규칙 미기재. |
| CST-002 | 코드에서 파악, 문서 미확인 | greetingStatusSchema가 4개 상태만 지원 — 체험 세분화 상태 미존재 | 코드에서 직접 확인. |
| CST-003 | 코드에서 파악, 문서 미확인 | 체험 상태 세분화에 필요한 통합 API 부재 — PodoUserDto는 대기/예약/레슨중/노쇼 구분 불가 | 백엔드 코드에서 직접 확인. |
| CST-004 | 미확인 | "무료체험 3회" 및 "5,000원/3회 유료 체험" 정책이 온톨로지와 백엔드에 미존재 | 온톨로지, 백엔드 코드, 이용약관 어디에도 근거 없음. |
| CST-008 | 코드에서 파악, 문서 미확인 | 정기권 구매 시 체험 수업/수강권 자동 소멸 — 홈 화면 실시간 전환 필요 | 백엔드 코드에서 확인. |

---

### 3. 충돌 지점 (Tension)

요청한 것(to-be)과 현재 현실(as-is) 사이에 5건의 충돌이 발견되었습니다.

| CST-ID | 관점 | 요약 |
|--------|------|------|
| CST-001 | Code | HomeRedirection이 체험완료 학생을 강제 리다이렉트하여 홈 화면을 보여주지 않음 |
| CST-004 | Policy | "무료체험 3회" 및 "5,000원/3회 유료 체험" 정책이 온톨로지와 백엔드에 미존재 |
| CST-003 | Code | 체험 상태 세분화에 필요한 통합 API 부재 — PodoUserDto는 대기/예약/레슨중/노쇼 구분 불가 |
| CST-007 | Policy | 튜터 노쇼(CANCEL_NOSHOW_T)는 비종료 상태 — 취소 안내 불가, 재매칭 대기 반영 필요 |
| CST-009 | Experience | 홈 화면 GNB(62px 고정)와 플로팅 CTA 버튼 겹침 방지 전략 필요 |

---

#### CST-001 | Code | HomeRedirection이 체험완료 학생을 강제 리다이렉트하여 홈 화면을 보여주지 않음

**이것이 무엇인가:**
현재 HomeRedirection 컴포넌트는 체험 완료(trialClassCompYn=Y) + 미결제(paymentYn=N) 학생을 홈 화면에서 /subscribes/tickets로 강제 이동시킵니다.

**왜 충돌하는가:**
brief는 "체험 완료 직후 홈 화면에서 첫 수강 혜택과 결제 CTA를 전면에 노출"하겠다고 했습니다. 그러나 현재 코드는 이 학생들이 홈 화면 자체를 볼 수 없게 합니다.

**처리하지 않으면:**
체험 완료 학생이 홈 화면의 결제 CTA를 볼 수 없어 결제 전환 유도 목표 달성 불가. 현재처럼 /subscribes/tickets로 강제 이동되어 홈 화면 재설계 효과가 체험 완료 단계에서 발휘되지 않음.

**변경 규모:** 프론트엔드 HomeRedirection 리다이렉트 조건 변경 + 새 상태 분기 추가. 백엔드 변경 없음.

<details>
<summary>기술 상세 (Builder 참고용)</summary>

HomeRedirection에서 trialClassCompYn=Y && paymentYn=N 조건의 router.replace를 제거하거나, 새 "체험 완료" 상태 분기로 대체. podo_auto_redirected localStorage 키 로직도 검토 필요.
</details>

---

#### CST-004 | Policy | "무료체험 3회" 및 "5,000원/3회 유료 체험" 정책이 온톨로지와 백엔드에 미존재

**이것이 무엇인가:**
brief에서 전제하는 "무료체험 3회 소진 → 유료 체험(5,000원/3회)" 정책이 온톨로지, 이용약관, 백엔드 코드 어디에도 정의되어 있지 않습니다.

**왜 충돌하는가:**
현재 백엔드 체험권은 1회 고정(nPurchased=1 하드코딩). PO가 이 정책의 존재 여부를 확인하기로 했습니다. 확인 결과에 따라 설계 범위가 달라집니다.

**처리하지 않으면:**
brief가 전제하는 정책의 근거가 없어 백엔드 변경 범위 예측 불가. 체험권 1회 하드코딩과 충돌.

**변경 규모:** 정책 확인 필요. 확인 전까지는 현재 백엔드 기준(1회 체험)으로 설계하되, 3회 체험 구조로 확장 가능한 설계를 고려합니다.

**추천:** PO가 정책을 확인할 때까지 1회 체험 기준으로 설계를 진행하고, 확인 결과를 Draft 단계에서 반영합니다.

<details>
<summary>기술 상세 (Builder 참고용)</summary>

Subscribe.freeTrial 필드가 존재하므로 상품 레벨에서 체험 횟수를 설정할 여지는 있음. 다만 TicketServiceV2Impl.addTrialTicket()의 nPurchased=1 하드코딩은 백엔드 변경이 필요.
</details>

---

#### CST-003 | Code | 체험 상태 세분화에 필요한 통합 API 부재 — PodoUserDto는 대기/예약/레슨중/노쇼 구분 불가

**이것이 무엇인가:**
PodoUserDto(getInfo API)는 체험 상태를 trialPaymentYn/trialClassCompYn 두 플래그로만 제공합니다. 대기/예약/레슨중/노쇼 구분에 체험수업 목록 API 추가 호출 필요.

**왜 충돌하는가:**
홈 화면 진입 시 API 호출이 3개로 증가하면 로딩 시간이 늘어나고 Server Component prefetch 변경이 필요합니다.

**처리하지 않으면:**
단일 API로는 체험 상태 세분화 불가. 최소 2개 API 조합 필요하여 로딩 시간 증가.

**변경 규모:** 프론트엔드 page.tsx prefetch + use-greeting-status.ts 분기 로직 확장. 백엔드 변경 없음.

<details>
<summary>기술 상세 (Builder 참고용)</summary>

page.tsx에서 queryClient.prefetchQuery()에 getPodoTrialLectureList 추가. use-greeting-status.ts에서 InvoiceStatus + classState 조합으로 세분화.
</details>

---

#### CST-007 | Policy | 튜터 노쇼(CANCEL_NOSHOW_T)는 비종료 상태 — 취소 안내 불가, 재매칭 대기 반영 필요

**이것이 무엇인가:**
튜터 노쇼(CANCEL_NOSHOW_T)는 온톨로지 상태 기계에서 비종료 상태입니다. 재매칭(cancelAndReassign)이 가능하며, 체험 만료 시에만 CANCEL로 최종 전이됩니다.

**왜 충돌하는가:**
brief는 "튜터 노쇼 시 체험 1회 복구 → 재신청"이라고 했지만, 백엔드의 trialClassCompYn 판정이 튜터 노쇼를 "체험 완료"로 처리할 수 있어(tutorPricePerClass > 0 조건) 홈 화면 분기가 의도와 다르게 동작할 수 있습니다. PO는 이 충돌을 인지하고 Draft 단계에서 해결방법을 찾기로 했습니다.

**처리하지 않으면:**
튜터 노쇼를 취소로 표시하면 학생이 체험 기회 상실로 오해. CS 문의 증가.

**변경 규모:** 프론트엔드 상태 분기에서 CANCEL_NOSHOW_T 별도 처리. 백엔드 trialClassCompYn 판정과 정합 필요.

**추천:** Draft 단계에서 InvoiceStatus를 직접 참조하여 trialClassCompYn과 독립적으로 튜터 노쇼를 판별하는 방안을 검토합니다.

<details>
<summary>기술 상세 (Builder 참고용)</summary>

UserGateway.java 체험 완료 판정: city=PODO_TRIAL && (DONE || PREFINISH/FINISH || (CANCEL + noShowDateTime!=null + tutorPricePerClass>0)). 세 번째 조건이 튜터 노쇼를 "완료"로 처리. 프론트엔드에서 getPodoTrialLectureList의 InvoiceStatus=CANCEL_NOSHOW_T를 직접 확인하면 이 문제를 우회할 수 있음.
</details>

---

#### CST-009 | Experience | 홈 화면 GNB(62px 고정)와 플로팅 CTA 버튼 겹침 방지 전략 필요

**이것이 무엇인가:**
홈 화면은 GNB(62px, fixed bottom-0, z-100)가 고정됩니다. brief의 "하단 플로팅 버튼"은 GNB와 겹칩니다.

**왜 충돌하는가:**
디자인 온톨로지도 "GNB가 있으면 StickyBottom 대신 카드 내 CTA 배치"를 권장합니다. PO는 이 충돌을 인지하고 Draft 단계에서 해결방법을 찾기로 했습니다.

**처리하지 않으면:**
StickyBottom과 GNB 모두 fixed bottom-0이므로 겹침 발생. CTA 접근 불가.

**변경 규모:** CTA 배치 전략 결정 — 카드 내 배치 vs GNB 위 고정 영역.

**추천:** 디자인 온톨로지 권장 사항에 따라 카드 내 CTA 배치를 기본으로 하되, 체험 완료 등 결제 전환이 핵심인 상태에서는 Greeting 카드 내 ButtonPrimary로 CTA를 배치하는 방안을 Draft에서 구체화합니다.

---

### 4. 지금 결정할 것

1. 범위(포함/제외)에 동의하십니까? (PO 확인: 동의함)
2. CST-004: 1회 체험 기준으로 먼저 설계하고, 3회/유료 체험 정책은 PO가 별도 확인 후 반영하는 방향에 동의하십니까?
3. CST-005: 기존 디자인 온톨로지 home_variants에 매핑하는 방향으로 확정합니까? (PO 확인: 매핑으로 진행)
4. CST-007, CST-009: Draft 단계에서 해결방법을 찾는 방향으로 진행합니까? (PO 확인: 염두에 두고 진행)
5. 이 5건의 충돌을 인지한 상태에서 이 방향으로 진행하겠습니까?

다음 중 번호로 선택해 주세요:

1. **Approve** — 이 방향과 범위에 동의합니다. Surface(화면 설계) 단계로 진행합니다.
2. **Revise** — Align Packet을 수정하고 싶습니다. 피드백을 주시면 수정 후 다시 보여드립니다. 소스는 다시 읽지 않습니다.
3. **Reject** — 이 scope를 거절하고 종료합니다.
4. **Redirect** — 소스를 다시 읽은 뒤 처음부터 재분석합니다. 소스 정보가 오래되었거나 부족한 경우에 선택하세요.

<details><summary>추가 선택지</summary>

5. **Review** — 6-Agent Panel Review를 요청합니다. 전문가 6인이 검토 후 보강된 Packet을 다시 제시합니다.

</details>

번호(1~4) 또는 자연어로 말씀해 주세요.
