import {
  blogPosts as fallbackBlogPosts,
  exercises as fallbackExercises,
  type BlogPost,
  type Exercise,
  type Video,
} from "./content";

export async function loadExercises(): Promise<Exercise[]> {
  try {
    const response = await fetch("/api/content/exercises");
    if (!response.ok) {
      return fallbackExercises;
    }

    const data = (await response.json()) as Exercise[];
    return Array.isArray(data) && data.length > 0 ? data : fallbackExercises;
  } catch {
    return fallbackExercises;
  }
}

export async function loadExercise(slug: string): Promise<Exercise | null> {
  const response = await fetch(`/api/content/exercises?slug=${encodeURIComponent(slug)}`);
  if (response.status === 404) return null;
  if (!response.ok) return fallbackExercises.find((item) => item.slug === slug) ?? null;
  return await response.json() as Exercise;
}

export async function loadBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch("/api/content/blogs");
    if (!response.ok) {
      return fallbackBlogPosts;
    }

    const data = (await response.json()) as BlogPost[];
    return Array.isArray(data) && data.length > 0 ? data : fallbackBlogPosts;
  } catch {
    return fallbackBlogPosts;
  }
}

export async function loadBlogPost(slug: string): Promise<BlogPost | null> {
  const response = await fetch(`/api/content/blogs?slug=${encodeURIComponent(slug)}`);
  if (response.status === 404) return null;
  if (!response.ok) return fallbackBlogPosts.find((item) => item.slug === slug) ?? null;
  return await response.json() as BlogPost;
}

export async function loadVideos(): Promise<Video[]> {
  try {
    const response = await fetch("/api/youtube/videos");
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { videos?: Array<{ id: string; title: string; thumbnail: string; publishedAt: string; durationSeconds: number; isShort: boolean; url: string }> };
    return (data.videos ?? []).map((video) => ({ slug: video.id, title: video.title, description: `${video.isShort ? "Short · " : ""}${Math.floor(video.durationSeconds/60)} min`, youtubeUrl: video.url, thumbnail: video.thumbnail, durationSeconds: video.durationSeconds, publishedAt: video.publishedAt }));
  } catch {
    return [];
  }
}
