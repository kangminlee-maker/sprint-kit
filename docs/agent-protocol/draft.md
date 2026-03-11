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

**판단 충분성 확인 (필수):**
`surface.confirmed` 이벤트를 기록하기 전에, 에이전트는 PO에게 확인을 요청합니다:

> "다음 시나리오의 방향성을 판단하기에 충분했는지 확인합니다:
> {시나리오 목록 요약}
>
> 각 시나리오의 방향이 맞습니까?"

이 확인은 Surface의 구현 품질을 검증하는 것이 아닙니다. Surface는 "판단 도구"이므로, PO가 이 Surface를 보고 방향을 판단할 수 있었는지를 확인하는 것입니다. PO가 명시적으로 동의한 후에만 `surface.confirmed`를 기록합니다.

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

**Policy 관점 추가 점검 (필수):**

- 각 inject 결정의 `selected_option`이 약관/정책 문서의 조항과 충돌하지 않는지 확인합니다. Policy 소스를 직접 읽어 대조합니다.
- 충돌 발견 시 `constraint.discovered` (perspective: "policy")로 기록합니다.
- 확인 완료 시 해당 constraint의 `evidence_status`를 `verified`로 갱신하고, `evidence_note`에 참조한 문서명+섹션을 기록합니다 (`constraint.evidence_updated` 이벤트 사용).
- 신규 발견 constraint는 `start.md` Step 2.5와 동일한 evidence_status 판단 기준을 적용합니다.

- Grounding에서 발견된 constraint(CST-001~)는 같은 ID로 유지
- 새로 발견된 constraint는 다음 번호 부여
- 각 constraint에 대해 `constraint.discovered` 이벤트 기록

#### Cross-Constraint Interaction Check (필수)

inject 결정이 2건 이상인 경우, Draft Packet 렌더링 전에 다음을 점검합니다:

1. **source_refs 겹침 확인**: inject 결정된 CST들의 `source_refs`가 동일 파일을 참조하는 경우, 해당 CST들의 `selected_option`이 논리적으로 양립 가능한지 확인합니다.
2. **상태값 일관성 확인**: 동일 엔티티/상태 머신을 변경하는 구현 항목들이 같은 상태값(예: DONE, CANCEL, NOSHOW)에 대해 동일한 전제를 사용하는지 확인합니다.
3. **VAL↔IMPL 정합성 확인**: VAL edge case의 `expected_result`가 관련 IMPL의 `detail`에서 도출 가능한지 확인합니다.

충돌 발견 시: PO에게 충돌 내용을 보고하고, 기존 constraint의 `selected_option`을 정밀화하여 재결정을 요청합니다. 기존 constraint로 표현할 수 없는 독립적 제약인 경우에만 별도 constraint(`constraint.discovered`)로 분리합니다.

**참고**: 이 체크는 compile-defense L2의 `L2-defer-interfere`와 목적이 다릅니다. L2는 compile 시점에 "실제 파일 수정 여부"를 검증하고, 이 체크는 Draft Packet 렌더링 전에 "결정 간 의미적 양립 가능성"을 사전 확인합니다.

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

#### 선택지 1개 constraint 안내 규칙

`options_table`에 inject 관련 옵션만 있는 constraint(실질적 대안이 없는 경우)는 다음과 같이 처리합니다:

- PO에게 "시스템이 이 방안을 권장합니다. 동의하시면 '승인'을 선택해 주세요."로 안내합니다.
- `situation` 필드에 다음 3가지를 반드시 포함합니다:
  1. **선택지가 1개인 이유**: 왜 다른 방안이 없는지 (예: "법적 요구사항으로 inject가 필수")
  2. **inject의 구체적 결과**: 이 constraint를 inject하면 구현에서 달라지는 것
  3. **미결정 세부 사항**: 이 결정으로 확정되지 않는 구현 세부 사항 (예: "음수 방지 방식은 Builder가 결정합니다")
- 관련 constraint가 있으면 CST-ID를 명시적으로 참조합니다 (예: "CST-001에서 3회 허용을 결정했으므로 이 맥락이 적용됩니다")
- 방향 자체를 바꾸고 싶다면 `modify-direction`을 선택할 수 있음을 안내합니다.

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

**compile 입력 구성 체크리스트 (필수):**

compile() 호출 전에 다음을 확인합니다:

1. 모든 inject CST에 대해 최소 1건의 `ImplementationItem`이 `related_cst`에 해당 CST-ID를 포함하는지
2. 모든 inject CST에 대해 최소 1건의 `ChangeItem`이 `related_cst`에 해당 CST-ID를 포함하는지
3. 모든 inject CST에 대해 `InjectValidation` 항목이 존재하는지
4. file_path는 일관된 형식(프로젝트 루트 기준 상대 경로)으로 기입하는지
5. 모든 IMPL에 최소 1개 CHG가 `related_impl_indices`로 참조하는지

