/**
 * 호출 그래프 빌더
 *
 * 진입점에서 출발하여 import/require 관계와 CallSite(함수 호출)를 따라
 * 도달 가능한 모든 심볼을 탐색합니다.
 *
 * 탐색 규칙:
 * - import/require 관계를 따라 파일 단위로 이동
 * - 파일 내에서 CallSite(함수 호출)를 따라 심볼 단위로 이동
 * - 동적 디스패치(인터페이스 호출, 리플렉션)는 kind: "unresolved"로 기록
 * - 최대 탐색 깊이: 설정 가능 (기본 20-hop)
 * - 순환 참조: visited set으로 방지
 */

import type {
  ParsedModule,
  CallSite,
  EntryPointPattern,
} from "./types.js";

export interface CallGraphOptions {
  maxDepth?: number;
  /** 상태 변경 메서드 진입 시 추가 탐색 깊이 (기본 5) */
  stateChangeDepthBonus?: number;
}

const DEFAULT_MAX_DEPTH = 20;
const DEFAULT_STATE_CHANGE_DEPTH_BONUS = 5;

// ── 상태 변경 관용 메서드 패턴 (개선안 F) ──

const STATE_CHANGE_METHOD_PATTERNS: RegExp[] = [
  /^(?:change|update|set|transition(?:To)?|move(?:To)?|advance|switch)Status$/i,
  /^(?:change|update|set)State$/i,
  /^transition(?:To)?$/i,
  /^(?:mark|flag)(?:As)?(?:Completed|Active|Deleted|Archived|Suspended|Cancelled|Approved|Rejected|Published|Draft)$/i,
  /^(?:activate|deactivate|complete|cancel|approve|reject|publish|archive|suspend|resume|expire|close|open|lock|unlock|enable|disable)$/i,
];

/** callee 심볼이 상태 변경 관용 메서드인지 판별합니다. */
export function isStateChangeMethod(callee: string): boolean {
  // "ClassName.methodName" → methodName 추출
  const methodName = callee.includes(".") ? callee.split(".").pop()! : callee;
  return STATE_CHANGE_METHOD_PATTERNS.some((p) => p.test(methodName));
}

/**
 * 진입점에서 도달 가능한 모든 CallSite를 수집합니다.
 *
 * @param entryPoints - 탐지된 진입점 목록
 * @param modules - 파싱된 모듈 목록 (ParsedModule[])
 * @param options - 탐색 옵션
 * @returns 도달 가능한 CallSite 목록 (중복 제거됨)
 */
export function buildCallGraph(
  entryPoints: EntryPointPattern[],
  modules: ParsedModule[],
  options?: CallGraphOptions,
): CallSite[] {
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
  const stateChangeBonus = options?.stateChangeDepthBonus ?? DEFAULT_STATE_CHANGE_DEPTH_BONUS;

  // 인덱스 구축: 파일 경로 → ParsedModule
  const moduleByFile = new Map<string, ParsedModule>();
  for (const mod of modules) {
    moduleByFile.set(mod.file_path, mod);
  }

  // 인덱스 구축: import source → 파일 경로 (import 해석)
  const importIndex = buildImportIndex(modules);

  // 인덱스 구축: 심볼명 → 정의된 파일 경로
  const symbolIndex = buildSymbolIndex(modules);

  // 수집된 CallSite (중복 방지용 키 세트)
  const collectedSites: CallSite[] = [];
  const seenSiteKeys = new Set<string>();

  // 방문한 심볼 (순환 방지)
  const visited = new Set<string>();

  // 각 진입점에서 BFS 탐색
  for (const ep of entryPoints) {
    const startSymbol = ep.symbol;
    const startFile = ep.file;

    dfsTraverse(
      startSymbol,
      startFile,
      0,
      maxDepth,
      stateChangeBonus,
      moduleByFile,
      importIndex,
      symbolIndex,
      visited,
      collectedSites,
      seenSiteKeys,
    );
  }

  return collectedSites;
}

// ── BFS 탐색 ──

