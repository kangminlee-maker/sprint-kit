# Sprint Kit: Schema-as-Ontology 재구성 가이드

> **문서 성격**: 설계 방향서. 원칙과 기대 결과를 정의한다. 구현 디테일은 정하지 않는다.
> **대상 독자**: Sprint Kit 코드베이스에서 작업하는 개발자 또는 AI 에이전트
> **전제**: 독자는 `docs/architecture.md`와 `docs/blueprint.md`를 이미 읽었다

---

## 1. 왜 이 작업을 하는가

### 현재 상태: 도메인 모델이 마크다운에만 산다

Sprint Kit은 정교한 도메인 모델을 가지고 있다. Scope, Constraint, Event, DeltaSet, BuildSpec, RealitySnapshot 등의 엔티티가 있고, 15개 상태와 전이 규칙이 있고, CST→IMPL→CHG→VAL 추적 체인이 있다.

이 모델은 `docs/blueprint.md`와 `docs/architecture.md`에 텍스트로 정의되어 있다. 코드는 이 텍스트를 **참조**하여 구현하지만, 텍스트와 코드 사이에 **구조적 연결**은 없다.

### 이것이 만드는 문제 3가지

**문제 1: 문서-코드 분리 (drift)**

blueprint.md에 "Constraint에는 severity, decision_owner, status, evidence_status가 있다"고 정의되어 있다. 코드에서 evidence_status 필드를 빠뜨려도 빌드는 성공한다. 누군가 코드에 새 필드를 추가해도 blueprint.md는 자동으로 갱신되지 않는다. 시간이 지나면 문서와 코드가 어긋난다.

Sprint Kit 자체가 "제약을 발견하여 drift를 방지하는 시스템"인데, 자신의 도메인 모델에 drift 방지 메커니즘이 없는 것은 모순이다.

**문제 2: AI 에이전트가 시스템을 이해하는 비용**

AI 에이전트(Claude Code 등)가 Sprint Kit을 이해하려면 blueprint.md(수천 줄)를 읽어야 한다. 매 세션마다 이 비용이 반복된다. 엔티티 간 관계를 파악하려면 텍스트 전체를 스캔해야 한다.

스키마가 있으면 에이전트는 자동 생성된 구조화된 지도(ontology map)를 읽는다. 엔티티, 필드, 관계, enum 값이 기계가 파싱할 수 있는 형태로 제공된다. 컨텍스트 윈도우 소모가 줄고 이해 정확도가 올라간다.

**문제 3: 추적 체인이 런타임에서만 검증된다**

CST→IMPL→CHG→VAL 추적 체인은 Compile Defense L1-2에서 런타임에 검증된다. 스키마 수준에서 관계가 정의되면, 존재하지 않는 CST-ID를 참조하는 IMPL을 만드는 것 자체가 타입 오류가 된다. 검증이 "실행해 봐야 잡히는 것"에서 "작성 시점에 잡히는 것"으로 이동한다.

### 목표: 스키마가 곧 온톨로지

하나의 스키마 정의에서:
- DB 테이블/관계가 생성된다 (데이터 저장)
- TypeScript 타입이 생성된다 (코드 안전성)
- AI용 온톨로지 맵이 생성된다 (에이전트 이해)
- 파일시스템 구조가 스키마의 도메인과 대응한다 (탐색 비용 0)

스키마를 변경하면 타입이 깨지고, 빌드가 실패하고, 온톨로지 맵이 재생성된다. "따라 주세요"가 아니라 "따르지 않으면 작동하지 않습니다"가 된다.

---

## 2. 핵심 개념: 3종 컨텍스트

이 재구성은 AI 에이전트가 시스템을 이해하는 데 필요한 지식을 3가지로 분류하는 것에서 출발한다.

### 2.1 System Ontology — "이 시스템이 무엇으로 구성되어 있는가"

엔티티, 필드, 관계, 상태, 전이 규칙의 총합이다. Sprint Kit에서:

- Scope, Constraint, Event, Intent, RealitySnapshot, ConstraintPool, VerdictLog, DeltaSet, BuildSpec 등의 엔티티
- 15개 상태와 State × Event 전이 매트릭스
- severity, decision_owner, status, evidence_status 등의 enum
- CST→IMPL→CHG→VAL 추적 체인의 관계

**현재**: blueprint.md의 텍스트와 표에 흩어져 있다.
**재구성 후**: 스키마 파일(Prisma, Drizzle 등)에 정의된다. 이것이 single source of truth이다.

