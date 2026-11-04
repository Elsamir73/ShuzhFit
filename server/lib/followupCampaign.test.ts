import { describe, expect, it } from "vitest";
import { getDailyEmailLimit, getFollowupBatchSize, getRemainingRecipientCount } from "./followupCampaign.js";

describe("follow-up batch and daily cap", () => {
  it("uses a default cap and validates configured caps", () => {
    expect(getDailyEmailLimit(undefined)).toBe(400);
    expect(getDailyEmailLimit("35")).toBe(35);
    expect(() => getDailyEmailLimit("0")).toThrow();
    expect(() => getDailyEmailLimit("1.5")).toThrow();
  });

  it("limits sends to at most 20 and the remaining daily capacity", () => {
    expect(getFollowupBatchSize(50, 0, 400)).toMatchObject({ batchSize: 20, remainingCapacity: 400, limitReached: false });
    expect(getFollowupBatchSize(50, 397, 400)).toMatchObject({ batchSize: 3, remainingCapacity: 3, limitReached: false });
    expect(getFollowupBatchSize(2, 400, 400)).toMatchObject({ batchSize: 0, remainingCapacity: 0, limitReached: true });
    expect(getRemainingRecipientCount(20, 7)).toBe(13);
  });
});
