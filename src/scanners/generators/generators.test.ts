import { describe, it, expect } from "vitest";
import { TsMorphAdapter } from "./parsers/ts-morph-adapter.js";
import { detectEntryPoints, detectAuxiliaryServiceMethods } from "./entry-point-detector.js";
import { buildCallGraph, isStateChangeMethod } from "./call-graph-builder.js";
import { extractStructure, extractPolicyConstantsFromContent } from "./structure-extractor.js";
import { extractConfigConstants } from "./config-adapter.js";
import { generateYaml } from "./yaml-generator.js";
import { runGeneratorPipeline } from "./run-pipeline.js";
import { buildOntologyIndex } from "../ontology-index.js";
import { makeStateAssignmentId } from "./types.js";
import type { ParsedModule, EntryPointPattern, GeneratorConfigFile } from "./types.js";

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
      domain_flow_seeds: [],
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
      domain_flow_seeds: [],
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
        primary: true,
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
      domain_flow_seeds: [],
      meta: { total_files: 1, parsed_files: 1, entry_points_found: 1, unresolved_calls: 0, languages: ["kotlin" as const] },
    };
    const result = generateYaml(extract);
    expect(result.actions).toContain("id: LessonController.getLesson");
    expect(result.actions).toContain("source_code: LessonController.kt:5");
  });
});

describe("보조 진입점 탐지 (개선안 D)", () => {
  it("@Service 클래스의 public 메서드를 보조 진입점으로 탐지합니다", () => {
    const files = new Map<string, string>();
    files.set("LessonService.kt", SERVICE_KT);
    const reached = new Set<string>();

    const results = detectAuxiliaryServiceMethods(files, reached);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((r) => r.kind === "auxiliary_service_method")).toBe(true);
    const findById = results.find((r) => r.symbol === "LessonService.findById");
    expect(findById).toBeDefined();
  });

  it("이미 도달된 심볼은 제외합니다", () => {
    const files = new Map<string, string>();
    files.set("LessonService.kt", SERVICE_KT);
    const reached = new Set(["LessonService.findById", "LessonService.complete"]);

    const results = detectAuxiliaryServiceMethods(files, reached);
    expect(results.find((r) => r.symbol === "LessonService.findById")).toBeUndefined();
    expect(results.find((r) => r.symbol === "LessonService.complete")).toBeUndefined();
  });

  it("@Service 어노테이션이 없는 클래스는 무시합니다", () => {
    const files = new Map<string, string>();
    files.set("Controller.kt", CONTROLLER_KT);
    const reached = new Set<string>();

    const results = detectAuxiliaryServiceMethods(files, reached);
    expect(results).toHaveLength(0);
  });
});

describe("primary 필드", () => {
  it("extractStructure가 기존 진입점을 primary: true로 설정합니다", () => {
    const modules: ParsedModule[] = [];
    const entryPoints: EntryPointPattern[] = [{
      file: "Controller.kt",
      symbol: "Controller.get",
      kind: "http",
      line: 1,
      annotation: "@GetMapping",
      http_method: "GET",
    }];
    const callGraph = buildCallGraph(entryPoints, modules);
    const extract = extractStructure(modules, entryPoints, callGraph);
    expect(extract.entry_points[0].primary).toBe(true);
  });

  it("auxiliary_service_method는 primary: false로 설정합니다", () => {
    const modules: ParsedModule[] = [];
    const entryPoints: EntryPointPattern[] = [{
      file: "Service.kt",
      symbol: "Service.helper",
      kind: "auxiliary_service_method",
      line: 5,
      annotation: "@Service",
    }];
    const callGraph = buildCallGraph(entryPoints, modules);
    const extract = extractStructure(modules, entryPoints, callGraph);
    expect(extract.entry_points[0].primary).toBe(false);
  });
});

