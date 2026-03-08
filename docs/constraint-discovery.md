# Constraint Discovery

## 정의

Constraint discovery는 sprint-kit의 핵심 메커니즘입니다.

시스템이 3개 관점에서 소스를 탐색하여, 사용자가 혼자서는 보지 못할 제약을 발견하고,
사용자가 더 나은 판단을 내릴 수 있도록 그 제약을 보여줍니다.

개요 및 결정 종류(inject/defer/override/clarify/modify-direction)는 `docs/architecture.md`의 Constraint Discovery 섹션을 참조하세요.

## 3-Perspective 탐색 규칙

각 관점은 소스에서 서로 다른 종류의 제약을 찾습니다.
관점은 이론적 분류가 아니라, "어디를 봐야 빠뜨린 제약을 찾을 수 있는가"를 알려주는 탐색 방향입니다.

### Experience

사용자가 보고 만지는 것에서 제약을 찾습니다.

| 탐색 대상 | 찾는 제약 | 예시 |
|-----------|----------|------|
| 화면 레이아웃 | 공간 부족, 배치 충돌 | 버튼 간격이 디자인 가이드 기준(16px)보다 좁음 |
| 사용자 흐름 | 누락된 단계, 막다른 경로 | 차단 후 돌아갈 화면이 정의되지 않음 |
| 디자인 가이드 | 가이드 위반 | 간격, 색상, 컴포넌트 규격 불일치 |
| 기존 상호작용 패턴 | 학습된 패턴과 충돌 | 삭제는 항상 모달 확인인데 차단은 즉시 실행 |

### Code

시스템이 실행하는 것에서 제약을 찾습니다.

| 탐색 대상 | 찾는 제약 | 예시 |
|-----------|----------|------|
| DB 스키마 | 저장 공간 부재, 타입 불일치 | 차단 테이블(tutor_block_list) 미존재 |
| API 계약 | 호환성 파괴, 응답 형식 변경 | 기존 앱이 새 필드를 처리하지 못함 |
| 모듈 의존성 | 순환 참조, 결합도 | 매칭 엔진에 exclusion 인터페이스 없음 |
| 상태 머신 | 빠진 전이, 잘못된 상태 | 차단-해제-재차단 경로 미정의 |
| 성능 | 쿼리 복잡도, 데이터량 | 차단 목록 조회가 매칭마다 실행 → 지연 |

### Policy

규칙이 제약하는 것에서 제약을 찾습니다.

| 탐색 대상 | 찾는 제약 | 예시 |
|-----------|----------|------|
| 이용약관 | 조항 충돌 | "공정 매칭" 조항과 차단 기능 충돌 |
| 사업 규칙 | 모순, 미정의 케이스 | 차단 한도 미정의 |
| 규제·법규 | 준수 요건 | 개인정보 3년 후 삭제 의무 |
| 디자인 표준 | 브랜드·접근성 기준 | 색각이상자용 색상 대비 미달 |
| 운영 정책 | CS 워크플로, 에스컬레이션 경로 | 차단 관련 문의 처리 절차 없음 |

## Constraint Lifecycle

```text
Discover → Present → Decide → Inject → Verify
               ↘ Invalidate (시스템 자동, redirect 후 re-discovery 시)
```

### 1. Discover

시스템이 소스를 탐색하여 제약을 발견하고, constraint_id를 부여합니다.

| 항목 | 내용 |
|------|------|
| **수행자** | System |
| **입력** | Reality Snapshot(현재 시스템 상태를 3개 관점에서 스캔한 결과) + 현재 단계의 맥락 (방향 또는 확정 surface(사용자가 확정한 화면/인터페이스 설계)) |
| **출력** | `constraint.discovered` 이벤트 (constraint_id 포함) |

발견 시점에 따라 탐색 깊이가 다릅니다 (아래 Discovery Timing 참조).

### 2. Present

발견된 제약을 사용자에게 보여줍니다.

