import type {
  ScopeState,
  DraftPacketContent,
  ConstraintDetail,
  ConstraintEntry,
} from "../kernel/types.js";
import { findConstraint } from "../kernel/constraint-pool.js";
import { formatPerspective } from "./format.js";

/**
 * Render a Draft Packet — the document that presents deep constraint
 * discovery results and collects user decisions on each constraint.
 *
 * Pure function: (state, content) → string.
 *
 * - "처리하지 않으면" from pool.impact_if_ignored (single source).
 * - Summary table sorted: required → recommended, then CST-ID ascending.
 * - PO/Builder detail format determined by pool's decision_owner.
 * - Section 4 (Invalidated) auto-generated from pool; omitted if 0 items.
 * - Throws if constraint_id not in pool.
 */
export function renderDraftPacket(
  state: ScopeState,
  content: DraftPacketContent,
): string {
  validate(state, content);

  const lines: string[] = [];

  lines.push(`## Draft Packet: ${state.title}`);
  lines.push("");

  renderSurface(lines, state, content);
  renderStatus(lines, state);
  renderConstraints(lines, state, content);
  renderInvalidated(lines, state);
  renderGuardrails(lines, content);
  renderDecision(lines, state, content);

  return lines.join("\n");
}

// ─── Validation ───

function validate(state: ScopeState, content: DraftPacketContent): void {
  const missingIds = content.constraint_details
    .map((d) => d.constraint_id)
    .filter((id) => findConstraint(state.constraint_pool, id) === undefined);

  if (missingIds.length > 0) {
    throw new Error(
      `renderDraftPacket: constraint_id not found in pool: ${missingIds.join(", ")}. constraint.discovered 이벤트로 해당 ID를 pool에 먼저 등록하세요.`,
    );
  }

  for (const d of content.constraint_details) {
    const entry = findConstraint(state.constraint_pool, d.constraint_id)!;
    if (entry.decision_owner !== d.decision_owner) {
      const fix = entry.decision_owner === "builder"
        ? "ConstraintDetailBuilder 형식(builder_decision, builder_judgment)으로 변경하세요"
        : "ConstraintDetailPO 형식(options_table, recommendation)으로 변경하세요";
      throw new Error(
        `renderDraftPacket: decision_owner mismatch for ${d.constraint_id} — pool: "${entry.decision_owner}", content: "${d.decision_owner}". ${fix}`,
      );
    }
  }
}

// ─── Section 1: 확정된 Surface ───

