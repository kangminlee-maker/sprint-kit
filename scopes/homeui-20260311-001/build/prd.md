---
scope_id: "homeui-20260311-001"
version: "1.0"
status: "compiled"
created_at: "2026-03-11T10:49:29.413Z"
compiled_at: "2026-03-11T12:42:47.529Z"
projectInfo:
  name: "PODO"
  service_type: "1:1 영어 스피킹 레슨 플랫폼"
  domain_entities:
    - Lesson (레슨 — 학생과 튜터 간 1:1 수업 단위)
    - SubscribeMapp (수강권 매핑 — 학생의 수강 상태를 추적하는 엔티티)
    - Invoice (결제 — 레슨 예약·완료·취소 등 결제 상태를 관리하는 엔티티)
    - User (사용자 — 학생/튜터)
  enums:
    TrialStatus: [NOT_APPLIED, WAITING, LESSON_READY, COMPLETED, TUTOR_NOSHOW, STUDENT_ABSENT, EXHAUSTED]
    InvoiceStatus: [CREATED, RESERVED, COMPLETED, NOSHOW_S, NOSHOW_BOTH, CANCEL_NOSHOW_T, CANCEL, CANCEL_PAID]
    LectureStatus: [SCHEDULED, IN_PROGRESS, FINISHED, CANCELLED]
    PaymentType: [TRIAL_FREE, TRIAL, SUBSCRIBE, LUMP_SUM]
    SubscribeMappStatus: [TRIAL, SUBSCRIBE, LUMP_SUM, EXTEND, BONUS, FAILED, FINISH, REFUND, ADMIN_DROP, DELETE]
  states:
    기존_홈_상태: [NO_TICKET, SCHEDULED_CLASS, RECOMMEND_BOOKING_TRIAL_CLASS, RECOMMEND_BOOKING_REGULAR_CLASS]
    신규_체험_상태: [NOT_APPLIED, WAITING, LESSON_READY, COMPLETED, TUTOR_NOSHOW, STUDENT_ABSENT, EXHAUSTED]
inputDocuments:
  brief:
    path: "inputs/brief.md"
  align_packet:
    path: "build/align-packet.md"
    hash: "a214fbccd446ffa8b1f8aef14b0abcdbc57ece77a83acd81138b941fe728d35c"
  draft_packet:
    path: "build/draft-packet.md"
    hash: "d4db3a7bb573a7e24d104af5acc244bbbf7cb0aaa8005a94130ba20008d3ca8f"
  build_spec:
    path: "build/build-spec.md"
    hash: "d98f2ed0161ddf2e45344f9b40067e047854e5716c76f97fc5b8b321dbc6d0e2"
  validation_plan:
    path: "build/validation-plan.md"
    hash: "cdaa818179faf1d493d0b1d594ea7a6114d9708693588358ba5ff8af42395a55"
constraintSummary:
  total: 11
  inject: 10
  defer: 0
  override: 0
  invalidated: 1
changeLog:
  - { event: "scope.created", date: "2026-03-11T10:49:29Z", summary: "홈 화면 체험 상태 기반 동적 전환 scope 생성" }
  - { event: "grounding.completed", date: "2026-03-11T11:04:08Z", summary: "5개 소스 스캔 완료 — experience 3건, code 4건, policy 2건 발견" }
  - { event: "align.locked", date: "2026-03-11T11:18:51Z", summary: "방향 승인 — 4상태→7상태 확장, 프로그레스바, 본문 카드, 플로팅 CTA" }
  - { event: "surface.confirmed", date: "2026-03-11T12:32:05Z", summary: "체험 7상태 Surface 확정 (수정 0회)" }
  - { event: "compile.completed", date: "2026-03-11T12:42:47Z", summary: "8 IMPL, 15 CHG(create 10 + modify 5), 10 VAL 생성" }
---

# Product Requirements Document — 홈 화면 체험 상태 기반 동적 전환

## Brownfield Sources

이 scope에서 참조한 소스와 각 소스에서 발견한 핵심 정보입니다.

| 소스 | 유형 | 핵심 발견 |
|------|------|----------|
| podo-backend | github-tarball | LectureGateway에 레슨 목록 조회 API 존재. 노쇼 처리는 레거시 PHP/어드민 도구가 담당하며 Java 백엔드에 전이 로직 없음 |
| podo-app | github-tarball | useGreetingStatus 훅이 4상태 분기 담당. getSubscribeMappList + getNextLessonsInfo 2개 API만 호출. FSD 아키텍처(features/widgets/entities/shared) |
| podo-ontology | github-tarball | Lesson 엔티티의 3중 상태 구조(invoiceStatus/status/classState) 정의. InvoiceStatus 전이 규칙 문서화. PaymentType에 TRIAL_FREE/TRIAL 구분 |
| vibe-design | github-tarball | StickyBottom 컴포넌트 정의됨(fixed bottom, max-w-480px). ProgressBar/StepIndicator 미정의 |
| ./sources | add-dir (로컬) | 이용약관 제14조: 무제한권 노쇼 시 72시간 예약 차단. 무료체험은 수강권과 별개 상품이므로 패널티 미적용 |

