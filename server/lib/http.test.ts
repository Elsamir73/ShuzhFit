import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiRequest, ApiResponse } from "./http.js";

let role: "user" | "admin" = "user";
vi.mock("../routes/auth/_helpers.js", () => ({ verifyAuthToken: async () => ({ id: "1", name: "Member", email: "member@example.com", role, onboarded: true }) }));
const { requireAdmin } = await import("./http.js");

function responseRecorder() {
  const response = { code: 200, body: undefined as unknown, status(code: number) { this.code = code; return this; }, json(body: unknown) { this.body = body; return this; }, setHeader() { return this; }, end() {} };
  return response as typeof response & ApiResponse;
}

describe("requireAdmin", () => {
  beforeEach(() => { role = "user"; });
  it("rejects a normal logged-in member with 403", async () => {
    const res = responseRecorder();
    const user = await requireAdmin({ headers: { cookie: "shuzhfit_session=valid" } } as ApiRequest, res);
    expect(user).toBeNull(); expect(res.code).toBe(403);
  });
  it("rejects a logged-out request with 401", async () => {
    const res = responseRecorder();
    const user = await requireAdmin({ headers: {} } as ApiRequest, res);
    expect(user).toBeNull(); expect(res.code).toBe(401);
  });
  it("allows an authenticated admin", async () => {
    role = "admin";
    const user = await requireAdmin({ headers: { cookie: "shuzhfit_session=valid" } } as ApiRequest, responseRecorder());
    expect(user?.role).toBe("admin");
  });
});