**drift 특성**: 시스템을 변경할 때마다 스키마도 함께 변경한다. 스키마와 코드가 타입 시스템으로 연결되어 있으므로 불일치 시 빌드가 실패한다. drift가 구조적으로 억제된다.

### 2.2 Domain Knowledge — "이 시스템이 작동하는 원리"

해당 분야의 원칙과 판단 기준이다. Sprint Kit에서:

- 3 Perspectives(Experience/Code/Policy)의 정의와 각각이 드러내는 것/숨기는 것
- Constraint Discovery의 규칙 (언제, 어떤 깊이로, 무엇을 찾는가)
- Compile Defense의 3단계 규칙 (L1 Checklist, L2 Audit, L3 Evidence Quality)
- GC-001~022 Global Constraints
- Convergence Safety의 3/5/7 임계값과 작동 원리
- Feedback Classification 규칙 (surface_only / constraint_decision / target_change / direction_change)

**현재**: blueprint.md §2, §3, §7에 텍스트로 정의되어 있다.
**재구성 후**: `knowledge/` 디렉토리에 주제별 파일로 분리된다. 각 파일은 스키마의 엔티티를 명시적으로 참조한다.

**drift 특성**: 거의 변하지 않는다. 3 Perspectives 정의나 Compile Defense 규칙은 시스템의 근본 원리이다. 주기적 검토로 충분하다. 단, 새로운 GC가 추가되거나 기존 GC가 변경되면 해당 knowledge 파일을 갱신해야 한다.

### 2.3 User Behavior — "이 사용자가 어떤 패턴으로 행동하는가"

PO의 반복적 피드백 패턴, 자주 발생하는 Revise 유형, Convergence Safety 발동 이력 등이다.

**현재**: events.ndjson에 원시 데이터로 축적되어 있다.
**재구성 후**: v1에서는 명시적으로 관리하지 않는다. events.ndjson 분석으로 파악 가능하다는 것만 인지한다. v2에서 패턴 추출을 고려할 수 있다.

**drift 특성**: 사용자가 피드백할 때마다 자연스럽게 갱신된다.

---

## 3. 설계 원칙

### 원칙 1: 스키마가 single source of truth이다

엔티티의 정의, 필드, 관계, enum 값은 스키마 파일에만 정의한다. blueprint.md의 해당 내용은 스키마에서 생성되거나, 스키마를 참조하는 것으로 바뀐다. 동일한 정보가 두 곳에 존재하면 안 된다.

예외: 스키마로 표현할 수 없는 것(예: "왜 이 필드가 필요한가", "어떤 상황에서 이 상태 전이가 발생하는가" 같은 맥락)은 knowledge 파일에 둔다. 이때 knowledge 파일은 스키마의 엔티티 이름을 명시적으로 참조한다.

### 원칙 2: 타입이 강제하는 것과 런타임이 강제하는 것을 구분한다

| 강제 계층 | 잡는 시점 | 예시 |
|---|---|---|
| **스키마/타입** | 코드 작성 시 | 존재하지 않는 필드 참조, 잘못된 enum 값, 누락된 관계 |
| **Gate Guard** | 이벤트 발행 시 | 허용되지 않는 상태 전이, 참조 무결성, convergence 규칙 |
| **Compile Defense** | Compile 실행 시 | 추적 체인 완전성, defer 비간섭, evidence 품질 |
| **Agent Protocol** | 에이전트 판단 시 | 의미적 정합성, 정책 충돌, 선택지 완전성 |

이 재구성은 첫 번째 계층(스키마/타입)을 강화하는 것이다. 나머지 계층은 그대로 유지한다. 단, 스키마에서 관계가 정의되면 Gate Guard와 Compile Defense의 일부 검증이 중복이 될 수 있다. 중복이 발견되면, 스키마가 보장하는 것은 Gate Guard에서 제거해도 된다(방어 깊이 vs 중복 비용은 판단 사항).

### 원칙 3: 파일시스템이 도메인을 반영한다

현재 Sprint Kit의 모듈 구조(kernel/, config/, scanners/, commands/, renderers/, compilers/, validators/)는 **기술적 역할** 기반이다. 이것은 유지한다.

추가로, knowledge와 skill 파일은 **도메인** 기반으로 배치한다. Sprint Kit의 도메인은 파이프라인 단계(grounding, align, draft, compile, validate)와 관점(experience, code, policy)이다.

