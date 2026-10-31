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
      { id: "long-1", isShort: false },
      { id: "short-1", isShort: true },
      { id: "long-2", isShort: false },
    ];
    expect(excludeShorts(videos).map((video) => video.id)).toEqual(["long-1", "long-2"]);
    expect(excludeShorts([])).toEqual([]);
  });
});
