import { describe, it, expect } from "vitest";
import { detectImports } from "./imports.js";

describe("detectImports", () => {
  // ─── Java ───
  describe("Java", () => {
    it("detects Java import statements", () => {
      const content = `
import com.example.User;
import com.example.service.UserService;
`;
      const result = detectImports(content, "src/User.java");
      expect(result).toEqual([
        { from: "src/User.java", to: "com.example.User", kind: "import" },
        { from: "src/User.java", to: "com.example.service.UserService", kind: "import" },
      ]);
    });
  });

  // ─── TypeScript / JavaScript ───
  describe("TypeScript/JavaScript", () => {
    it("detects ES import from", () => {
      const content = `import { foo } from "./foo.js";
import type { Bar } from "../bar.js";
`;
      const result = detectImports(content, "src/index.ts");
      expect(result).toEqual([
        { from: "src/index.ts", to: "./foo.js", kind: "import" },
        { from: "src/index.ts", to: "../bar.js", kind: "import" },
      ]);
    });

    it("detects require()", () => {
      const content = `const fs = require("fs");
const path = require('path');
`;
      const result = detectImports(content, "src/utils.cjs");
      expect(result).toEqual([
        { from: "src/utils.cjs", to: "fs", kind: "require" },
        { from: "src/utils.cjs", to: "path", kind: "require" },
      ]);
    });

    it("detects mixed imports", () => {
      const content = `import { a } from "moduleA";
const b = require("moduleB");
`;
      const result = detectImports(content, "app.js");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ from: "app.js", to: "moduleA", kind: "import" });
      expect(result[1]).toEqual({ from: "app.js", to: "moduleB", kind: "require" });
    });

    it("handles .tsx extension", () => {
      const result = detectImports(`import React from "react";`, "App.tsx");
      expect(result).toEqual([{ from: "App.tsx", to: "react", kind: "import" }]);
    });

    it("handles .jsx extension", () => {
      const result = detectImports(`import React from "react";`, "App.jsx");
      expect(result).toEqual([{ from: "App.jsx", to: "react", kind: "import" }]);
    });

    it("handles .mjs extension", () => {
      const result = detectImports(`import { join } from "path";`, "util.mjs");
      expect(result).toEqual([{ from: "util.mjs", to: "path", kind: "import" }]);
    });
  });

  // ─── Python ───
  describe("Python", () => {
    it("detects import statements", () => {
      const content = `import os
import sys
`;
      const result = detectImports(content, "main.py");
      expect(result).toEqual([
        { from: "main.py", to: "os", kind: "import" },
        { from: "main.py", to: "sys", kind: "import" },
      ]);
    });

    it("detects from...import statements", () => {
      const content = `from flask import Flask
from os.path import join
`;
      const result = detectImports(content, "app.py");
      expect(result).toEqual([
        { from: "app.py", to: "flask", kind: "import" },
        { from: "app.py", to: "os.path", kind: "import" },
      ]);
    });
  });

  // ─── Go ───
  describe("Go", () => {
    it("detects single import", () => {
      const content = `import "fmt"
`;
      const result = detectImports(content, "main.go");
      expect(result).toEqual([
        { from: "main.go", to: "fmt", kind: "import" },
      ]);
    });

    it("detects grouped imports", () => {
      const content = `import (
  "fmt"
  "net/http"
)
`;
      const result = detectImports(content, "server.go");
      expect(result).toEqual([
        { from: "server.go", to: "fmt", kind: "import" },
        { from: "server.go", to: "net/http", kind: "import" },
      ]);
    });
  });

  // ─── Kotlin ───
  describe("Kotlin", () => {
    it("detects Kotlin imports", () => {
      const content = `import com.example.User
import kotlinx.coroutines.launch
`;
      const result = detectImports(content, "App.kt");
      expect(result).toEqual([
        { from: "App.kt", to: "com.example.User", kind: "import" },
        { from: "App.kt", to: "kotlinx.coroutines.launch", kind: "import" },
      ]);
    });

    it("handles .kts extension", () => {
      const result = detectImports(`import java.io.File`, "build.gradle.kts");
      expect(result).toEqual([
        { from: "build.gradle.kts", to: "java.io.File", kind: "import" },
      ]);
    });
  });

  // ─── Edge cases ───
  describe("edge cases", () => {
    it("returns empty array for empty string", () => {
      expect(detectImports("", "file.ts")).toEqual([]);
    });

    it("returns empty array for unknown extension", () => {
      expect(detectImports("import foo;", "file.rs")).toEqual([]);
    });

    it("returns empty array for binary-like content", () => {
      const binary = "\x00\x01\x02\xFF\xFE\x89PNG\r\n\x1a\n";
      expect(detectImports(binary, "file.ts")).toEqual([]);
    });

    it("handles very large input without throwing", () => {
      const line = `import { x } from "./x.js";\n`;
      const large = line.repeat(10000);
      const result = detectImports(large, "big.ts");
      expect(result).toHaveLength(10000);
    });
  });
});