```
knowledge/
  perspectives/          ← 3개 관점의 정의와 탐색 규칙
    experience.md
    code.md
    policy.md
  constraints/           ← 제약 발견/결정/검증 규칙
    discovery-rules.md
    decision-rules.md
    global-constraints.md  ← GC-001~022
  compile/               ← Compile Defense 규칙
    defense-layers.md
    tracing-chain.md
  state-machine/         ← 상태 전이 규칙과 근거
    transitions.md
    stale-propagation.md
```

각 knowledge 파일은 스키마의 엔티티를 참조한다. 예:

```markdown
<!-- knowledge/constraints/discovery-rules.md -->
# Constraint Discovery 규칙

적용 대상 엔티티: `Constraint`, `RealitySnapshot`, `Scope`

## 탐색 깊이
- Grounding 단계 (`Scope.state = grounded`): 방향 수준
- Draft Phase 2 (`Scope.state = surface_confirmed`): 대상 수준

## severity 판정 기준
- `Constraint.severity = required`: 이것 없이 기능 불능 또는 규정 위반
- `Constraint.severity = recommended`: 처리하면 더 좋지만 기능은 작동
```

이렇게 하면 스키마에서 `severity` enum이 바뀔 때, knowledge 파일의 해당 참조도 갱신해야 한다는 것을 검증 스크립트로 잡을 수 있다.

### 원칙 4: 생성할 수 있는 것은 생성한다

스키마에서 자동 생성 가능한 것:

| 생성물 | 용도 | 생성 시점 |
|---|---|---|
| TypeScript 타입 | 코드 안전성 | 스키마 변경 시 |
| 온톨로지 맵 (markdown) | AI 에이전트가 시스템을 빠르게 이해 | 스키마 변경 시 |
| ER 다이어그램 (mermaid) | 관계 시각화 | 스키마 변경 시 |
| 상태 전이 다이어그램 | 상태 머신 시각화 | State enum 변경 시 |

온톨로지 맵의 형태 예시 (실제 형태는 구현 시 결정):

```markdown
# Sprint Kit Ontology Map (auto-generated)

## Entities
- **Scope**: 작업 단위. [id, type, state, intent_id, ...]
  - has many: Constraint, Event, ...
  - state enum: draft | grounded | exploring | align_proposed | ...

- **Constraint**: 발견된 제약. [id, scope_id, severity, status, evidence_status, ...]
  - belongs to: Scope
  - severity enum: required | recommended
  - status enum: undecided | decided | clarify_pending | invalidated

## Relationships
- Scope 1:N Constraint
- Constraint 1:N ImplementationItem (via CST→IMPL)
- ImplementationItem 1:N Change (via IMPL→CHG)
- Change 1:N ValidationItem (via CHG→VAL)
```

이 파일이 CLAUDE.md나 AGENTS.md에서 참조되면, AI 에이전트가 매 세션마다 blueprint.md 전체를 읽지 않아도 시스템 구조를 파악할 수 있다.

### 원칙 5: 경량을 유지한다

이 재구성은 Palantir Foundry 같은 엔터프라이즈 시스템을 만드는 것이 아니다. 파일 시스템 + 스키마 정의 + 타입 생성 + 자동 생성 스크립트로 충분하다. 새로운 런타임 의존성을 최소화한다.

Sprint Kit이 이미 사용하는 기술 스택 위에서 작업한다. 새로운 DB 서버를 도입하는 것이 아니라, 스키마 정의 도구를 추가하는 것이다. SQLite면 충분하다. 또는 스키마 정의만 하고 실제 DB 없이 타입 생성만 활용해도 된다(구현 시 판단).

---

## 4. 스키마에 담아야 할 것

blueprint.md에서 추출한 Sprint Kit의 핵심 엔티티와 관계이다. 이것이 스키마의 범위이다.

### 4.1 핵심 엔티티

**Scope** — 작업 단위
- id, type (experience | interface), state (15개 enum), created_at, updated_at
- 관계: has one Intent, has many Event, has many Constraint, has one RealitySnapshot

**Intent** — Scope의 존재 이유
- id, scope_id, problem, beneficiary, success_conditions
- Align에서 잠김 (immutable after align_locked)

**Event** — 상태 변경 기록 (추가 전용)
- id, scope_id, type (enum), revision, actor, state_before, state_after, payload, ts
- GC-012: 추가 전용, 수정/삭제 불가
- GC-013: 동일 시퀀스 → 동일 상태

