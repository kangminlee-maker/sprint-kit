## Align Packet: 홈 화면 상태 기반 재설계

### 1. 당신이 요청한 것 (To-be)

**원문:** "홈 화면을 학생의 체험 상태에 따라 동적으로 전환되는 구조로 재설계하여, 각 단계에서 다음 행동(신청 → AI학습 체험 → 레슨 입장 → 결제)을 명확히 유도하고, 예외 상황(튜터 노쇼·학생 노쇼·취소·전체 소진) 발생 시에도 재신청 또는 유료 체험을 통해 결제 유도 화면에 반드시 도달하게 만든다."

**시스템이 해석한 방향:**
홈 화면을 현재 4상태 정적 분기에서, 체험 여정 전체(미신청→대기→레슨 중→완료→예외)를 커버하는 상태 기반 동적 전환 구조로 확장하고, 모든 상태에서 결제 전환 접점을 확보한다.

**제안된 범위:**

| 포함 | 동의하시나요? |
|------|-------------|
| 홈 Greeting 영역을 체험 상태 기반으로 확장 (4상태 → 8상태 이상) | |
| 체험 완료 미결제 사용자의 홈 자동 리다이렉트 정책 변경 — 홈에서 결제 전환 화면 표시 | |
| 예외 상태(학생 노쇼·튜터 노쇼·취소) 전용 홈 화면 추가 | |
| 홈 하단에 상태별 Floating CTA 버튼 도입 (StickyBottom 패턴) | |
| 체험 프로그레스바(stepper)를 Greeting 영역에 통합 | |
| 무료체험 소진 후 유료 체험 안내 화면 | |

| 제외 | 동의하시나요? |
|------|-------------|
| GNB 5탭 구조 변경 (현행 유지) | |
| 백엔드 API 신규 개발 (기존 API 조합으로 구현) | |
| 정규 수강생(결제 완료) 홈 화면 변경 | |
| 레슨 탭·예약 탭·AI학습 탭 변경 | |
| 결제 플로우(PG 연동) 자체의 변경 | |

**시나리오:**

> 시나리오 1 (미신청): 학생이 앱에 처음 진입한다. 홈에 "무료 체험레슨을 시작해 보세요" 문구와 체험 프로그레스바(1단계 활성)가 표시된다. 하단 플로팅 버튼 "체험레슨 예약하기"를 누르면 예약 플로우로 진입한다.
>
> 시나리오 2 (예약 완료·대기): 학생이 체험 레슨을 예약했다. 홈에 예약 일시, 남은 시간 카운트다운, 예습 진행률이 표시된다. 플로팅 버튼이 "AI 학습 시작하기"로 전환되어 예습을 유도한다.
>
> 시나리오 3 (레슨 입장 가능): 레슨 시작 10분 전이다. 플로팅 버튼이 "레슨방 입장하기"로 전환되고, 카운트다운이 실시간으로 표시된다.
>
> 시나리오 4 (체험 완료·미결제): 학생이 체험 레슨을 완료했다. 홈에 "체험을 완료했어요!" 문구와 함께 첫 수강 혜택 카드, 결제 CTA가 전면에 노출된다. 더 이상 결제 페이지로 자동 리다이렉트하지 않는다.
>
> 시나리오 5 (튜터 노쇼): 튜터가 수업에 참여하지 않았다. 홈에 "튜터 사정으로 수업이 취소되었어요" 안내와 함께 "다시 예약하기" 버튼이 표시된다. 체험 1회가 자동 복구되었음을 안내한다.
>
> 시나리오 6 (학생 노쇼): 학생이 수업에 10분 이상 미입장했다. 홈에 "수업에 참여하지 못했어요" 안내, 72시간 예약 제한 안내, 잔여 체험 횟수가 표시된다. 제한 해제 후 "다시 예약하기" 버튼이 활성화된다.
>
> 시나리오 7 (3회 전체 소진): 무료체험 3회를 모두 사용했다. 홈에 "무료 체험을 모두 사용했어요" 문구와 유료 체험(5,000원/3회) 안내, 정규 수강권 결제 CTA가 표시된다.
>

