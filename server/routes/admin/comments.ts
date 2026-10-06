import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { parseBody, requireAdmin, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";
const bulkSchema = z.object({ ids: z.array(z.number().int().positive()).min(1).max(1000) });
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET" && req.method !== "DELETE") { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  if (req.method === "DELETE" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  if (!await requireAdmin(req, res)) return;
  try {
    const [{ db }, { contentComments }] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    if (req.method === "GET") { const rows = await db.select().from(contentComments).orderBy(desc(contentComments.createdAt)); res.status(200).json(rows.map((row) => ({ id: String(row.id), author: row.authorName, body: row.message, email: "", createdAt: row.createdAt.toISOString(), itemType: row.itemType, itemSlug: row.itemSlug }))); return; }
    const bulk = parseBody(bulkSchema, req.body);
    if (bulk) await db.delete(contentComments).where(inArray(contentComments.id, bulk.ids));
    else { const id = Number(first(req.query?.id)); if (!Number.isSafeInteger(id) || id < 1) { sendError(res, 400, "INVALID_ID", "A valid comment is required."); return; } await db.delete(contentComments).where(eq(contentComments.id, id)); }
    res.status(200).json({ success: true });
  } catch { sendError(res, 500, "ADMIN_COMMENTS_FAILED", "Unable to load or moderate comments."); }
}
