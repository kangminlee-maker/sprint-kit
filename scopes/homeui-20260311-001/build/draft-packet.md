## Draft Packet: 홈 화면 체험 상태 기반 재설계

### 1. 확정된 Surface

- **scope type**: experience
- **surface location**: `scopes/homeui-20260311-001/surface/preview/`
- **실행 방법**: `cd scopes/homeui-20260311-001/surface/preview && npm run dev`
- **mockup 반복**: 0회 수정 후 사용자 확정

**시나리오 가이드:**

| 시나리오 | 시작 | 동작 순서 | 확인된 동작 |
|---------|------|----------|------------|
| 미신청 | 🔧 → 미신청 | 체험 안내 카드 3개 확인 → CTA "무료 체험 시작하기" 클릭 | alert → /subscribes/trial |
| 체험대기 | 🔧 → 체험대기 | 프로그레스 "신청" 활성 확인 → AI학습 카드 확인 → CTA "수업 예약하기" | alert → /booking |
| 예약완료 | 🔧 → 예약완료 | 예약 일시 카드 확인 → CTA "예습하기" + 보조 버튼 2개 | 예습/튜터정보/예약변경 각각 alert |
| 레슨입장 | 🔧 → 레슨입장 | "레슨 5분 전" 강조 문구 → CTA "수업 입장하기" | alert → /lessons/classroom/[id] |
| 체험완료 | 🔧 → 체험완료 | 첫 수강 혜택 카드(35% 할인) 확인 → CTA "수강권 구매하기" | alert → /subscribes/tickets |
| 튜터노쇼 | 🔧 → 튜터노쇼 | 취소 배지 + 1회 복구 안내 → CTA "다시 예약하기" | alert → /booking |
| 학생노쇼 | 🔧 → 학생노쇼 | 불참 배지 + 미복구 안내 → CTA "다음 체험 예약하기" | alert → /booking |
| 전체소진 | 🔧 → 전체소진 | 프로모션 카드 확인 → CTA "수강권 둘러보기" | alert → /subscribes/tickets |

---

### 2. 현재까지의 결정 현황

- Align에서 결정: 방향 승인, 범위 확정, CST-001, CST-002, CST-003, CST-004, CST-005, CST-006, CST-007, CST-008, CST-009, CST-010 인지 완료
- Draft에서 결정 필요: 아래 10건 (0건 결정 완료, 10건 미결정)
- 잠금 전 필수 해소: `clarify` 상태 항목이 있으면 잠글 수 없음

---

### 3. 결정이 필요한 항목 — 확정된 mockup 기준

#### 요약

| CST-ID | 관점 | 요약 | severity(중요도) |
|--------|------|------|--------|
| CST-001 | Code | HomeRedirection이 체험완료 학생을 강제 리다이렉트하여 홈 화면을 보여주지 않음 | 필수 |
| CST-002 | Code | greetingStatusSchema가 4개 상태만 지원 — 체험 세분화 상태 미존재 | 필수 (Builder 결정) |
| CST-003 | Code | 체험 상태 세분화에 필요한 통합 API 부재 — PodoUserDto는 대기/예약/레슨중/노쇼 구분 불가 | 필수 (Builder 결정) |
| CST-004 | Policy | "무료체험 3회" 및 "5,000원/3회 유료 체험" 정책이 온톨로지와 백엔드에 미존재 | 필수 |
| CST-005 | Experience | 디자인 온톨로지 home_variants(5개)와 brief 상태 모델(8개+) 간 매핑 불일치 | 필수 |
| CST-007 | Policy | 튜터 노쇼(CANCEL_NOSHOW_T)는 비종료 상태 — 취소 안내 불가, 재매칭 대기 반영 필요 | 필수 |
| CST-009 | Experience | 홈 화면 GNB(62px 고정)와 플로팅 CTA 버튼 겹침 방지 전략 필요 | 필수 (Builder 결정) |
| CST-006 | Policy | 노쇼 판정 기준 불일치 — 백엔드 코드 5분 vs 이용약관 10분 | 권장 |
| CST-008 | Code | 정기권 구매 시 체험 수업/수강권 자동 소멸 — 홈 화면 실시간 전환 필요 | 권장 (Builder 결정) |
| CST-010 | Policy | 스마트토크 체험은 AI 6회→튜터 1회 순차 개방 — 프로그레스 구조 영향 | 권장 |

