# /draft — PRD 생성

이 문서는 `compiled` 상태에서, Pre-Apply Review 통과 후 사용됩니다.
이전 상태의 결정은 scope.md와 events.ndjson에 기록되어 있습니다.

## 이 단계에서 필요한 이전 산출물
- `scope.md` — 현재 상태, 전체 scope 메타데이터
- `build/build-spec.md` — compile 산출물
- `build/delta-set.json` — 변경 항목
- `build/validation-plan.md` — 검증 계획
- `build/align-packet.md` — 방향과 범위
- `inputs/brief.md` — 변경 목적, 기대 결과
- `surface/preview/` — 시나리오, 와이어프레임 참조
- events.ndjson — pre_apply.review_completed 이벤트

---

## Pre-Apply Review 완료 후 → PRD 생성 (필수)

Pre-Apply Review가 pass 판정을 받은 후, 에이전트는 PRD(Product Requirements Document)를 생성합니다.
PRD는 scope 전체 과정에서 축적된 모든 정보를 하나의 문서로 통합한 것입니다.

### PRD 데이터 수집

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
| Pre-Apply Review | `pre_apply.review_completed` 이벤트 payload | events.ndjson에서 해당 이벤트 추출 |
| Traceability Matrix | CST → IMPL → CHG → VAL 체인 | compile 산출물의 ID 체인 |
| 와이어프레임 | Surface 시나리오별 텍스트 와이어프레임 | Surface 파일에서 화면 구조 추출 |

### PRD 품질 요구사항

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

### PRD 문서 구조

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

## Pre-Apply Review
### Policy Alignment
{✓ 또는 ⚠} {요약}
{상세: 확인된 정책 문서 목록, 충돌 시 충돌 내용}

### Brownfield Compatibility
{✓ 또는 ⚠} {요약}
{상세: 확인된 invariant 목록, 충돌 시 위반 내용}

### Logic Consistency
{✓ 또는 ⚠} {요약}
{상세: 상태 전이 교차점 확인 결과, edge case 커버 여부}

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

### PRD 저장 및 이벤트 기록

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

### PRD 생성 완료 후 → PRD Multi-Perspective Review (필수)

PRD 생성이 성공하면, 다관점 리뷰를 실행합니다.
리뷰 프로세스: `docs/agent-protocol/prd-review/process.md`를 참조하세요.

리뷰는 PRD 무결성의 2개 축(Quality + Judgment Fitness)을 검증합니다.
(3번째 축 Conformance는 이미 Pre-Apply Review에서 완료되었습니다.)

리뷰 결과 `prd.review_completed` 이벤트가 기록되어야 `apply.started`로 진행할 수 있습니다.

**gap_found 시**: Philosopher 종합에서 해소되지 않은 high-severity 발견이 있으면 `verdict: "gap_found"`를 기록합니다. 이 경우 `compile.constraint_gap_found`를 통해 backward transition이 발생하고, constraint 재결정 → 재compile → 재PRD → 재review 사이클을 거칩니다.

### PRD 생성 실패 시

PRD 생성은 관찰적 활동입니다. 실패해도 상태 전이에 영향을 주지 않습니다.

**실패 시 이벤트 기록 (필수):**

PRD 생성이 3회 재시도 후에도 실패하면, `prd.rendered` 이벤트를 status: "failed"로 기록합니다.

```typescript
// PRD 생성 실패 시
appendScopeEvent(paths, {
  type: "prd.rendered",
  actor: "agent",
  payload: {
    prd_path: "build/prd.md",
    prd_hash: "",
    build_spec_hash: result.buildSpecHash,
    section_count: 0,
    status: "failed",
    failure_reason: "3회 재시도 후 실패",
  },
});
```

PRD 생성이 실패하면 리뷰를 건너뛰고, `prd.review_completed`를 pass로 기록합니다:

```typescript
// PRD 실패 시 리뷰 건너뛰기
appendScopeEvent(paths, {
  type: "prd.review_completed",
  actor: "agent",
  payload: {
    verdict: "pass",
    perspectives: [],
    findings: [{
      perspective: "prd_coverage",
      severity: "low",
      summary: "PRD generation failed — review skipped",
    }],
  },
});
```

실패 시 PO에게 안내: "PRD 생성에 실패했습니다. 기존 산출물(Build Spec, delta-set)로 apply를 진행할 수 있습니다. 진행하시겠습니까?"
