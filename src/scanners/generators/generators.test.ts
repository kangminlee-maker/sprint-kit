import { describe, it, expect } from "vitest";
import { TsMorphAdapter } from "./parsers/ts-morph-adapter.js";
import { detectEntryPoints } from "./entry-point-detector.js";
import { buildCallGraph } from "./call-graph-builder.js";
import { extractStructure, extractPolicyConstantsFromContent } from "./structure-extractor.js";
import { generateYaml } from "./yaml-generator.js";
import { makeStateAssignmentId } from "./types.js";
import type { ParsedModule, EntryPointPattern } from "./types.js";

// ── 합성 테스트 코드 ──

const CONTROLLER_KT = `
@RestController
@RequestMapping("/api/lessons")
class LessonController(private val lessonService: LessonService) {
    @GetMapping("/{id}")
    fun getLesson(@PathVariable id: Long): LessonDto = lessonService.findById(id)

    @PostMapping("/{id}/complete")
    fun completeLesson(@PathVariable id: Long): LessonDto = lessonService.complete(id)
}
`;

const SERVICE_KT = `
@Service
class LessonService(private val repo: LessonRepository) {
    fun findById(id: Long): LessonDto = repo.findById(id).toDto()

    fun complete(id: Long): LessonDto {
        val lesson = repo.findById(id)
        if (lesson.status == LessonStatus.IN_PROGRESS) {
            lesson.status = LessonStatus.COMPLETED
        }
        return repo.save(lesson).toDto()
    }
}
`;

const ENTITY_TS = `@Entity
@Table(name = "gt_lesson")
export class Lesson {
  id: number;
  title: string;
  @ManyToOne
  @JoinColumn(name = "course_id")
  course: Course;
  status: LessonStatus;
}`;

const ENUM_TS = `
export enum LessonStatus {
  DRAFT,
  IN_PROGRESS,
  COMPLETED,
}
`;

const CONSTANTS_TS = `
export const MAX_LESSONS_PER_COURSE = 50;
export const COMPLETION_GRACE_DAYS = 14;
export const SMALL = 1;
`;

const AS_CONST_TS = `
export const STATES = ["idle", "running", "completed"] as const;
`;

// ── 테스트 ──

describe("makeStateAssignmentId", () => {
  it("합성 키를 올바르게 생성합니다", () => {
    expect(makeStateAssignmentId("Lesson", "status", "IN_PROGRESS", "COMPLETED"))
      .toBe("Lesson.status:IN_PROGRESS->COMPLETED");
  });

  it("from이 null이면 'null'로 표기합니다", () => {
    expect(makeStateAssignmentId("Order", "status", null, "CREATED"))
      .toBe("Order.status:null->CREATED");
  });
});

describe("진입점 탐지기", () => {
  it("@GetMapping을 HTTP 진입점으로 탐지합니다", () => {
    const results = detectEntryPoints(CONTROLLER_KT, "LessonController.kt");
    const get = results.find((r) => r.annotation === "@GetMapping");
    expect(get).toBeDefined();
    expect(get!.kind).toBe("http");
    expect(get!.http_method).toBe("GET");
  });

  it("@PostMapping을 HTTP 진입점으로 탐지합니다", () => {
    const results = detectEntryPoints(CONTROLLER_KT, "LessonController.kt");
    const post = results.find((r) => r.http_method === "POST");
    expect(post).toBeDefined();
    expect(post!.kind).toBe("http");
  });

  it("@Scheduled를 스케줄러 진입점으로 탐지합니다", () => {
    const code = `@Scheduled(cron = "0 0 * * *")\nfun cleanup() {}`;
    const results = detectEntryPoints(code, "Scheduler.kt");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("scheduled");
  });

  it("@KafkaListener를 메시지 컨슈머로 탐지합니다", () => {
    const code = `@KafkaListener(topics = ["orders"])\nfun consume(msg: Message) {}`;
    const results = detectEntryPoints(code, "Consumer.kt");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("message_consumer");
  });

  it("@EventListener를 이벤트 리스너로 탐지합니다", () => {
    const code = `@EventListener\nfun onCreated(event: LessonCreated) {}`;
    const results = detectEntryPoints(code, "Listener.kt");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("event_listener");
  });

  it("public static void main을 main 진입점으로 탐지합니다", () => {
    const code = `public static void main(String[] args) { App.run(); }`;
    const results = detectEntryPoints(code, "App.java");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("main");
  });

  it("Next.js export function GET을 HTTP로 탐지합니다", () => {
    const code = `export async function GET(request: Request) { return Response.json({}); }`;
    const results = detectEntryPoints(code, "route.ts");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("http");
    expect(results[0].http_method).toBe("GET");
  });

  it("express app.get()을 HTTP로 탐지합니다", () => {
    const code = `app.get("/api/users", (req, res) => {});`;
    const results = detectEntryPoints(code, "server.ts");
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe("http");
    expect(results[0].http_path).toBe("/api/users");
  });
});

