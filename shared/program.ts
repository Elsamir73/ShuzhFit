export type ProgramSplit = "full_body" | "upper_lower" | "ppl";

export interface PlanExerciseChoice {
  id: number;
  name: string;
  equipment: string | null;
  level: string | null;
  muscles: string | null;
  muscleGroup?: string | null;
  category?: string | null;
  repUnit?: string | null;
}

export interface GeneratedPlanDay {
  dayIndex: number;
  weekday: number;
  name: string;
  exercises: Array<PlanExerciseChoice & { position: number; targetSets: number; repMin: number; repMax: number }>;
}

const weekdaysByCount: Record<number, number[]> = {
  2: [1, 5], 3: [0, 2, 4], 4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5],
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
  const maxRank = experience === "beginner" ? 0 : experience === "intermediate" ? 1 : 2;
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
  const labels = split === "full_body" ? weekdays.map(() => "Full Body")
    : split === "upper_lower" ? weekdays.map((_, index) => index % 2 === 0 ? "Upper Body" : "Lower Body")
      : weekdays.map((_, index) => ["Push", "Pull", "Legs"][index % 3]);
  const group = (exercise: PlanExerciseChoice): string => {
    const declared = exercise.muscleGroup?.toLowerCase();
    if (declared) return declared;
    const text = `${exercise.category ?? ""} ${exercise.muscles ?? ""} ${exercise.name}`.toLowerCase();
    if (/leg|quad|hamstring|glute|calf|squat|lunge/.test(text)) return "legs";
    if (/chest|push|tricep|shoulder|press|dip/.test(text)) return "push";
    if (/back|lat|bicep|pull|row|chin/.test(text)) return "pull";
    if (/core|abs|plank|hollow|carry/.test(text)) return "core";
    return "full_body";
  };
  const bucket = (names: readonly string[]) => available.filter((item) => names.includes(group(item)));
  const push = bucket(["chest", "shoulders", "arms", "push"]);
  const pull = bucket(["back", "arms", "pull"]);
  const legs = bucket(["legs", "glutes"]);
  const core = bucket(["core"]);
  if (!push.length || !pull.length || !legs.length) throw new Error("Add at least one push, pull and leg exercise for this plan.");
  const pick = (pool: PlanExerciseChoice[], day: number, slot: number) => pool[(day + slot) % pool.length]!;
  const targetFor = (exercise: PlanExerciseChoice) => exercise.repUnit === "seconds" ? [30, 45] : exercise.repUnit === "meters" ? [20, 40] : /isolation|raise|curl|extension|fly/i.test(`${exercise.category ?? ""} ${exercise.name}`) ? [10, 15] : options.experience === "beginner" ? [8, 12] : [6, 10];
  const setsFor = (exercise: PlanExerciseChoice) => exercise.repUnit === "reps" && /isolation|raise|curl|extension|fly/i.test(`${exercise.category ?? ""} ${exercise.name}`) ? 3 : exercise.repUnit === "reps" && options.experience !== "beginner" ? 4 : 3;
  const days = weekdays.map((weekday, dayIndex) => ({
    dayIndex,
    weekday,
    name: labels[dayIndex] ?? "Training",
    exercises: (() => {
      const label = labels[dayIndex] ?? "Full Body";
      const slots = label === "Upper Body" ? [pick(push, dayIndex, 0), pick(push, dayIndex + 1, 1), pick(pull, dayIndex, 2), pick(pull, dayIndex + 1, 3), ...(bucket(["arms"]).length ? [pick(bucket(["arms"]), dayIndex, 4)] : [])]
        : label === "Lower Body" || label === "Legs" ? [pick(legs, dayIndex, 0), pick(legs, dayIndex + 1, 1), pick(legs, dayIndex + 2, 2), pick(legs, dayIndex + 3, 3), ...(core.length ? [pick(core, dayIndex, 4)] : [])]
          : label === "Push" ? [pick(push, dayIndex, 0), pick(push, dayIndex + 1, 1), pick(push, dayIndex + 2, 2)]
            : label === "Pull" ? [pick(pull, dayIndex, 0), pick(pull, dayIndex + 1, 1), pick(pull, dayIndex + 2, 2)]
              : label === "Legs" ? [pick(legs, dayIndex, 0), pick(legs, dayIndex + 1, 1), pick(legs, dayIndex + 2, 2)]
                : [pick(legs, dayIndex, 0), pick(push, dayIndex, 1), pick(pull, dayIndex, 2), pick(legs, dayIndex + 1, 3), ...(core.length ? [pick(core, dayIndex, 4)] : [])];
      return slots.map((choice, position) => { const [repMin, repMax] = targetFor(choice); return { ...choice, position, targetSets: setsFor(choice), repMin, repMax }; });
    })(),
  }));
  return { split, days };
}
