import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { contactNotification } from "../lib/emailTemplates.js";
import { header, parseBody, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../lib/http.js";
import { sendMail } from "../lib/mailer.js";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(10).max(3000),
  website: z.string().optional().default(""),
});
const CONTACT_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function clientIp(req: ApiRequest): string {
  const forwarded = header(req, "x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || req.socket?.remoteAddress || "unknown").slice(0, 64);
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (!requireOrigin(req, res) || !requireJson(req, res)) return;
  const body = parseBody(contactSchema, req.body);
  if (!body) {
    sendError(res, 400, "INVALID_INPUT", "Check the name, email, subject, and message.");
    return;
  }
  if (body.website.trim()) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([import("../../db/index.js"), import("../../db/schema.js")]);
    const ipAddress = clientIp(req);
    const since = new Date(Date.now() - RATE_WINDOW_MS);
    const recent = await db.select({ id: schema.contactMessages.id })
      .from(schema.contactMessages)
      .where(and(eq(schema.contactMessages.ipAddress, ipAddress), gt(schema.contactMessages.createdAt, since)))
      .limit(CONTACT_LIMIT);
    if (recent.length >= CONTACT_LIMIT) {
      sendError(res, 429, "CONTACT_RATE_LIMITED", "Too many messages. Please try again later.");
      return;
    }

    await db.insert(schema.contactMessages).values({
      name: body.name,
      email: body.email.trim().toLowerCase(),
      subject: body.subject || null,
      message: body.message,
      ipAddress,
    });

    const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL?.trim();
    if (!notifyEmail) {
      console.error("Contact notification email not sent: CONTACT_NOTIFY_EMAIL is not configured.");
    } else {
      const notification = contactNotification(body.name, body.email, body.message);
      await sendMail({ to: notifyEmail, ...notification });
    }
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("CONTACT_SUBMISSION_FAILED", error);
    sendError(res, 500, "CONTACT_FAILED", "Unable to send your message right now.");
  }
}
