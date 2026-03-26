/**
 * Ontology Auto-Generation — Stage 1 타입 정의
 *
 * 생성 파이프라인의 중간 표현(IR)과 입력 인터페이스를 정의합니다.
 * 소비 파이프라인(ontology-index.ts 등)의 타입을 import하지 않습니다.
 * 두 파이프라인은 YAML 파일로만 연결됩니다.
 */

// ── 생성 파이프라인 입력 ──

/** Stage 1이 필요한 입력만 추출한 인터페이스.
 *  호출자가 ScanResult를 GeneratorInput으로 변환하여 전달합니다.
 *  generators/는 scanners/types.ts(ScanResult)를 직접 import하지 않습니다. */
export interface GeneratorInput {
  files: GeneratorFileEntry[];
  dependency_graph: GeneratorDepEdge[];
  config_files?: GeneratorConfigFile[];
}

export interface GeneratorFileEntry {
  path: string;
  content: string;
}

export interface GeneratorDepEdge {
  from: string;
  to: string;
}

export interface GeneratorConfigFile {
  path: string;
  content: string;
  format: "yaml" | "properties" | "env";
}

// ── 파서 출력: ParsedModule ──

/** 단일 파일의 파싱 결과 */
export interface ParsedModule {
  file_path: string;
  language: SupportedLanguage;
  exports: ExportedSymbol[];
  imports: ImportedSymbol[];
  call_sites: CallSite[];
  type_declarations: TypeDecl[];
  state_assignments: StateAssignment[];
}

export type SupportedLanguage =
  | "typescript"
  | "javascript"
  | "kotlin"
  | "java"
  | "python"
  | "go";

/**
 * 모듈 외부로 공개된(export) 심볼.
 *
 * 분류 축: ExportedSymbol은 "모듈 경계를 넘어 외부에 노출되는 심볼"을 기록.
 * TypeDecl은 "export 여부와 무관한 모든 타입 선언"을 기록.
 * export된 타입은 양쪽 모두에 기록되지만, ExportedSymbol은 TypeDecl을 참조하므로
 * fields/enum_values는 TypeDecl에만 존재합니다.
 */
export interface ExportedSymbol {
  name: string;
  /** 처리 경로 판별자 (discriminant). 원래 언어의 의미가 아닌, 파이프라인 내부의 처리 분기를 결정합니다.
   *  언어별 세부 특성(data_class, sealed, struct 등)은 annotations 배열에 기록합니다.
   *  매핑 예시: Go struct → "class", Go const+iota → "enum", Python Protocol/ABC → "interface" */
  kind: ExportedSymbolKind;
  file_path: string;
  line: number;
  type_decl_ref?: string;
  /** 언어별 어노테이션 + 구조 마커. ORM(@Entity), 프레임워크(@Service), 구조(struct, data_class, sealed) 등 */
  annotations?: string[];
}

export type ExportedSymbolKind = "class" | "interface" | "function" | "enum" | "type_alias";

export interface ImportedSymbol {
  name: string;
  source: string;
  /** import 경로의 해석 방식. call-graph-builder가 source_kind에 따라 해석 전략을 분기합니다. */
  source_kind: ImportSourceKind;
  file_path: string;
}

/** import 경로의 의미 유형.
 *  - file_path: 파일 상대/절대 경로 (TypeScript, JavaScript)
 *  - package: 패키지 경로 (Go, Java)
 *  - module: 모듈명 (Python) */
export type ImportSourceKind = "file_path" | "package" | "module";

export interface CallSite {
  caller: string;
  callee: string;
  file_path: string;
  line: number;
  kind: "direct" | "unresolved";
}

export interface StateAssignment {
  /** 합성 키: "{entity}.{field_name}:{from}->{to}" */
  id: string;
  entity: string;
  field_name: string;
  from: string | null;
  to: string;
  file_path: string;
  line: number;
  guard_expression?: string;
}

export interface TypeDecl {
  name: string;
  kind: "interface" | "enum" | "type_alias" | "class";
  file_path: string;
  line: number;
  fields?: FieldDecl[];
  enum_values?: string[];
}

