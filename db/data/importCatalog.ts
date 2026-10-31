import { guideUpdates } from "./guideUpdates.js";
import { newExercises } from "./newExercises.js";
import type { GuideUpdate, NewExercise } from "./exerciseTypes.js";

// Pure helpers (no database access) so they can be unit tested.

export interface NewExerciseRow {
  slug: string;
  name: string;
  category: string;
  muscles: string;
  equipment: string;
  difficulty: string;
  muscleGroup: string;
  repUnit: string;
  description: string;
  benefits: string;
  formGuide: string;
  mistakes: string;
  steps: string[];
  tips: string[];
  mistakesList: string[];
  isPublished: boolean;
}

export interface GuideRow {
  muscleGroup: string;
  repUnit: string;
  steps: string[];
  tips: string[];
  mistakesList: string[];
  formGuide: string;
  mistakes: string;
}

export function toNewRow(e: NewExercise): NewExerciseRow {
  return {
    slug: e.slug,
    name: e.name,
    category: e.category,
    muscles: e.muscles.join(", "),
    equipment: e.equipment,
    difficulty: e.difficulty,
    muscleGroup: e.muscleGroup,
    repUnit: e.repUnit ?? "reps",
    description: e.description,
    benefits: e.benefits,
    formGuide: e.steps.join(" "),
    mistakes: e.mistakes.join(" "),
    steps: [...e.steps],
    tips: [...e.tips],
    mistakesList: [...e.mistakes],
    isPublished: true,
  };
}

export function toGuideRow(g: GuideUpdate): GuideRow {
  return {
    muscleGroup: g.muscleGroup,
    repUnit: g.repUnit ?? "reps",
    steps: [...g.steps],
    tips: [...g.tips],
    mistakesList: [...g.mistakes],
    formGuide: g.steps.join(" "),
    mistakes: g.mistakes.join(" "),
  };
}

export const newRows: NewExerciseRow[] = newExercises.map(toNewRow);
export const guideRows: { slug: string; row: GuideRow }[] = guideUpdates.map((g) => ({
  slug: g.slug,
  row: toGuideRow(g),
}));
