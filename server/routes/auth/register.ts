import { z } from "zod";
import { validatePassword } from "../../../shared/password.js";
import { createVerificationToken } from "../../lib/emailVerification.js";
import { sendMail } from "../../lib/mailer.js";
import { verifyEmail } from "../../lib/emailTemplates.js";
import { hashPassword, normalizeEmail } from "./_helpers.js";
import { requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";

const registerSchema = z.object({
  name: z.string({ error: "Enter your name." }).trim().min(2, "Name must be at least 2 characters.").max(120, "Name must be 120 characters or fewer."),
  email: z.string({ error: "Enter your email address." }).trim().email("Enter a valid email address.").max(255, "Email must be 255 characters or fewer."),
  password: z.string({ error: "Enter a password." }),
}).superRefine((input, context) => {
  const validationError = validatePassword(input.password, { email: input.email, name: input.name });
  if (validationError) context.addIssue({ code: "custom", path: ["password"], message: validationError });
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
    });

    if (!created) {
      sendError(res, 409, "EMAIL_EXISTS", "An account already exists with that email.");
      return;
    }
    const { token, tokenHash } = createVerificationToken();
    await db.insert(schema.emailVerificationTokens).values({
      userId: created.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const appUrl = process.env.APP_URL?.trim().replace(/\/+$/u, "");
    let emailSent = false;
    if (!appUrl) {
      console.error("Verification email not sent: APP_URL is not configured.");
    } else {
      const emailContent = verifyEmail(created.name, `${appUrl}/verify-email?token=${encodeURIComponent(token)}`);
      emailSent = await sendMail({ to: created.email, ...emailContent });
    }

    res.status(201).json({
      ok: true,
      needsVerification: true,
      emailSent,
      message: emailSent
        ? "Check your email to verify your account."
        : "Account created, but we could not send the email. Use Resend to try again.",
    });
  } catch (error) {
    console.error("REGISTER_FAILED", error);
    sendError(res, 500, "REGISTRATION_FAILED", "Unable to create your account right now.");
  }
}