function dfsTraverse(
  symbol: string,
  filePath: string,
  depth: number,
  maxDepth: number,
  stateChangeBonus: number,
  moduleByFile: Map<string, ParsedModule>,
  importIndex: Map<string, string[]>,
  symbolIndex: Map<string, string>,
  visited: Set<string>,
  collectedSites: CallSite[],
  seenSiteKeys: Set<string>,
): void {
  const visitKey = `${filePath}::${symbol}`;
  if (visited.has(visitKey)) return;
  if (depth >= maxDepth) return;

  visited.add(visitKey);

  const module = moduleByFile.get(filePath);
  if (!module) return;

  // 이 모듈의 call_sites 중 현재 심볼이 caller인 것을 수집
  for (const site of module.call_sites) {
    if (!isCallerMatch(site.caller, symbol)) continue;

    const siteKey = `${site.file_path}:${site.line}:${site.caller}->${site.callee}`;
    if (seenSiteKeys.has(siteKey)) continue;
    seenSiteKeys.add(siteKey);

    collectedSites.push(site);

    // callee를 따라 재귀 탐색
    if (site.kind === "direct") {
      const calleeFile = resolveCalleeFile(
        site.callee,
        filePath,
        module,
        importIndex,
        symbolIndex,
      );
      if (calleeFile) {
        // 개선안 F: 상태 변경 메서드면 깊이 보너스 적용
        const nextDepth = isStateChangeMethod(site.callee)
          ? Math.min(depth + 1, maxDepth - stateChangeBonus)
          : depth + 1;

        dfsTraverse(
          site.callee,
          calleeFile,
          nextDepth,
          maxDepth,
          stateChangeBonus,
          moduleByFile,
          importIndex,
          symbolIndex,
          visited,
          collectedSites,
          seenSiteKeys,
        );
      }
    }
  }

  // import된 모듈도 탐색 (진입점에서 import한 클래스의 메서드 호출 추적)
  for (const imp of module.imports) {
    const resolvedFiles = importIndex.get(imp.source) ?? [];
    for (const resolvedFile of resolvedFiles) {
      const resolvedModule = moduleByFile.get(resolvedFile);
      if (!resolvedModule) continue;

      // import된 심볼의 call_sites를 추적
      for (const site of resolvedModule.call_sites) {
        if (!isCallerMatch(site.caller, imp.name)) continue;

        const siteKey = `${site.file_path}:${site.line}:${site.caller}->${site.callee}`;
        if (seenSiteKeys.has(siteKey)) continue;
        seenSiteKeys.add(siteKey);

        collectedSites.push(site);

        if (site.kind === "direct") {
          // 개선안 F: 상태 변경 메서드면 깊이 보너스 적용
          const nextDepth = isStateChangeMethod(site.callee)
            ? Math.min(depth + 1, maxDepth - stateChangeBonus)
            : depth + 1;

          dfsTraverse(
            site.callee,
            resolvedFile,
            nextDepth,
            maxDepth,
            stateChangeBonus,
            moduleByFile,
            importIndex,
            symbolIndex,
            visited,
            collectedSites,
            seenSiteKeys,
          );
        }
      }
    }
  }
}

// ── 인덱스 구축 ──

/** import 경로 → 파일 경로 매핑 */
function buildImportIndex(modules: ParsedModule[]): Map<string, string[]> {
  const index = new Map<string, string[]>();

  for (const mod of modules) {
    // 파일의 export된 심볼을 기반으로 import 경로를 역매핑
    const basePath = mod.file_path.replace(/\.\w+$/, "");
    const variants = [
      basePath,
      basePath.replace(/\/index$/, ""),
      `./${basePath}`,
      `../${basePath.split("/").pop()}`,
    ];

    for (const variant of variants) {
      const existing = index.get(variant) ?? [];
      existing.push(mod.file_path);
      index.set(variant, existing);
    }
  }

  return index;
}

/** 심볼명 → 정의된 파일 경로 */
function buildSymbolIndex(modules: ParsedModule[]): Map<string, string> {
  const index = new Map<string, string>();

  for (const mod of modules) {
    for (const exp of mod.exports) {
      index.set(exp.name, mod.file_path);
      // ClassName.methodName 형태도 등록
      if (exp.kind === "class") {
        for (const site of mod.call_sites) {
          if (site.caller.startsWith(`${exp.name}.`)) {
            index.set(site.caller, mod.file_path);
          }
        }
      }
    }
  }

  return index;
}

// ── 헬퍼 ──

function isCallerMatch(caller: string, symbol: string): boolean {
  return caller === symbol || caller.startsWith(`${symbol}.`) || caller.endsWith(`.${symbol}`);
}

function resolveCalleeFile(
  callee: string,
  currentFile: string,
  currentModule: ParsedModule,
  importIndex: Map<string, string[]>,
  symbolIndex: Map<string, string>,
): string | null {
  // 1. 심볼 인덱스에서 직접 찾기
  const directFile = symbolIndex.get(callee);
  if (directFile) return directFile;

  // 2. callee가 "ClassName.method" 형태면 ClassName으로 찾기
  const className = callee.split(".")[0];
  const classFile = symbolIndex.get(className);
  if (classFile) return classFile;

  // 3. 현재 모듈의 import에서 찾기
  for (const imp of currentModule.imports) {
    if (imp.name === className || imp.name === callee) {
      const files = importIndex.get(imp.source);
      if (files && files.length > 0) return files[0];
    }
  }

  // 4. 같은 파일 내 호출
  return currentFile;
}
