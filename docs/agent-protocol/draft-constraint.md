# /draft — Deep Discovery + Constraint 결정

이 문서는 `surface_confirmed` 또는 `constraints_resolved` 상태에서 사용됩니다.
이전 상태의 결정은 scope.md와 events.ndjson에 기록되어 있습니다.

## 이 단계에서 필요한 이전 산출물
- `scope.md` — 현재 상태, constraint pool 현황
- `surface/preview/` 또는 `surface/contract-diff/` — 확정된 Surface
- events.ndjson — constraint.discovered 이력
- `inputs/sources.yaml` — 정책 대조용 소스 목록

---

## surface_confirmed → Deep Discovery + Draft Packet

확정된 surface를 기준으로 3개 관점에서 정밀 스캔합니다.

### Deep Constraint Discovery (Draft Phase 2)

**탐색 깊이:** 대상 수준. "이 확정된 surface를 구현하면 구체적으로 어떤 제약이 있는가?"

3-Perspective 탐색 체크리스트 (`start-grounding.md`와 동일 체크리스트를 확정된 surface 기준으로 재실행)

**Policy 관점 추가 점검 (필수):**

- 각 inject 결정의 `selected_option`이 약관/정책 문서의 조항과 충돌하지 않는지 확인합니다. Policy 소스를 직접 읽어 대조합니다.
- 충돌 발견 시 `constraint.discovered` (perspective: "policy")로 기록합니다.
- 확인 완료 시 해당 constraint의 `evidence_status`를 `verified`로 갱신하고, `evidence_note`에 참조한 문서명+섹션을 기록합니다 (`constraint.evidence_updated` 이벤트 사용).
- 신규 발견 constraint는 `start-grounding.md` Step 2.5와 동일한 evidence_status 판단 기준을 적용합니다.

- Grounding에서 발견된 constraint(CST-001~)는 같은 ID로 유지
- 새로 발견된 constraint는 다음 번호 부여
- 각 constraint에 대해 `constraint.discovered` 이벤트 기록

### Brownfield 불변 제약 보강 (필수)

Surface가 확정되었으므로, Grounding에서 기록한 불변 제약을 구체화하고 누락된 항목을 추가합니다.
변경 대상 파일이 확정된 상태이므로, 해당 파일과 직접 연결된 불변 제약을 정밀하게 기록합니다.

**api_contract 유형** (최우선):
- [ ] 변경 대상 파일이 정의하는 API 엔드포인트의 응답 구조를 소스에서 직접 확인
- [ ] 해당 API를 호출하는 클라이언트(프론트엔드, 다른 서비스, 외부 연동)를 식별
- [ ] 응답 필드 중 삭제·타입 변경·구조 변경이 예정된 것이 있으면 invariant로 기록
- [ ] 클라이언트가 전제하는 필드(필수 참조)를 invariant의 `description`에 명시

**기록 원칙**:
- 변경 영향권 밖의 API는 기록하지 않음 (false positive 방지)
- `affected_files`에 API 정의 파일과 호출 파일 모두 포함
- 이미 Grounding에서 기록한 invariant는 중복 생성하지 않고 보강만 수행

### Cross-Constraint Interaction Check (필수)

inject 결정이 2건 이상인 경우, Draft Packet 렌더링 전에 다음을 점검합니다:

1. **source_refs 겹침 확인**: inject 결정된 CST들의 `source_refs`가 동일 파일을 참조하는 경우, 해당 CST들의 `selected_option`이 논리적으로 양립 가능한지 확인합니다.
2. **상태값 일관성 확인**: 동일 엔티티/상태 머신을 변경하는 구현 항목들이 같은 상태값(예: DONE, CANCEL, NOSHOW)에 대해 동일한 전제를 사용하는지 확인합니다.
3. **VAL↔IMPL 정합성 확인**: VAL edge case의 `expected_result`가 관련 IMPL의 `detail`에서 도출 가능한지 확인합니다.

충돌 발견 시: PO에게 충돌 내용을 보고하고, 기존 constraint의 `selected_option`을 정밀화하여 재결정을 요청합니다. 기존 constraint로 표현할 수 없는 독립적 제약인 경우에만 별도 constraint(`constraint.discovered`)로 분리합니다.

