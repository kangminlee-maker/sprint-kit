import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ─── Scope paths ───

export interface ScopePaths {
  scopeId: string;
  base: string;
  events: string;
  state: string;
  surface: string;
  build: string;
  inputs: string;
  constraintPool: string;
  verdictLog: string;
  scopeMd: string;
}

/**
 * Resolve all standard paths for a scope.
 */
export function resolveScopePaths(
  scopesDir: string,
  scopeId: string,
): ScopePaths {
  const base = join(scopesDir, scopeId);
  return {
    scopeId,
    base,
    events: join(base, "events.ndjson"),
    state: join(base, "state"),
    surface: join(base, "surface"),
    build: join(base, "build"),
    inputs: join(base, "inputs"),
    constraintPool: join(base, "state", "constraint-pool.json"),
    verdictLog: join(base, "state", "verdict-log.json"),
    scopeMd: join(base, "scope.md"),
  };
}

/**
 * Create a scope directory with all standard subdirectories.
 * Returns the resolved paths. Idempotent — safe to call on existing scope.
 */
export function createScope(
  scopesDir: string,
  scopeId: string,
): ScopePaths {
  const paths = resolveScopePaths(scopesDir, scopeId);

  const dirs = [paths.base, paths.state, paths.surface, paths.build, paths.inputs];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  return paths;
}