**Constraint** — 발견된 제약
- id (CST-NNN), scope_id, perspective (experience | code | policy), severity (required | recommended), decision_owner (product_owner | builder), status (undecided | decided | clarify_pending | invalidated), evidence_status (verified | code_inferred | brief_claimed | unverified), decision (inject | defer | override | clarify | modify-direction), rationale, source_refs
- GC-008: required + override 시 rationale 필수

**RealitySnapshot** — 탐색 시점의 시스템 상태
- id, scope_id, source_hashes (각 소스의 content hash), scanned_at, failed_sources

**ImplementationItem** — Build Spec 내 구현 항목
- id (IMPL-NNN), scope_id, constraint_id (→ Constraint), description
- 추적 체인: CST → IMPL

**Change** — Delta Set 내 파일 변경
- id (CHG-NNN), scope_id, impl_id (→ ImplementationItem), file_path, change_type (create | modify | delete), content_hash
- 추적 체인: IMPL → CHG

**ValidationItem** — Validation Plan 내 검증 항목
- id (VAL-NNN), scope_id, change_id (→ Change), constraint_decision (inject | defer | override), verification_method, result (pass | fail | pending)
- 추적 체인: CHG → VAL

### 4.2 핵심 Enum

```
ScopeType: experience | interface
ScopeState: draft | grounded | exploring | align_proposed | align_locked |
            surface_iterating | surface_confirmed | constraints_resolved |
            target_locked | compiled | applied | validated | closed |
            deferred | rejected
Perspective: experience | code | policy
Severity: required | recommended
DecisionOwner: product_owner | builder
ConstraintStatus: undecided | decided | clarify_pending | invalidated
EvidenceStatus: verified | code_inferred | brief_claimed | unverified
ConstraintDecision: inject | defer | override | clarify | modify-direction
ChangeType: create | modify | delete
ValidationResult: pass | fail | pending
Verdict: approve | revise | reject | redirect
FeedbackScope: surface_only | constraint_decision | target_change | direction_change
Actor: user | system | agent
```

### 4.3 핵심 관계 (추적 체인)

```
Scope 1:N Constraint
Scope 1:N Event
Scope 1:1 Intent
Scope 1:1 RealitySnapshot
Constraint 1:N ImplementationItem   (CST → IMPL)
ImplementationItem 1:N Change       (IMPL → CHG)
Change 1:N ValidationItem           (CHG → VAL)
```

이 관계가 스키마의 foreign key로 정의되면, Compile Defense L1의 "모든 inject 결정이 Build Spec에 참조되어 있는가"를 쿼리 한 줄로 검증할 수 있다:

```
SELECT c.id FROM Constraint c
WHERE c.decision = 'inject'
AND c.id NOT IN (SELECT constraint_id FROM ImplementationItem)
```

결과가 비어 있으면 L1 통과이다. 이것이 현재 런타임 검증보다 명확하다.

### 4.4 State × Event 매트릭스의 스키마 표현

상태 전이 규칙은 스키마의 enum과 관계만으로는 완전히 표현할 수 없다. "align_proposed 상태에서만 align.locked 이벤트를 받을 수 있다"는 규칙은 비즈니스 로직이다.

이 부분은 스키마가 담당하지 않는다. Gate Guard가 계속 담당한다. 단, 스키마가 ScopeState와 EventType을 enum으로 정의함으로써, Gate Guard 코드가 매트릭스에 없는 상태나 이벤트 타입을 참조하는 것을 타입 시스템이 잡는다.

---

## 5. 기대 결과

### 5.1 기존 대비 개선되는 것

| 영역 | 현재 | 재구성 후 |
|---|---|---|
| **엔티티 정의** | blueprint.md 텍스트. 코드와 분리 가능 | 스키마 파일. 타입 생성으로 코드와 구조적 연결 |
| **관계 정의** | "CST→IMPL→CHG→VAL"이라는 텍스트 | foreign key. 잘못된 참조가 타입 오류 |
| **enum 값** | blueprint.md 표 + 코드의 별도 정의 | 스키마에서 한 번 정의, 타입으로 전파 |
| **AI 에이전트 이해** | blueprint.md 전체 읽기 (수천 토큰) | 자동 생성된 ontology-map 읽기 (수백 토큰) |
| **문서-코드 정합** | 수동 동기화 (drift 가능) | 빌드 시 자동 검증 (drift 시 빌드 실패) |
| **Compile Defense L1** | 런타임 검증 | DB 쿼리로 검증 가능 (+ 런타임 검증 유지 가능) |

