# Event & State Contract

## Event Envelope

모든 이벤트는 이 공통 구조를 가집니다.

```json
{
  "event_id": "evt_001",
  "scope_id": "SC-2026-001",
  "type": "align.proposed",
  "ts": "2026-03-07T10:30:00Z",
  "revision": 7,
  "actor": "user | system | agent",
  "state_before": "grounded",
  "state_after": "align_proposed",
  "payload": {}
}
```

| 필드 | 설명 |
|------|------|
| `event_id` | 이벤트 고유 ID |
| `scope_id` | 이 이벤트가 속한 scope |
| `type` | 이벤트 종류 (아래 목록) |
| `ts` | 발생 시각 (ISO 8601) |
| `revision` | 순차 증가 번호. scope 내에서 유일 |
| `actor` | `user` (Product Owner), `system` (Sprint Kit), `agent` (Builder AI) |
| `state_before` | 이 이벤트 발생 전 상태 |
| `state_after` | 이 이벤트 발생 후 상태 (변경 없으면 동일) |
| `payload` | 이벤트별 상세 내용 |

규칙:
- `revision`은 scope 내에서 단조 증가합니다
- 이벤트는 3가지로 분류됩니다 (아래 "이벤트 분류" 참조)
- 전이 이벤트: State × Event 매트릭스에 정의된 조합만 허용. 없으면 거부
- 전역 이벤트: 모든 비터미널 상태에서 동일 동작. 매트릭스에 개별 기재하지 않음
- 관찰 이벤트: 상태를 변경하지 않음 (`state_before == state_after`). 비터미널 상태에서 허용
- 참조 무결성(referential integrity): payload에 entity ID(constraint_id 등)를 참조하는 이벤트는, 해당 ID가 현재 상태에 이미 존재해야 합니다. 존재하지 않는 ID를 참조하는 이벤트는 거부합니다. 단, `compile.constraint_gap_found`와 `apply.decision_gap_found`는 새 constraint를 발견하는 이벤트이므로, 발행 시 `constraint.discovered`를 먼저 자동 발행하여 ID를 등록한 뒤 기록합니다
- 참조 무결성 검증은 이벤트 append 전에 gate guard가 수행합니다 (reducer가 아님)

## States

| State | 의미 | 진입 조건 |
|-------|------|----------|
| `draft` | scope 생성됨. 아직 grounding 전 | `scope.created` |
| `grounded` | 소스 스캔 완료. Reality Snapshot 생성됨 | `grounding.completed` |
| `align_proposed` | Align Packet 렌더됨. 사용자 판단 대기 | `align.proposed` |
| `align_locked` | 사용자가 방향·범위 확정. 잠김 | `align.locked` |
| `surface_iterating` | mockup/contract 반복 수정 중 | `surface.generated` |
| `surface_confirmed` | 사용자가 surface 확정 | `surface.confirmed` |
| `constraints_resolved` | 모든 constraint에 대해 결정 완료 (clarify 없음) | 전이 조건 참조 |
| `target_locked` | surface + 모든 constraint 결정 잠김 | `target.locked` |
| `compiled` | Build Spec 생성 완료 | `compile.completed` |
| `applied` | 구현 적용 완료 | `apply.completed` |
| `validated` | 검증 통과 | `validation.completed` |
| `closed` | 종료 | `scope.closed` |
| `deferred` | 보류 (터미널) | `scope.deferred` |
| `rejected` | 거절 (터미널) | `scope.rejected` |

### `constraints_resolved` 전이 조건

`surface_confirmed`에서 `constraints_resolved`로 전이하려면:
1. 모든 `constraint.discovered`된 constraint에 대해 `constraint.decision_recorded`가 존재하거나 `constraint.invalidated`로 처리되어야 합니다
2. `constraint.clarify_requested` 상태인 항목이 0건이어야 합니다 (모두 `constraint.clarify_resolved`로 해소)
3. constraint가 0건인 경우 (발견된 constraint 없음): `surface_confirmed`에서 바로 `target.locked`로 전이 가능합니다