누락 발견 시 compile()을 호출하지 않고 즉시 보완합니다.

누락 시 compile-defense가 L2 violation으로 거부합니다. violation 구조는 `{ rule: string, detail: string }` 형태입니다 (`DefenseViolation` 타입). `message` 필드는 없으므로 `violation.detail`을 참조하세요.

**compile 실패 시 PO 안내 규칙:**

compile() 호출이 실패하면 에이전트는 다음 절차를 따릅니다:
1. PO에게 실패 세부사항(violation rule, 누락 항목 등)을 **노출하지 않습니다**.
2. 반환된 `violations` 배열을 읽고 구현 계획을 수정하여 재시도합니다.
3. 성공 시에만 PO에게 "compile이 완료되었습니다"를 안내합니다.
4. 3회 초과 실패 시에만 PO에게 상황을 보고합니다: "구현 명세 생성에 반복 문제가 발생하고 있습니다. {문제 요약}"

**이벤트 기록 순서 (필수):**

1. `compile()` 순수 함수를 **먼저** 호출합니다. 실패 시 이벤트를 기록하지 않고 반환합니다 (orphaned compile.started 방지).
2. 성공 시 `compile.started` 이벤트를 기록합니다. gate-guard가 `retry_count_compile >= 3`이면 거부합니다.
3. 산출물을 `build/` 디렉토리에 저장합니다.
4. `compile.completed` 이벤트를 기록합니다.

**L3 경고 안내 (compile 성공 시):**

`compile()` 반환값의 `warnings` 필드에 L3 경고가 있으면, 사용자에게 안내합니다:

> "compile이 완료되었습니다. 단, 다음 경고가 있습니다:
> {warnings의 각 항목을 rule + CST-ID + detail로 나열}
>
> 경고가 있어도 설계 작업(compile, apply)은 계속 진행됩니다. 실제 구현/배포 전까지 해소하면 됩니다."

**정책 변경 검토 필요 항목의 clearing:**

`requires_policy_change: true` 태그가 있는 constraint의 해소 경로:

1. **검토 불필요 확인**: 법무/정책팀 검토 결과 변경이 불필요한 경우 → `constraint.evidence_updated` 이벤트 기록 (`requires_policy_change: false`, `evidence_note: "법무팀 확인: 변경 불필요 (날짜)"`)
2. **정책 변경 완료**: 약관/정책이 실제로 개정된 경우 → `constraint.evidence_updated` 이벤트 기록 (`requires_policy_change: false`, `evidence_status: "verified"`, `evidence_note: "약관 제N조 개정 완료 (날짜)"`)
3. **정책 변경 불가 → 결정 변경**: 변경이 불가한 경우 → 해당 constraint의 결정을 `defer` 또는 `override`로 변경 (`constraint.decision_recorded`)

정책 변경 검토 미완료 상태로도 설계 작업(compile, apply)은 계속 진행됩니다. 실제 구현/배포 전까지 clearing하면 됩니다.

PO가 정책을 확인한 경우, `constraint.evidence_updated` 이벤트를 기록하여 `evidence_status`를 `verified`로 변경하고 `requires_policy_change`를 `false`로 갱신할 수 있습니다:

```typescript
appendScopeEvent(paths, {
  type: "constraint.evidence_updated",
  actor: "user",
  payload: {
    constraint_id: "CST-001",
    evidence_status: "verified",
    evidence_note: "schedule/policies.md 섹션 3.2에서 확인 완료",
    requires_policy_change: false,
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

**gap_found 역전이 시 PO 안내 (필수):**

compile 또는 apply 단계에서 `constraint_gap_found` 또는 `decision_gap_found`로 역전이가 발생하면, PO에게 다음 3가지를 안내합니다:

1. **어느 단계에서 발견되었는지**: "compile(또는 apply) 단계에서 새로운 제약이 발견되었습니다."
2. **왜 이전에 발견되지 않았는지**: "이 제약은 구현 수준의 상세 분석에서 드러난 것으로, 방향/대상 수준의 탐색에서는 발견되지 않았습니다."
3. **기존 결정의 유지 여부**: "이전에 결정하신 항목들은 모두 유지됩니다. 이번에는 새로 발견된 CST-{N}에 대해서만 결정해 주시면 됩니다."

### compile.completed 직후 → PRD 생성 (필수)

compile이 성공적으로 완료된 직후, 에이전트는 PRD(Product Requirements Document)를 생성합니다.
PRD는 scope 전체 과정에서 축적된 모든 정보를 하나의 문서로 통합한 것입니다.

#### PRD 데이터 수집

에이전트는 다음 소스에서 데이터를 수집하여 PRD를 작성합니다:

| PRD 섹션 | 데이터 출처 | 수집 방법 |
|----------|-----------|----------|
| YAML Front Matter | scope 메타데이터 + `.sprint-kit.yaml` + events.ndjson | state에서 추출 + config 파일 읽기. 프로젝트 도메인 정보(서비스 유형, 엔티티 목록, enum 값 등) 포함 |
| Brownfield Sources | `sources.yaml` + brownfieldContext + brownfieldDetail | compile 입력에서 가져오기 |
| Executive Summary + Goal Metrics | `brief.md` (변경 목적, 기대 결과) | 파일 읽기 → 에이전트가 서술형으로 종합 |
| Success Criteria | `brief.md` + constraint decisions | state.constraint_pool에서 inject 결정 추출 |
| Product Scope | `align.locked` payload | state.scope_boundaries (in/out) |
| User Journeys | Align Packet scenarios + Surface scenarios | Surface 파일 + scenario_guide 읽기 |
| Domain-Specific Requirements | constraint pool (perspective: policy) + 정책 문서 | state.constraint_pool 필터링 + sources/ 파일 참조 |
| Technical Requirements | brownfieldContext + target_stack + delta-set | compile 산출물 + config |
| Functional Requirements | constraint pool (inject) → IMPL items → CHG items | build-spec Section 4 + delta-set.json |
| Non-Functional Requirements | constraint pool (recommended) + guardrails | DraftPacketContent.guardrails |
| QA Considerations | validation-plan items + edge_cases | compile 산출물 |
| Event Tracking | Surface에서 정의된 사용자 행동 이벤트 | Surface 파일 분석 |
| Traceability Matrix | CST → IMPL → CHG → VAL 체인 | compile 산출물의 ID 체인 |
| 와이어프레임 | Surface 시나리오별 텍스트 와이어프레임 | Surface 파일에서 화면 구조 추출 |

#### PRD 품질 요구사항

**User Journeys:**
- **화면 단위 식별**: 각 화면에서 사용자가 보는 것, 할 수 있는 것, 다음으로 이동하는 조건을 명시합니다. 화면 전환 시 URL 경로(`/home`, `/trial/apply`, `/subscribes/tickets` 등)와 전환 트리거를 포함합니다.
- **행동 맥락 서술**: 왜 이 행동을 하는지, 어떤 상황에서 이 화면에 도달하는지를 서술합니다. 도메인 규칙이 적용되는 지점에서는 출처(source)를 명시합니다.
- **스토리텔링 형식**: 구체적 페르소나(이름, 나이, 직업, 현재 상황)를 설정합니다. 4막 구조를 따릅니다:
  - **Opening Scene**: 사용자가 앱에 진입하는 맥락. 현재 상태(수강권 유형, 만료일, 학습 이력 등)를 자연스럽게 서술
  - **Rising Action**: 화면별 행동과 시스템 반응을 순서대로 전개. 각 화면의 핵심 UI 요소와 CTA를 구체적으로 언급. 도메인 규칙이 적용되는 시점을 자연스럽게 삽입
  - **Climax**: 핵심 행동 수행 (결제, 신청, 입장 등). 시스템 내부에서 일어나는 상태 전환을 사용자 관점으로 설명
  - **Resolution**: 결과 확인, 다음 행동. 사용자의 감정/판단("뿌듯하다", "다행이다" 등)으로 마무리
- **예외 경로**: Happy Path뿐 아니라 예외 경로(Exception Path)도 별도 Journey로 작성합니다. 노쇼, 결제 실패, 만료 등 각 예외 상황별 Journey를 포함합니다.
- **Journey 수**: Surface에서 확정된 시나리오 수 이상의 Journey를 작성합니다. 동일 시나리오라도 다른 페르소나(예: 신규 사용자 vs 재방문 사용자)로 분리할 수 있습니다.

**Functional Requirements:**
- 각 화면(페이지/뷰)별로 그룹화합니다.
- 상태별 표시 내용, 버튼 라벨과 동작, 조건 분기, 에러 상태를 빠짐없이 기술합니다.
- 각 FR은 source(어떤 constraint/결정에서 도출되었는지)를 명시합니다.
- BROWNFIELD 태그: 기존 시스템에서 이미 존재하는 기능에는 [BROWNFIELD] 태그를 붙입니다.

**YAML Front Matter:**
- 프로젝트 메타데이터: 이름, 서비스 유형, 도메인 정보 (엔티티, enum 값, 상태 목록 등)
- scope 메타데이터: scope_id, 생성일, 현재 상태, constraint 통계
- 참조 문서 목록: brief, align packet, draft packet, build spec, validation plan의 경로와 hash
- changeLog: scope 이벤트 이력의 주요 전환점 (scope.created, align.locked, surface.confirmed, compile.completed)

**모든 섹션의 상세도 균일 원칙:** 일부 섹션만 상세하고 나머지가 간략한 것은 허용하지 않습니다.

#### PRD 문서 구조

```markdown
---
# YAML Front Matter
scope_id: "{scope_id}"
version: "1.0"
status: "compiled"
created_at: "{scope.created 시점}"
compiled_at: "{compile.completed 시점}"
projectInfo:
  name: "{프로젝트명}"
  service_type: "{서비스 유형}"
  domain_entities: [엔티티 목록]
  # ... 프로젝트별 도메인 메타데이터