---

#### CST-001 | Code | HomeRedirection이 체험완료 학생을 강제 리다이렉트하여 홈 화면을 보여주지 않음 — 필수

**상황:** HomeRedirection 컴포넌트가 trialClassCompYn=Y && paymentYn=N인 학생을 /subscribes/tickets로 강제 이동시킵니다. Surface에서 확인한 "체험완료" 상태 화면(첫 수강 혜택 카드 + 결제 CTA)이 이 학생에게 표시되려면 리다이렉트를 제거해야 합니다. 선택지가 1개인 이유: 리다이렉트를 유지하면 체험완료 화면 자체가 작동하지 않습니다. inject의 구체적 결과: HomeRedirection에서 해당 조건의 router.replace를 제거하고, GreetingContent에 체험완료 분기를 추가합니다. 미결정 세부 사항: podo_auto_redirected localStorage 키 처리 방식은 Builder가 결정합니다.

**처리하지 않으면:** 체험 완료 학생이 홈 화면의 결제 CTA를 볼 수 없어 결제 전환 유도 목표 달성 불가. 현재처럼 /subscribes/tickets로 강제 이동되어 홈 화면 재설계 효과가 체험 완료 단계에서 발휘되지 않음.

**선택지:**

| 선택 | 이점 | 내용 | 리스크 | 되돌림 비용 |
|------|------|------|--------|------------|
| inject — 리다이렉트 제거 | 체험완료 학생이 홈 화면 결제 CTA를 볼 수 있음 | HomeRedirection에서 trialClassCompYn=Y && paymentYn=N 조건의 router.replace 제거 | 기존에 결제 페이지로 바로 갔던 학생이 홈에 머무르게 됨 | 낮음 — 조건문 1줄 복원 |

추천: inject 권장. 이 scope의 핵심 목표(홈 화면에서 결제 전환 유도)를 달성하기 위해 필수입니다. 방향을 바꾸고 싶다면 modify-direction을 선택할 수 있습니다.

선택: ___

---

#### CST-002 | Code | greetingStatusSchema가 4개 상태만 지원 — 체험 세분화 상태 미존재 — 필수 (Builder 결정 항목)

**상황:** greetingStatusSchema가 4개 상태만 지원합니다. Surface에서 확정한 8개 상태를 구현하려면 스키마를 확장해야 합니다.

**처리하지 않으면:** ts-pattern exhaustive로 인해 새 상태 없이는 체험 상태별 홈 화면 전환 불가.

**Builder가 결정할 사항:** greetingStatusSchema를 8개 상태로 확장하고, ts-pattern match에 새 분기를 추가합니다.

**이 작업 관점에서의 판단:** ts-pattern exhaustive가 컴파일 시점에 모든 분기 구현을 강제하므로 누락 위험이 없습니다. 되돌림 비용: 낮음 — enum 값 제거 + 분기 삭제.

Builder 결정 예정 — 제품 관점 제약 조건 없음. 승인: ___

---

#### CST-003 | Code | 체험 상태 세분화에 필요한 통합 API 부재 — PodoUserDto는 대기/예약/레슨중/노쇼 구분 불가 — 필수 (Builder 결정 항목)

**상황:** PodoUserDto만으로는 체험 상태 세분화가 불가합니다. Surface의 8개 상태를 판별하려면 getPodoTrialLectureList API를 추가 호출해야 합니다.

**처리하지 않으면:** 단일 API로는 체험 상태 세분화 불가. 최소 2개 API 조합 필요하여 로딩 시간 증가.

**Builder가 결정할 사항:** page.tsx에 prefetchQuery 추가, use-greeting-status.ts에서 InvoiceStatus + classState 조합으로 세분화된 상태 판별 로직을 구현합니다.

**이 작업 관점에서의 판단:** API 호출 1건 추가(getPodoTrialLectureList). Server Component에서 prefetch하므로 클라이언트 워터폴 없음. 되돌림 비용: 낮음 — prefetch 제거 + 분기 삭제.

