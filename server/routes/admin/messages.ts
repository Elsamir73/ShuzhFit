import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { parseBody, requireAdmin, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";
const readSchema = z.object({ id: z.number().int().positive(), isRead: z.boolean() });
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!(["GET", "PATCH", "DELETE"] as const).includes(req.method as "GET" | "PATCH" | "DELETE")) { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  if (req.method !== "GET" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  if (!await requireAdmin(req, res)) return;
  try {
    const [{ db }, { contacts }] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    if (req.method === "GET") { const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt)); res.status(200).json(rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))); return; }
    if (req.method === "PATCH") { const body = parseBody(readSchema, req.body); if (!body) { sendError(res, 400, "INVALID_INPUT", "The message state is invalid."); return; } await db.update(contacts).set({ isRead: body.isRead }).where(eq(contacts.id, body.id)); res.status(200).json({ success: true }); return; }
    const id = Number(first(req.query?.id)); if (!Number.isSafeInteger(id) || id < 1) { sendError(res, 400, "INVALID_ID", "A valid message is required."); return; }
    await db.delete(contacts).where(eq(contacts.id, id)); res.status(200).json({ success: true });
  } catch { sendError(res, 500, "ADMIN_MESSAGES_FAILED", "Unable to load or update messages."); }
}