**참고**: 이 체크는 compile-defense L2의 `L2-defer-interfere`와 목적이 다릅니다. L2는 compile 시점에 "실제 파일 수정 여부"를 검증하고, 이 체크는 Draft Packet 렌더링 전에 "결정 간 의미적 양립 가능성"을 사전 확인합니다.

### Draft Packet 렌더링

```typescript
import { renderDraftPacket } from "src/renderers/draft-packet";

const state = reduce(readEvents(paths.events));

const content: DraftPacketContent = {
  surface_path: "scopes/.../surface/preview/",
  run_command: "cd surface/preview && npm run dev",  // experience만
  mockup_revisions: state.revision_count_surface,     // experience만
  scenario_guide: [
    {
      scenario: "시나리오명",
      start: "시작 지점",
      steps: "동작 순서",
      confirmed: "확인된 동작",
    },
  ],
  constraint_details: [
    // product_owner 항목
    {
      constraint_id: "CST-001",
      decision_owner: "product_owner",
      situation: "현재 상태 설명",
      options_table: [
        {
          choice: "inject (구체적 방식)",
          description: "이 선택이 하는 일",
          risk: "이 선택의 위험",
          reversal_cost: "낮음 — 구체적 이유",
        },
      ],
      recommendation: "추천과 근거",
    },
    // builder 항목
    {
      constraint_id: "CST-005",
      decision_owner: "builder",
      situation: "현재 상태 설명",
      builder_decision: "Builder가 결정할 사항",
      builder_judgment: "이 작업 관점에서의 판단. 되돌림 비용 포함",
      guardrail: "제품 관점 제약 조건 (있는 경우)",
    },
  ],
  guardrails: [
    "구현 시 반드시 지켜야 할 조건 목록",
  ],
  decision_questions: [
    "위 N건에 대해 각각 선택해 주세요",
  ],
};

const markdown = renderDraftPacket(state, content);
writeFileSync(join(paths.build, "draft-packet.md"), markdown);
```

### 선택지 1개 constraint 안내 규칙

`options_table`에 inject 관련 옵션만 있는 constraint(실질적 대안이 없는 경우)는 다음과 같이 처리합니다:

- PO에게 "시스템이 이 방안을 권장합니다. 동의하시면 '승인'을 선택해 주세요."로 안내합니다.
- `situation` 필드에 다음 3가지를 반드시 포함합니다:
  1. **선택지가 1개인 이유**: 왜 다른 방안이 없는지 (예: "법적 요구사항으로 inject가 필수")
  2. **inject의 구체적 결과**: 이 constraint를 inject하면 구현에서 달라지는 것
  3. **미결정 세부 사항**: 이 결정으로 확정되지 않는 구현 세부 사항 (예: "음수 방지 방식은 Builder가 결정합니다")
- 관련 constraint가 있으면 CST-ID를 명시적으로 참조합니다 (예: "CST-001에서 3회 허용을 결정했으므로 이 맥락이 적용됩니다")
- 방향 자체를 바꾸고 싶다면 `modify-direction`을 선택할 수 있음을 안내합니다.

### Draft Packet 이벤트 기록

```typescript
appendScopeEvent(paths, {
  type: "draft_packet.rendered",
  actor: "system",
  payload: {
    packet_path: "build/draft-packet.md",
    packet_hash: contentHash(markdown),
    surface_hash: state.surface_hash,
    constraint_count: state.constraint_pool.summary.total,
    required_count: state.constraint_pool.summary.required,
    recommended_count: state.constraint_pool.summary.recommended,
    invalidated_count: state.constraint_pool.summary.invalidated,
  },
});
```

---

## Constraint 결정 수집

Draft Packet을 사용자에게 보여주고, 각 constraint에 대한 결정을 요청합니다.

**사용자 입력 형식:**
각 CST-ID에 대해 결정을 선택합니다:
- `CST-001: inject (선택한 옵션명)`
- `CST-002: clarify (법무팀 확인 필요)`
- `CST-004: defer (현재 위치 유지)`

Builder 결정 항목은 PO가 guardrail을 확인하고 "승인"으로 응답합니다.

**결정 종류:** inject / defer / override / clarify / modify-direction

```typescript
appendScopeEvent(paths, {
  type: "constraint.decision_recorded",
  actor: "user",  // 또는 "agent" (builder 항목)
  payload: {
    constraint_id: "CST-001",
    decision: "inject",
    selected_option: "선택한 옵션",
    decision_owner: "product_owner",
    rationale: "결정 이유",
  },
});
```

