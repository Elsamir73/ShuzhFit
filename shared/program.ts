export type ProgramSplit = "full_body" | "upper_lower" | "ppl";

export interface PlanExerciseChoice {
  id: number;
  name: string;
  equipment: string | null;
  level: string | null;
  muscles: string | null;
}

export interface GeneratedPlanDay {
  dayIndex: number;
  weekday: number;
  name: string;
  exercises: Array<PlanExerciseChoice & { position: number; targetSets: number; repMin: number; repMax: number }>;
}

const weekdaysByCount: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

export function chooseProgramSplit(daysPerWeek: number): ProgramSplit {
  return daysPerWeek <= 3 ? "full_body" : daysPerWeek === 4 ? "upper_lower" : "ppl";
}

export function filterPlanExercises(
  candidates: readonly PlanExerciseChoice[],
  equipment: string,
  experience: string,
): PlanExerciseChoice[] {
  const equipmentMatches = (value: string | null): boolean => {
    const normalized = (value ?? "").toLowerCase();
    if (equipment === "gym") return true;
    if (equipment === "bodyweight") return normalized.includes("bodyweight") || normalized.includes("none");
    return normalized.includes("bodyweight") || normalized.includes("dumbbell") || normalized.includes("kettlebell");
  };
  const levelRank = (value: string | null): number => {
    const normalized = (value ?? "beginner").toLowerCase();
    return normalized === "beginner" ? 0 : normalized === "intermediate" ? 1 : 2;
  };
  const maxRank = experience === "beginner" ? 1 : experience === "intermediate" ? 2 : 3;
  return candidates.filter((item) => equipmentMatches(item.equipment) && levelRank(item.level) <= maxRank);
}

export function generateProgramDays(
  candidates: readonly PlanExerciseChoice[],
  options: { daysPerWeek: number; equipment: string; experience: string },
): { split: ProgramSplit; days: GeneratedPlanDay[] } {
  const weekdays = weekdaysByCount[options.daysPerWeek] ?? weekdaysByCount[3];
  const split = chooseProgramSplit(weekdays.length);
  const available = filterPlanExercises(candidates, options.equipment, options.experience);
  if (available.length < 4) throw new Error("At least four exercises match the selected equipment and experience.");
  const count = Math.max(4, Math.min(6, Math.floor(available.length / weekdays.length)));
  const targetSets = options.experience === "beginner" ? 3 : 4;
  const [repMin, repMax] = options.experience === "beginner" ? [8, 12] : options.experience === "intermediate" ? [6, 10] : [5, 8];
  const labels = split === "full_body" ? weekdays.map(() => "Full Body")
    : split === "upper_lower" ? weekdays.map((_, index) => index % 2 === 0 ? "Upper Body" : "Lower Body")
      : weekdays.map((_, index) => ["Push", "Pull", "Legs"][index % 3]);
  const days = weekdays.map((weekday, dayIndex) => ({
    dayIndex,
    weekday,
    name: labels[dayIndex] ?? "Training",
    exercises: Array.from({ length: count }, (_, position) => {
      const choice = available[(dayIndex * count + position) % available.length]!;
      return { ...choice, position, targetSets, repMin, repMax };
    }),
  }));
  return { split, days };
}