### 5.2 변하지 않는 것

| 영역 | 이유 |
|---|---|
| **파이프라인 흐름** (Brief → Align → Draft → Compile) | 이것은 비즈니스 로직이다. 스키마와 무관 |
| **Gate Guard** | 상태 전이 규칙은 비즈니스 로직. 스키마가 enum을 강화하지만 규칙 자체는 Gate Guard가 담당 |
| **Compile Defense L2-L3** | audit pass와 evidence quality는 의미적 검증. 스키마 범위 밖 |
| **Agent Protocol** | 의미적 판단은 에이전트 영역. 스키마 범위 밖 |
| **events.ndjson 구조** | 이벤트 소싱 모델은 유지. 스키마는 이벤트의 payload 구조를 타입으로 강화할 뿐 |
| **Surface 생성 방식** | React + MSW (experience) / Contract diff (interface)는 그대로 |

### 5.3 검증 기준

재구성이 성공했는지 판단하는 기준:

1. **스키마에서 엔티티를 삭제하면 빌드가 실패하는가?** — 타입 생성이 코드에 연결되어 있으면 Yes
2. **스키마의 enum에 없는 값을 코드에서 사용하면 타입 오류가 나는가?** — Yes여야 한다
3. **추적 체인의 관계를 스키마가 강제하는가?** — ImplementationItem.constraint_id가 Constraint.id를 참조하면 Yes
4. **ontology-map이 스키마에서 자동 생성되는가?** — 수동 작성이면 결국 drift한다
5. **knowledge 파일이 스키마의 엔티티를 참조하는가?** — 엔티티 이름 변경 시 검증 가능해야 한다

---

## 6. 작업 단계 제안

구현 순서는 에이전트/개발자가 코드베이스를 보고 결정한다. 아래는 논리적 의존 순서만 제시한다.

### Phase 1: 스키마 정의

- §4에 정의된 엔티티, enum, 관계를 스키마 파일로 작성한다
- 기존 코드의 타입 정의와 대조하여 누락/불일치를 확인한다
- blueprint.md의 모든 엔티티가 스키마에 표현되었는지 체크리스트로 확인한다

이 단계의 산출물: 스키마 파일 1개 (또는 도메인별 분리)

### Phase 2: 타입 생성 연결

- 스키마에서 TypeScript 타입을 생성한다
- 기존 코드의 수동 타입 정의를 생성된 타입으로 교체한다
- 교체 후 빌드가 성공하는지 확인한다

이 단계의 산출물: 생성된 타입 파일 + 기존 타입 교체

### Phase 3: 온톨로지 맵 자동 생성

- 스키마에서 ontology-map.md를 자동 생성하는 스크립트를 만든다
- CLAUDE.md 또는 AGENTS.md에서 이 파일을 참조하도록 한다
- 생성된 맵이 blueprint.md의 §8 개념 색인과 정합하는지 확인한다

이 단계의 산출물: 생성 스크립트 + ontology-map.md

### Phase 4: Knowledge 파일 분리

- blueprint.md에서 원칙/규칙 성격의 내용을 knowledge/ 디렉토리로 분리한다
- 각 파일이 스키마의 엔티티를 명시적으로 참조하도록 한다
- blueprint.md는 knowledge 파일을 참조하는 구조로 바꾸거나, 최소한 knowledge 파일과 내용이 중복되지 않도록 한다

이 단계의 산출물: knowledge/ 디렉토리 + 파일들

### Phase 5: 검증 스크립트

- knowledge 파일이 참조하는 엔티티 이름이 스키마에 실제로 존재하는지 검증하는 스크립트를 만든다
- CI/빌드에 포함하여 자동 실행한다

이 단계의 산출물: 검증 스크립트

---

## 7. 주의사항

### 기존 events.ndjson과의 호환

Sprint Kit의 이벤트 소싱 모델은 유지해야 한다. 스키마 도입이 이벤트 구조를 깨뜨리면 안 된다. 스키마는 이벤트의 payload에 들어가는 데이터의 **타입**을 강화하는 것이지, 이벤트 저장 방식을 변경하는 것이 아니다.