---

### 2. 현재 현실 (As-is)

#### Experience 관점 — 지금 사용자가 보는 것

현재 홈 화면은 4가지 상태(NO_TICKET, RECOMMEND_BOOKING_TRIAL_CLASS, RECOMMEND_BOOKING_REGULAR_CLASS, SCHEDULED_CLASS)에 따라 Greeting 영역만 전환됩니다. 상단 배너 캐러셀 → Greeting 카드(다크 bg, 캐릭터 + CTA) → TrialTutorial(체험 5단계 가이드) → ClassPrepare(학습가이드/발음학습북) 순서로 고정 배치됩니다. GNB 상단에는 잔여 수강권 + 수강권 구매 버튼이 있고, 하단에는 홈/레슨/예약/AI학습/마이포도 5탭 BottomNavigation이 있습니다.

예외 상태(노쇼, 취소)는 홈에서 전혀 표시되지 않고 레슨 목록(subscribes) 페이지의 lesson-card 위젯에서만 처리됩니다. 체험 완료 후 미결제 사용자는 자동으로 /subscribes/tickets로 리다이렉트되어 홈 화면 자체를 볼 수 없습니다. 홈에 Floating CTA 버튼이 없습니다.

#### Policy 관점 — 지금 적용되는 규칙

체험 수업은 유료(TRIAL)와 무료(TRIAL_FREE)로 구분됩니다. 체험권 1장에 수업 1회가 포함되며, 유효기간은 일반 7일, SMART_TALK 1일입니다.

노쇼 정책은 비대칭입니다: 학생 노쇼(NOSHOW_S)는 종료 상태이며 72시간 예약 금지 패널티가 부과됩니다. 튜터 노쇼(CANCEL_NOSHOW_T)는 비종료 상태이며, 체험 완료로 판정되거나 대체 튜터 자동 매칭이 시도됩니다.

취소 정책은 3단계입니다: 2시간 이상 전(무료 취소+새 수업 생성), 1~2시간 전(수강권 차감), 1시간 이내(유료 취소+수강권 차감). 단, 체험 수업 취소는 항상 무료입니다.

수강권 유형별 예약 제한이 다릅니다: 회차권(매일 1회), 무제한권(동시 1회), 스마트토크(AI챗 6회 완료 후 레슨 1회 오픈).

체험→정규 전환 실패율이 36.1%(1,276명 중 461명)이며, 실패 시나리오가 온톨로지에 정의되어 있지 않습니다.

#### Code 관점 — 지금 시스템이 할 수 있는 것

백엔드는 체험 수업 흐름을 5개의 STEP(STEP1~5 + NONE)으로 관리합니다. 홈 화면 상태 판정은 프론트엔드의 useGreetingStatus() 훅에서 4개 boolean(hasActiveTicket/hasNextLecture/hasTrialTicket/hasRegularTicket)으로만 분기하며, 노쇼/취소/체험완료 등 세분화된 상태를 표현할 수 없습니다.

홈 page.tsx의 SSR prefetch에는 getCurrentUser + getSubscribeMappList만 포함되어 있어, invoiceStatus/trialStepInfo 등 새 상태 판정에 필요한 데이터가 미조회됩니다.

greetingStatusSchema는 Zod enum + ts-pattern exhaustive match로 보호되어, 새 상태 추가 시 enum 확장 → 컴포넌트 구현 → match 분기 추가 순서를 따라야 합니다.

<details>
<summary>기술 상세 (Builder 참고용)</summary>