Reducer는 constraint pool 전체를 순회하여 위 조건을 확인합니다.

## Event Classification

이벤트는 3가지로 분류됩니다.

| 분류 | 상태 변경 | 매트릭스 | 허용 범위 |
|------|----------|---------|----------|
| **전이 (transition)** | 변경함 | 매트릭스에 명시. 없으면 거부 | 매트릭스에 정의된 상태에서만 |
| **전역 (global)** | 변경함 (터미널로) | 매트릭스 밖 별도 목록 | 모든 비터미널 상태에서 동일 동작 |
| **관찰 (observational)** | 변경하지 않음 | 매트릭스 밖 별도 목록 | 모든 비터미널 상태 |

### 전역 이벤트

모든 비터미널 상태에서 동일하게 동작합니다. 매트릭스에 개별 기재하지 않습니다.

| Type | 결과 | Payload |
|------|------|---------|
| `scope.deferred` | → `deferred` (터미널) | `{ reason, resume_condition }` |
| `scope.rejected` | → `rejected` (터미널) | `{ reason, rejection_basis }` |

### 관찰 이벤트

상태를 변경하지 않습니다 (`state_before == state_after`).
비터미널 상태에서 허용됩니다. 터미널 상태에서는 거부됩니다.

| Type | 목적 |
|------|------|
| `feedback.classified` | 사용자 피드백 분류 결과를 기록. 분류 정확도 측정과 개선에 활용 |
| `convergence.warning` | revise 3회 도달. 패턴 요약 제시. 사용자에게 수렴 상태를 알림 |
| `convergence.diagnosis` | revise 5회 도달. 진단 보고서 + 3가지 선택지 제시 |
| `convergence.blocked` | revise 7회 도달. hard block. 사용자가 선택해야 진행 가능 |
| `convergence.action_taken` | blocked 후 사용자가 선택한 행동을 기록 |
| `draft_packet.rendered` | Draft Packet 렌더 완료를 기록 (Step 4에서 재검토) |

### Convergence Blocking Rule

`convergence.blocked` 이벤트가 존재하고, 그 이후에 `convergence.action_taken`이 아직 없으면:
gate guard가 해당 상태의 revise 이벤트(`align.revised`, `surface.revision_applied`)를 거부합니다.

이 규칙은 상태 머신이 아닌 gate guard에서 강제됩니다 (stale detection과 동일한 패턴).

`convergence.blocked` 상태에서도 `scope.deferred`와 `scope.rejected`(전역 이벤트)는 허용됩니다.
터미널 전이는 항상 가능합니다.

### Required Override Validation Rule

`constraint.decision_recorded` 또는 `constraint.clarify_resolved` 이벤트에서 대상 constraint의 `severity`가 `"required"`이고 `decision`이 `"override"`이면:
gate guard가 `rationale` 필드가 비어 있거나 없는 경우 이벤트를 거부합니다.

gate guard는 참조 무결성 검증 시 이미 constraint pool을 조회하므로, 이때 severity도 함께 확인합니다.

## Event Types

아래 테이블의 이벤트는 모두 **전이 이벤트**입니다.
전역 이벤트와 관찰 이벤트는 위 Event Classification 섹션에 정의되어 있습니다.

### Scope / Input — Owner: `commands/`

| Type | Trigger | Payload |
|------|---------|---------|
| `scope.created` | `/start` 실행 | `{ title, description, entry_mode }` |
| `scope.closed` | 검증 통과 후 종료 | `{}` |

전역 이벤트 (`scope.deferred`, `scope.rejected`)는 Event Classification 섹션에 정의되어 있습니다.
payload: `scope.deferred` — `{ reason, resume_condition }`, `scope.rejected` — `{ reason, rejection_basis }`
| `input.attached` | 사용자 자료 첨부 | `{ filename, path }` |

