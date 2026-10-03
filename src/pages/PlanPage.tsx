import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

type PlanExercise = { id: number; name: string; muscles: string | null; equipment: string | null; position: number; targetSets: number; repMin: number; repMax: number };
type SwapOption = { id: number; name: string; equipment: string | null };
type PlanData = { program: { name: string; split: string }; days: Array<{ id: number; name: string; weekday: number | null; exercises: PlanExercise[] }>; swapOptions: SwapOption[] };
const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function PlanPage() {
  const [data, setData] = useState<PlanData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  const loadPlan = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/program", { credentials: "same-origin" });
      const result = await response.json().catch(() => null) as { program?: PlanData["program"]; days?: PlanData["days"]; swapOptions?: SwapOption[]; error?: string | { message?: string } } | null;
      if (!response.ok || !result?.program || !result.days) {
        const message = typeof result?.error === "object" ? result.error.message : result?.error;
        throw new Error(message ?? "Your weekly plan is not available yet.");
      }
      setData({ program: result.program, days: result.days, swapOptions: result.swapOptions ?? [] });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPlan(); }, [loadPlan]);

  async function patchPlan(dayId: number, update: { type: "reschedule"; weekday: number | null } | { type: "swap"; position: number; exerciseId: number }) {
    setSaving(dayId);
    setError("");
    try {
      const response = await fetch("/api/program", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...update, dayId }) });
      const result = await response.json().catch(() => null) as { error?: string | { message?: string } } | null;
      if (!response.ok) throw new Error(typeof result?.error === "object" ? result.error.message : result?.error ?? "Unable to update your plan.");
      await loadPlan();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update your plan.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <Helmet><title>Weekly Plan</title><meta name="description" content="Review and adjust your personalized training plan." /></Helmet>
      <section className="pg page"><div className="container" style={{ display: "grid", gap: 24 }}>
        <div className="pg-head"><span className="pg-kicker">Program</span><h1>Your weekly plan</h1><p className="pg-intro">Your active plan is saved to your account. Change a training day or swap an exercise at any time.</p></div>
        {error ? <div role="alert" className="form-message">{error}</div> : null}
        {loading ? <div className="app-panel" aria-busy="true">Loading your plan…</div> : null}
        {!loading && data ? <><p>{data.program.name} · {data.program.split.replaceAll("_", " ")}</p><div className="workout-layout">
          {data.days.map((day) => <article key={day.id} className="app-panel session-panel">
            <div className="meal-day-header"><h2>{day.name}</h2><label className="field"><span>Training day</span><select aria-label={`Schedule ${day.name}`} disabled={saving === day.id} value={day.weekday ?? "rest"} onChange={(event) => void patchPlan(day.id, { type: "reschedule", weekday: event.target.value === "rest" ? null : Number(event.target.value) })}><option value="rest">Not scheduled</option>{weekdayNames.map((name, index) => <option key={name} value={index}>{name}</option>)}</select></label></div>
            <ul className="meal-list">{day.exercises.map((exercise) => <li key={exercise.position}>
              <strong>{exercise.name}</strong><div>{exercise.targetSets} sets × {exercise.repMin}–{exercise.repMax} reps</div><small>{exercise.muscles ?? exercise.equipment ?? "Training"}</small>
              <label className="field"><span>Swap exercise</span><select aria-label={`Swap ${exercise.name}`} disabled={saving === day.id} value={exercise.id} onChange={(event) => void patchPlan(day.id, { type: "swap", position: exercise.position, exerciseId: Number(event.target.value) })}>{data.swapOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
            </li>)}</ul>
          </article>)}
        </div></> : null}
      </div></section>
    </>
  );
}
