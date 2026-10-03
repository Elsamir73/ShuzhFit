import {
  boolean,
  date,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    bio: text("bio"),
    role: userRoleEnum("role").notNull().default("user"),
    sex: varchar("sex", { length: 20 }),
    heightCm: integer("height_cm"),
    ageYears: integer("age_years"),
    goalType: varchar("goal_type", { length: 80 }),
    experience: varchar("experience", { length: 30 }),
    daysPerWeek: integer("days_per_week"),
    equipmentPreference: varchar("equipment_preference", { length: 40 }),
    equipment: varchar("equipment", { length: 40 }),
    activityLevel: decimal("activity_level", { precision: 4, scale: 3 }),
    weeklyWorkoutTarget: integer("weekly_workout_target").notNull().default(3),
    targetWeightKg: decimal("target_weight_kg", { precision: 6, scale: 2 }),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  }),
);

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 64 }).notNull(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIpUnique: uniqueIndex("login_attempts_email_ip_unique").on(table.email, table.ipAddress),
  lockedIdx: index("login_attempts_locked_idx").on(table.lockedUntil),
}));

export const blogs = pgTable(
  "blogs",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 180 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    authorName: varchar("author_name", { length: 120 }).default("ShuzhFit"),
    category: varchar("category", { length: 80 }),
    imageUrl: varchar("image_url", { length: 255 }),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    publishedIdx: index("blogs_published_idx").on(table.isPublished),
  }),
);

export const exercises = pgTable(
  "exercises",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 180 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    category: varchar("category", { length: 120 }),
    muscles: text("muscles"),
    equipment: varchar("equipment", { length: 120 }),
    difficulty: varchar("difficulty", { length: 60 }),
    description: text("description"),
    benefits: text("benefits"),
    formGuide: text("form_guide"),
    mistakes: text("mistakes"),
    youtubeUrl: varchar("youtube_url", { length: 255 }),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    publishedIdx: index("exercises_published_idx").on(table.isPublished),
  }),
);

export const videos = pgTable(
  "videos",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 220 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull().unique(),
    youtubeUrl: varchar("youtube_url", { length: 255 }).notNull(),
    exerciseId: integer("exercise_id").references(() => exercises.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    exerciseIdx: index("videos_exercise_idx").on(table.exerciseId),
  }),
);

export const contentComments = pgTable(
  "content_comments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    authorName: varchar("author_name", { length: 120 }).notNull(),
    message: text("message").notNull(),
    itemType: varchar("item_type", { length: 40 }).notNull(),
    itemId: integer("item_id").notNull(),
    itemSlug: varchar("item_slug", { length: 180 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    itemIdx: index("comments_item_idx").on(table.itemType, table.itemId),
    userIdx: index("comments_user_idx").on(table.userId),
  }),
);

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userFavorites = pgTable(
  "user_favorites",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemType: varchar("item_type", { length: 40 }).notNull(),
    itemId: integer("item_id").notNull(),
    itemSlug: varchar("item_slug", { length: 180 }),
    itemTitle: varchar("item_title", { length: 220 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    favoritePk: primaryKey({
      columns: [table.userId, table.itemType, table.itemId],
    }),
    userIdx: index("favorites_user_idx").on(table.userId),
  }),
);

export const workoutLogs = pgTable(
  "workout_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workoutId: integer("workout_id").references(() => workouts.id, {
      onDelete: "set null",
    }),
    exerciseName: varchar("exercise_name", { length: 200 }).notNull(),
    logDate: date("log_date", { mode: "date" }).notNull().defaultNow(),
    workoutType: varchar("workout_type", { length: 80 }),
    durationMinutes: integer("duration_minutes"),
    sets: integer("sets").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    weightKg: decimal("weight_kg", { precision: 6, scale: 2 }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userDateIdx: index("workout_logs_user_date_idx").on(
      table.userId,
      table.logDate,
    ),
  }),
);

export const progressEntries = pgTable(
  "progress_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date", { mode: "date" }).notNull(),
    weightKg: decimal("weight_kg", { precision: 6, scale: 2 }),
    bodyFatPct: decimal("body_fat_pct", { precision: 4, scale: 1 }),
    waistCm: decimal("waist_cm", { precision: 5, scale: 1 }),
    goal: text("goal"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userDateIdx: index("progress_entries_user_date_idx").on(
      table.userId,
      table.date,
    ),
  }),
);

