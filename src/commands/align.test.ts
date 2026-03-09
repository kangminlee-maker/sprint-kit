import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { executeAlign, type AlignVerdict } from "./align.js";
import { createScope } from "../kernel/scope-manager.js";
import { appendScopeEvent } from "../kernel/event-pipeline.js";
import { readEvents } from "../kernel/event-store.js";
import { reduce } from "../kernel/reducer.js";

let tmpDir: string;

beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), "sprint-align-")); });
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

/** Set up a scope in align_proposed state */
function setupAlignProposed() {
  const paths = createScope(tmpDir, "SC-ALIGN-001");
  appendScopeEvent(paths, { type: "scope.created", actor: "user", payload: { title: "Test", description: "d", entry_mode: "experience" } });
  appendScopeEvent(paths, { type: "grounding.started", actor: "system", payload: { sources: [{ type: "add-dir", path_or_url: "/test" }] } });
  appendScopeEvent(paths, { type: "grounding.completed", actor: "system", payload: { snapshot_revision: 1, source_hashes: { "add-dir:/test": "h1" }, perspective_summary: { experience: 1, code: 1, policy: 1 } } });
  appendScopeEvent(paths, { type: "align.proposed", actor: "system", payload: { packet_path: "build/align-packet.md", packet_hash: "hash1", snapshot_revision: 1 } });
  return paths;
}

describe("executeAlign", () => {
  it("approve → align_locked", () => {
    const paths = setupAlignProposed();
    const result = executeAlign({
      paths,
      verdict: { type: "approve", direction: "튜터 차단 기능", scope_in: ["차단 생성"], scope_out: ["관리자 차단"] },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("align_locked");

    const state = reduce(readEvents(paths.events));
    expect(state.current_state).toBe("align_locked");
    expect(state.direction).toBe("튜터 차단 기능");
  });

  it("revise → stay align_proposed", () => {
    const paths = setupAlignProposed();
    const result = executeAlign({
      paths,
      verdict: { type: "revise", feedback: "범위를 좁혀주세요", feedbackScope: "scope", updatedPacketHash: "hash2" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("align_proposed");
  });

  it("reject → rejected", () => {
    const paths = setupAlignProposed();
    const result = executeAlign({
      paths,
      verdict: { type: "reject", reason: "방향이 잘못됨", basis: "시장 조사 결과" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("rejected");
  });

  it("redirect → grounded", () => {
    const paths = setupAlignProposed();
    const result = executeAlign({
      paths,
      verdict: { type: "redirect", reason: "정보 부족" },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.nextState).toBe("grounded");
  });

  it("fails when not in align_proposed state", () => {
    const paths = createScope(tmpDir, "SC-ALIGN-002");
    appendScopeEvent(paths, { type: "scope.created", actor: "user", payload: { title: "T", description: "d", entry_mode: "experience" } });
    const result = executeAlign({
      paths,
      verdict: { type: "approve", direction: "d", scope_in: [], scope_out: [] },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.reason).toContain("align_proposed");
  });
});
