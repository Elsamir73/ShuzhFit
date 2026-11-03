import { describe, expect, it } from "vitest";
import { excludeShorts, isShortDuration, looksLikeShortsUrl } from "./videos.js";

describe("shorts filtering", () => {
  it("flags known durations of 60 seconds or less as Shorts", () => {
    expect(isShortDuration(0)).toBe(false); // unknown duration is not proof of a Short
    expect(isShortDuration(45)).toBe(true);
    expect(isShortDuration(60)).toBe(true);
    expect(isShortDuration(61)).toBe(false);
    expect(isShortDuration(Number.NaN)).toBe(false);
  });

  it("detects Shorts by their /shorts/ link", () => {
    expect(looksLikeShortsUrl("https://www.youtube.com/shorts/a1B2c3")).toBe(true);
    expect(looksLikeShortsUrl("https://WWW.YOUTUBE.COM/SHORTS/a1B2c3")).toBe(true);
    expect(looksLikeShortsUrl("https://www.youtube.com/watch?v=a1B2c3")).toBe(false);
    expect(looksLikeShortsUrl("")).toBe(false);
  });

  it("removes Shorts while keeping normal uploads in order", () => {
    const videos = [
      { id: "unknown", durationSeconds: 0, isShort: isShortDuration(0) },
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
});
