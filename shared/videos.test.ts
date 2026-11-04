import { describe, expect, it } from "vitest";
import {
  excludeShorts,
  isShortDuration,
  looksLikeShortsUrl,
  parseYouTubeDuration,
  resolveVideoFeed,
  selectVideosWithShortFallback,
} from "./videos.js";

describe("shorts filtering", () => {
  it("flags known durations of 60 seconds or less as Shorts", () => {
    expect(isShortDuration(undefined)).toBe(false);
    expect(isShortDuration(Number.NaN)).toBe(false);
    expect(isShortDuration(0)).toBe(true);
    expect(isShortDuration(45)).toBe(true);
    expect(isShortDuration(60)).toBe(true);
    expect(isShortDuration(61)).toBe(false);
  });

  it("parses YouTube ISO 8601 durations and leaves unknown values unparsed", () => {
    expect(parseYouTubeDuration("PT8M12S")).toBe(492);
    expect(parseYouTubeDuration("PT1H2M3S")).toBe(3723);
    expect(parseYouTubeDuration("PT45S")).toBe(45);
    expect(parseYouTubeDuration("P0D")).toBe(0);
    expect(isShortDuration(parseYouTubeDuration("P0D"))).toBe(true);
    expect(parseYouTubeDuration("")).toBeUndefined();
    expect(parseYouTubeDuration(undefined)).toBeUndefined();
    expect(parseYouTubeDuration("PT")).toBeUndefined();
    expect(parseYouTubeDuration("not a duration")).toBeUndefined();
  });

  it("detects Shorts by their /shorts/ link", () => {
    expect(looksLikeShortsUrl("https://www.youtube.com/shorts/a1B2c3")).toBe(true);
    expect(looksLikeShortsUrl("https://WWW.YOUTUBE.COM/SHORTS/a1B2c3")).toBe(true);
    expect(looksLikeShortsUrl("https://www.youtube.com/watch?v=a1B2c3")).toBe(false);
    expect(looksLikeShortsUrl("")).toBe(false);
  });

  it("removes Shorts while keeping normal uploads in order", () => {
    const videos = [
      { id: "unknown", durationSeconds: 0, isShort: isShortDuration(undefined) },
      { id: "short", durationSeconds: 45, isShort: isShortDuration(45) },
      { id: "long", durationSeconds: 600, isShort: isShortDuration(600) },
    ];
    expect(excludeShorts(videos).map((video) => video.id)).toEqual(["unknown", "long"]);
    expect(excludeShorts([])).toEqual([]);
  });

  it("applies the limit after filtering Shorts", () => {
    const videos = [
      { id: "short-1", isShort: true },
      { id: "regular-1", isShort: false },
      { id: "short-2", isShort: true },
      { id: "regular-2", isShort: false },
      { id: "regular-3", isShort: false },
    ];

    expect(excludeShorts(videos, 2).map((video) => video.id)).toEqual([
      "regular-1",
      "regular-2",
    ]);
  });

  it("fills sparse regular results with the newest Shorts up to the limit", () => {
    const videos = [
      { id: "short-old", isShort: true, publishedAt: "2025-01-01" },
      { id: "regular-old", isShort: false, publishedAt: "2025-02-01" },
      { id: "short-new", isShort: true, publishedAt: "2025-04-01" },
      { id: "regular-new", isShort: false, publishedAt: "2025-03-01" },
    ];

    expect(
      selectVideosWithShortFallback(videos, 3).map((video) => [
        video.id,
        video.isShort,
      ]),
    ).toEqual([
      ["short-new", true],
      ["regular-new", false],
      ["regular-old", false],
    ]);
  });

  it("keeps Shorts excluded when at least three regular videos are available", () => {
    const videos = [
      { id: "short", isShort: true, publishedAt: "2025-05-01" },
      { id: "regular-1", isShort: false, publishedAt: "2025-04-01" },
      { id: "regular-2", isShort: false, publishedAt: "2025-03-01" },
      { id: "regular-3", isShort: false, publishedAt: "2025-02-01" },
    ];

    expect(
      selectVideosWithShortFallback(videos, 5).map((video) => video.id),
    ).toEqual(["regular-1", "regular-2", "regular-3"]);
  });

  it("resolves the feed in api, cache, then static order", () => {
    const apiVideo = { id: "api", isShort: false, publishedAt: "2025-03-01" };
    const cachedVideo = { id: "cache", isShort: false, publishedAt: "2025-02-01" };
    const staticVideo = { id: "static", isShort: false, publishedAt: "2025-01-01" };

    expect(
      resolveVideoFeed([apiVideo], [], [cachedVideo], [staticVideo], 5),
    ).toEqual({ source: "api", videos: [apiVideo] });
    expect(
      resolveVideoFeed([], [], [cachedVideo], [staticVideo], 5),
    ).toEqual({ source: "cache", videos: [cachedVideo] });
    expect(
      resolveVideoFeed([], [], [], [staticVideo], 5),
    ).toEqual({ source: "static", videos: [staticVideo] });
  });
});