**guardrail:** SSR prefetch 실패 시 기존 4개 상태 fallback으로 동작해야 합니다.

Builder 결정 예정 — 위 guardrail 확인 후 승인: ___

---

#### CST-004 | Policy | "무료체험 3회" 및 "5,000원/3회 유료 체험" 정책이 온톨로지와 백엔드에 미존재 — 필수

**상황:** brief에서 "무료체험 3회 소진 → 유료 체험 5,000원/3회"를 전제했으나, 온톨로지·약관·백엔드 어디에도 근거가 없습니다. 현재 백엔드 체험권은 1회 고정(nPurchased=1 하드코딩). Align에서 "확인 필요"로 분류되었습니다.

**처리하지 않으면:** brief가 전제하는 정책의 근거가 없어 백엔드 변경 범위 예측 불가. 체험권 1회 하드코딩과 충돌.

**선택지:**

| 선택 | 이점 | 내용 | 리스크 | 되돌림 비용 |
|------|------|------|--------|------------|
| defer — 1회 체험 기준으로 진행 | 현재 백엔드와 즉시 호환 | "전체소진" 상태를 1회 소진 기준으로 구현. 3회 정책은 별도 scope에서 처리 | 추후 3회 도입 시 상태 분기 재조정 필요 | 낮음 — 상태 조건 변경만 필요 |
| clarify — PO가 정책 확인 후 결정 | 정확한 정책 기준으로 구현 | 정책 존재 여부를 확인한 뒤 inject 또는 defer 결정 | 확인 기간 동안 이 항목이 미결정 상태로 남아 compile 불가 | 없음 |

추천: defer 권장. 현재 백엔드 기준(1회 체험)으로 먼저 구현하고, 3회 정책은 별도 scope로 분리하면 이 scope의 진행이 막히지 않습니다.

선택: ___

---

#### CST-005 | Experience | 디자인 온톨로지 home_variants(5개)와 brief 상태 모델(8개+) 간 매핑 불일치 — 필수

**상황:** Align에서 "기존 변형에 매핑"으로 방향이 결정되었습니다. Surface에서 매핑을 확정했습니다: 미신청→trial, 체험대기/예약완료→booking_waiting, 레슨입장→booking_imminent, 체험완료/소진→no_plan, 노쇼→no_booking. 선택지가 1개인 이유: Align에서 이미 방향이 결정되었으므로 inject만 가능합니다. inject의 구체적 결과: Surface에서 보신 5개 변형 매핑이 그대로 구현됩니다. 미결정 세부 사항: 각 변형 내부의 구체적 스타일링(카드 색상, 아이콘 등)은 Builder가 결정합니다.

**처리하지 않으면:** 디자인 시스템과 구현이 분리되어 홈 화면 디자인 일관성 상실.

**선택지:**

| 선택 | 이점 | 내용 | 리스크 | 되돌림 비용 |
|------|------|------|--------|------------|
| inject — Surface 매핑 그대로 적용 | 디자인 시스템 변경 없이 구현 | 5개 기존 변형에 8개 상태를 매핑. 온톨로지 수정 없음 | 일부 상태(체험완료)가 원래 의도와 다른 변형(no_plan)에 매핑되어 UX 차이 발생 가능 | 낮음 — 매핑 테이블 변경 |

추천: inject 권장. Align에서 합의된 방향입니다.

선택: ___

---

#### CST-007 | Policy | 튜터 노쇼(CANCEL_NOSHOW_T)는 비종료 상태 — 취소 안내 불가, 재매칭 대기 반영 필요 — 필수

**상황:** 튜터 노쇼(CANCEL_NOSHOW_T) 시 백엔드가 trialClassCompYn=Y로 판정할 수 있습니다(tutorPricePerClass > 0 조건). 이 경우 CST-001의 리다이렉트 제거 후에도, 홈 화면이 "체험완료" 상태로 표시될 수 있습니다. Surface에서는 별도의 "튜터노쇼" 화면(1회 복구 안내 + 다시 예약하기)을 만들었습니다. 이 화면이 정상 작동하려면 프론트엔드가 InvoiceStatus=CANCEL_NOSHOW_T를 직접 참조해야 합니다.