### Grounding — Owner: `kernel/`

| Type | Trigger | Payload |
|------|---------|---------|
| `grounding.started` | 소스 스캔 시작 | `{ sources: [{ type, path_or_url }] }` |
| `grounding.completed` | 스캔 완료, Reality Snapshot 생성 | `{ snapshot_revision, source_hashes: { path: hash }, perspective_summary }` |
| `snapshot.marked_stale` | 소스 변경 감지 | `{ stale_sources: [{ path, old_hash, new_hash }] }` |

### Align — Owner: `commands/`

| Type | Trigger | Payload |
|------|---------|---------|
| `align.proposed` | Align Packet 렌더 완료 | `{ packet_path, packet_hash, snapshot_revision }` |
| `align.revised` | 사용자 revise 피드백 반영 후 재렌더 | `{ revision_count, feedback_scope, feedback_text, packet_path, packet_hash }` |
| `align.locked` | 사용자 approve | `{ locked_direction, locked_scope_boundaries, locked_in_out }` |

### Redirect — Owner: `commands/`

| Type | Trigger | Payload |
|------|---------|---------|
| `redirect.to_grounding` | 사용자 또는 시스템이 grounding 복귀 요청 | `{ from_state, reason }` |
| `redirect.to_align` | 사용자 또는 시스템이 Align 복귀 요청 (scope 변경 포함) | `{ from_state, reason }` |
| `surface.change_required` | constraint가 surface 변경을 요구 | `{ constraint_id, reason }` |

### Surface — Owner: `renderers/`

| Type | Trigger | Payload |
|------|---------|---------|
| `surface.generated` | 초기 surface 생성 | `{ surface_type, surface_path, content_hash, based_on_snapshot }` |
| `surface.revision_requested` | 사용자 피드백 | `{ feedback_text }` |
| `surface.revision_applied` | 피드백 반영 완료 | `{ revision_count, surface_path, content_hash }` |
| `surface.confirmed` | 사용자가 "이것이 내가 원하는 것" 선언 | `{ final_surface_path, final_content_hash, total_revisions }` |

관찰 이벤트 (`feedback.classified`, `convergence.*`, `draft_packet.rendered`)는 Event Classification 섹션에 정의되어 있습니다.

관찰 이벤트 payload 상세:
- `feedback.classified`: `{ classification, confidence, confirmed_by: "auto" or "user" }`. classification은 `surface_only`, `constraint_decision`, `target_change`, `direction_change` 중 하나
- `convergence.warning`: `{ state, revision_count, pattern_summary }`
- `convergence.diagnosis`: `{ state, revision_count, diagnosis, options }`
- `convergence.blocked`: `{ state, revision_count, requires_action }`
- `convergence.action_taken`: `{ state, chosen_action, reason }`
- `draft_packet.rendered`: `{ packet_path, packet_hash, surface_hash, constraint_count }` (Step 4에서 재검토)

### Constraint — Owner: `kernel/`

타입명과 payload는 여기서 확정합니다. 상세 lifecycle은 `docs/constraint-discovery.md` 참조.

| Type | Trigger | Payload |
|------|---------|---------|
| `constraint.discovered` | 시스템이 constraint 발견 | `{ constraint_id, perspective, summary, severity, discovery_stage, decision_owner, impact_if_ignored, source_refs }` |
| `constraint.decision_recorded` | 사용자 또는 Builder가 결정 | `{ constraint_id, decision, selected_option, decision_owner, rationale }` |
| `constraint.clarify_requested` | 사용자가 clarify 선택 | `{ constraint_id, question, asked_to }` |
| `constraint.clarify_resolved` | clarify 해소 후 결정 | `{ constraint_id, resolution, decision, selected_option, decision_owner, rationale }` |
| `constraint.invalidated` | re-discovery에서 관련성 소멸 판단 (actor: system) | `{ constraint_id, reason }` |

### Compile / Build — Owner: `compilers/`

