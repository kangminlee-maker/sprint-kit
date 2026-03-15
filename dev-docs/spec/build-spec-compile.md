# Build Spec & Compile Contract

이 문서는 Compile 단계의 입출력, Build Spec 템플릿, delta-set.json 스키마, validation-plan 구조를 정의합니다.

Compile의 핵심 원칙은 `dev-docs/spec/architecture.md`의 Compile Boundary 참조:
**Compile은 새로운 제품 결정을 하지 않습니다.** 확정된 target을 코드 delta로 변환할 뿐입니다.

---

## Compile I/O

### Input

| 입력 | 출처 | 용도 |
|------|------|------|
| 확정된 surface | `surface/preview/` 또는 `surface/contract-diff/` | 무엇을 만들어야 하는지 (to-be) |
| constraint 결정 목록 | `state/constraint-pool.json` | 각 제약에 대한 결정 (inject/defer/override/invalidated) |
| Reality Snapshot | `state/reality-snapshot.json` | 현재 시스템 상태 (as-is) |
| Align에서 잠긴 방향 | `align.locked` 이벤트 payload | 범위와 방향 |
| 소스 코드 및 설정 | `--add-dir`, GitHub tarball 등 | brownfield 맥락 |

### Output

| 출력 | 저장 위치 | 설명 |
|------|----------|------|
| **Build Spec** | `build/build-spec.md` | 구현 명세. Builder가 이것만 보고 구현할 수 있어야 함 |
| **Brownfield Detail** | `build/brownfield-detail.md` | 전체 스캔 결과. Build Spec Section 7에서 항목별로 참조 |
| **Delta Set** | `build/delta-set.json` | 파일 수준의 변경 목록. 현재 상태 → 목표 상태 |
| **Validation Plan** | `build/validation-plan.md` | 검증 항목 목록. 구현 후 무엇을 확인해야 하는지 |

대응 이벤트: `compile.completed` — `{ build_spec_path, build_spec_hash, brownfield_detail_path, brownfield_detail_hash, delta_set_path, delta_set_hash, validation_plan_path, validation_plan_hash }`

---

## ID 체계

| 접두어 | 범위 | 용도 | 예시 |
|--------|------|------|------|
| `SC-` | 전체 | Scope 식별자 | `SC-2026-001` |
| `CST-` | scope 내 | Constraint 식별자 | `CST-001` |
| `IMPL-` | Build Spec 내 | 구현 항목 식별자 | `IMPL-001` |
| `CHG-` | delta-set 내 | 파일 변경 식별자 | `CHG-001` |
| `VAL-` | validation-plan 내 | 검증 항목 식별자 | `VAL-001` |

추적 체인: `CST → IMPL → CHG → VAL`
모든 inject 결정은 이 체인이 끊기지 않아야 합니다.

---

## Build Spec Template

Build Spec은 Builder(개발자 또는 AI agent)가 구현에 필요한 모든 정보를 담은 문서입니다.
**모호함이 남아 있으면 안 됩니다.** 모호함이 발견되면 `compile.constraint_gap_found`를 발행하고 Draft로 되돌립니다.

### Section 1: Scope Summary

| 항목 | 필수 | 내용 |
|------|------|------|
| **scope ID** | 필수 | `SC-2026-001` |
| **제목** | 필수 | scope 제목 |
| **방향** | 필수 | `align.locked`에서 확정된 방향 요약 |
| **scope type** | 필수 | `experience` 또는 `interface` |
| **범위 — 포함** | 필수 | Align에서 확정된 포함 항목 |
| **범위 — 제외** | 필수 | Align에서 확정된 제외 항목 |

### Section 2: Confirmed Surface

| 항목 | 필수 | 내용 |
|------|------|------|
| **surface 경로** | 필수 | `surface/preview/` 또는 `surface/contract-diff/` |
| **content hash** | 필수 | surface 파일의 해시 |
| **시나리오 요약** | 필수 | 확정된 시나리오 목록 (Draft Packet에서 가져옴) |

experience scope: mockup이 to-be의 원본. Builder는 이 mockup을 실제 코드로 구현합니다.
interface scope: contract diff가 to-be. Builder는 이 API 변경을 구현합니다.

### Section 3: Constraint Decision Map

모든 constraint와 그 결정을 열거합니다. 하나도 빠져서는 안 됩니다.

```
| CST-ID | 관점 | 요약 | 결정 | Build Spec 내 처리 |
```