**처리하지 않으면:** 튜터 노쇼를 취소로 표시하면 학생이 체험 기회 상실로 오해. CS 문의 증가.

**선택지:**

| 선택 | 이점 | 내용 | 리스크 | 되돌림 비용 |
|------|------|------|--------|------------|
| inject — InvoiceStatus 직접 참조로 판별 | trialClassCompYn과 독립적으로 튜터 노쇼를 정확히 판별 | getPodoTrialLectureList API에서 InvoiceStatus=CANCEL_NOSHOW_T를 직접 확인하여 튜터노쇼 화면 표시 | 백엔드 로직과 프론트엔드 로직이 다른 기준으로 판별 — 불일치 발생 가능 | 낮음 — 상태 분기 조건 변경 |
| defer — trialClassCompYn 기준 유지 | 백엔드와 동일한 판별 기준 사용 | 튜터 노쇼를 "체험완료"와 동일하게 처리. Surface의 튜터노쇼 화면은 미사용 | 학생에게 "체험이 복구되었다"는 안내를 할 수 없음 | 낮음 — 분기 추가만 필요 |

추천: inject 권장. Surface에서 확인한 튜터노쇼 전용 화면(1회 복구 안내)이 동작하려면 InvoiceStatus 직접 참조가 필요합니다.

선택: ___

---

#### CST-009 | Experience | 홈 화면 GNB(62px 고정)와 플로팅 CTA 버튼 겹침 방지 전략 필요 — 필수 (Builder 결정 항목)

**상황:** Surface에서 확인한 바와 같이, CTA는 Greeting 카드 내부에 배치합니다. GNB(62px)와 겹치지 않습니다.

**처리하지 않으면:** StickyBottom과 GNB 모두 fixed bottom-0이므로 겹침 발생. CTA 접근 불가.

**Builder가 결정할 사항:** StickyBottom/플로팅 버튼을 사용하지 않고, ButtonPrimary를 GreetingCard 내부에 배치합니다.

**이 작업 관점에서의 판단:** 디자인 온톨로지의 "GNB가 있으면 StickyBottom 대신 카드 내 CTA" 권장 사항을 따릅니다. Surface에서 PO가 이 배치를 확정했습니다. 되돌림 비용: 낮음 — 컴포넌트 위치 변경.

Builder 결정 예정 — 제품 관점 제약 조건 없음. 승인: ___

---

#### CST-006 | Policy | 노쇼 판정 기준 불일치 — 백엔드 코드 5분 vs 이용약관 10분 — 권장

**상황:** 노쇼 판정 기준이 백엔드(5분)와 이용약관(10분)에서 다릅니다. 홈 화면은 백엔드 판정 결과(InvoiceStatus)를 표시하므로 프론트엔드 자체의 시간 기준은 필요 없지만, 학생에게 표시하는 안내 문구에서 "10분"을 언급할지 여부를 결정해야 합니다.

**처리하지 않으면:** 홈 화면 노쇼 전환 시점 기준 불명확. 학생 항의 가능성.

**선택지:**

| 선택 | 이점 | 내용 | 리스크 | 되돌림 비용 |
|------|------|------|--------|------------|
| defer — 시간 언급 없이 처리 | 약관과 코드 불일치 문제를 회피 | 홈 화면 안내 문구에서 구체적 시간을 언급하지 않음 ("수업에 참여하지 못했어요") | 학생이 노쇼 기준을 모름 | 낮음 — 문구 변경 |
| inject — 약관 기준(10분) 명시 | 학생에게 명확한 기준 제공 | "수업 시작 10분 후 불참 처리됩니다" 안내 추가 | 실제 시스템(5분)과 불일치 — CS 문의 가능 | 낮음 — 문구 변경 |

추천: defer 권장. 시간 기준 불일치 해소는 별도 과제(백엔드 또는 약관 수정)입니다. 이 scope에서는 시간을 언급하지 않는 것이 안전합니다.

선택: ___

---

#### CST-008 | Code | 정기권 구매 시 체험 수업/수강권 자동 소멸 — 홈 화면 실시간 전환 필요 — 권장 (Builder 결정 항목)