| 항목 | 내용 |
|------|------|
| **수행자** | System (렌더러 — 산출물을 생성하여 보여주는 모듈) |
| **입력** | 발견된 constraint + 현재 맥락 |
| **출력** | Align Packet의 Tension 섹션, 또는 Draft Packet의 결정 항목 섹션 |

**표현 형식:**

| 산출물 | 형식 |
|--------|------|
| Align Packet (Tension) | 이것이 무엇인가 → 왜 충돌하는가 → 처리하지 않으면 → 변경 규모 |
| Draft Phase 1 (hint) | 한 줄 알림. 결정 요청 없음 |
| Draft Packet (결정 항목) | 상황 → 처리하지 않으면 → 선택지 (내용, 리스크, 되돌림 비용) → 추천 |

Draft Packet의 선택지(options)는 렌더링 시점에 생성됩니다.
발견된 제약 데이터 + 확정 surface + Reality Snapshot을 조합하여 구체적 선택지를 만듭니다.

### 3. Decide

사용자(또는 Builder)가 각 제약에 대해 결정합니다.

| 항목 | 내용 |
|------|------|
| **수행자** | Product Owner 또는 Builder (`decision_owner`에 따라) |
| **입력** | 제시된 제약 + 선택지 |
| **출력** | `constraint.decision_recorded` 또는 `constraint.clarify_requested` 이벤트 |
| **결정 종류** | inject / defer / override / clarify / modify-direction |

`modify-direction`을 선택하면 `constraint.decision_recorded`(decision: "modify-direction")가 기록된 뒤, 즉시 `redirect.to_align` 이벤트가 발행됩니다.
나머지 미결정 constraint에 대한 결정은 중단됩니다. Align 복귀 후 재진입 시 다시 결정합니다.

### 4. Inject

결정된 제약을 Build Spec에 반영합니다.

| 항목 | 내용 |
|------|------|
| **수행자** | System (컴파일러 — 확정된 결정을 Build Spec으로 변환하는 모듈) |
| **입력** | 모든 결정된 constraint + 확정 surface |
| **출력** | Build Spec |
| **규칙** | inject → Build Spec에 반영 필수. defer/override → Build Spec에 제외 이유 기록 |

Compile Defense(체크리스트 + 감사 통과)가 누락과 왜곡을 잡습니다 (`docs/architecture.md` 참조).

### 5. Verify

구현 결과가 제약 결정을 올바르게 반영했는지 검증합니다.

| 항목 | 내용 |
|------|------|
| **수행자** | System (검증기 — 구현 결과가 Build Spec과 일치하는지 확인하는 모듈) |
| **입력** | 구현 결과 + Build Spec + constraint 결정 목록 |
| **출력** | 검증 결과 (pass / fail + 상세) |
| **검증 내용** | inject → 구현에 반영되었는가. override → 의도대로 무시되었는가. defer → 구현이 간섭하지 않는가 |

## Discovery Timing

Constraint Lifecycle(Discover→Present→Decide→Inject→Verify)은 개별 constraint의 생애이고,
Discovery Timing은 scope 진행 단계별 발견 시점입니다. 두 축은 독립적입니다.

| 단계 | 시점 | 탐색 범위 | 깊이 | 결과 |
|------|------|----------|------|------|
| Grounding | `/start` 실행 시 | 모든 소스, 3 관점 | 방향 수준. 큰 충돌만 | Align Packet의 Tension |
| Draft Phase 1 | mockup 반복 중 | 관련 관점 | 경량. 발견 즉시 알림 | constraint hint (결정 불요) |
| Draft Phase 2 | surface 확정 후 | 모든 소스, 3 관점 | 대상 수준. 확정 surface 기준 정밀 스캔 | Draft Packet의 결정 항목 |
| Compile | compile 실행 중 | Build Spec 기준 | 구현 수준. 빠진 제약 발견 | `compile.constraint_gap_found` |
| Apply | 구현 적용 중 | 구현 결과 기준 | 실행 수준. Builder 에스컬레이션 | `apply.decision_gap_found` |

