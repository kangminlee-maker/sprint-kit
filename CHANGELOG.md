# Changelog

## 0.2.0 (2026-03-11)

Constraint 근거 검증 체계 도입. Grounding 시 정책 문서와 교차 대조하고, Compile 시 미검증 가정을 경고합니다.

### 워크플로우 변경

- **Policy Cross-Reference (Step 2.5)**: /start의 Grounding 후 정책 대조 단계 추가. 각 constraint의 evidence_status(verified/code_inferred/brief_claimed/unverified)를 설정
- **Align Packet Section 2.5**: 미검증 가정을 별도 섹션으로 PO에게 표시. 80% 이상 미검증 시 테이블 대신 단일 경고 문구
- **constraint.evidence_updated 이벤트**: PO가 정책 확인 후 evidence_status를 verified로 변경 가능 (observational, 상태 전이 없음)
- **Compile L3 안내 절차**: /draft 프로토콜에 compile warnings를 PO에게 안내하는 절차 추가

### 산출물 변경

- **Align Packet UX 개선**: 라벨 변경 ("코드에서 파악, 문서 미확인", "요청자 주장, 별도 확인 필요"), evidence_note 빈 열 시 source_refs 기반 fallback 텍스트 자동 생성
- **CompileSuccess/CompileFailure에 warnings 필드 추가**: Compile Defense L3 경고가 compile 결과에 포함되어 에이전트가 PO에게 전달 가능

### 시스템 개선

- **Compile Defense 3-layer**: 기존 2-layer(L1 Checklist + L2 Audit)에 L3 Evidence Quality Warnings 추가. L3는 non-blocking(경고만, 차단 안 함)
- **L3-unverified-inject**: required + inject + 미검증 evidence 시 경고
- **L3-state-completeness**: BrownfieldDetail.enums 값이 구현 계획에서 누락된 경우 경고
- **EvidenceStatus 타입**: verified/code_inferred/brief_claimed/unverified 4값. isEvidenceUnverified() 유틸리티
- **BrownfieldEnumDef**: BrownfieldDetail에 enums 필드 추가. 기존 시스템 enum 값 기록용
- **ConstraintEvidenceUpdatedPayload**: constraint.evidence_updated 이벤트 payload 타입

### Internal

- 44 test files, 897 tests passing (878 → 897, +19 new tests)
- L3 compile-defense tests: 5 cases (unverified/verified/severity filter/decision filter/brief_claimed)
- OBSERVATIONAL_EVENT_TYPES: 6 → 7 (constraint.evidence_updated added)
- compile-defense.ts: checkLayer3 separated from checkLayer2 (no string prefix dependency)
- compile.ts: compileDefense() now accepts optional brownfieldDetail parameter
- makeEntry test helper: evidence_status default added

## 0.1.0 (2026-03-10)

Initial npm release.

### Features

- **Full sprint lifecycle**: /start → /align → /draft → compile → apply → validate → close
- **Event sourcing kernel**: immutable event stream, reducer, gate-guard, state machine (14 states, 29 transitions)
- **3-Perspective constraint discovery**: Experience, Code, Policy — grounding + deep discovery
- **Compile Defense**: 2-layer validation (structural + semantic) with edge case enforcement
- **Renderers**: Align Packet, Draft Packet, scope.md (pure functions)
- **Source scanning**: local directories, GitHub tarball, Figma MCP, Obsidian vault
- **Stale detection**: content hash comparison with snapshot.marked_stale recovery
- **Brief parser**: structured extraction from markdown brief template
- **Convergence safety**: 3/5/7 revision limits with warning → diagnosis → blocked escalation

### AI Tool Support

- **Claude Code**: hooks (SessionStart, PostToolUse), permissions (events.ndjson protection), skills (/start, /align, /draft)
- **Usage hint**: `grounding_only` / `context` / `full` source tagging for stage-specific context injection
- **Target stack**: `.sprint-kit.yaml` records project tech stack for surface generation guidance
- **Visual QA**: `scripts/visual-qa.ts` build verification (exit 0=pass/skip, 1=fail)

### Agent Protocol

- **Source injection**: `usage_hint: context` sources re-injected at surface generation (ontology full text required)
- **Approve confirmation**: mandatory confirmation before align.locked to prevent verdict misclassification
- **Number selection**: Align Packet presents choices as numbered list (1~4) for reliable parsing
- **PO-friendly resume**: all states display Korean guidance with undecided constraint count

### Public API

- `src/index.ts` exports: executeStart, executeAlign, executeDraft, executeApply, executeClose, compile, validate, renderers, scope management, config loading
- npm package: `dist/` (compiled JS + types), `docs/`, `sources/`

### Bug Fixes

- `compile.started` snapshot_revision hardcoded to 1 → now uses `state.snapshot_revision`
- `handleLockTarget` filter mismatch with gate-guard → unified to `c.status === "decided"`
- `scan-tarball.ts` 403 rate limit vs auth distinction + GITHUB_TOKEN guidance message
- `z.record()` Zod v4 signature fix (2 args required)
- `ontology-index.ts` unknown type casting for strict mode

### Internal

- 45 source files, 44 test files, 878 tests passing
- TypeScript strict mode build (`tsc`) verified
- `ScopeState.snapshot_revision` field added (reducer preserves grounding.completed revision)
- `ScopeState.surface_path` field added (reducer preserves surface.confirmed path)
- `DiscoveryStage` extended with `draft_surface_gen`
- `SurfaceGeneratedPayload.ontology_sections_used` for audit trail
- figma-adapter.ts stale delegation documented
- stale-check.ts figma-mcp skip reason documented
