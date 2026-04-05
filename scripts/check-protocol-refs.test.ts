import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-protocol-refs script", () => {
  it("passes against the current protocol docs", () => {
    const output = execFileSync(
      "npx",
      ["tsx", "scripts/check-protocol-refs.ts"],
      { cwd: ROOT, encoding: "utf-8" },
    );

    const result = JSON.parse(output) as {
      status: string;
      summary: { error_count: number };
    };

    expect(result.status).toBe("pass");
    expect(result.summary.error_count).toBe(0);
  });
});
