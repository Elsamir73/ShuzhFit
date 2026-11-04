import { eq } from "drizzle-orm";
import { fallbackVideos } from "../../../shared/fallbackVideos.js";
import {
  excludeShorts,
  isShortDuration,
  looksLikeShortsUrl,
  parseYouTubeDuration,
  resolveVideoFeed,
  type YouTubeFeedCacheValue,
  type YouTubeVideo,
} from "../../../shared/videos.js";
import { getYouTubeEnv } from "../../lib/env.js";
import type { ApiRequest, ApiResponse } from "../../lib/http.js";
import { sendError } from "../../lib/http.js";

type Video = YouTubeVideo;
const youtubeCacheKey = "youtube_videos";

function apiErrorReason(body: unknown): string {
  if (typeof body !== "object" || body === null || !("error" in body)) return "unknown";
  const error = body.error;
  if (typeof error !== "object" || error === null) return "unknown";
  if ("errors" in error && Array.isArray(error.errors)) {
    const reasons = error.errors.flatMap((item: unknown) =>
      typeof item === "object" && item !== null && "reason" in item &&
      typeof item.reason === "string" ? [item.reason] : [],
    );
    if (reasons.length) return [...new Set(reasons)].join(", ");
  }
  if ("status" in error && typeof error.status === "string") return error.status;
  return "unknown";
}

async function fetchYouTubeApi(url: string, operation: string, channelId: string): Promise<Response> {
  const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.clone().json() as unknown;
    } catch {
      body = null;
    }
    throw new Error(
      `${operation} returned HTTP ${response.status} (reason: ${apiErrorReason(body)}) for channel ${channelId}`,
    );
  }
  return response;
}