**탐색 깊이 설명:**
- **방향 수준** — "이 방향으로 가면 어떤 큰 충돌이 있는가?"를 찾습니다. 구체적 surface가 없으므로 방향과 범위 기준으로 탐색합니다.
- **대상 수준** — "이 확정된 surface를 구현하면 구체적으로 어떤 제약이 있는가?"를 찾습니다. 확정 surface가 있으므로 정밀 스캔이 가능합니다.

### 단계 간 연속성

Grounding에서 발견된 제약(예: CST-001)은 Draft Phase 2에서 같은 ID로 다시 평가됩니다.
확정 surface를 기준으로 더 구체적인 선택지가 생성됩니다.
새 이벤트가 발행되는 것이 아니라, 렌더러가 기존 제약을 현재 맥락에 맞게 표현합니다.

Phase 1에서 발견된 제약은 `constraint.discovered` 이벤트로 기록되지만,
사용자에게는 경량 힌트로 표시됩니다 (결정 요청 없음).
이를 통해 Gate 2에서 처음 듣는 제약을 최소화합니다.
Phase 1에서 발견된 constraint도 Phase 2에서 반드시 결정해야 합니다 (`constraints_resolved` 전이 조건).

Compile이나 Apply에서 새 제약이 발견되면 프로세스 실패입니다.
발생 시 `constraint.discovered`를 자동 선행 발행한 뒤 gap_found 이벤트를 기록하고,
scope를 `constraints_resolved`로 되돌립니다 (`docs/event-state-contract.md` 참조).

### Redirect 후 Constraint 관리 (Invalidation)

`modify-direction` 결정으로 Align에 복귀하면, 기존 constraint는 Constraint Pool에 그대로 남습니다.

Align 재진입 후 Draft Phase 2에서 deep discovery가 다시 실행될 때, 시스템이 기존 constraint를 새 방향 기준으로 자동 재평가합니다:
- 여전히 유효한 constraint: 같은 ID로 유지. 렌더러가 새 맥락에 맞게 표현
- 더 이상 관련 없는 constraint: 시스템이 `constraint.invalidated` 이벤트 발행 (자동 제외)
- 새로 발견된 constraint: 새 ID 부여 (기존 번호 이어서)

사용자에게는 유효한 constraint만 결정 항목으로 제시됩니다.
무효화된 항목은 Draft Packet에 "시스템이 제외한 항목" 섹션으로 별도 표시되며, 사용자가 확인할 수 있습니다.

모든 유효 constraint에 대해 결정이 완료되어야 `constraints_resolved`로 전이됩니다.
(`constraint.invalidated` 처리된 항목은 결정 불필요)

#### Invalidation 조건

| 규칙 | 내용 |
|------|------|
| **발행 주체** | System (actor: system). 사용자 결정이 아님 |
| **발행 시점** | redirect.to_align 이후 re-discovery 단계에서만 |
| **reason 필수** | `reason` 필드에 무효화 근거를 반드시 기록 |
| **required 보호** | `required` severity constraint는 시스템 단독 무효화 금지. Draft Packet에 "제외 제안"으로 표시하고 사용자 확인 후 확정 |
| **사용자 재활성화** | 사용자가 무효화에 동의하지 않으면 해당 constraint를 결정 항목으로 복원 가능 |

## constraint_id 규칙

| 규칙 | 설명 |
|------|------|
| **형식** | `CST-{NNN}` (예: CST-001, CST-002) |
| **범위** | scope 내 순차 부여. 각 scope는 001부터 시작 |
| **부여 시점** | `constraint.discovered` 이벤트 발행 시 |
| **불변** | 한 번 부여된 ID는 변경되지 않음 |
| **고유** | scope 내에서 중복 없음 |
| **추적** | 동일 ID가 모든 산출물을 관통: Align Packet → Draft Packet → Build Spec → delta-set.json → validation-plan.md |

compile이나 apply에서 새 제약이 발견되면, 현재 scope의 다음 번호가 부여됩니다.
(예: CST-008까지 있으면 CST-009)

## Severity 분류

