# podo-ontology 고도화 정의

> 7차 Panel Review (2026-03-22) 결과 기반. podo-backend 실측 데이터에서 발견된 gap 해소.

## 1. 현재 상태

### 보유한 것 (ontology-index.test.ts fixture 기준)

- **glossary**: 4개 엔티티 (Lesson, Tutor, Student, Ticket)
- **actions**: 4개 (AUTH-1, LEC-1, SCHEDULE-1, LEC-R1)
- **transitions**: 2개 엔티티의 상태 전이 (Lesson.invoice_status, Ticket.status)

### 7차 Panel Review에서 발견된 gap

| # | gap | 구체적 사례 | 영향 |
|---|-----|----------|------|
| 1 | **TrialLesson이 독립 엔티티로 미등록** | "체험 수업"이 Lesson의 하위 개념이지만 glossary에 없음 | "체험" 키워드로 매칭 불가 |
| 2 | **값 수준 매핑 부재** | "체험 수업" = `GT_CLASS.CITY='PODO_TRIAL'` | 엔티티 온톨로지만으로 도달 불가 |
| 3 | **Subscribe 엔티티 미등록** | 결제/구독 관련 glossary 항목 없음 | subscribe 도메인 코드 미도달 |
| 4 | **Payment 엔티티 미등록** | 결제 관련 glossary 항목 없음 | payment 도메인 코드 미도달 |
| 5 | **교차 엔티티 제약 미표현** | "수강권 ACTIVE가 아니면 수업 생성 불가" | 엔티티 간 전제 조건 관계 없음 |
| 6 | **trial 관련 actions 미등록** | TrialLectureCommandService의 액션 | 체험 수업 전용 코드 위치 미제공 |
| 7 | **DB 접두사 세대 혼재 미반영** | GT_CLASS (레거시) vs le_ticket (신규) | FK 검색 시 패턴 불일치 |

## 2. 고도화 항목

### 2-1. glossary 확장

**추가해야 할 엔티티:**

```yaml
glossary:
  # 기존 4개 유지 + 아래 추가

  - canonical: TrialLesson
    meaning: "체험 수업"
    legacy_aliases: [체험, trial, 무료 체험, free trial]
    code_entity: TrialLecture
    db_table: GT_CLASS  # WHERE CITY='PODO_TRIAL'
    fk_variants: [trialClassId]
    # 신규 필드 (아래 2-4 참조)
    value_filters:
      - column: CITY
        value: PODO_TRIAL
        description: "GT_CLASS 테이블에서 CITY='PODO_TRIAL'인 레코드가 체험 수업"

  - canonical: Subscription
    meaning: "구독/수강권 결제"
    legacy_aliases: [Subscribe, 구독, 정기 결제]
    code_entity: SubscribeMapp
    db_table: le_subscribe_mapp
    fk_variants: [subscribeMappId, subscribeId]

  - canonical: Payment
    meaning: "결제"
    legacy_aliases: [결제, Card, 카드]
    code_entity: Card
    db_table: GT_CARD
    fk_variants: [cardId, paymentId]

  - canonical: Coupon
    meaning: "쿠폰"
    legacy_aliases: [쿠폰, 할인]
    code_entity: Coupon
    db_table: le_coupon
    fk_variants: [couponId, couponTemplateId]
```

### 2-2. actions 확장

**추가해야 할 액션:**

```yaml
write_actions:
  # 기존 3개 유지 + 아래 추가

  - id: TRIAL-1
    name: CreateTrialLecture
    display_name: "체험 수업 생성"
    domain: lecture
    actor: Student
    target_entities: [TrialLesson, Ticket, Subscription]
    source_code: "TrialLectureCommandServiceImpl.createTrialLecture()"

  - id: TRIAL-2
    name: ChangeTrialLevel
    display_name: "체험 수업 레벨 변경"
    domain: lecture
    actor: Student
    target_entities: [TrialLesson]
    source_code: "TrialLectureCommandServiceImpl.changeTrialClassLevel()"

  - id: PAY-1
    name: ProcessTrialPayment
    display_name: "체험 수업 결제 처리"
    domain: payment
    actor: System
    target_entities: [TrialLesson, Payment, Ticket]
    source_code: "TrialPaymentProcessor.processPayment()"

  - id: SUB-1
    name: CreateSubscription
    display_name: "구독 생성"
    domain: subscribe
    actor: Student
    target_entities: [Subscription, Payment]
    source_code: "SubscribeServiceImpl.createSubscription()"

  - id: TICKET-1
    name: ActivateTicket
    display_name: "수강권 활성화"
    domain: ticket
    actor: System
    target_entities: [Ticket]
    source_code: "TicketService.activate()"
```

