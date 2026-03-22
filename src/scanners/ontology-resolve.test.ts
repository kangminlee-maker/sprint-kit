import { describe, it, expect } from "vitest";
import { resolveCodeLocations } from "./ontology-resolve.js";
import type { CodeLocation } from "./ontology-query.js";
import type { FileEntry } from "./types.js";

const FILES: FileEntry[] = [
  { path: "src/main/java/com/app/PodoScheduleServiceImplV2.java", category: "source", language: "java", size_bytes: 5000 },
  { path: "src/main/java/com/app/LectureCommandServiceImpl.java", category: "source", language: "java", size_bytes: 3000 },
  { path: "src/main/java/com/app/TrialLectureCommandServiceImpl.java", category: "source", language: "java", size_bytes: 2000 },
  { path: "src/main/java/com/app/UserGateway.java", category: "source", language: "java", size_bytes: 4000 },
  { path: "src/test/java/com/app/LectureCommandServiceTest.java", category: "test", language: "java", size_bytes: 1500 },
];

describe("resolveCodeLocations", () => {
  it("클래스명이 파일 경로에 포함되면 매칭한다", () => {
    const locations: CodeLocation[] = [
      { reference: "PodoScheduleServiceImplV2.match()", context: "Action", entity: "Lesson" },
    ];
    const result = resolveCodeLocations(locations, FILES);
    expect(result).toHaveLength(1);
    expect(result[0].resolved_files).toEqual(["src/main/java/com/app/PodoScheduleServiceImplV2.java"]);
    expect(result[0].resolution_method).toBe("filename");
  });

  it("매칭 실패 시 unresolved를 반환한다", () => {
    const locations: CodeLocation[] = [
      { reference: "NonExistentService.call()", context: "Action", entity: "Unknown" },
    ];
    const result = resolveCodeLocations(locations, FILES);
    expect(result[0].resolved_files).toEqual([]);
    expect(result[0].resolution_method).toBe("unresolved");
  });

  it("복수 파일이 매칭될 수 있다 (클래스명이 부분 매칭)", () => {
    const locations: CodeLocation[] = [
      { reference: "LectureCommandServiceImpl.create()", context: "Action", entity: "Lesson" },
    ];
    const result = resolveCodeLocations(locations, FILES);
    // LectureCommandServiceImpl과 TrialLectureCommandServiceImpl 모두 매칭
    expect(result[0].resolved_files.length).toBeGreaterThanOrEqual(1);
    expect(result[0].resolution_method).toBe("filename");
  });

  it("빈 locations 입력 시 빈 배열을 반환한다", () => {
    const result = resolveCodeLocations([], FILES);
    expect(result).toEqual([]);
  });

  it("reference에서 첫 번째 클래스명만 추출한다", () => {
    const locations: CodeLocation[] = [
      { reference: "UserGateway.findUser(), OtherService.call()", context: "Action", entity: "User" },
    ];
    const result = resolveCodeLocations(locations, FILES);
    expect(result[0].resolved_files).toContain("src/main/java/com/app/UserGateway.java");
  });
});
