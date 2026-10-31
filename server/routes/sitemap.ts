import { and, eq } from "drizzle-orm";
import type { ApiRequest, ApiResponse } from "../lib/http.js";
import { sendError } from "../lib/http.js";

const SITE = "https://shuzh-fit.vercel.app";

const STATIC_PATHS = [
  "/",
  "/exercises",
  "/videos",
  "/blog",
  "/about",
  "/nutrition",
  "/bmi",
  "/contact",
] as const;

const escapes: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (ch) => escapes[ch] ?? ch);
}

export function buildSitemapXml(paths: readonly string[]): string {
  const entries = paths
    .map((path) => `  <url><loc>${SITE}${escapeXml(path)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

// Serves /sitemap.xml through the existing single function (vercel.json rewrite).
// Slugs are read live so admin-publishes appear without a redeploy. If the
// database is unreachable the core public pages are still listed.
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  const paths: string[] = [...STATIC_PATHS];
  try {
    const [{ db }, schema] = await Promise.all([
      import("../../db/index.js"),
      import("../../db/schema.js"),
    ]);
    const [exercises, posts] = await Promise.all([
      db
        .select({ slug: schema.exercises.slug })
        .from(schema.exercises)
        .where(eq(schema.exercises.isPublished, true)),
      db
        .select({ slug: schema.blogs.slug })
        .from(schema.blogs)
        .where(and(eq(schema.blogs.isPublished, true), eq(schema.blogs.status, "published"))),
    ]);
    paths.push(...exercises.map((row) => `/exercises/${row.slug}`));
    paths.push(...posts.map((row) => `/blog/${row.slug}`));
  } catch {
    // Fall back to the static core pages.
  }
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.status(200);
  res.end(buildSitemapXml(paths));
}