**Brownfield 구조 요약:**

홈 화면은 `HomePageView → Banner + GreetingContent + ClassPrepareWidget` 구조입니다. `GreetingContent`는 `useGreetingStatus()` 훅으로 4개 상태를 ts-pattern match로 분기합니다. 상태 판별에 사용하는 조건은 `hasActiveTicket`, `hasNextLecture`, `hasTrialTicket`, `hasRegularTicket` 4개입니다. 디자인 시스템은 `@podo-app/design-system-temp` 패키지(VStack/HStack/Box/Typography/Button)를 사용합니다.

## Executive Summary

PODO 앱 홈 화면은 현재 4가지 상태(수강권 없음, 예약됨, 체험 예약 유도, 정규 예약 유도)로만 분기하여, 학생의 체험 진행 과정(미신청→대기→레슨→완료→예외)을 표현하지 못합니다. 체험 완료 후 결제 전환 유도 화면이 없고, 노쇼·취소·3회 소진 등 예외 상황에서 다음 행동을 안내하는 경로가 부재합니다.

이 scope는 홈 화면의 상태 분기 로직을 7가지 체험 상태로 확장하고, 각 상태에 맞는 메인 문구·프로그레스바·본문 카드·플로팅 CTA를 구성합니다. 모든 상태에서 다음 행동까지의 거리를 최소화하고, 예외 상황에서도 결제 유도 화면까지의 경로를 보장합니다.

### Goal Metrics

| Metric | Current | Target |
|--------|---------|--------|
| 홈 화면 상태 분기 수 | 4가지 | 7가지 (체험 전용) + 기존 4가지 (정규) |
| 체험 완료 → 결제 페이지 도달 경로 | 없음 (GNB 통해서만 접근) | 플로팅 CTA 1탭 + 혜택 카드 직접 링크 |
| 예외 상태(노쇼/취소/소진) 전용 안내 화면 | 없음 | 3가지 (튜터 노쇼, 학생 노쇼, 3회 소진) |
| 체험 진행 단계 시각적 표시 | 없음 | 4단계 프로그레스바 (신청→예습→레슨→완료) |

## Success Criteria

### User Success

- 체험 학생이 홈 화면 진입 시 현재 단계와 다음 행동을 3초 이내에 인지할 수 있다
- 튜터 노쇼 발생 시 학생이 재신청까지 플로팅 CTA 1탭으로 도달한다
- 무료체험 3회 소진 시 유료 체험 안내 화면이 즉시 노출된다

### Business Success

- 체험 완료 학생의 결제 페이지 도달률이 증가한다 (기존: GNB 경유만 → 변경: 플로팅 CTA + 혜택 카드 직접 연결)
- 예외 상황(노쇼/취소) 후 이탈 없이 재신청 흐름으로 복귀하는 비율이 증가한다

### Technical Success

- 기존 정규 수강생(SUBSCRIBE/LUMP_SUM 수강권)의 홈 화면 UI에 영향 없음
- 백엔드 API 신규 개발 없이 기존 API 응답만으로 7상태 판별 완료
- 홈 화면 추가 API 호출로 인한 로딩 시간 증가가 체감되지 않음 (병렬 호출)

### Measurable Outcomes

- 7가지 체험 상태별 올바른 UI 표시 (VAL-001 ~ VAL-010 전항 통과)
- 결제 완료 후 정규 수강생 UI로 즉시 전환 (캐시 무효화, VAL-005)
- 기존 정규 수강생 진입 시 기존 UI 유지 (VAL-004)

## Product Scope

### Phase 1: 홈 화면 체험 상태 기반 동적 전환

| Feature | Description | Related FRs |
|---------|-------------|-------------|
| 상태 모델 확장 | greetingStatusSchema에 체험 7상태 추가, 수강권 유형 1차 분기 | FR1, FR2 |
| 프로그레스바 | 4단계(신청→예습→레슨→완료) 프로그레스바 컴포넌트 신규 구현 | FR3 |
| 본문 카드 7종 | 상태별 본문 카드 컴포넌트 (미신청, 대기, 입장, 완료, 튜터노쇼, 학생노쇼, 소진) | FR4 |
| 플로팅 CTA | StickyBottom 기반 상태별 라벨·동작 전환 | FR5 |
| 3중 상태 매핑 | invoiceStatus + status + classState → TrialStatus 변환 | FR6 |
| 결제 완료 전환 | 결제 완료 시 tanstack-query 캐시 무효화 → 정규 UI 즉시 전환 | FR7 |