**프론트엔드 핵심 파일:**
- `widgets/greeting/model/status.ts` — greetingStatusSchema (Zod enum 4개)
- `widgets/greeting/hooks/use-greeting-status.ts` — 4개 boolean 기반 ts-pattern match
- `features/home-redirection/ui/home-redirection.tsx` — 체험완료 미결제 자동 리다이렉트
- `app/(internal)/home/page.tsx` — SSR prefetch (getCurrentUser + getSubscribeMappList만)
- `views/home/view.tsx` — HomePageView (배너+Greeting+TrialTutorial+ClassPrepare)

**백엔드 핵심:**
- `UserRepository.getTrialStepInfo()` — SQL 네이티브 쿼리로 STEP 판정
- `Lecture.InvoiceStatus` enum — CREATED/RESERVED/COMPLETED/NOSHOW_S/NOSHOW_BOTH/CANCEL_NOSHOW_T/CANCEL/CANCEL_PAID
- `TrialPaymentProcessor` — 체험 결제 전용 처리 (유효기간: 일반 7일, SMART_TALK 1일)
- 체험 완료 판정 3조건: CREDIT=DONE || CLASS_STATE IN (PREFINISH,FINISH) || (CREDIT=CANCEL AND NOSHOW_DATETIME NOT NULL AND TUTOR_PRICE>0)

**디자인 시스템:**
- `packages/design-system-temp` — Stepper, Progress, Badge, Chip, BottomSheet, ConfirmDialog 등 재사용 가능
- CountdownTimer, PreStudyProgress 독립 컴포넌트 이미 존재
- PodoCharacter: 4가지 상태(sleeping/smile/studying/done) 지원
</details>

---

### 3. 충돌 지점 (Tension)

요청한 것(to-be)과 현재 현실(as-is) 사이에 10건의 충돌이 발견되었습니다.

| CST-ID | 관점 | 요약 |
|--------|------|------|
| CST-001 | Experience | 현재 홈 Greeting은 4상태(NO_TICKET/RECOMMEND_BOOKING_TRIAL/RECOMMEND_BOOKING_REGULAR/SCHEDULED_CLASS)만 분기하며, 체험 완료·노쇼·취소 상태가 누락되어 있다 |
| CST-002 | Experience | 체험 완료 미결제 사용자는 홈 진입 시 /subscribes/tickets로 자동 리다이렉트되어 홈 화면 자체를 볼 수 없다 |
| CST-003 | Experience | 예외 상태(학생 노쇼·튜터 노쇼·취소)는 홈이 아닌 레슨 탭의 lesson-card 위젯에서만 표시되어, 홈에서는 완전히 보이지 않는다 |
| CST-004 | Policy | 체험→정규 전환 실패율이 36.1%(1,276명 중 461명)이며, 실패 시나리오(결제 실패·PG 이탈·예약 단계 이탈)가 온톨로지에 정의되어 있지 않다 |
| CST-005 | Policy | 학생 노쇼(NOSHOW_S)는 종료 상태+72시간 예약 금지 패널티, 튜터 노쇼(CANCEL_NOSHOW_T)는 비종료 상태+체험 완료로 판정+대체 튜터 자동 매칭 — 두 상황의 홈 화면 안내가 완전히 달라야 한다 |
| CST-006 | Policy | 취소 정책은 수업 시작까지 남은 시간에 따라 3단계(2시간+:무료/1~2시간:수강권 차감/1시간 이내:유료 취소)로 나뉘지만, 체험 수업 취소는 항상 무료이다 |
| CST-007 | Policy | 체험권은 유료(TRIAL, 금액은 Subscribe 상품 레코드 기준)와 무료(TRIAL_FREE)로 구분되며, 체험 미이용 사용자만 결제 가능하다. 온톨로지에는 유료 체험 3회 상품 정보가 없다 |
| CST-010 | Experience | 홈 화면에 Floating CTA 버튼이 없다 — 결제 전환용 플로팅 배너는 subscribes-tickets 뷰에만 존재한다 |
| CST-011 | Policy | 수강권 유형별 예약 제한이 다르다 — 회차권: 매일 1회, 무제한권: 동시 1회(수업 종료 후 다음 예약), 스마트토크: AI챗 6회 완료 후 레슨 1회 오픈 |
| CST-009 | Code | 홈 page.tsx의 SSR prefetch에 subscribeMappList만 포함 — invoiceStatus·trialStepInfo 등 새 상태 판정에 필요한 데이터 미조회로, 추가 prefetch 또는 API 통합 필요 |

