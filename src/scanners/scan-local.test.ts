import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { scanLocal } from "./scan-local.js";

const TMP = join(import.meta.dirname ?? ".", ".tmp-scanlocal-test");

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe("scanLocal", () => {
  it("scans a directory and returns ScanResult", () => {
    writeFileSync(join(TMP, "app.ts"), 'import { foo } from "./foo";\nconst x = process.env.API_KEY;');
    writeFileSync(join(TMP, "foo.ts"), "export const foo = 1;");

    const result = scanLocal({ type: "add-dir", path: TMP });

    expect(result.files.length).toBeGreaterThanOrEqual(2);
    expect(result.dependency_graph.length).toBeGreaterThan(0);
    expect(result.config_patterns.length).toBeGreaterThan(0);
    expect(Object.keys(result.content_hashes).length).toBe(1);
  });

  it("scans a single file", () => {
    const filePath = join(TMP, "single.ts");
    writeFileSync(filePath, 'import { bar } from "bar";');

    const result = scanLocal({ type: "add-dir", path: filePath });

    expect(result.files).toHaveLength(1);
    expect(result.dependency_graph).toHaveLength(1);
  });

  it("throws for non-existent path", () => {
    expect(() => scanLocal({ type: "add-dir", path: join(TMP, "nope") }))
      .toThrow("Local source not found");
  });

  it("excludes .git and node_modules", () => {
    mkdirSync(join(TMP, ".git"), { recursive: true });
    writeFileSync(join(TMP, ".git", "config"), "git");
    mkdirSync(join(TMP, "node_modules", "pkg"), { recursive: true });
    writeFileSync(join(TMP, "node_modules", "pkg", "index.js"), "code");
    writeFileSync(join(TMP, "app.ts"), "const a = 1;");

    const result = scanLocal({ type: "add-dir", path: TMP });
    expect(result.files.map(f => f.path)).toEqual(["app.ts"]);
  });

  it("detects API patterns in Java file", () => {
    writeFileSync(join(TMP, "Controller.java"),
      '@GetMapping("/api/users")\npublic List<User> getUsers() {}');

    const result = scanLocal({ type: "add-dir", path: TMP });
    expect(result.api_patterns.length).toBeGreaterThan(0);
    expect(result.api_patterns[0].method).toBe("GET");
  });

  it("detects schema patterns", () => {
    writeFileSync(join(TMP, "V1__init.sql"), "CREATE TABLE users (\n  id BIGINT PRIMARY KEY\n);");

    const result = scanLocal({ type: "add-dir", path: TMP });
    expect(result.schema_patterns.length).toBeGreaterThan(0);
    expect(result.schema_patterns[0].table).toBe("users");
  });

  it("produces consistent hashes", () => {
    writeFileSync(join(TMP, "a.ts"), "const a = 1;");
    const r1 = scanLocal({ type: "add-dir", path: TMP });
    const r2 = scanLocal({ type: "add-dir", path: TMP });
    expect(Object.keys(r1.content_hashes)[0]).toBe(Object.keys(r2.content_hashes)[0]);
  });
});