## User Journeys

### Journey 1: 첫 체험 신청 (Happy Path)

**Persona:** 김민수 (28세, 직장인, PODO 앱을 처음 설치하고 가입한 상태. 영어 스피킹 연습에 관심이 있으나 유료 결제는 망설이는 중)

**Opening Scene:** 민수는 점심시간에 PODO 앱을 처음 열었습니다. 아직 수강권이 없고 체험 이력도 없는 상태입니다. 앱이 홈 화면(`/home`)을 표시합니다.

**Rising Action:** 홈 화면 상단에 프로그레스바가 4단계(신청→예습→레슨→완료) 중 0단계로 표시됩니다. 메인 문구는 "민수님, 안녕하세요!"이고 부제는 "무료 체험 레슨으로 포도와 함께 영어 스피킹을 시작해보세요!"입니다. 본문 카드 영역에는 무료 체험 안내(3회 무료, 25분 1:1 레슨)가 표시됩니다. 하단 플로팅 CTA 버튼에 "무료 체험 신청하기"가 표시됩니다.

**Climax:** 민수가 플로팅 CTA를 탭하면 `/trial/apply` 페이지로 이동하여 체험 레슨을 신청합니다. 예약이 확정되면 InvoiceStatus가 CREATED → RESERVED로 전이됩니다.

**Resolution:** 민수가 홈 화면(`/home`)으로 돌아오면 상태가 WAITING으로 전환되어 있습니다. 프로그레스바가 1단계(예습)로 활성화되고, 레슨 일정과 예습 진행률 카드가 표시됩니다. 민수는 "다음에 예습을 하면 되겠구나"라고 다음 행동을 바로 인지합니다.

---

### Journey 2: 레슨 대기 → 입장 → 완료 → 결제 전환 (Happy Path)

**Persona:** 이서연 (32세, 프리랜서, 무료체험 1회차를 예약한 상태. 레슨 시작 30분 전)

**Opening Scene:** 서연은 체험 레슨을 예약한 후 앱을 다시 열었습니다. 현재 상태는 WAITING이며, 레슨 시작까지 30분 남았습니다.

**Rising Action:** 홈 화면(`/home`)에 프로그레스바 1단계(예습)가 활성화되어 있습니다. 본문에 "2026.03.15 (토) 14:00~14:25" 레슨 일정과 예습 진행률이 표시됩니다. 플로팅 CTA는 "예습하기"(`/trial/prestudy`)입니다. 레슨 시작 10분 전이 되면, 상태가 LESSON_READY로 전환됩니다. 프로그레스바가 2단계(레슨)로 이동하고, 메인 문구가 "서연님, 레슨 시간이에요!"로 변경됩니다. 플로팅 CTA가 "수업 입장하기"로 바뀌며 펄스(pulse) 애니메이션이 적용됩니다.

**Climax:** 서연이 플로팅 CTA를 탭하면 `/lesson/enter` 레슨룸으로 이동합니다. 25분 레슨이 끝나면 InvoiceStatus가 RESERVED → COMPLETED로 전이됩니다.

**Resolution:** 레슨 종료 후 홈 화면(`/home`)으로 돌아오면 상태가 COMPLETED로 전환됩니다. 프로그레스바가 3단계(완료)를 표시합니다. 메인 문구는 "첫 레슨을 완료했어요!"이고, 본문에 첫 수강 혜택 카드와 프로모션 배너가 표시됩니다. 플로팅 CTA가 "수강권 구매하기"(`/purchase`)로 전환됩니다. 서연이 CTA를 탭하여 결제를 완료하면, tanstack-query 캐시가 즉시 무효화(invalidateQueries)되어 홈 화면이 정규 수강생 UI로 전환됩니다. 체험 상태 UI는 더 이상 표시되지 않습니다.

---

### Journey 3: 튜터 노쇼 → 재신청 (Exception Path)

**Persona:** 박지호 (25세, 대학생, 무료체험 1회차 레슨이 예약되어 있었으나 튜터가 불참)

**Opening Scene:** 지호는 체험 레슨 시간에 맞춰 앱을 열었지만, 튜터가 나타나지 않았습니다. 외부 시스템(레거시 PHP/어드민 도구)이 노쇼를 처리하여 InvoiceStatus가 CANCEL_NOSHOW_T로 설정되었습니다.