---

#### CST-001 | Experience | 현재 홈 Greeting은 4상태(NO_TICKET/RECOMMEND_BOOKING_TRIAL/RECOMMEND_BOOKING_REGULAR/SCHEDULED_CLASS)만 분기하며, 체험 완료·노쇼·취소 상태가 누락되어 있다

**이것이 무엇인가:**
현재 홈 화면은 4개 상태만 분기합니다. 이번 재설계는 최소 8개 상태(미신청/예약대기/예습중/레슨입장/체험완료/학생노쇼/튜터노쇼/전체소진)를 요구합니다.

**왜 충돌하는가:**
기존 greetingStatusSchema(Zod enum)에 4개 상태만 정의되어 있고, useGreetingStatus() 훅이 4개 boolean으로만 분기하므로, 새 상태를 추가하려면 상태 판정 구조 자체를 재설계해야 합니다.

**처리하지 않으면:**
체험 완료 후 미결제 사용자는 홈을 볼 수 없이 결제 페이지로 강제 이동되어 이탈률 증가. 노쇼/취소 사용자는 홈에서 어떤 안내도 받지 못하고 다음 행동을 알 수 없음

**변경 규모:** 프론트엔드 상태 판정 로직 전면 확장 (greetingStatusSchema + useGreetingStatus + 상태별 컴포넌트 8개+)

<details>
<summary>기술 상세 (Builder 참고용)</summary>

greetingStatusSchema는 ts-pattern .exhaustive()로 보호되므로, enum에 새 값을 추가하면 해당 값을 처리하는 match 분기가 없을 때 컴파일 에러가 발생합니다. 이는 안전장치이지만, 8개 상태 각각에 대해 컴포넌트를 만들어야 한다는 의미입니다.

useGreetingStatus()의 4개 boolean(hasActiveTicket/hasNextLecture/hasTrialTicket/hasRegularTicket)만으로는 노쇼/취소/체험완료를 구분할 수 없으므로, invoiceStatus와 trialClassCompYn 등 추가 데이터를 훅에 주입해야 합니다.
</details>

---

#### CST-002 | Experience | 체험 완료 미결제 사용자는 홈 진입 시 /subscribes/tickets로 자동 리다이렉트되어 홈 화면 자체를 볼 수 없다

**이것이 무엇인가:**
현재 체험 완료 후 미결제 사용자(trialClassCompYn=Y, paymentYn=N)는 홈 진입 시 /subscribes/tickets로 자동 리다이렉트됩니다.

**왜 충돌하는가:**
이번 재설계의 핵심 목표 중 하나가 "체험 완료 직후 홈에서 결제 전환 접점을 확보"하는 것인데, 현재는 해당 사용자가 홈 화면 자체를 볼 수 없습니다. 리다이렉트 정책을 변경해야 합니다.

**처리하지 않으면:**
홈 화면에 결제 전환 접점을 배치해도 해당 사용자에게 노출되지 않음. 리다이렉트 정책 변경이 선행되지 않으면 홈 재설계의 핵심 목표(결제 전환 유도)를 달성할 수 없음

**변경 규모:** HomeRedirection 컴포넌트의 조건문 1곳 수정

**선택지:**