async function saveVideosToCache(
  source: "api" | "rss",
  videos: Video[],
): Promise<string> {
  const updatedAt = new Date();
  try {
    const [{ db }, schema] = await Promise.all([
      import("../../../db/index.js"),
      import("../../../db/schema.js"),
    ]);
    const value: YouTubeFeedCacheValue = { source, videos };
    await db
      .insert(schema.contentCache)
      .values({ key: youtubeCacheKey, value, updatedAt })
      .onConflictDoUpdate({
        target: schema.contentCache.key,
        set: { value, updatedAt },
      });
  } catch (error) {
    console.error(
      "YouTube video cache upsert failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
  return updatedAt.toISOString();
}

async function readVideosFromCache(): Promise<{
  videos: Video[];
  updatedAt: string;
} | null> {
  try {
    const [{ db }, schema] = await Promise.all([
      import("../../../db/index.js"),
      import("../../../db/schema.js"),
    ]);
    const [cached] = await db
      .select({
        value: schema.contentCache.value,
        updatedAt: schema.contentCache.updatedAt,
      })
      .from(schema.contentCache)
      .where(eq(schema.contentCache.key, youtubeCacheKey))
      .limit(1);
    if (!cached || !Array.isArray(cached.value.videos) || !cached.value.videos.length) {
      return null;
    }
    if (cached.value.source !== "cache") {
      try {
        await db
          .update(schema.contentCache)
          .set({ value: { ...cached.value, source: "cache" } })
          .where(eq(schema.contentCache.key, youtubeCacheKey));
      } catch (error) {
        console.error(
          "YouTube video cache status update failed:",
          error instanceof Error ? error.message : String(error),
        );
      }
    }
    return {
      videos: cached.value.videos,
      updatedAt: cached.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error(
      "YouTube video cache read failed:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

function decodeXml(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

type ApiVideoResult = {
  videos: Video[];
  parsedDurationCount: number;
};

export async function loadFromApi(
  apiKey: string,
  channelId: string,
  limit = 5,
): Promise<ApiVideoResult> {
  const channelResponse = await fetchYouTubeApi(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`,
    "YouTube channels API",
    channelId,
  );
  const channelData = await channelResponse.json() as {
    items?: Array<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>;
  };
  const uploads = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error("YouTube uploads playlist was unavailable");

  const videos: Video[] = [];
  let parsedDurationCount = 0;
  let pageToken: string | undefined;
  const maxPages = 3;

  for (let page = 0; page < maxPages; page += 1) {
    const pageTokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
    const playlistResponse = await fetchYouTubeApi(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(uploads)}&key=${encodeURIComponent(apiKey)}${pageTokenParam}`,
      "YouTube playlistItems API",
      channelId,
    );
    const playlistData = await playlistResponse.json() as {
      items?: Array<{ snippet?: { title?: string; publishedAt?: string; resourceId?: { videoId?: string } } }>;
      nextPageToken?: string;
    };
    const entries = (playlistData.items ?? []).flatMap((item) => {
      const id = item.snippet?.resourceId?.videoId;
      if (!id) return [];
      return [{
        id,
        title: item.snippet?.title ?? "ShuzhFit video",
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        publishedAt: item.snippet?.publishedAt ?? new Date(0).toISOString(),
        durationSeconds: 0,
        isShort: false,
        url: `https://www.youtube.com/watch?v=${id}`,
      }];
    });
    if (!entries.length) break;

    const detailsResponse = await fetchYouTubeApi(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${encodeURIComponent(entries.map((video) => video.id).join(","))}&key=${encodeURIComponent(apiKey)}`,
      "YouTube videos API",
      channelId,
    );
    const details = await detailsResponse.json() as {
      items?: Array<{ id: string; contentDetails?: { duration?: string } }>;
    };
    const durations = new Map((details.items ?? []).map((item) => [
      item.id,
      parseYouTubeDuration(item.contentDetails?.duration),
    ]));
    parsedDurationCount += entries.filter(
      (video) => durations.get(video.id) !== undefined,
    ).length;
    videos.push(...entries.map((video) => {
      const duration = durations.get(video.id) ?? 0;
      const parsedDuration = durations.get(video.id);
      return {
        ...video,
        durationSeconds: duration,
        isShort: isShortDuration(parsedDuration),
      };
    }));

    pageToken = playlistData.nextPageToken;
    if (!pageToken || excludeShorts(videos, limit).length >= limit) break;
  }

  return { videos, parsedDurationCount };
}

export async function loadFromRss(channelId: string): Promise<Video[]> {
  const response = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
    { headers: { accept: "application/atom+xml" }, signal: AbortSignal.timeout(5000) },
  );
  if (!response.ok) throw new Error("YouTube RSS request failed");
  const xml = await response.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap((match) => {
    const entry = match[1] ?? "";
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([^<]+)<\/title>/)?.[1];
    if (!id || !title) return [];
    // Regular uploads link to /watch; Shorts link to /shorts/.
    const link = entry.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "";
    return [{
      id,
      title: decodeXml(title),
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      publishedAt: entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? new Date(0).toISOString(),
      durationSeconds: 0,
      isShort: looksLikeShortsUrl(link),
      url: `https://www.youtube.com/watch?v=${id}`,
    }];
  });
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400",
  );
  const env = getYouTubeEnv();
  const rawLimit = req.query?.limit;
  const limitValue = Array.isArray(rawLimit) ? rawLimit[0] : rawLimit;
  const parsedLimit = Number(limitValue);
  const limit = Number.isInteger(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 5
    ? parsedLimit
    : 5;

  const channelId = env.channelId;
  if (!env.apiKey) {
    console.warn(`YouTube Data API skipped: API key missing (channel ID: ${channelId ?? "not configured"})`);
  } else if (!channelId) {
    console.warn("YouTube Data API skipped: channel ID missing (channel ID: not configured)");
  } else {
    try {
      const { videos, parsedDurationCount } = await loadFromApi(
        env.apiKey,
        channelId,
        limit,
      );
      const regularVideos = excludeShorts(videos);
      const resolved = resolveVideoFeed(videos, [], [], [], limit);
      console.info("YouTube Data API video counts", {
        videosFetched: videos.length,
        videosWithParsedDuration: parsedDurationCount,
        videosRemovedAsShorts: videos.length - regularVideos.length,
        videosRemaining: resolved.videos.length,
      });
      if (videos.length) {
        const lastGoodAt = await saveVideosToCache("api", resolved.videos);
        res.status(200).json({
          source: resolved.source,
          videos: resolved.videos,
          lastGoodAt,
        });
        return;
      }
      console.warn(`YouTube Data API returned no videos (channel ID: ${channelId})`);
    } catch (error) {
      console.error(`YouTube Data API failed (channel ID: ${channelId}):`, error instanceof Error ? error.message : String(error));
    }
  }

  if (channelId) {
    try {
      const videos = await loadFromRss(channelId);
      const regularVideos = excludeShorts(videos);
      const resolved = resolveVideoFeed([], videos, [], [], limit);
      console.info("YouTube RSS video counts", {
        videosFetched: videos.length,
        videosWithParsedDuration: 0,
        videosRemovedAsShorts: videos.length - regularVideos.length,
        videosRemaining: resolved.videos.length,
      });
      if (videos.length) {
        const lastGoodAt = await saveVideosToCache("rss", resolved.videos);
        res.status(200).json({
          source: resolved.source,
          videos: resolved.videos,
          lastGoodAt,
        });
        return;
      }
      console.warn(`YouTube RSS feed returned no videos (channel ID: ${channelId})`);
    } catch (error) {
      console.error(`YouTube RSS feed failed (channel ID: ${channelId}):`, error instanceof Error ? error.message : String(error));
    }
  } else {
    console.warn("YouTube RSS feed skipped: channel ID missing");
  }

  const cachedResult = await readVideosFromCache();
  const resolved = resolveVideoFeed(
    [],
    [],
    cachedResult?.videos ?? [],
    fallbackVideos,
    limit,
  );
  res.status(200).json({
    source: resolved.source,
    videos: resolved.videos,
    ...(resolved.source === "cache" && cachedResult
      ? { updatedAt: cachedResult.updatedAt }
      : {}),
  });
}
