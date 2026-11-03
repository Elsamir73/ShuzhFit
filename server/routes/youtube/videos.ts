import { fallbackVideos } from "../../../shared/fallbackVideos.js";
import { excludeShorts, isShortDuration, looksLikeShortsUrl } from "../../../shared/videos.js";
import { getYouTubeEnv } from "../../lib/env.js";
import type { ApiRequest, ApiResponse } from "../../lib/http.js";
import { sendError } from "../../lib/http.js";

type Video = (typeof fallbackVideos)[number];

function durationSeconds(value: string): number {
  const parts = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return parts ? Number(parts[1] ?? 0) * 3600 + Number(parts[2] ?? 0) * 60 + Number(parts[3] ?? 0) : 0;
}

function decodeXml(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export async function loadFromApi(apiKey: string, channelId: string, limit = 5): Promise<Video[]> {
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`,
    { signal: AbortSignal.timeout(6000) },
  );
  if (!channelResponse.ok) throw new Error("YouTube channel request failed");
  const channelData = await channelResponse.json() as {
    items?: Array<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>;
  };
  const uploads = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error("YouTube uploads playlist was unavailable");

  const videos: Video[] = [];
  let pageToken: string | undefined;
  const maxPages = 3;

  for (let page = 0; page < maxPages; page += 1) {
    const pageTokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(uploads)}&key=${encodeURIComponent(apiKey)}${pageTokenParam}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!playlistResponse.ok) throw new Error("YouTube playlist request failed");
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

    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${encodeURIComponent(entries.map((video) => video.id).join(","))}&key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!detailsResponse.ok) throw new Error("YouTube video details request failed");
    const details = await detailsResponse.json() as {
      items?: Array<{ id: string; contentDetails?: { duration?: string } }>;
    };
    const durations = new Map((details.items ?? []).map((item) => [
      item.id,
      durationSeconds(item.contentDetails?.duration ?? ""),
    ]));
    videos.push(...entries.map((video) => {
      const duration = durations.get(video.id) ?? 0;
      return { ...video, durationSeconds: duration, isShort: isShortDuration(duration) };
    }));

    pageToken = playlistData.nextPageToken;
    if (!pageToken || excludeShorts(videos, limit).length >= limit) break;
  }

  return videos;
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
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  const env = getYouTubeEnv();
  const rawLimit = req.query?.limit;
  const limitValue = Array.isArray(rawLimit) ? rawLimit[0] : rawLimit;
  const parsedLimit = Number(limitValue);
  const limit = Number.isInteger(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 5
    ? parsedLimit
    : 5;

  if (env.apiKey && env.channelId) {
    try {
      const videos = await loadFromApi(env.apiKey, env.channelId, limit);
      const regularVideos = excludeShorts(videos, limit);
      if (regularVideos.length) {
        res.status(200).json({ source: "api", videos: regularVideos });
        return;
      }
    } catch (error) {
      console.error("YouTube Data API failed:", error instanceof Error ? error.message : String(error));
    }
  }

  if (env.channelId) {
    try {
      const videos = await loadFromRss(env.channelId);
      const regularVideos = excludeShorts(videos, limit);
      if (regularVideos.length) {
        res.status(200).json({ source: "rss", videos: regularVideos });
        return;
      }
    } catch (error) {
      console.error("YouTube RSS feed failed:", error instanceof Error ? error.message : String(error));
    }
  }

  res.status(200).json({ source: "static", videos: excludeShorts(fallbackVideos, limit) });
}
