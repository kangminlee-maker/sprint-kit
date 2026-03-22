import { describe, it, expect } from "vitest";
import { collectRelevantChunks } from "./code-chunk-collector.js";
import type { ResolvedLocation } from "./ontology-resolve.js";
import type { OntologyQueryResult } from "./ontology-query.js";
import type { ScanResult } from "./types.js";

// ─── Fixtures ───

const RESOLVED: ResolvedLocation[] = [
  { reference: "TrialLectureCommandServiceImpl.create()", resolved_files: ["src/TrialLectureCommandServiceImpl.java"], resolution_method: "filename" },
  { reference: "UnknownService.call()", resolved_files: [], resolution_method: "unresolved" },
];

const ONTOLOGY_RESULT: OntologyQueryResult = {
  matched_entities: ["TrialLesson", "Ticket"],
  code_locations: [{ reference: "TrialLectureCommandServiceImpl.create()", context: "Action TRIAL-1", entity: "TrialLesson" }],
  db_tables: ["GT_CLASS"],
  related_actions: [{ id: "TRIAL-1", display_name: "체험 수업 생성", source_code: "TrialLectureCommandServiceImpl.create()" }],
  related_transitions: [],
  value_filters: [{ entity: "TrialLesson", column: "CITY", value: "PODO_TRIAL", description: "체험 수업" }],
};

const SCAN_RESULT: ScanResult = {
  source: { type: "add-dir", path: "./src" },
  scanned_at: new Date().toISOString(),
  files: [
    { path: "src/TrialLectureCommandServiceImpl.java", category: "source", language: "java", size_bytes: 2000 },
    { path: "src/LectureController.java", category: "source", language: "java", size_bytes: 1500 },
    { path: "test/TrialLectureTest.java", category: "test", language: "java", size_bytes: 1000 },
    { path: "schema/GT_CLASS.sql", category: "schema", language: "sql", size_bytes: 500 },
  ],
  content_hashes: {},
  dependency_graph: [
    { from: "src/LectureController.java", to: "src/TrialLectureCommandServiceImpl.java", kind: "import" },
  ],
  api_patterns: [
    { file: "src/LectureController.java", method: "GET", path: "/trial/list", line: 30 },
  ],
  schema_patterns: [
    { file: "schema/GT_CLASS.sql", table: "GT_CLASS", columns: "id, city, status", line: 1 },
  ],
  config_patterns: [],
  doc_structure: [],
};

// ─── Tests ───

