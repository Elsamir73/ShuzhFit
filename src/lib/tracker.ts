import { getCurrentUser, setCurrentUser } from "./auth";

export interface WorkoutEntry {
  id: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number;
  note: string;
  createdAt: string;
}

export interface NutritionEntry {
  id: string;
  meal: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export interface ProgressEntry {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct: number;
  waistCm: number;
  notes: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  goalType: string;
  targetWeightKg: number;
  weeklyWorkoutTarget: number;
  heightCm: number;
  sex: string;
  age: number;
  experience: string;
  daysPerWeek: number;
  equipment: string;
  weightKg: number;
}

const STORAGE_PREFIX = "shuzhfit_tracker_";

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getWorkoutEntries(): WorkoutEntry[] {
  const user = getCurrentUser();
  if (!user) {
    return [];
  }

  const all = readStorage<WorkoutEntry[]>(`${STORAGE_PREFIX}workouts`, []);
  return [...all].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function loadWorkoutEntriesFromServer(): Promise<WorkoutEntry[]> {
  try {
    const response = await fetch("/api/tracker/workouts", {
      credentials: "same-origin",
    });

    if (!response.ok) {
      return getWorkoutEntries();
    }

    const data = (await response.json()) as WorkoutEntry[];
    if (Array.isArray(data)) {
      writeStorage(`${STORAGE_PREFIX}workouts`, data);
      return data;
    }
  } catch {
    // Fall back to local storage data when the API route is unavailable.
  }

  return getWorkoutEntries();
}

export function addWorkoutEntry(entry: Omit<WorkoutEntry, "id" | "createdAt">) {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }

  const current = getWorkoutEntries();
  const record: WorkoutEntry = {
    id: crypto.randomUUID(),
    ...entry,
    createdAt: new Date().toISOString(),
  };

  const next = [record, ...current];
  writeStorage(`${STORAGE_PREFIX}workouts`, next);
  return record;
}

export async function saveWorkoutEntryToServer(
  entry: Omit<WorkoutEntry, "id" | "createdAt">,
): Promise<WorkoutEntry | null> {
  try {
    const response = await fetch("/api/tracker/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      return addWorkoutEntry(entry);
    }

    const record = (await response.json()) as WorkoutEntry;
    if (record) {
      const current = getWorkoutEntries();
      const next = [record, ...current.filter((item) => item.id !== record.id)];
      writeStorage(`${STORAGE_PREFIX}workouts`, next);
      return record;
    }
  } catch {
    return addWorkoutEntry(entry);
  }

  return addWorkoutEntry(entry);
}

export async function loadNutritionEntriesFromServer(): Promise<
  NutritionEntry[]
> {
  try {
    const response = await fetch("/api/tracker/nutrition", {
      credentials: "same-origin",
    });

    if (!response.ok) {
      return getNutritionEntries();
    }

    const data = (await response.json()) as NutritionEntry[];
    if (Array.isArray(data)) {
      writeStorage(`${STORAGE_PREFIX}nutrition`, data);
      return data;
    }
  } catch {
    // Fall back to local storage data when the API route is unavailable.
  }

  return getNutritionEntries();
}

export function getNutritionEntries(): NutritionEntry[] {
  const user = getCurrentUser();
  if (!user) {
    return [];
  }

  const all = readStorage<NutritionEntry[]>(`${STORAGE_PREFIX}nutrition`, []);
  return [...all].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function addNutritionEntry(
  entry: Omit<NutritionEntry, "id" | "createdAt">,
) {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }

  const record: NutritionEntry = {
    id: crypto.randomUUID(),
    ...entry,
    createdAt: new Date().toISOString(),
  };

  const next = [record, ...getNutritionEntries()];
  writeStorage(`${STORAGE_PREFIX}nutrition`, next);
  return record;
}

export async function saveNutritionEntryToServer(
  entry: Omit<NutritionEntry, "id" | "createdAt">,
): Promise<NutritionEntry | null> {
  try {
    const response = await fetch("/api/tracker/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      return addNutritionEntry(entry);
    }

    const record = (await response.json()) as NutritionEntry;
    if (record) {
      const current = getNutritionEntries();
      const next = [record, ...current.filter((item) => item.id !== record.id)];
      writeStorage(`${STORAGE_PREFIX}nutrition`, next);
      return record;
    }
  } catch {
    return addNutritionEntry(entry);
  }

  return addNutritionEntry(entry);
}

export async function loadProgressEntriesFromServer(): Promise<
  ProgressEntry[]
> {
  try {
    const response = await fetch("/api/tracker/progress", {
      credentials: "same-origin",
    });

    if (!response.ok) {
      return getProgressEntries();
    }

    const data = (await response.json()) as ProgressEntry[];
    if (Array.isArray(data)) {
      writeStorage(`${STORAGE_PREFIX}progress`, data);
      return data;
    }
  } catch {
    // Fall back to local storage data when the API route is unavailable.
  }

  return getProgressEntries();
}

export function getProgressEntries(): ProgressEntry[] {
  const user = getCurrentUser();
  if (!user) {
    return [];
  }

  const all = readStorage<ProgressEntry[]>(`${STORAGE_PREFIX}progress`, []);
  return [...all].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function addProgressEntry(
  entry: Omit<ProgressEntry, "id" | "createdAt">,
) {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }

  const record: ProgressEntry = {
    id: crypto.randomUUID(),
    ...entry,
    createdAt: new Date().toISOString(),
  };

  const next = [record, ...getProgressEntries()];
  writeStorage(`${STORAGE_PREFIX}progress`, next);
  return record;
}

export async function saveProgressEntryToServer(
  entry: Omit<ProgressEntry, "id" | "createdAt">,
): Promise<ProgressEntry | null> {
  try {
    const response = await fetch("/api/tracker/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      return addProgressEntry(entry);
    }

    const record = (await response.json()) as ProgressEntry;
    if (record) {
      const current = getProgressEntries();
      const next = [record, ...current.filter((item) => item.id !== record.id)];
      writeStorage(`${STORAGE_PREFIX}progress`, next);
      return record;
    }
  } catch {
    return addProgressEntry(entry);
  }

  return addProgressEntry(entry);
}

export function getUserProfile(): UserProfile {
  const current = getCurrentUser();
  const fallback: UserProfile = {
    name: current?.name ?? "ShuzhFit Member",
    email: current?.email ?? "member@shuzhfit.com",
    goalType: "fat-loss",
    targetWeightKg: 73,
    weeklyWorkoutTarget: 4,
    heightCm: 178,
    sex: "male",
    age: 30,
    experience: "beginner",
    daysPerWeek: 4,
    equipment: "barbell and dumbbells",
    weightKg: 78.5,
  };

  const storage = readStorage<UserProfile | null>(
    `${STORAGE_PREFIX}profile`,
    null,
  );
  return {
    ...fallback,
    ...(storage ?? {}),
  };
}

export function saveUserProfile(
  next: Partial<UserProfile>,
): UserProfile | null {
  const current = getCurrentUser();
  if (!current) {
    return null;
  }

  const merged = { ...getUserProfile(), ...next };
  writeStorage(`${STORAGE_PREFIX}profile`, merged);

  const updatedUser = {
    ...current,
    name: merged.name,
    email: merged.email,
  };
  setCurrentUser(updatedUser);

  return merged;
}

export async function loadUserProfileFromServer(): Promise<UserProfile> {
  try {
    const response = await fetch("/api/tracker/profile", {
      credentials: "same-origin",
    });

    if (!response.ok) {
      return getUserProfile();
    }

    const profile = (await response.json()) as UserProfile;
    if (profile) {
      writeStorage(`${STORAGE_PREFIX}profile`, profile);
      return profile;
    }
  } catch {
    // Fall back to the browser cache when the API route is unavailable.
  }

  return getUserProfile();
}

export async function saveUserProfileToServer(
  next: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    const response = await fetch("/api/tracker/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(next),
    });

    if (!response.ok) {
      return saveUserProfile(next);
    }

    const profile = (await response.json()) as UserProfile;
    if (profile) {
      writeStorage(`${STORAGE_PREFIX}profile`, profile);
      const current = getCurrentUser();
      if (current) {
        setCurrentUser({
          ...current,
          name: profile.name,
          email: profile.email,
        });
      }
      return profile;
    }
  } catch {
    return saveUserProfile(next);
  }

  return saveUserProfile(next);
}