| Type | Trigger | Payload |
|------|---------|---------|
| `target.locked` | 모든 constraint 결정 완료 + surface 확정 | `{ surface_hash, constraint_decisions: [{ constraint_id, decision }] }` |
| `compile.started` | compile 시작 | `{ snapshot_revision, surface_hash }` |
| `compile.completed` | Build Spec 생성 완료 | `{ build_spec_path, build_spec_hash, delta_set_path, delta_set_hash }` |
| `compile.constraint_gap_found` | compile 중 새 constraint 발견 | `{ new_constraint_id, perspective, summary }` |

### Apply / Validate — Owner: `validators/`

| Type | Trigger | Payload |
|------|---------|---------|
| `apply.started` | 구현 시작 | `{ build_spec_hash }` |
| `apply.completed` | 구현 완료 | `{ result }` |
| `apply.decision_gap_found` | Builder가 미결정 edge case 발견 | `{ new_constraint_id, description }` |
| `validation.started` | 검증 시작 | `{ validation_plan_hash }` |
| `validation.completed` | 검증 완료 | `{ result, pass_count, fail_count, details }` |

### Convergence — Owner: `kernel/`

| Type | Trigger | Payload |
|------|---------|---------|
| `convergence.warning` | 동일 상태에서 revise 3회 도달 | `{ state, revision_count, pattern_summary }` |
| `convergence.diagnosis` | 5회 도달 | `{ state, revision_count, diagnosis, options }` |
| `convergence.blocked` | 7회 도달 | `{ state, revision_count, requires_action }` |
| `convergence.action_taken` | blocked 후 사용자가 선택 | `{ state, chosen_action, reason }` |

## State × Event Matrix

모든 상태에서 모든 이벤트에 대해 **전이(→) / 자기전이(⟳) / 거부(✗)** 를 정의합니다.

아래 매트릭스는 **전이 이벤트**만 포함합니다.
전역 이벤트(`scope.deferred`, `scope.rejected`)는 모든 비터미널 상태에서 허용됩니다 (Event Classification 참조).
관찰 이벤트는 상태를 변경하지 않고 비터미널 상태에서 허용됩니다 (Event Classification 참조).
전이 이벤트 중 표에 없는 조합은 거부입니다.

### draft

| Event | 결과 |
|-------|------|
| `input.attached` | ⟳ `draft` |
| `grounding.started` | ⟳ `draft` |
| `grounding.completed` | → `grounded` |

### grounded

| Event | 결과 |
|-------|------|
| `align.proposed` | → `align_proposed` |
| `snapshot.marked_stale` | ⟳ `grounded` (re-scan 트리거) |

### align_proposed

| Event | 결과 |
|-------|------|
| `align.locked` | → `align_locked` |
| `align.revised` | ⟳ `align_proposed` (revision counter +1) |
| `snapshot.marked_stale` | ⟳ `align_proposed` (re-scan, re-render) |
| `redirect.to_grounding` | → `grounded` |

### align_locked

| Event | 결과 |
|-------|------|
| `surface.generated` | → `surface_iterating` |
| `snapshot.marked_stale` | → `align_proposed` (unlock) |

### surface_iterating

| Event | 결과 |
|-------|------|
| `surface.revision_requested` | ⟳ `surface_iterating` |
| `surface.revision_applied` | ⟳ `surface_iterating` (revision counter +1) |
| `surface.confirmed` | → `surface_confirmed` |
| `constraint.discovered` | ⟳ `surface_iterating` (lightweight hint) |
| `redirect.to_align` | → `align_proposed` |
| `snapshot.marked_stale` | ⟳ `surface_iterating` (re-scan, notify) |

### surface_confirmed

