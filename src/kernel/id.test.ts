import { describe, it, expect } from "vitest";
import { makeId } from "./id.js";

describe("makeId", () => {
  it("pads single digit to 3 characters", () => {
    expect(makeId("evt_", 1)).toBe("evt_001");
  });

  it("pads double digit to 3 characters", () => {
    expect(makeId("IMPL-", 12)).toBe("IMPL-012");
  });

  it("does not pad triple digit", () => {
    expect(makeId("CHG-", 100)).toBe("CHG-100");
  });

  it("works with various prefixes", () => {
    expect(makeId("VAL-", 5)).toBe("VAL-005");
    expect(makeId("CST-", 99)).toBe("CST-099");
  });
});
