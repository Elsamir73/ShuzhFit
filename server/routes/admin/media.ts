import { del, head } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { parseBody, requireAdmin, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";

const updateSchema = z.object({ action: z.literal("alt"), id: z.number().int().positive(), altText: z.string().max(500) });
const deleteSchema = z.object({ action: z.literal("delete"), id: z.number().int().positive() });
const allowed = ["image/jpeg", "image/png", "image/webp"];
const maxSize = 8 * 1024 * 1024;

function sniff(bytes: Uint8Array, type: string): boolean {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10";
  if (type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}
function dimensions(bytes: Uint8Array, type: string): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (type === "image/png" && bytes.length >= 24) return { width: view.getUint32(16), height: view.getUint32(20) };
  if (type === "image/webp" && bytes.length >= 30 && String.fromCharCode(...bytes.slice(12, 16)) === "VP8X") return { width: 1 + bytes[24]! + bytes[25]! * 256 + bytes[26]! * 65536, height: 1 + bytes[27]! + bytes[28]! * 256 + bytes[29]! * 65536 };
  if (type === "image/jpeg") { let offset = 2; while (offset + 9 < bytes.length) { if (bytes[offset] !== 0xff) { offset += 1; continue; } const marker = bytes[offset + 1]!; const size = view.getUint16(offset + 2); if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && size >= 7) return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) }; offset += size + 2; } }
  return null;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method ?? "")) { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  const isUploadCallback = req.method === "POST" && typeof req.body === "object" && req.body !== null && "type" in req.body && req.body.type === "blob.upload-completed";
  if (req.method !== "GET" && !isUploadCallback && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  if (!isUploadCallback && !await requireAdmin(req, res)) return;
  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    if (req.method === "GET") {
      const rows = await db.select().from(schema.media).orderBy(desc(schema.media.createdAt));
      res.status(200).json(rows.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))); return;
    }
    if (req.method === "POST") {
      const body = req.body as Parameters<typeof handleUpload>[0]["body"];
      const result = await handleUpload({
        body,
        request: req as unknown as Request,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const admin = await requireAdmin(req, res);
          if (!admin) throw new Error("Admin access is required.");
          if (!/\.(jpe?g|png|webp)$/i.test(pathname)) throw new Error("Only JPEG, PNG, and WebP images are accepted.");
          return { allowedContentTypes: allowed, maximumSizeInBytes: maxSize, addRandomSuffix: true, tokenPayload: JSON.stringify({ userId: admin.id, clientPayload }) };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          const info = await head(blob.url);
          if (info.size > maxSize || !allowed.includes(info.contentType)) { await del(blob.url); throw new Error("Image must be JPEG, PNG, or WebP and no larger than 8 MB."); }
          const sample = await fetch(blob.url);
          const bytes = new Uint8Array(await sample.arrayBuffer());
          if (!sniff(bytes, info.contentType)) { await del(blob.url); throw new Error("Uploaded file does not contain a valid supported image."); }
          const size = dimensions(bytes, info.contentType);
          let uploadedBy: number | null = null;
          try { const payload = JSON.parse(tokenPayload ?? "{}") as { userId?: string }; const parsed = Number(payload.userId); uploadedBy = Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null; } catch { uploadedBy = null; }
          if (uploadedBy === null) { await del(blob.url); throw new Error("Upload owner could not be verified."); }
          const filename = blob.pathname.split("/").at(-1) ?? "image";
          await db.insert(schema.media).values({ url: blob.url, pathname: blob.pathname, filename, contentType: info.contentType, size: info.size, width: size?.width ?? null, height: size?.height ?? null, uploadedBy });
        },
      });
      res.status(200).json(result); return;
    }
    const input = parseBody(req.method === "PATCH" ? updateSchema : deleteSchema, req.body);
    if (!input) { sendError(res, 400, "INVALID_INPUT", "The media change is invalid."); return; }
    const [item] = await db.select({ id: schema.media.id, pathname: schema.media.pathname, url: schema.media.url }).from(schema.media).where(eq(schema.media.id, input.id)).limit(1);
    if (!item) { sendError(res, 404, "MEDIA_NOT_FOUND", "Media item not found."); return; }
    if (input.action === "alt") await db.update(schema.media).set({ altText: input.altText }).where(eq(schema.media.id, item.id));
    else { await del(item.pathname); await db.delete(schema.media).where(eq(schema.media.id, item.id)); }
    res.status(200).json({ success: true });
  } catch (error) { console.error("Admin media handler failed:", error instanceof Error ? error.message : String(error)); sendError(res, 500, "ADMIN_MEDIA_FAILED", "Unable to load or update media."); }
}