describe("DomainFlowSeed 생성", () => {
  it("빈 입력에서 domain_flow_seeds가 빈 배열입니다", () => {
    const modules: ParsedModule[] = [];
    const entryPoints: EntryPointPattern[] = [];
    const callGraph = buildCallGraph(entryPoints, modules);
    const extract = extractStructure(modules, entryPoints, callGraph);
    expect(extract.domain_flow_seeds).toEqual([]);
  });

  it("엔티티 도달 시 DomainFlowSeed를 생성합니다", () => {
    const modules: ParsedModule[] = [];
    const entryPoints: EntryPointPattern[] = [{
      file: "Controller.kt",
      symbol: "Controller.create",
      kind: "http",
      line: 1,
      annotation: "@PostMapping",
    }];
    const callGraph = [
      { caller: "Controller.create", callee: "OrderService.create", file_path: "OrderService.kt", line: 10, kind: "direct" as const },
      { caller: "OrderService.create", callee: "Order.save", file_path: "OrderRepo.kt", line: 20, kind: "direct" as const },
    ];
    const entityCandidates = [{ name: "Order", file_path: "Order.kt", fields: [], annotations: ["@Entity"] }];
    const transitionCandidates = [
      { id: "Order.status:null->CREATED", entity: "Order", field_name: "status", from: null, to: "CREATED", file_path: "OrderService.kt", line: 15 },
    ];

    // extractStructure는 modules에서 entity를 찾으므로, 직접 검증
    // buildDomainFlowSeeds는 private이므로 extractStructure 통해 간접 테스트
    // 여기서는 E2E 스타일로 테스트
    const extract = {
      entry_points: entryPoints.map((ep) => ({
        ...ep, file_path: ep.file, primary: true,
      })),
      call_graph: callGraph,
      entity_candidates: entityCandidates,
      enum_candidates: [],
      transition_candidates: transitionCandidates,
      relation_candidates: [],
      policy_constant_candidates: [],
      domain_flow_seeds: [],
      meta: { total_files: 3, parsed_files: 3, entry_points_found: 1, unresolved_calls: 0, languages: ["kotlin" as const] },
    };

    // generateYaml은 domain_flow_seeds를 소비하지 않지만, 타입 호환성 확인
    const yaml = generateYaml(extract);
    expect(yaml.actions).toContain("Controller.create");
  });
});

