import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import { z } from "zod";
import { getLogger } from "../logger.js";
import type { SourceEntry } from "../scanners/types.js";
import { sourceKey } from "../scanners/types.js";

// ─── Zod Schemas ───

/**
 * usage_hint: when this source should be loaded into agent context.
 * - grounding_only: read once during grounding (default if omitted)
 * - context: re-inject into agent context at surface generation and compile
 * - full: always available (grounding + surface + compile + apply)
 */
const usageHintSchema = z.enum(["grounding_only", "context", "full"]).optional();

const sourceEntrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add-dir"), path: z.string(), description: z.string().optional(), usage_hint: usageHintSchema }),
  z.object({ type: z.literal("github-tarball"), url: z.string(), description: z.string().optional(), usage_hint: usageHintSchema }),
  z.object({ type: z.literal("figma-mcp"), file_key: z.string(), description: z.string().optional(), usage_hint: usageHintSchema }),
  z.object({ type: z.literal("obsidian-vault"), path: z.string(), description: z.string().optional(), usage_hint: usageHintSchema }),
]);

export const projectConfigSchema = z.object({
  default_sources: z.array(sourceEntrySchema),
  target_stack: z.record(z.string(), z.string()).optional(),
  apply_enabled: z.boolean().optional(),
});

// ─── Project Config ───

export interface ProjectConfig {
  default_sources: SourceEntry[];
  target_stack?: Record<string, string>;
  apply_enabled?: boolean;
}

const CONFIG_FILENAME = ".sprint-kit.yaml";

// ─── Load .sprint-kit.yaml ───

export function loadProjectConfig(projectRoot: string): ProjectConfig {
  const configPath = join(projectRoot, CONFIG_FILENAME);
  if (!existsSync(configPath)) {
    return { default_sources: [] };
  }
  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = parse(raw);
    if (!parsed || !Array.isArray(parsed.default_sources)) {
      return { default_sources: [] };
    }

    const result = projectConfigSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.map(
        (i) => `  - ${i.path.join(".")}: ${i.message}`,
      ).join("\n");
      getLogger().warn(
        `.sprint-kit.yaml 검증 실패. 기본값(빈 소스)으로 대체합니다.\n${issues}`,
      );
      return { default_sources: [] };
    }

    return {
      default_sources: result.data.default_sources as SourceEntry[],
      target_stack: result.data.target_stack,
      apply_enabled: result.data.apply_enabled,
    };
  } catch (error) {
    getLogger().debug("loadProjectConfig: failed to load config", { path: configPath, error });
    return { default_sources: [] };
  }
}

// ─── Resolve Sources (merge defaults + additional, dedup) ───

export function resolveSources(
  defaults: SourceEntry[],
  additional: SourceEntry[],
): SourceEntry[] {
  const seen = new Map<string, SourceEntry>();
  for (const entry of defaults) {
    seen.set(sourceKey(entry), entry);
  }
  for (const entry of additional) {
    seen.set(sourceKey(entry), entry);
  }
  return Array.from(seen.values());
}

// ─── Write / Read sources.yaml ───

export function writeSourcesYaml(filePath: string, sources: SourceEntry[]): void {
  const content = stringify({ sources });
  writeFileSync(filePath, content, "utf-8");
}

export function readSourcesYaml(filePath: string): SourceEntry[] {
  if (!existsSync(filePath)) {
    return [];
  }
  const raw = readFileSync(filePath, "utf-8");
  const parsed = parse(raw);
  if (!parsed || !Array.isArray(parsed.sources)) {
    return [];
  }
  return parsed.sources;
}

// ─── Parse /start input for inline source flags ───

export interface ParsedStartInput {
  description: string;
  sources: SourceEntry[];
}

export function parseStartInput(text: string): ParsedStartInput {
  const sources: SourceEntry[] = [];
  let description = text;

  // --add-dir <path> (supports quoted paths)
  description = description.replace(
    /--add-dir\s+(?:"([^"]+)"|(\S+))/g,
    (_, q, u) => { sources.push({ type: "add-dir", path: q ?? u }); return ""; },
  );

  // --github <url> (supports quoted urls)
  description = description.replace(
    /--github\s+(?:"([^"]+)"|(\S+))/g,
    (_, q, u) => { sources.push({ type: "github-tarball", url: q ?? u }); return ""; },
  );

  // --figma <file_key> (supports quoted keys)
  description = description.replace(
    /--figma\s+(?:"([^"]+)"|(\S+))/g,
    (_, q, u) => { sources.push({ type: "figma-mcp", file_key: q ?? u }); return ""; },
  );

  // --obsidian <path> (supports quoted paths)
  description = description.replace(
    /--obsidian\s+(?:"([^"]+)"|(\S+))/g,
    (_, q, u) => { sources.push({ type: "obsidian-vault", path: q ?? u }); return ""; },
  );

  return {
    description: description.replace(/\s+/g, " ").trim(),
    sources,
  };
}
