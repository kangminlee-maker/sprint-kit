# Build Spec: 홈 화면 상태 기반 재설계

## 1. Scope Summary

| 항목 | 값 |
|------|-----|
| scope ID | homeui-20260310-001 |
| 제목 | 홈 화면 상태 기반 재설계 |
| 방향 | 홈 화면을 현재 4상태 정적 분기에서, 체험 여정 전체(미신청/대기/레슨 중/완료/예외)를 커버하는 상태 기반 동적 전환 구조로 확장하고, 모든 상태에서 결제 전환 접점을 확보한다. |
| scope type | experience |

**범위 — 포함:**
- 홈 Greeting 영역을 체험 상태 기반으로 확장 (4상태 → 8상태 이상)
- 체험 완료 미결제 사용자의 홈 자동 리다이렉트 정책 변경 — 홈에서 결제 전환 화면 표시
- 예외 상태(학생 노쇼/튜터 노쇼/취소) 전용 홈 화면 추가
- 홈 하단에 상태별 Floating CTA 버튼 도입 (StickyBottom 패턴)
- 체험 프로그레스바(stepper)를 Greeting 영역에 통합
- 무료체험 소진 후 유료 체험 안내 화면

**범위 — 제외:**
- GNB 5탭 구조 변경 (현행 유지)
- 백엔드 API 신규 개발 (기존 API 조합으로 구현)
- 정규 수강생(결제 완료) 홈 화면 변경
- 레슨 탭/예약 탭/AI학습 탭 변경
- 결제 플로우(PG 연동) 자체의 변경

## 2. Confirmed Surface

- **surface 경로**: `surface/preview/`
- **content hash**: `77da10f9430394889fec28f1607ae71d782c3c0559ab291df470f06c50c062e8`

**시나리오 요약:**
v2 디자인 가이드 기반 8상태 홈 화면 Surface. 흰 배경 인사말, StepTabs 3단계, VideoCard, FeatureListCard, 3D press 버튼(border-radius 5px), 4탭 BottomNav(60px). 학생노쇼=red, 튜터노쇼=blue 시각 분리. StickyBottom CTA는 결제 전환 목적 상태에만 적용.

## 3. Constraint Decision Map

| CST-ID | 관점 | 요약 | 결정 | Build Spec 내 처리 |
|--------|------|------|------|-------------------|
| CST-001 | Experience | 현재 홈 Greeting은 4상태(NO_TICKET/RECOMMEND_BOOKING_TRIAL/RECOMMEND_BOOKING_REGULAR/SCHEDULED_CLASS)만 분기하며, 체험 완료·노쇼·취소 상태가 누락되어 있다 | inject | Section 4에서 구현. 8상태 전체 도입 |
| CST-002 | Experience | 체험 완료 미결제 사용자는 홈 진입 시 /subscribes/tickets로 자동 리다이렉트되어 홈 화면 자체를 볼 수 없다 | inject | Section 4에서 구현. 리다이렉트 제거 + 홈 내 결제 전환 상태 표시 |
| CST-003 | Experience | 예외 상태(학생 노쇼·튜터 노쇼·취소)는 홈이 아닌 레슨 탭의 lesson-card 위젯에서만 표시되어, 홈에서는 완전히 보이지 않는다 | inject | Section 4에서 구현. 3개 예외 상태 화면 도입 |
| CST-004 | Policy | 체험→정규 전환 실패율이 36.1%(1,276명 중 461명)이며, 실패 시나리오(결제 실패·PG 이탈·예약 단계 이탈)가 온톨로지에 정의되어 있지 않다 | inject | Section 4에서 구현. 체험 완료 상태에서 결제 CTA 상시 노출 (간접 대응) |
| CST-005 | Policy | 학생 노쇼(NOSHOW_S)는 종료 상태+72시간 예약 금지 패널티, 튜터 노쇼(CANCEL_NOSHOW_T)는 비종료 상태+체험 완료로 판정+대체 튜터 자동 매칭 — 두 상황의 홈 화면 안내가 완전히 달라야 한다 | inject | Section 4에서 구현. 2개 독립 화면 구현 |
| CST-006 | Policy | 취소 정책은 수업 시작까지 남은 시간에 따라 3단계(2시간+:무료/1~2시간:수강권 차감/1시간 이내:유료 취소)로 나뉘지만, 체험 수업 취소는 항상 무료이다 | inject | Section 4에서 구현. 수강권 유형별 취소 경고 분기 |
| CST-007 | Policy | 체험권은 유료(TRIAL, 금액은 Subscribe 상품 레코드 기준)와 무료(TRIAL_FREE)로 구분되며, 체험 미이용 사용자만 결제 가능하다. 온톨로지에는 유료 체험 3회 상품 정보가 없다 | defer | 이번 범위에서 제외. 이유: 유료 체험 가격/횟수가 백엔드 상품 설정과 일치하는지 확인 필요. 나머지 7개 상태에 영향 없음 |
| CST-008 | Code | greetingStatusSchema(Zod enum 4개) + useGreetingStatus()(4개 boolean 기반 match) 확장이 필수 — ts-pattern exhaustive match로 보호되어 새 상태 누락 시 컴파일 에러 | inject | Section 4에서 구현. greetingStatusSchema 8개 enum 확장 |
| CST-009 | Code | 홈 page.tsx의 SSR prefetch에 subscribeMappList만 포함 — invoiceStatus·trialStepInfo 등 새 상태 판정에 필요한 데이터 미조회로, 추가 prefetch 또는 API 통합 필요 | inject | Section 4에서 구현. SSR prefetch에 getTrialStepInfo + getNextLectureList 추가 |
| CST-010 | Experience | 홈 화면에 Floating CTA 버튼이 없다 — 결제 전환용 플로팅 배너는 subscribes-tickets 뷰에만 존재한다 | inject | Section 4에서 구현. 결제 전환 목적 상태에만 StickyBottom 적용 |
| CST-011 | Policy | 수강권 유형별 예약 제한이 다르다 — 회차권: 매일 1회, 무제한권: 동시 1회(수업 종료 후 다음 예약), 스마트토크: AI챗 6회 완료 후 레슨 1회 오픈 | inject | Section 4에서 구현. 홈 CTA는 예약하기만 표시, 상세 제한은 예약 플로우 내부에서 안내 |
| CST-012 | Experience | 상태 분기가 있는 페이지에는 디버그 UI(시나리오 전환 버튼) 포함 필수 — 홈 화면은 5개 이상 상태 분기가 있으므로 반드시 포함해야 PO가 각 상태를 검증할 수 있다 | inject | Section 4에서 구현. 디버그 UI를 dev 환경에서만 표시 |