### 2-3. transitions 확장

**추가해야 할 상태 전이:**

```yaml
entities:
  # 기존 Lesson, Ticket 유지 + 아래 추가/확장

  - name: TrialLesson
    state_fields:
      - field_name: trial_status
        transitions:
          - id: TL1
            from: null
            to: CREATED
            trigger: "학생이 체험 수업 시작"
            source_code: "TrialLectureCommandServiceImpl.createTrialLecture()"
          - id: TL2
            from: CREATED
            to: COMPLETED
            trigger: "체험 수업 완료"
            source_code: "UserGateway.setTrialClassCompYn()"
          - id: TL3
            from: COMPLETED
            to: CONVERTED
            trigger: "정규 수강으로 전환"
            source_code: "SubscribeServiceImpl.convertTrialToRegular()"

  - name: Subscription
    state_fields:
      - field_name: subscribe_status
        transitions:
          - id: S1
            from: null
            to: TRIAL
            trigger: "체험 구독 시작"
            source_code: "PaymentGateway.processTrialPayment()"
          - id: S2
            from: TRIAL
            to: ACTIVE
            trigger: "정규 구독 전환"
            source_code: "PaymentGateway.processRegularPayment()"
```

### 2-4. 신규 스키마: 값 수준 매핑 (value_filters)

7차 Panel Review onto_pragmatics가 발견한 핵심 gap. "체험 수업"이 별도 테이블이 아니라 **컬럼 값**으로 구분된다.

```yaml
# GlossaryEntry 타입 확장 제안
value_filters:
  - column: string     # "CITY"
    value: string      # "PODO_TRIAL"
    description: string  # 설명
```

**적용 대상:**

| 엔티티 | 테이블 | 컬럼 | 값 | 의미 |
|--------|--------|------|-----|------|
| TrialLesson | GT_CLASS | CITY | PODO_TRIAL | 체험 수업 |
| TrialTicket | GT_CLASS_TICKET | EVENT_TYPE | PODO_TRIAL | 체험 수강권 |
| TrialPayment | (Payment 내) | EVENT_TYPE | PODO_CARD_TRIAL | 체험 결제 |

이 매핑이 있으면, `queryOntology()`가 "체험 수업" 매칭 시 `PODO_TRIAL`이라는 값을 함께 반환할 수 있다. 에이전트가 코드에서 이 값을 검색하여 관련 쿼리를 찾는 단서로 활용한다.

### 2-5. 교차 엔티티 제약 (guards)

6차 Panel Review onto_logic #1에서 지적된 gap. 엔티티 간 전제 조건 관계.

```yaml
# 신규 YAML 섹션 제안
guards:
  - id: G1
    name: "체험 완료 여부 판정"
    description: "체험 수업 완료 판정이 boolean(Y/N)으로 되어 있어 3회 체험과 불일치 가능"
    source_entities: [TrialLesson]
    target_entities: [Subscription]
    condition: "hasCompletedTrialClass === true"
    source_code: "UserGateway.java:70-76"

  - id: G2
    name: "중복 티켓 검증"
    description: "활성 티켓이 1개 초과이면 에러 발생"
    source_entities: [Ticket]
    target_entities: [TrialLesson]
    condition: "activeTickets.size() <= 1"
    source_code: "TicketServiceImpl.java:137-139"
```

**이 guards는 RLM PoC에서 발견된 실제 제약과 정확히 대응합니다.** PoC가 발견한 "anyMatch 버그"(G1)와 "단일 티켓 검증"(G2)을 온톨로지에 사전 등록하면, 향후 같은 영역의 변경 시 자동으로 관련 코드에 도달합니다.

