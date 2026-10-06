import {
  blogPosts as defaultBlogPosts,
  exercises as defaultExercises,
  videos as defaultVideos,
} from "./content";
import DOMPurify from "dompurify";

export type ExerciseItem = (typeof defaultExercises)[number] & { muscleGroup?: string; steps?: string[]; tips?: string[]; mistakesList?: string[]; repUnit?: "reps" | "seconds" | "meters"; imageUrl?: string };
export type BlogItem = (typeof defaultBlogPosts)[number] & { status?: "draft" | "published"; publishedAt?: string | null; coverImage?: string; contentFormat?: "html" | "markdown"; seoTitle?: string; seoDescription?: string };
export type VideoItem = (typeof defaultVideos)[number];

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

const STORAGE_KEYS = {
  exercises: "shuzhfit_admin_exercises",
  blogs: "shuzhfit_admin_blogs",
  videos: "shuzhfit_admin_videos",
  messages: "shuzhfit_admin_messages",
  comments: "shuzhfit_admin_comments",
} as const;

export type AdminComment = {
  id: string;
  author: string;
  email: string;
  body: string;
  createdAt: string;
};

const defaultMessages: ContactMessage[] = [
  {
    id: "msg-1",
    name: "Alicia N.",
    email: "alicia@example.com",
    message:
      "I would like a beginner-friendly strength plan with a simple weekly schedule.",
    createdAt: "2026-09-18T12:00:00.000Z",
  },
  {
    id: "msg-2",
    name: "Marcus D.",
    email: "marcus@example.com",
    message:
      "Could you add a version of the app focused on fat-loss and consistency?",
    createdAt: "2026-09-20T08:40:00.000Z",
  },
];

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function getAdminExercises(): Promise<ExerciseItem[]> {
  try {
    const response = await fetch("/api/admin/exercises", {
      credentials: "same-origin",
    });
    if (!response.ok) {
      throw new Error("Unable to load admin exercises.");
    }

    const data = (await response.json()) as ExerciseItem[];
    return Array.isArray(data)
      ? data
      : [];
  } catch {
    throw new Error("Unable to load admin exercises.");
  }
}

export async function saveAdminExercises(items: ExerciseItem[]) {
  try {
    const response = await fetch("/api/admin/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(items.map((item) => ({ ...item, benefits: DOMPurify.sanitize(item.benefits), formGuide: DOMPurify.sanitize(item.formGuide), mistakes: DOMPurify.sanitize(item.mistakes) }))),
    });

    if (response.ok) {
      const data = (await response.json()) as ExerciseItem[];
      writeStorage(STORAGE_KEYS.exercises, data);
      return data;
    }
  } catch {
    throw new Error("Unable to save admin exercises.");
  }
  throw new Error("Unable to save admin exercises.");
}

export async function getAdminBlogs(): Promise<BlogItem[]> {
  try {
    const response = await fetch("/api/admin/blogs", {
      credentials: "same-origin",
    });
    if (!response.ok) {
      throw new Error("Unable to load admin blogs.");
    }

    const data = (await response.json()) as BlogItem[];
    return Array.isArray(data)
      ? data
      : [];
  } catch {
    throw new Error("Unable to load admin blogs.");
  }
}

export async function saveAdminBlogs(items: BlogItem[]) {
  try {
    const response = await fetch("/api/admin/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(items.map((item) => ({ ...item, content: item.contentFormat === "markdown" ? item.content : DOMPurify.sanitize(item.content), excerpt: DOMPurify.sanitize(item.excerpt) }))),
    });

    if (response.ok) {
      await response.json();
      writeStorage(STORAGE_KEYS.blogs, items);
      return items;
    }
  } catch {
    throw new Error("Unable to save admin blogs.");
  }
  throw new Error("Unable to save admin blogs.");
}

export async function getAdminVideos(): Promise<VideoItem[]> {
  try {
    const response = await fetch("/api/admin/videos", {
      credentials: "same-origin",
    });
    if (!response.ok) {
      throw new Error("Unable to load admin videos.");
    }

    const data = (await response.json()) as VideoItem[];
    return Array.isArray(data)
      ? data
      : [];
  } catch {
    throw new Error("Unable to load admin videos.");
  }
}

export async function saveAdminVideos(items: VideoItem[]) {
  try {
    const response = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(items),
    });

    if (response.ok) {
      const data = (await response.json()) as VideoItem[];
      writeStorage(STORAGE_KEYS.videos, data);
      return data;
    }
  } catch {
    throw new Error("Unable to save admin videos.");
  }
  throw new Error("Unable to save admin videos.");
}

export function getAdminMessages(): ContactMessage[] {
  return readStorage<ContactMessage[]>(STORAGE_KEYS.messages, defaultMessages);
}

export function saveAdminMessages(items: ContactMessage[]) {
  writeStorage(STORAGE_KEYS.messages, items);
}

const defaultComments: AdminComment[] = [
  {
    id: "comment-1",
    author: "Alicia",
    email: "alicia@example.com",
    body: "The recovery notes were really helpful this week.",
    createdAt: "2026-09-18T10:30:00.000Z",
  },
  {
    id: "comment-2",
    author: "Marcus",
    email: "marcus@example.com",
    body: "I liked the simple beginner strength plan.",
    createdAt: "2026-09-19T15:10:00.000Z",
  },
];

export function getAdminComments(): AdminComment[] {
  return readStorage<AdminComment[]>(STORAGE_KEYS.comments, defaultComments);
}

export function saveAdminComments(items: AdminComment[]) {
  writeStorage(STORAGE_KEYS.comments, items);
}

export function addAdminComment(input: {
  author: string;
  email: string;
  body: string;
}) {
  const next: AdminComment = {
    id: `comment-${Date.now()}`,
    author: input.author.trim(),
    email: input.email.trim(),
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
  };

  const existing = getAdminComments();
  const updated = [next, ...existing];
  saveAdminComments(updated);
  return next;
}

export function addAdminMessage(input: {
  name: string;
  email: string;
  message: string;
}) {
  const next: ContactMessage = {
    id: `msg-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
  };

  const existing = getAdminMessages();
  const updated = [next, ...existing];
  saveAdminMessages(updated);
  return next;
}
