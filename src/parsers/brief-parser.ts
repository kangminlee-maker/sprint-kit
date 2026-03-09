/**
 * Brief parser — extracts structured information from a brief.md file.
 *
 * 1. What it is: brief.md 파일의 텍스트 내용을 읽어, 각 섹션별 텍스트와
 *    추가 소스 목록을 구조화된 객체로 변환하는 순수 함수입니다.
 * 2. Why it exists: Path B (brief 작성 완료 후 실행)에서 brief.md의 필수
 *    항목이 채워져 있는지 검증하고, 소스 정보를 추출해야 합니다.
 *    이 파서가 없으면 brief.md의 내용을 프로그램이 해석할 수 없습니다.
 * 3. How it relates: executeStart()의 Path B에서 호출됩니다.
 *    추출된 additionalSources는 config/project-config.ts의 resolveSources()에
 *    전달되어 3-way 소스 병합에 참여합니다.
 */

import type { SourceEntry } from "../kernel/types.js";

// ─── Output Types ───

export interface ParsedBrief {
  title: string;
  description: string;
  purpose: string;
  targetUsers: string;
  expectedResult: string;
  includeScope?: string;
  excludeScope?: string;
  constraints?: string;
  additionalSources: SourceEntry[];
  validation: {
    isComplete: boolean;
    missingFields: string[];
  };
}

// ─── Section extraction ───

/**
 * Extract the content between an h2 heading and the next h2 heading (or EOF).
 * Returns the trimmed content with HTML comments removed.
 */
function extractSection(content: string, sectionName: string): string {
  // Match "## sectionName" possibly followed by "(필수)" or other suffixes
  const pattern = new RegExp(
    `^## ${escapeRegex(sectionName)}[^\\n]*\\n`,
    "m",
  );
  const match = pattern.exec(content);
  if (!match) return "";

  const startIndex = match.index + match[0].length;
  // Find the next h2 heading
  const nextH2 = /^## /m;
  const rest = content.slice(startIndex);
  const nextMatch = nextH2.exec(rest);
  const sectionContent = nextMatch ? rest.slice(0, nextMatch.index) : rest;

  return stripComments(sectionContent).trim();
}

/**
 * Remove HTML comments from text.
 */
function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, "").trim();
}

/**
 * Check whether a section has meaningful (non-empty, non-comment) content.
 */
function isSectionFilled(content: string): boolean {
  const stripped = stripComments(content);
  // Check if there's at least 1 non-empty line
  return stripped.split("\n").some((line) => line.trim().length > 0);
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Additional source parsing ───

/**
 * Parse additional sources from the "추가 소스" subsection.
 *
 * Matches checklist items like:
 *   - [ ] API 서버 소스 (add-dir: /path/to/api)
 *   - [x] 디자인 파일 (figma-mcp: abc123)
 *
 * Ignores placeholder items containing "여기에 추가".
 */
function parseAdditionalSources(content: string): SourceEntry[] {
  // Find the "### 추가 소스" section
  const sectionPattern = /^### 추가 소스[^\n]*\n/m;
  const sectionMatch = sectionPattern.exec(content);
  if (!sectionMatch) return [];

  const startIndex = sectionMatch.index + sectionMatch[0].length;
  // Find the next heading (## or ###) or end
  const rest = content.slice(startIndex);
  const nextHeading = /^#{2,3} /m;
  const nextMatch = nextHeading.exec(rest);
  const sectionContent = nextMatch ? rest.slice(0, nextMatch.index) : rest;

  const sources: SourceEntry[] = [];
  // Match checklist items: - [ ] or - [x] followed by description (type: identifier)
  const itemPattern = /^- \[[ x]\] (.+?) \((\S+?):\s*(.+?)\)\s*$/gm;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemPattern.exec(sectionContent)) !== null) {
    const description = itemMatch[1];
    const type = itemMatch[2];
    const identifier = itemMatch[3];

    // Ignore placeholder items
    if (description.includes("여기에 추가")) continue;

    const entry = buildSourceEntry(type, identifier, description);
    if (entry) {
      sources.push(entry);
    }
  }

  return sources;
}

/**
 * Build a SourceEntry from parsed type/identifier/description.
 */
function buildSourceEntry(
  type: string,
  identifier: string,
  description: string,
): SourceEntry | null {
  switch (type) {
    case "add-dir":
      return { type: "add-dir", path: identifier, description };
    case "github-tarball":
      return { type: "github-tarball", url: identifier, description };
    case "figma-mcp":
      return { type: "figma-mcp", file_key: identifier, description };
    case "obsidian-vault":
      return { type: "obsidian-vault", path: identifier, description };
    default:
      return null;
  }
}

// ─── Main parser ───

/**
 * Parse a brief.md file content into a structured ParsedBrief.
 *
 * Section extraction rules:
 * - Each section starts with `## {title}` (h2 heading)
 * - Content is everything between the heading and the next h2 heading (or EOF)
 * - HTML comments are ignored
 * - A section is "filled" if it has at least 1 non-empty, non-comment line
 * - Required sections: "변경 목적", "대상 사용자", "기대 결과"
 */
export function parseBrief(briefContent: string): ParsedBrief {
  const purpose = extractSection(briefContent, "변경 목적");
  const targetUsers = extractSection(briefContent, "대상 사용자");
  const expectedResult = extractSection(briefContent, "기대 결과");
  const includeScope = extractSection(briefContent, "포함 범위") || undefined;
  const excludeScope = extractSection(briefContent, "제외 범위") || undefined;
  const constraints =
    extractSection(briefContent, "제약 및 참고사항") || undefined;

  // Validation: check required fields
  const requiredFields: Array<[string, string]> = [
    ["변경 목적", purpose],
    ["대상 사용자", targetUsers],
    ["기대 결과", expectedResult],
  ];

  const missingFields: string[] = [];
  for (const [name, value] of requiredFields) {
    if (!isSectionFilled(value)) {
      missingFields.push(name);
    }
  }

  // Title: first non-empty line from purpose section
  const title = purpose
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0) ?? "";

  // Description: purpose + expectedResult combined
  const description = [purpose, expectedResult].filter(Boolean).join("\n\n");

  // Additional sources from "추가 소스" subsection
  const additionalSources = parseAdditionalSources(briefContent);

  return {
    title,
    description,
    purpose,
    targetUsers,
    expectedResult,
    includeScope,
    excludeScope,
    constraints,
    additionalSources,
    validation: {
      isComplete: missingFields.length === 0,
      missingFields,
    },
  };
}
