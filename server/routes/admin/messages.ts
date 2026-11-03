import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { parseBody, requireAdmin, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";

const readSchema = z.object({ id: z.number().int().positive(), isRead: z.boolean() });
const pageSchema = z.coerce.number().int().min(1).max(10000);
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const PAGE_SIZE = 25;

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!(["GET", "PATCH", "DELETE"] as const).includes(req.method as "GET" | "PATCH" | "DELETE")) {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (req.method !== "GET" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  if (!await requireAdmin(req, res)) return;

  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    const messages = schema.contactMessages;
    if (req.method === "GET") {
      const parsedPage = pageSchema.safeParse(first(req.query?.page) ?? "1");
      if (!parsedPage.success) {
        sendError(res, 400, "INVALID_PAGE", "A valid page number is required.");
        return;
      }
      const page = parsedPage.data;
      const offset = (page - 1) * PAGE_SIZE;
      const [rows, [unreadResult], [totalResult]] = await Promise.all([
        db.select({
          id: messages.id,
          name: messages.name,
          email: messages.email,
          subject: messages.subject,
          message: messages.message,
          isRead: messages.isRead,
          createdAt: messages.createdAt,
        }).from(messages).orderBy(desc(messages.createdAt)).limit(PAGE_SIZE).offset(offset),
        db.select({ count: count() }).from(messages).where(eq(messages.isRead, false)),
        db.select({ count: count() }).from(messages),
      ]);
      res.status(200).json({
        messages: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
        unreadCount: unreadResult?.count ?? 0,
        total: totalResult?.count ?? 0,
        page,
        pageSize: PAGE_SIZE,
      });
      return;
    }

    if (req.method === "PATCH") {
      const body = parseBody(readSchema, req.body);
      if (!body) {
        sendError(res, 400, "INVALID_INPUT", "The message state is invalid.");
        return;
      }
      const [updated] = await db.update(messages).set({ isRead: body.isRead })
        .where(eq(messages.id, body.id)).returning({ id: messages.id });
      if (!updated) {
        sendError(res, 404, "MESSAGE_NOT_FOUND", "This message no longer exists.");
        return;
      }
      res.status(200).json({ success: true });
      return;
    }

    const id = Number(first(req.query?.id));
    if (!Number.isSafeInteger(id) || id < 1) {
      sendError(res, 400, "INVALID_ID", "A valid message is required.");
      return;
    }
    const [deleted] = await db.delete(messages).where(eq(messages.id, id)).returning({ id: messages.id });
    if (!deleted) {
      sendError(res, 404, "MESSAGE_NOT_FOUND", "This message no longer exists.");
      return;
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("ADMIN_MESSAGES_FAILED", error);
    sendError(res, 500, "ADMIN_MESSAGES_FAILED", "Unable to load or update messages.");
  }
}