| 결정 | Build Spec 내 처리 |
|------|----------|
| `inject` | Section 4에 구현 항목으로 포함. 어떻게 반영하는지 명시 |
| `defer` | "이번 범위에서 제외. 이유: {rationale}" 기록. 구현이 이 constraint에 간섭하지 않아야 함 |
| `override` | "무시. 이유: {rationale}. 리스크: {risk}" 기록. 의도적으로 반영하지 않음 |
| `invalidated` | "방향 변경으로 해당 없음. 사유: {reason}" 기록. 구현 무관 |

규칙:
- Draft에서 결정된 constraint가 하나라도 누락되면 Compile Defense checklist 실패
- 각 inject 결정은 Section 4의 구현 항목과 1:1 대응
- defer/override/invalidated도 반드시 기록 (추적 가능해야 함)

### Section 4: Implementation Plan

실제 구현할 항목을 순서대로 나열합니다.

각 항목에 포함되는 정보:

| 항목 | 필수 | 내용 |
|------|------|------|
| **구현 항목 ID** | 필수 | `IMPL-001` 순차 |
| **관련 CST-ID** | 필수 | 어떤 constraint 결정에서 도출되었는지 |
| **변경 대상** | 필수 | 파일 경로, 모듈명, API endpoint 등 |
| **변경 내용** | 필수 | 무엇을 어떻게 변경하는지. 코드 수준의 구체성 |
| **의존성** | 선택 | 다른 IMPL 항목에 대한 선후 관계 |
| **가정** | 선택 | 이 구현이 전제하는 가정 (`assumptions?: string[]`) |
| **guardrail** | 선택 | 이 구현 시 반드시 지켜야 할 제약 (Draft에서 확정) |

규칙:
- 모든 `inject` 결정은 최소 1개의 IMPL 항목을 가져야 함
- 1개의 IMPL이 여러 CST에 관련될 수 있음
- 구현 순서는 의존성 기반으로 정렬

### Section 5: Delta Set Reference

`build/delta-set.json`에 대한 요약과 참조.

| 항목 | 필수 | 내용 |
|------|------|------|
| **delta-set 경로** | 필수 | `build/delta-set.json` |
| **변경 파일 수** | 필수 | 생성/수정/삭제 파일 수 |
| **content hash** | 필수 | delta-set 파일의 해시 |

### Section 6: Validation Plan Reference

`build/validation-plan.md`에 대한 요약과 참조.

| 항목 | 필수 | 내용 |
|------|------|------|
| **validation-plan 경로** | 필수 | `build/validation-plan.md` |
| **검증 항목 수** | 필수 | 총 검증 항목 수 |
| **content hash** | 필수 | validation-plan 파일의 해시 |

### Section 7: Brownfield Context

현재 시스템에 대해 시스템이 스캔한 정보를 2계층으로 제공합니다.

**Tier 1 (항상 표시):** 변경 대상 파일 + 직접 의존 모듈. Builder가 반드시 확인해야 하는 항목.
**Tier 2 (접기):** 간접 의존, API 계약, DB 스키마, 설정/환경. Builder가 필요 시 참조하는 항목.

각 항목에 `build/brownfield-detail.md`의 해당 위치를 가리키는 참조 링크를 포함합니다.

| 항목 | Tier | 필수 | 내용 |
|------|------|------|------|
| **변경 대상 파일** | 1 | 필수 | 직접 변경하는 파일. 경로 + 역할 + 상세 참조 |
| **직접 의존 모듈** | 1 | 필수 | 변경 대상이 직접 의존하는 모듈 + 상세 참조 |
| **간접 의존** | 2 | 선택 | 1-hop 이상 떨어진 의존 관계 + 상세 참조 |
| **API 계약** | 2 | 선택 | 관련 API endpoint + 상세 참조 |
| **DB 스키마** | 2 | 선택 | 관련 테이블 구조 + 상세 참조 |
| **설정/환경** | 2 | 선택 | 관련 환경 변수, 설정 파일 + 상세 참조 |

interface scope에서는 이 섹션이 특히 중요합니다.
Builder에게 기술적 결정의 전체 맥락을 제공합니다.

### Brownfield Detail (`build/brownfield-detail.md`)

전체 스캔 결과를 소스별 · 항목별로 구조화한 문서입니다.
Build Spec Section 7의 각 항목이 이 문서의 특정 앵커를 참조합니다.

정보를 삭제하지 않습니다. Build Spec Section 7(Tier 1+2) + Brownfield Detail을 합치면 스캔 결과 전부가 포함됩니다.

| 항목 | 필수 | 내용 |
|------|------|------|
| **scope_id** | 필수 | 대상 scope |
| **content_hash** | 필수 | 이 문서 자체의 해시 |
| **소스별 섹션** | 필수 | 각 소스(레포/파일)별로 파일 목록, import 관계, API, 스키마, 설정 등 전체 스캔 결과 |
| **앵커 ID** | 필수 | 각 항목에 `{module}-{class/file}` 형식의 앵커. Build Spec에서 `[→ 상세](brownfield-detail.md#anchor)` 형태로 참조 |

