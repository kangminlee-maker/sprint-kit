import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Event, EventType } from "./types.js";
import {
  STATES,
  TERMINAL_STATES,
  TRANSITION_EVENT_TYPES,
  GLOBAL_EVENT_TYPES,
  OBSERVATIONAL_EVENT_TYPES,
} from "./types.js";

const GOLDEN_PATH = resolve(
  import.meta.dirname,
  "../../scopes/example-tutor-block/events.ndjson",
);

function readGoldenEvents(): Event[] {
  const content = readFileSync(GOLDEN_PATH, "utf-8").trimEnd();
  return content.split("\n").map((line) => JSON.parse(line) as Event);
}

describe("types — golden data compatibility", () => {
  const events = readGoldenEvents();

  it("parses all 29 golden events without error", () => {
    expect(events).toHaveLength(29);
  });

  it("every event has required envelope fields", () => {
    for (const evt of events) {
      expect(evt.event_id).toBeDefined();
      expect(evt.scope_id).toBeDefined();
      expect(evt.type).toBeDefined();
      expect(evt.ts).toBeDefined();
      expect(typeof evt.revision).toBe("number");
      expect(evt.actor).toBeDefined();
      expect(evt.state_after).toBeDefined();
      expect(evt.payload).toBeDefined();
    }
  });

  it("every event type is a known EventType", () => {
    const allTypes: ReadonlySet<string> = new Set([
      ...TRANSITION_EVENT_TYPES,
      ...GLOBAL_EVENT_TYPES,
      ...OBSERVATIONAL_EVENT_TYPES,
    ]);
    for (const evt of events) {
      expect(allTypes.has(evt.type)).toBe(true);
    }
  });

  it("every state_before and state_after is a known State", () => {
    const stateSet: ReadonlySet<string | null> = new Set([
      ...STATES,
      null,
    ]);
    for (const evt of events) {
      expect(stateSet.has(evt.state_before)).toBe(true);
      expect(stateSet.has(evt.state_after)).toBe(true);
    }
  });

  it("revisions are monotonically increasing", () => {
    for (let i = 1; i < events.length; i++) {
      expect(events[i]!.revision).toBe(events[i - 1]!.revision + 1);
    }
  });
});

describe("types — constants", () => {
  it("has 14 states", () => {
    expect(STATES).toHaveLength(14);
  });

  it("terminal states are closed, deferred, rejected", () => {
    expect(TERMINAL_STATES.has("closed")).toBe(true);
    expect(TERMINAL_STATES.has("deferred")).toBe(true);
    expect(TERMINAL_STATES.has("rejected")).toBe(true);
    expect(TERMINAL_STATES.size).toBe(3);
  });

  it("has 2 global event types", () => {
    expect(GLOBAL_EVENT_TYPES).toHaveLength(2);
  });

  it("has 12 observational event types", () => {
    expect(OBSERVATIONAL_EVENT_TYPES).toHaveLength(12);
  });
});
