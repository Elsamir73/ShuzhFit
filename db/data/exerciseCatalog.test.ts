import { describe, expect, it } from "vitest";
import { CATEGORIES, EQUIPMENT, LEVELS, MUSCLE_GROUPS, MUSCLES, REP_UNITS } from "./exerciseTypes.js";
import { guideUpdates } from "./guideUpdates.js";
import { newExercises } from "./newExercises.js";

describe("new exercises", () => {
  it("has unique kebab-case slugs", () => {
    const slugs = newExercises.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("does not collide with existing seed slugs", () => {
    const existing = new Set(guideUpdates.map((g) => g.slug));
    for (const e of newExercises) expect(existing.has(e.slug)).toBe(false);
  });

  it.each(newExercises.map((e) => [e.slug, e] as const))("%s is complete", (_slug, e) => {
    expect(e.name.length).toBeGreaterThan(2);
    expect(CATEGORIES).toContain(e.category);
    expect(EQUIPMENT).toContain(e.equipment);
    expect(LEVELS).toContain(e.difficulty);
    expect(MUSCLE_GROUPS).toContain(e.muscleGroup);
    if (e.repUnit) expect(REP_UNITS).toContain(e.repUnit);
    expect(e.muscles.length).toBeGreaterThan(0);
    for (const m of e.muscles) expect(MUSCLES).toContain(m);
    expect(e.description.length).toBeGreaterThan(10);
    expect(e.benefits.length).toBeGreaterThan(10);
    expect(e.steps.length).toBeGreaterThanOrEqual(5);
    expect(e.steps.length).toBeLessThanOrEqual(7);
    expect(e.tips).toHaveLength(3);
    expect(e.mistakes.length).toBeGreaterThanOrEqual(3);
    expect(e.mistakes.length).toBeLessThanOrEqual(4);
    for (const m of e.mistakes) expect(m).toContain(":");
  });
});

describe("guide updates", () => {
  it("has unique slugs", () => {
    const slugs = guideUpdates.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(guideUpdates.map((g) => [g.slug, g] as const))("%s is complete", (_slug, g) => {
    expect(MUSCLE_GROUPS).toContain(g.muscleGroup);
    if (g.repUnit) expect(REP_UNITS).toContain(g.repUnit);
    expect(g.steps.length).toBeGreaterThanOrEqual(5);
    expect(g.steps.length).toBeLessThanOrEqual(7);
    expect(g.tips).toHaveLength(3);
    expect(g.mistakes.length).toBeGreaterThanOrEqual(3);
    expect(g.mistakes.length).toBeLessThanOrEqual(4);
    for (const m of g.mistakes) expect(m).toContain(":");
  });
});
