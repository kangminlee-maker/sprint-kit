import type { ScopeState, VerdictLogEntry } from "../kernel/types.js";

/**
 * Render scope.md — the current status view of a scope.
 *
 * Pure function: (state) → string.
 * No side effects, no external I/O.
 */
export function renderScopeMd(state: ScopeState): string {
  const lines: string[] = [];

  // ── Header ──
  lines.push(`# Scope: ${state.title}`);
  lines.push("");

  // ── Current stage ──
  lines.push("## 현황");
  lines.push("");
  lines.push(`- **상태**: ${formatState(state.current_state)}`);
  if (state.direction) {
    lines.push(`- **방향**: ${state.direction}`);
  }
  lines.push(`- **마지막 업데이트**: revision ${state.latest_revision}`);
  lines.push("");

  // ── Blockers (only when present) ──
  const blockers = collectBlockers(state);
  if (blockers.length > 0) {
    lines.push("## 차단 상태");
    lines.push("");
    for (const b of blockers) {
      lines.push(`- ${b}`);
    }
    lines.push("");
  }

  // ── Next action ──
  lines.push("## 다음 행동");
  lines.push("");
  lines.push(`- ${formatNextAction(state)}`);
  lines.push("");

  // ── Scope boundaries (if locked) ──
  if (state.scope_boundaries) {
    lines.push("## 범위");
    lines.push("");
    if (state.scope_boundaries.in.length > 0) {
      lines.push("**포함:**");
      for (const item of state.scope_boundaries.in) {
        lines.push(`- ${item}`);
      }
      lines.push("");
    }
    if (state.scope_boundaries.out.length > 0) {
      lines.push("**제외:**");
      for (const item of state.scope_boundaries.out) {
        lines.push(`- ${item}`);
      }
      lines.push("");
    }
  }

  // ── Constraint summary ──
  const { summary } = state.constraint_pool;
  if (summary.total > 0) {
    lines.push("## Constraint 현황");
    lines.push("");
    lines.push(`- 전체: ${summary.total}건 (필수 ${summary.required}, 권장 ${summary.recommended})`);
    lines.push(`- 결정 완료: ${summary.decided}건`);
    if (summary.undecided > 0) {
      lines.push(`- 미결정: ${summary.undecided}건`);
    }
    if (summary.clarify_pending > 0) {
      lines.push(`- clarify 대기: ${summary.clarify_pending}건`);
    }
    if (summary.invalidated > 0) {
      lines.push(`- 제외됨: ${summary.invalidated}건`);
    }
    lines.push("");
  }

  // ── Recent decisions ──
  if (state.verdict_log.length > 0) {
    lines.push("## 최근 결정");
    lines.push("");
    const recent = state.verdict_log.slice(-5);
    for (const entry of recent) {
      lines.push(`- ${formatVerdictEntry(entry)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Helpers ───

const STATE_LABELS: Record<string, string> = {
  draft: "초안 (소스 스캔 전)",
  grounded: "소스 스캔 완료",
  align_proposed: "Align Packet 검토 중",
  align_locked: "방향·범위 확정됨",
  surface_iterating: "Surface 반복 수정 중",
  surface_confirmed: "Surface 확정됨 — constraint 결정 필요",
  constraints_resolved: "모든 constraint 결정 완료",
  target_locked: "Target 잠김 — compile 진행 중",
  compiled: "Build Spec 생성 완료",
  applied: "구현 적용 완료 — 검증 대기",
  validated: "검증 통과 — 종료 가능",
  closed: "종료됨",
  deferred: "보류됨",
  rejected: "거절됨",
};

function formatState(state: string): string {
  return STATE_LABELS[state] ?? state;
}

function formatNextAction(state: ScopeState): string {
  if (state.convergence_blocked) {
    return "수렴 차단 상태입니다. convergence.action_taken이 필요합니다";
  }

  switch (state.current_state) {
    case "draft":
      return "소스를 스캔하세요 (`/start`)";
    case "grounded":
      return "Align Packet을 검토하세요 (`/align`)";
    case "align_proposed":
      return "Align Packet에 대해 결정하세요 (approve/revise/reject)";
    case "align_locked":
      return "Surface를 생성하세요 (`/draft`)";
    case "surface_iterating":
      return "Surface를 검토하고 피드백하세요";
    case "surface_confirmed":
      return state.constraint_pool.summary.undecided > 0
        ? `${state.constraint_pool.summary.undecided}건의 constraint에 대해 결정하세요`
        : state.constraint_pool.summary.clarify_pending > 0
          ? `${state.constraint_pool.summary.clarify_pending}건의 clarify를 해소하세요`
          : "모든 결정이 완료되었습니다. target을 잠그세요";
    case "constraints_resolved":
      return "target을 잠그세요";
    case "target_locked":
      return "compile이 진행 중입니다";
    case "compiled":
      return "구현을 적용하세요";
    case "applied":
      return "검증을 실행하세요";
    case "validated":
      return "scope를 종료하세요";
    case "closed":
    case "deferred":
    case "rejected":
      return "이 scope는 종료되었습니다";
    default:
      return `현재 상태: ${state.current_state}`;
  }
}

function collectBlockers(state: ScopeState): string[] {
  const blockers: string[] = [];
  if (state.stale) {
    const sources = state.stale_sources?.map((s) => s.path).join(", ") ?? "알 수 없음";
    blockers.push(`소스가 변경되었습니다: ${sources} (revision ${state.stale_since ?? "?"}부터)`);
  }
  if (state.convergence_blocked) {
    blockers.push("수렴 차단: revise가 차단되었습니다. 행동을 선택해야 합니다");
  }
  if (state.constraint_pool.summary.clarify_pending > 0) {
    blockers.push(`clarify 미해소: ${state.constraint_pool.summary.clarify_pending}건. 해소 전까지 target 잠금 불가`);
  }
  return blockers;
}

function formatVerdictEntry(entry: VerdictLogEntry): string {
  switch (entry.type) {
    case "align.locked":
      return `rev ${entry.revision}: 방향 확정 — "${entry.locked_direction}"`;
    case "constraint.decision_recorded":
      return `rev ${entry.revision}: ${entry.constraint_id} → ${entry.decision} (${entry.decision_owner})`;
    case "constraint.clarify_resolved":
      return `rev ${entry.revision}: ${entry.constraint_id} clarify 해소 → ${entry.decision} (${entry.decision_owner})`;
  }
}
