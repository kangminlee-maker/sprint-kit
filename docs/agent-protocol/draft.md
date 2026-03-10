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

#### Surface 생성 전 소스 주입 (필수)

Surface 생성 전에, `usage_hint: context` 또는 `usage_hint: full`로 태깅된 소스를 에이전트 컨텍스트에 주입해야 합니다.

**주입 절차:**

1. `.sprint-kit.yaml`의 `default_sources`에서 `usage_hint`가 `context` 또는 `full`인 소스를 필터링합니다.
2. 해당 소스의 **원문(full text)**을 읽어 에이전트 컨텍스트에 포함합니다.
   - `add-dir`: 파일 시스템에서 직접 읽기
   - `github-tarball`: tarball에서 관련 파일 추출 (package.json, tailwind.config.*, src/components/ 구조 등)
   - `figma-mcp`: MCP 서버를 통해 디자인 데이터 조회
3. **디자인 온톨로지는 반드시 전문(full text)을 포함합니다.** 요약·발췌하면 컴포넌트 스펙, 토큰 값, 레이아웃 규칙, 패턴 간 연결이 끊어져서 올바른 UI를 생성할 수 없습니다.

**서브 에이전트 위임 시 규칙:**
- 서브 에이전트(Agent tool)에 Surface 생성을 위임하는 경우, 디자인 온톨로지 원문을 프롬프트에 직접 포함해야 합니다.
- 온톨로지를 요약하거나 핵심 토큰만 발췌하여 전달하면 안 됩니다. 전문 포함이 불가능한 경우, 메인 에이전트가 직접 Surface를 생성해야 합니다.

**target_stack 참조:**
`.sprint-kit.yaml`의 `target_stack` 필드에 프로젝트의 기술 스택이 기록되어 있습니다. Surface 생성 시 이 스택 정보를 참조하여, PO가 실제 제품 맥락에서 판단할 수 있는 기술 선택을 해야 합니다. (예: 프로젝트가 Tailwind v3을 사용하면 v4 문법을 사용하지 않음)

```typescript
appendScopeEvent(paths, {
  type: "surface.generated",
  actor: "system",
  payload: {
    surface_type: state.entry_mode,  // "experience" | "interface"
    surface_path: "surface/preview/",
    content_hash: contentHash(surfaceContent),
    based_on_snapshot: snapshotRevision,
    ontology_sections_used: ["tokens", "components", "page_templates", ...],  // 참조한 섹션
  },
});
```

#### Surface 생성 후 시각적 검수 (필수)

experience scope에서 Surface 생성 후, 사용자에게 제시하기 전에 에이전트가 직접 렌더링 결과를 확인해야 합니다.

**검수 절차:**

1. dev 서버를 시작합니다 (아래 "dev 서버 자동 시작" 참조).
2. 서버가 기동되면 에이전트가 **빌드 오류가 없는지** 확인합니다 (`vite build` 또는 서버 로그 확인).
3. 가능한 경우 **스크린샷을 촬영**하여 디자인 온톨로지의 핵심 규칙과 비교합니다:
   - 레이아웃 패딩 (px-5 = 20px)
   - 버튼 스타일 (3-layer press 구조)
   - 타이포그래피 (font-size, weight, leading, tracking)
   - 색상 토큰 일치
4. 검수에서 발견된 문제는 즉시 수정한 뒤 사용자에게 제시합니다.
5. 검수 불가능한 환경(스크린샷 촬영 불가)에서는 `vite build` 성공을 최소 기준으로 합니다.

**Surface 생성 후 사용자에게 제시:**
생성된 surface를 사용자에게 보여주고, 피드백을 요청합니다.

**experience scope — dev 서버 자동 시작:**
1. `cd {surface_path} && npm install && npm run dev`를 background로 실행합니다.
2. 서버 시작 후 URL(예: `http://localhost:5173`)을 사용자에게 안내합니다.
3. PID를 `state/dev-server.pid`에 기록합니다.
4. 다음 상황에서 dev 서버를 종료합니다:
   - `surface.confirmed` 이벤트 기록 시
   - `redirect.to_align` 또는 `redirect.to_grounding` 발생 시
   - `scope.deferred`, `scope.rejected`, `scope.closed` 등 terminal state 진입 시
   - 새 `surface.generated` 이벤트 발생 시 (기존 서버 종료 후 재시작)
5. 재진입 시 기존 PID 파일이 있으면 해당 프로세스를 종료한 뒤 새로 시작합니다.

**Surface 프로덕션 규격 체크리스트 (best-effort):**

에이전트는 Surface 생성 시 다음 항목을 준수합니다. 이것은 에이전트 프로토콜 수준의 지침이며, compile-defense invariant가 아닙니다.

- [ ] 디자인 토큰(색상, 간격, 타이포그래피)이 소스 스캔에서 발견된 디자인 시스템과 일치
- [ ] 컴포넌트 명명 규칙이 기존 코드베이스와 동일 (예: CVA variants, Tailwind 클래스)
- [ ] 타입 정의가 기존 코드의 enum/interface를 참조 (예: `InvoiceStatus`, `TicketEventType`)
- [ ] 레이아웃이 기존 화면 템플릿(디자인 가이드 Section 3)을 따름
- [ ] MSW mock 핸들러가 실제 API 엔드포인트와 응답 구조를 반영
- [ ] UX Writing이 기존 플로우별 톤 & 매너 규칙을 준수

