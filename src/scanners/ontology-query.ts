import type {
  OntologyIndex,
  GlossaryEntry,
  ActionEntry,
  TransitionEntry,
  ValueFilter,
  Precondition,
} from "./ontology-index.js";

// ─── Query Result Types ───

export interface ValueFilterResult {
  entity: string;
  column: string;
  value: string;
  description: string;
}

export interface OntologyQueryResult {
  matched_entities: string[];
  code_locations: CodeLocation[];
  db_tables: string[];
  related_actions: ActionSummary[];
  related_transitions: TransitionSummary[];
  value_filters: ValueFilterResult[];
}

export interface CodeLocation {
  reference: string;   // "PodoScheduleServiceImplV2.match()"
  context: string;     // "Action SCHEDULE-1: 튜터 매칭"
  entity: string;      // "Lesson"
}

export interface ActionSummary {
  id: string;
  display_name: string;
  source_code: string;
  guard_note?: string;
  preconditions?: Precondition[];
}

export interface TransitionSummary {
  entity: string;
  from: string;
  to: string;
  trigger: string;
  source_code: string;
}

// ─── Query Function ───

/**
 * 키워드 목록으로 온톨로지 인덱스에서 관련 항목을 조회합니다.
 *
 * 매칭 로직:
 * - glossary의 canonical, meaning, legacy_aliases에서 대소문자 무시 부분 매칭
 * - 매칭된 entity를 기반으로 actions과 transitions에서 관련 항목 수집
 * - 0건이면 빈 결과 반환 (caller가 Full Scan fallback 판단)
 */
export function queryOntology(
  index: OntologyIndex,
  keywords: string[],
): OntologyQueryResult {
  if (keywords.length === 0) {
    return emptyResult();
  }

  const matchedEntries = findMatchingGlossaryEntries(index, keywords);
  if (matchedEntries.length === 0) {
    return emptyResult();
  }

  const matched_entities = matchedEntries.map((e) => e.canonical);
  const db_tables = collectDbTables(matchedEntries);
  const related_actions = collectRelatedActions(index, matched_entities);
  const code_locations = collectCodeLocations(related_actions);
  const related_transitions = collectRelatedTransitions(index, matched_entities);
  const value_filters = collectValueFilters(matchedEntries);

  return {
    matched_entities,
    code_locations,
    db_tables,
    related_actions,
    related_transitions,
    value_filters,
  };
}

// ─── Internal Helpers ───

function emptyResult(): OntologyQueryResult {
  return {
    matched_entities: [],
    code_locations: [],
    db_tables: [],
    related_actions: [],
    related_transitions: [],
    value_filters: [],
  };
}

/**
 * 키워드와 매칭되는 glossary 항목을 찾습니다.
 * canonical, meaning, legacy_aliases 에서 대소문자 무시 부분 매칭.
 */
function findMatchingGlossaryEntries(
  index: OntologyIndex,
  keywords: string[],
): GlossaryEntry[] {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  const matched: GlossaryEntry[] = [];
  const seen = new Set<string>();

  for (const entry of index.glossary.values()) {
    if (isGlossaryMatch(entry, lowerKeywords) && !seen.has(entry.canonical)) {
      seen.add(entry.canonical);
      matched.push(entry);
    }
  }

  return matched;
}

function isGlossaryMatch(entry: GlossaryEntry, lowerKeywords: string[]): boolean {
  const canonicalLower = entry.canonical.toLowerCase();
  const meaningLower = entry.meaning.toLowerCase();
  const aliasesLower = entry.legacy_aliases.map((a) => a.toLowerCase());

  return lowerKeywords.some((kw) => {
    if (canonicalLower.includes(kw)) return true;
    if (meaningLower.includes(kw)) return true;
    if (aliasesLower.some((alias) => alias.includes(kw))) return true;
    return false;
  });
}

function collectDbTables(entries: GlossaryEntry[]): string[] {
  const tables: string[] = [];
  for (const entry of entries) {
    if (entry.db_table) {
      tables.push(entry.db_table);
    }
  }
  return tables;
}

/**
 * 매칭된 entity 목록을 기반으로 관련 action을 수집합니다.
 * action의 target_entities에 매칭된 entity가 포함되어 있으면 관련 action.
 */
function collectRelatedActions(
  index: OntologyIndex,
  matchedEntities: string[],
): ActionSummary[] {
  const entitySet = new Set(matchedEntities.map((e) => e.toLowerCase()));
  const results: ActionSummary[] = [];

  for (const action of index.actions.values()) {
    const hasMatch = action.target_entities.some((te) =>
      entitySet.has(te.toLowerCase()),
    );
    if (hasMatch) {
      results.push({
        id: action.id,
        display_name: action.display_name,
        source_code: action.source_code,
        guard_note: action.guard_note,
        preconditions: action.preconditions,
      });
    }
  }

  return results;
}

/**
 * action의 source_code에서 CodeLocation을 추출합니다.
 */
function collectCodeLocations(actions: ActionSummary[]): CodeLocation[] {
  const locations: CodeLocation[] = [];

  for (const action of actions) {
    if (!action.source_code || action.source_code === "(외부)") continue;

    locations.push({
      reference: action.source_code,
      context: `Action ${action.id}: ${action.display_name}`,
      entity: action.id.split("-")[0] ?? "",
    });
  }

  return locations;
}

/**
 * 매칭된 entity 목록을 기반으로 관련 transition을 수집합니다.
 */
function collectRelatedTransitions(
  index: OntologyIndex,
  matchedEntities: string[],
): TransitionSummary[] {
  const results: TransitionSummary[] = [];

  for (const entityName of matchedEntities) {
    const key = entityName.toLowerCase();
    const transitions = index.transitions.get(key);
    if (!transitions) continue;

    for (const t of transitions) {
      results.push({
        entity: t.entity,
        from: t.from,
        to: t.to,
        trigger: t.trigger,
        source_code: t.source_code,
      });
    }
  }

  return results;
}

/**
 * 매칭된 glossary 항목에서 value_filters를 수집합니다.
 */
function collectValueFilters(entries: GlossaryEntry[]): ValueFilterResult[] {
  const results: ValueFilterResult[] = [];
  for (const entry of entries) {
    if (!entry.value_filters) continue;
    for (const vf of entry.value_filters) {
      results.push({
        entity: entry.canonical,
        column: vf.column,
        value: vf.value,
        description: vf.description,
      });
    }
  }
  return results;
}
