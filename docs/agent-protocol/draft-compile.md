# /draft — Compile + Pre-Apply Review

이 문서는 `target_locked` 또는 `compiled` 상태에서 사용됩니다.
이전 상태의 결정은 scope.md와 events.ndjson에 기록되어 있습니다.

## 이 단계에서 필요한 이전 산출물
- `scope.md` — 현재 상태, constraint 결정 내역
- events.ndjson — 전체 constraint 결정 이력
- `surface/preview/` — 시나리오 참조용
- `.sprint-kit.yaml` — usage_hint별 소스 (정책 정합성 검증용)

---

## target.locked 이후 → Compile

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

역전이 후 상태가 `constraints_resolved`로 변경됩니다. 진입점(`.claude/commands/draft.md`)의 상태→파일 매핑 표를 다시 확인하고 해당 파일(`draft-constraint.md`)로 전환하세요.

---

## compile.completed 직후 → Pre-Apply Review (필수)

compile이 성공적으로 완료되면, PRD 생성 전에 에이전트는 3가지 관점에서 의미적 정합성을 검증합니다.
이 검증은 compile-defense(구조적 완전성)가 다루지 않는 "의미적 양립 가능성"을 확인합니다.
compile 산출물(Build Spec, delta-set, validation-plan, brownfield-detail)만으로 수행하며, 코드 구현 없이 실행 가능합니다.

### 검증 3관점

**1. 정책 정합성 (policy)**
- inject 결정된 CST의 `selected_option`이 약관/정책 문서의 조항과 충돌하지 않는지 확인합니다
- Policy 소스(`usage_hint: context` 또는 `usage_hint: full`)를 직접 읽어 대조합니다
- 확인 대상: constraint pool에서 `decision === "inject"`인 항목 전체
- `requires_policy_change: true`인 항목은 특히 주의하여 검토합니다

**2. 기존 기능 정합성 (brownfield)**
- delta-set의 CHG 항목이 기존 코드의 불변 제약(brownfield invariant)을 위반하지 않는지 확인합니다
- `brownfield-detail.md`의 `invariants` 필드에 기록된 항목과 CHG 대상 파일을 대조합니다
- 확인 대상: invariant 목록 × CHG 목록의 교차점
- **api_contract 유형 집중 점검**:
  - CHG가 API 응답 구조를 변경하는 경우, 해당 API의 invariant가 기록되어 있는지 확인
  - invariant에 명시된 "클라이언트가 전제하는 필드"가 CHG 후에도 유지되는지 확인
  - invariant 미기록 상태에서 API 변경이 있으면, invariant를 보강한 후 재검증

**3. 작동 로직 (logic)**
- 별개 CHG가 동일 파일을 수정할 때 전제 조건이 양립하는지 확인합니다
- validation-plan의 edge case가 실제 구현 항목(IMPL)에서 처리되는지 확인합니다
- Surface 시나리오에 정의된 모든 상태 전이 경로가 Build Spec Section 4에 포함되어 있는지 확인합니다

### 판정 기준

- **3관점 모두 충돌 없음**: `pre_apply.review_completed` (verdict: `"pass"`) 이벤트를 기록하고 PRD 생성으로 진행합니다
- **경고 수준 발견사항**: PO에게 보고합니다. `pre_apply.review_completed` (verdict: `"pass"`, 해당 finding의 status: `"warning"`)를 기록하고 PRD 생성으로 진행합니다
- **새 constraint 수준 충돌**: `constraint.discovered` → `compile.constraint_gap_found` → `constraints_resolved`로 역전이합니다

### 이벤트 기록

```typescript
// 충돌 없음
appendScopeEvent(paths, {
  type: "pre_apply.review_completed",
  actor: "agent",
  payload: {
    verdict: "pass",
    findings: [
      { perspective: "policy", status: "pass", summary: "inject 결정 N건 모두 정책 문서와 양립" },
      { perspective: "brownfield", status: "pass", summary: "invariant N건 모두 CHG와 충돌 없음" },
      { perspective: "logic", status: "pass", summary: "상태 전이 교차점 없음, edge case 모두 커버" },
    ],
  },
});

// 새 constraint 발견 시 → 역전이
appendScopeEvent(paths, {
  type: "constraint.discovered",
  actor: "agent",
  payload: { constraint_id: "CST-NEW", perspective: "policy", summary: "...", ... },
});
appendScopeEvent(paths, {
  type: "compile.constraint_gap_found",
  actor: "system",
  payload: { new_constraint_id: "CST-NEW", perspective: "policy", summary: "..." },
});
// → constraints_resolved로 역전이
```

### PO 안내 형식

```
"Pre-Apply Review를 수행했습니다.

[정책 정합성] ✓ inject 결정 N건 모두 정책 문서와 양립합니다.
[기존 기능 정합성] ✓ invariant N건 모두 CHG와 충돌 없습니다.
[작동 로직] ✓ 상태 전이 교차점 없음, edge case 모두 커버됩니다.

PRD 생성을 진행합니다."
```

⚠ 표시 항목이 있는 경우:
```
"[기존 기능 정합성] ⚠ invariant 'X'와 CST-003의 충돌 가능성이 있습니다. {상세}

이 상태로 진행하시겠습니까?"
```

### 설계 원칙

- **"탐지는 코드, 판정은 에이전트"**: Pre-Apply Review는 에이전트가 수행하는 의미적 검증입니다
- **soft gate**: PO 판단권을 보존합니다. ⚠ 항목이 있어도 PO가 "진행"을 결정할 수 있습니다
- **기존 경로 재사용**: 문제 발견 시 기존 `compile.constraint_gap_found` 역전이 경로를 사용합니다
- **"충돌 없음"도 기록**: `pre_apply.review_completed` 이벤트로 긍정 결과를 기록하여 감사 추적 확보