| 선택 | 이점 | 리스크 | 내용 |
|------|------|--------|------|
| A. 리다이렉트 완전 제거 | 홈에서 결제 전환 화면을 자유롭게 설계 가능 | 기존에 리다이렉트로 도달하던 결제 페이지 접근 경로가 사라짐 |  |
| B. 리다이렉트를 홈 내 결제 전환 상태로 대체 | 홈에서 맥락에 맞는 결제 유도 가능 + 결제 페이지 접근 경로 유지(GNB 버튼) | 리다이렉트 제거 후 결제 전환율이 일시적으로 하락할 수 있음 |  |

**추천:** B 추천. 홈에서 결제 전환 화면을 보여주되, GNB 상단의 "수강권 구매" 버튼으로 결제 페이지 직접 접근 경로를 유지합니다.

---

#### CST-003 | Experience | 예외 상태(학생 노쇼·튜터 노쇼·취소)는 홈이 아닌 레슨 탭의 lesson-card 위젯에서만 표시되어, 홈에서는 완전히 보이지 않는다

**이것이 무엇인가:**
학생 노쇼/튜터 노쇼/취소 등 예외 상태가 홈에서 전혀 표시되지 않습니다. 이 정보는 레슨 탭의 lesson-card 위젯에서만 처리됩니다.

**왜 충돌하는가:**
이번 재설계는 "예외 상황에서도 이탈 없이 복귀 경로가 존재"하는 것을 기대 결과로 명시했습니다. 현재는 예외 상태 사용자가 홈에 진입하면 마지막 정상 상태의 화면이 표시되어, 무엇이 일어났는지 인지할 수 없습니다.

**처리하지 않으면:**
노쇼나 취소 발생 시 홈에 아무 안내가 없어 사용자가 상황을 인지하지 못하고, 재신청/재예약으로의 복귀 경로가 끊김

**변경 규모:** 예외 상태별 홈 화면 컴포넌트 신규 개발 (최소 3개: 학생노쇼/튜터노쇼/취소)

<details>
<summary>기술 상세 (Builder 참고용)</summary>

invoiceStatus(NOSHOW_S, CANCEL_NOSHOW_T 등)를 조회하는 API와 스키마가 이미 존재하지만, 홈 page.tsx의 SSR prefetch에서 호출되지 않습니다. 홈에서 예외 상태를 표시하려면 getNextLessonsInfo 또는 별도 API로 최근 레슨의 invoiceStatus를 prefetch에 추가해야 합니다.
</details>

---

#### CST-004 | Policy | 체험→정규 전환 실패율이 36.1%(1,276명 중 461명)이며, 실패 시나리오(결제 실패·PG 이탈·예약 단계 이탈)가 온톨로지에 정의되어 있지 않다

**이것이 무엇인가:**
체험→정규 전환 실패율이 36.1%입니다. 실패 원인(결제 실패, PG 이탈, 예약 단계 이탈)에 대한 복귀 시나리오가 온톨로지에 정의되어 있지 않습니다.

**왜 충돌하는가:**
홈 화면 재설계의 궁극적 목표가 결제 전환율 향상인데, 현재 최대 누수 지점인 36.1% 이탈에 대한 대응이 설계되지 않았습니다. 홈 화면에서 이 사용자들의 재진입 경로를 어떻게 제공할지 결정이 필요합니다.

**처리하지 않으면:**
전환 퍼널 최대 누수 지점. 홈 화면에서 전환 실패 사용자의 재진입 경로를 설계하지 않으면 36%의 잠재 전환 기회를 계속 놓침

**변경 규모:** 전환 실패 사용자 감지 + 재진입 CTA 설계 (정책 결정 + UI 추가)

**선택지:**

| 선택 | 이점 | 리스크 | 내용 |
|------|------|--------|------|
| A. 홈에서 전환 실패 감지 후 재시도 CTA 표시 | 재진입 경로 확보, 전환율 개선 기대 | 전환 실패 원인을 프론트엔드에서 정확히 판별하기 어려울 수 있음 |  |
| B. 체험 완료 상태에 결제 CTA를 항상 노출하여 간접 대응 | 구현 단순, 별도 실패 감지 불필요 | 실패 원인별 맞춤 안내 불가 |  |

