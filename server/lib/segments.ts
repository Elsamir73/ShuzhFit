export type FollowupSegment =
  | "inactive_7d"
  | "no_food_7d"
  | "missed_workouts"
  | "not_onboarded"
  | "unverified";

export interface FollowupCandidate {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  emailVerifiedAt: Date | null;
  emailOptOutAt: Date | null;
  onboardedAt: Date | null;
  lastLoginAt: Date | null;
  lastFollowupAt: Date | null;
  hasRecentFoodLog: boolean;
  missedCount: number;
}

const dayMs = 24 * 60 * 60 * 1000;

export function getDaysAway(candidate: FollowupCandidate, now: Date): number {
  const lastActive = candidate.lastLoginAt ?? candidate.createdAt;
  return Math.max(0, Math.floor((now.getTime() - lastActive.getTime()) / dayMs));
}

export function getFirstName(name: string): string {
  return name.trim().split(/\s+/u)[0] ?? "";
}

export function matchesFollowupSegment(
  candidate: FollowupCandidate,
  segment: FollowupSegment,
  now: Date,
): boolean {
  if (candidate.role === "admin" || candidate.emailOptOutAt) return false;

  const cooldown = now.getTime() - 7 * dayMs;
  if (candidate.lastFollowupAt && candidate.lastFollowupAt.getTime() >= cooldown) return false;

  if (segment === "unverified") {
    return candidate.emailVerifiedAt === null &&
      candidate.createdAt.getTime() < now.getTime() - dayMs;
  }
  if (!candidate.emailVerifiedAt) return false;

  if (segment === "inactive_7d") {
    const lastActive = candidate.lastLoginAt ?? candidate.createdAt;
    return lastActive.getTime() < cooldown;
  }
  if (segment === "no_food_7d") {
    return candidate.onboardedAt !== null && !candidate.hasRecentFoodLog;
  }
  if (segment === "missed_workouts") return candidate.missedCount > 0;
  return candidate.onboardedAt === null;
}

export function filterFollowupSegment(
  candidates: readonly FollowupCandidate[],
  segment: FollowupSegment,
  now: Date,
): FollowupCandidate[] {
  return candidates.filter((candidate) => matchesFollowupSegment(candidate, segment, now));
}
