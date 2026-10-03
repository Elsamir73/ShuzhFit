export type WeeklyPlanProfile = {
  goalType?: string;
  experience?: string;
  daysPerWeek?: number;
  equipment?: string;
};

export type WeeklyPlanSession = {
  name: string;
  sets: string;
  reps: string;
  focus: string;
};

export type WeeklyPlanDay = {
  day: string;
  split: string;
  focus: string;
  sessions: WeeklyPlanSession[];
};

export type ProgressiveOverloadSuggestion = {
  incrementKg: number;
  suggestedWeightKg: number;
  note: string;
};

export function getProgressiveOverloadSuggestion(
  exerciseName: string,
  lastWeightKg?: number,
): ProgressiveOverloadSuggestion {
  const normalized = exerciseName.toLowerCase();
  const isLowerBody =
    /squat|deadlift|lunge|hinge|leg|split squat|romanian|rdl|goblet/.test(
      normalized,
    );
  const incrementKg = isLowerBody ? 5 : 2.5;
  const baseWeightKg = typeof lastWeightKg === "number" ? lastWeightKg : 0;
  const suggestedWeightKg = Number((baseWeightKg + incrementKg).toFixed(1));

  return {
    incrementKg,
    suggestedWeightKg,
    note: isLowerBody
      ? `Add ${incrementKg} kg on the next lower-body session.`
      : `Add ${incrementKg} kg on the next upper-body session.`,
  };
}

function buildUpperDay(
  goalType: string,
  experience: string,
): WeeklyPlanSession[] {
  const intensity = experience === "advanced" ? "heavy" : "controlled";

  return [
    {
      name: "Bench Press",
      sets: "4",
      reps: "6-8",
      focus: `${goalType === "fat-loss" ? "push power" : "upper-body strength"} • ${intensity}`,
    },
    {
      name: "One-Arm Dumbbell Row",
      sets: "3",
      reps: "8-10",
      focus: "Back control and scapular drive",
    },
    {
      name: "Overhead Press",
      sets: "3",
      reps: "8",
      focus: "Shoulder stability and lockout",
    },
  ];
}

function buildLowerDay(
  goalType: string,
  experience: string,
): WeeklyPlanSession[] {
  const intensity = experience === "advanced" ? "heavy" : "structured";

  return [
    {
      name: "Back Squat",
      sets: "4",
      reps: "6-8",
      focus: `${goalType === "fat-loss" ? "leg strength" : "full lower-body drive"} • ${intensity}`,
    },
    {
      name: "Romanian Deadlift",
      sets: "3",
      reps: "8",
      focus: "Hamstrings, glutes, and hip hinge control",
    },
    {
      name: "Walking Lunge",
      sets: "3",
      reps: "10 each leg",
      focus: "Balance, unilateral control, and leg drive",
    },
  ];
}

function buildPushDay(goalType: string): WeeklyPlanSession[] {
  return [
    {
      name: "Bench Press",
      sets: "4",
      reps: "6-8",
      focus: `${goalType === "fat-loss" ? "strength output" : "horizontal press"}`,
    },
    {
      name: "Incline Dumbbell Press",
      sets: "3",
      reps: "8-10",
      focus: "Upper chest and shoulder control",
    },
    {
      name: "Cable Pressdown",
      sets: "3",
      reps: "10-12",
      focus: "Triceps fatigue and lockout quality",
    },
  ];
}

function buildPullDay(goalType: string): WeeklyPlanSession[] {
  return [
    {
      name: "Lat Pulldown",
      sets: "4",
      reps: "8-10",
      focus: `${goalType === "fat-loss" ? "muscle retention" : "upper-back strength"}`,
    },
    {
      name: "Single-Arm Row",
      sets: "3",
      reps: "8-10",
      focus: "Lats, rear delts, and torso stability",
    },
    {
      name: "Face Pull",
      sets: "3",
      reps: "12-15",
      focus: "Shoulder health and posture",
    },
  ];
}

function buildLegsDay(goalType: string): WeeklyPlanSession[] {
  return [
    {
      name: "Goblet Squat",
      sets: "3",
      reps: "10",
      focus: `${goalType === "fat-loss" ? "leg drive" : "lower-body strength"}`,
    },
    {
      name: "Romanian Deadlift",
      sets: "3",
      reps: "8-10",
      focus: "Posterior chain and hip control",
    },
    {
      name: "Bulgarian Split Squat",
      sets: "3",
      reps: "8 each leg",
      focus: "Single-leg strength and balance",
    },
  ];
}

function buildFullBodyDay(
  goalType: string,
  equipment: string,
): WeeklyPlanSession[] {
  const gear = equipment.toLowerCase().includes("barbell")
    ? "barbell"
    : "compound";

  return [
    {
      name: "Barbell Squat",
      sets: "3",
      reps: "6-8",
      focus: `${goalType === "fat-loss" ? "leg strength" : "full-body drive"} • ${gear}`,
    },
    {
      name: "Bench Press",
      sets: "3",
      reps: "6-8",
      focus: "Upper-body power and pressing quality",
    },
    {
      name: "Deadlift",
      sets: "2",
      reps: "5-6",
      focus: "Posterior chain and total-body tension",
    },
  ];
}

export function generateWeeklyPlan(
  profile: WeeklyPlanProfile = {},
): WeeklyPlanDay[] {
  const goalType = profile.goalType ?? "strength";
  const experience = profile.experience ?? "beginner";
  const daysPerWeek = Math.min(6, Math.max(1, profile.daysPerWeek ?? 4));
  const equipment = profile.equipment ?? "barbell and dumbbells";

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let splitPattern: string[];

  if (daysPerWeek <= 3) {
    splitPattern = Array.from({ length: daysPerWeek }, () => "Full Body");
  } else if (daysPerWeek === 4) {
    splitPattern = ["Upper", "Lower", "Upper", "Lower"];
  } else {
    splitPattern = ["Push", "Pull", "Legs", "Push", "Pull", "Legs"].slice(
      0,
      daysPerWeek,
    );
  }

  return splitPattern.map((split, index) => {
    const dayName = dayNames[index] ?? `Day ${index + 1}`;

    const sessions =
      split === "Upper"
        ? buildUpperDay(goalType, experience)
        : split === "Lower"
          ? buildLowerDay(goalType, experience)
          : split === "Push"
            ? buildPushDay(goalType)
            : split === "Pull"
              ? buildPullDay(goalType)
              : split === "Legs"
                ? buildLegsDay(goalType)
                : buildFullBodyDay(goalType, equipment);

    const focusMap: Record<string, string> = {
      "Full Body": "High-skill work with a manageable total volume.",
      Upper: "Drive the top half of the body with controlled intensity.",
      Lower: "Prioritize leg strength, control, and full-body tension.",
      Push: "Pressing quality, shoulder control, and triceps output.",
      Pull: "Rows, lats, and posture-focused pulling strength.",
      Legs: "Lower-body power, stability, and bracing quality.",
    };

    return {
      day: dayName,
      split,
      focus: focusMap[split] ?? "Progressive overload and quality reps.",
      sessions,
    };
  });
}
