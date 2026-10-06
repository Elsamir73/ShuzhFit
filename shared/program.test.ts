import { describe, expect, it } from "vitest";
import { generateProgramDays, type PlanExerciseChoice } from "./program.js";

const choices: PlanExerciseChoice[] = [
  { id: 1, name: "Squat", equipment: "Barbell", level: "Beginner", muscles: "Quads", muscleGroup: "legs" },
  { id: 2, name: "Lunge", equipment: "Dumbbells", level: "Intermediate", muscles: "Glutes", muscleGroup: "legs" },
  { id: 3, name: "Deadlift", equipment: "Barbell", level: "Advanced", muscles: "Hamstrings", muscleGroup: "legs" },
  { id: 4, name: "Hip thrust", equipment: "Bodyweight", level: "Beginner", muscles: "Glutes", muscleGroup: "legs" },
  { id: 5, name: "Bench press", equipment: "Barbell", level: "Beginner", muscles: "Chest", muscleGroup: "chest" },
  { id: 6, name: "Push-up", equipment: "Bodyweight", level: "Beginner", muscles: "Chest", muscleGroup: "chest" },
  { id: 7, name: "Shoulder press", equipment: "Dumbbells", level: "Intermediate", muscles: "Shoulders", muscleGroup: "shoulders" },
  { id: 8, name: "Curl", equipment: "Dumbbells", level: "Beginner", muscles: "Arms", muscleGroup: "arms" },
  { id: 9, name: "Row", equipment: "Dumbbells", level: "Beginner", muscles: "Back", muscleGroup: "back" },
  { id: 10, name: "Pulldown", equipment: "Cable machine", level: "Intermediate", muscles: "Back", muscleGroup: "back" },
  { id: 11, name: "Pull-up", equipment: "Bodyweight", level: "Advanced", muscles: "Back", muscleGroup: "back" },
  { id: 12, name: "Plank", equipment: "Bodyweight", level: "Beginner", muscles: "Abs", muscleGroup: "core", repUnit: "seconds" },
  { id: 13, name: "Inverted row", equipment: "Bodyweight", level: "Beginner", muscles: "Back", muscleGroup: "back" },
];

describe("generateProgramDays", () => {
  it.each([2, 3, 4, 5, 6])("uses distinct weekdays for %i training days", (daysPerWeek) => {
    const result = generateProgramDays(choices, { daysPerWeek, equipment: "gym", experience: "advanced" });
    expect(new Set(result.days.map((day) => day.weekday)).size).toBe(daysPerWeek);
  });
  it("keeps legs off upper, push and pull days, and upper off lower days", () => {
    for (const daysPerWeek of [4, 5, 6]) {
      const { days } = generateProgramDays(choices, { daysPerWeek, equipment: "gym", experience: "advanced" });
      for (const day of days) {
        const groups = day.exercises.map((exercise) => exercise.muscleGroup);
        if (["Upper Body", "Push", "Pull"].includes(day.name)) expect(groups).not.toContain("legs");
        if (["Lower Body", "Legs"].includes(day.name)) expect(groups).not.toContain("chest");
      }
    }
  });
  it.each(["gym", "home_dumbbells", "bodyweight"]) ("filters available equipment for %s", (equipment) => {
    const { days } = generateProgramDays(choices, { daysPerWeek: 3, equipment, experience: "beginner" });
    expect(days.flatMap((day) => day.exercises).every((exercise) => equipment === "gym" || exercise.equipment === "Bodyweight" || (equipment === "home_dumbbells" && exercise.equipment === "Dumbbells"))).toBe(true);
  });
  it.each(["beginner", "intermediate", "advanced"]) ("respects %s experience level", (experience) => {
    const { days } = generateProgramDays(choices, { daysPerWeek: 3, equipment: "gym", experience });
    expect(days.flatMap((day) => day.exercises).every((exercise) => experience === "advanced" || exercise.level !== "Advanced")).toBe(true);
  });
});
