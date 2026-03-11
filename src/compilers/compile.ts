import {
  formatPerspective,
  isPolicyChangeRequired,
  type ScopeState,
  type ConstraintEntry,
  type Perspective,
  type BrownfieldContext,
  type BrownfieldDetail,
} from "../kernel/types.js";
import { contentHash } from "../kernel/hash.js";
import { makeId } from "../kernel/id.js";
import {
  compileDefense,
  type BuildSpecData,
  type BuildSpecSection3Entry,
  type BuildSpecSection4Entry,
  type DeltaSet,
  type DeltaSetChange,
  type ValidationPlanItem,
  type DefenseViolation,
} from "./compile-defense.js";

// ─── Input Types ───

export interface ImplementationItem {
  summary: string;
  related_cst: string[];
  target: string;
  detail: string;
  depends_on?: string[];
  guardrail?: string;
  pseudocode?: string;
  test_strategy?: string;
  assumptions?: string[];
}

export interface ChangeItem {
  action: "create" | "modify" | "delete";
  file_path: string;
  description: string;
  related_impl_indices: number[];
  related_cst: string[];
  before_context?: string;
  after_context?: string;
  acceptance_criteria?: string[];
}

// BrownfieldContext, BrownfieldDetail and related types are defined in kernel/types.ts
// Re-export for backward compatibility
export type {
  BrownfieldContext,
  BrownfieldDetail,
} from "../kernel/types.js";

export interface InjectValidation {
  related_cst: string;
  target: string;
  method: string;
  pass_criteria: string;
  fail_action: string;
  edge_cases?: Array<{
    scenario: string;
    expected_result: string;
  }>;
}

export interface CompileInput {
  state: ScopeState;
  implementations: ImplementationItem[];
  changes: ChangeItem[];
  brownfield: BrownfieldContext;
  brownfieldDetail: BrownfieldDetail;
  surfaceSummary: string;
  injectValidations: InjectValidation[];
}

// ─── Output Types ───

export interface CompileSuccess {
  success: true;
  buildSpecMd: string;
  buildSpecHash: string;
  buildSpecData: BuildSpecData;
  brownfieldDetailMd: string;
  brownfieldDetailHash: string;
  deltaSetJson: string;
  deltaSetHash: string;
  deltaSet: DeltaSet;
  validationPlanMd: string;
  validationPlanHash: string;
  validationPlan: ValidationPlanItem[];
  warnings: DefenseViolation[];
}

export interface CompileFailure {
  success: false;
  reason: string;
  violations?: DefenseViolation[];
  warnings?: DefenseViolation[];
}

export type CompileOutput = CompileSuccess | CompileFailure;

// ─── Main ───

/**
 * Compile confirmed scope into Build Spec + delta-set + validation-plan.
 *
 * Pure function: no side effects, no file I/O, no event recording.
 * The caller (agent protocol) is responsible for saving files and recording events.
 */
