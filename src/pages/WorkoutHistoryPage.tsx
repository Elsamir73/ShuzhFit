import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

type Activity = { type: "workout" | "quick"; id: string; name: string; status: string; date: string; workoutDate: string; durationSeconds: number; setCount: number; exerciseCount: number; volumeKg: number; notes: string };
type PageData = { items: Activity[]; page: number; hasMore: boolean };

export function WorkoutHistoryPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageData>({ items: [], page: 1, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    fetch(`/api/workouts?page=${page}`, { credentials: "include" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body?.error?.message ?? "Unable to load workout history."); return body as PageData; })
      .then((body) => { if (!cancelled) setData(body); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load workout history."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, refresh]);

  async function remove(item: Activity) {
    if (!window.confirm(`Delete “${item.name}” from your workout history?`)) return;
    const response = await fetch(`/api/workouts?id=${encodeURIComponent(item.id)}`, { method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (!response.ok) { setError("Unable to delete this workout."); return; }
    setRefresh((value) => value + 1);
  }

  return <><Helmet><title>Workout History</title><meta name="description" content="Review your workout sessions and training progress." /></Helmet>
    <section className="pg page"><div className="container"><div className="pg-head" style={{ marginBottom: 24 }}><span className="pg-kicker">History</span><h1>Workout history</h1><p className="pg-intro">Review completed sessions and track your training consistency.</p></div>
      <div className="app-panel" style={{ display: "grid", gap: 14 }}>
        {loading ? <p>Loading workout history…</p> : error ? <p role="alert" className="form-error">{error}</p> : data.items.length === 0 ? <p className="empty-state">No workout history yet. Start logging your first session.</p> : data.items.map((item) => <article key={`${item.type}-${item.id}`} className="history-item">
          <div><span className="pg-kicker">{item.type === "workout" ? item.status.replace("_", " ") : "Quick log"}</span><h2>{item.name}</h2><p>{new Date(item.date).toLocaleDateString()} · {item.setCount} sets · {Math.round(item.durationSeconds / 60)} min</p>{item.type === "workout" && <p>{item.exerciseCount} exercises · {Math.round(item.volumeKg).toLocaleString()} kg volume</p>}{item.notes && <p>{item.notes}</p>}</div>
          <div className="btn-row">{item.type === "workout" && <><Link className="btn btn-secondary" to={`/workout/${item.id}`}>Details</Link><button className="btn btn-ghost" onClick={() => void remove(item)}>Delete</button></>}</div>
        </article>)}
        <div className="btn-row" style={{ justifyContent: "space-between" }}><button className="btn btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page}</span><button className="btn btn-secondary" disabled={!data.hasMore || loading} onClick={() => setPage((value) => value + 1)}>Next</button></div>
      </div>
    </div></section></>;
}
