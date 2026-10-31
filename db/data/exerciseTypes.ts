// Shared vocabulary for the exercise library import.
// The library page builds its filter dropdowns from the text stored in the database,
// so every value below is kept to ONE spelling. Add new values here first.

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "full_body",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLES = [
  "Chest",
  "Shoulders",
  "Triceps",
  "Biceps",
  "Forearms",
  "Back",
  "Lats",
  "Traps",
  "Rear delts",
  "Rotator cuff",
  "Core",
  "Obliques",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Inner thighs",
  "Outer thighs",
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const CATEGORIES = ["Push", "Pull", "Legs", "Glutes", "Core", "Prehab"] as const;
export type Category = (typeof CATEGORIES)[number];

export const EQUIPMENT = ["Cable machine", "Machine", "Dumbbells", "Bodyweight"] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const REP_UNITS = ["reps", "seconds", "meters"] as const;
export type RepUnit = (typeof REP_UNITS)[number];

/** A brand-new exercise that is inserted (or refreshed) by slug. */
export interface NewExercise {
  slug: string;
  name: string;
  category: Category;
  muscleGroup: MuscleGroup;
  muscles: readonly Muscle[];
  equipment: Equipment;
  difficulty: Level;
  repUnit?: RepUnit;
  /** One line shown on the library card. */
  description: string;
  benefits: string;
  /** 5-7 short steps, one action each. */
  steps: readonly string[];
  /** Exactly 3 coaching tips. */
  tips: readonly string[];
  /** 3-4 items written as "Problem: fix". */
  mistakes: readonly string[];
}

/** Guide content for an exercise that is already in the database. */
export interface GuideUpdate {
  slug: string;
  muscleGroup: MuscleGroup;
  repUnit?: RepUnit;
  steps: readonly string[];
  tips: readonly string[];
  mistakes: readonly string[];
}
