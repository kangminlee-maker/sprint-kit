import { describe, it, expect } from "vitest";
import { detectApiRoutes } from "./api-routes.js";

describe("detectApiRoutes", () => {
  // ─── Spring Boot ───
  describe("Spring Boot", () => {
    it("detects @GetMapping", () => {
      const content = `@GetMapping("/users")
public List<User> getUsers() {}`;
      const result = detectApiRoutes(content, "UserController.java");
      expect(result).toEqual([
        { file: "UserController.java", method: "GET", path: "/users", line: 1 },
      ]);
    });

    it("detects @PostMapping", () => {
      const content = `@PostMapping("/users")
public User create() {}`;
      const result = detectApiRoutes(content, "UserController.java");
      expect(result).toEqual([
        { file: "UserController.java", method: "POST", path: "/users", line: 1 },
      ]);
    });

    it("detects @PutMapping, @DeleteMapping, @PatchMapping", () => {
      const content = `@PutMapping("/users/1")
public void update() {}

@DeleteMapping("/users/1")
public void delete() {}

@PatchMapping("/users/1")
public void patch() {}`;
      const result = detectApiRoutes(content, "Controller.java");
      expect(result).toHaveLength(3);
      expect(result[0].method).toBe("PUT");
      expect(result[1].method).toBe("DELETE");
      expect(result[2].method).toBe("PATCH");
    });

    it("detects @RequestMapping with value and method", () => {
      const content = `@RequestMapping(value = "/api/items", method = RequestMethod.GET)
public List<Item> list() {}`;
      const result = detectApiRoutes(content, "ItemController.java");
      expect(result).toEqual([
        { file: "ItemController.java", method: "GET", path: "/api/items", line: 1 },
      ]);
    });
  });

  // ─── Next.js App Router ───
  describe("Next.js App Router", () => {
    it("detects exported GET handler in route.ts", () => {
      const content = `export async function GET(request: Request) {
  return Response.json({ ok: true });
}`;
      const result = detectApiRoutes(content, "app/api/users/route.ts");
      expect(result).toEqual([
        { file: "app/api/users/route.ts", method: "GET", path: "/api/users", line: 1 },
      ]);
    });

    it("detects multiple handlers in route.ts", () => {
      const content = `export async function GET() {}
export async function POST() {}`;
      const result = detectApiRoutes(content, "app/api/items/route.ts");
      expect(result).toHaveLength(2);
      expect(result[0].method).toBe("GET");
      expect(result[1].method).toBe("POST");
    });

    it("ignores non-route files", () => {
      const content = `export async function GET() {}`;
      const result = detectApiRoutes(content, "app/api/users/page.tsx");
      // Should not detect because it's not a route file
      expect(result.filter((r) => r.method === "GET" && r.path.includes("api/users"))).toEqual([]);
    });

    it("detects sync function handler", () => {
      const content = `export function DELETE() {}`;
      const result = detectApiRoutes(content, "app/api/items/route.js");
      expect(result).toHaveLength(1);
      expect(result[0].method).toBe("DELETE");
    });
  });

  // ─── Hono ───
  describe("Hono", () => {
    it("detects app.get/post/put/delete/patch", () => {
      const content = `app.get("/users", (c) => c.json([]));
app.post("/users", (c) => c.json({}));
app.put("/users/:id", (c) => c.json({}));
app.delete("/users/:id", (c) => c.status(204));
app.patch("/users/:id", (c) => c.json({}));`;
      const result = detectApiRoutes(content, "src/routes.ts");
      expect(result).toHaveLength(5);
      expect(result.map((r) => r.method)).toEqual(["GET", "POST", "PUT", "DELETE", "PATCH"]);
    });

    it("detects routes with single quotes", () => {
      const content = `app.get('/health', (c) => c.text("ok"));`;
      const result = detectApiRoutes(content, "server.js");
      expect(result).toEqual([
        { file: "server.js", method: "GET", path: "/health", line: 1 },
      ]);
    });
  });

  // ─── Edge cases ───
  describe("edge cases", () => {
    it("returns empty array for empty string", () => {
      expect(detectApiRoutes("", "file.java")).toEqual([]);
    });

    it("returns empty array for binary-like content", () => {
      const binary = "\x00\x01\x02\xFF\xFE";
      expect(detectApiRoutes(binary, "file.java")).toEqual([]);
    });

    it("handles large input without throwing", () => {
      const line = `@GetMapping("/test")\n`;
      const large = line.repeat(5000);
      const result = detectApiRoutes(large, "Controller.java");
      expect(result.length).toBe(5000);
    });
  });
});