| Event | 결과 |
|-------|------|
| `constraint.discovered` | ⟳ `surface_confirmed` (deep discovery 결과 축적) |
| `constraint.decision_recorded` | → `constraints_resolved` (전이 조건 충족 시) 또는 ⟳ `surface_confirmed` (미결정 남음) |
| `constraint.clarify_requested` | ⟳ `surface_confirmed` |
| `constraint.clarify_resolved` | → `constraints_resolved` (전이 조건 충족 시) 또는 ⟳ `surface_confirmed` (미결정 남음) |
| `constraint.invalidated` | → `constraints_resolved` (전이 조건 충족 시) 또는 ⟳ `surface_confirmed` (미결정 남음) |
| `target.locked` | → `target_locked` (constraint 0건인 경우 직행) |
| `surface.change_required` | → `surface_iterating` |
| `redirect.to_align` | → `align_proposed` (modify-direction 결정 시) |
| `snapshot.marked_stale` | ⟳ `surface_confirmed` (re-scan, re-discover, notify) |

### constraints_resolved

| Event | 결과 |
|-------|------|
| `constraint.discovered` | → `surface_confirmed` (미결정 constraint 발생으로 역전이) |
| `constraint.decision_recorded` | ⟳ `constraints_resolved` (결정 수정) |
| `constraint.invalidated` | ⟳ `constraints_resolved` |
| `target.locked` | → `target_locked` |
| `surface.change_required` | → `surface_iterating` |
| `redirect.to_align` | → `align_proposed` |
| `snapshot.marked_stale` | ⟳ `constraints_resolved` (re-scan, notify. 새 constraint 발견 시 미결정 상태로 복귀 가능) |

### target_locked

| Event | 결과 |
|-------|------|
| `compile.started` | ⟳ `target_locked` |
| `compile.completed` | → `compiled` |
| `compile.constraint_gap_found` | → `constraints_resolved` (새 constraint로 unlock) |
| `snapshot.marked_stale` | → `constraints_resolved` (block compile, redirect) |

### compiled

| Event | 결과 |
|-------|------|
| `apply.started` | ⟳ `compiled` |
| `apply.completed` | → `applied` |
| `apply.decision_gap_found` | → `constraints_resolved` (Builder 에스컬레이션) |
| `snapshot.marked_stale` | → `grounded` (block apply, re-ground) |

### applied

| Event | 결과 |
|-------|------|
| `validation.started` | ⟳ `applied` |
| `validation.completed` (pass) | → `validated` |
| `validation.completed` (fail, target issue) | → `constraints_resolved` |
| `validation.completed` (fail, stale) | → `grounded` |

### validated

| Event | 결과 |
|-------|------|
| `scope.closed` | → `closed` |

### closed, deferred, rejected

터미널 상태. 추가 이벤트를 받지 않습니다.

## Reducer Rules

Reducer는 `events.ndjson`을 순서대로 읽고 현재 상태를 계산합니다.

### 결정론(Determinism)

동일한 이벤트 시퀀스는 항상 동일한 상태를 산출해야 합니다.

금지 사항:
- reducer 안에서 현재 시각 참조
- reducer 안에서 난수 사용
- reducer 안에서 외부 시스템 호출
- reducer 안에서 이벤트 순서 변경

### 상태 계산 규칙

| 상태 항목 | 계산 방법 |
|-----------|----------|
| 현재 state | 마지막 이벤트의 `state_after` |
| 현재 direction | 가장 최근 `align.locked`의 payload |
| 현재 surface | 가장 최근 `surface.confirmed`의 `final_content_hash` |
| constraint 목록 | 모든 `constraint.discovered` 이벤트 축적 |
| constraint 결정 상태 | 각 `constraint_id`의 가장 최근 `constraint.decision_recorded`, `constraint.clarify_resolved`, 또는 `constraint.invalidated` |
| clarify 상태 | `constraint.clarify_requested` 후 `constraint.clarify_resolved` 또는 `constraint.invalidated`가 없는 항목 |
| stale 여부 | 마지막 `grounding.completed` 이후 `snapshot.marked_stale`이 존재하고, 그 뒤에 새 `grounding.completed`가 없으면 stale |
| compile_ready | 모든 constraint 결정됨(clarify 없음) AND stale 아님 |
| revision_count (align) | `align.revised` 이벤트 카운트 |
| revision_count (surface) | `surface.revision_applied` 이벤트 카운트 |
| verdict log | `align.locked` + 모든 `constraint.decision_recorded` + 모든 `constraint.clarify_resolved`를 시간순으로 모은 목록 |
| feedback history | 모든 `feedback.classified` 이벤트 목록 (수렴 패턴 분석용) |

