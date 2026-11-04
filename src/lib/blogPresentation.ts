import type { BlogPost } from "./content";

export function getReadingTimeMinutes(content: string): number {
  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#~-]/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, " ");
  const wordCount = plainText.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function publishedTimestamp(post: BlogPost): number {
  const timestamp = Date.parse(post.publishedAt ?? "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function pickRelatedPosts(
  currentPost: BlogPost,
  posts: readonly BlogPost[],
  limit = 5,
): BlogPost[] {
  const others = posts.filter((post) => post.slug !== currentPost.slug);
  if (others.length < 2 || limit <= 0) return [];

  return [...others]
    .sort((a, b) => {
      const aSameCategory = a.category === currentPost.category ? 1 : 0;
      const bSameCategory = b.category === currentPost.category ? 1 : 0;
      return (
        bSameCategory - aSameCategory ||
        publishedTimestamp(b) - publishedTimestamp(a)
      );
    })
    .slice(0, limit);
}