export function compile(input: CompileInput): CompileOutput {
  // Step 1: Input validation
  const validationError = validateInput(input);
  if (validationError) {
    return { success: false, reason: validationError };
  }

  const { state } = input;

  // Step 2: Assign IDs
  const implItems = assignImplIds(input.implementations);
  const implIdMap = new Map(implItems.map((item, i) => [i, item.impl_id]));
  const changeItems = assignChangeIds(input.changes, implIdMap);

  // Step 3: Assemble structures
  const section3 = buildSection3(state);
  const section4 = buildSection4(implItems);
  const deltaSet = buildDeltaSet(state, changeItems);
  const valItems = buildValidationPlan(state, input.injectValidations);

  // Step 4: Compile Defense
  const buildSpecData: BuildSpecData = {
    section3: section3.filter((e) => e.decision !== "invalidated"),
    section4,
  };
  const defenseResult = compileDefense(state, buildSpecData, deltaSet, valItems, input.brownfieldDetail);
  if (!defenseResult.passed) {
    return {
      success: false,
      reason: `Compile Defense failed: ${defenseResult.violations.length} violation(s)`,
      violations: defenseResult.violations,
      warnings: defenseResult.warnings,
    };
  }

  const defenseWarnings = defenseResult.warnings;

  // Step 5–6: Render + hash (2-pass for circular reference)
  // - coreHash = hash of Section 1-4 only (used in deltaSet.build_spec_hash)
  // - buildSpecHash = hash of full Build Spec (Section 1-7, used in compile.completed payload)
  // Note: validation-plan is rendered before Build Spec hash is known.
  // build_spec_hash reference is added by the agent when saving the file.
  const validationPlanMd = renderValidationPlanMd(state, valItems);
  const validationPlanHash = contentHash(validationPlanMd);

  const coreMd = renderBuildSpecCore(input, implItems, section3);
  const coreHash = contentHash(coreMd);

  deltaSet.build_spec_hash = coreHash;
  const deltaSetJson = JSON.stringify(deltaSet, null, 2);
  const deltaSetHash = contentHash(deltaSetJson);

  const refSections =
    renderSection5(deltaSetHash, deltaSet.changes) +
    renderSection6(validationPlanHash, valItems.length);

  // Brownfield Detail (separate file)
  const brownfieldDetailMd = renderBrownfieldDetail(input.brownfieldDetail);
  const brownfieldDetailHash = contentHash(brownfieldDetailMd);

  // Section 7 (Tier 1+2 with references to brownfield-detail.md)
  const section7 = renderSection7(input.brownfield, brownfieldDetailHash).join("\n") + "\n";
  const buildSpecMd = coreMd + refSections + section7;
  const buildSpecHash = contentHash(buildSpecMd);

  // Step 7: Return
  return {
    success: true,
    buildSpecMd,
    buildSpecHash,
    buildSpecData,
    brownfieldDetailMd,
    brownfieldDetailHash,
    deltaSetJson,
    deltaSetHash,
    deltaSet,
    validationPlanMd,
    validationPlanHash,
    validationPlan: valItems,
    warnings: defenseWarnings ?? [],
  };
}

// ─── Validation ───

function validateInput(input: CompileInput): string | null {
  const { state } = input;

  if (state.current_state !== "target_locked") {
    return `state.current_state must be "target_locked", got "${state.current_state}"`;
  }
  if (!state.compile_ready) {
    return "state.compile_ready is false — constraints may be unresolved or snapshot is stale";
  }
  if (!state.surface_hash) {
    return "state.surface_hash is missing — surface must be confirmed before compile";
  }
  if (!state.direction) {
    return "state.direction is missing — align must be locked before compile";
  }
  if (!state.scope_boundaries) {
    return "state.scope_boundaries is missing — align must be locked before compile";
  }

  // Check for disallowed decisions
  for (const c of state.constraint_pool.constraints) {
    if (c.status === "invalidated") continue;
    if (c.decision === "clarify" || c.decision === "modify-direction") {
      return `${c.constraint_id} has decision "${c.decision}" which must be resolved before compile`;
    }
  }

  // Validate impl indices
  for (let i = 0; i < input.changes.length; i++) {
    for (const idx of input.changes[i].related_impl_indices) {
      if (idx < 0 || idx >= input.implementations.length) {
        return `changes[${i}].related_impl_indices contains invalid index ${idx} (implementations has ${input.implementations.length} items)`;
      }
    }
  }

  // Validate inject validations coverage
  const injectCsts = new Set(
    state.constraint_pool.constraints
      .filter((c) => c.status !== "invalidated" && c.decision === "inject")
      .map((c) => c.constraint_id),
  );
  const coveredCsts = new Set(input.injectValidations.map((v) => v.related_cst));
  const missingValidations = [...injectCsts].filter(id => !coveredCsts.has(id));
  if (missingValidations.length > 0) {
    return `inject constraints missing injectValidation: ${missingValidations.join(", ")}`;
  }

  // Validate inject constraints have at least one CHG
  const chgCsts = new Set(input.changes.flatMap((c) => c.related_cst));
  const missingChanges = [...injectCsts].filter(id => !chgCsts.has(id));
  if (missingChanges.length > 0) {
    return `inject constraints missing CHG in changes: ${missingChanges.join(", ")}`;
  }

  // Validate every IMPL has at least one CHG referencing it
  for (let i = 0; i < input.implementations.length; i++) {
    const hasChg = input.changes.some((c) => c.related_impl_indices.includes(i));
    if (!hasChg) {
      return `implementations[${i}] ("${input.implementations[i].summary}") has no CHG referencing it via related_impl_indices`;
    }
  }

  // Validate brownfield required fields
  if (!input.brownfield.related_files || !Array.isArray(input.brownfield.related_files)) {
    return "brownfield.related_files is required and must be an array of BrownfieldFileEntry";
  }
  if (!input.brownfield.module_dependencies || !Array.isArray(input.brownfield.module_dependencies)) {
    return "brownfield.module_dependencies is required and must be an array of BrownfieldDepEntry";
  }

  return null;
}

