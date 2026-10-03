export interface DemoWorkoutEntry {
  id: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number;
  note: string;
  createdAt: string;
}

export interface DemoNutritionEntry {
  id: string;
  meal: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export interface DemoProgressEntry {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct: number;
  waistCm: number;
  notes: string;
  createdAt: string;
}

export interface DemoUserProfile {
  name: string;
  email: string;
  goalType: string;
  targetWeightKg: number;
  weeklyWorkoutTarget: number;
  heightCm: number;
  sex: string;
}

export const demoTrackerStore = {
  workouts: [
    {
      id: "demo-workout-1",
      exerciseName: "Barbell Back Squat",
      sets: 4,
      reps: 6,
      weightKg: 72,
      note: "Strong lower-body day",
      createdAt: new Date().toISOString(),
    },
  ],
  nutrition: [
    {
      id: "demo-nutrition-1",
      meal: "Chicken rice bowl",
      calories: 620,
      protein: 42,
      carbs: 58,
      fat: 18,
      createdAt: new Date().toISOString(),
    },
  ],
  progress: [
    {
      id: "demo-progress-1",
      date: new Date().toISOString().slice(0, 10),
      weightKg: 76.4,
      bodyFatPct: 18.3,
      waistCm: 83.5,
      notes: "Recovered well this week.",
      createdAt: new Date().toISOString(),
    },
  ],
  profile: {
    name: "ShuzhFit Member",
    email: "member@shuzhfit.com",
    goalType: "fat-loss",
    targetWeightKg: 73,
    weeklyWorkoutTarget: 4,
    heightCm: 178,
    sex: "male",
  },
};

export function readBody(req: any) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
}