**Rising Action:** 지호가 홈 화면(`/home`)에 진입하면, API가 invoiceStatus=CANCEL_NOSHOW_T를 반환합니다. trial-status-mapper가 이를 TUTOR_NOSHOW 상태로 매핑합니다. 프로그레스바가 1단계(신청)로 복귀합니다. 메인 문구는 "지호님, 죄송합니다"이고 부제는 "튜터 사정으로 레슨이 진행되지 못했어요. 체험 1회가 복구되었습니다."입니다.

**Climax:** 본문에 복구 안내 카드가 표시되고, 플로팅 CTA가 "다시 신청하기"(`/trial/apply`)로 설정됩니다. 무료체험은 수강권(무제한권/회차권)과 별개 상품이므로, 이용약관 제14조의 72시간 예약 차단 패널티가 적용되지 않습니다. 지호는 즉시 재신청이 가능합니다.

**Resolution:** 지호가 플로팅 CTA를 탭하여 새 레슨을 예약하면, 상태가 다시 WAITING으로 전환됩니다. 지호는 "복구해줬으니 다시 예약하면 되겠다"고 안심합니다.

---

### Journey 4: 학생 노쇼 → 잔여 횟수 안내 (Exception Path)

**Persona:** 최수빈 (30세, 회사원, 무료체험 2회차 레슨을 놓침. 1회는 정상 완료, 이번이 2번째 레슨)

**Opening Scene:** 수빈은 회의가 길어져 체험 레슨 시간을 놓쳤습니다. 외부 시스템이 학생 노쇼를 처리하여 InvoiceStatus가 NOSHOW_S로 설정되었습니다.

**Rising Action:** 수빈이 홈 화면(`/home`)에 진입하면, API가 invoiceStatus=NOSHOW_S를 반환합니다. trial-status-mapper가 이를 STUDENT_ABSENT로 매핑합니다. 프로그레스바가 1단계로 복귀합니다. 메인 문구는 "수빈님, 레슨에 참여하지 못하셨네요"이고, 부제는 "잔여 무료체험: 1회 남음"입니다. 잔여 횟수는 TRIAL_FREE 타입 레슨 중 COMPLETED + NOSHOW_S + NOSHOW_BOTH 상태의 건수(2건)를 3회에서 차감하여 계산합니다.

**Climax:** 플로팅 CTA가 "다시 예약하기"(`/trial/apply`)로 표시됩니다. 수빈이 탭하여 마지막 1회를 예약합니다.

**Resolution:** 예약 완료 후 홈 화면으로 돌아오면 WAITING 상태로 전환됩니다. 수빈은 "1회 남았으니 이번엔 꼭 참여해야겠다"고 다짐합니다.

---

### Journey 5: 무료체험 3회 소진 → 유료 체험 안내 (Exception Path)

**Persona:** 정하은 (27세, 취업 준비생, 무료체험 3회를 모두 사용함. 정상 완료 2회, 노쇼 1회)

**Opening Scene:** 하은은 무료체험 3회를 모두 소진했습니다. TRIAL_FREE 타입 레슨 중 최종 상태(COMPLETED 2건 + NOSHOW_S 1건)가 3건이므로 EXHAUSTED 상태입니다.

**Rising Action:** 하은이 홈 화면(`/home`)에 진입하면, useGreetingStatus 훅이 체험 이력 3건을 감지하고 EXHAUSTED 상태로 판별합니다. 프로그레스바가 3단계(소진)를 표시합니다. 메인 문구는 "하은님, 무료 체험을 모두 사용했어요"이고, 부제는 "유료 체험으로 레슨을 계속 경험해보세요"입니다. 본문에 유료 체험(5,000원/3회) 안내 카드가 표시됩니다.

**Climax:** 플로팅 CTA가 "유료 체험 신청하기 · 5,000원"(`/trial/paid-apply`)으로 표시됩니다. 하은이 탭하여 유료 체험을 결제합니다.

**Resolution:** 결제 완료 후 PaymentType=TRIAL 레슨이 생성되고, 홈 화면으로 돌아오면 WAITING 상태로 전환됩니다. 하은은 "5,000원이면 한번 더 해볼 만하다"고 판단합니다.

---

### Journey 6: 정규 수강생 진입 — 기존 UI 유지 (Happy Path)

**Persona:** 김태영 (35세, 직장인, 정규 구독 결제 완료 상태. SUBSCRIBE 수강권 보유)

**Opening Scene:** 태영은 이미 정규 구독을 결제한 수강생입니다. SubscribeMappStatus가 SUBSCRIBE이며, PaymentType이 SUBSCRIBE입니다.

