import { describe, expect, it } from "vitest";
import { buildSitemapXml } from "./sitemap.js";

describe("sitemap builder", () => {
  it("wraps each path in a valid urlset entry", () => {
    const xml = buildSitemapXml(["/", "/exercises/pull-up"]);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<loc>https://shuzh-fit.vercel.app/</loc>");
    expect(xml).toContain("<loc>https://shuzh-fit.vercel.app/exercises/pull-up</loc>");
  });

  it("escapes XML-special characters", () => {
    const xml = buildSitemapXml(["/blog/a&b"]);
    expect(xml).toContain("<loc>https://shuzh-fit.vercel.app/blog/a&amp;b</loc>");
    expect(xml).not.toContain("a&b</loc>");
  });
});
