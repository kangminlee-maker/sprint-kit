# /draft — Surface 생성 및 피드백

이 문서는 `align_locked` 또는 `surface_iterating` 상태에서 사용됩니다.
이전 상태의 결정은 scope.md와 events.ndjson에 기록되어 있습니다.

## 이 단계에서 필요한 이전 산출물
- `scope.md` — 현재 상태 확인
- `build/align-packet.md` — 확정된 방향과 범위
- `.sprint-kit.yaml` — target_stack, usage_hint별 소스 목록
- `inputs/sources.yaml` — 소스 전체 목록

---

## align_locked → Surface 생성

Align에서 확정된 방향을 바탕으로 surface를 생성합니다.

**experience scope:**
- React + MSW 기반 stateful mockup 생성
- `surface/preview/` 디렉토리에 코드 작성
- `npm run dev`로 실행 가능한 상태

**interface scope:**
- Contract diff 또는 API 명세 생성
- `surface/contract-diff/` 디렉토리에 작성

### Surface 생성 전 소스 주입 (필수)

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

### Surface 생성 후 시각적 검수 (필수)

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

---

## surface_iterating → 피드백 반영

사용자 피드백을 받아 surface를 수정합니다.

**사용자 입력 형식:**
- 수정 피드백: 자유 텍스트 (예: "차단 버튼 위치를 오른쪽으로 변경해 주세요")
- 확정 선언: "확정합니다" 또는 "이것이 내가 원하는 모습입니다"

### 피드백 분류

[판정 규칙 — 피드백 분류 기본값]
아래 표의 조건에 해당하면 해당 값을 사용합니다.
도메인 맥락상 표의 결과가 부적절한 경우, 근거를 명시하고 재정의할 수 있습니다.

| 조건 | 분류 |
|------|------|
| UI 위치, 크기, 색상, 텍스트 변경만 요청 | `surface_only` |
| "~해야 하나요?", "~은 어떻게 되나요?" 등 비즈니스 규칙 질문 포함 | `constraint_decision` |
| "~도 추가해 주세요", "~화면도 필요합니다" 등 to-be 범위 확장/축소 | `target_change` |
| "그 방향 말고", "처음부터 다시", 포함/제외 범위 자체 변경 | `direction_change` |

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
