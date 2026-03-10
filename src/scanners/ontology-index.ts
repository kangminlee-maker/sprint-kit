import { parse } from "yaml";
import { getLogger } from "../logger.js";

// ─── Ontology Index Types ───

export interface OntologyIndex {
  glossary: Map<string, GlossaryEntry>;
  actions: Map<string, ActionEntry>;
  transitions: Map<string, TransitionEntry[]>;
}

export interface GlossaryEntry {
  canonical: string;
  meaning: string;
  legacy_aliases: string[];
  code_entity?: string;
  db_table?: string;
  fk_variants: string[];
}

export interface ActionEntry {
  id: string;
  name: string;
  display_name: string;
  domain: string;
  actor?: string;
  target_entities: string[];
  source_code: string;
}

export interface TransitionEntry {
  entity: string;
  field_name: string;
  from: string;
  to: string;
  trigger: string;
  source_code: string;
}

// ─── Builder ───

/**
 * 3개 YAML 문자열을 받아 인메모리 인덱스를 구성합니다.
 *
 * - 빈 문자열이면 해당 섹션만 빈 Map으로 처리합니다.
 * - YAML 파싱 에러 시 에러를 throw합니다 (빈 결과와 구분).
 */
export function buildOntologyIndex(
  ontologyYaml: string,
  actionsYaml: string,
  transitionsYaml: string,
): OntologyIndex {
  const glossary = parseGlossary(ontologyYaml);
  const actions = parseActions(actionsYaml);
  const transitions = parseTransitions(transitionsYaml);

  return { glossary, actions, transitions };
}

// ─── Internal Parsers ───

function parseGlossary(yaml_str: string): Map<string, GlossaryEntry> {
  const map = new Map<string, GlossaryEntry>();
  if (yaml_str.trim() === "") return map;

  const doc = parse(yaml_str);
  if (!doc || !Array.isArray(doc.glossary)) return map;

  for (const item of doc.glossary) {
    const canonical: string = item.canonical ?? "";
    const key = canonical.toLowerCase();
    if (map.has(key)) {
      getLogger().warn(`[ontology] Duplicate glossary key: "${key}" (canonical: "${canonical}")`);
    }
    map.set(key, {
      canonical,
      meaning: item.meaning ?? "",
      legacy_aliases: Array.isArray(item.legacy_aliases) ? item.legacy_aliases : [],
      code_entity: item.code_entity ?? undefined,
      db_table: item.db_table ?? undefined,
      fk_variants: Array.isArray(item.fk_variants) ? item.fk_variants : [],
    });
  }

  return map;
}

function parseActions(yaml_str: string): Map<string, ActionEntry> {
  const map = new Map<string, ActionEntry>();
  if (yaml_str.trim() === "") return map;

  const doc = parse(yaml_str);
  if (!doc) return map;

  const actionLists: unknown[][] = [];
  if (Array.isArray(doc.write_actions)) actionLists.push(doc.write_actions);
  if (Array.isArray(doc.read_actions)) actionLists.push(doc.read_actions);

  for (const list of actionLists) {
    for (const raw of list) {
      const item = raw as Record<string, unknown>;
      const id: string = (item.id as string) ?? "";
      const targetEntities = Array.isArray(item.target_entities)
        ? (item.target_entities as unknown[]).map(String)
        : [];
      map.set(id, {
        id,
        name: (item.name as string) ?? "",
        display_name: (item.display_name as string) ?? "",
        domain: (item.domain as string) ?? "",
        actor: (item.actor as string) ?? undefined,
        target_entities: targetEntities,
        source_code: (item.source_code as string) ?? "",
      });
    }
  }

  return map;
}

function parseTransitions(yaml_str: string): Map<string, TransitionEntry[]> {
  const map = new Map<string, TransitionEntry[]>();
  if (yaml_str.trim() === "") return map;

  const doc = parse(yaml_str);
  if (!doc || !Array.isArray(doc.entities)) return map;

  for (const entity of doc.entities) {
    const entityName: string = entity.name ?? "";
    const key = entityName.toLowerCase();

    if (!Array.isArray(entity.state_fields)) continue;

    const entries: TransitionEntry[] = [];
    for (const field of entity.state_fields) {
      const fieldName: string = field.field_name ?? "";
      if (!Array.isArray(field.transitions)) continue;

      for (const t of field.transitions) {
        const fromValue = t.from === null || t.from === undefined ? "(none)" : String(t.from);
        entries.push({
          entity: entityName,
          field_name: fieldName,
          from: fromValue,
          to: String(t.to ?? ""),
          trigger: t.trigger ?? "",
          source_code: t.source_code ?? "",
        });
      }
    }

    if (entries.length > 0) {
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, ...entries]);
    }
  }

  return map;
}
