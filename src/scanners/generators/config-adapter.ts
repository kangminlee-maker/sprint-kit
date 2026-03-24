/**
 * 설정 파일 스캔 (개선안 H)
 *
 * application.yml, application.properties, .env 파일에서
 * 정책 상수 후보를 추출합니다.
 *
 * GeneratorInput.config_files에 포함된 설정 파일을 파싱하여
 * PolicyConstantCandidate(source_type: "config")로 반환합니다.
 */

import type { GeneratorConfigFile, PolicyConstantCandidate } from "./types.js";

/**
 * 설정 파일 목록에서 정책 상수 후보를 추출합니다.
 */
export function extractConfigConstants(
  configFiles: GeneratorConfigFile[],
): PolicyConstantCandidate[] {
  const results: PolicyConstantCandidate[] = [];

  for (const file of configFiles) {
    switch (file.format) {
      case "yaml":
        results.push(...parseYamlConfig(file.content, file.path));
        break;
      case "properties":
        results.push(...parsePropertiesConfig(file.content, file.path));
        break;
      case "env":
        results.push(...parseEnvConfig(file.content, file.path));
        break;
    }
  }

  return results;
}

// ── YAML 설정 파일 파서 ──

/**
 * application.yml 등의 YAML 설정 파일에서 정책 상수를 추출합니다.
 * 평탄화된 키-값 쌍으로 변환합니다.
 *
 * 예: `spring.datasource.max-pool-size: 10` → name: "MAX_POOL_SIZE", value: 10
 */
function parseYamlConfig(content: string, filePath: string): PolicyConstantCandidate[] {
  const results: PolicyConstantCandidate[] = [];
  const lines = content.split("\n");

  // 간이 YAML 파서: 들여쓰기 기반 키 경로 추적
  const keyStack: { indent: number; key: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // 빈 줄, 주석 건너뜀
    if (trimmed === "" || trimmed.trimStart().startsWith("#")) continue;

    // 키:값 분리
    const kvMatch = trimmed.match(/^(\s*)([\w.\-"-]+)\s*:\s*(.*)$/);
    if (!kvMatch) continue;

    const indent = kvMatch[1].length;
    const key = kvMatch[2].replace(/["']/g, "");
    const rawValue = kvMatch[3].trim();

    // 들여쓰기 기반 키 스택 갱신
    while (keyStack.length > 0 && keyStack[keyStack.length - 1].indent >= indent) {
      keyStack.pop();
    }
    keyStack.push({ indent, key });

    // 값이 있는 leaf 노드만 추출 (빈 값 = 하위 키가 있는 부모 노드)
    if (rawValue === "" || rawValue.startsWith("{") || rawValue.startsWith("[")) continue;

    const fullKey = keyStack.map((k) => k.key).join(".");
    const candidate = toConfigCandidate(fullKey, rawValue, filePath, i + 1);
    if (candidate) results.push(candidate);
  }

  return results;
}

// ── Properties 설정 파일 파서 ──

function parsePropertiesConfig(content: string, filePath: string): PolicyConstantCandidate[] {
  const results: PolicyConstantCandidate[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "" || trimmed.startsWith("#") || trimmed.startsWith("!")) continue;

    // key=value 또는 key: value 또는 key value
    const kvMatch = trimmed.match(/^([\w.\-"-]+)\s*[=:\s]\s*(.+)$/);
    if (!kvMatch) continue;

    const key = kvMatch[1];
    const rawValue = kvMatch[2].trim();
    const candidate = toConfigCandidate(key, rawValue, filePath, i + 1);
    if (candidate) results.push(candidate);
  }

  return results;
}

// ── .env 파일 파서 ──

function parseEnvConfig(content: string, filePath: string): PolicyConstantCandidate[] {
  const results: PolicyConstantCandidate[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const kvMatch = trimmed.match(/^([A-Z_][A-Z_0-9]*)\s*=\s*(.+)$/);
    if (!kvMatch) continue;

    const key = kvMatch[1];
    const rawValue = kvMatch[2].trim().replace(/^["']|["']$/g, "");
    const candidate = toConfigCandidate(key, rawValue, filePath, i + 1);
    if (candidate) results.push(candidate);
  }

  return results;
}

// ── 공통 헬퍼 ──

/** 정책 상수 후보 필터링 + 변환 */
function toConfigCandidate(
  key: string,
  rawValue: string,
  filePath: string,
  line: number,
): PolicyConstantCandidate | null {
  // 값이 숫자면 숫자로 변환
  const cleanValue = rawValue.replace(/^["']|["']$/g, "");
  const numValue = Number(cleanValue);
  const value = !isNaN(numValue) && cleanValue !== "" ? numValue : cleanValue;

  // 정책 상수 필터: 숫자값 또는 대문자 키만 추출
  // URL, 경로, 패키지명 등 비정책 값 제외
  if (typeof value === "string") {
    if (value.startsWith("http") || value.startsWith("/") || value.startsWith("classpath:")) return null;
    if (value.includes("${")) return null; // 변수 참조
    if (value === "true" || value === "false") return null;
  }

  // 키 이름 기반 필터: 정책성 키만 포함
  const lastSegment = key.split(".").pop() ?? key;
  const constName = toConstantCase(lastSegment);

  if (constName.length < 4) return null;

  return {
    name: constName,
    value,
    file_path: filePath,
    line,
    usage_context: key,
    source_type: "config",
  };
}

/** kebab-case/camelCase → CONSTANT_CASE 변환 */
function toConstantCase(str: string): string {
  return str
    .replace(/[-_.]/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toUpperCase();
}