**상황:** 정기권 구매 시 closeTrialClass()가 체험 수업/수강권을 일괄 취소합니다. 홈 화면이 이 전환을 반영해야 합니다.

**처리하지 않으면:** 체험→정규 전환 시 이미 취소된 체험 수업 카드가 홈 화면에 남아있을 수 있음.

**Builder가 결정할 사항:** tanstack-query의 invalidateQueries로 체험 상태 캐시를 무효화합니다. 결제 완료 페이지에서 홈 화면 복귀 시 최신 상태가 표시됩니다.

**이 작업 관점에서의 판단:** tanstack-query의 기존 캐시 무효화 패턴을 따르므로 추가 구현이 거의 없습니다. 되돌림 비용: 없음.

Builder 결정 예정 — 제품 관점 제약 조건 없음. 승인: ___

---

#### CST-010 | Policy | 스마트토크 체험은 AI 6회→튜터 1회 순차 개방 — 프로그레스 구조 영향 — 권장

**상황:** 스마트토크 체험은 AI 6회→튜터 1회 순차 구조이나, 이 scope는 스마트토크 전용 홈(/home/ai)을 제외 범위로 확정했습니다.

**처리하지 않으면:** 일반 체험 기준 프로그레스바로는 스마트토크의 순차 구조를 반영할 수 없음.

**선택지:**

| 선택 | 이점 | 내용 | 리스크 | 되돌림 비용 |
|------|------|------|--------|------------|
| defer — 스마트토크 프로그레스는 별도 scope | 이 scope 범위 내에서 완결 | 일반 체험(BASIC/BUSINESS) 프로그레스만 구현. 스마트토크 프로그레스는 /home/ai scope에서 처리 | 스마트토크 학생이 일반 홈에 접근 시 프로그레스가 부정확할 수 있음 | 낮음 — 프로그레스 분기 추가 |

추천: defer 권장. 스마트토크 전용 홈은 제외 범위에 이미 포함되어 있습니다.

선택: ___

---

### 5. 제약 조건 (구현 시 반드시 지켜야 할 것)

- HomeRedirection 리다이렉트 제거 시, paymentYn=Y(정규 수강생)의 기존 동작은 변경하지 않을 것
- greetingStatusSchema 확장 시, 기존 4개 상태의 동작이 변경되지 않을 것 (하위 호환)
- SSR prefetch 실패 시 기존 4개 상태 fallback으로 동작할 것
- feature flag enable_react_home이 비활성인 경우 레거시 Vue 홈으로 라우팅되는 기존 동작을 유지할 것
- 디자인 토큰(색상, 간격, 타이포그래피)은 디자인 온톨로지 기준을 따를 것

---

### 6. 지금 결정할 것

1. CST-001: HomeRedirection 리다이렉트를 제거합니까? (inject 권장)
2. CST-004: 1회 체험 기준으로 먼저 진행합니까? (defer 권장) 또는 정책 확인이 필요합니까? (clarify)
3. CST-005: Surface 매핑(5개 변형 재활용)을 확정합니까? (inject 권장)
4. CST-007: 튜터 노쇼를 InvoiceStatus로 직접 판별합니까? (inject 권장)
5. CST-006: 노쇼 시간 기준을 이 scope에서는 언급하지 않습니까? (defer 권장)
6. CST-010: 스마트토크 프로그레스를 별도 scope로 분리합니까? (defer 권장)
7. Builder 결정 항목(CST-002, 003, 008, 009) — guardrail 확인 후 승인합니까?

모든 결정이 완료되면 compile을 시작합니다.

- **Approve**: 위 결정에 동의하며, compile 단계로 진행합니다. 각 CST에 대한 결정을 함께 제출해 주세요.
- **Revise**: 피드백을 주시면 Draft Packet을 수정하여 다시 보여드립니다.
- **Reject**: 이 scope를 거절하고 종료합니다.
- **Redirect to Align**: 방향 자체를 재검토하기 위해 Align 단계로 돌아갑니다.
- **Review**: 이 Packet 전체에 대해 6-Agent Panel Review를 요청합니다.

선택: **Approve** + 각 CST 결정 / **Revise** / **Reject** / **Redirect to Align** / **Review**
