import type { ScopeState, AlignPacketContent, EvidenceStatus } from "../kernel/types.js";
import { findConstraint } from "../kernel/constraint-pool.js";
import { formatPerspective } from "./format.js";

/**
 * Render an Align Packet — the document that confronts user intent with
 * current reality and surfaces tensions for scope confirmation.
 *
 * Pure function: (state, content) → string.
 *
 * - "처리하지 않으면" is sourced from pool.impact_if_ignored (single source).
 * - Summary table is built from content.tensions constraint_ids (not full pool).
 * - Throws if any tension constraint_id is not in the pool.
 * - Throws if entry_mode is "interface" but interface_extras is missing.
 */
export function renderAlignPacket(
  state: ScopeState,
  content: AlignPacketContent,
): string {
  // ── Pre-render validation ──
  validate(state, content);

  const lines: string[] = [];

  // ── Header ──
  lines.push(`## Align Packet: ${state.title}`);
  lines.push("");

  // ── Section 1: To-be ──
  renderToBe(lines, state, content);

  // ── Section 2: As-is ──
  renderAsIs(lines, content);

  // ── Section 2.5: Unverified assumptions ──
  renderUnverifiedAssumptions(lines, state);

  // ── Section 3: Tension ──
  renderTension(lines, state, content);

  // ── Section 4: Decision ──
  renderDecision(lines, content);

  return lines.join("\n");
}

// ─── Validation ───

function validate(state: ScopeState, content: AlignPacketContent): void {
  // Check all tension constraint_ids exist in pool
  const missingIds = content.tensions
    .map((t) => t.constraint_id)
    .filter((id) => findConstraint(state.constraint_pool, id) === undefined);

  if (missingIds.length > 0) {
    throw new Error(
      `renderAlignPacket: constraint_id not found in pool: ${missingIds.join(", ")}. constraint.discovered 이벤트로 해당 ID를 pool에 먼저 등록하세요.`,
    );
  }

  // Check interface_extras for interface scope
  if (state.entry_mode === "interface" && !content.interface_extras) {
    throw new Error(
      "renderAlignPacket: entry_mode is 'interface' but interface_extras is missing. AlignPacketContent에 interface_extras(api_scope, breaking_change, version_policy)를 포함하세요.",
    );
  }
}

// ─── Section 1: To-be ───

