export function getDailyEmailLimit(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return 400;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error("EMAIL_DAILY_LIMIT must be a positive whole number.");
  }
  return parsed;
}

export function getFollowupBatchSize(
  pendingCount: number,
  sentToday: number,
  dailyLimit: number,
  batchLimit = 20,
): { batchSize: number; remainingCapacity: number; limitReached: boolean } {
  const remainingCapacity = Math.max(0, dailyLimit - sentToday);
  const batchSize = Math.min(Math.max(0, pendingCount), remainingCapacity, batchLimit);
  return {
    batchSize,
    remainingCapacity,
    limitReached: pendingCount > 0 && remainingCapacity === 0,
  };
}

export function getRemainingRecipientCount(totalPending: number, attemptedThisBatch: number): number {
  return Math.max(0, totalPending - attemptedThisBatch);
}
