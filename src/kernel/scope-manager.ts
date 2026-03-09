import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
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
  realitySnapshot: string;
  sourcesYaml: string;
  scopeMd: string;
  brief: string;
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
    realitySnapshot: join(base, "state", "reality-snapshot.json"),
    sourcesYaml: join(base, "inputs", "sources.yaml"),
    scopeMd: join(base, "scope.md"),
    brief: join(base, "inputs", "brief.md"),
  };
}

// ─── Scope ID generation ───

/**
 * Normalize a project name for use in scope IDs.
 * Lowercase, spaces→hyphens, remove chars except alphanumeric and hyphens,
 * collapse consecutive hyphens, trim leading/trailing hyphens.
 */
export function normalizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a scope ID in `{projectName}-{YYYYMMDD}-{NNN}` format.
 *
 * 1. Normalizes projectName (lowercase, spaces→hyphens, special chars removed)
 * 2. Gets today's date as YYYYMMDD
 * 3. Scans existing directories matching `{normalized}-{YYYYMMDD}-*`
 * 4. Returns next sequential NNN (001-based, 3-digit zero-padded)
 */
export function generateScopeId(
  scopesDir: string,
  projectName: string,
  date?: Date,
): string {
  const normalized = normalizeProjectName(projectName);
  if (normalized.length === 0) {
    throw new Error("projectName must contain at least one alphanumeric character");
  }

  const d = date ?? new Date();
  const yyyymmdd =
    String(d.getFullYear()) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");

  const prefix = `${normalized}-${yyyymmdd}-`;

  let maxN = 0;
  if (existsSync(scopesDir)) {
    const entries = readdirSync(scopesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(prefix)) {
        const suffix = entry.name.slice(prefix.length);
        const n = parseInt(suffix, 10);
        if (!isNaN(n) && n > maxN) {
          maxN = n;
        }
      }
    }
  }

  const nnn = String(maxN + 1).padStart(3, "0");
  return `${normalized}-${yyyymmdd}-${nnn}`;
}

// ─── Brief template ───

export interface BriefSourceEntry {
  type: string;
  identifier: string;
  description?: string;
}

/**
 * Generate a brief.md template for a scope.
 *
 * 1. What it is: brief.md는 /start 실행 전에 작성하는 프로젝트 준비 문서 템플릿입니다.
 *    변경 목적, 대상 사용자, 기대 결과 등 필수 정보를 수집합니다.
 * 2. Why it exists: 소스 스캔 전에 프로젝트의 방향과 맥락을 명확히 해야
 *    grounding 단계에서 올바른 constraint를 발견할 수 있습니다.
 * 3. How it relates: createScope가 호출할 때 inputs/brief.md로 기록되며,
 *    에이전트가 /start 실행 시 이 파일의 내용을 참조합니다.
 */
export function generateBriefTemplate(
  projectName: string,
  defaultSources?: BriefSourceEntry[],
): string {
  const sourcesSection =
    defaultSources && defaultSources.length > 0
      ? defaultSources
          .map((s) => {
            const desc = s.description ?? `${s.type}: ${s.identifier}`;
            return `- [x] ${desc} (${s.type}: ${s.identifier})`;
          })
          .join("\n")
      : "- 환경설정 파일(.sprint-kit.yaml)이 없거나 소스가 정의되지 않았습니다.";

  return `# ${projectName} — Brief

<!-- 이 문서는 /start 실행 전에 작성하는 프로젝트 준비 문서입니다. -->
<!-- 필수 항목을 채운 후 /start ${projectName}을 다시 실행하면 프로세스가 시작됩니다. -->

## 변경 목적 (필수)
<!-- 왜 이 변경이 필요한가요? 해결하려는 문제를 설명해 주세요. -->



## 대상 사용자 (필수)
<!-- 이 변경이 영향을 미치는 사용자는 누구인가요? -->



## 기대 결과 (필수)
<!-- 이 변경이 성공하면 어떤 상태가 되나요? -->



## 포함 범위
<!-- 이번에 포함할 기능이나 변경 사항을 나열해 주세요. (선택) -->



## 제외 범위
<!-- 이번에 포함하지 않을 사항을 나열해 주세요. (선택) -->



## 제약 및 참고사항
<!-- 이미 알고 있는 제약(일정, 기술 제한 등)이나 참고할 정보를 적어 주세요. (선택) -->



## 소스
<!-- .sprint-kit.yaml에서 자동 로드됨. 추가 소스를 아래에 기입하세요. -->

### 자동 로드 (환경설정)
${sourcesSection}

### 추가 소스
- [ ] (여기에 추가 소스를 기입하세요)
`;
}

/**
 * Create a scope directory with all standard subdirectories.
 * Returns the resolved paths. Idempotent — safe to call on existing scope.
 *
 * If projectName is provided, generates scopeId automatically using
 * `{projectName}-{YYYYMMDD}-{NNN}` format.
 * If only scopeId is provided (backward compat), uses it directly.
 */
export function createScope(
  scopesDir: string,
  scopeId: string,
  options?: { projectName?: string; date?: Date; defaultSources?: BriefSourceEntry[] },
): ScopePaths {
  const finalScopeId =
    options?.projectName != null
      ? generateScopeId(scopesDir, options.projectName, options.date)
      : scopeId;
  const paths = resolveScopePaths(scopesDir, finalScopeId);

  const dirs = [paths.base, paths.state, paths.surface, paths.build, paths.inputs];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  if (!existsSync(paths.brief)) {
    const name = options?.projectName ?? scopeId;
    const template = generateBriefTemplate(name, options?.defaultSources);
    writeFileSync(paths.brief, template, "utf-8");
  }

  return paths;
}
