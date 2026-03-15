# /draft — Apply + Validate + Close

이 문서는 `compiled`, `applied`, 또는 `validated` 상태에서 사용됩니다.
이전 상태의 결정은 scope.md와 events.ndjson에 기록되어 있습니다.

## 이 단계에서 필요한 이전 산출물
- `scope.md` — 현재 상태
- `build/build-spec.md` — 구현 명세
- `build/delta-set.json` — 변경 항목 목록
- `build/validation-plan.md` — 검증 계획
- `.sprint-kit.yaml` — apply_enabled 설정
- events.ndjson — compile.completed 이벤트

---

## compiled → Apply

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

---

## applied → Validation

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

---

## validated → Closed

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
