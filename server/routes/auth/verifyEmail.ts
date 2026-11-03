import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { hashVerificationToken } from "../../lib/emailVerification.js";
import {
  header,
  parseBody,
  requireJson,
  requireOrigin,
  sendError,
  type ApiRequest,
  type ApiResponse,
} from "../../lib/http.js";

const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/iu) });

function requestToken(req: ApiRequest): string | undefined {
  const queryToken = req.query?.token;
  if (typeof queryToken === "string") return queryToken;
  if (req.url) {
    try {
      return new URL(req.url, `http://${header(req, "host") ?? "localhost"}`).searchParams.get("token") ?? undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (req.method === "POST" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  const input = req.method === "GET"
    ? tokenSchema.safeParse({ token: requestToken(req) })
    : z.object({ token: z.string().regex(/^[a-f0-9]{64}$/iu) }).safeParse(
      parseBody(tokenSchema, req.body),
    );
  if (!input.success) {
    sendError(res, 400, "INVALID_VERIFICATION_TOKEN", "This verification link is invalid or has expired.");
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    const [claimedToken] = await db.delete(schema.emailVerificationTokens).where(and(
      eq(schema.emailVerificationTokens.tokenHash, hashVerificationToken(input.data.token)),
      gt(schema.emailVerificationTokens.expiresAt, new Date()),
    )).returning({ userId: schema.emailVerificationTokens.userId });
    if (!claimedToken) {
      sendError(res, 400, "INVALID_VERIFICATION_TOKEN", "This verification link is invalid or has expired.");
      return;
    }

    await db.update(schema.users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(schema.users.id, claimedToken.userId));
    await db.delete(schema.emailVerificationTokens)
      .where(eq(schema.emailVerificationTokens.userId, claimedToken.userId));
    res.status(200).json({ ok: true, message: "Your email is verified. You can now log in." });
  } catch (error) {
    console.error("EMAIL_VERIFICATION_FAILED", error);
    sendError(res, 500, "VERIFICATION_FAILED", "Unable to verify your email right now.");
  }
}
