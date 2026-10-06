import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

type PlanExercise = { id: number; name: string; muscles: string | null; equipment: string | null; repUnit?: string; position: number; targetSets: number; repMin: number; repMax: number };
type SwapOption = { id: number; name: string; equipment: string | null };
type PlanDay = { id: number; name: string; weekday: number | null; exercises: PlanExercise[] };
type PlanData = { program: { name: string; split: string }; days: PlanDay[]; swapOptions: SwapOption[] };
const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function PlanPage() {
  const [data, setData] = useState<PlanData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [swapPosition, setSwapPosition] = useState<number | null>(null);
  const loadPlan = useCallback(async () => {
    setError(" ");
    try {
      const response = await fetch("/api/program", { credentials: "same-origin" });
      const result = await response.json().catch(() => null) as { program?: PlanData["program"]; days?: PlanDay[]; swapOptions?: SwapOption[]; error?: string | { message?: string } } | null;
      if (!response.ok || !result?.program || !result.days) throw new Error(typeof result?.error === "object" ? result.error.message : result?.error ?? "Your weekly plan is not available yet.");
      const next = { program: result.program, days: result.days, swapOptions: result.swapOptions ?? [] };
      setData(next);
      setSelectedDay((current) => current ?? next.days.find((day) => day.weekday === (new Date().getDay() + 6) % 7)?.id ?? next.days[0]?.id ?? null);
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load your plan."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadPlan(); }, [loadPlan]);
  async function patchPlan(dayId: number, update: { type: "reschedule"; weekday: number | null } | { type: "swap"; position: number; exerciseId: number }) {
    setSaving(dayId); setError("");
    try {
      const response = await fetch("/api/program", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...update, dayId }) });
      const result = await response.json().catch(() => null) as { error?: string | { message?: string } } | null;
      if (!response.ok) throw new Error(typeof result?.error === "object" ? result.error.message : result?.error ?? "Unable to update your plan.");
      await loadPlan();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update your plan."); }
    finally { setSaving(null); }
  }
  const day = data?.days.find((item) => item.id === selectedDay);
  return <><Helmet><title>Weekly Plan</title></Helmet><section className="pg page"><div className="container plan-page">
    <div className="pg-head"><span className="pg-kicker">Program</span><h1>Your weekly plan</h1><p className="pg-intro">{data ? `${data.program.name} · ${data.program.split.replaceAll("_", " ")}` : "Your training schedule"}</p></div>
    {error ? <div role="alert" className="form-message">{error}</div> : null}
    {loading ? <div className="app-panel" aria-busy="true">Loading your plan…</div> : null}
    {data ? <><nav className="plan-day-tabs" aria-label="Choose training day">{weekdayNames.map((name, index) => { const scheduled = data.days.find((item) => item.weekday === index); return <button key={name} type="button" className={`plan-day-tab${scheduled?.id === selectedDay ? " active" : ""}${scheduled ? "" : " rest"}`} onClick={() => scheduled && setSelectedDay(scheduled.id)} disabled={!scheduled}>{name.slice(0, 3)}{scheduled ? " · " + scheduled.name : " · Rest"}</button>; })}</nav>
      {day ? <article className="app-panel session-panel"><div className="meal-day-header"><div><h2>{day.name}</h2><p>{day.exercises.length} exercises · about {day.exercises.length * 8} min</p></div><label className="field"><span>Change training day</span><select aria-label="Change training day" disabled={saving === day.id} value={day.weekday ?? "rest"} onChange={(event) => void patchPlan(day.id, { type: "reschedule", weekday: event.target.value === "rest" ? null : Number(event.target.value) })}><option value="rest">Not scheduled</option>{weekdayNames.map((name, index) => <option key={name} value={index} disabled={data.days.some((item) => item.id !== day.id && item.weekday === index)}>{name}</option>)}</select></label></div>
        <ul className="meal-list">{day.exercises.map((exercise) => <li key={exercise.position}><strong>{exercise.name}</strong><div>{exercise.targetSets} × {exercise.repMin}–{exercise.repMax} {exercise.repUnit === "seconds" ? "sec" : exercise.repUnit === "meters" ? "m" : "reps"}</div><small>{exercise.muscles ?? exercise.equipment ?? "Training"}</small><button className="btn btn-sm" type="button" disabled={saving === day.id} onClick={() => setSwapPosition(exercise.position)}>Swap exercise</button></li>)}</ul>
      </article> : <p>No training session is scheduled for this weekday.</p>}</> : null}
    {swapPosition !== null && day && data ? <div className="modal-backdrop" role="presentation" onClick={() => setSwapPosition(null)}><section className="app-panel quick-log-modal" role="dialog" aria-modal="true" aria-labelledby="swap-title" onClick={(event) => event.stopPropagation()}><h2 id="swap-title">Swap exercise</h2>{data.swapOptions.filter((option) => option.equipment === day.exercises.find((item) => item.position === swapPosition)?.equipment).map((option) => <button className="btn" key={option.id} type="button" onClick={() => { void patchPlan(day.id, { type: "swap", position: swapPosition, exerciseId: option.id }); setSwapPosition(null); }}>{option.name}</button>)}<button className="btn" type="button" onClick={() => setSwapPosition(null)}>Cancel</button></section></div> : null}
  </div></section></>;
}