export interface FieldDecl {
  name: string;
  type_name: string;
  is_fk: boolean;
  referenced_entity?: string;
}

// ── Stage 1 최종 출력: CodeStructureExtract ──

/**
 * Stage 1의 최종 출력이자 Stage 2의 입력.
 * 파서(ts-morph, tree-sitter)에 독립적인 통합 형식.
 *
 * Stage 1은 코드 구조를 추출하며, 도메인 온톨로지는 Stage 2에서
 * 비로소 생성됩니다. 이름이 "Ontology"가 아닌 이유입니다.
 *
 * Stage 1 내부에서는 ParsedModule[]을 사용하지만,
 * Stage 2에 전달하는 IR에는 포함하지 않습니다 (Stage 2 소비자 없음).
 */
export interface CodeStructureExtract {
  entry_points: EntryPoint[];
  call_graph: CallSite[];
  entity_candidates: EntityCandidate[];
  enum_candidates: EnumCandidate[];
  transition_candidates: StateAssignment[];
  relation_candidates: RelationCandidate[];
  policy_constant_candidates: PolicyConstantCandidate[];
  domain_flow_seeds: DomainFlowSeed[];
  meta: ExtractMeta;
}

/** 행위 흐름의 골격. Stage 1이 호출 그래프에서 추출하고, Stage 2가 비즈니스 의미를 부여합니다. */
export interface DomainFlowSeed {
  /** 진입점 symbol (EntryPoint.symbol과 동일) */
  entry_point: string;
  /** 경유하는 엔티티 목록 (BFS 최초 도달 순서) */
  entities_touched: string[];
  /** 유발하는 상태 전이 ID 목록 (StateAssignment.id 참조) */
  transitions_triggered: string[];
  /** 호출 깊이 (entry_point에서 가장 먼 도달 엔티티까지의 hop 수) */
  max_depth: number;
}

export interface ExtractMeta {
  total_files: number;
  parsed_files: number;
  entry_points_found: number;
  unresolved_calls: number;
  languages: SupportedLanguage[];
}

// ── 진입점 ──

export interface EntryPoint {
  symbol: string;
  kind: EntryPointKind;
  file_path: string;
  line: number;
  /** true = 기존 진입점 (HTTP, 스케줄러 등), false = 보조 진입점 (서비스 public 메서드) */
  primary: boolean;
  http_method?: string;
  http_path?: string;
  annotation?: string;
}

export type EntryPointKind =
  | "http"
  | "scheduled"
  | "event_listener"
  | "message_consumer"
  | "batch"
  | "main"
  | "auxiliary_service_method";

// ── 엔티티 후보 ──

export interface EntityCandidate {
  name: string;
  file_path: string;
  fields: FieldDecl[];
  annotations: string[];
  db_table?: string;
}

// ── enum 후보 ──

export interface EnumCandidate {
  name: string;
  file_path: string;
  values: string[];
  used_by_fields: string[];
}

// ── 관계 후보 (개선안 C: 일원화) ──

export interface RelationCandidate {
  from_entity: string;
  to_entity: string;
  kind: RelationKind;
  confidence_basis: "structural";
  evidence_kind: string;
  evidence_detail: string;
  file_path: string;
  line: number;
  basis: "extracted";
}

export type RelationKind =
  | "fk"
  | "embedded"
  | "inheritance"
  | "type_ref";

// ── 정책 상수 후보 ──

export interface PolicyConstantCandidate {
  name: string;
  value: string | number;
  file_path: string;
  line: number;
  usage_context: string;
  source_type: "code" | "config";
}

// ── 파서 어댑터 인터페이스 ──

export interface ParserAdapter {
  languages: SupportedLanguage[];
  parse(content: string, filePath: string): ParsedModule;
}

// ── 진입점 탐지 결과 ──

export interface EntryPointPattern {
  file: string;
  symbol: string;
  kind: EntryPointKind;
  line: number;
  annotation: string;
  http_method?: string;
  http_path?: string;
}

// ── StateAssignment ID 생성 ──

export function makeStateAssignmentId(
  entity: string,
  fieldName: string,
  from: string | null,
  to: string,
): string {
  return `${entity}.${fieldName}:${from ?? "null"}->${to}`;
}
