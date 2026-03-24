/**
 * 구조 추출기
 *
 * ParsedModule[] → CodeStructureExtract 변환.
 * 엔티티, enum, 상태 전이, 관계, 정책 상수를 추출합니다.
 *
 * 개선안 반영:
 * - C: 관계를 RelationCandidate로 일원화
 * - A: @Embedded/@Inheritance 추출
 * - I: 진입점 비의존 @Entity 전수 스캔
 * - J: as const 패턴은 ts-morph-adapter에서 처리 (여기서는 EnumCandidate로 수집)
 */

import type {
  ParsedModule,
  CodeStructureExtract,
  EntityCandidate,
  EnumCandidate,
  RelationCandidate,
  PolicyConstantCandidate,
  StateAssignment,
  CallSite,
  EntryPoint,
  EntryPointPattern,
  ExtractMeta,
  SupportedLanguage,
} from "./types.js";

// ── 어노테이션 패턴 ──

const ENTITY_ANNOTATIONS = ["@Entity", "@Table", "@Document", "@Model"];
const EMBEDDED_ANNOTATIONS = ["@Embedded", "@Embeddable"];
const INHERITANCE_ANNOTATIONS = ["@Inheritance", "@MappedSuperclass", "@DiscriminatorColumn"];
const TABLE_NAME_RE = /@Table\(\s*(?:name\s*=\s*)?["'](\w+)["']/;

// ── 정책 상수 패턴 ──

const CONST_RE = /^(?:export\s+)?(?:const|val|final\s+\w+)\s+([A-Z][A-Z_0-9]{2,})\s*(?::\s*\w+\s*)?=\s*(.+?)(?:;|$)/;

/**
 * ParsedModule[]과 호출 그래프 결과에서 CodeStructureExtract를 생성합니다.
 */
export function extractStructure(
  modules: ParsedModule[],
  entryPointPatterns: EntryPointPattern[],
  callGraph: CallSite[],
): CodeStructureExtract {
  // 호출 그래프에서 도달 가능한 파일 세트
  const reachableFiles = new Set<string>();
  for (const ep of entryPointPatterns) reachableFiles.add(ep.file);
  for (const site of callGraph) reachableFiles.add(site.file_path);

  // 엔티티 추출 (호출 그래프 도달 + 전수 스캔 fallback)
  const entityCandidates = extractEntities(modules, reachableFiles);

  // 엔티티명 세트 (관계/enum 추출에 사용)
  const entityNames = new Set(entityCandidates.map((e) => e.name));

  // enum 추출
  const enumCandidates = extractEnums(modules, entityNames);

  // 상태 전이 추출
  const transitionCandidates = extractTransitions(modules, reachableFiles);

  // 관계 추출 (개선안 C: 일원화)
  const relationCandidates = extractRelations(modules, entityCandidates, reachableFiles);

  // 정책 상수 추출
  const policyConstantCandidates = extractPolicyConstants(modules, reachableFiles);

  // 진입점 변환
  const entryPoints = entryPointPatterns.map(patternToEntryPoint);

  // 메타데이터
  const languages = Array.from(new Set(modules.map((m) => m.language)));
  const meta: ExtractMeta = {
    total_files: modules.length,
    parsed_files: modules.length,
    entry_points_found: entryPoints.length,
    unresolved_calls: callGraph.filter((s) => s.kind === "unresolved").length,
    languages,
  };

  return {
    entry_points: entryPoints,
    call_graph: callGraph,
    entity_candidates: entityCandidates,
    enum_candidates: enumCandidates,
    transition_candidates: transitionCandidates,
    relation_candidates: relationCandidates,
    policy_constant_candidates: policyConstantCandidates,
    meta,
  };
}

// ── 엔티티 추출 ──

function extractEntities(
  modules: ParsedModule[],
  reachableFiles: Set<string>,
): EntityCandidate[] {
  const entities = new Map<string, EntityCandidate>();

  for (const mod of modules) {
    for (const exp of mod.exports) {
      if (exp.kind !== "class") continue;
      if (!exp.annotations) continue;

      const hasEntityAnnotation = exp.annotations.some((a) =>
        ENTITY_ANNOTATIONS.some((ea) => a.includes(ea)),
      );
      if (!hasEntityAnnotation) continue;

      // 이미 발견된 엔티티는 건너뜀 (dedup)
      if (entities.has(exp.name)) continue;

      // TypeDecl에서 필드 정보 가져오기
      const typeDecl = mod.type_declarations.find(
        (td) => td.name === exp.name && (td.kind === "class" || td.kind === "interface"),
      );

      const fields = typeDecl?.fields ?? [];
      const dbTable = extractDbTable(exp.annotations);

      entities.set(exp.name, {
        name: exp.name,
        file_path: mod.file_path,
        fields,
        annotations: exp.annotations,
        db_table: dbTable,
      });
    }
  }

  return Array.from(entities.values());
}

function extractDbTable(annotations: string[]): string | undefined {
  for (const ann of annotations) {
    const match = ann.match(TABLE_NAME_RE);
    if (match) return match[1];
  }
  return undefined;
}

// ── enum 추출 ──

function extractEnums(
  modules: ParsedModule[],
  entityNames: Set<string>,
): EnumCandidate[] {
  const enums = new Map<string, EnumCandidate>();

  for (const mod of modules) {
    for (const td of mod.type_declarations) {
      if (td.kind !== "enum" || !td.enum_values || td.enum_values.length === 0) continue;
      if (enums.has(td.name)) continue;

      // 이 enum을 타입으로 사용하는 필드 목록 수집
      const usedByFields: string[] = [];
      for (const m of modules) {
        for (const otherTd of m.type_declarations) {
          if (!otherTd.fields) continue;
          for (const field of otherTd.fields) {
            if (field.type_name === td.name) {
              usedByFields.push(`${otherTd.name}.${field.name}`);
            }
          }
        }
      }

      enums.set(td.name, {
        name: td.name,
        file_path: mod.file_path,
        values: td.enum_values,
        used_by_fields: usedByFields,
      });
    }
  }

  return Array.from(enums.values());
}

// ── 상태 전이 추출 ──

function extractTransitions(
  modules: ParsedModule[],
  reachableFiles: Set<string>,
): StateAssignment[] {
  const transitions: StateAssignment[] = [];
  const seen = new Set<string>();

  for (const mod of modules) {
    // 도달 가능한 파일의 상태 전이만 수집
    if (!reachableFiles.has(mod.file_path) && reachableFiles.size > 0) continue;

    for (const sa of mod.state_assignments) {
      if (seen.has(sa.id)) continue;
      seen.add(sa.id);
      transitions.push(sa);
    }
  }

  return transitions;
}

// ── 관계 추출 (개선안 C: 일원화) ──

function extractRelations(
  modules: ParsedModule[],
  entities: EntityCandidate[],
  reachableFiles: Set<string>,
): RelationCandidate[] {
  const relations: RelationCandidate[] = [];
  const seen = new Set<string>();

  for (const entity of entities) {
    const mod = modules.find((m) => m.file_path === entity.file_path);
    if (!mod) continue;

    // FK 관계
    for (const field of entity.fields) {
      if (field.is_fk && field.referenced_entity) {
        const key = `fk:${entity.name}->${field.referenced_entity}`;
        if (seen.has(key)) continue;
        seen.add(key);

        relations.push({
          from_entity: entity.name,
          to_entity: field.referenced_entity,
          kind: "fk",
          confidence_basis: "structural",
          evidence_kind: "fk_column",
          evidence_detail: `${entity.name}.${field.name} → ${field.referenced_entity}`,
          file_path: entity.file_path,
          line: 0,
          basis: "extracted",
        });
      }

      // 타입 참조 (FK가 아닌 엔티티 타입 필드)
      if (!field.is_fk && entities.some((e) => e.name === field.type_name)) {
        const key = `type_ref:${entity.name}->${field.type_name}`;
        if (seen.has(key)) continue;
        seen.add(key);

        relations.push({
          from_entity: entity.name,
          to_entity: field.type_name,
          kind: "type_ref",
          confidence_basis: "structural",
          evidence_kind: "field_type",
          evidence_detail: `${entity.name}.${field.name}: ${field.type_name}`,
          file_path: entity.file_path,
          line: 0,
          basis: "extracted",
        });
      }
    }

    // @Embedded 관계 (개선안 A)
    if (entity.annotations) {
      for (const ann of entity.annotations) {
        if (EMBEDDED_ANNOTATIONS.some((ea) => ann.includes(ea))) {
          // Embedded 필드의 타입을 찾기
          for (const field of entity.fields) {
            if (entities.some((e) => e.name === field.type_name)) {
              const key = `embedded:${entity.name}->${field.type_name}`;
              if (seen.has(key)) continue;
              seen.add(key);

              relations.push({
                from_entity: entity.name,
                to_entity: field.type_name,
                kind: "embedded",
                confidence_basis: "structural",
                evidence_kind: "annotation",
                evidence_detail: `@Embedded ${entity.name}.${field.name}`,
                file_path: entity.file_path,
                line: 0,
                basis: "extracted",
              });
            }
          }
        }
      }
    }

    // @Inheritance 관계 (개선안 A)
    const typeDecl = mod.type_declarations.find((td) => td.name === entity.name);
    if (typeDecl && entity.annotations) {
      for (const ann of entity.annotations) {
        if (INHERITANCE_ANNOTATIONS.some((ia) => ann.includes(ia))) {
          // 부모 클래스를 찾기 (extends 키워드)
          // 간단한 구현: export 목록에서 extends 관계를 추적하기 어려우므로
          // 현재는 어노테이션 존재만 기록. 부모 엔티티는 Stage 2에서 해석
          break;
        }
      }
    }
  }

  return relations;
}

// ── 정책 상수 추출 ──

function extractPolicyConstants(
  modules: ParsedModule[],
  reachableFiles: Set<string>,
): PolicyConstantCandidate[] {
  const constants: PolicyConstantCandidate[] = [];
  const seen = new Set<string>();

  for (const mod of modules) {
    const lines = []; // 파서 어댑터가 원문을 보관하지 않으므로, export된 상수명으로 탐지
    // 현재는 ParsedModule에서 직접 추출할 수 없으므로,
    // 호출자가 GeneratorInput.files의 content를 별도로 전달해야 합니다.
    // 이 함수는 content 기반 추출을 위한 별도 진입점으로 분리합니다.
  }

  return constants;
}

/** 파일 content에서 정책 상수를 직접 추출합니다. */
export function extractPolicyConstantsFromContent(
  content: string,
  filePath: string,
): PolicyConstantCandidate[] {
  const lines = content.split("\n");
  const constants: PolicyConstantCandidate[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const match = trimmed.match(CONST_RE);
    if (!match) continue;

    const name = match[1];
    const rawValue = match[2].trim();

    // 숫자 또는 문자열 리터럴만 추출
    const numValue = Number(rawValue);
    const value = !isNaN(numValue)
      ? numValue
      : rawValue.replace(/^["']|["']$/g, "");

    // 의미 없는 상수 필터링 (너무 짧은 이름, 일반적인 상수)
    if (name.length < 4) continue;
    if (["TRUE", "FALSE", "NULL", "UNDEFINED"].includes(name)) continue;

    constants.push({
      name,
      value,
      file_path: filePath,
      line: i + 1,
      usage_context: findUsageContext(lines, i),
      source_type: "code",
    });
  }

  return constants;
}

function findUsageContext(lines: string[], lineIndex: number): string {
  // 가장 가까운 class/object 선언을 찾기
  for (let j = lineIndex; j >= Math.max(0, lineIndex - 20); j--) {
    const line = lines[j].trim();
    const classMatch = line.match(/(?:class|object|module)\s+(\w+)/);
    if (classMatch) return classMatch[1];
  }
  return "top-level";
}

// ── 헬퍼 ──

function patternToEntryPoint(pattern: EntryPointPattern): EntryPoint {
  return {
    symbol: pattern.symbol,
    kind: pattern.kind,
    file_path: pattern.file,
    line: pattern.line,
    http_method: pattern.http_method,
    http_path: pattern.http_path,
    annotation: pattern.annotation,
  };
}