미준수 항목이 있으면 `constraint.discovered` (`discovery_stage: "draft_surface_gen"`) 이벤트로 기록하여 Draft Phase 2에서 처리합니다.

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

#### review verdict

사용자가 Draft Packet 전체에 대해 `review`를 선택하면:

1. 에이전트가 `/ask-review` 스킬을 호출하여 현재 Draft Packet과 constraint 목록을 리뷰합니다.
2. 리뷰 결과를 각 constraint의 `recommendation` 필드에 반영합니다.
3. Draft Packet을 재렌더링하여 다시 제시합니다.
4. `draft_packet.rendered` 이벤트를 다시 기록합니다.

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

### target.locked 이후 → Compile

target이 잠기면 compile 단계로 진행합니다.
사용자에게 안내: "모든 결정이 완료되었습니다. compile을 시작합니다."

**이벤트 기록 순서 (필수):**

1. `compile()` 순수 함수를 **먼저** 호출합니다. 실패 시 이벤트를 기록하지 않고 반환합니다 (orphaned compile.started 방지).
2. 성공 시 `compile.started` 이벤트를 기록합니다. gate-guard가 `retry_count_compile >= 3`이면 거부합니다.
3. 산출물을 `build/` 디렉토리에 저장합니다.
4. `compile.completed` 이벤트를 기록합니다.

**L3 미검증 가정 안내 (compile 성공 시):**

`compile()` 반환값의 `warnings` 필드에 L3 경고가 있으면, 사용자에게 안내합니다:

> "compile이 완료되었습니다. 단, 다음 constraint는 정책 문서에서 확인되지 않은 가정이 포함되어 있습니다:
> {warnings의 각 항목을 CST-ID + evidence_note로 나열}
>
> 이 가정이 잘못된 것으로 밝혀지면 apply 단계 이후 수정이 필요할 수 있습니다."

PO가 정책을 확인한 경우, `constraint.evidence_updated` 이벤트를 기록하여 `evidence_status`를 `verified`로 변경할 수 있습니다:

```typescript
appendScopeEvent(paths, {
  type: "constraint.evidence_updated",
  actor: "user",
  payload: {
    constraint_id: "CST-001",
    evidence_status: "verified",
    evidence_note: "schedule/policies.md 섹션 3.2에서 확인 완료",
  },
});
```

이 이벤트는 observational(상태 전이 없음)이므로 어떤 비터미널 상태에서든 기록 가능합니다.

```typescript
// 1. compile.started 기록 (gate-guard가 retry 상한 검사)
appendScopeEvent(paths, {
  type: "compile.started",
  actor: "system",
  payload: {
    snapshot_revision: latestGroundingRevision,
    surface_hash: state.surface_hash,
  },
});

// 2. compile 실행
import { compile } from "src/compilers/compile";
const result = compile({
  state,
  implementations,  // 에이전트가 코드 분석 후 작성
  changes,           // 에이전트가 코드 분석 후 작성
  brownfield,        // 에이전트가 기존 코드 스캔 결과
  surfaceSummary,    // 확정 surface 시나리오 요약
  injectValidations, // inject 결정의 검증 시나리오 (edge_cases 필수)
});

if (!result.success) {
  // defense 실패 → 구현 계획 수정 후 재시도
  // gap 발견 시 → constraint.discovered + compile.constraint_gap_found 기록
  return;
}

// 3. 파일 저장
writeFileSync(join(paths.build, "build-spec.md"), result.buildSpecMd);
writeFileSync(join(paths.build, "delta-set.json"), result.deltaSetJson);
writeFileSync(join(paths.build, "validation-plan.md"), result.validationPlanMd);

// 4. compile.completed 기록
appendScopeEvent(paths, {
  type: "compile.completed",
  actor: "system",
  payload: {
    build_spec_path: "build/build-spec.md",
    build_spec_hash: result.buildSpecHash,
    delta_set_path: "build/delta-set.json",
    delta_set_hash: result.deltaSetHash,
    validation_plan_path: "build/validation-plan.md",
    validation_plan_hash: result.validationPlanHash,
  },
});
```

**Edge case 탐색 체크리스트:**
각 inject constraint의 `InjectValidation`에 최소 1건의 `edge_cases`를 포함해야 합니다.
compile-defense가 `L2-inject-edge-case` 규칙으로 검증합니다.

탐색 기준:
- 빈 값 / null / 0 입력
- 경계값 (최소, 최대, 한도 초과)
- 동시 요청 (같은 사용자가 동시에 2개 요청)
- 되돌림 시나리오 (적용 -> 취소 -> 재적용)
- 기존 데이터와의 충돌 (마이그레이션 대상)
- 외부 시스템 장애 (MCP 타임아웃, API 오류)