규칙:
- Build Spec Section 7의 모든 항목은 Brownfield Detail의 앵커를 참조해야 함
- Brownfield Detail은 `compile.completed` 이벤트에 해시가 기록됨
- Brownfield Detail은 Build Spec과 동시에 생성됨

---

## delta-set.json Schema

delta-set.json은 현재 상태에서 목표 상태로의 파일 수준 변경 목록입니다.

생성 순서: Build Spec 확정 → delta-set 생성 (build_spec_hash 참조) → Build Spec Section 5에 delta-set hash 기록.
delta-set의 `build_spec_hash`는 생성 시점의 snapshot입니다.

```json
{
  "scope_id": "SC-2026-001",
  "surface_hash": "a1b2c3d4e5f6...",
  "build_spec_hash": "f6e5d4c3b2a1...",
  "changes": [
    {
      "change_id": "CHG-001",
      "action": "create | modify | delete",
      "file_path": "src/models/tutor-block.ts",
      "description": "차단 기록 모델 생성",
      "related_impl": ["IMPL-001"],
      "related_cst": ["CST-005"]
    }
  ]
}
```

| 필드 | 설명 |
|------|------|
| `scope_id` | 이 delta가 속한 scope |
| `surface_hash` | 기반이 된 confirmed surface의 해시 |
| `build_spec_hash` | 기반이 된 Build Spec의 해시 |
| `changes` | 파일 변경 목록 |
| `changes[].change_id` | 변경 고유 ID (`CHG-001` 순차) |
| `changes[].action` | `create` (신규), `modify` (수정), `delete` (삭제) |
| `changes[].file_path` | 대상 파일 경로 |
| `changes[].description` | 이 변경이 무엇을 하는지 |
| `changes[].related_impl` | Build Spec의 IMPL-ID 참조 |
| `changes[].related_cst` | 관련 CST-ID 목록. 추적성 유지 |

규칙:
- 모든 IMPL 항목은 최소 1개의 CHG를 가져야 함
- CST → IMPL → CHG 추적 체인이 끊어지면 Compile Defense audit 실패
- delta-set은 `compile.completed` 이벤트에 해시가 기록됨

---

## validation-plan.md Structure

validation-plan.md는 구현 후 무엇을 검증해야 하는지 정의합니다.
constraint 결정별로 검증 항목을 도출합니다.

### 검증 항목 도출 규칙

| 결정 | 검증 내용 | 예시 |
|------|----------|------|
| `inject` | 구현에 올바르게 반영되었는가 | CST-001: 매칭 시 차단된 튜터가 제외되는지 확인 |
| `defer` | 구현이 이 constraint에 간섭하지 않는가. 검증 범위: 해당 constraint의 `source_refs`에 명시된 파일 | CST-004: 차단 관리 메뉴 순서가 변경되지 않았는지 확인 |
| `override` | 의도적으로 반영하지 않았는가. 검증 범위: 해당 constraint의 `source_refs`에 명시된 파일 | CST-002: 약관 관련 코드 변경이 없는지 확인 |
| `invalidated` | 검증 불필요 | — |

### 검증 항목 형식

```markdown
### VAL-001 | CST-001 | inject

**검증 대상:** 매칭 시 차단된 튜터 제외
**검증 방법:** 차단 목록에 튜터 B를 추가한 후 매칭 요청. 튜터 B가 결과에 포함되지 않아야 함.
**통과 조건:** 차단된 튜터가 매칭 결과에 0건
**실패 시 조치:** `constraints_resolved`로 복귀
```

| 필드 | 필수 | 내용 |
|------|------|------|
| **VAL-ID** | 필수 | `VAL-001` 순차 |
| **관련 CST-ID** | 필수 | 어떤 constraint 결정을 검증하는지 |
| **결정 유형** | 필수 | inject / defer / override |
| **검증 대상** | 필수 | 무엇을 확인하는지 |
| **검증 방법** | 필수 | 어떻게 확인하는지 (구체적 시나리오) |
| **통과 조건** | 필수 | 어떤 결과가 나와야 통과인지 |
| **실패 시 조치** | 필수 | 실패하면 어떻게 되는지 |

