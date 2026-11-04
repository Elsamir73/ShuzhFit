/**
 * Shorts detection shared by the YouTube route and the Videos page.
 * A video counts as a Short when YouTube reports 60 seconds or less,
 * or when its canonical link points at /shorts/.
 */

export function isShortDuration(
  durationSeconds: number | undefined,
): boolean {
  return (
    durationSeconds !== undefined &&
    Number.isFinite(durationSeconds) &&
    durationSeconds >= 0 &&
    durationSeconds <= 60
  );
}

export function parseYouTubeDuration(
  value: string | null | undefined,
): number | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    value,
  );
  if (!match) return undefined;

  const [, days, hours, minutes, seconds] = match;
  if (
    days === undefined &&
    hours === undefined &&
    minutes === undefined &&
    seconds === undefined
  ) {
    return undefined;
  }
  if (
    value.includes("T") &&
    hours === undefined &&
    minutes === undefined &&
    seconds === undefined
  ) {
    return undefined;
  }

  const duration =
    Number(days ?? 0) * 86400 +
    Number(hours ?? 0) * 3600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0);
  return Number.isFinite(duration) ? duration : undefined;
}

export function looksLikeShortsUrl(url: string): boolean {
  return /\/shorts\//i.test(url ?? "");
}

export function excludeShorts<T extends { isShort: boolean }>(
  videos: readonly T[],
  limit?: number,
): T[] {
  const regularVideos = videos.filter((video) => !video.isShort);
  return limit === undefined ? regularVideos : regularVideos.slice(0, limit);
}

export function selectVideosWithShortFallback<
  T extends { isShort: boolean; publishedAt: string },
>(videos: readonly T[], limit: number): T[] {
  const regularVideos = videos.filter((video) => !video.isShort);
  if (regularVideos.length >= 3) return regularVideos.slice(0, limit);

  return [...videos]
    .sort((a, b) => {
      const aDate = Date.parse(a.publishedAt);
      const bDate = Date.parse(b.publishedAt);
      const aTimestamp = Number.isFinite(aDate) ? aDate : 0;
      const bTimestamp = Number.isFinite(bDate) ? bDate : 0;
      return bTimestamp - aTimestamp;
    })
    .slice(0, limit);
}