function renderToBe(
  lines: string[],
  state: ScopeState,
  content: AlignPacketContent,
): void {
  lines.push("### 1. 당신이 요청한 것 (To-be)");
  lines.push("");
  lines.push(`**원문:** "${content.user_original_text}"`);
  lines.push("");
  lines.push("**시스템이 해석한 방향:**");
  lines.push(content.interpreted_direction);
  lines.push("");

  // Proposed scope — inclusion
  lines.push("**제안된 범위:**");
  lines.push("");
  lines.push("| 포함 | 동의하시나요? |");
  lines.push("|------|-------------|");
  for (const item of content.proposed_scope.in) {
    lines.push(`| ${item} | |`);
  }
  lines.push("");

  // Proposed scope — exclusion
  lines.push("| 제외 | 동의하시나요? |");
  lines.push("|------|-------------|");
  for (const item of content.proposed_scope.out) {
    lines.push(`| ${item} | |`);
  }
  lines.push("");

  // Scenarios
  lines.push("**시나리오:**");
  lines.push("");
  for (const scenario of content.scenarios) {
    lines.push(`> ${scenario}`);
    lines.push(">");
  }
  lines.push("");

  // Interface scope extras
  if (state.entry_mode === "interface" && content.interface_extras) {
    lines.push("**Interface scope 추가 항목:**");
    lines.push("");
    lines.push("| 항목 | 값 |");
    lines.push("|------|-----|");
    lines.push(`| API 공개 범위 | ${content.interface_extras.api_scope} |`);
    lines.push(`| 하위 호환 허용 여부 | ${content.interface_extras.breaking_change} |`);
    lines.push(`| 버전 정책 | ${content.interface_extras.version_policy} |`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
}

// ─── Section 2: As-is ───

function renderAsIs(lines: string[], content: AlignPacketContent): void {
  lines.push("### 2. 현재 현실 (As-is)");
  lines.push("");

  lines.push("#### Experience 관점 — 지금 사용자가 보는 것");
  lines.push("");
  lines.push(content.as_is.experience);
  lines.push("");

  lines.push("#### Policy 관점 — 지금 적용되는 규칙");
  lines.push("");
  lines.push(content.as_is.policy);
  lines.push("");

  lines.push("#### Code 관점 — 지금 시스템이 할 수 있는 것");
  lines.push("");
  lines.push(content.as_is.code);
  lines.push("");

  if (content.as_is.code_details) {
    lines.push("<details>");
    lines.push("<summary>기술 상세 (Builder 참고용)</summary>");
    lines.push("");
    lines.push(content.as_is.code_details);
    lines.push("</details>");
    lines.push("");
  }

  lines.push("---");
  lines.push("");
}

// ─── Section 3: Tension ───

function renderTension(
  lines: string[],
  state: ScopeState,
  content: AlignPacketContent,
): void {
  lines.push("### 3. 충돌 지점 (Tension)");
  lines.push("");

  if (content.tensions.length === 0) {
    lines.push("발견된 충돌이 없습니다.");
    lines.push("");
    lines.push("---");
    lines.push("");
    return;
  }

  lines.push(
    `요청한 것(to-be)과 현재 현실(as-is) 사이에 ${content.tensions.length}건의 충돌이 발견되었습니다.`,
  );
  lines.push("");

  // Summary table
  lines.push("| CST-ID | 관점 | 요약 |");
  lines.push("|--------|------|------|");
  for (const t of content.tensions) {
    const entry = findConstraint(state.constraint_pool, t.constraint_id)!;
    lines.push(`| ${t.constraint_id} | ${formatPerspective(entry.perspective)} | ${entry.summary} |`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // Individual details
  for (const t of content.tensions) {
    const entry = findConstraint(state.constraint_pool, t.constraint_id)!;

    lines.push(
      `#### ${t.constraint_id} | ${formatPerspective(entry.perspective)} | ${entry.summary}`,
    );
    lines.push("");

    lines.push("**이것이 무엇인가:**");
    lines.push(t.what);
    lines.push("");

    lines.push("**왜 충돌하는가:**");
    lines.push(t.why_conflict);
    lines.push("");

    lines.push("**처리하지 않으면:**");
    lines.push(entry.impact_if_ignored);
    lines.push("");

    lines.push(`**변경 규모:** ${t.scale}`);
    lines.push("");

    if (t.options && t.options.length > 0) {
      lines.push("**선택지:**");
      lines.push("");
      lines.push("| 선택 | 이점 | 리스크 | 내용 |");
      lines.push("|------|------|--------|------|");
      for (const opt of t.options) {
        const detail = opt.detail ?? "";
        lines.push(`| ${opt.choice} | ${opt.pros} | ${opt.risk} | ${detail} |`);
      }
      lines.push("");
    }

    if (t.recommendation) {
      lines.push(`**추천:** ${t.recommendation}`);
      lines.push("");
    }

    if (t.details) {
      lines.push("<details>");
      lines.push("<summary>기술 상세 (Builder 참고용)</summary>");
      lines.push("");
      lines.push(t.details);
      lines.push("</details>");
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }
}

// ─── Section 4: Decision ───

function renderDecision(
  lines: string[],
  content: AlignPacketContent,
): void {
  lines.push("### 4. 지금 결정할 것");
  lines.push("");

  for (let i = 0; i < content.decision_questions.length; i++) {
    lines.push(`${i + 1}. ${content.decision_questions[i]}`);
  }
  lines.push("");

  lines.push("다음 중 번호로 선택해 주세요:");
  lines.push("");
  lines.push("1. **Approve** — 이 방향과 범위에 동의합니다. Surface(화면 설계) 단계로 진행합니다.");
  lines.push("2. **Revise** — Align Packet을 수정하고 싶습니다. 피드백을 주시면 수정 후 다시 보여드립니다. 소스는 다시 읽지 않습니다.");
  lines.push("3. **Reject** — 이 scope를 거절하고 종료합니다.");
  lines.push("4. **Redirect** — 소스를 다시 읽은 뒤 처음부터 재분석합니다. 소스 정보가 오래되었거나 부족한 경우에 선택하세요.");
  lines.push("");
  lines.push("<details><summary>추가 선택지</summary>");
  lines.push("");
  lines.push("5. **Review** — 6-Agent Panel Review를 요청합니다. 전문가 6인이 검토 후 보강된 Packet을 다시 제시합니다.");
  lines.push("");
  lines.push("</details>");
  lines.push("");
  lines.push("번호(1~4) 또는 자연어로 말씀해 주세요.");
  lines.push("");
}

// ─── Section 2.5: Unverified Assumptions ───

function renderUnverifiedAssumptions(
  lines: string[],
  state: ScopeState,
): void {
  const unverified = state.constraint_pool.constraints.filter(
    (c) =>
      c.status !== "invalidated" &&
      (c.evidence_status === "unverified" ||
        c.evidence_status === "code_inferred" ||
        c.evidence_status === "brief_claimed"),
  );

  if (unverified.length === 0) return;

  lines.push("### 2.5 미검증 가정 (주의)");
  lines.push("");
  lines.push(
    "아래 항목은 정책 문서에서 확인되지 않은 가정입니다. Approve 전에 확인을 권장합니다.",
  );
  lines.push("");

  lines.push("| CST-ID | 가정 출처 | 요약 | 확인 필요 사항 |");
  lines.push("|--------|----------|------|--------------|");
  for (const c of unverified) {
    const statusLabel = formatEvidenceStatus(c.evidence_status);
    const note = c.evidence_note ?? "";
    lines.push(
      `| ${c.constraint_id} | ${statusLabel} | ${c.summary} | ${note} |`,
    );
  }
  lines.push("");
  lines.push("---");
  lines.push("");
}

function formatEvidenceStatus(status: EvidenceStatus): string {
  switch (status) {
    case "verified":
      return "정책 문서 확인됨";
    case "code_inferred":
      return "코드 추론";
    case "brief_claimed":
      return "brief 주장";
    case "unverified":
      return "미확인";
  }
}

// ─── Helpers ───
// formatPerspective is imported from ./format.ts

