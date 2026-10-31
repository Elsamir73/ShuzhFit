/**
 * Shorts detection shared by the YouTube route and the Videos page.
 * A video counts as a Short when YouTube reports 60 seconds or less,
 * or when its canonical link points at /shorts/.
 */

export function isShortDuration(durationSeconds: number): boolean {
  return (
    Number.isFinite(durationSeconds) &&
    durationSeconds > 0 &&
    durationSeconds <= 60
  );
}

export function looksLikeShortsUrl(url: string): boolean {
  return /\/shorts\//i.test(url ?? "");
}

export function excludeShorts<T extends { isShort: boolean }>(
  videos: readonly T[],
): T[] {
  return videos.filter((video) => !video.isShort);
}
