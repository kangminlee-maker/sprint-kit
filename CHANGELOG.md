# Changelog

## 0.3.3 (2026-03-13)

Exploration을 정식 상태(`exploring`)로 승격. 6-Agent Panel Review (6/6 합의) 기반.

### Exploration 상태 승격

- **`exploring` 상태 추가**: STATES 14 → 15개. `exploration.started`가 `grounded → exploring` forward transition을 유발
- **Exploration 이벤트 재분류**: `exploration.started`, `exploration.round_completed`, `exploration.phase_transitioned`를 observational → transition으로 이동. MATRIX의 `exploring` 행에 self-transition으로 등록
- **Gate-guard Rule 8a**: `align.proposed`는 `exploring` 상태의 MATRIX에서 구조적으로 허용. 기존 observational 기반 차단 규칙 제거 (순환 차단 문제 해소)
- **Gate-guard Rule 8b**: `exploration.round_completed`/`exploration.phase_transitioned`는 `exploration_progress`가 없으면 거부 (MATRIX + gate-guard 이중 보호)
- **Gate-guard Rule 8c**: `exploration.started` 중복 발행 차단 (exploration 진행 중이면 거부)
- **`handleResume()` 개선**: `exploring` 상태에서 Phase/Round 정보를 PO에게 직접 안내
- **scope-md 렌더러**: `exploring` 상태 라벨("요구사항 탐색 중") + Phase 정보 표시

### Exploration artifact 등록

- **exploration-log.md 공식 artifact**: `ExplorationPhaseTransitionedPayload`의 `log_path`/`log_hash`를 optional → required로 변경
- **데이터 원천 규칙 명시**: 진행 상태 = `exploration_progress`(이벤트 기반), 의미적 맥락 = `exploration-log.md`(파일 기반)

### 문서

- **blueprint.md**: §3.1.5 상태 전이 반영, §4 상태 목록 15개, GC-020/021/022, 개념 색인에 Exploration 추가
- **event-state-contract.md**: States 테이블에 `exploring` 추가, Exploration 이벤트 섹션 신설, `exploring` MATRIX 추가, Artifact Event Recording에 exploration-log.md/prd.md 추가
- **exploration.md**: 상태 전이 섹션, gate-guard 규칙, 데이터 원천 규칙, 세션 재개 절차 업데이트
- **start.md**: Path C 상태별 동작에 `exploring` 추가, Step 4.5에 상태 전이 코드 예시

### 테스트

- 44파일 1008건 (0.3.2 대비 테스트 구조 변경: observational → transition 전환으로 기존 테스트 재구성)
- Gate-guard Rule 8a/8b/8c 테스트 11건 추가
- State-machine `exploring` 행 5건 추가

## 0.3.2 (2026-03-12)

Adaptive Align, Pre-Apply Review, MCP 소스 타입 도입. Brief 없이 대화만으로 scope를 시작할 수 있는 Exploration 프로토콜 추가.

### Adaptive Align (Exploration)

- **6-Phase Exploration 프로토콜**: 목적 정밀화 → 영역 탐색 → 현재 상태 공유 → 시나리오 탐색(추출→제안→확정) → 가정 검증 → 범위 확정. 인터뷰 방법론(Contextual Inquiry, JTBD, Assumption Mapping, Story Mapping) 기반
- **Brief 없이 시작 가능**: 3가지 진입 방식 (대화만 / 간략 brief / 상세 brief). Brief는 Exploration의 산출물
- **Exploration 이벤트 3종**: `exploration.started`, `exploration.round_completed`, `exploration.phase_transitioned` (0.3.2에서 관찰 이벤트로 도입, 0.3.3에서 전이 이벤트로 승격)
- **ScopeState.exploration_progress**: Phase 진행 상태, 결정 축적, 가정 목록, Phase 이력 추적
- **Exploration Log**: `build/exploration-log.md`에 대화 전문을 실시간 append-only 기록. 이벤트에서 재생성 불가능한 "왜"의 맥락 보존
- **Gate-guard Rule 7**: `MAX_EXPLORATION_ROUNDS`(20) 초과 시 round_completed 거부
- **`EXPLORATION_SUMMARY_THRESHOLD`(5)**: 5 round 후 중간 정리 제시
- **대안 제시 패턴**: PO의 답변을 확인한 후, brownfield/온톨로지/설계 패턴 기반 대안을 제시. PO가 답하기 전에 대안을 제시하지 않음
- **영역 탐색 4가지 방법**: 엔티티 기반 Top-down, 퍼널 기반, 터치포인트 매핑, 영향 체인 역추적

### Pre-Apply Review

- **compile → apply 사이 의미적 검증**: 3관점(정책 정합성, 기존 기능 정합성, 작동 로직) 검증
- **`pre_apply.review_completed` 관찰 이벤트**: verdict(pass/gap_found) + findings(perspective별 상태)
- **`compiled` 상태에 `compile.constraint_gap_found` 전이 추가**: compile 산출물 사후 검증에서 gap 발견 시 역전이 경로
- **PRD에 Pre-Apply Review 섹션 추가**: ✓/⚠ 형식으로 3관점별 결과 표시
- **soft gate**: PO 판단권 보존. 에이전트가 발견한 충돌을 보고하고 PO가 "진행/수정" 결정

### MCP 소스 타입

- **`type: mcp` 소스 지원**: `SourceEntry`, `SourceType`, Zod 스키마, `sourceKey()`, `scanSource()`, `toGroundingSource()` 전체 지원
- **ClickHouse MCP**: `.sprint-kit.yaml`에 provider, tools, query_policy 설정. Exploration Phase 2(영역 탐색)와 Phase 5(가정 검증)에서 데이터 기반 판단 보강

