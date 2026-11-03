import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type TodayData = {
  date: string;
  hasActivePlan: boolean;
  plannedWorkout: null | { id: number; name: string; split: string; shortened: boolean; exercises: Array<{ id: number; name: string; muscles: string | null; equipment: string | null; repUnit?: string; targetSets: number; repMin: number; repMax: number }> };
  inProgressWorkout: null | { id: number; name: string; startedAt: string | null };
  week: Array<{ date: string; day: string; status: "done" | "planned" | "rest" }>;
  streak: number;
  workoutsThisWeek: number;
  weeklyWorkoutTarget: number;
  weight: { latestKg: number | null; changeKg7d: number | null };
  nutrition: { calories: number; calorieTarget: number; proteinG: number; proteinTargetG: number };
  water: { glasses: number; targetGlasses: number; targetMl: number };
  activeGoals: Array<{ id: number; title: string; current: number; target: number; progressPercent: number }>;
  insights: Array<{ id: "shorter-workout" | "calorie-adjustment"; title: string; description: string; actionLabel: string; dismissLabel: string; calorieDelta?: number }>;
};
type QuickMode = "weight" | "water" | "workout";

function errorMessage(body: unknown): string {
  if (typeof body === "object" && body !== null && "error" in body) {
    const error = body.error;
    if (typeof error === "string") return error;
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function TodayPage() {
  const { user } = useAuth();
  const [today, setToday] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quickMode, setQuickMode] = useState<QuickMode | null>(null);
  const [weightKg, setWeightKg] = useState("");
  const [glasses, setGlasses] = useState(1);
  const [workoutType, setWorkoutType] = useState("Walk");
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [saving, setSaving] = useState(false);

  const loadToday = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/today", { credentials: "same-origin" });
      const result = await response.json().catch(() => null) as unknown;
      if (!response.ok) throw new Error(errorMessage(result));
      setToday(result as TodayData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load today.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadToday(); }, [loadToday]);

  async function submitQuickLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quickMode) return;
    setSaving(true);
    setError("");
    const body = quickMode === "weight"
      ? { type: "weight", weightKg: Number(weightKg) }
      : quickMode === "water"
        ? { type: "water", glasses }
        : { type: "workout", workoutType, durationMinutes };
    try {
      const response = await fetch("/api/today", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(body) });
      const result = await response.json().catch(() => null) as unknown;
      if (!response.ok) throw new Error(errorMessage(result));
      setQuickMode(null);
      await loadToday();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save this log.");
    } finally {
      setSaving(false);
    }
  }

  async function decideInsight(insight: TodayData["insights"][number], decision: "accepted" | "dismissed") {
    try {
      const response = await fetch("/api/today", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ type: "insight", insightId: insight.id, decision, calorieDelta: decision === "accepted" ? insight.calorieDelta ?? 0 : 0 }) });
      const result = await response.json().catch(() => null) as unknown;
      if (!response.ok) throw new Error(errorMessage(result));
      await loadToday();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update this insight.");
    }
  }

  return (
    <>
      <Helmet><title>Today</title><meta name="description" content="Your planned session, weekly activity, and progress from ShuzhFit." /></Helmet>
      <section className="pg page">
        <div className="container today-page-container">
          <div className="pg-head">
            <span className="pg-kicker">Today</span>
            <h1>{user ? `Ready to train, ${user.name.split(" ")[0]}?` : "Your training today"}</h1>
            <p className="pg-intro">Your plan and progress, synced from your account.</p>
          </div>

          {error ? <div role="alert" className="form-message">{error}</div> : null}
          {loading ? <div className="app-panel" aria-busy="true">Loading your plan…</div> : null}
          {!loading && today ? <>
            <div className="today-dashboard">
              <article className="app-panel session-panel today-workout-card">
                {!today.hasActivePlan ? <>
                  <h2>No active plan yet</h2>
                  <p>Create your personal training plan to see today’s workout and exercises here.</p>
                  <Link className="btn btn-primary btn-lg" to="/onboarding">Create your plan</Link>
                </> : today.plannedWorkout ? <>
                  <div className="meal-day-header"><div><h2>{today.plannedWorkout.name}</h2><p>{today.plannedWorkout.exercises.length} exercises · about {today.plannedWorkout.exercises.length * 8} min</p></div><span>{today.plannedWorkout.split.replaceAll("_", " ")}</span></div>
                  {today.plannedWorkout.shortened ? <p className="hint-box">Shorter session selected to help you get back into rhythm.</p> : null}
                  {today.plannedWorkout.exercises.length ? <ul className="meal-list today-exercise-list">{today.plannedWorkout.exercises.map((exercise) => <li key={exercise.id}>{exercise.name}<small>{exercise.targetSets} sets · {exercise.repMin}–{exercise.repMax} reps</small></li>)}</ul> : <p>No exercises have been added to this session yet.</p>}
                  <div className="today-workout-actions">
                    {today.inProgressWorkout ? <Link className="btn btn-primary btn-lg" to="/workout">Resume workout</Link> : <Link className="btn btn-primary btn-lg" to={`/workout?programDayId=${today.plannedWorkout.id}`}>Start workout</Link>}
                    <Link className="btn" to="/plan">View full plan</Link>
                  </div>
                </> : <>
                  <h2>Recovery day</h2>
                  <p>No workout is scheduled for today. Rest and recharge, or choose another session from your plan.</p>
                  <Link className="btn" to="/plan">View full plan</Link>
                </>}
              </article>

              <section className="app-panel today-week-card" aria-label="This week">
                <h2>This week · {today.streak} day streak</h2>
                <div className="week-strip">{today.week.map((day) => <div className={`week-strip-day is-${day.status}`} key={day.date} aria-label={`${day.day}: ${day.status}`}>
                  <small>{day.day.slice(0, 3)}</small><strong>{Number(day.date.slice(-2))}</strong><span>{day.status === "done" ? "Done" : day.status === "planned" ? "Plan" : "Rest"}</span>
                </div>)}</div>
              </section>

              <section className="btn-row today-quick-actions" aria-label="Quick logs">
                <button className="btn" type="button" onClick={() => setQuickMode("weight")}>Log weight</button>
                <button className="btn" type="button" onClick={() => setQuickMode("water")}>Log water</button>
                <button className="btn" type="button" onClick={() => setQuickMode("workout")}>Quick workout</button>
              </section>

              <article className="app-panel session-panel"><h2>Activity</h2><p><strong>{today.workoutsThisWeek}</strong> / {today.weeklyWorkoutTarget} workouts this week</p><p><strong>{today.streak}</strong> day streak</p>
                <p>Latest weight: <strong>{today.weight.latestKg === null ? "—" : `${today.weight.latestKg} kg`}</strong>{today.weight.changeKg7d === null ? null : ` · ${today.weight.changeKg7d > 0 ? "+" : ""}${today.weight.changeKg7d} kg in 7 days`}</p>
              </article>

              <article className="app-panel session-panel"><h2>Nutrition today</h2>
                <p className="today-metric-label">Calories <strong>{today.nutrition.calories}</strong> / {today.nutrition.calorieTarget} kcal</p>
                <progress max={today.nutrition.calorieTarget || 1} value={today.nutrition.calories}>{today.nutrition.calories}</progress>
                <p className="today-metric-label">Protein <strong>{today.nutrition.proteinG}</strong> / {today.nutrition.proteinTargetG} g</p>
                <progress max={today.nutrition.proteinTargetG || 1} value={today.nutrition.proteinG}>{today.nutrition.proteinG}</progress>
                <p className="today-metric-label">Water <strong>{today.water.glasses}</strong> / {today.water.targetGlasses} glasses · {today.water.targetMl} ml target</p>
                <progress max={today.water.targetGlasses || 1} value={today.water.glasses}>{today.water.glasses}</progress>
              </article>

              {today.activeGoals.length ? <section className="app-panel"><h2>Active goals</h2>{today.activeGoals.map((goal) => <div key={goal.id} className="goal-progress-row">
                <div className="meal-day-header"><strong>{goal.title}</strong><small>{goal.current} / {goal.target}</small></div><progress max={100} value={goal.progressPercent}>{goal.progressPercent}%</progress>
              </div>)}</section> : null}

              {today.insights.length ? <section className="app-panel adaptation-panel" aria-label="Training insights"><h2>Adaptive coaching</h2>{today.insights.map((insight) => <article className="adaptation-card" key={insight.id}><strong>{insight.title}</strong><p>{insight.description}</p><div className="btn-row"><button type="button" className="btn btn-primary btn-sm" onClick={() => void decideInsight(insight, "accepted")}>{insight.actionLabel}</button><button type="button" className="btn btn-sm" onClick={() => void decideInsight(insight, "dismissed")}>{insight.dismissLabel}</button></div></article>)}</section> : null}
            </div>
          </> : null}
        </div>
      </section>

      {quickMode ? <div className="modal-backdrop" role="presentation" onClick={() => setQuickMode(null)}>
        <section className="app-panel quick-log-modal" role="dialog" aria-modal="true" aria-labelledby="quick-log-title" onClick={(event) => event.stopPropagation()}>
          <h2 id="quick-log-title">{quickMode === "weight" ? "Log weight" : quickMode === "water" ? "Log water" : "Log a quick workout"}</h2>
          <form className="app-form" onSubmit={submitQuickLog}>
            {quickMode === "weight" ? <label className="field"><span>Weight (kg)</span><input required type="number" min={30} max={350} step="0.1" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} /></label> : null}
            {quickMode === "water" ? <label className="field"><span>Glasses</span><input required type="number" min={1} max={20} value={glasses} onChange={(event) => setGlasses(Number(event.target.value))} /></label> : null}
            {quickMode === "workout" ? <div className="field-grid is-two-col"><label className="field"><span>Type</span><select value={workoutType} onChange={(event) => setWorkoutType(event.target.value)}><option>Walk</option><option>Run</option><option>Cycling</option><option>Mobility</option><option>Other</option></select></label><label className="field"><span>Minutes</span><input required type="number" min={1} max={1440} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} /></label></div> : null}
            {error ? <div role="alert" className="form-message">{error}</div> : null}
            <div className="btn-row"><button type="button" className="btn" onClick={() => setQuickMode(null)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save log"}</button></div>
          </form>
        </section>
      </div> : null}
    </>
  );
}