**추천:** B 추천 (이번 scope). 체험 완료 상태에서 결제 CTA를 상시 노출하여 간접 대응하고, 전환 실패별 세분화 대응은 데이터 수집 후 후속 scope에서 진행합니다.

---

#### CST-005 | Policy | 학생 노쇼(NOSHOW_S)는 종료 상태+72시간 예약 금지 패널티, 튜터 노쇼(CANCEL_NOSHOW_T)는 비종료 상태+체험 완료로 판정+대체 튜터 자동 매칭 — 두 상황의 홈 화면 안내가 완전히 달라야 한다

**이것이 무엇인가:**
학생 노쇼(NOSHOW_S)와 튜터 노쇼(CANCEL_NOSHOW_T)는 결과가 완전히 다릅니다. 학생 노쇼는 종료 상태+72시간 예약 금지, 튜터 노쇼는 비종료 상태+체험 완료 판정+대체 튜터 매칭 시도입니다.

**왜 충돌하는가:**
홈 화면에서 두 상황을 동일한 "노쇼" 화면으로 처리하면, 학생 노쇼 후 72시간 내 예약 CTA를 표시하거나(예약 실패), 튜터 노쇼 후 학생에게 불이익이 있는 것으로 오인시킬 수 있습니다.

**처리하지 않으면:**
학생 노쇼 후 72시간 내 예약 CTA를 표시하면 예약 실패 반복. 튜터 노쇼 후 안내 없이 수업이 사라지면 사용자가 이탈

**변경 규모:** 노쇼 상태를 2개 독립 화면으로 분리 (학생 노쇼 화면 + 튜터 노쇼 화면)

<details>
<summary>기술 상세 (Builder 참고용)</summary>

학생 노쇼: Penalty 레코드 생성(SCH-8), holdType=PENALTY, 72시간 예약 금지. 수강권 회차 미복구.
튜터 노쇼: cancelAndReassign()으로 대체 튜터 자동 매칭 시도. 매칭 실패 시 TUTOR_NOT_FOUND. 체험 완료로 판정됨(CREDIT=CANCEL AND NOSHOW_DATETIME NOT NULL AND TUTOR_PRICE>0).
약관(제14조): 학생 불참 시 회차권 미복구+무제한권 3일 예약 금지, 강사 불참 시 회차권 보상수업 1회 추가+무제한권 보상기간 2일 추가.
</details>

---

#### CST-006 | Policy | 취소 정책은 수업 시작까지 남은 시간에 따라 3단계(2시간+:무료/1~2시간:수강권 차감/1시간 이내:유료 취소)로 나뉘지만, 체험 수업 취소는 항상 무료이다

**이것이 무엇인가:**
취소 정책이 수업 시작까지 남은 시간에 따라 3단계(2시간+/1~2시간/1시간 이내)로 나뉘며, 체험 수업은 항상 무료 취소입니다.

**왜 충돌하는가:**
홈 화면에서 예약 상태의 "취소" 버튼 옆에 경고 문구를 표시할 때, 체험 사용자와 정규 사용자에게 다른 문구를 보여야 합니다. 체험 사용자에게 위약금 경고를 표시하면 불필요한 이탈이 발생합니다.

**처리하지 않으면:**
체험 사용자에게 정규 수업의 위약금 경고를 표시하면 불필요한 이탈 발생. 반대로 정규 사용자에게 무료 취소로 오인시키면 예상치 못한 수강권 차감

**변경 규모:** 취소 CTA의 경고 문구를 수강권 유형(체험/정규)에 따라 분기

<details>
<summary>기술 상세 (Builder 참고용)</summary>