### PRD 생성

- **`prd.rendered` 관찰 이벤트**: compile 완료 직후 PRD 자동 생성
- **PRD 14개 섹션 구조**: Brownfield Sources, Executive Summary, User Journeys(4막 구조), Functional Requirements, Traceability Matrix 등
- **compile → Pre-Apply Review → PRD** 순서 확정

### 테스트

- 44파일 1024건 (0.3.0 대비 +89건)
- Exploration 테스트 6건 (reducer 4 + gate-guard 2)
- State-machine 관찰 이벤트 자동 테스트 42건 추가

## 0.3.0 (2026-03-11)

Compile Defense 강화: brownfield 교차 검증, 경로 정규화, 입력 검증 보강. Panel Review 체계 정착.

### Compile Defense

- **L3-modify-not-in-brownfield**: delta-set의 modify/delete 대상 파일이 brownfield.related_files에 없으면 경고. 에이전트가 기존 코드를 스캔하지 않고 변경을 계획한 경우 탐지
- **L3-shared-resource**: 별개 CHG가 동일 파일을 다른 CST로 동시 수정 시 경고 (0.2.1에서 추가)
- **L3-invariant-uncovered**: brownfieldDetail.invariants의 영향 파일이 delta-set에서 변경되지만 구현 계획에 미언급 시 경고 (0.2.1에서 추가)
- **L3-policy-change-required**: inject constraint에 requires_policy_change=true 시 정책 변경 검토 경고 (0.2.1에서 추가)
- **normalizeFilePath 유틸**: 선행 `./` 제거, 연속 `/` 정리, 후행 `/` 제거. 기존 4개소(L2-defer-interfere, L2-override-reflected, L3-invariant-uncovered, checkLayer2 changeFilePaths) + 신규 L3에 적용
- **compileDefense 시그니처 확장**: `brownfieldContext?: BrownfieldContext` optional 파라미터 추가
- **CompileSuccess.warnings**: optional → required 변경 (0.2.1에서 변경)

### 입력 검증 강화

- **brownfield 필수 필드 검증**: `validateInput()`에 `brownfield.related_files`와 `brownfield.module_dependencies` 존재 여부 + Array 타입 검사 추가. 누락 시 명확한 에러 메시지 반환 (BUG-002 수정)
- **inject CST ↔ CHG ↔ VAL 사전 검증**: `validateInput()`에서 compile-defense 이전에 정합성 체크 (IMP-002 수정, 0.2.1)
- **compile-defense violation detail 강화**: 모든 violation에 CST-ID/IMPL-ID 포함 (IMP-001 수정, 0.2.1)

### 에이전트 프로토콜

- **Cross-constraint interaction check**: inject 2건 이상 시 source_refs 겹침, 상태값 일관성, VAL↔IMPL 정합성 점검 (draft.md)
- **선택지 1개 constraint 안내 규칙**: 단일 "승인" + situation에 3가지 필수 정보 + modify-direction 안내 (draft.md)
- **gap_found 역전이 PO 안내**: 어느 단계에서 발견, 왜 이전에 미발견, 기존 결정 유지 여부 3가지 안내 (draft.md)
- **compile 실패 PO 비노출**: violation 세부사항을 PO에게 노출하지 않고 에이전트가 자동 재시도 (draft.md)
- **일괄 승인 시 재확인**: PO가 일괄 승인 시 required constraint 각각의 선택 내용 되묻기 (draft.md)
- **Surface 확정 판단 충분성 확인**: surface.confirmed 전에 시나리오별 방향 판단 가능 여부 확인 (draft.md)
- **Deep Discovery Policy 점검 보강**: inject 결정의 selected_option을 약관/정책 문서와 교차 대조 (draft.md)

### 타입 확장

- **ImplementationItem.assumptions**: 구현 시 전제하는 가정 기록 (optional string[])
- **BrownfieldDetail.invariants**: 기존 시스템의 불변 제약 기록 + L3-invariant-uncovered 경고
- **ConstraintEntry.requires_policy_change**: 정책 변경 전제 여부 + L3-policy-change-required 경고

### 문서

- **blueprint.md**: 에이전트 신뢰 모델 명시 — 코드 강제 영역(gate-guard, compile-defense) vs 에이전트 위임 영역(프로토콜) 경계 기준
- **start.md**: 이벤트 기록 순서 주의사항 명시 (grounding.completed → constraint.discovered)

### Bug Fixes

- **BUG-002**: compile() validateInput이 brownfield 필수 필드를 검증하지 않아 renderSection7에서 TypeError 발생 → validateInput에 검증 추가
- **BUG-001**: draft 상태에서 constraint.discovered 거부 시 조용히 무시 → 구조화 에러 반환 (0.2.1)
- **IMP-001**: compile-defense violation 메시지에 undefined 출력 → 10개소에 fallback 추가 (0.2.1)
- **IMP-002**: inject CST의 CHG/injectValidation 누락 → 전체 누락 한번에 보고 + 사전 검증 (0.2.1)

### Internal

- 44 test files, 947 tests passing (897 → 947, +50 new tests)
- normalizeFilePath: 5 tests
- L3-modify-not-in-brownfield: 7 tests
- L3-shared-resource: 5 tests (0.2.1)
- CompileSuccess.warnings required: 1 test (0.2.1)
- 6-Agent Panel Review 3회 실시 (compile 후 정책 리뷰, homeui 작업설계, brownfield 교차 검증)

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
