import { describe, expect, it } from "vitest";
import { filterFollowupSegment, type FollowupCandidate } from "./segments.js";

const now = new Date("2026-11-04T12:00:00.000Z");
const candidate = (overrides: Partial<FollowupCandidate> = {}): FollowupCandidate => ({
  id: 1,
  name: "Samir Pathak",
  email: "samir@example.test",
  role: "user",
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  emailVerifiedAt: new Date("2026-10-02T00:00:00.000Z"),
  emailOptOutAt: null,
  onboardedAt: new Date("2026-10-02T00:00:00.000Z"),
  lastLoginAt: new Date("2026-10-20T00:00:00.000Z"),
  lastFollowupAt: null,
  hasRecentFoodLog: false,
  missedCount: 0,
  ...overrides,
});

describe("follow-up segment eligibility", () => {
  it("excludes opted-out users, admins, and anyone followed up within seven days", () => {
    const recipients = filterFollowupSegment([
      candidate({ id: 1, emailOptOutAt: new Date("2026-10-01T00:00:00.000Z") }),
      candidate({ id: 2, role: "admin" }),
      candidate({ id: 3, lastFollowupAt: new Date("2026-11-01T00:00:00.000Z") }),
      candidate({ id: 4 }),
    ], "inactive_7d", now);

    expect(recipients.map((item) => item.id)).toEqual([4]);
  });

  it("excludes unverified recipients except from the eligible unverified segment", () => {
    const unverified = candidate({ emailVerifiedAt: null });
    expect(filterFollowupSegment([unverified], "inactive_7d", now)).toEqual([]);
    expect(filterFollowupSegment([unverified], "unverified", now)).toHaveLength(1);
    expect(filterFollowupSegment([
      candidate({ emailVerifiedAt: null, createdAt: new Date("2026-11-04T00:00:00.000Z") }),
    ], "unverified", now)).toEqual([]);
  });

  it("requires verified, onboarded users without recent food logs", () => {
    expect(filterFollowupSegment([candidate()], "no_food_7d", now)).toHaveLength(1);
    expect(filterFollowupSegment([
      candidate({ hasRecentFoodLog: true }),
      candidate({ id: 2, onboardedAt: null }),
    ], "no_food_7d", now)).toEqual([]);
  });
});