**Rising Action:** 태영이 홈 화면(`/home`)에 진입하면, useGreetingStatus 훅이 수강권 유형을 1차 분기합니다. 수강권이 SUBSCRIBE/LUMP_SUM 유형이므로 체험 7상태 로직을 건너뛰고 기존 4상태 분기로 진입합니다.

**Climax:** 기존 UI(SCHEDULED_CLASS 또는 RECOMMEND_BOOKING_REGULAR)가 그대로 표시됩니다. 체험 프로그레스바, 체험 본문 카드, 체험 플로팅 CTA는 표시되지 않습니다.

**Resolution:** 태영은 기존과 동일한 홈 화면을 보며 아무런 변화를 느끼지 못합니다. 정규 수강생의 경험이 보존됩니다.

## Domain-Specific Requirements

### 무료체험 횟수 규칙 (source: CST-007, podo-ontology)

- 무료체험은 총 3회 제공됩니다 (PaymentType=TRIAL_FREE)
- 횟수 소진 기준: InvoiceStatus가 COMPLETED, NOSHOW_S, NOSHOW_BOTH인 레슨의 건수를 합산합니다
- 3회 소진 시 EXHAUSTED 상태로 전환됩니다
- 유료 체험(PaymentType=TRIAL, 5,000원/3회)으로 추가 레슨이 가능합니다

### 튜터 노쇼 시 체험 복구 (source: CST-006, podo-ontology state-transitions.yaml)

- 튜터 노쇼(InvoiceStatus=CANCEL_NOSHOW_T) 시 해당 체험 1회가 복구됩니다
- 외부 시스템(레거시 PHP/어드민 도구)이 노쇼 처리를 수행합니다
- 백엔드 Java 코드에는 노쇼 전이 로직이 없으며, DB 상태값을 직접 읽어 판별합니다

### 정규구독 결제 시 체험 자동 만료 (source: CST-009, podo-ontology state-transitions.yaml)

- 정규구독 결제 시 진행 중인 체험수업이 자동 취소됩니다 (L7: CREATED→CANCEL, S5: TRIAL→FINISH)
- cancelTrial() 호출 시 체험 수업 취소 + cancelAt 설정
- 홈 화면에서 결제 완료 후 tanstack-query 캐시를 즉시 무효화하여 정규 수강생 UI로 전환합니다

### 이용약관 제14조 — 노쇼 패널티 미적용 (source: CST-008 invalidated, sources/terms-of-service.md)

- 이용약관 제14조의 노쇼 패널티(무제한권 72시간 예약 차단)는 무료체험에 적용되지 않습니다
- 무료체험은 수강권(무제한권/회차권)과 별개 상품입니다
- 튜터 노쇼·학생 노쇼 후 즉시 재신청이 가능합니다

## Technical Requirements

### Tech Stack Status

| 항목 | 현재 | 비고 |
|------|------|------|
| Framework | Next.js 15 + React 19 | |
| Language | TypeScript | |
| Styling | Tailwind CSS v3 + CVA | |
| State Management | @tanstack/react-query | 서버 상태 관리 |
| Architecture | FSD (features/widgets/entities/shared) | podo-app 아키텍처 |
| Design System | @podo-app/design-system-temp | VStack/HStack/Box/Typography/Button |
| Monorepo | pnpm + Turborepo | |

### API Requirements

기존 API만 사용합니다. 신규 백엔드 API 개발은 이 scope에 포함되지 않습니다.

| API | 현재 호출 여부 | 용도 |
|-----|--------------|------|
| subscribesEntityQueries.getSubscribeMappList | 호출 중 | 수강권 목록 조회 → 수강권 유형 1차 분기에 사용 |
| lessonEntityQueries.getNextLessonsInfo | 호출 중 | 다음 레슨 정보 조회 |
| LectureGateway 레슨 목록 조회 | **추가 필요** | 체험 레슨 이력 (invoiceStatus, classState) 조회 → 7상태 판별 |

추가 API 호출은 기존 2개 API와 **병렬 실행**(Promise.all 또는 useSuspenseQueries)하여 로딩 시간 증가를 최소화합니다.

### Component Structure

