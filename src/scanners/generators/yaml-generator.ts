/**
 * YAML 생성기
 *
 * CodeStructureExtract → glossary.yaml, actions.yaml, transitions.yaml (v3 형식)
 *
 * Phase 1에서는 code_aliases만 포함하는 불완전 YAML을 생성합니다.
 * Stage 2 실패 시에도 buildOntologyIndex()를 통과할 수 있도록
 * meaning 필드에 빈 문자열("")을 설정합니다.
 */

import { stringify } from "yaml";
import type { CodeStructureExtract } from "./types.js";

// ── YAML 출력 타입 (ontology-index.ts의 GlossaryEntry/ActionEntry/TransitionEntry와 호환) ──

interface GlossaryYamlEntry {
  canonical: string;
  meaning: string;
  legacy_aliases: string[];
  code_entity?: string;
  db_table?: string;
  fk_variants: string[];
  value_filters?: { column: string; value: string; description: string }[];
}

interface ActionYamlEntry {
  id: string;
  name: string;
  display_name: string;
  domain: string;
  target_entities: string[];
  source_code: string;
  side_effects?: string[];
  state_transitions?: string[];
}

interface TransitionYamlEntry {
  id?: string;
  entity: string;
  field_name: string;
  from: string;
  to: string;
  trigger: string;
  source_code: string;
  guards?: { check: string }[];
}

// ── 생성 결과 ──

export interface GeneratedYaml {
  glossary: string;
  actions: string;
  transitions: string;
  warnings: string[];
}

/**
 * CodeStructureExtract에서 YAML 문자열을 생성합니다.
 *
 * Phase 1: code_aliases만 포함. meaning/display_name/trigger는 빈 문자열.
 * Phase 2(Stage 2 완료 후): LLM이 의미를 채워서 완전 YAML 생성.
 */
export function generateYaml(extract: CodeStructureExtract): GeneratedYaml {
  const warnings: string[] = [];

  // ── glossary.yaml ──
  const glossaryEntries: GlossaryYamlEntry[] = extract.entity_candidates.map((entity) => {
    // FK 관계에서 fk_variants 수집
    const fkRelations = extract.relation_candidates.filter(
      (r) => r.from_entity === entity.name && r.kind === "fk",
    );
    const fkVariants: string[] = [];
    for (const rel of fkRelations) {
      // evidence_detail에서 FK 컬럼명 추출: "Entity.fieldName → Target"
      const fieldMatch = rel.evidence_detail.match(/\.(\w+)\s*→/);
      if (fieldMatch) fkVariants.push(fieldMatch[1]);
    }

    // enum value_filters 수집
    const valueFilters: { column: string; value: string; description: string }[] = [];
    for (const field of entity.fields) {
      const enumCandidate = extract.enum_candidates.find((e) => e.name === field.type_name);
      if (enumCandidate) {
        for (const val of enumCandidate.values) {
          valueFilters.push({
            column: field.name,
            value: val,
            description: "", // Stage 2가 채움
          });
        }
      }
    }

    return {
      canonical: entity.name,
      meaning: "", // Stage 2가 채움. 빈 문자열로 buildOntologyIndex() 통과 보장
      legacy_aliases: [],
      code_entity: entity.name,
      db_table: entity.db_table,
      fk_variants: fkVariants,
      value_filters: valueFilters.length > 0 ? valueFilters : undefined,
    };
  });

  if (glossaryEntries.length === 0) {
    warnings.push("auto_generated_no_entities");
  }

  // ── actions.yaml ──
  const actionEntries: ActionYamlEntry[] = extract.entry_points.map((ep) => {
    // 이 진입점에서 도달하는 엔티티 수집
    const targetEntities = findTargetEntities(ep.symbol, extract);

    // 유발하는 상태 전이 ID 수집
    const stateTransitions = findTriggeredTransitions(ep.symbol, extract);

    return {
      id: ep.symbol,
      name: ep.symbol.split(".").pop() ?? ep.symbol,
      display_name: "", // Stage 2가 채움
      domain: "", // Stage 2가 채움
      target_entities: targetEntities,
      source_code: `${ep.file_path}:${ep.line}`,
      state_transitions: stateTransitions.length > 0 ? stateTransitions : undefined,
    };
  });

  // ── transitions.yaml ──
  const transitionEntries: TransitionYamlEntry[] = extract.transition_candidates.map((tc) => ({
    id: tc.id,
    entity: tc.entity,
    field_name: tc.field_name,
    from: tc.from ?? "(none)",
    to: tc.to,
    trigger: "", // Stage 2가 채움
    source_code: `${tc.file_path}:${tc.line}`,
    guards: tc.guard_expression
      ? [{ check: tc.guard_expression }]
      : undefined,
  }));

  // buildOntologyIndex() 입력 형식에 맞춰 루트 키 래핑
  const glossaryYaml = glossaryEntries.length > 0
    ? stringify({ glossary: glossaryEntries })
    : "";

  const actionsYaml = actionEntries.length > 0
    ? stringify({ actions: actionEntries })
    : "";

  // transitions: entity별 그룹핑 → { entities: [{ name, state_machine: [...] }] } 중첩
  const transitionsYaml = transitionEntries.length > 0
    ? stringify({ entities: groupTransitionsByEntity(transitionEntries) })
    : "";

  return {
    glossary: glossaryYaml,
    actions: actionsYaml,
    transitions: transitionsYaml,
    warnings,
  };
}

