import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { walkDirectory, computeDirectoryHash, normalizePath, isBinaryFile } from "./file-utils.js";

const TMP = join(import.meta.dirname ?? ".", ".tmp-fileutils-test");

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe("walkDirectory", () => {
  it("lists files recursively", () => {
    mkdirSync(join(TMP, "sub"), { recursive: true });
    writeFileSync(join(TMP, "a.ts"), "const a = 1;");
    writeFileSync(join(TMP, "sub", "b.ts"), "const b = 2;");
    const files = walkDirectory(TMP);
    const paths = files.map(f => f.path).sort();
    expect(paths).toEqual(["a.ts", "sub/b.ts"]);
  });

  it("excludes .git directory", () => {
    mkdirSync(join(TMP, ".git", "objects"), { recursive: true });
    writeFileSync(join(TMP, ".git", "config"), "gitconfig");
    writeFileSync(join(TMP, "app.ts"), "code");
    const files = walkDirectory(TMP);
    expect(files.map(f => f.path)).toEqual(["app.ts"]);
  });

  it("excludes node_modules", () => {
    mkdirSync(join(TMP, "node_modules", "pkg"), { recursive: true });
    writeFileSync(join(TMP, "node_modules", "pkg", "index.js"), "code");
    writeFileSync(join(TMP, "app.ts"), "code");
    const files = walkDirectory(TMP);
    expect(files.map(f => f.path)).toEqual(["app.ts"]);
  });

  it("respects .gitignore", () => {
    writeFileSync(join(TMP, ".gitignore"), "dist\n*.log\n");
    mkdirSync(join(TMP, "dist"), { recursive: true });
    writeFileSync(join(TMP, "dist", "bundle.js"), "bundled");
    writeFileSync(join(TMP, "app.log"), "log");
    writeFileSync(join(TMP, "app.ts"), "code");
    const files = walkDirectory(TMP);
    const paths = files.map(f => f.path).filter(p => p !== ".gitignore");
    expect(paths).toEqual(["app.ts"]);
  });

  it("skips binary files", () => {
    writeFileSync(join(TMP, "app.ts"), "code");
    writeFileSync(join(TMP, "image.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const files = walkDirectory(TMP);
    expect(files.map(f => f.path)).toEqual(["app.ts"]);
  });

  it("categorizes files", () => {
    writeFileSync(join(TMP, "app.ts"), "code");
    writeFileSync(join(TMP, "app.test.ts"), "test");
    writeFileSync(join(TMP, "README.md"), "docs");
    writeFileSync(join(TMP, ".env"), "KEY=val");
    const files = walkDirectory(TMP);
    const cats = Object.fromEntries(files.map(f => [f.path, f.category]));
    expect(cats["app.ts"]).toBe("source");
    expect(cats["app.test.ts"]).toBe("test");
    expect(cats["README.md"]).toBe("doc");
    expect(cats[".env"]).toBe("config");
  });

  it("handles empty directory", () => {
    expect(walkDirectory(TMP)).toEqual([]);
  });

  it("excludes extra dirs", () => {
    mkdirSync(join(TMP, ".obsidian"), { recursive: true });
    writeFileSync(join(TMP, ".obsidian", "config.json"), "{}");
    writeFileSync(join(TMP, "note.md"), "# Note");
    const files = walkDirectory(TMP);
    expect(files.map(f => f.path)).toEqual(["note.md"]);
  });

  it("respects .gitignore negation pattern (! prefix)", () => {
    writeFileSync(join(TMP, ".gitignore"), "*.log\n!important.log\n");
    writeFileSync(join(TMP, "debug.log"), "debug info");
    writeFileSync(join(TMP, "important.log"), "important info");
    writeFileSync(join(TMP, "app.ts"), "code");
    const files = walkDirectory(TMP);
    const paths = files.map(f => f.path).filter(p => p !== ".gitignore").sort();
    expect(paths).toContain("important.log");
    expect(paths).toContain("app.ts");
    expect(paths).not.toContain("debug.log");
  });

  it("respects .gitignore negation for directory paths", () => {
    writeFileSync(join(TMP, ".gitignore"), "dist\n!dist/keep.js\n");
    mkdirSync(join(TMP, "dist"), { recursive: true });
    writeFileSync(join(TMP, "dist", "bundle.js"), "bundled");
    writeFileSync(join(TMP, "dist", "keep.js"), "kept");
    writeFileSync(join(TMP, "app.ts"), "code");
    const files = walkDirectory(TMP);
    const paths = files.map(f => f.path).filter(p => p !== ".gitignore").sort();
    expect(paths).toContain("dist/keep.js");
    expect(paths).toContain("app.ts");
    expect(paths).not.toContain("dist/bundle.js");
  });

  it("handles Korean filenames with NFC normalization", () => {
    writeFileSync(join(TMP, "컴포넌트.tsx"), "export default {}");
    const files = walkDirectory(TMP);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("컴포넌트.tsx");
    expect(files[0].language).toBe("typescript");
  });
});

describe("computeDirectoryHash", () => {
  it("produces consistent hash for same content", () => {
    writeFileSync(join(TMP, "a.ts"), "const a = 1;");
    writeFileSync(join(TMP, "b.ts"), "const b = 2;");
    const files = walkDirectory(TMP);
    const h1 = computeDirectoryHash(TMP, files);
    const h2 = computeDirectoryHash(TMP, files);
    expect(h1).toBe(h2);
  });

  it("changes when file content changes", () => {
    writeFileSync(join(TMP, "a.ts"), "const a = 1;");
    const files1 = walkDirectory(TMP);
    const h1 = computeDirectoryHash(TMP, files1);

    writeFileSync(join(TMP, "a.ts"), "const a = 2;");
    const h2 = computeDirectoryHash(TMP, files1); // same file list
    expect(h1).not.toBe(h2);
  });

  it("changes when file is added", () => {
    writeFileSync(join(TMP, "a.ts"), "code");
    const files1 = walkDirectory(TMP);
    const h1 = computeDirectoryHash(TMP, files1);

    writeFileSync(join(TMP, "b.ts"), "code2");
    const files2 = walkDirectory(TMP);
    const h2 = computeDirectoryHash(TMP, files2);
    expect(h1).not.toBe(h2);
  });
});

describe("normalizePath", () => {
  it("resolves relative paths", () => {
    const p = normalizePath("./src/../src/app.ts");
    expect(p).not.toContain("..");
  });
});

describe("isBinaryFile", () => {
  it("detects by extension", () => {
    writeFileSync(join(TMP, "test.png"), "fakepng");
    expect(isBinaryFile(join(TMP, "test.png"))).toBe(true);
  });

  it("detects by null byte", () => {
    writeFileSync(join(TMP, "test.dat"), Buffer.from([0x48, 0x65, 0x00, 0x6c]));
    expect(isBinaryFile(join(TMP, "test.dat"))).toBe(true);
  });

  it("text files are not binary", () => {
    writeFileSync(join(TMP, "test.ts"), "const x = 1;");
    expect(isBinaryFile(join(TMP, "test.ts"))).toBe(false);
  });
});