규칙:
- 모든 inject 결정은 최소 1개의 VAL 항목을 가져야 함
- defer와 override는 비간섭/비반영 확인 VAL 항목을 가짐
- invalidated constraint는 VAL 항목 불필요
- validation-plan.md는 `compile.completed` 이벤트 시 생성됨
- 검증은 `validation.started` → `validation.completed` 이벤트로 기록됨
- 검증 결과는 `scope.md`에 요약 반영되어 Product Owner가 확인 가능
- validation 결과의 VAL-ID별 상세 스키마는 `event-state-contract.md`에서 정의 예정

---

## Compile Defense Rules

Compile 완료 전 3단계 검증을 수행합니다. L1/L2 위반은 compile을 차단하고, L3는 경고만 반환합니다.

### Layer 1: Checklist

모든 constraint 결정이 Build Spec에 참조되어 있는지 확인합니다.

```
FOR EACH constraint IN constraint_pool WHERE status != "invalidated":
  ASSERT constraint.constraint_id IN build_spec.section3.constraint_decision_map
```

누락 시: compile 실패. 누락된 constraint ID를 오류 메시지에 포함.

### Layer 2: Audit Pass

Build Spec의 내용이 Draft 결정과 일치하는지 별도 검증합니다.

| 규칙 | 검증 내용 |
|------|----------|
| **L2-inject-impl** | inject 결정인 CST가 Section 4 구현 계획에 포함되어 있는지 |
| **L2-inject-chg** | inject 결정인 CST가 delta-set의 CHG에 참조되어 있는지 |
| **L2-inject-val** | inject 결정인 CST가 validation plan에 포함되어 있는지 |
| **L2-inject-edge-case** | inject 결정인 CST의 validation plan 항목에 edge_case가 있는지 |
| **L2-defer-interfere** | defer 결정인 CST의 `source_refs` 파일이 delta-set에서 변경되지 않았는지 |
| **L2-override-reflected** | override 결정인 CST가 delta-set에 반영되지 않았는지 |
| **L2-impl-no-chg** | 모든 IMPL에 최소 1개 CHG가 있는지 |
| **L2-chg-orphan-impl** | 모든 CHG가 유효한 IMPL을 참조하는지 |

불일치 시: compile 실패. 불일치 항목과 이유를 오류 메시지에 포함.

### Layer 3: Evidence Quality Warnings (비차단)

Compile을 차단하지 않고 경고만 반환합니다. `CompileSuccess.warnings` 배열에 포함됩니다.

| 규칙 | 경고 내용 |
|------|----------|
| **L3-unverified-inject** | required + inject인데 evidence_status가 verified가 아닌 경우 |
| **L3-policy-change-required** | inject인데 requires_policy_change=true인 경우 |
| **L3-state-completeness** | BrownfieldDetail.enums 값이 구현 계획에서 누락된 경우 |
| **L3-shared-resource** | 동일 파일을 별개 CHG가 다른 CST로 동시 수정하는 경우 |
| **L3-invariant-uncovered** | BrownfieldDetail.invariants 영향 파일이 delta-set에서 변경되지만 구현 계획에 미언급 |
| **L3-modify-not-in-brownfield** | delta-set의 modify/delete 대상이 brownfieldContext.related_files에 없는 경우 |

### Gap Found 처리

Compile 중 새로운 제품 결정이 필요한 모호함을 발견하면:

1. `constraint.discovered` 자동 선행 발행 (새 CST-ID 부여)
2. `compile.constraint_gap_found` 이벤트 발행
3. scope 상태: `target_locked → constraints_resolved`
4. 새 constraint가 Draft Packet에 추가되어 사용자 결정을 요청

이것은 프로세스 실패입니다. Draft에서 모든 constraint를 발견하지 못했다는 의미입니다.

---

## Compile Events Summary

| 이벤트 | 시점 | 의미 |
|--------|------|------|
| `target.locked` | compile 직전 | surface + 모든 constraint 결정 확정 |
| `compile.started` | compile 시작 | snapshot_revision, surface_hash 기록 |
| `compile.completed` | compile 성공 | Build Spec, brownfield-detail, delta-set, validation-plan 생성 완료 |
| `compile.constraint_gap_found` | compile 중 모호함 발견 | 새 constraint 발견. Draft로 복귀 |
| `apply.started` | 구현 시작 | Builder가 Build Spec 기반으로 구현 시작 |
| `apply.completed` | 구현 완료 | 구현 결과 기록 |
| `apply.decision_gap_found` | 구현 중 미결정 발견 | Builder 에스컬레이션. Draft로 복귀 |
| `validation.started` | 검증 시작 | validation-plan 기반 검증 |
| `validation.completed` | 검증 완료 | pass/fail + 상세 결과 |

이벤트 정의와 payload는 `dev-docs/spec/event-state-contract.md`에서 확정합니다 (이 문서는 소유하지 않음).