2시간 이상 전: 무료 취소 + 새 GT_CLASS 자동 생성 (CANCEL)
1~2시간 전: 수강권 +1 차감, 무제한권은 72시간 예약 금지 (CANCEL)
1시간 이내: 유료 취소 + 수강권 +1 차감, 튜터에게 정산 (CANCEL_PAID)
체험 수업: 항상 무료 취소 (3개월 기준 303건)
</details>

---

#### CST-007 | Policy | 체험권은 유료(TRIAL, 금액은 Subscribe 상품 레코드 기준)와 무료(TRIAL_FREE)로 구분되며, 체험 미이용 사용자만 결제 가능하다. 온톨로지에는 유료 체험 3회 상품 정보가 없다

**이것이 무엇인가:**
체험권은 유료(TRIAL)와 무료(TRIAL_FREE)로 구분됩니다. 무료 체험 소진 후 유료 체험(5,000원/3회)으로 안내하려면, 유료 체험 상품 정보가 필요한데 현재 온톨로지에 이 정보가 없습니다.

**왜 충돌하는가:**
시나리오 7(전체 소진)에서 유료 체험 안내 화면을 설계하려면 정확한 가격/횟수 정보가 필요합니다. Subscribe 상품 레코드에서 가격이 결정되지만, brief에 명시된 "5,000원/3회"가 현재 상품 설정과 일치하는지 확인이 필요합니다.

**처리하지 않으면:**
무료 체험 3회 소진 후 유료 체험 안내 화면을 설계하려면, 유료 체험 상품(가격·횟수)의 정의가 필요한데 현재 온톨로지에 이 정보가 부재. 잘못된 가격/횟수를 표시할 위험

**변경 규모:** 유료 체험 상품 정보 확인 + 홈 화면 유료 체험 안내 카드 설계

**선택지:**

| 선택 | 이점 | 리스크 | 내용 |
|------|------|--------|------|
| A. 유료 체험 가격/횟수를 API에서 동적으로 조회 | 상품 변경 시 자동 반영 | 추가 API 호출 필요 |  |
| B. 현재 상품 설정(5,000원/3회)을 확인 후 정적으로 표시 | 구현 단순, API 호출 불필요 | 가격 변경 시 코드 수정 필요 |  |

---

#### CST-010 | Experience | 홈 화면에 Floating CTA 버튼이 없다 — 결제 전환용 플로팅 배너는 subscribes-tickets 뷰에만 존재한다

**이것이 무엇인가:**
홈 화면에 Floating CTA 버튼이 없습니다. 결제 전환용 플로팅 배너는 subscribes-tickets 뷰에만 존재합니다.

**왜 충돌하는가:**
"다음 행동까지의 거리 최소화"가 기대 결과인데, 현재 홈에는 상태별 CTA를 상시 노출하는 구조가 없습니다. StickyBottom 패턴(디자인 온톨로지 정의)을 도입해야 합니다.

**처리하지 않으면:**
홈에서 결제 전환 접점을 상시 확보하려면 StickyBottom 패턴의 플로팅 CTA 신규 도입이 필요. 미도입 시 결제 유도가 GNB 상단 버튼에만 의존

**변경 규모:** 홈 화면에 StickyBottom 컴포넌트 신규 도입 + 상태별 라벨/동작 분기

<details>
<summary>기술 상세 (Builder 참고용)</summary>

StickyBottom 스펙(design-ontology.yaml): fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto px-5 py-3 bg-white.
GNB(62px)와의 겹침 방지를 위해 bottom 위치 조정 필요.
상태별 라벨 예시: 미신청→"체험레슨 예약하기", 대기→"AI 학습 시작하기", 입장가능→"레슨방 입장하기", 완료→"수강권 구매하기"
</details>

---

#### CST-011 | Policy | 수강권 유형별 예약 제한이 다르다 — 회차권: 매일 1회, 무제한권: 동시 1회(수업 종료 후 다음 예약), 스마트토크: AI챗 6회 완료 후 레슨 1회 오픈

