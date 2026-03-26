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

import type { EntryPointPattern, EntryPointKind, ParsedModule } from "./types.js";

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
  // ── HTTP (Python Flask/FastAPI) ──
  {
    pattern: /@(?:app|router)\.(get|post|put|delete|patch)\s*\(/,
    kind: "http",
    extractAnnotation: (m) => `@app.${m[1]}()`,
    extractHttpMethod: (m) => m[1].toUpperCase(),
    extractHttpPath: (_m, line) => {
      const pathMatch = line.match(/\(\s*["']([^"']+)["']/);
      return pathMatch?.[1];
    },
  },
  {
    pattern: /@app\.route\s*\(/,
    kind: "http",
    extractAnnotation: () => "@app.route()",
    extractHttpPath: (_m, line) => {
      const pathMatch = line.match(/\(\s*["']([^"']+)["']/);
      return pathMatch?.[1];
    },
  },
  // ── HTTP (Go Gin/Echo/Fiber) ──
  {
    pattern: /(?:r|router|e|app|g|group)\.(GET|POST|PUT|DELETE|PATCH)\s*\(/,
    kind: "http",
    extractAnnotation: (m) => `r.${m[1]}()`,
    extractHttpMethod: (m) => m[1],
    extractHttpPath: (_m, line) => {
      const pathMatch = line.match(/\(\s*["']([^"']+)["']/);
      return pathMatch?.[1];
    },
  },
  {
    pattern: /http\.Handle(?:Func)?\s*\(/,
    kind: "http",
    extractAnnotation: () => "http.HandleFunc()",
    extractHttpPath: (_m, line) => {
      const pathMatch = line.match(/\(\s*["']([^"']+)["']/);
      return pathMatch?.[1];
    },
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
  {
    pattern: /^func\s+main\s*\(\s*\)/,
    kind: "main",
    extractAnnotation: () => "func main()",
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

// ── 보조 진입점: 서비스 public 메서드 (개선안 D) ──

const SERVICE_ANNOTATIONS = ["@Service", "@Component", "@Injectable"];

/** @Service/@Component 클래스를 탐지하기 위한 정규식 */
const SERVICE_CLASS_RE =
  /(?:@(?:Service|Component|Injectable)\b[\s\S]*?)class\s+(\w+)/g;

/** public 메서드 시그니처 패턴 (Kotlin/Java/TypeScript) */
const PUBLIC_METHOD_PATTERNS: RegExp[] = [
  /^\s+fun\s+(\w+)\s*\(/,                           // Kotlin: fun methodName(
  /^\s+(?:public\s+)?(?:\w+\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/, // Java: public ReturnType methodName(
  /^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/, // TypeScript class method
];

/** private/protected/companion/constructor 등 제외 패턴 */
const EXCLUDED_METHOD_RE = /^\s+(?:private|protected|internal|companion|constructor|init|static\s*\{)/;

/**
 * 2nd pass: @Service/@Component 클래스의 public 메서드 중,
 * 1st pass 호출 그래프에서 도달되지 않은 것을 보조 진입점으로 수집합니다.
 *
 * @param files - 파일 경로 → content 맵
 * @param reachedSymbols - 1st pass 호출 그래프에서 도달된 심볼 세트
 */
export function detectAuxiliaryServiceMethods(
  files: Map<string, string>,
  reachedSymbols: Set<string>,
): EntryPointPattern[] {
  const results: EntryPointPattern[] = [];

  for (const [filePath, content] of files) {
    const lines = content.split("\n");

    // 파일에서 @Service/@Component 클래스 찾기
    const serviceClasses = findServiceClasses(content);
    if (serviceClasses.length === 0) continue;

    // 각 서비스 클래스의 범위에서 public 메서드 수집
    for (const svc of serviceClasses) {
      const methods = findPublicMethods(lines, svc.startLine, svc.className);

      for (const method of methods) {
        const symbol = `${svc.className}.${method.name}`;

        // 이미 호출 그래프에서 도달된 심볼은 건너뜀
        if (reachedSymbols.has(symbol) || reachedSymbols.has(method.name)) continue;

        results.push({
          file: filePath,
          symbol,
          kind: "auxiliary_service_method",
          line: method.line,
          annotation: svc.annotation,
        });
      }
    }
  }

  return results;
}

interface ServiceClassInfo {
  className: string;
  startLine: number;
  annotation: string;
}

interface MethodInfo {
  name: string;
  line: number;
}

function findServiceClasses(content: string): ServiceClassInfo[] {
  const results: ServiceClassInfo[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // @Service/@Component/@Injectable 어노테이션 탐지
    for (const ann of SERVICE_ANNOTATIONS) {
      if (!line.includes(ann)) continue;

      // 이 줄 또는 다음 몇 줄에서 class 선언 찾기
      for (let offset = 0; offset <= 3 && i + offset < lines.length; offset++) {
        const classMatch = lines[i + offset].match(/class\s+(\w+)/);
        if (classMatch) {
          results.push({
            className: classMatch[1],
            startLine: i + offset,
            annotation: ann,
          });
          break;
        }
      }
      break;
    }
  }

  return results;
}

function findPublicMethods(
  lines: string[],
  classStartLine: number,
  className: string,
): MethodInfo[] {
  const methods: MethodInfo[] = [];
  let braceDepth = 0;
  let inClass = false;

  for (let i = classStartLine; i < lines.length; i++) {
    const line = lines[i];

    // 중괄호 깊이 추적으로 클래스 범위 파악
    for (const ch of line) {
      if (ch === "{") {
        if (!inClass) inClass = true;
        braceDepth++;
      }
      if (ch === "}") braceDepth--;
    }

    // 클래스 범위를 벗어나면 종료
    if (inClass && braceDepth === 0) break;

    // 클래스 본문 (depth 1)에서만 메서드 탐색
    if (!inClass || braceDepth !== 1) continue;

    // private/protected 메서드 제외
    if (EXCLUDED_METHOD_RE.test(line)) continue;

    // public 메서드 패턴 매칭
    for (const pattern of PUBLIC_METHOD_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        methods.push({ name: match[1], line: i + 1 });
        break;
      }
    }
  }

  return methods;
}