// ── 헬퍼 ──

/** TransitionYamlEntry[] → buildOntologyIndex()가 기대하는 중첩 구조로 변환 */
function groupTransitionsByEntity(
  entries: TransitionYamlEntry[],
): { name: string; state_machine: { field_name: string; transitions: TransitionNested[] }[] }[] {
  // entity → field_name → transitions 그룹핑
  const entityMap = new Map<string, Map<string, TransitionYamlEntry[]>>();

  for (const entry of entries) {
    if (!entityMap.has(entry.entity)) {
      entityMap.set(entry.entity, new Map());
    }
    const fieldMap = entityMap.get(entry.entity)!;
    const fieldName = entry.field_name;
    if (!fieldMap.has(fieldName)) {
      fieldMap.set(fieldName, []);
    }
    fieldMap.get(fieldName)!.push(entry);
  }

  const result: { name: string; state_machine: { field_name: string; transitions: TransitionNested[] }[] }[] = [];

  for (const [entityName, fieldMap] of entityMap) {
    const stateFields: { field_name: string; transitions: TransitionNested[] }[] = [];
    for (const [fieldName, transitions] of fieldMap) {
      stateFields.push({
        field_name: fieldName,
        transitions: transitions.map((t) => ({
          id: t.id,
          from: t.from,
          to: t.to,
          trigger: t.trigger ?? "",
          source_code: t.source_code,
          ...(t.guards ? { guard: t.guards } : {}),
        })),
      });
    }
    result.push({ name: entityName, state_machine: stateFields });
  }

  return result;
}

interface TransitionNested {
  id?: string;
  from: string;
  to: string;
  trigger: string;
  source_code: string;
  guard?: { check: string }[];
}

function findTargetEntities(
  entrySymbol: string,
  extract: CodeStructureExtract,
): string[] {
  const entityNames = new Set<string>();
  const visited = new Set<string>();
  const queue = [entrySymbol];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const site of extract.call_graph) {
      if (site.caller === current || site.caller.endsWith(`.${current}`)) {
        // callee가 엔티티명이면 기록
        const calleeName = site.callee.split(".")[0];
        if (extract.entity_candidates.some((e) => e.name === calleeName)) {
          entityNames.add(calleeName);
        }
        if (site.kind === "direct") {
          queue.push(site.callee);
        }
      }
    }
  }

  return Array.from(entityNames);
}

function findTriggeredTransitions(
  entrySymbol: string,
  extract: CodeStructureExtract,
): string[] {
  // 진입점에서 도달 가능한 파일의 상태 전이 수집
  const reachableFiles = new Set<string>();
  const visited = new Set<string>();
  const queue = [entrySymbol];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const site of extract.call_graph) {
      if (site.caller === current || site.caller.endsWith(`.${current}`)) {
        reachableFiles.add(site.file_path);
        if (site.kind === "direct") {
          queue.push(site.callee);
        }
      }
    }
  }

  return extract.transition_candidates
    .filter((tc) => reachableFiles.has(tc.file_path))
    .map((tc) => tc.id);
}
