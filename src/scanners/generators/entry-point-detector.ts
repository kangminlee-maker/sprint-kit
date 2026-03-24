/**
 * 진입점 탐지기
 *
 * 코드 파일에서 HTTP 엔드포인트, 스케줄러, 이벤트 리스너, 메시지 컨슈머,
 * 배치 작업, main 진입점을 탐지합니다.
 *
 * 기존 PatternDetector의 시그니처 패턴(content, filePath → Result[])을 참고하되,
 * 별도 타입(EntryPointPattern)을 사용합니다.
 * 생성↔소비 파이프라인 분리 원칙에 따라 PatternResult union에는 포함하지 않습니다.
 */

import type { EntryPointPattern, EntryPointKind } from "./types.js";

// ── 탐지 패턴 정의 ──

interface DetectionRule {
  pattern: RegExp;
  kind: EntryPointKind;
  extractAnnotation: (match: RegExpMatchArray) => string;
  extractHttpMethod?: (match: RegExpMatchArray, line: string) => string | undefined;
  extractHttpPath?: (match: RegExpMatchArray, line: string) => string | undefined;
}

const DETECTION_RULES: DetectionRule[] = [
  // ── HTTP (Spring/Kotlin/Java) ──
  {
    pattern: /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)\b/,
    kind: "http",
    extractAnnotation: (m) => `@${m[1]}`,
    extractHttpMethod: (m) => {
      const map: Record<string, string> = {
        GetMapping: "GET",
        PostMapping: "POST",
        PutMapping: "PUT",
        DeleteMapping: "DELETE",
        PatchMapping: "PATCH",
      };
      return map[m[1]] ?? undefined;
    },
    extractHttpPath: (_m, line) => {
      const pathMatch = line.match(/["']([^"']+)["']/);
      return pathMatch?.[1];
    },
  },
  // @RequestMapping (클래스 수준 — 진입점이 아닌 경로 접두사이므로 별도 처리하지 않음)
  // 메서드 수준 @RequestMapping(method = GET)은 추후 지원
  // ── HTTP (Next.js / Express) ──
  {
    pattern: /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\b/,
    kind: "http",
    extractAnnotation: (m) => `export function ${m[1]}`,
    extractHttpMethod: (m) => m[1],
  },
  {
    pattern: /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*["']/,
    kind: "http",
    extractAnnotation: (m) => `app.${m[1]}()`,
    extractHttpMethod: (m) => m[1].toUpperCase(),
    extractHttpPath: (_m, line) => {
      const pathMatch = line.match(/\(\s*["']([^"']+)["']/);
      return pathMatch?.[1];
    },
  },
  // ── 스케줄러 ──
  {
    pattern: /@Scheduled\s*\(/,
    kind: "scheduled",
    extractAnnotation: () => "@Scheduled",
  },
  {
    pattern: /setInterval\s*\(/,
    kind: "scheduled",
    extractAnnotation: () => "setInterval",
  },
  {
    pattern: /cron\.schedule\s*\(/,
    kind: "scheduled",
    extractAnnotation: () => "node-cron",
  },
  // ── 이벤트 리스너 ──
  {
    pattern: /@(EventListener|TransactionalEventListener)\b/,
    kind: "event_listener",
    extractAnnotation: (m) => `@${m[1]}`,
  },
  // ── 메시지 컨슈머 ──
  {
    pattern: /@(KafkaListener|RabbitListener|SqsListener)\b/,
    kind: "message_consumer",
    extractAnnotation: (m) => `@${m[1]}`,
  },
  // ── 배치 ──
  {
    pattern: /@StepScope\b/,
    kind: "batch",
    extractAnnotation: () => "@StepScope",
  },
  // ── Main 진입점 ──
  {
    pattern: /public\s+static\s+void\s+main\s*\(/,
    kind: "main",
    extractAnnotation: () => "public static void main",
  },
  {
    pattern: /fun\s+main\s*\(\s*(?:args\s*:\s*Array<String>)?\s*\)/,
    kind: "main",
    extractAnnotation: () => "fun main",
  },
  {
    pattern: /if\s+__name__\s*==\s*["']__main__["']/,
    kind: "main",
    extractAnnotation: () => "__name__ == '__main__'",
  },
];

// ── 심볼명 추출 ──

const SYMBOL_PATTERNS = [
  /(?:fun|function)\s+(\w+)\s*\(/,                    // fun/function name()
  /(?:def)\s+(\w+)\s*\(/,                              // def name()
  /(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function)/, // name = () => or name = function
];

function extractSymbol(
  lines: string[],
  lineIndex: number,
  filePath: string,
): string {
  // 현재 줄과 다음 몇 줄에서 함수/메서드명 탐색
  for (let offset = 0; offset <= 3 && lineIndex + offset < lines.length; offset++) {
    const line = lines[lineIndex + offset];
    for (const pattern of SYMBOL_PATTERNS) {
      const match = line.match(pattern);
      if (match) return match[1];
    }
  }

  // 클래스 컨텍스트 탐색 (위로 올라가며 class 선언 찾기)
  const className = findEnclosingClass(lines, lineIndex);
  const funcName = findFunctionName(lines, lineIndex);

  if (className && funcName) return `${className}.${funcName}`;
  if (funcName) return funcName;

  // fallback: 파일명 기반
  const base = filePath.split("/").pop()?.replace(/\.\w+$/, "") ?? "unknown";
  return base;
}

function findEnclosingClass(lines: string[], fromIndex: number): string | null {
  for (let j = fromIndex; j >= 0; j--) {
    const classMatch = lines[j].match(/class\s+(\w+)/);
    if (classMatch) return classMatch[1];
  }
  return null;
}

function findFunctionName(lines: string[], fromIndex: number): string | null {
  for (let offset = 0; offset <= 5 && fromIndex + offset < lines.length; offset++) {
    const line = lines[fromIndex + offset];
    for (const pattern of SYMBOL_PATTERNS) {
      const match = line.match(pattern);
      if (match) return match[1];
    }
  }
  return null;
}

// ── 메인 탐지 함수 ──

export function detectEntryPoints(
  content: string,
  filePath: string,
): EntryPointPattern[] {
  const lines = content.split("\n");
  const results: EntryPointPattern[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const rule of DETECTION_RULES) {
      const match = line.match(rule.pattern);
      if (!match) continue;

      const symbol = extractSymbol(lines, i, filePath);
      const key = `${filePath}:${symbol}:${rule.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        file: filePath,
        symbol,
        kind: rule.kind,
        line: i + 1,
        annotation: rule.extractAnnotation(match),
        http_method: rule.extractHttpMethod?.(match, line),
        http_path: rule.extractHttpPath?.(match, line),
      });
    }
  }

  return results;
}