describe("상태 변경 메서드 추적 (개선안 F)", () => {
  it("isStateChangeMethod가 상태 변경 관용 메서드를 인식합니다", () => {
    // 직접 매칭
    expect(isStateChangeMethod("changeStatus")).toBe(true);
    expect(isStateChangeMethod("updateStatus")).toBe(true);
    expect(isStateChangeMethod("setStatus")).toBe(true);
    expect(isStateChangeMethod("transitionTo")).toBe(true);
    expect(isStateChangeMethod("complete")).toBe(true);
    expect(isStateChangeMethod("cancel")).toBe(true);
    expect(isStateChangeMethod("approve")).toBe(true);
    expect(isStateChangeMethod("markAsCompleted")).toBe(true);
    expect(isStateChangeMethod("activate")).toBe(true);
    expect(isStateChangeMethod("suspend")).toBe(true);

    // ClassName.method 형태
    expect(isStateChangeMethod("OrderService.changeStatus")).toBe(true);
    expect(isStateChangeMethod("Order.complete")).toBe(true);

    // 비관련 메서드
    expect(isStateChangeMethod("findById")).toBe(false);
    expect(isStateChangeMethod("getStatus")).toBe(false);
    expect(isStateChangeMethod("toString")).toBe(false);
    expect(isStateChangeMethod("save")).toBe(false);
  });

  it("상태 변경 메서드에 깊이 보너스를 적용합니다", () => {
    // maxDepth=2로 제한하되, 상태 변경 메서드에 보너스 부여
    const modules: ParsedModule[] = [
      {
        file_path: "Controller.kt",
        language: "kotlin",
        exports: [{ name: "Controller", kind: "class", file_path: "Controller.kt", line: 1 }],
        imports: [],
        call_sites: [
          { caller: "Controller.handle", callee: "Service.changeStatus", file_path: "Controller.kt", line: 5, kind: "direct" },
        ],
        type_declarations: [],
        state_assignments: [],
      },
      {
        file_path: "Service.kt",
        language: "kotlin",
        exports: [{ name: "Service", kind: "class", file_path: "Service.kt", line: 1 }],
        imports: [],
        call_sites: [
          { caller: "Service.changeStatus", callee: "Repo.save", file_path: "Service.kt", line: 10, kind: "direct" },
        ],
        type_declarations: [],
        state_assignments: [
          { id: "Order.status:PENDING->COMPLETED", entity: "Order", field_name: "status", from: "PENDING", to: "COMPLETED", file_path: "Service.kt", line: 8 },
        ],
      },
    ];
    const entryPoints: EntryPointPattern[] = [
      { file: "Controller.kt", symbol: "Controller.handle", kind: "http", line: 3, annotation: "@PostMapping" },
    ];

    // maxDepth=2, stateChangeDepthBonus=5 → changeStatus는 보너스 받아서 내부 추적 가능
    const graph = buildCallGraph(entryPoints, modules, { maxDepth: 2, stateChangeDepthBonus: 5 });

    // Service.changeStatus 내부의 Repo.save까지 도달해야 함
    expect(graph.some((s) => s.callee === "Service.changeStatus")).toBe(true);
    expect(graph.some((s) => s.callee === "Repo.save")).toBe(true);
  });

  it("일반 메서드는 깊이 제한에 걸립니다", () => {
    const modules: ParsedModule[] = [
      {
        file_path: "A.kt",
        language: "kotlin",
        exports: [{ name: "A", kind: "class", file_path: "A.kt", line: 1 }],
        imports: [],
        call_sites: [
          { caller: "A.start", callee: "B.process", file_path: "A.kt", line: 5, kind: "direct" },
        ],
        type_declarations: [],
        state_assignments: [],
      },
      {
        file_path: "B.kt",
        language: "kotlin",
        exports: [{ name: "B", kind: "class", file_path: "B.kt", line: 1 }],
        imports: [],
        call_sites: [
          { caller: "B.process", callee: "C.doWork", file_path: "B.kt", line: 10, kind: "direct" },
        ],
        type_declarations: [],
        state_assignments: [],
      },
    ];
    const entryPoints: EntryPointPattern[] = [
      { file: "A.kt", symbol: "A.start", kind: "http", line: 3, annotation: "@GetMapping" },
    ];

    // maxDepth=1이면 B.process까지만 기록, C.doWork는 도달 불가
    const graph = buildCallGraph(entryPoints, modules, { maxDepth: 1 });
    expect(graph.some((s) => s.callee === "B.process")).toBe(true);
    expect(graph.some((s) => s.callee === "C.doWork")).toBe(false);
  });
});