describe("ts-morph 어댑터", () => {
  const adapter = new TsMorphAdapter();

  it("export class를 ExportedSymbol로 추출합니다", () => {
    const result = adapter.parse(ENTITY_TS, "Lesson.ts");
    const cls = result.exports.find((e) => e.name === "Lesson");
    expect(cls).toBeDefined();
    expect(cls!.kind).toBe("class");
    expect(cls!.annotations).toContain("@Entity");
  });

  it("export enum을 TypeDecl로 추출합니다", () => {
    const result = adapter.parse(ENUM_TS, "LessonStatus.ts");
    const enumDecl = result.type_declarations.find((t) => t.name === "LessonStatus");
    expect(enumDecl).toBeDefined();
    expect(enumDecl!.kind).toBe("enum");
    expect(enumDecl!.enum_values).toEqual(["DRAFT", "IN_PROGRESS", "COMPLETED"]);
  });

  it("as const 배열을 enum으로 추출합니다 (개선안 J)", () => {
    const result = adapter.parse(AS_CONST_TS, "states.ts");
    const enumDecl = result.type_declarations.find((t) => t.name === "STATES");
    expect(enumDecl).toBeDefined();
    expect(enumDecl!.kind).toBe("enum");
    expect(enumDecl!.enum_values).toEqual(["idle", "running", "completed"]);
  });

  it("@JoinColumn 필드를 FK로 표기합니다", () => {
    const result = adapter.parse(ENTITY_TS, "Lesson.ts");
    const cls = result.type_declarations.find((t) => t.name === "Lesson");
    const fkField = cls?.fields?.find((f) => f.name === "course");
    expect(fkField).toBeDefined();
    expect(fkField!.is_fk).toBe(true);
    expect(fkField!.referenced_entity).toBe("Course");
  });

  it("TypeScript 파일의 language를 올바르게 설정합니다", () => {
    const result = adapter.parse("export function foo() {}", "test.ts");
    expect(result.language).toBe("typescript");
  });

  it("JavaScript 파일의 language를 올바르게 설정합니다", () => {
    const result = adapter.parse("export function foo() {}", "test.js");
    expect(result.language).toBe("javascript");
  });
});

describe("정책 상수 추출", () => {
  it("대문자 const 선언을 추출합니다", () => {
    const results = extractPolicyConstantsFromContent(CONSTANTS_TS, "constants.ts");
    const maxLessons = results.find((r) => r.name === "MAX_LESSONS_PER_COURSE");
    expect(maxLessons).toBeDefined();
    expect(maxLessons!.value).toBe(50);
    expect(maxLessons!.source_type).toBe("code");
  });

  it("4자 미만 상수명은 제외합니다", () => {
    const results = extractPolicyConstantsFromContent(CONSTANTS_TS, "constants.ts");
    const small = results.find((r) => r.name === "SMALL");
    // "SMALL" is 5 chars, should be included
    expect(small).toBeDefined();
  });

  it("TRUE/FALSE/NULL은 제외합니다", () => {
    const code = `export const TRUE = true;\nexport const NULL_VALUE = null;`;
    const results = extractPolicyConstantsFromContent(code, "test.ts");
    expect(results.find((r) => r.name === "TRUE")).toBeUndefined();
    // NULL_VALUE is not in exclusion list, should be included
    expect(results.find((r) => r.name === "NULL_VALUE")).toBeDefined();
  });
});

