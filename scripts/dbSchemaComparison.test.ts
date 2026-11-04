import { describe, expect, it } from "vitest";
import { findMissingColumns } from "./dbSchemaComparison.js";

describe("findMissingColumns", () => {
  it("returns missing tables and columns in a stable order", () => {
    expect(findMissingColumns(
      { users: ["id", "email", "email_verified_at"], workouts: ["id"] },
      { users: ["id", "email"] },
    )).toEqual([
      "users.email_verified_at",
      "workouts (table)",
      "workouts.id",
    ]);
  });

  it("ignores extra database tables and columns", () => {
    expect(findMissingColumns(
      { users: ["id", "email"] },
      { users: ["id", "email", "legacy_field"], legacy_table: ["id"] },
    )).toEqual([]);
  });

  it("returns an empty list when schemas match", () => {
    expect(findMissingColumns(
      { users: ["id", "email"] },
      { users: ["email", "id"] },
    )).toEqual([]);
  });
});
