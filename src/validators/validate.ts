import type {
  ScopeState,
  ValidationItemResult,
  ValidationResult,
} from "../kernel/types.js";
import type { ValidationPlanItem } from "../compilers/compile-defense.js";

// ─── Input Types ───

export interface ValidateInput {
  state: ScopeState;
  plan: ValidationPlanItem[];
  results: ValidationItemResult[];
  actualPlanHash: string;
}

// ─── Output Types ───

export interface ValidateSuccess {
  success: true;
  result: ValidationResult;
  pass_count: number;
  fail_count: number;
  items: ValidationItemResult[];
}

export interface ValidateFailure {
  success: false;
  reason: string;
}

export type ValidateOutput = ValidateSuccess | ValidateFailure;

// ─── Main ───

/**
 * Aggregate validation results into a ValidationCompletedPayload-compatible output.
 *
 * Pure function: no side effects, no file I/O, no event recording.
 * The caller (agent protocol) is responsible for:
 *   1. Recording validation.started event before calling this function.
 *   2. Executing each VAL item and collecting results.
 *   3. Recording validation.completed event with this function's output.
 */
export function validate(input: ValidateInput): ValidateOutput {
  const error = validateInput(input);
  if (error) {
    return { success: false, reason: error };
  }

  const { results } = input;

  let pass_count = 0;
  let fail_count = 0;

  for (const r of results) {
    if (r.result === "pass") pass_count++;
    else fail_count++;
  }

  const result: ValidationResult = fail_count === 0 ? "pass" : "fail";

  return {
    success: true,
    result,
    pass_count,
    fail_count,
    items: results,
  };
}

// ─── Validation ───

function validateInput(input: ValidateInput): string | null {
  const { state, plan, results, actualPlanHash } = input;

  if (state.current_state !== "applied") {
    return `state.current_state must be "applied", got "${state.current_state}"`;
  }

  // Hash integrity check
  if (state.validation_plan_hash && state.validation_plan_hash !== actualPlanHash) {
    return `validation_plan_hash mismatch: expected "${state.validation_plan_hash}", got "${actualPlanHash}". validation-plan.md may have been modified after compile.`;
  }

  // All plan items must have a result
  const resultValIds = new Set(results.map((r) => r.val_id));
  for (const item of plan) {
    if (!resultValIds.has(item.val_id)) {
      return `${item.val_id} has no result in the provided results`;
    }
  }

  // All results must reference a valid plan item
  const planValIds = new Set(plan.map((p) => p.val_id));
  for (const r of results) {
    if (!planValIds.has(r.val_id)) {
      return `result references ${r.val_id} which does not exist in the validation plan`;
    }
  }

  return null;
}