```
apps/web/src/
├── widgets/greeting/
│   ├── model/
│   │   ├── status.ts              [MODIFY] 체험 7상태 + 분기 타입 추가
│   │   └── trial-status-mapper.ts  [CREATE] 3중 상태 → TrialStatus 매핑
│   ├── hooks/
│   │   └── use-greeting-status.ts  [MODIFY] API 추가 + 분기 확장
│   └── ui/
│       └── greeting-content.tsx    [MODIFY] 7상태별 컴포넌트 매핑
├── features/home-greeting/ui/
│   ├── components/
│   │   ├── trial-progress-bar.tsx  [CREATE] 프로그레스바
│   │   └── trial-sticky-cta.tsx    [CREATE] 플로팅 CTA
│   └── states/
│       ├── not-applied-state.tsx   [CREATE] 미신청 카드
│       ├── waiting-state.tsx       [CREATE] 대기 카드
│       ├── lesson-ready-state.tsx  [CREATE] 레슨 입장 카드
│       ├── completed-state.tsx     [CREATE] 완료 카드
│       ├── tutor-noshow-state.tsx  [CREATE] 튜터 노쇼 카드
│       ├── student-absent-state.tsx [CREATE] 학생 노쇼 카드
│       └── exhausted-state.tsx     [CREATE] 3회 소진 카드
├── features/payment/hooks/
│   └── use-payment-complete.ts     [MODIFY] invalidateQueries 추가
└── views/home/
    └── view.tsx                    [MODIFY] TrialProgressBar + TrialStickyCta 추가
```

## Functional Requirements

### 홈 화면 — 상태 판별 (`/home`)

- **FR1:** 수강권 유형 1차 분기 (source: CST-010) [BROWNFIELD]
  - FR1-1: useGreetingStatus 훅에서 수강권 유형(PaymentType)을 먼저 확인합니다
  - FR1-2: TRIAL_FREE 또는 TRIAL 수강권이면 체험 7상태 분기로 진입합니다
  - FR1-3: SUBSCRIBE 또는 LUMP_SUM 수강권이면 기존 4상태 분기를 유지합니다
  - FR1-4: 수강권이 없으면(NO_TICKET) 체험 이력 존재 여부를 확인하여 체험/정규 분기를 결정합니다

- **FR2:** 체험 7상태 판별 (source: CST-001, CST-004, CST-005, CST-006, CST-007, CST-011)
  - FR2-1: 레슨 이력 API를 추가 호출하여 invoiceStatus, classState, PaymentType을 조회합니다
  - FR2-2: trial-status-mapper 함수가 invoiceStatus + status + classState 3중 상태를 TrialStatus로 매핑합니다
  - FR2-3: TRIAL_FREE 레슨 중 최종 상태(COMPLETED/NOSHOW_S/NOSHOW_BOTH) 건수를 합산하여 잔여 횟수를 계산합니다
  - FR2-4: 3회 소진 시 EXHAUSTED 상태를 반환합니다
  - FR2-5: invoiceStatus=NOSHOW_S → STUDENT_ABSENT, CANCEL_NOSHOW_T → TUTOR_NOSHOW로 매핑합니다
  - FR2-6: invoiceStatus=RESERVED + classState=PRESTUDY 또는 pre_study_time>0 → WAITING (예습 단계 활성화)

### 홈 화면 — 프로그레스바 (`/home`)

- **FR3:** 체험 프로그레스바 표시 (source: CST-002)
  - FR3-1: 4단계를 표시합니다: 0(신청), 1(예습), 2(레슨), 3(완료)
  - FR3-2: 활성 단계는 green-500, 비활성 단계는 gray-300으로 표시합니다 (vibe-design 디자인 토큰)
  - FR3-3: NOT_APPLIED → step 0, WAITING → step 1, LESSON_READY → step 2, COMPLETED → step 3
  - FR3-4: TUTOR_NOSHOW → step 1 복귀, STUDENT_ABSENT → step 1 복귀, EXHAUSTED → step 3 (소진)
  - FR3-5: 정규 수강생에게는 프로그레스바를 표시하지 않습니다

### 홈 화면 — 본문 카드 (`/home`)

- **FR4:** 상태별 본문 카드 표시 (source: CST-001)
  - FR4-1: NOT_APPLIED — 무료 체험 안내 카드 (3회 무료, 25분 1:1 레슨 설명)
  - FR4-2: WAITING — 예습 진행률 + 레슨 일정 카드 (날짜, 시간, 튜터 정보)
  - FR4-3: LESSON_READY — 튜터 정보 + 즉시 입장 안내 카드
  - FR4-4: COMPLETED — 첫 수강 혜택 카드 + 프로모션 배너
  - FR4-5: TUTOR_NOSHOW — 복구 안내 카드 ("체험 1회가 복구되었습니다")
  - FR4-6: STUDENT_ABSENT — 잔여 횟수 안내 카드 ("잔여 무료체험: N회 남음")
  - FR4-7: EXHAUSTED — 유료 체험 안내 카드 (5,000원/3회)

### 홈 화면 — 플로팅 CTA (`/home`)

