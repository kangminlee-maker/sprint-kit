/**
 * source_code 문자열을 실제 파일 경로로 해석(resolve)한다.
 *
 * ActionEntry.source_code와 TransitionEntry.source_code는 자연어 문자열이다.
 * 예: "PodoScheduleServiceImplV2.match()"
 * 이 문자열에서 클래스명을 추출하고, ScanResult.files에서 해당 파일을 찾는다.
 */

import type { CodeLocation } from "./ontology-query.js";
import type { FileEntry } from "./types.js";

// ─── Types ───

export interface ResolvedLocation {
  reference: string;
  resolved_files: string[];
  resolution_method: "filename" | "unresolved";
  entity?: string;  // CodeLocation.entity를 보존. resolution 실패 시에도 엔티티 정보 유지
}

// ─── Resolve ───

/**
 * CodeLocation 배열의 source_code 참조를 실제 파일 경로로 해석한다.
 *
 * 해석 방법:
 * 1. reference에서 클래스명 추출: "PodoScheduleServiceImplV2.match()" → "PodoScheduleServiceImplV2"
 * 2. files에서 해당 클래스명을 포함하는 파일 경로 검색
 * 3. 매칭 실패 시 resolution_method: "unresolved"
 */
export function resolveCodeLocations(
  locations: CodeLocation[],
  files: FileEntry[],
): ResolvedLocation[] {
  return locations.map((loc) => {
    const className = extractClassName(loc.reference);
    if (!className) {
      return { reference: loc.reference, resolved_files: [], resolution_method: "unresolved" as const, entity: loc.entity || undefined };
    }

    const matched = files
      .filter((f) => f.path.includes(className))
      .map((f) => f.path);

    return {
      reference: loc.reference,
      resolved_files: matched,
      resolution_method: matched.length > 0 ? "filename" as const : "unresolved" as const,
      entity: loc.entity || undefined,
    };
  });
}

// ─── Helpers ───

/**
 * source_code 문자열에서 클래스명을 추출한다.
 *
 * 예:
 * "PodoScheduleServiceImplV2.match()" → "PodoScheduleServiceImplV2"
 * "LectureCommandServiceImpl.createNewPodoLecture()" → "LectureCommandServiceImpl"
 * "AuthenticationGateway.oauthLogin(), OauthService.authenticate()" → "AuthenticationGateway"
 *   (첫 번째 클래스명만 추출 — 복수 참조는 호출자가 locations를 분리하여 전달)
 */
function extractClassName(reference: string): string | null {
  // "ClassName.method()" 또는 "ClassName" 패턴
  const match = reference.match(/^([A-Z][A-Za-z0-9]+)/);
  return match ? match[1] : null;
}