**이것이 무엇인가:**
수강권 유형별 예약 제한이 다릅니다: 회차권(매일 1회), 무제한권(동시 1회, 수업 종료 후 다음 예약), 스마트토크(AI챗 6회 완료 후 레슨 1회 오픈).

**왜 충돌하는가:**
홈 화면에서 예약 CTA의 활성/비활성 조건이 수강권 유형을 반영해야 합니다. 무제한권 사용자에게 이미 예약이 있는데 추가 예약을 유도하면 API 에러가 발생합니다.

**처리하지 않으면:**
홈 화면 예약 CTA의 활성/비활성 조건이 수강권 유형을 반영하지 않으면, 예약 시도 → 실패의 반복으로 사용자 불만 발생

**변경 규모:** 예약 CTA 활성 조건에 수강권 유형별 분기 추가

---

#### CST-009 | Code | 홈 page.tsx의 SSR prefetch에 subscribeMappList만 포함 — invoiceStatus·trialStepInfo 등 새 상태 판정에 필요한 데이터 미조회로, 추가 prefetch 또는 API 통합 필요

**이것이 무엇인가:**
홈 page.tsx의 SSR prefetch에 subscribeMappList만 포함되어 있어, 새 상태 판정에 필요한 데이터(invoiceStatus, trialStepInfo)가 서버에서 미리 조회되지 않습니다.

**왜 충돌하는가:**
8개 이상 상태를 판정하려면 추가 데이터가 필요한데, 클라이언트에서만 조회하면 홈 화면 로딩 시 API 호출이 순차적으로 발생하여(waterfall) 초기 렌더링이 지연됩니다.

**처리하지 않으면:**
prefetch 없이 클라이언트에서만 조회하면 홈 화면 로딩 시 waterfall 발생, 초기 렌더링 지연

**변경 규모:** prefetch에 2~3개 쿼리 추가 (getTrialStepInfo, getNextLessonsInfo 등)

<details>
<summary>기술 상세 (Builder 참고용)</summary>

현재 prefetch: getCurrentUser, getSubscribeMappList
추가 필요: getTrialStepInfo(체험 단계), getNextLectureList(예약된 수업, invoiceStatus 포함)
SSR에서 병렬로 prefetch하면 클라이언트 waterfall을 방지할 수 있습니다.
</details>

---

### 4. 지금 결정할 것

1. 위 범위(포함 6건/제외 5건)에 동의하십니까?
2. 체험 완료 미결제 사용자의 홈 자동 리다이렉트를 제거하고, 홈에서 결제 전환 화면을 표시하는 방향에 동의하십니까? (CST-002)
3. 전환 실패 36.1% 대응을 이번 scope에서는 "체험 완료 상태 결제 CTA 상시 노출"로 간접 대응하고, 세분화 대응은 후속 scope로 미루는 것에 동의하십니까? (CST-004)
4. 이 10건의 충돌을 인지한 상태에서 이 방향으로 진행하시겠습니까?

다음 중 번호로 선택해 주세요:

1. **Approve** — 이 방향과 범위에 동의합니다. Surface(화면 설계) 단계로 진행합니다.
2. **Revise** — Align Packet을 수정하고 싶습니다. 피드백을 주시면 수정 후 다시 보여드립니다. 소스는 다시 읽지 않습니다.
3. **Reject** — 이 scope를 거절하고 종료합니다.
4. **Redirect** — 소스를 다시 읽은 뒤 처음부터 재분석합니다. 소스 정보가 오래되었거나 부족한 경우에 선택하세요.

<details><summary>추가 선택지</summary>

5. **Review** — 6-Agent Panel Review를 요청합니다. 전문가 6인이 검토 후 보강된 Packet을 다시 제시합니다.

</details>

번호(1~4) 또는 자연어로 말씀해 주세요.
