import { describe, it, expect } from "vitest";
import { detectConfigs } from "./configs.js";

describe("detectConfigs", () => {
  // ─── .env files ───
  describe("dotenv", () => {
    it("detects KEY=value pairs in .env", () => {
      const content = `DATABASE_URL=postgres://localhost/db
API_KEY=abc123
`;
      const result = detectConfigs(content, ".env");
      expect(result).toEqual([
        { file: ".env", key: "DATABASE_URL", source_type: "dotenv", line: 1 },
        { file: ".env", key: "API_KEY", source_type: "dotenv", line: 2 },
      ]);
    });

    it("handles .env.local, .env.production", () => {
      const content = `PORT=3000`;
      expect(detectConfigs(content, ".env.local")).toHaveLength(1);
      expect(detectConfigs(content, ".env.production")[0].source_type).toBe("dotenv");
    });

    it("skips commented lines in .env", () => {
      const content = `# DB_HOST=localhost
DB_PORT=5432
`;
      const result = detectConfigs(content, ".env");
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("DB_PORT");
    });
  });

  // ─── process.env ───
  describe("process.env", () => {
    it("detects process.env.KEY", () => {
      const content = `const port = process.env.PORT;
const host = process.env.HOST;
`;
      const result = detectConfigs(content, "config.ts");
      expect(result).toEqual([
        { file: "config.ts", key: "PORT", source_type: "env", line: 1 },
        { file: "config.ts", key: "HOST", source_type: "env", line: 2 },
      ]);
    });

    it("detects process.env[\"KEY\"]", () => {
      const content = `const secret = process.env["SECRET_KEY"];`;
      const result = detectConfigs(content, "app.js");
      expect(result).toEqual([
        { file: "app.js", key: "SECRET_KEY", source_type: "env", line: 1 },
      ]);
    });

    it("detects process.env['KEY'] with single quotes", () => {
      const content = `const token = process.env['AUTH_TOKEN'];`;
      const result = detectConfigs(content, "auth.ts");
      expect(result[0].key).toBe("AUTH_TOKEN");
    });
  });

  // ─── System.getenv ───
  describe("System.getenv", () => {
    it("detects System.getenv(\"KEY\")", () => {
      const content = `String dbUrl = System.getenv("DATABASE_URL");`;
      const result = detectConfigs(content, "Config.java");
      expect(result).toEqual([
        { file: "Config.java", key: "DATABASE_URL", source_type: "env", line: 1 },
      ]);
    });
  });

  // ─── Edge cases ───
  describe("edge cases", () => {
    it("returns empty array for empty string", () => {
      expect(detectConfigs("", ".env")).toEqual([]);
    });

    it("returns empty array for binary-like content", () => {
      const binary = "\x00\x01\x02\xFF\xFE";
      expect(detectConfigs(binary, ".env")).toEqual([]);
    });

    it("does not detect dotenv patterns in non-.env files", () => {
      const content = `KEY=value`;
      const result = detectConfigs(content, "readme.txt");
      // Non-.env, non-source file: should return empty
      expect(result).toEqual([]);
    });

    it("handles large .env files without throwing", () => {
      const line = `KEY_${0}=value\n`;
      const lines: string[] = [];
      for (let i = 0; i < 5000; i++) {
        lines.push(`KEY_${i}=value`);
      }
      const result = detectConfigs(lines.join("\n"), ".env");
      expect(result.length).toBe(5000);
    });
  });
});