**gap_found 처리:**
compile 호출 전에 에이전트가 새 constraint를 발견하면, compile을 호출하지 않고 이벤트를 기록합니다.

```typescript
// 1. constraint.discovered 먼저 기록 (참조 무결성)
appendScopeEvent(paths, {
  type: "constraint.discovered",
  actor: "system",
  payload: { constraint_id: "CST-NEW", ... },
});
// 2. compile.constraint_gap_found 기록 → constraints_resolved로 역전이
appendScopeEvent(paths, {
  type: "compile.constraint_gap_found",
  actor: "system",
  payload: {
    new_constraint_id: "CST-NEW",
    perspective: "code",
    summary: "발견된 제약 요약",
  },
});
```

**재시도 상한:** gap_found가 3회 누적되면 `compile.started`가 gate-guard에서 거부됩니다. 이 경우 `scope.deferred`로 전환하거나 `redirect.to_align`으로 방향을 재검토합니다.

### compiled → Apply

Builder가 Build Spec을 참고하여 delta-set의 변경 사항을 실제 코드에 적용합니다.

**이벤트 기록 순서:**

```typescript
// 1. apply.started 기록
appendScopeEvent(paths, {
  type: "apply.started",
  actor: "agent",
  payload: { build_spec_hash: result.buildSpecHash },
});

// 2. delta-set.json의 각 CHG를 순서대로 적용
// - create: 파일 생성
// - modify: 파일 수정
// - delete: 파일 삭제

// 3-A. 구현 중 미결정 edge case 발견 시
appendScopeEvent(paths, {
  type: "constraint.discovered",
  actor: "system",
  payload: { constraint_id: "CST-NEW", ... },
});
appendScopeEvent(paths, {
  type: "apply.decision_gap_found",
  actor: "agent",
  payload: { new_constraint_id: "CST-NEW", description: "발견된 문제 설명" },
});
// → constraints_resolved로 역전이. Draft에서 재결정 후 재compile 필요.

// 3-B. 구현 완료 시
appendScopeEvent(paths, {
  type: "apply.completed",
  actor: "agent",
  payload: { result: "success" },
});
```

**부분 적용 복구:** apply 도중 세션이 중단된 경우, `compiled` 상태에서 `apply.started`가 이미 기록되어 있으면 이전 apply가 중단된 것입니다. 각 CHG를 적용하기 전에 파일의 현재 상태를 확인하고, 이미 변경이 적용된 CHG는 건너뜁니다.

### applied → Validation

validation-plan의 각 VAL 항목을 수동으로 검증합니다.

**stale 검사:** validation 시작 전에 소스 해시를 비교하여 stale 여부를 확인합니다. stale이 감지되면 `snapshot.marked_stale` 이벤트를 먼저 기록합니다.

**이벤트 기록 순서:**

```typescript
// 1. validation.started 기록
appendScopeEvent(paths, {
  type: "validation.started",
  actor: "agent",
  payload: { validation_plan_hash: compiledResult.validationPlanHash },
});

// 2. 각 VAL 항목을 수동 검증
// inject: 구현이 올바르게 반영되었는지 확인
// defer: source_refs 파일이 변경되지 않았는지 확인
// override: 관련 코드 변경이 없는지 확인

// 3. validate() 순수 함수 호출
import { validate } from "src/validators/validate";

const output = validate({
  state,
  plan: compiledResult.validationPlan,
  results: [
    { val_id: "VAL-001", related_cst: "CST-001", result: "pass", detail: "차단된 튜터 0건 확인" },
    { val_id: "VAL-002", related_cst: "CST-002", result: "pass", detail: "source 파일 변경 없음" },
    // ...
  ],
  actualPlanHash: contentHash(readFileSync(join(paths.build, "validation-plan.md"))),
});

// 4. validation.completed 기록
appendScopeEvent(paths, {
  type: "validation.completed",
  actor: "agent",
  payload: {
    result: output.result,
    pass_count: output.pass_count,
    fail_count: output.fail_count,
    items: output.items,
  },
});
```

**검증 결과 표시:** validation.completed 후 scope.md에 검증 결과가 반영됩니다. PO에게는 제품 관점의 요약이 표시됩니다.

**validation 실패 시:**
- `constraints_resolved`로 역전이합니다.
- PO에게 실패 항목과 관련 constraint가 scope.md에 표시됩니다.
- 해당 constraint에 대해 재결정이 필요합니다.

**validation 재시작:** applied 상태에서 `validation.started`가 이미 존재하면, 다시 기록하고 검증을 처음부터 수행합니다. `validation.started`는 self-transition이므로 중복 기록이 허용됩니다.

### validated → Closed

validation이 모두 통과하면 `validated` 상태가 됩니다.

**PO 확인 후 종료:** scope.md에 검증 결과 요약이 표시됩니다. PO가 확인한 후 종료합니다.

```typescript
appendScopeEvent(paths, {
  type: "scope.closed",
  actor: "user",
  payload: {},
});
```

사용자에게 안내: "모든 검증이 통과했습니다. 결과를 확인하시고, 종료하려면 '완료'라고 말씀해 주세요."

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