describe("collectRelevantChunks", () => {
  it("6관점 모두에서 결과를 생성한다", () => {
    const result = collectRelevantChunks(RESOLVED, ONTOLOGY_RESULT, SCAN_RESULT, ["체험", "수업"]);

    expect(result.by_viewpoint.semantics.length).toBeGreaterThan(0);
    expect(result.by_viewpoint.dependency.length).toBeGreaterThan(0);
    expect(result.coverage_gaps).toEqual([]); // 에이전트가 채움
    expect(result.search_confidence.method).toBe("ontology");
  });

  it("total_chunks는 6관점 합계이다", () => {
    const result = collectRelevantChunks(RESOLVED, ONTOLOGY_RESULT, SCAN_RESULT, ["체험"]);

    const sum = Object.values(result.by_viewpoint).reduce((acc, chunks) => acc + chunks.length, 0);
    expect(result.total_chunks).toBe(sum);
  });

  it("unresolved_count를 정확히 기록한다", () => {
    const result = collectRelevantChunks(RESOLVED, ONTOLOGY_RESULT, SCAN_RESULT, ["체험"]);

    expect(result.search_confidence.unresolved_count).toBe(1); // UnknownService
  });

  it("viewpoint_counts가 관점별 청크 수를 기록한다", () => {
    const result = collectRelevantChunks(RESOLVED, ONTOLOGY_RESULT, SCAN_RESULT, ["체험"]);

    for (const [vp, count] of Object.entries(result.search_confidence.viewpoint_counts)) {
      expect(count).toBe(result.by_viewpoint[vp as keyof typeof result.by_viewpoint].length);
    }
  });

  it("viewpointOverrides로 특정 관점을 비활성화할 수 있다", () => {
    const result = collectRelevantChunks(RESOLVED, ONTOLOGY_RESULT, SCAN_RESULT, ["체험"], {
      viewpointOverrides: { evolution: { enabled: false } },
    });

    expect(result.by_viewpoint.evolution).toEqual([]);
  });

  it("maxChunksPerViewpoint로 관점당 상한을 제어한다", () => {
    const result = collectRelevantChunks(RESOLVED, ONTOLOGY_RESULT, SCAN_RESULT, ["체험"], {
      maxChunksPerViewpoint: 1,
    });

    for (const chunks of Object.values(result.by_viewpoint)) {
      expect(chunks.length).toBeLessThanOrEqual(1);
    }
  });

  it("value_filters가 logic 관점에 반영된다", () => {
    const result = collectRelevantChunks(RESOLVED, ONTOLOGY_RESULT, SCAN_RESULT, ["체험"]);

    const logicContexts = result.by_viewpoint.logic.map((c) => c.context);
    expect(logicContexts.some((ctx) => ctx.includes("PODO_TRIAL"))).toBe(true);
  });

  it("keywords_used가 기록된다", () => {
    const result = collectRelevantChunks(RESOLVED, ONTOLOGY_RESULT, SCAN_RESULT, ["체험", "수업"]);

    expect(result.search_confidence.keywords_used).toEqual(["체험", "수업"]);
  });

  it("guard_note가 있는 action이 logic 관점에 반영된다", () => {
    const withGuard: OntologyQueryResult = {
      ...ONTOLOGY_RESULT,
      related_actions: [{
        id: "TRIAL-1",
        display_name: "체험 수업 생성",
        source_code: "TrialLectureCommandServiceImpl.create()",
        guard_note: "체험 수업은 1회만 가능",
      }],
    };
    const result = collectRelevantChunks(RESOLVED, withGuard, SCAN_RESULT, ["체험"]);

    const logicChunks = result.by_viewpoint.logic;
    expect(logicChunks.some((c) => c.context.includes("체험 수업은 1회만 가능"))).toBe(true);
    // guard_note가 있는 청크는 실제 파일 경로를 가져야 함
    const guardChunk = logicChunks.find((c) => c.context.includes("체험 수업은 1회만 가능"));
    expect(guardChunk?.file_path).toBe("src/TrialLectureCommandServiceImpl.java");
  });

  it("preconditions가 있는 action이 logic 관점에 반영된다", () => {
    const withPreconditions: OntologyQueryResult = {
      ...ONTOLOGY_RESULT,
      related_actions: [{
        id: "TRIAL-1",
        display_name: "체험 수업 생성",
        source_code: "TrialLectureCommandServiceImpl.create()",
        preconditions: [{ check: "학생이 체험 수업을 받은 적 없음" }],
      }],
    };
    const result = collectRelevantChunks(RESOLVED, withPreconditions, SCAN_RESULT, ["체험"]);

    const logicChunks = result.by_viewpoint.logic;
    expect(logicChunks.some((c) => c.context.includes("학생이 체험 수업을 받은 적 없음"))).toBe(true);
  });

  it("value_filters의 search_hint가 file_path가 아닌 별도 필드에 저장된다", () => {
    const result = collectRelevantChunks(RESOLVED, ONTOLOGY_RESULT, SCAN_RESULT, ["체험"]);

    const vfChunks = result.by_viewpoint.logic.filter((c) => c.search_hint);
    expect(vfChunks.length).toBeGreaterThan(0);
    for (const c of vfChunks) {
      expect(c.file_path).toBeUndefined();  // file_path 없이 search_hint만 사용
      expect(c.search_hint).toMatch(/^grep:/);
    }
  });

  it("search_hint만 있는 청크는 토큰 추정에서 제외된다", () => {
    const result = collectRelevantChunks(RESOLVED, ONTOLOGY_RESULT, SCAN_RESULT, ["체험"]);

    // 빈 file_path는 uniqueFiles에 포함되지 않으므로 토큰 추정에 영향 없음
    const allFilePaths = Object.values(result.by_viewpoint)
      .flat()
      .map((c) => c.file_path)
      .filter((fp): fp is string => fp !== undefined);
    const uniqueFiles = new Set(allFilePaths);
    expect(result.total_tokens_estimate).toBe(uniqueFiles.size * 500);
  });
});
