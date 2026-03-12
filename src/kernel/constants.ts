/** System-wide constants. Single source for all policy numbers. */

export const MAX_COMPILE_RETRIES = 3;

export const CONVERGENCE_THRESHOLDS = {
  notice: 3,
  caution: 5,
  blocked: 7,
} as const;

export const VERDICT_LOG_DISPLAY_COUNT = 5;

export const INVALIDATED_COLLAPSE_THRESHOLD = 3;

export const ID_PAD = 3;

export const EXPLORATION_SUMMARY_THRESHOLD = 5;
export const MAX_EXPLORATION_ROUNDS = 20;
