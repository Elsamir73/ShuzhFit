import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";

type Detail = { workout: { id: number; name: string; status: string; finishedAt: string | null; durationSeconds: number; notes: string }; exercises: Array<{ exerciseName: string; sets: Array<{ setNumber: number; reps: number; weightKg: number; isWarmup: boolean }> }>; summary: null | { setCount: number; volumeKg: number; durationSeconds: number; personalRecords: Array<{ exerciseName: string; estimated1Rm: number; previous1Rm: number }> } };

export function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/workouts/${id}`, { credentials: "include" }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body?.error?.message ?? "Workout not found."); return body as Detail; })
      .then((body) => { if (!cancelled) setDetail(body); }).catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load workout."); });
    return () => { cancelled = true; };
  }, [id]);
  const summary = detail?.summary;
  return <><Helmet><title>{detail?.workout.name ?? "Workout summary"}</title><meta name="description" content="Review a completed workout session and its recorded sets." /></Helmet>
    <section className="pg page"><div className="container"><div className="pg-head"><span className="pg-kicker">Training</span><h1>{detail?.workout.name ?? "Workout summary"}</h1><p className="pg-intro">{detail?.workout.finishedAt ? `Completed ${new Date(detail.workout.finishedAt).toLocaleString()}` : "Session details"}</p></div>
      <div className="app-panel" style={{ maxWidth: 820, display: "grid", gap: 22 }}>{error ? <p role="alert" className="form-error">{error}</p> : !detail ? <p>Loading workout…</p> : <>
        {summary && <div className="field-grid is-two-col"><div className="stat-card"><p>Sets</p><h3>{summary.setCount}</h3></div><div className="stat-card"><p>Duration</p><h3>{Math.round(summary.durationSeconds / 60)} min</h3></div><div className="stat-card"><p>Volume</p><h3>{Math.round(summary.volumeKg).toLocaleString()} kg</h3></div><div className="stat-card"><p>Exercises</p><h3>{detail.exercises.length}</h3></div></div>}
        {summary?.personalRecords.length ? <section><h2>Personal records</h2>{summary.personalRecords.map((record) => <p key={record.exerciseName}>🏆 {record.exerciseName}: estimated 1RM {record.estimated1Rm} kg (previous {record.previous1Rm} kg)</p>)}</section> : null}
        <section><h2>Exercises</h2>{detail.exercises.map((exercise) => <article className="history-item" key={exercise.exerciseName}><div><h3>{exercise.exerciseName}</h3>{exercise.sets.map((set) => <p key={`${set.setNumber}-${set.isWarmup ? "warmup" : "work"}`}>{set.isWarmup ? "Warm-up · " : "Set "}{set.setNumber}: {set.reps} reps × {set.weightKg} kg</p>)}</div></article>)}</section>
        <section><h2>Notes</h2><p>{detail.workout.notes || "No notes were saved for this workout."}</p></section>
        <div className="btn-row"><Link className="btn btn-primary" to="/workout-history">Back to history</Link></div>
      </>}</div>
    </div></section></>;
}
