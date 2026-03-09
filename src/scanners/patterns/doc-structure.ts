import type { DocStructure } from "../types.js";
import { extOf } from "./utils.js";

// ─── Simple YAML parser (no dependency beyond basic line parsing) ───
// Uses the project's `yaml` dependency for robust parsing.

function parseYamlSafe(content: string): Record<string, unknown> | null {
  try {
    // Dynamic import is tricky in sync context; use a simple line-based parser
    // for top-level keys to avoid issues.
    const result: Record<string, unknown> = {};
    const lines = content.split("\n");
    for (const line of lines) {
      // Top-level key: no leading whitespace, ends with ":"
      const m = line.match(/^([A-Za-z_][\w-]*)\s*:/);
      if (m) {
        result[m[1]] = true; // placeholder
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

// ─── YAML detector ───

function detectYaml(content: string, filePath: string): DocStructure[] {
  const parsed = parseYamlSafe(content);
  if (!parsed) return [];

  const topLevelKeys = Object.keys(parsed);

  // Count array items: lines that start with "- " at one indent level under a key
  const itemCounts: Record<string, number> = {};
  const lines = content.split("\n");
  let currentKey: string | null = null;

  for (const line of lines) {
    const keyMatch = line.match(/^([A-Za-z_][\w-]*)\s*:/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      continue;
    }
    if (currentKey && /^\s+-\s/.test(line)) {
      itemCounts[currentKey] = (itemCounts[currentKey] ?? 0) + 1;
    } else if (line.trim() !== "" && !line.startsWith(" ") && !line.startsWith("\t")) {
      currentKey = null;
    }
  }

  return [
    {
      file: filePath,
      format: "yaml",
      top_level_keys: topLevelKeys,
      item_counts: Object.keys(itemCounts).length > 0 ? itemCounts : undefined,
    },
  ];
}

// ─── Markdown detector ───

function detectMarkdown(content: string, filePath: string): DocStructure[] {
  const lines = content.split("\n");
  const headings: string[] = [];
  let frontmatter: Record<string, unknown> | undefined;

  // YAML frontmatter: starts with --- on first line, ends with ---
  let inFrontmatter = false;
  let frontmatterLines: string[] = [];
  let frontmatterDone = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (i === 0 && line.trim() === "---") {
      inFrontmatter = true;
      continue;
    }

    if (inFrontmatter && !frontmatterDone) {
      if (line.trim() === "---") {
        inFrontmatter = false;
        frontmatterDone = true;
        const parsed = parseYamlSafe(frontmatterLines.join("\n"));
        if (parsed) {
          frontmatter = parsed;
        }
        continue;
      }
      frontmatterLines.push(line);
      continue;
    }

    // Headings: lines starting with #
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      headings.push(headingMatch[2].trim());
    }
  }

  return [
    {
      file: filePath,
      format: "markdown",
      ...(frontmatter ? { frontmatter } : {}),
      headings: headings.length > 0 ? headings : undefined,
    },
  ];
}

// ─── Main entry ───

export function detectDocStructure(content: string, filePath: string): DocStructure[] {
  try {
    if (!content || content.length === 0) return [];

    const ext = extOf(filePath);

    switch (ext) {
      case ".yaml":
      case ".yml":
        return detectYaml(content, filePath);
      case ".md":
        return detectMarkdown(content, filePath);
      default:
        return [];
    }
  } catch {
    return [];
  }
}