- **FR5:** StickyBottom 플로팅 CTA 표시 (source: CST-003)
  - FR5-1: NOT_APPLIED → "무료 체험 신청하기" → `/trial/apply`
  - FR5-2: WAITING → "예습하기" → `/trial/prestudy`
  - FR5-3: LESSON_READY → "수업 입장하기" → `/lesson/enter` + 펄스(pulse) 애니메이션
  - FR5-4: COMPLETED → "수강권 구매하기" → `/purchase`
  - FR5-5: TUTOR_NOSHOW → "다시 신청하기" → `/trial/apply`
  - FR5-6: STUDENT_ABSENT → "다시 예약하기" → `/trial/apply`
  - FR5-7: EXHAUSTED → "유료 체험 신청하기 · 5,000원" → `/trial/paid-apply`
  - FR5-8: StickyBottom의 z-index와 하단 여백을 디자인 시스템 규격(z-[100], GNB pb-[62px])에 맞춥니다
  - FR5-9: 정규 수강생에게는 플로팅 CTA를 표시하지 않습니다

### 3중 상태 매핑

- **FR6:** trial-status-mapper 구현 (source: CST-005, CST-011)
  - FR6-1: invoiceStatus + status + classState 조합을 TrialStatus로 변환하는 순수 함수입니다
  - FR6-2: PREFINISH는 invoiceStatus가 아닌 classState 값입니다 — classState 필드에서 확인합니다
  - FR6-3: InvoiceStatus=RESERVED + classState=PRESTUDY → WAITING (예습 진행 중)
  - FR6-4: InvoiceStatus=RESERVED + classState=PREFINISH → LESSON_READY (수업 종료 직전)

### 결제 완료 전환

- **FR7:** 결제 완료 후 캐시 무효화 (source: CST-009)
  - FR7-1: use-payment-complete 훅에서 결제 완료 시 queryClient.invalidateQueries()를 호출합니다
  - FR7-2: 홈 화면 복귀 시 정규 수강생 UI가 즉시 표시됩니다 (체험 UI 잔류 방지)

## Non-Functional Requirements

### Performance

- 추가 API 호출(레슨 이력)은 기존 2개 API와 병렬 실행하여 총 로딩 시간 증가를 최소화합니다
- Suspense fallback을 적용하여 API 지연 시 사용자에게 로딩 상태를 표시합니다

### Reliability

- API 3초 이상 지연 시 Suspense fallback 후 정상 렌더링 (VAL-002)
- 외부 시스템(레거시 PHP) 노쇼 처리 지연 시, 페이지 진입 시점의 최신 데이터를 조회하여 반영합니다

### Integration

- 기존 tanstack-query 캐싱 전략과 호환되어야 합니다
- FSD 아키텍처(features/widgets/entities/shared)의 의존 방향을 준수합니다
- @podo-app/design-system-temp 컴포넌트를 사용합니다

### Error Handling

- 레슨 이력 API 실패 시: 기존 4상태 분기로 fallback합니다 (체험 상세 상태 미표시)
- 수강권 조회 실패 시: 기존 동작과 동일하게 처리합니다

## QA Considerations

### 상태 판별 (High Priority)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| VAL-001 | 7상태 각각 mock 데이터로 useGreetingStatus 호출 | 올바른 TrialStatus 반환 |
| VAL-001 edge | 수강권 없음 + 체험 이력 없음 | NOT_APPLIED |
| VAL-001 edge | 체험 3회 완료 + 다음 레슨 없음 | EXHAUSTED |

### API 호출 (High Priority)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| VAL-002 | 홈 진입 시 네트워크 확인 | 3개 API 병렬 호출 |
| VAL-002 edge | API 3초 지연 | Suspense fallback 후 정상 |

### 체험 횟수 계산 (High Priority)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| VAL-003 | TRIAL_FREE 3건 완료 mock | EXHAUSTED 분기 |
| VAL-003 edge | NOSHOW 1건 + COMPLETED 2건 = 3건 | EXHAUSTED |

### 수강권 분기 (High Priority)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| VAL-004 | 정규 수강권 mock으로 진입 | 기존 4상태 UI 표시 |
| VAL-004 edge | 정규 만료 후 수강권 없음 | NO_TICKET (기존 UI) |

### 결제 전환 (Medium Priority)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| VAL-005 | 결제 완료 시뮬레이션 | 홈 복귀 시 정규 UI 즉시 표시 |
| VAL-005 edge | 결제 직후 뒤로가기 | 정규 UI 표시 |

### UI 컴포넌트 (Medium Priority)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| VAL-006 | 각 상태에서 프로그레스바 단계 확인 | 올바른 단계 활성화 |
| VAL-006 edge | 튜터 노쇼 | step 1 복귀 |
| VAL-007 | 각 상태에서 CTA 라벨 확인 | 올바른 CTA 라벨/네비게이션 |
| VAL-007 edge | LESSON_READY CTA 클릭 | 레슨룸 이동 |

