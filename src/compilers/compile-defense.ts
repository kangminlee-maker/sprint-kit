import type { ScopeState, ConstraintEntry } from "../kernel/types.js";

// ─── Types ───

export interface DeltaSet {
  scope_id: string;
  surface_hash: string;
  build_spec_hash: string;
  changes: DeltaSetChange[];
}

export interface DeltaSetChange {
  change_id: string;
  action: "create" | "modify" | "delete";
  file_path: string;
  description: string;
  related_impl: string[];
  related_cst: string[];
}

export interface BuildSpecSection3Entry {
  constraint_id: string;
  decision: string;
}

export interface BuildSpecSection4Entry {
  impl_id: string;
  related_cst: string[];
}

export interface BuildSpecData {
  section3: BuildSpecSection3Entry[];
  section4: BuildSpecSection4Entry[];
}

export interface ValidationPlanEntry {
  val_id: string;
  related_cst: string;
  decision_type: "inject" | "defer" | "override";
}

export interface DefenseViolation {
  rule: string;
  detail: string;
}

export type DefenseResult =
  | { passed: true }
  | { passed: false; violations: DefenseViolation[] };

// ─── Main ───

/**
 * Run Compile Defense — 2-layer verification.
 *
 * Layer 1 (Checklist): Every non-invalidated constraint is in Section 3.
 * Layer 2 (Audit Pass): inject reflected, defer non-interfering,
 *   override non-reflected, traceability chain CST→IMPL→CHG→VAL complete.
 *
 * Pure function: no side effects.
 */
export function compileDefense(
  state: ScopeState,
  buildSpec: BuildSpecData,
  deltaSet: DeltaSet,
  validationPlan: ValidationPlanEntry[],
): DefenseResult {
  const violations: DefenseViolation[] = [];

  checkLayer1(state, buildSpec, violations);
  checkLayer2(state, buildSpec, deltaSet, validationPlan, violations);

  if (violations.length === 0) {
    return { passed: true };
  }
  return { passed: false, violations };
}

// ─── Layer 1: Checklist ───

function checkLayer1(
  state: ScopeState,
  buildSpec: BuildSpecData,
  violations: DefenseViolation[],
): void {
  const section3Ids = new Set(buildSpec.section3.map((e) => e.constraint_id));

  for (const c of state.constraint_pool.constraints) {
    if (c.status === "invalidated") continue;
    if (!section3Ids.has(c.constraint_id)) {
      violations.push({
        rule: "L1-checklist",
        detail: `${c.constraint_id} is not referenced in Build Spec Section 3`,
      });
    }
  }
}

// ─── Layer 2: Audit Pass ───

function checkLayer2(
  state: ScopeState,
  buildSpec: BuildSpecData,
  deltaSet: DeltaSet,
  validationPlan: ValidationPlanEntry[],
  violations: DefenseViolation[],
): void {
  const implIds = new Set(buildSpec.section4.map((e) => e.impl_id));
  const changeCstIds = new Set(deltaSet.changes.flatMap((c) => c.related_cst));
  const changeFilePaths = new Set(deltaSet.changes.map((c) => c.file_path));
  const valCstIds = new Set(validationPlan.map((v) => v.related_cst));

  for (const c of state.constraint_pool.constraints) {
    if (c.status === "invalidated") continue;

    const decision = c.decision;
    if (!decision) continue;

    switch (decision) {
      case "inject":
        checkInjectReflected(c, buildSpec, implIds, changeCstIds, valCstIds, violations);
        break;
      case "defer":
        checkDeferNonInterfering(c, deltaSet, changeFilePaths, violations);
        break;
      case "override":
        checkOverrideNonReflected(c, deltaSet, changeFilePaths, violations);
        break;
    }
  }

  // Traceability chain: every IMPL has at least one CHG
  checkImplHasChanges(buildSpec, deltaSet, violations);
}

/** inject → must have IMPL, CHG referencing this CST, and VAL item */
function checkInjectReflected(
  c: ConstraintEntry,
  buildSpec: BuildSpecData,
  implIds: Set<string>,
  changeCstIds: Set<string>,
  valCstIds: Set<string>,
  violations: DefenseViolation[],
): void {
  // CST → IMPL
  const relatedImpls = buildSpec.section4.filter((impl) =>
    impl.related_cst.includes(c.constraint_id),
  );
  if (relatedImpls.length === 0) {
    violations.push({
      rule: "L2-inject-impl",
      detail: `${c.constraint_id} (inject) has no IMPL in Section 4`,
    });
  }

  // CST → CHG
  if (!changeCstIds.has(c.constraint_id)) {
    violations.push({
      rule: "L2-inject-chg",
      detail: `${c.constraint_id} (inject) has no CHG in delta-set`,
    });
  }

  // CST → VAL
  if (!valCstIds.has(c.constraint_id)) {
    violations.push({
      rule: "L2-inject-val",
      detail: `${c.constraint_id} (inject) has no VAL in validation-plan`,
    });
  }
}

/** defer → source_refs files must not appear in delta-set changes */
function checkDeferNonInterfering(
  c: ConstraintEntry,
  deltaSet: DeltaSet,
  changeFilePaths: Set<string>,
  violations: DefenseViolation[],
): void {
  for (const ref of c.source_refs) {
    if (changeFilePaths.has(ref.source)) {
      violations.push({
        rule: "L2-defer-interfere",
        detail: `${c.constraint_id} (defer) source_ref "${ref.source}" is modified in delta-set. 간섭 여부를 확인하세요.`,
      });
    }
  }
}

/** override → source_refs files must not have changes related to this CST */
function checkOverrideNonReflected(
  c: ConstraintEntry,
  deltaSet: DeltaSet,
  changeFilePaths: Set<string>,
  violations: DefenseViolation[],
): void {
  for (const change of deltaSet.changes) {
    if (
      change.related_cst.includes(c.constraint_id) &&
      c.source_refs.some((ref) => ref.source === change.file_path)
    ) {
      violations.push({
        rule: "L2-override-reflected",
        detail: `${c.constraint_id} (override) is reflected in delta-set change ${change.change_id}`,
      });
    }
  }
}

/** Every IMPL must have at least one CHG */
function checkImplHasChanges(
  buildSpec: BuildSpecData,
  deltaSet: DeltaSet,
  violations: DefenseViolation[],
): void {
  const implsWithChanges = new Set(
    deltaSet.changes.flatMap((c) => c.related_impl),
  );

  for (const impl of buildSpec.section4) {
    if (!implsWithChanges.has(impl.impl_id)) {
      violations.push({
        rule: "L2-impl-no-chg",
        detail: `${impl.impl_id} has no CHG in delta-set`,
      });
    }
  }
}
