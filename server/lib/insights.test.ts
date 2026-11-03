import { describe, expect, it } from "vitest";
import { countMissedPlannedSessions } from "./insights.js";

describe("countMissedPlannedSessions", () => {
  it("counts only missed training dates after the active plan was created", () => {
    const missed = countMissedPlannedSessions({
      plannedWeekdays: [0, 1, 2, 3, 4, 5, 6],
      activityDates: ["2026-10-31"],
      planCreatedAt: "2026-10-29T15:00:00.000Z",
      today: "2026-11-03T00:00:00.000Z",
    });

    expect(missed).toBe(3);
  });

  it("does not count the plan creation date or dates before it", () => {
    const missed = countMissedPlannedSessions({
      plannedWeekdays: [0, 1, 2, 3, 4, 5, 6],
      activityDates: [],
      planCreatedAt: "2026-11-02T08:00:00.000Z",
      today: "2026-11-03T00:00:00.000Z",
    });

    expect(missed).toBe(0);
  });
});
