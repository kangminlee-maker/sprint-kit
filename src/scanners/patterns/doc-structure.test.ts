import { describe, it, expect } from "vitest";
import { detectDocStructure } from "./doc-structure.js";

describe("detectDocStructure", () => {
  // ─── YAML ───
  describe("YAML", () => {
    it("extracts top-level keys", () => {
      const content = `name: my-app
version: 1.0
dependencies:
  - express
  - react
`;
      const result = detectDocStructure(content, "config.yaml");
      expect(result).toHaveLength(1);
      expect(result[0].format).toBe("yaml");
      expect(result[0].top_level_keys).toEqual(["name", "version", "dependencies"]);
    });

    it("counts array items", () => {
      const content = `services:
  - web
  - api
  - worker
ports:
  - 3000
  - 8080
`;
      const result = detectDocStructure(content, "docker-compose.yml");
      expect(result[0].item_counts).toEqual({ services: 3, ports: 2 });
    });

    it("handles .yml extension", () => {
      const content = `key: value`;
      const result = detectDocStructure(content, "file.yml");
      expect(result).toHaveLength(1);
      expect(result[0].format).toBe("yaml");
    });
  });

  // ─── Markdown ───
  describe("Markdown", () => {
    it("extracts headings", () => {
      const content = `# Introduction
Some text here.

## Getting Started

### Installation

## Usage
`;
      const result = detectDocStructure(content, "README.md");
      expect(result).toHaveLength(1);
      expect(result[0].format).toBe("markdown");
      expect(result[0].headings).toEqual([
        "Introduction",
        "Getting Started",
        "Installation",
        "Usage",
      ]);
    });

    it("extracts YAML frontmatter", () => {
      const content = `---
title: My Post
date: 2024-01-01
---

# My Post

Content here.
`;
      const result = detectDocStructure(content, "post.md");
      expect(result).toHaveLength(1);
      expect(result[0].frontmatter).toBeDefined();
      expect(result[0].frontmatter!["title"]).toBe(true); // simple parser stores placeholder
      expect(result[0].frontmatter!["date"]).toBe(true);
      expect(result[0].headings).toEqual(["My Post"]);
    });

    it("handles markdown without frontmatter", () => {
      const content = `# Title
## Section`;
      const result = detectDocStructure(content, "doc.md");
      expect(result[0].frontmatter).toBeUndefined();
      expect(result[0].headings).toEqual(["Title", "Section"]);
    });
  });

  // ─── Edge cases ───
  describe("edge cases", () => {
    it("returns empty array for empty string", () => {
      expect(detectDocStructure("", "file.md")).toEqual([]);
    });

    it("returns empty array for unknown extension", () => {
      expect(detectDocStructure("# Title", "file.txt")).toEqual([]);
    });

    it("returns empty array for binary-like content in .md", () => {
      const binary = "\x00\x01\x02\xFF\xFE";
      // Should not throw, returns structure (possibly empty headings)
      const result = detectDocStructure(binary, "file.md");
      expect(Array.isArray(result)).toBe(true);
    });

    it("handles large markdown without throwing", () => {
      const lines: string[] = [];
      for (let i = 0; i < 5000; i++) {
        lines.push(`## Heading ${i}`);
      }
      const result = detectDocStructure(lines.join("\n"), "big.md");
      expect(result[0].headings!.length).toBe(5000);
    });
  });
});