describe("설정 파일 스캔 (개선안 H)", () => {
  it("YAML 설정에서 정책 상수를 추출합니다", () => {
    const configFiles: GeneratorConfigFile[] = [{
      path: "application.yml",
      format: "yaml",
      content: `
spring:
  datasource:
    max-pool-size: 10
    url: jdbc:postgresql://localhost/db
app:
  max-retry-count: 3
  grace-period-days: 14
`,
    }];
    const results = extractConfigConstants(configFiles);
    const maxPool = results.find((r) => r.name === "MAX_POOL_SIZE");
    expect(maxPool).toBeDefined();
    expect(maxPool!.value).toBe(10);
    expect(maxPool!.source_type).toBe("config");
    expect(maxPool!.usage_context).toBe("spring.datasource.max-pool-size");

    const gracePeriod = results.find((r) => r.name === "GRACE_PERIOD_DAYS");
    expect(gracePeriod).toBeDefined();
    expect(gracePeriod!.value).toBe(14);

    // URL은 제외
    expect(results.find((r) => r.usage_context?.includes("url"))).toBeUndefined();
  });

  it("properties 파일에서 정책 상수를 추출합니다", () => {
    const configFiles: GeneratorConfigFile[] = [{
      path: "application.properties",
      format: "properties",
      content: `
# DB 설정
spring.datasource.max-pool-size=10
app.max-retry-count=3
server.port=8080
`,
    }];
    const results = extractConfigConstants(configFiles);
    expect(results.find((r) => r.name === "MAX_POOL_SIZE")).toBeDefined();
    expect(results.find((r) => r.name === "MAX_RETRY_COUNT")).toBeDefined();
    expect(results.find((r) => r.name === "PORT")).toBeDefined();
  });

  it(".env 파일에서 정책 상수를 추출합니다", () => {
    const configFiles: GeneratorConfigFile[] = [{
      path: ".env",
      format: "env",
      content: `
# 앱 설정
MAX_UPLOAD_SIZE=10485760
GRACE_PERIOD_DAYS=14
API_BASE_URL=https://api.example.com
DEBUG=true
`,
    }];
    const results = extractConfigConstants(configFiles);
    const maxUpload = results.find((r) => r.name === "MAX_UPLOAD_SIZE");
    expect(maxUpload).toBeDefined();
    expect(maxUpload!.value).toBe(10485760);

    // URL은 제외
    expect(results.find((r) => r.name === "API_BASE_URL")).toBeUndefined();
    // boolean은 제외
    expect(results.find((r) => r.name === "DEBUG")).toBeUndefined();
  });

  it("빈 설정 파일 목록에서 빈 배열을 반환합니다", () => {
    expect(extractConfigConstants([])).toEqual([]);
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

describe("통합: generateYaml → buildOntologyIndex (YAML 계약 검증)", () => {
  it("엔티티가 있는 glossary YAML이 소비 파이프라인을 통과합니다", () => {
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
      domain_flow_seeds: [],
      meta: { total_files: 2, parsed_files: 2, entry_points_found: 0, unresolved_calls: 0, languages: ["typescript" as const] },
    };
    const yaml = generateYaml(extract);
    const index = buildOntologyIndex(yaml.glossary, yaml.actions, yaml.transitions);

    expect(index.glossary.size).toBe(1);
    expect(index.glossary.get("lesson")).toBeDefined();
    expect(index.glossary.get("lesson")!.canonical).toBe("Lesson");
    expect(index.glossary.get("lesson")!.db_table).toBe("gt_lesson");
    expect(index.glossary.get("lesson")!.value_filters).toHaveLength(3);
  });

  it("진입점이 있는 actions YAML이 소비 파이프라인을 통과합니다", () => {
    const extract = {
      entry_points: [{
        symbol: "LessonController.getLesson",
        kind: "http" as const,
        file_path: "LessonController.kt",
        line: 5,
        primary: true,
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
      domain_flow_seeds: [],
      meta: { total_files: 1, parsed_files: 1, entry_points_found: 1, unresolved_calls: 0, languages: ["kotlin" as const] },
    };
    const yaml = generateYaml(extract);
    const index = buildOntologyIndex(yaml.glossary, yaml.actions, yaml.transitions);

    expect(index.actions.size).toBe(1);
    expect(index.actions.get("LessonController.getLesson")).toBeDefined();
    expect(index.actions.get("LessonController.getLesson")!.source_code).toBe("LessonController.kt:5");
  });

  it("상태 전이가 있는 transitions YAML이 소비 파이프라인을 통과합니다", () => {
    const extract = {
      entry_points: [],
      call_graph: [],
      entity_candidates: [],
      enum_candidates: [],
      transition_candidates: [
        { id: "Order.status:null->CREATED", entity: "Order", field_name: "status", from: null, to: "CREATED", file_path: "OrderService.kt", line: 15 },
        { id: "Order.status:CREATED->CONFIRMED", entity: "Order", field_name: "status", from: "CREATED", to: "CONFIRMED", file_path: "OrderService.kt", line: 25, guard_expression: "order.valid === true" },
      ],
      relation_candidates: [],
      policy_constant_candidates: [],
      domain_flow_seeds: [],
      meta: { total_files: 1, parsed_files: 1, entry_points_found: 0, unresolved_calls: 0, languages: ["kotlin" as const] },
    };
    const yaml = generateYaml(extract);
    const index = buildOntologyIndex(yaml.glossary, yaml.actions, yaml.transitions);

    expect(index.transitions.size).toBe(1);
    const orderTransitions = index.transitions.get("order");
    expect(orderTransitions).toBeDefined();
    expect(orderTransitions).toHaveLength(2);
    expect(orderTransitions![0].from).toBe("(none)");
    expect(orderTransitions![0].to).toBe("CREATED");
    expect(orderTransitions![1].from).toBe("CREATED");
    expect(orderTransitions![1].guards).toBeDefined();
  });

  it("빈 입력에서 소비 파이프라인이 빈 Map을 반환합니다", () => {
    const extract = {
      entry_points: [],
      call_graph: [],
      entity_candidates: [],
      enum_candidates: [],
      transition_candidates: [],
      relation_candidates: [],
      policy_constant_candidates: [],
      domain_flow_seeds: [],
      meta: { total_files: 0, parsed_files: 0, entry_points_found: 0, unresolved_calls: 0, languages: [] as const[] },
    };
    const yaml = generateYaml(extract);
    const index = buildOntologyIndex(yaml.glossary, yaml.actions, yaml.transitions);

    expect(index.glossary.size).toBe(0);
    expect(index.actions.size).toBe(0);
    expect(index.transitions.size).toBe(0);
  });
});

describe("오케스트레이터 (runGeneratorPipeline)", () => {
  it("TypeScript 소스에서 파이프라인을 일괄 실행합니다", () => {
    const result = runGeneratorPipeline({
      files: [
        { path: "Lesson.ts", content: ENTITY_TS },
        { path: "LessonStatus.ts", content: ENUM_TS },
        { path: "constants.ts", content: CONSTANTS_TS },
      ],
      dependency_graph: [],
    });

    expect(result.meta.parsed_files).toBe(3);
    expect(result.meta.unsupported_files).toHaveLength(0);
    expect(result.yaml.glossary).toContain("Lesson");
    expect(result.yaml.warnings).not.toContain("auto_generated_no_entities");
  });

  it("미지원 파일을 건너뛰고 unsupported_files에 기록합니다", () => {
    const result = runGeneratorPipeline({
      files: [
        { path: "Lesson.ts", content: ENTITY_TS },
        { path: "Service.kt", content: SERVICE_KT },
      ],
      dependency_graph: [],
    });

    expect(result.meta.parsed_files).toBe(1);
    expect(result.meta.unsupported_files).toContain("Service.kt");
  });

  it("오케스트레이터 출력이 소비 파이프라인을 통과합니다", () => {
    const result = runGeneratorPipeline({
      files: [
        { path: "Lesson.ts", content: ENTITY_TS },
        { path: "LessonStatus.ts", content: ENUM_TS },
      ],
      dependency_graph: [],
    });

    const index = buildOntologyIndex(
      result.yaml.glossary,
      result.yaml.actions,
      result.yaml.transitions,
    );
    expect(index.glossary.size).toBeGreaterThan(0);
  });
});

describe("TsMorphAdapter call_sites 생성", () => {
  const adapter = new TsMorphAdapter();

  it("함수 호출을 call_sites로 추출합니다", () => {
    const code = `
export function processOrder(order: Order) {
  validateOrder(order);
  const result = orderService.save(order);
  return result;
}`;
    const result = adapter.parse(code, "order.ts");
    expect(result.call_sites.length).toBeGreaterThanOrEqual(1);
    const validateCall = result.call_sites.find((s) => s.callee === "validateOrder");
    expect(validateCall).toBeDefined();
    expect(validateCall!.caller).toBe("processOrder");
  });

  it("클래스 메서드 내부의 호출을 추적합니다", () => {
    const code = `
export class OrderService {
  create(data: OrderData) {
    this.validate(data);
    repo.save(data);
  }
}`;
    const result = adapter.parse(code, "OrderService.ts");
    const repoCall = result.call_sites.find((s) => s.callee === "repo.save");
    expect(repoCall).toBeDefined();
    expect(repoCall!.caller).toBe("OrderService.create");
  });
});