## 4. Implementation Plan

### IMPL-001 | CST-001, CST-008

- **요약:** greetingStatusSchema를 8개 enum으로 확장
- **변경 대상:** apps/web/src/widgets/greeting/model/status.ts
- **변경 내용:** Zod enum에 TRIAL_IDLE, TRIAL_BOOKED, LESSON_IMMINENT, TRIAL_COMPLETED, STUDENT_NOSHOW, TUTOR_NOSHOW, TRIAL_EXHAUSTED, CANCELLED 8개 값 정의. 기존 NO_TICKET→TRIAL_IDLE, SCHEDULED_CLASS→TRIAL_BOOKED/LESSON_IMMINENT 매핑 유지.
- **pseudocode:**
```
export const greetingStatusSchema = z.enum([...8개])
```
- **test strategy:** 기존 4상태 테스트가 새 매핑으로 통과하는지 확인

### IMPL-002 | CST-001, CST-003, CST-008

- **요약:** useGreetingStatus() 훅 상태 판정 로직 재구현
- **변경 대상:** apps/web/src/widgets/greeting/hooks/use-greeting-status.ts
- **변경 내용:** 4개 boolean 기반 판정을 invoiceStatus + trialClassCompYn + paymentYn + penaltyEndAt 조합 판정으로 확장. ts-pattern exhaustive match로 8상태 분기.
- **의존성:** IMPL-001
- **guardrail:** 기존 4상태의 동작이 변경되지 않아야 함

### IMPL-003 | CST-002

- **요약:** HomeRedirection 자동 리다이렉트 조건 제거
- **변경 대상:** apps/web/src/features/home-redirection/ui/home-redirection.tsx
- **변경 내용:** trialClassCompYn=Y && paymentYn=N 조건의 AUTO_REDIRECT 로직을 제거. 해당 사용자는 상태 4(TRIAL_COMPLETED) 화면을 봄.
- **pseudocode:**
```
// 기존: if (trialClassCompYn === 'Y' && paymentYn === 'N') redirect('/subscribes/tickets')
// 변경: 해당 조건 제거
```

### IMPL-004 | CST-009, CST-003

- **요약:** SSR prefetch에 getTrialStepInfo + getNextLectureList 추가
- **변경 대상:** apps/web/src/app/(internal)/home/page.tsx
- **변경 내용:** 기존 getCurrentUser + getSubscribeMappList에 getTrialStepInfo + getNextLectureList를 추가. Promise.all로 병렬 호출.
- **pseudocode:**
```
await Promise.all([prefetch(getCurrentUser), prefetch(getSubscribeMappList), prefetch(getTrialStepInfo), prefetch(getNextLectureList)])
```

### IMPL-005 | CST-001, CST-005, CST-010

- **요약:** 8개 상태별 Greeting 컴포넌트 구현
- **변경 대상:** apps/web/src/features/home-greeting/ui/states/
- **변경 내용:** 기존 4개 상태 컴포넌트를 8개로 확장. 각 상태별 v2 디자인 가이드 준수(흰 배경, StepTabs, 3D 버튼). 학생노쇼=red계열, 튜터노쇼=blue계열 시각 분리.
- **의존성:** IMPL-001, IMPL-002

### IMPL-006 | CST-004

- **요약:** 체험 완료 상태에서 결제 CTA 상시 노출 (전환 실패 간접 대응)
- **변경 대상:** apps/web/src/features/home-greeting/ui/states/trial-completed-state.tsx
- **변경 내용:** TRIAL_COMPLETED 상태에 첫 수강 혜택 카드 + StickyBottom CTA '수강권 구매하기' 배치. 결제 도달 경로 추적용 식별자(utm_source=home_trial_completed) 추가.