## 3. 타입 변경 영향 범위

### ontology-index.ts 확장

```typescript
export interface GlossaryEntry {
  canonical: string;
  meaning: string;
  legacy_aliases: string[];
  code_entity?: string;
  db_table?: string;
  fk_variants: string[];
  // 신규
  value_filters?: Array<{ column: string; value: string; description: string }>;
}

// 신규 타입
export interface GuardEntry {
  id: string;
  name: string;
  description: string;
  source_entities: string[];
  target_entities: string[];
  condition: string;
  source_code: string;
}

export interface OntologyIndex {
  glossary: Map<string, GlossaryEntry>;
  actions: Map<string, ActionEntry>;
  transitions: Map<string, TransitionEntry[]>;
  guards: Map<string, GuardEntry>;  // 신규
}
```

### ontology-query.ts 확장

`queryOntology()` 결과에 추가:

```typescript
export interface OntologyQueryResult {
  // 기존 유지
  matched_entities: string[];
  code_locations: CodeLocation[];
  db_tables: string[];
  related_actions: ActionSummary[];
  related_transitions: TransitionSummary[];
  // 신규
  value_filters: Array<{ entity: string; column: string; value: string }>;
  related_guards: GuardSummary[];
}
```

## 4. 고도화 우선순위

| 순서 | 항목 | 이유 | 영향 범위 |
|------|------|------|----------|
| **1** | glossary 확장 (TrialLesson, Subscription, Payment, Coupon) | "체험 수업" 검색의 전제 조건. 매칭 0건→11건 | ontology YAML만 |
| **2** | actions 확장 (TRIAL-1/2, PAY-1, SUB-1, TICKET-1) | 코드 위치(source_code) 제공 | ontology YAML만 |
| **3** | value_filters 추가 | PODO_TRIAL 등 값 수준 매핑 | ontology-index.ts 타입 확장 |
| **4** | guards 추가 | 교차 엔티티 제약 표현 | ontology-index.ts 신규 타입 |
| **5** | transitions 확장 | TrialLesson, Subscription 상태 전이 | ontology YAML만 |

**우선순위 1-2는 YAML 파일만 수정**하면 되며, 코드 변경이 불필요합니다. 기존 `buildOntologyIndex()`와 `queryOntology()`가 그대로 작동합니다.

**우선순위 3-4는 타입 확장**이 필요합니다. `GlossaryEntry`에 `value_filters` 필드 추가, `OntologyIndex`에 `guards` 추가.

## 5. 자동 생성 가능 범위

| 항목 | 자동 생성 | 수동 필요 | 근거 |
|------|----------|----------|------|
| canonical | 가능 (클래스명 추출) | - | AST 파싱 |
| code_entity | 가능 (클래스명) | - | AST 파싱 |
| db_table | 가능 (@Table 어노테이션) | - | 정규식 |
| meaning (한국어) | **수동** | 도메인 지식 필요 | "Lecture"가 "수업"이라는 것은 코드에 없음 |
| legacy_aliases | **수동** | 이력 지식 필요 | "Class"가 "Lesson"의 과거 이름이라는 것은 코드에 없음 |
| fk_variants | 부분 자동 (ORM 매핑 추적) | 관례 기반 변형은 수동 | `@JoinColumn`에서 추출 가능 |
| value_filters | **수동** | 비즈니스 규칙 | "PODO_TRIAL"이 체험 수업이라는 것은 코드 주석에만 존재 |
| guards | **수동** | 비즈니스 규칙 | 교차 엔티티 전제 조건은 도메인 전문가 지식 |
| actions.source_code | 부분 자동 (호출 그래프) | 도메인 액션 분류는 수동 | 함수 위치는 자동, "이것이 수업 생성 액션"이라는 분류는 수동 |

**핵심**: 한국어 의미(meaning), 이력 기반 별칭(legacy_aliases), 값 수준 매핑(value_filters), 교차 제약(guards)은 **도메인 전문가 지식이 필수**입니다. 이것이 온톨로지의 "사람이 넣는 가치"입니다.
