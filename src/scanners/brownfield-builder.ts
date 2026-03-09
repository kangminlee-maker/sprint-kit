import type {
  BrownfieldContext,
  BrownfieldDetail,
  BrownfieldDetailSection,
  BrownfieldFileEntry,
  BrownfieldDepEntry,
  BrownfieldApiEntry,
  BrownfieldSchemaEntry,
  BrownfieldConfigEntry,
} from "../kernel/types.js";
import type { ScanResult } from "./types.js";
import { sourceKey } from "./types.js";

/**
 * Build BrownfieldContext + BrownfieldDetail from scan results.
 *
 * Pure function: no I/O, no side effects.
 *
 * BrownfieldContext contains Tier 1+2 items (for Build Spec Section 7).
 * BrownfieldDetail contains Tier 3 (full scan results with anchors).
 * detail_anchor links Tier 1+2 items to their Tier 3 detail sections.
 */
export function buildBrownfield(
  scopeId: string,
  scanResults: ScanResult[],
): { context: BrownfieldContext; detail: BrownfieldDetail } {
  const related_files: BrownfieldFileEntry[] = [];
  const module_dependencies: BrownfieldDepEntry[] = [];
  const api_contracts: BrownfieldApiEntry[] = [];
  const db_schemas: BrownfieldSchemaEntry[] = [];
  const config_env: BrownfieldConfigEntry[] = [];
  const sections: BrownfieldDetailSection[] = [];

  for (const result of scanResults) {
    const srcKey = sourceKey(result.source);
    const srcLabel = result.source.description ?? srcKey;

    // ── Files → related_files ──
    for (const file of result.files) {
      if (file.category === "source" || file.category === "config" || file.category === "schema" || file.category === "test") {
        const anchor = makeAnchor(srcKey, file.path);
        related_files.push({
          path: file.path,
          role: file.category === "test"
            ? `test (${srcLabel})`
            : `${file.language ?? file.category} (${srcLabel})`,
          detail_anchor: anchor,
        });
        sections.push({
          anchor,
          source: srcLabel,
          title: file.path,
          content: `- 카테고리: ${file.category}\n- 언어: ${file.language ?? "N/A"}\n- 크기: ${file.size_bytes} bytes`,
        });
      }
    }

    // ── Dependency graph → module_dependencies ──
    const seenDeps = new Set<string>();
    for (const edge of result.dependency_graph) {
      const depKey = `${edge.from}→${edge.to}`;
      if (seenDeps.has(depKey)) continue;
      seenDeps.add(depKey);

      const anchor = makeAnchor(srcKey, `dep-${edge.from}-${edge.to}`);
      module_dependencies.push({
        module: edge.from,
        depends_on: edge.to,
        detail_anchor: anchor,
      });
      sections.push({
        anchor,
        source: srcLabel,
        title: `${edge.from} → ${edge.to}`,
        content: `- 종류: ${edge.kind}\n- 출처 파일: ${edge.from}`,
      });
    }

    // ── API patterns → api_contracts ──
    for (const api of result.api_patterns) {
      const anchor = makeAnchor(srcKey, `api-${api.method}-${api.path}-${api.file}-L${api.line}`);
      api_contracts.push({
        endpoint: api.path,
        method: api.method,
        description: `${api.file}:${api.line}`,
        detail_anchor: anchor,
      });
      sections.push({
        anchor,
        source: srcLabel,
        title: `${api.method} ${api.path}`,
        content: `- 파일: ${api.file}\n- 라인: ${api.line}`,
      });
    }

    // ── Schema patterns → db_schemas ──
    for (const schema of result.schema_patterns) {
      const anchor = makeAnchor(srcKey, `schema-${schema.table}-${schema.file}-L${schema.line}`);
      db_schemas.push({
        table: schema.table,
        columns: schema.columns,
        detail_anchor: anchor,
      });
      sections.push({
        anchor,
        source: srcLabel,
        title: schema.table,
        content: `- 파일: ${schema.file}\n- 라인: ${schema.line}\n- 컬럼: ${schema.columns}`,
      });
    }

    // ── Config patterns → config_env ──
    for (const cfg of result.config_patterns) {
      const anchor = makeAnchor(srcKey, `config-${cfg.key}-${cfg.file}-L${cfg.line}`);
      config_env.push({
        key: cfg.key,
        description: `${cfg.source_type} (${cfg.file}:${cfg.line})`,
        detail_anchor: anchor,
      });
      sections.push({
        anchor,
        source: srcLabel,
        title: cfg.key,
        content: `- 타입: ${cfg.source_type}\n- 파일: ${cfg.file}\n- 라인: ${cfg.line}`,
      });
    }

    // ── Doc structures → detail sections only (no BrownfieldContext field) ──
    for (const doc of result.doc_structure) {
      const anchor = makeAnchor(srcKey, `doc-${doc.file}`);
      const parts: string[] = [`- 형식: ${doc.format}`];
      if (doc.headings) parts.push(`- 제목: ${doc.headings.join(", ")}`);
      if (doc.top_level_keys) parts.push(`- 키: ${doc.top_level_keys.join(", ")}`);
      if (doc.item_counts) {
        const counts = Object.entries(doc.item_counts).map(([k, v]) => `${k}: ${v}`).join(", ");
        parts.push(`- 항목 수: ${counts}`);
      }
      sections.push({
        anchor,
        source: srcLabel,
        title: doc.file,
        content: parts.join("\n"),
      });
    }
  }

  return {
    context: {
      related_files,
      module_dependencies,
      api_contracts: api_contracts.length > 0 ? api_contracts : undefined,
      db_schemas: db_schemas.length > 0 ? db_schemas : undefined,
      config_env: config_env.length > 0 ? config_env : undefined,
    },
    detail: {
      scope_id: scopeId,
      sections,
    },
  };
}

// ─── Anchor generation ───

function makeAnchor(srcKey: string, suffix: string): string {
  return sanitizeAnchor(`${srcKey}-${suffix}`);
}

function sanitizeAnchor(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9가-힣_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