inputDocuments:
  brief: { path, hash }
  align_packet: { path, hash }
  draft_packet: { path, hash }
  build_spec: { path, hash }
  validation_plan: { path, hash }
constraintSummary:
  total: N
  inject: N
  defer: N
  override: N
  invalidated: N
changeLog:
  - { event: "scope.created", date, summary }
  - { event: "align.locked", date, summary }
  - { event: "surface.confirmed", date, summary }
  - { event: "compile.completed", date, summary }
---

# Product Requirements Document — {제목}

## Brownfield Sources
{소스 목록 + 각 소스에서 발견한 핵심 정보}

## Executive Summary
{brief의 변경 목적과 기대 결과를 서술형으로 종합}

### Goal Metrics
| Metric | Current | Target |

## Success Criteria
### User Success / Business Success / Technical Success
### Measurable Outcomes

## Product Scope
### Phase 1: {scope명}
| Feature | Description | Related FRs |

## User Journeys
### Journey N: {제목} (Happy Path / Exception Path)
**Persona:** {이름} ({나이}, {직업}, {상황})
**Opening Scene:** {도입 — 어떤 맥락에서 앱에 진입하는가}
**Rising Action:** {전개 — 화면별 행동과 반응, URL 경로 포함}
**Climax:** {절정 — 핵심 행동 수행}
**Resolution:** {결말 — 결과 확인, 다음 행동}

## Domain-Specific Requirements
### {규칙 제목} (source: {출처})

## Technical Requirements
### Tech Stack Status / API Requirements / Component Structure

## Functional Requirements
### {화면/페이지명}
- **FR{N}:** {요구사항} (source: CST-{N}) [BROWNFIELD]
  - FR{N}-1: {하위 항목}

## Non-Functional Requirements
### Performance / Reliability / Integration / Security / Error Handling

## QA Considerations
### {QA 그룹} (Priority)
| Case | Scenario | Expected Handling |

## Event Tracking
### {이벤트 그룹}
| Event | Parameters | Trigger |

## Appendix
### Traceability Matrix
| CST-ID | Decision | IMPL-ID | CHG-IDs | VAL-ID |
### 텍스트 와이어프레임
```

#### PRD 저장 및 이벤트 기록

```typescript
// 1. PRD 마크다운 생성 (에이전트가 위 구조에 따라 데이터를 조합하여 작성)
const prdMarkdown = "--- \n..."; // 에이전트가 직접 작성

// 2. build/ 디렉토리에 저장
writeFileSync(join(paths.build, "prd.md"), prdMarkdown);

// 3. prd.rendered 이벤트 기록
appendScopeEvent(paths, {
  type: "prd.rendered",
  actor: "agent",
  payload: {
    prd_path: "build/prd.md",
    prd_hash: contentHash(prdMarkdown),
    build_spec_hash: result.buildSpecHash,
    section_count: 14,  // PRD에 포함된 섹션 수
  },
});
```

#### PRD 생성 실패 시

PRD 생성은 관찰적 활동입니다. 실패해도 상태 전이에 영향을 주지 않으며, apply 단계로 진행할 수 있습니다.
실패 시 PO에게 "PRD 생성 중 문제가 발생했습니다. apply는 정상 진행됩니다."로 안내합니다.

### compiled → Apply

Builder가 Build Spec을 참고하여 delta-set의 변경 사항을 실제 코드에 적용합니다.

**Apply Gate (필수):**

`apply.started` 이벤트는 `.sprint-kit.yaml`에 `apply_enabled: true`가 명시적으로 선언된 경우에만 허용됩니다. 이 설정이 없으면 gate-guard가 이벤트를 거부합니다.

```yaml
# .sprint-kit.yaml
apply_enabled: true  # 이 줄이 없으면 apply 단계 진입 불가
```

이 게이트는 sprint-kit이 실제 저장소의 코드를 수정하는 것을 구조적으로 방지합니다. PO 또는 프로젝트 관리자가 apply 단계 진행을 명시적으로 허가한 경우에만 `apply_enabled: true`를 설정합니다.

**이벤트 기록 순서:**

```typescript
// 1. apply.started 기록 (apply_enabled 필요)
appendScopeEvent(paths, {
  type: "apply.started",
  actor: "agent",
  payload: { build_spec_hash: result.buildSpecHash },
}, { apply_enabled: true }); // loadProjectConfig()에서 로드

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
