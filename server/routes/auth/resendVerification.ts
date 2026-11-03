import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { and, lt, sql } from "drizzle-orm";
import { createVerificationToken } from "../../lib/emailVerification.js";
import { sendMail } from "../../lib/mailer.js";
import { verifyEmail } from "../../lib/emailTemplates.js";
import {
  header,
  parseBody,
  requireJson,
  requireOrigin,
  sendError,
  type ApiRequest,
  type ApiResponse,
} from "../../lib/http.js";
import { normalizeEmail } from "./_helpers.js";

const resendSchema = z.object({ email: z.string().trim().email().max(255) });
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_IP_MARKER = "verification-resend";
const genericResponse = {
  ok: true,
  message: "If the account is eligible, a verification email will be sent.",
};

function clientIp(req: ApiRequest): string {
  const forwarded = header(req, "x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || req.socket?.remoteAddress || "unknown").slice(0, 64);
}

function rateLimitKey(scope: "email" | "ip", value: string): string {
  const hash = createHash("sha256").update(value).digest("hex");
  return `resend-${scope}:${hash}`;
}

async function consumeRateLimit(
  db: typeof import("../../../db/index.js").db,
  loginAttempts: typeof import("../../../db/schema.js").loginAttempts,
  key: string,
  now: Date,
): Promise<boolean> {
  const cutoff = new Date(now.getTime() - RATE_WINDOW_MS);
  const [attempt] = await db.insert(loginAttempts).values({
    email: key,
    ipAddress: RATE_LIMIT_IP_MARKER,
    failedAttempts: 1,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: [loginAttempts.email, loginAttempts.ipAddress],
    set: {
      failedAttempts: sql`CASE WHEN ${loginAttempts.updatedAt} <= ${cutoff} THEN 1 ELSE ${loginAttempts.failedAttempts} + 1 END`,
      updatedAt: now,
    },
  }).returning({ count: loginAttempts.failedAttempts });
  return (attempt?.count ?? RATE_LIMIT + 1) > RATE_LIMIT;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (!requireOrigin(req, res) || !requireJson(req, res)) return;
  const input = parseBody(resendSchema, req.body);
  if (!input) {
    res.status(200).json(genericResponse);
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    const email = normalizeEmail(input.email);
    const ipAddress = clientIp(req);
    const now = new Date();
    const cutoff = new Date(now.getTime() - RATE_WINDOW_MS);
    await db.delete(schema.loginAttempts).where(and(
      eq(schema.loginAttempts.ipAddress, RATE_LIMIT_IP_MARKER),
      lt(schema.loginAttempts.updatedAt, cutoff),
    ));
    const emailLimited = await consumeRateLimit(db, schema.loginAttempts, rateLimitKey("email", email), now);
    const ipLimited = await consumeRateLimit(db, schema.loginAttempts, rateLimitKey("ip", ipAddress), now);
    if (emailLimited || ipLimited) {
      res.status(200).json(genericResponse);
      return;
    }

    const [user] = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      emailVerifiedAt: schema.users.emailVerifiedAt,
    }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (!user || user.emailVerifiedAt) {
      res.status(200).json(genericResponse);
      return;
    }

    const { token, tokenHash } = createVerificationToken();
    await db.delete(schema.emailVerificationTokens).where(eq(schema.emailVerificationTokens.userId, user.id));
    await db.insert(schema.emailVerificationTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const appUrl = process.env.APP_URL?.trim().replace(/\/+$/u, "");
    if (!appUrl) {
      console.error("Verification email not sent: APP_URL is not configured.");
    } else {
      const emailContent = verifyEmail(user.name, `${appUrl}/verify-email?token=${encodeURIComponent(token)}`);
      await sendMail({ to: user.email, ...emailContent });
    }
    res.status(200).json(genericResponse);
  } catch (error) {
    console.error("RESEND_VERIFICATION_FAILED", error);
    res.status(200).json(genericResponse);
  }
}