// ─── ID Assignment ───

interface ImplWithId extends ImplementationItem {
  impl_id: string;
}

function assignImplIds(implementations: ImplementationItem[]): ImplWithId[] {
  return implementations.map((item, i) => ({
    ...item,
    impl_id: makeId("IMPL-", i + 1),
  }));
}

function assignChangeIds(
  changes: ChangeItem[],
  implIdMap: Map<number, string>,
): DeltaSetChange[] {
  return changes.map((c, i) => ({
    change_id: makeId("CHG-", i + 1),
    action: c.action,
    file_path: c.file_path,
    description: c.description,
    related_impl: c.related_impl_indices.map((idx) => implIdMap.get(idx)!),
    related_cst: c.related_cst,
    before_context: c.before_context,
    after_context: c.after_context,
    acceptance_criteria: c.acceptance_criteria,
  }));
}

// ─── Assembly ───

function buildSection3(state: ScopeState): BuildSpecSection3Entry[] {
  return state.constraint_pool.constraints
    .filter((c) => c.status !== "invalidated")
    .map((c) => ({
      constraint_id: c.constraint_id,
      decision: c.decision!,
    }));
}

function buildSection4(implItems: ImplWithId[]): BuildSpecSection4Entry[] {
  return implItems.map((item) => ({
    impl_id: item.impl_id,
    related_cst: item.related_cst,
  }));
}

function buildDeltaSet(
  state: ScopeState,
  changeItems: DeltaSetChange[],
): DeltaSet {
  return {
    scope_id: state.scope_id,
    surface_hash: state.surface_hash!,
    build_spec_hash: "", // filled after core hash
    changes: changeItems,
  };
}

function buildValidationPlan(
  state: ScopeState,
  injectValidations: InjectValidation[],
): ValidationPlanItem[] {
  const items: ValidationPlanItem[] = [];
  let valCounter = 0;
  const nextValId = () => makeId("VAL-", ++valCounter);

  // inject (agent-written)
  for (const iv of injectValidations) {
    items.push({
      val_id: nextValId(),
      related_cst: iv.related_cst,
      decision_type: "inject",
      target: iv.target,
      method: iv.method,
      pass_criteria: iv.pass_criteria,
      fail_action: iv.fail_action,
      edge_cases: iv.edge_cases,
    });
  }

  // defer (auto-generated)
  for (const c of constraintsByDecision(state, "defer")) {
    const sourceFiles = c.source_refs.map((r) => r.source).join(", ");
    items.push({
      val_id: nextValId(),
      related_cst: c.constraint_id,
      decision_type: "defer",
      target: `${c.summary} 비간섭 확인`,
      method: `검증 파일: ${sourceFiles}. 해당 파일이 이번 변경에서 수정되지 않았는지 확인`,
      pass_criteria: `${sourceFiles} 변경 없음`,
      fail_action: "의도하지 않은 간섭 발견 시 constraints_resolved로 복귀하여 재결정",
    });
  }

  // override (auto-generated)
  for (const c of constraintsByDecision(state, "override")) {
    const sourceFiles = c.source_refs.map((r) => r.source).join(", ");
    items.push({
      val_id: nextValId(),
      related_cst: c.constraint_id,
      decision_type: "override",
      target: `${c.summary} 비반영 확인`,
      method: `검증 파일: ${sourceFiles}. 해당 constraint 관련 코드 변경이 없는지 확인`,
      pass_criteria: `${c.constraint_id} 관련 변경 없음`,
      fail_action: "의도적 비반영 위반 발견 시 constraints_resolved로 복귀하여 재결정",
    });
  }

  return items;
}

function constraintsByDecision(
  state: ScopeState,
  decision: string,
): ConstraintEntry[] {
  return state.constraint_pool.constraints.filter(
    (c) => c.status !== "invalidated" && c.decision === decision,
  );
}

// ─── Build Spec Rendering ───

function renderBuildSpecCore(
  input: CompileInput,
  implItems: ImplWithId[],
  section3: BuildSpecSection3Entry[],
): string {
  const lines: string[] = [];

  lines.push(...renderSection1(input.state));
  lines.push(...renderSection2(input.state, input.surfaceSummary));
  lines.push(...renderSection3(input.state, section3));
  lines.push(...renderSection4(implItems));
  // Section 5, 6 are inserted by compile() after hash calculation (2-pass)
  // Section 7 is appended last in the final assembly

  return lines.join("\n") + "\n";
}