**일괄 승인 시 재확인 (필수):**

PO가 "전부 진행" 또는 "권장대로 승인" 등 일괄 승인으로 응답하면, 에이전트는 `severity: required`인 PO 결정 항목(`decision_owner: product_owner`) 각각에 대해 선택 내용을 요약하여 되묻습니다:

> "다음 내용으로 결정하겠습니다:
> - CST-001: inject (리다이렉트 제거)
> - CST-004: defer (1회 기준으로 진행)
> - ...
>
> 맞습니까?"

Builder 결정 항목(`decision_owner: builder`)은 guardrail이 있는 항목만 개별 확인합니다. guardrail이 없는 Builder 항목은 일괄 승인을 허용합니다.

PO가 명시적으로 동의한 후에만 `constraint.decision_recorded` 이벤트를 기록합니다. 이 절차는 "의식적 일괄 승인"과 "검토 없는 일괄 승인"을 구분하기 위한 안전장치입니다.

**필수 규칙:**
- `severity: required` + `decision: override` → `rationale` 필수 (비어 있으면 gate-guard가 거부)
- `decision: modify-direction` → `constraint.decision_recorded` 기록 후 즉시 `redirect.to_align` 발행. 나머지 미결정 중단

### review verdict

사용자가 Draft Packet 전체에 대해 `review`를 선택하면:

1. 에이전트가 `/ask-review` 스킬을 호출하여 현재 Draft Packet과 constraint 목록을 리뷰합니다.
2. 리뷰 결과를 각 constraint의 `recommendation` 필드에 반영합니다.
3. Draft Packet을 재렌더링하여 다시 제시합니다.
4. `draft_packet.rendered` 이벤트를 다시 기록합니다.

---

## clarify 결정 시 처리

`clarify`를 선택하면 해소 전까지 target 잠금이 불가합니다.

```typescript
// 1. clarify 요청 기록
appendScopeEvent(paths, {
  type: "constraint.clarify_requested",
  actor: "user",
  payload: {
    constraint_id: "CST-002",
    question: "확인해야 할 질문",
    asked_to: "확인 대상 (예: 법무팀)",
  },
});
```

사용자가 외부에서 정보를 확보한 뒤 `/draft`를 다시 실행하면:

```typescript
// 2. clarify 해소 + 최종 결정 기록
appendScopeEvent(paths, {
  type: "constraint.clarify_resolved",
  actor: "user",
  payload: {
    constraint_id: "CST-002",
    resolution: "확인 결과 요약",
    decision: "inject",           // inject / defer / override / modify-direction
    selected_option: "선택한 옵션",
    decision_owner: "product_owner",
    rationale: "결정 이유",
  },
});
```

---

## constraints_resolved → Target Lock

모든 constraint가 결정되고 clarify가 0건이면:

```typescript
appendScopeEvent(paths, {
  type: "target.locked",
  actor: "system",
  payload: {
    surface_hash: state.surface_hash,
    constraint_decisions: state.constraint_pool.constraints
      .filter(c => c.status !== "invalidated")
      .map(c => ({ constraint_id: c.constraint_id, decision: c.decision })),
  },
});
```

`state.surface_hash`는 가장 최근 `surface.confirmed` 이벤트의 `final_content_hash`에서 reducer가 계산한 값입니다.

---

## 렌더링 규칙

- severity 표기: `required` → "필수", `recommended` → "권장", Builder 항목 → "(Builder 결정)"
- 정렬 순서: required → recommended, 같은 severity 내 CST-ID 오름차순
- 선택지 테이블: 선택 | 내용 | 리스크 | 되돌림 비용 (4열)
- Builder 항목: guardrail이 있으면 "위 guardrail 확인 후 승인", 없으면 "제품 관점 제약 조건 없음. 승인"
- "처리하지 않으면"은 pool의 `impact_if_ignored`에서 자동 가져옴 (에이전트가 별도 제공하지 않음)

## 오류 처리

렌더러가 에러를 throw하면 메시지에 수정 방법이 포함되어 있습니다. 메시지를 읽고 조치한 뒤 재시도하세요.

- `constraint_id not found in pool` → `constraint.discovered` 이벤트를 먼저 기록
- `decision_owner mismatch` → content의 decision_owner를 pool과 일치시키기
- `interface_extras is missing` → `AlignPacketContent`에 interface_extras 추가