export const workouts = pgTable(
  "workouts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    status: varchar("status", { length: 40 }).notNull().default("in_progress"),
    workoutDate: date("workout_date", { mode: "date" }).notNull().defaultNow(),
    programDayId: integer("program_day_id"),
    durationSeconds: integer("duration_seconds").default(0),
    notes: text("notes"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userStatusIdx: index("workouts_user_status_idx").on(
      table.userId,
      table.status,
    ),
    userDateIdx: index("workouts_user_date_idx").on(table.userId, table.workoutDate),
    oneInProgressIdx: uniqueIndex("workouts_one_in_progress_per_user_unique")
      .on(table.userId)
      .where(sql`${table.status} = 'in_progress'`),
  }),
);

export const workoutSets = pgTable(
  "workout_sets",
  {
    id: serial("id").primaryKey(),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id").references(() => exercises.id, {
      onDelete: "set null",
    }),
    exerciseName: varchar("exercise_name", { length: 200 }).notNull(),
    setNumber: integer("set_number").notNull().default(0),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    reps: integer("reps").notNull().default(0),
    weightKg: decimal("weight_kg", { precision: 6, scale: 2 }),
    rpe: decimal("rpe", { precision: 3, scale: 1 }),
    isWarmup: boolean("is_warmup").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workoutIdx: index("workout_sets_workout_idx").on(table.workoutId),
    userWorkoutIdx: index("workout_sets_user_workout_idx").on(table.userId, table.workoutId),
  }),
);

export const foodLogs = pgTable(
  "food_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    calories: integer("calories").notNull().default(0),
    proteinG: decimal("protein_g", { precision: 5, scale: 1 }),
    carbsG: decimal("carbs_g", { precision: 5, scale: 1 }),
    fatG: decimal("fat_g", { precision: 5, scale: 1 }),
    mealType: varchar("meal_type", { length: 40 }),
    logDate: date("log_date", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userDateIdx: index("food_logs_user_date_idx").on(
      table.userId,
      table.logDate,
    ),
  }),
);

export const savedFoods = pgTable(
  "saved_foods",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    calories: integer("calories").notNull().default(0),
    proteinG: decimal("protein_g", { precision: 5, scale: 1 }),
    carbsG: decimal("carbs_g", { precision: 5, scale: 1 }),
    fatG: decimal("fat_g", { precision: 5, scale: 1 }),
    timesUsed: integer("times_used").notNull().default(0),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userNameIdx: uniqueIndex("saved_foods_user_name_unique").on(
      table.userId,
      table.name,
    ),
  }),
);

export const waterLogs = pgTable(
  "water_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ounces: integer("ounces").notNull().default(0),
    glasses: integer("glasses").notNull().default(0),
    logDate: date("log_date", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userDateIdx: uniqueIndex("water_logs_user_date_unique").on(
      table.userId,
      table.logDate,
    ),
  }),
);

export const userGoals = pgTable(
  "user_goals",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    metric: varchar("metric", { length: 40 }).notNull(),
    targetValue: decimal("target_value", { precision: 8, scale: 2 }),
    currentValue: decimal("current_value", { precision: 8, scale: 2 }),
    unit: varchar("unit", { length: 40 }),
    exerciseName: varchar("exercise_name", { length: 200 }),
    deadline: date("deadline", { mode: "date" }),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    achievedAt: timestamp("achieved_at", { withTimezone: true }),
    dueDate: date("due_date", { mode: "date" }),
    isAchieved: boolean("is_achieved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("user_goals_user_idx").on(table.userId),
  }),
);

export const userFavoritesRelations = {} as const;
export const userGoalsRelations = {} as const;

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  split: varchar("split", { length: 30 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const programDays = pgTable("program_days", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  dayIndex: integer("day_index").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  weekday: integer("weekday"),
});

export const programDayExercises = pgTable("program_day_exercises", {
  id: serial("id").primaryKey(),
  programDayId: integer("program_day_id").notNull().references(() => programDays.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  targetSets: integer("target_sets").notNull(),
  repMin: integer("rep_min").notNull(),
  repMax: integer("rep_max").notNull(),
});

export const commonFoods = pgTable("common_foods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  calories: integer("calories").notNull(),
  proteinG: decimal("protein_g", { precision: 5, scale: 1 }).notNull(),
  carbsG: decimal("carbs_g", { precision: 5, scale: 1 }).notNull(),
  fatG: decimal("fat_g", { precision: 5, scale: 1 }).notNull(),
  isEstimate: boolean("is_estimate").notNull().default(true),
});

export const userInsightActions = pgTable("user_insight_actions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  insightId: varchar("insight_id", { length: 50 }).notNull(),
  decision: varchar("decision", { length: 20 }).notNull(),
  calorieDelta: integer("calorie_delta").notNull().default(0),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueDecision: uniqueIndex("user_insight_actions_user_id_unique").on(table.userId, table.insightId),
  userDateIdx: index("user_insight_actions_user_date_idx").on(table.userId, table.decidedAt),
}));