function renderSurface(
  lines: string[],
  state: ScopeState,
  content: DraftPacketContent,
): void {
  lines.push("### 1. 확정된 Surface");
  lines.push("");
  lines.push(`- **scope type**: ${state.entry_mode}`);
  lines.push(`- **surface location**: \`${content.surface_path}\``);
  if (content.run_command) {
    lines.push(`- **실행 방법**: \`${content.run_command}\``);
  }
  if (content.mockup_revisions !== undefined) {
    lines.push(
      `- **mockup 반복**: ${content.mockup_revisions}회 수정 후 사용자 확정`,
    );
  }
  lines.push("");

  if (content.scenario_guide.length > 0) {
    lines.push("**시나리오 가이드:**");
    lines.push("");
    lines.push("| 시나리오 | 시작 | 동작 순서 | 확인된 동작 |");
    lines.push("|---------|------|----------|------------|");
    for (const s of content.scenario_guide) {
      lines.push(`| ${s.scenario} | ${s.start} | ${s.steps} | ${s.confirmed} |`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
}

// ─── Section 2: 현재까지의 결정 현황 (자동 생성) ───

function renderStatus(lines: string[], state: ScopeState): void {
  lines.push("### 2. 현재까지의 결정 현황");
  lines.push("");

  // Align decisions
  const alignItems: string[] = [];
  if (state.direction) alignItems.push("방향 승인");
  if (state.scope_boundaries) alignItems.push("범위 확정");
  const groundingCSTs = state.constraint_pool.constraints
    .filter((c) => c.discovery_stage === "grounding")
    .map((c) => c.constraint_id);
  if (groundingCSTs.length > 0) {
    alignItems.push(`${groundingCSTs.join(", ")} 인지 완료`);
  }
  lines.push(`- Align에서 결정: ${alignItems.join(", ")}`);

  // Draft decisions needed
  const { summary } = state.constraint_pool;
  const active = summary.total - summary.invalidated;
  lines.push(
    `- Draft에서 결정 필요: 아래 ${active}건 (${summary.decided}건 결정 완료, ${summary.undecided + summary.clarify_pending}건 미결정)`,
  );

  // Lock condition
  if (summary.clarify_pending > 0) {
    lines.push(
      `- 잠금 전 필수 해소: \`clarify\` 상태 항목이 ${summary.clarify_pending}건 있어 잠글 수 없음`,
    );
  } else {
    lines.push("- 잠금 전 필수 해소: `clarify` 상태 항목이 있으면 잠글 수 없음");
  }
  lines.push("");
  lines.push("---");
  lines.push("");
}

// ─── Section 3: 결정이 필요한 항목 ───

function renderConstraints(
  lines: string[],
  state: ScopeState,
  content: DraftPacketContent,
): void {
  lines.push("### 3. 결정이 필요한 항목 — 확정된 mockup 기준");
  lines.push("");

  if (content.constraint_details.length === 0) {
    lines.push("발견된 제약이 없습니다.");
    lines.push("");
    lines.push("---");
    lines.push("");
    return;
  }

  // Sorted entries: required → recommended, then CST-ID
  const sorted = sortConstraintDetails(content.constraint_details, state);

  // Summary table
  lines.push("#### 요약");
  lines.push("");
  lines.push("| CST-ID | 관점 | 요약 | severity(중요도) |");
  lines.push("|--------|------|------|--------|");
  for (const d of sorted) {
    const entry = findConstraint(state.constraint_pool, d.constraint_id)!;
    const severityLabel = formatSeverity(entry, d);
    lines.push(
      `| ${d.constraint_id} | ${formatPerspective(entry.perspective)} | ${entry.summary} | ${severityLabel} |`,
    );
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // Individual details
  for (const d of sorted) {
    const entry = findConstraint(state.constraint_pool, d.constraint_id)!;
    renderConstraintDetail(lines, d, entry);
  }
}

function renderConstraintDetail(
  lines: string[],
  detail: ConstraintDetail,
  entry: ConstraintEntry,
): void {
  const severityTag = entry.severity === "required" ? "필수" : "권장";
  const ownerTag =
    detail.decision_owner === "builder" ? " (Builder 결정 항목)" : "";
  lines.push(
    `#### ${detail.constraint_id} | ${formatPerspective(entry.perspective)} | ${entry.summary} — ${severityTag}${ownerTag}`,
  );
  lines.push("");

  lines.push(`**상황:** ${detail.situation}`);
  lines.push("");

  lines.push(`**처리하지 않으면:** ${entry.impact_if_ignored}`);
  lines.push("");

  if (detail.decision_owner === "product_owner") {
    // PO detail
    lines.push("**선택지:**");
    lines.push("");
    lines.push("| 선택 | 내용 | 리스크 | 되돌림 비용 |");
    lines.push("|------|------|--------|------------|");
    for (const opt of detail.options_table) {
      lines.push(
        `| ${opt.choice} | ${opt.description} | ${opt.risk} | ${opt.reversal_cost} |`,
      );
    }
    lines.push("");
    lines.push(`추천: ${detail.recommendation}`);
    lines.push("");
    lines.push("선택: ___");
  } else {
    // Builder detail
    lines.push(`**Builder가 결정할 사항:** ${detail.builder_decision}`);
    lines.push("");
    lines.push(
      `**이 작업 관점에서의 판단:** ${detail.builder_judgment}`,
    );
    lines.push("");
    if (detail.guardrail) {
      lines.push(`**guardrail:** ${detail.guardrail}`);
      lines.push("");
      lines.push("Builder 결정 예정 — 위 guardrail 확인 후 승인: ___");
    } else {
      lines.push("Builder 결정 예정 — 제품 관점 제약 조건 없음. 승인: ___");
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");
}

// ─── Section 4: 시스템이 제외한 항목 (자동, 조건부) ───

function renderInvalidated(lines: string[], state: ScopeState): void {
  const invalidated = state.constraint_pool.constraints.filter(
    (c) => c.status === "invalidated",
  );

  if (invalidated.length === 0) return;

  lines.push("### 4. 시스템이 제외한 항목");
  lines.push("");
  lines.push("| CST-ID | 관점 | 요약 | 제외 사유 |");
  lines.push("|--------|------|------|----------|");
  for (const c of invalidated) {
    lines.push(`| ${c.constraint_id} | ${formatPerspective(c.perspective)} | ${c.summary} | ${c.invalidation_reason ?? ""} |`);
  }
  lines.push("");

  // Required severity warning
  const requiredInvalidated = invalidated.filter(
    (c) => c.severity === "required",
  );
  if (requiredInvalidated.length > 0) {
    for (const c of requiredInvalidated) {
      lines.push(
        `> **${c.constraint_id}**: 이 항목은 기능 불능 또는 규정 위반으로 분류되었습니다. 제외에 동의하시나요?`,
      );
    }
    lines.push("");
  }

  lines.push(
    "동의하지 않으면 해당 항목을 결정 목록으로 복원할 수 있습니다.",
  );
  lines.push("");
  lines.push("---");
  lines.push("");
}

// ─── Section 5: 제약 조건 ───

function renderGuardrails(
  lines: string[],
  content: DraftPacketContent,
): void {
  lines.push("### 5. 제약 조건 (구현 시 반드시 지켜야 할 것)");
  lines.push("");
  if (content.guardrails.length === 0) {
    lines.push("없음");
  } else {
    for (const g of content.guardrails) {
      lines.push(`- ${g}`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push("");
}

// ─── Section 6: 지금 결정할 것 ───

function renderDecision(
  lines: string[],
  state: ScopeState,
  content: DraftPacketContent,
): void {
  lines.push("### 6. 지금 결정할 것");
  lines.push("");

  if (content.constraint_details.length === 0) {
    lines.push("발견된 제약이 없으므로, Approve만 선택하시면 됩니다.");
    lines.push("");
    lines.push("선택: **Approve** / **Revise** / **Reject** / **Redirect to Align**");
  } else {
    for (let i = 0; i < content.decision_questions.length; i++) {
      lines.push(`${i + 1}. ${content.decision_questions[i]}`);
    }
    lines.push("");

    if (state.constraint_pool.summary.clarify_pending > 0) {
      lines.push(
        `> \`clarify\`를 선택한 항목은 해소될 때까지 잠글 수 없습니다 (현재 ${state.constraint_pool.summary.clarify_pending}건)`,
      );
      lines.push("");
    }

    lines.push("모든 결정이 완료되면 compile을 시작합니다.");
    lines.push("");
    lines.push(
      "선택: **Approve** + 각 CST 결정 / **Revise** / **Reject** / **Redirect to Align**",
    );
  }
  lines.push("");
}

// ─── Helpers ───

function sortConstraintDetails(
  details: ConstraintDetail[],
  state: ScopeState,
): ConstraintDetail[] {
  return [...details].sort((a, b) => {
    const entryA = findConstraint(state.constraint_pool, a.constraint_id)!;
    const entryB = findConstraint(state.constraint_pool, b.constraint_id)!;
    // required first
    if (entryA.severity !== entryB.severity) {
      return entryA.severity === "required" ? -1 : 1;
    }
    // then CST-ID ascending
    return a.constraint_id.localeCompare(b.constraint_id);
  });
}

function formatSeverity(
  entry: ConstraintEntry,
  detail: ConstraintDetail,
): string {
  const base = entry.severity === "required" ? "필수" : "권장";
  const suffix = detail.decision_owner === "builder" ? " (Builder 결정)" : "";
  return `${base}${suffix}`;
}

// formatPerspective is imported from ./format.ts