function renderSection1(state: ScopeState): string[] {
  const lines: string[] = [];
  lines.push(`# Build Spec: ${state.title}`);
  lines.push("");
  lines.push("## 1. Scope Summary");
  lines.push("");
  lines.push("| 항목 | 값 |");
  lines.push("|------|-----|");
  lines.push(`| scope ID | ${state.scope_id} |`);
  lines.push(`| 제목 | ${state.title} |`);
  lines.push(`| 방향 | ${state.direction} |`);
  lines.push(`| scope type | ${state.entry_mode} |`);
  lines.push("");

  const b = state.scope_boundaries!;
  lines.push("**범위 — 포함:**");
  for (const item of b.in) lines.push(`- ${item}`);
  lines.push("");
  lines.push("**범위 — 제외:**");
  for (const item of b.out) lines.push(`- ${item}`);
  lines.push("");

  return lines;
}

function renderSection2(state: ScopeState, surfaceSummary: string): string[] {
  const lines: string[] = [];
  const surfaceDir = state.surface_path ??
    (state.entry_mode === "experience" ? "surface/preview/" : "surface/contract-diff/");

  lines.push("## 2. Confirmed Surface");
  lines.push("");
  lines.push(`- **surface 경로**: \`${surfaceDir}\``);
  lines.push(`- **content hash**: \`${state.surface_hash}\``);
  lines.push("");
  lines.push("**시나리오 요약:**");
  lines.push(surfaceSummary);
  lines.push("");

  return lines;
}

function renderSection3(
  state: ScopeState,
  section3: BuildSpecSection3Entry[],
): string[] {
  const lines: string[] = [];

  lines.push("## 3. Constraint Decision Map");
  lines.push("");
  lines.push("| CST-ID | 관점 | 요약 | 결정 | Build Spec 내 처리 |");
  lines.push("|--------|------|------|------|-------------------|");

  // Include all constraints (including invalidated) for traceability
  for (const c of state.constraint_pool.constraints) {
    const perspective = formatPerspective(c.perspective);
    const treatment = decisionTreatment(c);
    lines.push(
      `| ${c.constraint_id} | ${perspective} | ${c.summary} | ${c.decision ?? "—"} | ${treatment} |`,
    );
  }

  // Policy change warning
  const policyChangeCsts = state.constraint_pool.constraints.filter(isPolicyChangeRequired);
  if (policyChangeCsts.length > 0) {
    lines.push("");
    lines.push("> **정책 변경 검토 필요:**");
    for (const c of policyChangeCsts) {
      lines.push(`> - ${c.constraint_id}: 기존 정책 변경을 전제합니다. 구현 전 법무/정책 검토가 필요합니다.${c.evidence_note ? ` 참고: ${c.evidence_note}` : ""}`);
    }
  }

  // Also show invalidated separately (collapsed when 3+)
  const invalidated = state.constraint_pool.constraints.filter(
    (c) => c.status === "invalidated",
  );
  if (invalidated.length > 0) {
    lines.push("");
    if (invalidated.length >= 3) {
      lines.push("<details>");
      lines.push(`<summary>무효화된 항목 (${invalidated.length}건)</summary>`);
      lines.push("");
    } else {
      lines.push("**무효화된 항목:**");
    }
    for (const c of invalidated) {
      lines.push(
        `- ${c.constraint_id}: ${c.invalidation_reason ?? "방향 변경으로 해당 없음"}`,
      );
    }
    if (invalidated.length >= 3) {
      lines.push("");
      lines.push("</details>");
    }
  }

  lines.push("");
  return lines;
}

function decisionTreatment(c: ConstraintEntry): string {
  if (c.status === "invalidated") {
    return `해당 없음. 사유: ${c.invalidation_reason ?? "방향 변경"}`;
  }
  const policySuffix = isPolicyChangeRequired(c) ? " [정책 변경 검토 필요]" : "";
  switch (c.decision) {
    case "inject": {
      return `Section 4에서 구현. ${c.selected_option ?? ""}`.trim() + policySuffix;
    }
    case "defer":
      return `이번 범위에서 제외. 이유: ${c.rationale ?? c.selected_option ?? "—"}`;
    case "override":
      return `무시. 이유: ${c.rationale ?? c.selected_option ?? "—"}`;
    default:
      return "—";
  }
}

