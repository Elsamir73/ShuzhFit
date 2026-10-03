import { z } from "zod";
import { createAuthToken, hashPassword, normalizeEmail, setSessionCookie } from "./_helpers";
import { parseBody, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../_lib/http";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (!requireOrigin(req, res) || !requireJson(req, res)) return;
  const input = parseBody(registerSchema, req.body);
  if (!input) {
    sendError(res, 400, "INVALID_INPUT", "Name, email, and a password of at least 8 characters are required.");
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([import("../../db"), import("../../db/schema")]);
    const email = normalizeEmail(input.email);
    const passwordHash = await hashPassword(input.password);
    const [created] = await db.insert(schema.users).values({
      name: input.name,
      email,
      passwordHash,
      role: "user",
    }).onConflictDoNothing({ target: schema.users.email }).returning({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      onboardedAt: schema.users.onboardedAt,
    });

    if (!created) {
      sendError(res, 409, "EMAIL_EXISTS", "An account already exists with that email.");
      return;
    }
    const user = { id: String(created.id), name: created.name, email: created.email, role: created.role === "admin" ? "admin" as const : "user" as const, onboarded: Boolean(created.onboardedAt) };
    setSessionCookie(res, await createAuthToken(user));
    res.status(201).json({ user });
  } catch {
    sendError(res, 500, "REGISTRATION_FAILED", "Unable to create your account right now.");
  }
}
