import { describe, it, expect } from "vitest";
import { detectPatterns } from "./index.js";

describe("detectPatterns", () => {
  // ─── Dispatch: correct detector for each extension ───
  describe("dispatch", () => {
    it("detects imports in .ts files", () => {
      const content = `import { foo } from "./foo.js";`;
      const result = detectPatterns(content, "src/index.ts");
      expect(result.deps).toHaveLength(1);
      expect(result.deps[0].to).toBe("./foo.js");
    });

    it("detects imports in .java files", () => {
      const content = `import com.example.User;`;
      const result = detectPatterns(content, "User.java");
      expect(result.deps).toHaveLength(1);
      expect(result.deps[0].to).toBe("com.example.User");
    });

    it("detects imports in .py files", () => {
      const content = `import os`;
      const result = detectPatterns(content, "main.py");
      expect(result.deps).toHaveLength(1);
    });

    it("detects imports in .go files", () => {
      const content = `import "fmt"`;
      const result = detectPatterns(content, "main.go");
      expect(result.deps).toHaveLength(1);
    });

    it("detects imports in .kt files", () => {
      const content = `import com.example.User`;
      const result = detectPatterns(content, "App.kt");
      expect(result.deps).toHaveLength(1);
    });

    it("detects API routes in Java files", () => {
      const content = `@GetMapping("/users")
public List<User> list() {}`;
      const result = detectPatterns(content, "Controller.java");
      expect(result.apis).toHaveLength(1);
      expect(result.apis[0].method).toBe("GET");
    });

    it("detects API routes in Next.js route files", () => {
      const content = `export async function GET() {}`;
      const result = detectPatterns(content, "app/api/test/route.ts");
      expect(result.apis).toHaveLength(1);
    });

    it("detects schemas in SQL files", () => {
      const content = `CREATE TABLE users (id INT);`;
      const result = detectPatterns(content, "V1__init.sql");
      expect(result.schemas).toHaveLength(1);
      expect(result.schemas[0].table).toBe("users");
    });

    it("detects schemas in .ts files (Drizzle)", () => {
      const content = `export const users = pgTable("users", {});`;
      const result = detectPatterns(content, "schema.ts");
      expect(result.schemas).toHaveLength(1);
    });

    it("detects configs in .env files", () => {
      const content = `DATABASE_URL=postgres://localhost/db`;
      const result = detectPatterns(content, ".env");
      expect(result.configs).toHaveLength(1);
      expect(result.configs[0].key).toBe("DATABASE_URL");
    });

    it("detects process.env in .ts files", () => {
      const content = `const port = process.env.PORT;`;
      const result = detectPatterns(content, "config.ts");
      expect(result.configs).toHaveLength(1);
    });

    it("detects doc structure in .yaml files", () => {
      const content = `name: app\nversion: 1.0`;
      const result = detectPatterns(content, "config.yaml");
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].format).toBe("yaml");
    });

    it("detects doc structure in .md files", () => {
      const content = `# Title\n## Section`;
      const result = detectPatterns(content, "README.md");
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].format).toBe("markdown");
    });
  });

  // ─── Unknown extensions ───
  describe("unknown extensions", () => {
    it("returns empty result for .rs files", () => {
      const result = detectPatterns("use std::io;", "main.rs");
      expect(result).toEqual({ deps: [], apis: [], schemas: [], configs: [], docs: [] });
    });

    it("returns empty result for extensionless files", () => {
      const result = detectPatterns("some content", "Makefile");
      expect(result).toEqual({ deps: [], apis: [], schemas: [], configs: [], docs: [] });
    });
  });

  // ─── Edge cases ───
  describe("edge cases", () => {
    it("returns empty result for empty string", () => {
      const result = detectPatterns("", "file.ts");
      expect(result).toEqual({ deps: [], apis: [], schemas: [], configs: [], docs: [] });
    });

    it("returns empty result for binary-like content in unknown ext", () => {
      const binary = "\x00\x01\x02\xFF\xFE";
      const result = detectPatterns(binary, "file.bin");
      expect(result).toEqual({ deps: [], apis: [], schemas: [], configs: [], docs: [] });
    });

    it("handles combined patterns in a single file", () => {
      const content = `import { pgTable } from "drizzle-orm";
const db_url = process.env.DATABASE_URL;
export const users = pgTable("users", {});
`;
      const result = detectPatterns(content, "schema.ts");
      expect(result.deps.length).toBeGreaterThanOrEqual(1);
      expect(result.configs.length).toBeGreaterThanOrEqual(1);
      expect(result.schemas.length).toBeGreaterThanOrEqual(1);
    });
  });
});
