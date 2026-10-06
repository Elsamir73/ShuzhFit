import { and, asc, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { calculateFitnessMetrics, calculateGoalProgressToward, calculateStreak, type FitnessGoal } from "../../shared/fitness.js";
import { getTodayInsights } from "../lib/insights.js";
import { requireAuth, parseBody, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../lib/http.js";
import { sql } from "drizzle-orm";

const quickLogSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("workout"), workoutType: z.string().trim().min(1).max(80), durationMinutes: z.number().int().min(1).max(1440), exercise: z.string().trim().max(200).optional(), notes: z.string().trim().max(1000).optional() }),
  z.object({ type: z.literal("weight"), weightKg: z.number().min(30).max(350), waistCm: z.number().min(20).max(250).optional() }),
  z.object({ type: z.literal("water"), glasses: z.number().int().min(1).max(20) }),
  z.object({ type: z.literal("insight"), insightId: z.enum(["shorter-workout", "calorie-adjustment"]), decision: z.enum(["accepted", "dismissed"]), calorieDelta: z.number().int().min(-500).max(500).default(0) }),
]);

const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const asNumber = (value: string | number | null | undefined, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const dateKey = (value: Date | string) => (value instanceof Date ? value.toISOString() : value).slice(0, 10);
const plusDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};
const asDate = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (req.method === "POST" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  const user = await requireAuth(req, res);
  if (!user) return;
  const userId = Number(user.id);

  try {
    const [{ db }, schema] = await Promise.all([import("../../db/index.js"), import("../../db/schema.js")]);
    const today = asDate(new Date());
    const todayIso = dateKey(today);
    if (req.method === "POST") {
      const input = parseBody(quickLogSchema, req.body);
      if (!input) {
        sendError(res, 400, "INVALID_INPUT", "The quick log details are invalid.");
        return;
      }
      if (input.type === "weight") {
        await db.insert(schema.progressEntries).values({ userId, date: today, weightKg: String(input.weightKg), waistCm: input.waistCm === undefined ? null : String(input.waistCm) });
      } else if (input.type === "water") {
        await db.insert(schema.waterLogs).values({ userId, logDate: today, glasses: input.glasses })
          .onConflictDoUpdate({ target: [schema.waterLogs.userId, schema.waterLogs.logDate], set: { glasses: sql`${schema.waterLogs.glasses} + ${input.glasses}` } });
      } else if (input.type === "insight") {
        await db.insert(schema.userInsightActions).values({ userId, insightId: input.insightId, decision: input.decision, calorieDelta: input.calorieDelta })
          .onConflictDoUpdate({ target: [schema.userInsightActions.userId, schema.userInsightActions.insightId], set: { decision: input.decision, calorieDelta: input.calorieDelta, decidedAt: new Date() } });
      } else {
        await db.insert(schema.workoutLogs).values({ userId, logDate: today, workoutType: input.workoutType, durationMinutes: input.durationMinutes, exerciseName: input.exercise || input.workoutType, note: input.notes || null });
      }
      res.status(201).json({ success: true });
      return;
    }

    const [userProfile] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!userProfile) {
      sendError(res, 401, "UNAUTHORIZED", "Please sign in to continue.");
      return;
    }
    const monday = plusDays(today, -((today.getUTCDay() + 6) % 7));
    const twoWeeksAgo = plusDays(today, -13);
    const [program] = await db.select().from(schema.programs).where(and(eq(schema.programs.userId, userId), eq(schema.programs.isActive, true))).limit(1);
    const plannedDays = program
      ? await db.select().from(schema.programDays).where(eq(schema.programDays.programId, program.id)).orderBy(asc(schema.programDays.dayIndex))
      : [];
    const todayWeekday = (today.getUTCDay() + 6) % 7;
    const todayProgramDay = plannedDays.find((day) => day.weekday === todayWeekday);
    const plannedExercises = todayProgramDay
      ? await db.select({ id: schema.exercises.id, name: schema.exercises.name, muscles: schema.exercises.muscles, equipment: schema.exercises.equipment, repUnit: schema.exercises.repUnit, targetSets: schema.programDayExercises.targetSets, repMin: schema.programDayExercises.repMin, repMax: schema.programDayExercises.repMax })
        .from(schema.programDayExercises).innerJoin(schema.exercises, eq(schema.programDayExercises.exerciseId, schema.exercises.id))
        .where(eq(schema.programDayExercises.programDayId, todayProgramDay.id)).orderBy(asc(schema.programDayExercises.position))
      : [];
    const [inProgress] = await db.select({ id: schema.workouts.id, name: schema.workouts.name, startedAt: schema.workouts.startedAt })
      .from(schema.workouts).where(and(eq(schema.workouts.userId, userId), eq(schema.workouts.status, "in_progress"))).orderBy(desc(schema.workouts.startedAt)).limit(1);

    const [workouts, quickLogs, progress, foods, goals, initialWeights, latestWeights, water, decisions] = await Promise.all([
      db.select({ id: schema.workouts.id, name: schema.workouts.name, status: schema.workouts.status, workoutDate: schema.workouts.workoutDate })
        .from(schema.workouts).where(and(eq(schema.workouts.userId, userId), gte(schema.workouts.workoutDate, plusDays(today, -365)))),
      db.select({ logDate: schema.workoutLogs.logDate, workoutType: schema.workoutLogs.workoutType, durationMinutes: schema.workoutLogs.durationMinutes })
        .from(schema.workoutLogs).where(and(eq(schema.workoutLogs.userId, userId), gte(schema.workoutLogs.logDate, plusDays(today, -365)))),
      db.select({ date: schema.progressEntries.date, weightKg: schema.progressEntries.weightKg })
        .from(schema.progressEntries).where(and(eq(schema.progressEntries.userId, userId), gte(schema.progressEntries.date, twoWeeksAgo))).orderBy(desc(schema.progressEntries.date)).limit(30),
      db.select({ calories: schema.foodLogs.calories, proteinG: schema.foodLogs.proteinG }).from(schema.foodLogs)
        .where(and(eq(schema.foodLogs.userId, userId), eq(schema.foodLogs.logDate, today))),
      db.select().from(schema.userGoals).where(and(eq(schema.userGoals.userId, userId), eq(schema.userGoals.status, "active"))),
      db.select({ date: schema.progressEntries.date, weightKg: schema.progressEntries.weightKg }).from(schema.progressEntries)
        .where(and(eq(schema.progressEntries.userId, userId), sql`${schema.progressEntries.weightKg} IS NOT NULL`))
        .orderBy(asc(schema.progressEntries.date)).limit(1),
      db.select({ weightKg: schema.progressEntries.weightKg }).from(schema.progressEntries)
        .where(and(eq(schema.progressEntries.userId, userId), sql`${schema.progressEntries.weightKg} IS NOT NULL`))
        .orderBy(desc(schema.progressEntries.date)).limit(1),
      db.select({ glasses: schema.waterLogs.glasses }).from(schema.waterLogs)
        .where(and(eq(schema.waterLogs.userId, userId), eq(schema.waterLogs.logDate, today))).limit(1),
      db.select().from(schema.userInsightActions).where(and(eq(schema.userInsightActions.userId, userId), gte(schema.userInsightActions.decidedAt, plusDays(today, -14)))),
    ]);

    const workoutActivity = workouts.filter((workout) => workout.status === "finished").map((workout) => dateKey(workout.workoutDate));
    const quickActivity = quickLogs.map((log) => dateKey(log.logDate));
    const activityDates = [...workoutActivity, ...quickActivity];
    const doneThisWeek = new Set(activityDates.filter((date) => date >= dateKey(monday) && date <= todayIso));
    const plannedByWeekday = new Set(plannedDays.map((day) => day.weekday).filter((weekday): weekday is number => weekday !== null));
    const weekStrip = Array.from({ length: 7 }, (_, index) => {
      const date = plusDays(monday, index);
      const iso = dateKey(date);
      const weekday = (date.getUTCDay() + 6) % 7;
      const planned = plannedByWeekday.has(weekday);
      const done = doneThisWeek.has(iso);
      return { date: iso, day: weekdayNames[weekday], status: done ? "done" : planned ? "planned" : "rest" };
    });
    const activityDateSet = new Set(activityDates);
    const missedPlannedSessions = Array.from({ length: 14 }, (_, index) => plusDays(twoWeeksAgo, index))
      .filter((date) => plannedByWeekday.has((date.getUTCDay() + 6) % 7) && dateKey(date) < todayIso && !activityDateSet.has(dateKey(date))).length;

    const weightSamples = progress.filter((entry) => entry.weightKg !== null).map((entry) => ({ date: dateKey(entry.date), weightKg: asNumber(entry.weightKg) })).sort((a, b) => a.date.localeCompare(b.date));
    const latestWeight = latestWeights[0]?.weightKg === null || latestWeights[0]?.weightKg === undefined ? null : asNumber(latestWeights[0].weightKg);
    const weightSevenDaysAgo = weightSamples.find((entry) => entry.date <= dateKey(plusDays(today, -7)));
    const goalType: FitnessGoal = userProfile.goalType === "fat_loss" || userProfile.goalType === "muscle_gain" ? userProfile.goalType : "maintain";
    const metrics = calculateFitnessMetrics({
      ageYears: userProfile.ageYears ?? 30,
      sex: userProfile.sex === "male" || userProfile.sex === "female" ? userProfile.sex : "other",
      heightCm: userProfile.heightCm ?? 170,
      weightKg: latestWeight ?? asNumber(userProfile.targetWeightKg, 70),
      activityLevel: asNumber(userProfile.activityLevel, 1.55),
      goal: goalType,
    });
    const calorieTotal = foods.reduce((sum, item) => sum + item.calories, 0);
    const proteinTotal = foods.reduce((sum, item) => sum + asNumber(item.proteinG), 0);
    const allGoalRows = await db.select({ metric: schema.userGoals.metric, exerciseName: schema.userGoals.exerciseName, targetValue: schema.userGoals.targetValue, weightKg: schema.workoutSets.weightKg })
      .from(schema.userGoals).leftJoin(schema.workoutSets, and(eq(schema.workoutSets.userId, userId), eq(schema.workoutSets.exerciseName, schema.userGoals.exerciseName)))
      .where(and(eq(schema.userGoals.userId, userId), eq(schema.userGoals.status, "active")));
    const workoutsThisWeek = workouts.filter((row) => row.status === "finished" && dateKey(row.workoutDate) >= dateKey(monday) && dateKey(row.workoutDate) <= todayIso).length
      + quickLogs.filter((row) => dateKey(row.logDate) >= dateKey(monday) && dateKey(row.logDate) <= todayIso).length;
    const activeGoals = goals.map((goal) => {
      const current = goal.metric === "weight" ? latestWeight ?? 0 : goal.metric === "workouts_per_week" ? workoutsThisWeek : asNumber(allGoalRows.find((row) => row.metric === goal.metric && row.exerciseName === goal.exerciseName)?.weightKg);
      const target = asNumber(goal.targetValue);
      const progressPercent = goal.metric === "weight" && initialWeights[0]?.weightKg != null && target > 0
        ? calculateGoalProgressToward(asNumber(initialWeights[0]?.weightKg), current, target, target < asNumber(initialWeights[0]?.weightKg) ? "decrease" : "increase")
        : Math.min(100, Math.round((current / (target || 1)) * 100));
      return { id: goal.id, title: goal.title, metric: goal.metric, current, target, progressPercent };
    });
    const activeDecisions = new Map(decisions.map((item) => [item.insightId, item]));
    const allInsights = getTodayInsights({ missedPlannedSessions, goal: goalType, weights: weightSamples });
    const insights = allInsights.filter((item) => !activeDecisions.has(item.id));
    const acceptedCalorieDelta = activeDecisions.get("calorie-adjustment")?.decision === "accepted" ? activeDecisions.get("calorie-adjustment")?.calorieDelta ?? 0 : 0;
    const shorterSessionSelected = activeDecisions.get("shorter-workout")?.decision === "accepted";

    res.status(200).json({
      date: todayIso,
      plannedWorkout: todayProgramDay ? { id: todayProgramDay.id, name: todayProgramDay.name, split: program?.split ?? "full_body", shortened: shorterSessionSelected, exercises: shorterSessionSelected ? plannedExercises.slice(0, 3) : plannedExercises } : null,
      inProgressWorkout: inProgress ? { id: inProgress.id, name: inProgress.name, startedAt: inProgress.startedAt } : null,
      week: weekStrip,
      streak: calculateStreak(activityDates, todayIso),
      workoutsThisWeek,
      weeklyWorkoutTarget: userProfile.weeklyWorkoutTarget,
      weight: { latestKg: latestWeight, changeKg7d: latestWeight === null || !weightSevenDaysAgo ? null : Number((latestWeight - weightSevenDaysAgo.weightKg).toFixed(1)) },
      nutrition: { calories: calorieTotal, calorieTarget: Math.max(1200, metrics.calorieTarget + acceptedCalorieDelta), proteinG: Math.round(proteinTotal), proteinTargetG: metrics.proteinTargetG },
      water: { glasses: water[0]?.glasses ?? 0, targetGlasses: Math.ceil(metrics.waterTargetMl / 250), targetMl: metrics.waterTargetMl },
      activeGoals,
      insights,
    });
  } catch {
    sendError(res, 500, "TODAY_FAILED", "Unable to load today's plan and progress.");
  }
}