### 상태 매핑 (Medium Priority)

| Case | Scenario | Expected Handling |
|------|----------|-------------------|
| VAL-008 | invoiceStatus/classState 조합 테스트 | 올바른 TrialStatus 반환 |
| VAL-008 edge | RESERVED+PREFINISH | LESSON_READY |
| VAL-009 | NOSHOW_S mock으로 진입 | STUDENT_ABSENT 카드 |
| VAL-009 edge | CANCEL_NOSHOW_T | TUTOR_NOSHOW 카드 |
| VAL-010 | RESERVED + pre_study_time>0 | step 1 활성 |
| VAL-010 edge | pre_study_time=0 | step 1, 진행률 0% |

## Event Tracking

### 홈 화면 상태 노출

| Event | Parameters | Trigger |
|-------|-----------|---------|
| home.trial_status.viewed | trial_status: TrialStatus, progress_step: number | 체험 학생이 홈 화면 진입 시 |
| home.trial_status.changed | from: TrialStatus, to: TrialStatus | 같은 세션 내 상태 전환 시 |

### CTA 클릭

| Event | Parameters | Trigger |
|-------|-----------|---------|
| home.trial_cta.clicked | trial_status: TrialStatus, cta_text: string, destination: string | 플로팅 CTA 버튼 탭 시 |
| home.trial_card.clicked | trial_status: TrialStatus, card_type: BodyContentType | 본문 카드 내 링크/버튼 탭 시 |

### 전환 이벤트

| Event | Parameters | Trigger |
|-------|-----------|---------|
| home.trial_to_regular.converted | previous_trial_status: TrialStatus | 결제 완료 후 정규 UI 전환 시 |
| home.exhausted_to_paid.clicked | remaining_free: 0 | EXHAUSTED 상태에서 유료 체험 CTA 탭 시 |

## Appendix

### Traceability Matrix

| CST-ID | Decision | IMPL-ID | CHG-IDs | VAL-ID |
|--------|----------|---------|---------|--------|
| CST-001 | inject | IMPL-001, IMPL-006 | CHG-001, CHG-006~012, CHG-013 | VAL-001 |
| CST-002 | inject | IMPL-004 | CHG-004 | VAL-006 |
| CST-003 | inject | IMPL-005 | CHG-005 | VAL-007 |
| CST-004 | inject | IMPL-002 | CHG-002 | VAL-002 |
| CST-005 | inject | IMPL-003 | CHG-003 | VAL-008 |
| CST-006 | inject | IMPL-007 | CHG-002 | VAL-009 |
| CST-007 | inject | IMPL-002 | CHG-002 | VAL-003 |
| CST-008 | invalidated | — | — | — |
| CST-009 | inject | IMPL-008 | CHG-015 | VAL-005 |
| CST-010 | inject | IMPL-001, IMPL-002 | CHG-001, CHG-002 | VAL-004 |
| CST-011 | inject | IMPL-003 | CHG-003 | VAL-010 |

### 텍스트 와이어프레임

```
┌──────────────────────────────────┐
│  TopNav                          │
├──────────────────────────────────┤
│                                  │
│  TrialProgressBar                │
│  [●신청]──[○예습]──[○레슨]──[○완료] │
│                                  │
│  ┌────────────────────────────┐  │
│  │  GreetingCard              │  │
│  │  "민수님, 안녕하세요!"       │  │
│  │  "무료 체험 레슨으로..."     │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  ContentSection            │  │
│  │  (상태별 본문 카드)          │  │
│  │  - 미신청: 체험 안내         │  │
│  │  - 대기: 예습+일정           │  │
│  │  - 입장: 튜터 정보           │  │
│  │  - 완료: 혜택 카드           │  │
│  │  - 노쇼: 복구/잔여 안내      │  │
│  │  - 소진: 유료 체험 안내      │  │
│  └────────────────────────────┘  │
│                                  │
│                                  │
├──────────────────────────────────┤
│  StickyBottom                    │
│  [   무료 체험 신청하기    ]      │
├──────────────────────────────────┤
│  GNB                             │
│  홈 | 레슨 | 예약 | AI학습 | MY  │
└──────────────────────────────────┘
```

**상태별 StickyBottom CTA 변화:**

```
NOT_APPLIED    → [무료 체험 신청하기]
WAITING        → [예습하기]
LESSON_READY   → [수업 입장하기] (pulse)
COMPLETED      → [수강권 구매하기]
TUTOR_NOSHOW   → [다시 신청하기]
STUDENT_ABSENT → [다시 예약하기]
EXHAUSTED      → [유료 체험 신청하기 · 5,000원]
```
