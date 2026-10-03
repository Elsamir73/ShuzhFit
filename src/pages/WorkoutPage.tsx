import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

type ExerciseOption = { id: number; name: string; equipment: string | null };
type ExerciseSession = {
  exerciseId: number | null;
  exerciseName: string;
  repMin: number;
  repMax: number;
  sets: Array<{ id: number; setNumber: number; reps: number; weightKg: number; isWarmup: boolean }>;
  hasPlaceholder: boolean;
  lastSession: Array<{ setNumber: number; reps: number; weightKg: number; isWarmup: boolean }>;
  nextTarget: { reps: number; weightKg: number };
};
type WorkoutDetail = {
  workout: { id: number; name: string; status: string; startedAt: string | null; durationSeconds: number; notes: string; programDayId: number | null };
  exercises: ExerciseSession[];
  summary: null | { setCount: number; volumeKg: number; durationSeconds: number; personalRecords: Array<{ exerciseName: string; estimated1Rm: number; previous1Rm: number }> };
};
type FinishSummary = { workoutId: number; setCount: number; volumeKg: number; durationSeconds: number; personalRecords: Array<{ exerciseName: string; estimated1Rm: number; previous1Rm: number }>; nextPlannedSession: string | null };
type EditorValue = { weightKg: number; reps: number };

function responseError(value: unknown): string {
  if (typeof value === "object" && value !== null && "error" in value) {
    const error = value.error;
    if (typeof error === "string") return error;
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") return error.message;
  }
  return "Unable to save your workout. Please try again.";
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null) as unknown;
  if (!response.ok) throw new Error(responseError(data));
  return data as T;
}

