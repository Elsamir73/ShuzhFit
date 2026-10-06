import { desc, notInArray } from "drizzle-orm";
import { z } from "zod";
import { parseBody, requireAdmin, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";

const blogSchema = z.array(z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180), title: z.string().trim().min(1).max(200), excerpt: z.string().max(3000),
  content: z.string().min(1).max(30000), category: z.string().max(80), author: z.string().max(120), imageUrl: z.string().max(2048).optional(),
  coverImage: z.string().max(2048).optional(), status: z.enum(["draft", "published"]).default("published"), publishedAt: z.string().datetime().nullable().optional(),
  contentFormat: z.enum(["html", "markdown"]).default("html"), seoTitle: z.string().max(200).optional(), seoDescription: z.string().max(500).optional(),
}).refine((post) => post.contentFormat === "markdown" || !/<\s*(script|iframe|object|embed)\b/i.test(post.content), { message: "Unsupported HTML content." })).max(500).refine((items) => new Set(items.map((item) => item.slug)).size === items.length, { message: "Each blog slug must be unique." });
const clean = (html: string) => html.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "").replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "$1=\"#\"");
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  if (req.method === "POST" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  if (!await requireAdmin(req, res)) return;
  try {
    const [{ db }, { blogs }] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    if (req.method === "GET") {
      const rows = await db.select().from(blogs).orderBy(desc(blogs.createdAt));
      res.status(200).json(rows.map((post) => ({ slug: post.slug, title: post.title, excerpt: post.excerpt ?? "", content: post.content, category: post.category ?? "General", author: post.authorName ?? "ShuzhFit", imageUrl: post.imageUrl ?? "", coverImage: post.coverImage ?? "", status: post.status as "draft" | "published", publishedAt: post.publishedAt?.toISOString() ?? null, contentFormat: post.contentFormat as "html" | "markdown", seoTitle: post.seoTitle ?? "", seoDescription: post.seoDescription ?? "" })));
      return;
    }
    const body = parseBody(blogSchema, req.body);
    if (!body) { sendError(res, 400, "INVALID_INPUT", "Blog entries need a title, valid slug and body."); return; }
    for (const post of body) {
      const content = post.contentFormat === "html" ? clean(post.content) : post.content;
      const isPublished = post.status === "published";
      const publishedAt = isPublished ? post.publishedAt ? new Date(post.publishedAt) : new Date() : null;
      const values = { slug: post.slug, title: post.title, excerpt: clean(post.excerpt), content, category: post.category, authorName: post.author, imageUrl: post.coverImage ?? post.imageUrl ?? null, coverImage: post.coverImage ?? post.imageUrl ?? null, status: post.status, publishedAt, contentFormat: post.contentFormat, seoTitle: post.seoTitle || null, seoDescription: post.seoDescription || null, isPublished, updatedAt: new Date() };
      await db.insert(blogs).values(values).onConflictDoUpdate({ target: blogs.slug, set: values });
    }
    if (body.length) await db.delete(blogs).where(notInArray(blogs.slug, body.map((post) => post.slug)));
    else await db.delete(blogs);
    res.status(200).json({ success: true });
  } catch (error) { console.error("Admin blog save failed:", error instanceof Error ? error.message : String(error)); sendError(res, 500, "ADMIN_BLOGS_FAILED", "Unable to save blog content."); }
}