`snapshot_fresh`는 reducer가 계산하지 않습니다. reducer는 `snapshot.marked_stale` 이벤트의 유무로만 stale 여부를 판단합니다. 실제 소스 해시 비교는 gate guard(command/validator)가 수행하고, 불일치 시 `snapshot.marked_stale` 이벤트를 발행합니다.

### 충돌 해소

같은 `constraint_id`에 대해 여러 결정이 기록되면, 가장 높은 `revision`의 결정이 현재 결정입니다.

### Materialized View 재생성

`scope.md`와 `state/` 디렉토리의 파일은 매 이벤트 처리 후 재생성됩니다. 이벤트와 materialized view가 불일치하면, 이벤트가 우선이고 view를 재생성합니다.

| Materialized View | 소스 이벤트 |
|-------------------|------------|
| `state/reality-snapshot.json` | `grounding.started`, `grounding.completed`, `snapshot.marked_stale` |
| `state/constraint-pool.json` | `constraint.discovered`, `constraint.decision_recorded`, `constraint.clarify_requested`, `constraint.clarify_resolved`, `constraint.invalidated` |
| `state/verdict-log.json` | `align.locked`, `constraint.decision_recorded`, `constraint.clarify_resolved` |

## Stale Detection

### 감지 시점

| 시점 | 범위 | 동작 |
|------|------|------|
| Gate 전이 (필수) | 모든 소스 | `source_hashes`를 현재 소스와 비교. 불일치 시 `snapshot.marked_stale` 이벤트 발행, 전이 차단 |
| 명령 시작 (경량) | 로컬 소스만 (`--add-dir`) | 해시 비교. 불일치 시 경고 표시. 전이 차단하지 않음 |

Stale 감지는 reducer 외부(gate guard)에서 수행됩니다. reducer는 `snapshot.marked_stale` 이벤트만 봅니다.

### 해시 비교 대상

| 소스 유형 | 해시 대상 |
|-----------|----------|
| `--add-dir` (로컬) | 디렉토리 내 파일의 content hash 집합 |
| GitHub tarball | tarball의 content hash |
| Figma MCP | Figma file의 `lastModified` timestamp |
| Obsidian vault | vault 내 파일의 content hash 집합 |

## Artifact Event Recording

`surface/`와 `build/` 아래의 파일은 이벤트만으로 재구성할 수 없습니다 (hybrid storage).
이 파일이 생성되거나 변경될 때 반드시 대응 이벤트가 기록되어야 합니다.

| Artifact | 대응 이벤트 | 기록 내용 |
|----------|-----------|----------|
| `surface/preview/` | `surface.generated`, `surface.revision_applied`, `surface.confirmed` | `surface_path` + `content_hash` |
| `surface/contract-diff/` | 동일 | 동일 |
| `build/align-packet.md` | `align.proposed`, `align.revised` | `packet_path` + `packet_hash` |
| `build/draft-packet.md` | `draft_packet.rendered` | `packet_path` + `packet_hash` |
| `build/build-spec.md` | `compile.completed` | `build_spec_path` + `build_spec_hash` |
| `build/delta-set.json` | `compile.completed` | `delta_set_path` + `delta_set_hash` |
| `build/validation-plan.md` | `compile.completed` | 동일 payload에 포함 |

Artifact를 이벤트 없이 직접 수정하는 것은 금지합니다.
이벤트와 artifact가 불일치하면, 이벤트가 우선이고 artifact를 재생성합니다.