### IMPL-007 | CST-010

- **요약:** StickyBottom CTA를 결제 전환 목적 상태에만 적용
- **변경 대상:** apps/web/src/views/home/view.tsx
- **변경 내용:** 상태 1(TRIAL_IDLE), 4(TRIAL_COMPLETED), 7(TRIAL_EXHAUSTED)에만 StickyBottom CTA 배치. 나머지 상태는 인라인 CTA 사용.

### IMPL-008 | CST-006

- **요약:** 취소 경고 문구를 수강권 유형별로 분기
- **변경 대상:** apps/web/src/features/home-greeting/ui/states/cancelled-state.tsx
- **변경 내용:** Lesson.city=PODO_TRIAL이면 '무료 취소' 안내 표시. PODO이면 남은 시간에 따라 3단계 경고(2시간+/1~2시간/1시간 이내) 표시.

### IMPL-009 | CST-011, CST-005

- **요약:** 예약 CTA 활성/비활성 조건 구현
- **변경 대상:** apps/web/src/features/home-greeting/lib/hooks/
- **변경 내용:** 이미 예약이 있거나 패널티 중이면 CTA disabled + Toast로 사유 안내(C2 규칙). 수강권 유형별 세부 제한은 예약 플로우 내부에서 처리.

### IMPL-010 | CST-012

- **요약:** 디버그 UI를 dev 환경에서만 표시
- **변경 대상:** apps/web/src/views/home/view.tsx
- **변경 내용:** ScenarioControl 컴포넌트를 process.env.NODE_ENV === 'development' 조건으로 감싸기.

## 5. Delta Set Reference

- **delta-set 경로**: `build/delta-set.json`
- **변경 파일 수**: create 8건, modify 7건
- **content hash**: `05ade8a084bfb46a5dc80b2e68713e89861d46b2d409bf6f4a0dde48fb6771eb`
## 6. Validation Plan Reference

- **validation-plan 경로**: `build/validation-plan.md`
- **검증 항목 수**: 12건
- **content hash**: `1a17497b37169655ba253621526a051ffc2aa55303f3c5d6f8491a7f41e25ef5`
## 7. Brownfield Context

상세: [`build/brownfield-detail.md`](brownfield-detail.md) (hash: `a286f6a7`)

### 변경 대상 파일 (10건)

| 경로 | 역할 | 상세 |
|------|------|------|
| `widgets/greeting/model/status.ts` | greetingStatusSchema Zod enum 정의 (4개) | [→ 상세](brownfield-detail.md#greeting-status) |
| `widgets/greeting/hooks/use-greeting-status.ts` | 4 boolean 기반 상태 판정 (ts-pattern match) | [→ 상세](brownfield-detail.md#greeting-status) |
| `widgets/greeting/ui/greeting-content.tsx` | 상태별 컴포넌트 분기 (exhaustive match) | [→ 상세](brownfield-detail.md#greeting-status) |
| `features/home-redirection/ui/home-redirection.tsx` | 체험완료 미결제 자동 리다이렉트 | [→ 상세](brownfield-detail.md#home-redirection) |
| `app/(internal)/home/page.tsx` | 홈 SSR 진입점 (prefetch 2개) | [→ 상세](brownfield-detail.md#home-page-ssr) |
| `views/home/view.tsx` | HomePageView 조합 (배너+Greeting+TrialTutorial+ClassPrepare) | [→ 상세](brownfield-detail.md#design-system) |
| `features/home-greeting/ui/states/no-ticket-state.tsx` | 기존 NO_TICKET 상태 컴포넌트 | [→ 상세](brownfield-detail.md#greeting-status) |
| `features/home-greeting/ui/states/recommend-trial-lesson.tsx` | 기존 RECOMMEND_BOOKING_TRIAL 상태 컴포넌트 | [→ 상세](brownfield-detail.md#greeting-status) |
| `features/home-greeting/ui/states/scheduled-class.tsx` | 기존 SCHEDULED_CLASS 상태 컴포넌트 | [→ 상세](brownfield-detail.md#greeting-status) |
| `features/home-greeting/lib/hooks/use-scheduled-class-handlers.ts` | 예약변경/취소 핸들러 (ALLOW_CHANGE_TIME=2시간) | [→ 상세](brownfield-detail.md#greeting-status) |

### 직접 의존 모듈 (4건)

| 모듈 | 의존 대상 | 상세 |
|------|----------|------|
| widgets/greeting/ | entities/lesson/ (invoiceStatus enum) | [→ 상세](brownfield-detail.md#greeting-status) |
| features/home-greeting/ | widgets/greeting/ (status schema) | [→ 상세](brownfield-detail.md#greeting-status) |
| views/home/ | features/home-greeting/ + features/home-redirection/ | [→ 상세](brownfield-detail.md#design-system) |
| app/(internal)/home/ | views/home/ + server/domains/users/ | [→ 상세](brownfield-detail.md#home-page-ssr) |

