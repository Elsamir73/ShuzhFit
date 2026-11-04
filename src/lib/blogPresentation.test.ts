import { describe, expect, it } from "vitest";
import type { BlogPost } from "./content";
import { getReadingTimeMinutes, pickRelatedPosts } from "./blogPresentation";

function post(
  slug: string,
  category: string,
  publishedAt: string,
): BlogPost {
  return {
    slug,
    title: slug,
    excerpt: "",
    content: "",
    category,
    author: "ShuzhFit",
    publishedAt,
  };
}

describe("blog presentation helpers", () => {
  it("calculates reading time from words rather than markup", () => {
    expect(getReadingTimeMinutes("<p>One <strong>two</strong> three.</p>")).toBe(1);
    expect(getReadingTimeMinutes(Array.from({ length: 401 }, () => "word").join(" "))).toBe(3);
    expect(getReadingTimeMinutes("")).toBe(1);
  });

  it("prioritizes recent same-category posts, excludes current, and hides sparse results", () => {
    const current = post("current", "Strength", "2026-01-01");
    const sameOlder = post("same-older", "Strength", "2025-01-01");
    const differentNewer = post("different-newer", "Recovery", "2026-02-01");
    const sameNewer = post("same-newer", "Strength", "2026-01-15");

    expect(
      pickRelatedPosts(current, [current, sameOlder, differentNewer, sameNewer]).map(
        (item) => item.slug,
      ),
    ).toEqual(["same-newer", "same-older", "different-newer"]);
    expect(pickRelatedPosts(current, [current, sameOlder])).toEqual([]);
  });
});