describe("YAML 생성기", () => {
  it("빈 CodeStructureExtract에서 warnings를 생성합니다", () => {
    const empty = {
      entry_points: [],
      call_graph: [],
      entity_candidates: [],
      enum_candidates: [],
      transition_candidates: [],
      relation_candidates: [],
      policy_constant_candidates: [],
      meta: { total_files: 0, parsed_files: 0, entry_points_found: 0, unresolved_calls: 0, languages: [] },
    };
    const result = generateYaml(empty);
    expect(result.warnings).toContain("auto_generated_no_entities");
    expect(result.glossary).toBe("");
  });

  it("엔티티가 있으면 glossary YAML을 생성합니다", () => {
    const extract = {
      entry_points: [],
      call_graph: [],
      entity_candidates: [{
        name: "Lesson",
        file_path: "Lesson.ts",
        fields: [{ name: "status", type_name: "LessonStatus", is_fk: false }],
        annotations: ["@Entity"],
        db_table: "gt_lesson",
      }],
      enum_candidates: [{
        name: "LessonStatus",
        file_path: "LessonStatus.ts",
        values: ["DRAFT", "IN_PROGRESS", "COMPLETED"],
        used_by_fields: ["Lesson.status"],
      }],
      transition_candidates: [],
      relation_candidates: [],
      policy_constant_candidates: [],
      meta: { total_files: 2, parsed_files: 2, entry_points_found: 0, unresolved_calls: 0, languages: ["typescript" as const] },
    };
    const result = generateYaml(extract);
    expect(result.glossary).toContain("canonical: Lesson");
    expect(result.glossary).toContain("db_table: gt_lesson");
    expect(result.glossary).toContain("meaning:");
    expect(result.warnings).not.toContain("auto_generated_no_entities");
  });

  it("진입점에서 actions YAML을 생성합니다", () => {
    const extract = {
      entry_points: [{
        symbol: "LessonController.getLesson",
        kind: "http" as const,
        file_path: "LessonController.kt",
        line: 5,
        http_method: "GET",
        http_path: "/api/lessons/{id}",
        annotation: "@GetMapping",
      }],
      call_graph: [],
      entity_candidates: [],
      enum_candidates: [],
      transition_candidates: [],
      relation_candidates: [],
      policy_constant_candidates: [],
      meta: { total_files: 1, parsed_files: 1, entry_points_found: 1, unresolved_calls: 0, languages: ["kotlin" as const] },
    };
    const result = generateYaml(extract);
    expect(result.actions).toContain("id: LessonController.getLesson");
    expect(result.actions).toContain("source_code: LessonController.kt:5");
  });
});

describe("E2E: 호출 그래프 + 구조 추출 + YAML 생성", () => {
  it("빈 입력에서 graceful degradation이 작동합니다", () => {
    const modules: ParsedModule[] = [];
    const entryPoints: EntryPointPattern[] = [];
    const callGraph = buildCallGraph(entryPoints, modules);
    const extract = extractStructure(modules, entryPoints, callGraph);
    const yaml = generateYaml(extract);

    expect(extract.meta.entry_points_found).toBe(0);
    expect(yaml.warnings).toContain("auto_generated_no_entities");
    expect(yaml.glossary).toBe("");
    expect(yaml.actions).toBe("");
    expect(yaml.transitions).toBe("");
  });
});