| 분류 | 의미 | 기준 |
|------|------|------|
| `required` (필수) | 이것 없이 기능 불능 또는 규정 위반 | 기능 작동 불가, 데이터 손실, 법규 위반, 보안 취약점 |
| `recommended` (권장) | 처리하면 더 좋지만 기능은 작동 | UX 개선, 성능 최적화, 유지보수 편의, 정책 모범사례 |

severity는 시스템이 발견 시점에 판단합니다.
사용자가 동의하지 않으면 Draft에서 override 또는 defer로 결정할 수 있습니다.
단, `required` severity의 constraint를 `override`할 때는 `rationale`(이유)이 필수입니다.
gate guard가 `required` + `override` 조합에서 `rationale`이 비어 있으면 거부합니다.

## Decision Owner

| 소유자 | 결정 대상 | 예시 |
|--------|----------|------|
| `product_owner` | 제품·사업 판단이 필요한 제약 | 차단 한도, 약관 변경, 매칭 정책 |
| `builder` | 구현 방식 판단이 필요한 제약 | DB 테이블 구조, API 설계, 인덱스 전략 |

Builder 결정 항목도 Draft Packet에 포함됩니다.
시스템은 장단점과 추천을 안내하되, 최종 결정은 Builder에게 위임합니다.

Builder 결정 항목에 포함되는 정보:
- Builder가 결정할 사항 (무엇을 결정해야 하는지)
- 이 작업 관점에서의 판단 (시스템의 맥락과 추천)
- 되돌림 비용

## Clarify 흐름

`clarify`는 "지금 판단할 수 없다 — 추가 정보가 필요하다"를 의미합니다.

### 흐름

```text
사용자가 clarify 선택
  → constraint.clarify_requested 이벤트
  → 해당 constraint는 clarify_pending 상태
  → compile 차단 (clarify 항목이 있으면 target.locked 불가)
  → 사용자 또는 외부에서 정보 확보
  → 사용자가 결정
  → constraint.clarify_resolved 이벤트 (최종 결정 포함)
```

### 규칙

| 규칙 | 내용 |
|------|------|
| **차단** | clarify_pending 항목이 1건이라도 있으면 `target.locked` 전이 불가 |
| **해소** | `clarify_resolved` 시 반드시 최종 결정(inject/defer/override) 포함 |
| **정체 촉구** | 모든 constraint가 decided 또는 clarify_pending이고, clarify_pending이 1건 이상이면 시스템이 해소를 촉구 |
| **대안** | 해소하지 못하면 `scope.deferred` (보류)로 전환 가능 |

## Constraint 이벤트 Payload

`docs/event-state-contract.md`에 정의된 constraint 이벤트의 payload를 확정합니다.

### constraint.discovered

```json
{
  "constraint_id": "CST-001",
  "perspective": "experience | code | policy",
  "summary": "매칭 시스템에 튜터 제외 기능 없음",
  "severity": "required | recommended",
  "discovery_stage": "grounding | draft_phase1 | draft_phase2 | compile | apply",
  "decision_owner": "product_owner | builder",
  "impact_if_ignored": "차단 버튼을 눌러도 실제 매칭에 반영되지 않습니다",
  "source_refs": [
    {
      "source": "matching-engine.ts",
      "detail": "findAvailableTutors()에 exclusion 파라미터 없음"
    }
  ]
}
```

| 필드 | 설명 |
|------|------|
| `constraint_id` | scope 내 고유 ID. 발견 시 순차 부여 |
| `perspective` | 이 제약을 발견한 관점 |
| `summary` | 한 줄 요약 |
| `severity` | `required` (필수) 또는 `recommended` (권장) |
| `discovery_stage` | 발견된 단계 |
| `decision_owner` | 누가 결정해야 하는지 |
| `impact_if_ignored` | 처리하지 않으면 일어나는 일 |
| `source_refs` | 이 제약의 근거가 된 소스 참조 목록 |

### constraint.decision_recorded

```json
{
  "constraint_id": "CST-008",
  "decision": "inject",
  "selected_option": "언어별 5명",
  "decision_owner": "product_owner",
  "rationale": "남용 방지하면서 선택권 보장"
}
```

