import { z } from "zod";
import { createAuthToken, hashPassword, normalizeEmail, setSessionCookie } from "./_helpers.js";
import { requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";

const registerSchema = z.object({
  name: z.string({ error: "Enter your name." }).trim().min(2, "Name must be at least 2 characters.").max(120, "Name must be 120 characters or fewer."),
  email: z.string({ error: "Enter your email address." }).trim().email("Enter a valid email address.").max(255, "Email must be 255 characters or fewer."),
  password: z.string({ error: "Enter a password." }).min(8, "Use at least 8 characters for your password.").max(128, "Use no more than 128 characters for your password."),
});

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (!requireOrigin(req, res) || !requireJson(req, res)) return;
  const input = registerSchema.safeParse(req.body);
  if (!input.success) {
    sendError(res, 400, "INVALID_INPUT", input.error.issues[0]?.message ?? "Check your registration details.");
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    const email = normalizeEmail(input.data.email);
    const passwordHash = await hashPassword(input.data.password);
    const [created] = await db.insert(schema.users).values({
      name: input.data.name,
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
  } catch (error) {
    console.error("Registration failed:", error instanceof Error ? error.message : String(error));
    sendError(res, 500, "REGISTRATION_FAILED", "Unable to create your account right now.");
  }
}
