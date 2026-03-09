import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readEvents, appendEvent, nextRevision } from "./event-store.js";
import type { Event } from "./types.js";

function makeEvent(
  revision: number,
  overrides?: Partial<Event>,
): Event<"scope.created"> {
  return {
    event_id: `evt_${revision}`,
    scope_id: "SC-TEST-001",
    type: "scope.created",
    ts: new Date().toISOString(),
    revision,
    actor: "user",
    state_before: null,
    state_after: "draft",
    payload: {
      title: "test",
      description: "test scope",
      entry_mode: "experience",
    },
    ...overrides,
  } as Event<"scope.created">;
}

describe("event-store", () => {
  let tmpDir: string;
  let filePath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sprint-kit-test-"));
    filePath = join(tmpDir, "events.ndjson");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("readEvents", () => {
    it("returns empty array for non-existent file", () => {
      expect(readEvents(filePath)).toEqual([]);
    });

    it("reads golden data successfully", () => {
      const goldenPath = join(
        import.meta.dirname,
        "../../scopes/example-tutor-block/events.ndjson",
      );
      const events = readEvents(goldenPath);
      expect(events).toHaveLength(29);
      expect(events[0]!.type).toBe("scope.created");
      expect(events[28]!.type).toBe("compile.completed");
    });
  });

  describe("appendEvent", () => {
    it("creates file and writes event", () => {
      const evt = makeEvent(1);
      appendEvent(filePath, evt);

      const content = readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content.trimEnd());
      expect(parsed.event_id).toBe("evt_1");
    });

    it("appends multiple events", () => {
      appendEvent(filePath, makeEvent(1));
      appendEvent(
        filePath,
        makeEvent(2, {
          event_id: "evt_2",
          type: "grounding.started",
          state_before: "draft",
          state_after: "draft",
          payload: {
            sources: [{ type: "add-dir", path_or_url: "/test" }],
          },
        } as Partial<Event>),
      );

      const events = readEvents(filePath);
      expect(events).toHaveLength(2);
      expect(events[0]!.revision).toBe(1);
      expect(events[1]!.revision).toBe(2);
    });

    it("creates parent directories if needed", () => {
      const nestedPath = join(tmpDir, "deep", "nested", "events.ndjson");
      appendEvent(nestedPath, makeEvent(1));
      const events = readEvents(nestedPath);
      expect(events).toHaveLength(1);
    });
  });

  describe("nextRevision", () => {
    it("returns 1 for non-existent file", () => {
      expect(nextRevision(filePath)).toBe(1);
    });

    it("returns next number after last event", () => {
      appendEvent(filePath, makeEvent(1));
      appendEvent(
        filePath,
        makeEvent(2, {
          event_id: "evt_2",
          type: "grounding.started",
          state_before: "draft",
          state_after: "draft",
          payload: {
            sources: [{ type: "add-dir", path_or_url: "/test" }],
          },
        } as Partial<Event>),
      );
      expect(nextRevision(filePath)).toBe(3);
    });
  });
});