function renderSection4(implItems: ImplWithId[]): string[] {
  const lines: string[] = [];

  lines.push("## 4. Implementation Plan");
  lines.push("");

  if (implItems.length === 0) {
    lines.push("구현 항목 없음.");
    lines.push("");
    return lines;
  }

  for (const item of implItems) {
    lines.push(`### ${item.impl_id} | ${item.related_cst.join(", ")}`);
    lines.push("");
    lines.push(`- **요약:** ${item.summary}`);
    lines.push(`- **변경 대상:** ${item.target}`);
    lines.push(`- **변경 내용:** ${item.detail}`);
    if (item.depends_on && item.depends_on.length > 0) {
      lines.push(`- **의존성:** ${item.depends_on.join(", ")}`);
    }
    if (item.guardrail) {
      lines.push(`- **guardrail:** ${item.guardrail}`);
    }
    if (item.pseudocode) {
      lines.push("- **pseudocode:**");
      lines.push("```");
      lines.push(item.pseudocode);
      lines.push("```");
    }
    if (item.test_strategy) {
      lines.push(`- **test strategy:** ${item.test_strategy}`);
    }
    if (item.assumptions && item.assumptions.length > 0) {
      lines.push("- **전제 가정:**");
      for (const a of item.assumptions) {
        lines.push(`  - ${a}`);
      }
    }
    lines.push("");
  }

  return lines;
}

function renderSection5(
  deltaSetHash: string,
  changes: DeltaSetChange[],
): string {
  const counts = { create: 0, modify: 0, delete: 0 };
  for (const c of changes) counts[c.action]++;

  const parts: string[] = [];
  if (counts.create > 0) parts.push(`create ${counts.create}건`);
  if (counts.modify > 0) parts.push(`modify ${counts.modify}건`);
  if (counts.delete > 0) parts.push(`delete ${counts.delete}건`);

  const lines: string[] = [];
  lines.push("## 5. Delta Set Reference");
  lines.push("");
  lines.push("- **delta-set 경로**: `build/delta-set.json`");
  lines.push(`- **변경 파일 수**: ${parts.join(", ") || "0건"}`);
  lines.push(`- **content hash**: \`${deltaSetHash}\``);
  lines.push("");

  return lines.join("\n");
}

function renderSection6(
  valPlanHash: string,
  valCount: number,
): string {
  const lines: string[] = [];
  lines.push("## 6. Validation Plan Reference");
  lines.push("");
  lines.push("- **validation-plan 경로**: `build/validation-plan.md`");
  lines.push(`- **검증 항목 수**: ${valCount}건`);
  lines.push(`- **content hash**: \`${valPlanHash}\``);
  lines.push("");

  return lines.join("\n");
}

