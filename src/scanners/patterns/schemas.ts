import type { SchemaPattern } from "../types.js";
import { lineNumber } from "./utils.js";

// ─── JPA (@Table / @Entity) ───

function detectJpa(content: string, filePath: string): SchemaPattern[] {
  const results: SchemaPattern[] = [];

  // @Table(name = "users")
  const tableRe = /@Table\s*\(\s*name\s*=\s*"([^"]+)"\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = tableRe.exec(content)) !== null) {
    results.push({
      file: filePath,
      table: m[1],
      columns: "",
      line: lineNumber(content, m.index),
    });
  }

  // @Entity + class ClassName  (when @Table is not present)
  const entityRe = /@Entity[\s\S]*?class\s+(\w+)/g;
  while ((m = entityRe.exec(content)) !== null) {
    const className = m[1];
    // Only add if not already captured via @Table
    if (!results.some((r) => r.table.toLowerCase() === className.toLowerCase())) {
      results.push({
        file: filePath,
        table: className,
        columns: "",
        line: lineNumber(content, m.index),
      });
    }
  }

  return results;
}

// ─── SQL CREATE TABLE ───

function detectSql(content: string, filePath: string): SchemaPattern[] {
  const results: SchemaPattern[] = [];
  // CREATE TABLE schema.name or CREATE TABLE name (with optional IF NOT EXISTS)
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[\w.]*\.)?(\w+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    results.push({
      file: filePath,
      table: m[1],
      columns: "",
      line: lineNumber(content, m.index),
    });
  }
  return results;
}

// ─── Drizzle ORM ───

function detectDrizzle(content: string, filePath: string): SchemaPattern[] {
  const results: SchemaPattern[] = [];
  // pgTable("users", ...) or sqliteTable("users", ...) or mysqlTable("users", ...)
  const re = /(?:pgTable|sqliteTable|mysqlTable)\s*\(\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    results.push({
      file: filePath,
      table: m[1],
      columns: "",
      line: lineNumber(content, m.index),
    });
  }
  return results;
}

// ─── Main entry ───

export function detectSchemas(content: string, filePath: string): SchemaPattern[] {
  try {
    if (!content || content.length === 0) return [];

    const results: SchemaPattern[] = [];
    results.push(...detectJpa(content, filePath));
    results.push(...detectSql(content, filePath));
    results.push(...detectDrizzle(content, filePath));

    return results;
  } catch {
    return [];
  }
}