| 필드 | 설명 |
|------|------|
| `constraint_id` | 결정 대상 constraint |
| `decision` | `inject` / `defer` / `override` / `modify-direction` 중 하나 |
| `selected_option` | 선택한 옵션 (Draft Packet에 제시된 선택지 중). 옵션이 1개면 해당 옵션 |
| `decision_owner` | `product_owner` 또는 `builder` |
| `rationale` | 결정 이유. `required` severity + `override` 시 필수, 그 외 선택 사항 |

### constraint.clarify_requested

```json
{
  "constraint_id": "CST-002",
  "question": "이용약관 제12조와 차단 기능의 충돌 여부 법무팀 확인 필요",
  "asked_to": "법무팀"
}
```

| 필드 | 설명 |
|------|------|
| `constraint_id` | clarify 대상 constraint |
| `question` | 무엇을 확인해야 하는지 |
| `asked_to` | 누구에게 확인해야 하는지 (참고 정보) |

### constraint.clarify_resolved

```json
{
  "constraint_id": "CST-002",
  "resolution": "법무팀 확인: 예외 조항 추가 필요",
  "decision": "inject",
  "selected_option": "예외 조항 추가",
  "decision_owner": "product_owner",
  "rationale": "법무팀 확인 결과 예외 조항이 필요"
}
```

| 필드 | 설명 |
|------|------|
| `constraint_id` | 해소된 constraint |
| `resolution` | 확인 결과 요약 |
| `decision` | 해소 후 최종 결정 (`inject` / `defer` / `override`) |
| `selected_option` | 선택한 옵션 |
| `decision_owner` | 결정자 |
| `rationale` | 결정 이유. `required` severity + `override` 시 필수, 그 외 선택 사항 |

### constraint.invalidated

```json
{
  "constraint_id": "CST-003",
  "reason": "방향이 '선호도 기반 매칭'으로 변경되어 버튼 레이아웃 충돌이 더 이상 해당하지 않음"
}
```

| 필드 | 설명 |
|------|------|
| `constraint_id` | 무효화 대상 constraint |
| `reason` | 시스템이 무효화한 근거 (필수) |

actor는 항상 `system`입니다. `required` severity constraint에 대해서는 시스템이 제안만 하고, 사용자 확인 후 발행됩니다.

## Constraint Pool (Materialized View — 이벤트 기록으로부터 자동 계산되는 현재 상태 요약)

`state/constraint-pool.json`의 구조입니다.
reducer(이벤트를 순서대로 읽어 현재 상태를 계산하는 함수)가 `constraint.*` 이벤트로부터 생성합니다.

```json
{
  "constraints": [
    {
      "constraint_id": "CST-001",
      "perspective": "code",
      "summary": "매칭 시스템에 튜터 제외 기능 없음",
      "severity": "required",
      "discovery_stage": "grounding",
      "decision_owner": "product_owner",
      "status": "decided",
      "decision": "inject",
      "selected_option": "매칭 시스템에 제외 기능 추가",
      "discovered_at": 5,
      "decided_at": 15
    }
  ],
  "summary": {
    "total": 8,
    "required": 3,
    "recommended": 5,
    "decided": 7,
    "clarify_pending": 1,
    "invalidated": 0,
    "undecided": 0
  }
}
```

| status 값 | 의미 |
|-----------|------|
| `discovered` | 발견됨. 결정 대기 |
| `decided` | 결정 완료 (inject / defer / override / modify-direction) |
| `clarify_pending` | clarify 요청됨. 해소 대기 |
| `invalidated` | 시스템이 re-discovery에서 관련성 소멸 판단. 결정 불필요 |

`summary.undecided`는 `status: "discovered"` 항목의 수입니다.
`discovered_at`과 `decided_at`은 해당 이벤트의 `revision` 값입니다.
결정이 수정되면 `decided_at`은 가장 최근 결정 이벤트의 `revision`으로 갱신됩니다.