function renderSection7(brownfield: BrownfieldContext, detailHash: string): string[] {
  const lines: string[] = [];
  const detailFile = "brownfield-detail.md";

  lines.push("## 7. Brownfield Context");
  lines.push("");
  lines.push(`상세: [\`build/${detailFile}\`](${detailFile}) (hash: \`${detailHash.slice(0, 8)}\`)`);
  lines.push("");

  // Split related_files into non-test (Tier 1) and test (Tier 2)
  const nonTestFiles = brownfield.related_files.filter(f => !f.role.startsWith("test ("));
  const testFiles = brownfield.related_files.filter(f => f.role.startsWith("test ("));

  // Tier 1: Non-test related files (always expanded)
  if (nonTestFiles.length > 0) {
    lines.push(`### 변경 대상 파일 (${nonTestFiles.length}건)`);
    lines.push("");
    lines.push("| 경로 | 역할 | 상세 |");
    lines.push("|------|------|------|");
    for (const f of nonTestFiles) {
      lines.push(`| \`${f.path}\` | ${f.role} | [→ 상세](${detailFile}#${f.detail_anchor}) |`);
    }
    lines.push("");
  }

  // Tier 2: Test files (collapsed)
  if (testFiles.length > 0) {
    lines.push("<details>");
    lines.push(`<summary>테스트 파일 (${testFiles.length}건)</summary>`);
    lines.push("");
    lines.push("| 경로 | 역할 | 상세 |");
    lines.push("|------|------|------|");
    for (const f of testFiles) {
      lines.push(`| \`${f.path}\` | ${f.role} | [→ 상세](${detailFile}#${f.detail_anchor}) |`);
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  // Tier 1: Module dependencies (always expanded)
  if (brownfield.module_dependencies.length > 0) {
    lines.push(`### 직접 의존 모듈 (${brownfield.module_dependencies.length}건)`);
    lines.push("");
    lines.push("| 모듈 | 의존 대상 | 상세 |");
    lines.push("|------|----------|------|");
    for (const d of brownfield.module_dependencies) {
      lines.push(`| ${d.module} | ${d.depends_on} | [→ 상세](${detailFile}#${d.detail_anchor}) |`);
    }
    lines.push("");
  }

  // Tier 2: API contracts (collapsed)
  if (brownfield.api_contracts && brownfield.api_contracts.length > 0) {
    lines.push("<details>");
    lines.push(`<summary>API 계약 (${brownfield.api_contracts.length}건)</summary>`);
    lines.push("");
    lines.push("| endpoint | method | 설명 | 상세 |");
    lines.push("|----------|--------|------|------|");
    for (const a of brownfield.api_contracts) {
      lines.push(`| ${a.endpoint} | ${a.method} | ${a.description} | [→ 상세](${detailFile}#${a.detail_anchor}) |`);
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  // Tier 2: DB schemas (collapsed)
  if (brownfield.db_schemas && brownfield.db_schemas.length > 0) {
    lines.push("<details>");
    lines.push(`<summary>DB 스키마 (${brownfield.db_schemas.length}건)</summary>`);
    lines.push("");
    lines.push("| 테이블 | 컬럼 | 상세 |");
    lines.push("|--------|------|------|");
    for (const s of brownfield.db_schemas) {
      lines.push(`| ${s.table} | ${s.columns} | [→ 상세](${detailFile}#${s.detail_anchor}) |`);
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  // Tier 2: Config/env (collapsed)
  if (brownfield.config_env && brownfield.config_env.length > 0) {
    lines.push("<details>");
    lines.push(`<summary>설정/환경 변수 (${brownfield.config_env.length}건)</summary>`);
    lines.push("");
    lines.push("| 키 | 설명 | 상세 |");
    lines.push("|-----|------|------|");
    for (const e of brownfield.config_env) {
      lines.push(`| ${e.key} | ${e.description} | [→ 상세](${detailFile}#${e.detail_anchor}) |`);
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  return lines;
}

// ─── Brownfield Detail Rendering ───

function renderBrownfieldDetail(detail: BrownfieldDetail): string {
  const lines: string[] = [];

  lines.push("# Brownfield Detail");
  lines.push("");
  lines.push(`scope: ${detail.scope_id}`);
  lines.push("");

  for (const section of detail.sections) {
    lines.push(`<a id="${section.anchor}"></a>`);
    lines.push("");
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push(`**소스:** ${section.source}`);
    lines.push("");
    lines.push(section.content);
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Validation Plan Rendering ───

function renderValidationPlanMd(
  state: ScopeState,
  valItems: ValidationPlanItem[],
): string {
  const lines: string[] = [];

  lines.push(`# Validation Plan: ${state.title}`);
  lines.push("");
  lines.push(`scope: ${state.scope_id}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const v of valItems) {
    const cstEntry = state.constraint_pool.constraints.find(
      (c) => c.constraint_id === v.related_cst,
    );
    const policyTag = cstEntry && isPolicyChangeRequired(cstEntry)
      ? " [정책 변경 검토 필요]"
      : "";
    lines.push(`### ${v.val_id} | ${v.related_cst} | ${v.decision_type}${policyTag}`);
    lines.push("");
    lines.push(`**검증 대상:** ${v.target}`);
    lines.push(`**검증 방법:** ${v.method}`);
    lines.push(`**통과 조건:** ${v.pass_criteria}`);
    lines.push(`**실패 시 조치:** ${v.fail_action}`);
    if (cstEntry && isPolicyChangeRequired(cstEntry)) {
      lines.push("");
      lines.push(`> **정책 변경 전제**: 이 항목은 기존 정책 변경을 전제합니다. 검증 전 법무/정책 검토 완료 여부를 확인하세요.`);
    }
    if (v.edge_cases && v.edge_cases.length > 0) {
      lines.push("");
      lines.push("**Edge cases:**");
      lines.push("");
      lines.push("| 시나리오 | 예상 결과 |");
      lines.push("|---------|----------|");
      for (const ec of v.edge_cases) {
        lines.push(`| ${ec.scenario} | ${ec.expected_result} |`);
      }
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}
