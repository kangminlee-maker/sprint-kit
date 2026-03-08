# /draft Protocol

Surface를 생성/수정하고, deep constraint discovery를 수행하여 Draft Packet을 렌더링합니다.

## 입력

```
/draft
```

현재 상태에 따라 동작이 달라집니다.

## 상태별 동작

### align_locked → Surface 생성

Align에서 확정된 방향을 바탕으로 surface를 생성합니다.

**experience scope:**
- React + MSW 기반 stateful mockup 생성
- `surface/preview/` 디렉토리에 코드 작성
- `npm run dev`로 실행 가능한 상태

**interface scope:**
- Contract diff 또는 API 명세 생성
- `surface/contract-diff/` 디렉토리에 작성

```typescript
appendScopeEvent(paths, {
  type: "surface.generated",
  actor: "system",
  payload: {
    surface_type: state.entry_mode,  // "experience" | "interface"
    surface_path: "surface/preview/",
    content_hash: contentHash(surfaceContent),
    based_on_snapshot: snapshotRevision,
  },
});
```

**Surface 생성 후 사용자에게 제시:**
생성된 surface를 사용자에게 보여주고, 피드백을 요청합니다.
- experience scope: "`cd surface/preview && npm run dev`로 mockup을 확인하세요"
- interface scope: "`surface/contract-diff/`의 API 명세를 확인하세요"
- "수정이 필요하면 피드백을 주세요. 이 모습이 맞으면 '확정합니다'라고 말씀해 주세요."

### surface_iterating → 피드백 반영

사용자 피드백을 받아 surface를 수정합니다.

**사용자 입력 형식:**
- 수정 피드백: 자유 텍스트 (예: "차단 버튼 위치를 오른쪽으로 변경해 주세요")
- 확정 선언: "확정합니다" 또는 "이것이 내가 원하는 모습입니다"

**피드백 분류:**
1. `surface_only` — surface 수정만으로 해결
2. `constraint_decision` — constraint 결정이 필요
3. `target_change` — 확정된 범위 내에서 to-be 변경
4. `direction_change` — 방향 자체 변경 (Align으로 redirect)

**이벤트 기록 순서:**

사용자가 수정 피드백을 주면:

```typescript
// 1. 사용자 피드백 원문 기록
appendScopeEvent(paths, {
  type: "surface.revision_requested",
  actor: "user",
  payload: { feedback_text: "사용자 피드백 원문" },
});

// 2. 피드백 분류 기록
appendScopeEvent(paths, {
  type: "feedback.classified",
  actor: "system",
  payload: { classification, confidence, confirmed_by: "auto" },
});

// 3. surface 수정 반영
appendScopeEvent(paths, {
  type: "surface.revision_applied",
  actor: "system",
  payload: {
    revision_count: state.revision_count_surface + 1,
    surface_path: "surface/preview/",
    content_hash: contentHash(updatedSurface),
  },
});
```

**Draft Phase 1 constraint hints:**
mockup 반복 중 constraint를 발견하면 경량 힌트로 즉시 알립니다. `constraint.discovered` 이벤트를 기록하되, 사용자에게는 결정을 요청하지 않습니다 (Draft Phase 2에서 결정).

**사용자가 "이것이 내가 원하는 모습" 선언 시:**

```typescript
appendScopeEvent(paths, {
  type: "surface.confirmed",
  actor: "user",
  payload: {
    final_surface_path: "surface/preview/",
    final_content_hash: contentHash(finalSurface),
    total_revisions: state.revision_count_surface,
  },
});
```

**Convergence Safety:** align과 동일한 3/5/7 체계 적용.

### surface_confirmed → Deep Discovery + Draft Packet

확정된 surface를 기준으로 3개 관점에서 정밀 스캔합니다.

#### Deep Constraint Discovery (Draft Phase 2)

**탐색 깊이:** 대상 수준. "이 확정된 surface를 구현하면 구체적으로 어떤 제약이 있는가?"

3-Perspective 탐색 체크리스트 (`/start`와 동일 체크리스트를 확정된 surface 기준으로 재실행)

- Grounding에서 발견된 constraint(CST-001~)는 같은 ID로 유지
- 새로 발견된 constraint는 다음 번호 부여
- 각 constraint에 대해 `constraint.discovered` 이벤트 기록

#### Draft Packet 렌더링

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

#### Draft Packet 이벤트 기록

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

### Constraint 결정 수집

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

**필수 규칙:**
- `severity: required` + `decision: override` → `rationale` 필수 (비어 있으면 gate-guard가 거부)
- `decision: modify-direction` → `constraint.decision_recorded` 기록 후 즉시 `redirect.to_align` 발행. 나머지 미결정 중단

### clarify 결정 시 처리

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

### constraints_resolved → Target Lock

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

### target.locked 이후

target이 잠기면 compile 단계로 진행합니다 (Phase 5).
사용자에게 안내: "모든 결정이 완료되었습니다. compile을 시작합니다."

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
