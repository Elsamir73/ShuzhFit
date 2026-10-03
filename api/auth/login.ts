import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { createAuthToken, normalizeEmail, setSessionCookie, verifyPassword } from "./_helpers";
import { header, parseBody, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../_lib/http";

const loginSchema = z.object({ email: z.string().trim().email().max(255), password: z.string().min(8).max(128) });
const INVALID_CREDENTIALS = "Invalid email or password";

function clientIp(req: ApiRequest): string {
  const forwarded = header(req, "x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (!requireOrigin(req, res) || !requireJson(req, res)) return;
  const input = parseBody(loginSchema, req.body);
  if (!input) {
    sendError(res, 400, "INVALID_INPUT", "Email and password are required.");
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([import("../../db"), import("../../db/schema")]);
    const email = normalizeEmail(input.email);
    const ipAddress = clientIp(req).slice(0, 64);
    const [attempt] = await db.select().from(schema.loginAttempts).where(and(
      eq(schema.loginAttempts.email, email), eq(schema.loginAttempts.ipAddress, ipAddress),
    )).limit(1);
    if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
      sendError(res, 429, "LOGIN_LOCKED", INVALID_CREDENTIALS);
      return;
    }

    const [userRow] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    const valid = userRow ? await verifyPassword(input.password, userRow.passwordHash) : false;
    if (!valid || !userRow) {
      if (attempt) {
        const expired = attempt.lockedUntil !== null && attempt.lockedUntil <= new Date();
        const failedAttempts = expired ? 1 : attempt.failedAttempts + 1;
        await db.update(schema.loginAttempts).set({
          failedAttempts,
          lockedUntil: failedAttempts >= 8 ? new Date(Date.now() + 5 * 60 * 1000) : null,
          updatedAt: new Date(),
        }).where(eq(schema.loginAttempts.id, attempt.id));
      } else {
        await db.insert(schema.loginAttempts).values({ email, ipAddress, failedAttempts: 1 });
      }
      sendError(res, 401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS);
      return;
    }

    await db.delete(schema.loginAttempts).where(and(
      eq(schema.loginAttempts.email, email), eq(schema.loginAttempts.ipAddress, ipAddress),
    ));
    const user = { id: String(userRow.id), name: userRow.name, email: userRow.email, role: userRow.role === "admin" ? "admin" as const : "user" as const, onboarded: Boolean(userRow.onboardedAt) };
    setSessionCookie(res, await createAuthToken(user));
    res.status(200).json({ user });
  } catch {
    sendError(res, 500, "LOGIN_FAILED", "Unable to log in right now.");
  }
}