실제 DB(SQLite 등)를 도입하는 것은 선택 사항이다. 스키마를 타입 생성용으로만 사용하고, 런타임 저장은 기존 events.ndjson + JSON 파일을 유지해도 이 재구성의 목표(타입 안전성, 온톨로지 맵 자동 생성, 문서-코드 정합)는 달성된다.

### blueprint.md의 위상 변화

재구성 후 blueprint.md의 역할이 바뀐다:

| 현재 | 재구성 후 |
|---|---|
| 엔티티 정의의 source of truth | 스키마가 source of truth. blueprint는 인간 가독성 문서 |
| 규칙/원칙의 source of truth | knowledge/ 파일이 source of truth. blueprint는 요약/안내 |
| 상태 전이 매트릭스의 source of truth | event-state-contract.md + 스키마 enum이 source of truth |

blueprint.md를 삭제하라는 것이 아니다. Product Owner를 위한 인간 가독성 문서로서의 역할은 유지된다. 하지만 "코드가 참조하는 정의"로서의 역할은 스키마와 knowledge 파일로 이동한다.

### 점진적 전환

한 번에 모든 것을 바꾸지 않아도 된다. Phase 1(스키마 정의)만 해도 "어떤 엔티티가 있고 어떤 관계인가"가 기계적으로 명확해진다. Phase 2(타입 생성)까지 하면 코드 안전성이 올라간다. 각 Phase가 독립적으로 가치를 제공한다.

---

## 8. Palantir Foundry에서 배운 것

이 재구성의 영감은 Palantir Foundry의 Ontology 아키텍처에서 왔다. Foundry에서는:

- Object Type을 정의하면 그것이 곧 시스템의 구조 지도(System Ontology)
- Object에 실제 데이터가 매핑되면 그것이 곧 도메인 지식(Domain Knowledge)
- Object에 Action을 정의하면 그것이 곧 절차(Skill)
- 세 층이 같은 데이터 모델 위에 있으므로, 하나를 바꾸면 나머지에 영향이 전파된다

Sprint Kit에서 이를 경량으로 재현하는 핵심:

**스키마 = 온톨로지**. Prisma/Drizzle 스키마가 Foundry의 Object Type 역할을 한다.
**Knowledge 파일이 스키마를 참조**. Foundry에서 Action이 Object Type을 참조하듯, knowledge 파일이 스키마의 엔티티를 참조한다.
**검증 스크립트가 정합성을 강제**. Foundry의 DB 스키마가 강제하는 것을, 타입 시스템 + 검증 스크립트로 모방한다.

Foundry와의 차이: Foundry는 엔터프라이즈 플랫폼이므로 실시간 데이터 바인딩, 권한 관리, 다중 온톨로지 등을 제공한다. Sprint Kit에는 이것이 필요 없다. 파일 시스템 + 스키마 + 타입 생성 + 자동 생성 스크립트로 충분하다.

---

## 부록 A: 용어 대조

이 문서에서 사용하는 용어와 Sprint Kit 기존 용어의 대응:

| 이 문서의 용어 | Sprint Kit 기존 용어 | 의미 |
|---|---|---|
| System Ontology | Domain Objects (architecture.md §Domain Objects) | 엔티티, 필드, 관계, 상태의 구조적 정의 |
| Domain Knowledge | Global Constraints + Discovery/Compile 규칙 | 시스템이 작동하는 원리와 판단 기준 |
| User Behavior | (명시적 개념 없음, events.ndjson에 내재) | PO의 행동 패턴 |
| Schema | (없음 — 텍스트 정의만 존재) | 엔티티 정의의 single source of truth |
| Ontology Map | (없음) | 스키마에서 자동 생성된 AI 에이전트용 시스템 지도 |
| Knowledge file | blueprint.md의 규칙/원칙 섹션 | 도메인 지식을 담은 독립 파일 |

## 부록 B: 이 문서와 기존 문서의 관계

| 기존 문서 | 이 문서와의 관계 |
|---|---|
| `docs/architecture.md` | 이 문서가 architecture.md의 Module Structure, Domain Objects 섹션에 영향을 준다 |
| `docs/blueprint.md` | 이 문서의 실행으로 blueprint.md의 source of truth 역할이 축소된다 (§7 참조) |
| `docs/event-state-contract.md` | 스키마의 enum 정의와 정합해야 한다. 이 문서가 직접 변경하지는 않는다 |
| `docs/constraint-discovery.md` | knowledge/constraints/에 분리 대상이다 |
| `docs/agent-protocol/` | 변경 없음. ontology-map을 참조하도록 추가 가능 |
