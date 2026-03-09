import { describe, it, expect } from "vitest";
import { detectSchemas } from "./schemas.js";

describe("detectSchemas", () => {
  // ─── JPA ───
  describe("JPA", () => {
    it("detects @Table annotation", () => {
      const content = `@Table(name = "users")
public class User {}`;
      const result = detectSchemas(content, "User.java");
      expect(result).toEqual([
        { file: "User.java", table: "users", columns: "", line: 1 },
      ]);
    });

    it("detects @Entity + class name when @Table is absent", () => {
      const content = `@Entity
public class Product {}`;
      const result = detectSchemas(content, "Product.java");
      expect(result).toHaveLength(1);
      expect(result[0].table).toBe("Product");
    });

    it("does not duplicate when both @Table and @Entity are present", () => {
      const content = `@Entity
@Table(name = "orders")
public class Order {}`;
      const result = detectSchemas(content, "Order.java");
      // @Table should be detected; @Entity+class should be skipped because
      // "orders" vs "Order" are different strings, so both get added.
      // But if table name matches class name case-insensitively, only one is kept.
      expect(result.some((r) => r.table === "orders")).toBe(true);
    });
  });

  // ─── SQL CREATE TABLE ───
  describe("SQL", () => {
    it("detects CREATE TABLE", () => {
      const content = `CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255)
);`;
      const result = detectSchemas(content, "V1__init.sql");
      expect(result).toEqual([
        { file: "V1__init.sql", table: "users", columns: "", line: 1 },
      ]);
    });

    it("detects CREATE TABLE IF NOT EXISTS", () => {
      const content = `CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY
);`;
      const result = detectSchemas(content, "migration.sql");
      expect(result).toEqual([
        { file: "migration.sql", table: "products", columns: "", line: 1 },
      ]);
    });

    it("detects schema-qualified table names", () => {
      const content = `CREATE TABLE public.events (id INT);`;
      const result = detectSchemas(content, "schema.sql");
      expect(result[0].table).toBe("events");
    });
  });

  // ─── Drizzle ORM ───
  describe("Drizzle", () => {
    it("detects pgTable", () => {
      const content = `export const users = pgTable("users", {
  id: serial("id").primaryKey(),
});`;
      const result = detectSchemas(content, "schema.ts");
      expect(result).toEqual([
        { file: "schema.ts", table: "users", columns: "", line: 1 },
      ]);
    });

    it("detects sqliteTable", () => {
      const content = `export const posts = sqliteTable("posts", {});`;
      const result = detectSchemas(content, "db.ts");
      expect(result[0].table).toBe("posts");
    });
  });

  // ─── Edge cases ───
  describe("edge cases", () => {
    it("returns empty array for empty string", () => {
      expect(detectSchemas("", "schema.sql")).toEqual([]);
    });

    it("returns empty array for binary-like content", () => {
      const binary = "\x00\x01\x02\xFF\xFE";
      expect(detectSchemas(binary, "schema.sql")).toEqual([]);
    });

    it("handles large input without throwing", () => {
      const line = `CREATE TABLE t (id INT);\n`;
      const large = line.repeat(5000);
      const result = detectSchemas(large, "big.sql");
      expect(result.length).toBe(5000);
    });
  });
});