function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function WorkoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const programDayId = Number(searchParams.get("programDayId")) || null;
  const exerciseFromUrl = searchParams.get("exercise");
  const [detail, setDetail] = useState<WorkoutDetail | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [freeExerciseName, setFreeExerciseName] = useState("");
  const [editors, setEditors] = useState<Record<string, EditorValue>>({});
  const [isWarmup, setIsWarmup] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [restRemaining, setRestRemaining] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [notes, setNotes] = useState("");
  const [finishSummary, setFinishSummary] = useState<FinishSummary | null>(null);
  const [prBanner, setPrBanner] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDetail = useCallback(async (id: number) => {
    const response = await fetch(`/api/workouts/${id}`, { credentials: "same-origin" });
    const data = await readJson<WorkoutDetail>(response);
    setDetail(data);
    setActiveId(id);
    setNotes(data.workout.notes);
    setEditors((current) => {
      const next = { ...current };
      for (const exercise of data.exercises) {
        if (!next[exercise.exerciseName]) next[exercise.exerciseName] = exercise.nextTarget;
      }
      return next;
    });
  }, []);

  const loadCurrent = useCallback(async () => {
    setMessage("");
    try {
      const response = await fetch("/api/workouts?current=true", { credentials: "same-origin" });
      const data = await readJson<{ activeWorkout: null | { id: number; name: string }; exerciseOptions: ExerciseOption[] }>(response);
      setExerciseOptions(data.exerciseOptions);
      setActiveId(data.activeWorkout?.id ?? null);
      if (data.activeWorkout) await loadDetail(data.activeWorkout.id);
      else setDetail(null);
    } catch (loadError) {
      setMessage(loadError instanceof Error ? loadError.message : "Unable to load your current workout.");
    } finally {
      setLoading(false);
    }
  }, [loadDetail]);

  useEffect(() => { void loadCurrent(); }, [loadCurrent]);
  useEffect(() => {
    if (!activeId || finishSummary) return undefined;
    const interval = window.setInterval(() => {
      setNow(Date.now());
      setRestRemaining((remaining) => remaining > 0 ? remaining - 1 : 0);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeId, finishSummary]);

  const elapsedSeconds = useMemo(() => {
    if (!detail?.workout.startedAt) return 0;
    return Math.max(detail.workout.durationSeconds, Math.floor((now - new Date(detail.workout.startedAt).getTime()) / 1000));
  }, [detail, now]);

  async function startWorkout() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/workouts", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(programDayId ? { programDayId } : {}), name: programDayId ? undefined : "Workout" }),
      });
      const created = await readJson<{ id: number }>(response);
      if (exerciseFromUrl) {
        const addResponse = await fetch(`/api/workouts/${created.id}/exercises`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exerciseName: exerciseFromUrl }) });
        await readJson(addResponse);
      }
      await loadDetail(created.id);
    } catch (startError) {
      setMessage(startError instanceof Error ? startError.message : "Unable to start this workout.");
      await loadCurrent();
    } finally {
      setSaving(false);
    }
  }

  async function addExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeId) return;
    setSaving(true);
    try {
      const body = selectedExerciseId ? { exerciseId: Number(selectedExerciseId) } : { exerciseName: freeExerciseName.trim() };
      const response = await fetch(`/api/workouts/${activeId}/exercises`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      await readJson(response);
      setFreeExerciseName("");
      setSelectedExerciseId("");
      await loadDetail(activeId);
    } catch (addError) {
      setMessage(addError instanceof Error ? addError.message : "Unable to add this exercise.");
    } finally {
      setSaving(false);
    }
  }

  async function logSet(exercise: ExerciseSession) {
    if (!activeId) return;
    const editor = editors[exercise.exerciseName] ?? exercise.nextTarget;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/workouts/${activeId}/sets`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exerciseName: exercise.exerciseName, weightKg: editor.weightKg, reps: editor.reps, isWarmup }) });
      const result = await readJson<{ newPersonalRecord: boolean; estimated1Rm: number }>(response);
      if (result.newPersonalRecord) setPrBanner(`${exercise.exerciseName}: new estimated 1RM of ${result.estimated1Rm} kg`);
      setIsWarmup(false);
      setRestRemaining(restDuration);
      setEditors((current) => ({ ...current, [exercise.exerciseName]: { ...editor, reps: Math.min(exercise.repMax, editor.reps + 1) } }));
      await loadDetail(activeId);
    } catch (logError) {
      setMessage(logError instanceof Error ? logError.message : "Unable to log this set.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSet(setId: number) {
    if (!activeId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/workouts/${activeId}/sets`, { method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ setId }) });
      await readJson(response);
      await loadDetail(activeId);
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : "Unable to remove this set.");
    } finally {
      setSaving(false);
    }
  }

  async function removeExercise(exercise: ExerciseSession) {
    if (!activeId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/workouts/${activeId}/exercises`, { method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exercise.exerciseId ? { exerciseId: exercise.exerciseId } : { exerciseName: exercise.exerciseName }) });
      await readJson(response);
      await loadDetail(activeId);
    } catch (removeError) {
      setMessage(removeError instanceof Error ? removeError.message : "Unable to remove this exercise.");
    } finally {
      setSaving(false);
    }
  }

  async function finishWorkout() {
    if (!activeId) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/workouts?id=${activeId}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "finish", notes }) });
      const data = await readJson<{ summary: FinishSummary }>(response);
      setFinishSummary(data.summary);
      setDetail(null);
    } catch (finishError) {
      setMessage(finishError instanceof Error ? finishError.message : "Unable to finish this workout.");
    } finally {
      setSaving(false);
    }
  }

  async function discardWorkout() {
    if (!activeId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/workouts?id=${activeId}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "discard" }) });
      await readJson(response);
      navigate("/today", { replace: true });
    } catch (discardError) {
      setMessage(discardError instanceof Error ? discardError.message : "Unable to discard this workout.");
    } finally {
      setSaving(false);
    }
  }

  const totalWorkingSets = detail?.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0) ?? 0;
  const updateEditor = (exercise: ExerciseSession, field: keyof EditorValue, delta: number) => {
    const current = editors[exercise.exerciseName] ?? exercise.nextTarget;
    const nextValue = field === "weightKg" ? Math.max(0, Number((current.weightKg + delta).toFixed(1))) : Math.max(1, Math.min(100, current.reps + delta));
    setEditors((state) => ({ ...state, [exercise.exerciseName]: { ...current, [field]: nextValue } }));
  };

  return (
    <>
      <Helmet><title>{finishSummary ? "Workout complete" : "Workout logger"}</title><meta name="description" content="Run a workout session, log your sets, and review your personal records." /></Helmet>
      <section className="pg page"><div className="container" style={{ display: "grid", gap: 22 }}>
        <div className="pg-head"><span className="pg-kicker">Track</span><h1>{finishSummary ? "Session complete" : detail ? detail.workout.name : "Workout logger"}</h1><p className="pg-intro">{detail ? `Live workout timer · ${formatClock(elapsedSeconds)}` : "Log each set and keep your training history together."}</p></div>
        {message ? <div role="alert" className="form-message">{message}</div> : null}
        {prBanner ? <div className="pr-banner" role="status"><strong>New personal record</strong><span>{prBanner}</span><button type="button" className="btn btn-sm" onClick={() => setPrBanner("")}>Dismiss</button></div> : null}

        {loading ? <div className="app-panel" aria-busy="true">Loading workout…</div> : null}
        {finishSummary ? <section className="app-panel finish-summary">
          <h2>Workout summary</h2><div className="field-grid is-two-col"><div className="stat-card"><p>Working sets</p><h3>{finishSummary.setCount}</h3></div><div className="stat-card"><p>Volume</p><h3>{finishSummary.volumeKg.toLocaleString()} kg</h3></div><div className="stat-card"><p>Duration</p><h3>{formatClock(finishSummary.durationSeconds)}</h3></div><div className="stat-card"><p>New records</p><h3>{finishSummary.personalRecords.length}</h3></div></div>
          {finishSummary.personalRecords.length ? <div><h3>Personal records</h3>{finishSummary.personalRecords.map((record) => <p key={record.exerciseName}><strong>{record.exerciseName}</strong>: {record.estimated1Rm} kg estimated 1RM</p>)}</div> : <p>No new 1RM records this session. Keep building.</p>}
          <p>Next planned session: <strong>{finishSummary.nextPlannedSession ?? "Rest day"}</strong></p><div className="btn-row"><Link to="/workout-history" className="btn btn-primary">View history</Link><Link to="/today" className="btn">Back to Today</Link></div>
        </section> : null}

        {!loading && !detail && !finishSummary ? <section className="app-panel session-panel">
          <h2>{programDayId ? "Planned session" : "Start a workout"}</h2><p>{programDayId ? "Your planned exercises will be ready as soon as the session starts." : "Start an empty workout, then add exercises from your library or use a custom name."}</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => void startWorkout()} disabled={saving}>{saving ? "Starting…" : "Start workout"}</button>
        </section> : null}

        {detail && !finishSummary ? <>
          <section className="session-list">
            {detail.exercises.map((exercise) => {
              const editor = editors[exercise.exerciseName] ?? exercise.nextTarget;
              return <article className="app-panel exercise-session-card" key={`${exercise.exerciseId ?? "custom"}-${exercise.exerciseName}`}>
                <div className="meal-day-header"><div><h2>{exercise.exerciseName}</h2><p>Target: {exercise.repMin}–{exercise.repMax} reps</p></div><button type="button" className="btn btn-sm" disabled={saving} onClick={() => void removeExercise(exercise)}>Remove</button></div>
                {exercise.lastSession.length ? <details className="last-session"><summary>Last time · {exercise.lastSession.length} sets</summary>{exercise.lastSession.map((set) => <p key={set.setNumber}>Set {set.setNumber}: {set.reps} reps × {set.weightKg} kg{set.isWarmup ? " · warm-up" : ""}</p>)}</details> : <p className="form-success">No previous finished session for this exercise.</p>}
                {exercise.sets.map((set) => <div className="logged-set" key={set.id}><span><strong>Set {set.setNumber}</strong> · {set.reps} reps × {set.weightKg} kg {set.isWarmup ? "· warm-up" : ""}</span><button className="btn btn-sm" type="button" disabled={saving} aria-label={`Delete set ${set.setNumber} of ${exercise.exerciseName}`} onClick={() => void deleteSet(set.id)}>Delete</button></div>)}
                <div className="field-grid is-three-col set-editor">
                  <div className="stepper-field"><span>Weight (kg)</span><div><button type="button" className="btn btn-sm" aria-label={`Decrease ${exercise.exerciseName} weight`} onClick={() => updateEditor(exercise, "weightKg", -2.5)}>−</button><output>{editor.weightKg}</output><button type="button" className="btn btn-sm" aria-label={`Increase ${exercise.exerciseName} weight`} onClick={() => updateEditor(exercise, "weightKg", 2.5)}>+</button></div></div>
                  <div className="stepper-field"><span>Reps</span><div><button type="button" className="btn btn-sm" aria-label={`Decrease ${exercise.exerciseName} reps`} onClick={() => updateEditor(exercise, "reps", -1)}>−</button><output>{editor.reps}</output><button type="button" className="btn btn-sm" aria-label={`Increase ${exercise.exerciseName} reps`} onClick={() => updateEditor(exercise, "reps", 1)}>+</button></div></div>
                  <label className="warmup-toggle"><input type="checkbox" checked={isWarmup} onChange={(event) => setIsWarmup(event.target.checked)} /> Warm-up set</label>
                </div>
                <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void logSet(exercise)}>Log set</button>
              </article>;
            })}
          </section>

          <form className="app-panel add-exercise-form" onSubmit={addExercise}>
            <h2>Add exercise</h2><div className="field-grid is-two-col">
              <label className="field"><span>From exercise library</span><select value={selectedExerciseId} onChange={(event) => { setSelectedExerciseId(event.target.value); setFreeExerciseName(""); }}><option value="">Choose an exercise</option>{exerciseOptions.map((exercise) => <option value={exercise.id} key={exercise.id}>{exercise.name}</option>)}</select></label>
              <label className="field"><span>Or enter a custom exercise</span><input value={freeExerciseName} onChange={(event) => { setFreeExerciseName(event.target.value); setSelectedExerciseId(""); }} maxLength={200} /></label>
            </div><button className="btn" type="submit" disabled={saving || (!selectedExerciseId && !freeExerciseName.trim())}>Add exercise</button>
          </form>

          <label className="app-panel field"><span>Session notes</span><textarea rows={3} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          <div className="btn-row"><button className="btn btn-primary btn-lg" type="button" onClick={() => void finishWorkout()} disabled={saving || totalWorkingSets < 1 || elapsedSeconds < 60}>{saving ? "Saving…" : "Finish workout"}</button><button className="btn btn-lg" type="button" onClick={() => void discardWorkout()} disabled={saving}>Discard workout</button></div>
          {elapsedSeconds < 60 ? <small className="form-success">Workout finish is available after one minute and at least one logged set.</small> : null}
        </> : null}
      </div></section>
      {detail && !finishSummary ? <div className="workout-sticky-bar" role="region" aria-label="Rest timer">
        <div><strong>Rest</strong><span>{formatClock(restRemaining)}</span></div>
        <div className="rest-adjuster"><button type="button" className="btn btn-sm" aria-label="Decrease rest duration" onClick={() => setRestDuration((value) => Math.max(30, value - 15))}>−15</button><small>{restDuration}s default</small><button type="button" className="btn btn-sm" aria-label="Increase rest duration" onClick={() => setRestDuration((value) => Math.min(300, value + 15))}>+15</button></div>
      </div> : null}
    </>
  );
}
