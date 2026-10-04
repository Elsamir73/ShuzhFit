import { describe, expect, it } from "vitest";
import type { ApiRequest, ApiResponse } from "./lib/http.js";
import { requireOrigin } from "./lib/http.js";
import { dispatchApiRequest, originalApiUrl, resolveRoute, routeTable } from "./router.js";

function createResponse() {
  const state: { statusCode: number; body: unknown } = {
    statusCode: 200,
    body: undefined,
  };
  const response: ApiResponse = {
    status(code) {
      state.statusCode = code;
      return response;
    },
    json(body) {
      state.body = body;
      return response;
    },
    setHeader() {
      return response;
    },
    end() {},
  };
  return { response, state };
}

function createRequest(method: string, url: string): ApiRequest {
  return { method, url, headers: {} };
}

describe("API router", () => {
  it.each([
    ["GET", "/api/health", "GET /health"],
    ["POST", "/api/auth/register", "POST /auth/register"],
    ["POST", "/api/auth/register/", "POST /auth/register"],
    ["GET", "/api/auth/me?x=1", "GET /auth/me"],
    ["GET", "/api/workouts/12", "GET /workouts/:id"],
  ])("routes %s %s to %s", (method, url, routeKey) => {
    const request = createRequest(method, url);
    const routeUrl = new URL(originalApiUrl(request), "http://localhost");
    expect(resolveRoute(method, routeUrl.pathname).handler).toBe(routeTable.get(routeKey));
  });

  it("uses Vercel's original-path headers when the rewritten URL is /api", () => {
    const request: ApiRequest = {
      method: "POST",
      url: "/api",
      headers: { "x-matched-path": "/api/auth/register/" },
    };
    expect(originalApiUrl(request)).toBe("/auth/register");
    expect(resolveRoute("POST", originalApiUrl(request)).handler).toBe(routeTable.get("POST /auth/register"));
  });

  it("returns a null user for a logged-out session check", async () => {
    const result = createResponse();
    await dispatchApiRequest(createRequest("GET", "/api/auth/me?x=1"), result.response);
    expect(result.state.statusCode).toBe(200);
    expect(result.state.body).toEqual({ user: null });
  });

  it("returns the required JSON for unknown paths and unsupported methods", async () => {
    const missing = createResponse();
    await dispatchApiRequest(
      createRequest("GET", "/api/not-a-route"),
      missing.response,
    );
    expect(missing.state.statusCode).toBe(404);
    expect(missing.state.body).toEqual({ error: "Not found" });

    const wrongMethod = createResponse();
    await dispatchApiRequest(
      createRequest("POST", "/api/auth/me"),
      wrongMethod.response,
    );
    expect(wrongMethod.state.statusCode).toBe(405);
    expect(wrongMethod.state.body).toEqual({ error: "Method not allowed" });
  });

  it("copies a dynamic path segment onto params and the legacy query field", async () => {
    const request = createRequest("GET", "/api/workouts/481");
    const result = createResponse();
    await dispatchApiRequest(request, result.response);
    expect(request.params).toEqual({ id: "481" });
    expect(request.query?.id).toBe("481");
  });
});

describe("mutating request origin validation", () => {
  it("matches the request host, including the local development host", () => {
    const result = createResponse();
    expect(requireOrigin({
      method: "POST",
      headers: { origin: "http://localhost:5173", host: "localhost:5173" },
    }, result.response)).toBe(true);
  });

  it("rejects a different origin host", () => {
    const result = createResponse();
    expect(requireOrigin({
      method: "POST",
      headers: { origin: "https://attacker.example", "x-forwarded-host": "shuzhfit.vercel.app", host: "internal.local" },
    }, result.response)).toBe(false);
    expect(result.state.statusCode).toBe(403);
  });

  it("uses the first forwarded host supplied by the proxy", () => {
    const result = createResponse();
    expect(requireOrigin({
      method: "POST",
      headers: { origin: "https://shuzhfit.vercel.app", "x-forwarded-host": "shuzhfit.vercel.app, internal.local", host: "internal.local" },
    }, result.response)).toBe(true);
  });
});
