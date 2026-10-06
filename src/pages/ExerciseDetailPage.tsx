import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import type { Exercise } from "../lib/content";
import { loadExercise, loadExercises } from "../lib/contentApi";
import { getYouTubeVideoId } from "../lib/content";
import { ContentEngagement } from "../components/ContentEngagement";

export function ExerciseDetailPage() {
  const { slug = "" } = useParams();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [related, setRelated] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    setLoading(true);
    void Promise.all([loadExercise(slug), loadExercises()]).then(([item, all]) => {
      if (!live) return;
      setExercise(item);
      setRelated(all.filter((other) => other.slug !== slug && other.muscleGroup === item?.muscleGroup).slice(0, 3));
      setError("");
      setLoading(false);
    }).catch(() => { if (live) { setError("We couldn't load this exercise. Please try again."); setLoading(false); } });
    return () => { live = false; };
  }, [slug]);
  if (loading) return <section className="pg page"><div className="container"><p role="status">Loading exercise…</p></div></section>;
  if (!exercise) return <section className="pg page"><div className="container"><p role="alert">{error || "Exercise not found."}</p><Link to="/exercises">Back to workouts</Link></div></section>;
  const videoUrl = exercise.video?.url ?? exercise.youtubeUrl;
  const videoId = videoUrl ? getYouTubeVideoId(videoUrl) : "";
  const videoIsShort = Boolean(exercise.video?.isShort || exercise.youtubeUrl?.includes("/shorts/") || videoUrl?.includes("/shorts/"));
  const steps = exercise.steps?.length ? exercise.steps : [exercise.formGuide.replace(/<[^>]*>/g, "")];
  const tips = exercise.tips?.length ? exercise.tips : ["Start with a load you can control."];
  const mistakes = exercise.mistakesList?.length ? exercise.mistakesList : [exercise.mistakes.replace(/<[^>]*>/g, "")];
  return <>
    <Helmet><title>{exercise.name} | ShuzhFit</title><meta name="description" content={exercise.description} /></Helmet>
    <section className="pg page"><div className="container exercise-article">
      <Link to="/exercises" className="pg-back exercise-back">← Back to workouts</Link>
      <header className="exercise-title"><span className="pg-kicker">{exercise.category}</span><h1>{exercise.name}</h1><p className="pg-intro">{exercise.description}</p>
        <div className="exercise-meta"><span>Target: {exercise.muscles}</span><span>Equipment: {exercise.equipment}</span><span>Level: {exercise.difficulty}</span><span>3 × {exercise.repUnit === "seconds" ? "30–45 seconds" : exercise.repUnit === "meters" ? "20–40 meters" : "6–10 reps"}</span></div>
      </header>
      <div className="exercise-detail-grid">
        <main className="exercise-guide">
          <section><h2>How to do it</h2><ol>{steps.map((step, index) => <li key={`${index}-${step}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol></section>
          <section><h2>Coach tips</h2><ul>{tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></section>
          <section><h2>Common mistakes</h2><ul className="mistake-list">{mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></section>
          <ContentEngagement type="exercise" slug={slug} />
        </main>
        <aside className="exercise-sidebar">
          <section className="exercise-video"><h2>From my channel</h2>{videoUrl && videoId ? <><button className={`exercise-video-thumb${videoIsShort ? " is-short" : ""}`} type="button" onClick={() => setPlaying(true)} aria-label={`Play ${exercise.video?.title ?? exercise.name}`} style={{ backgroundImage: `url(${exercise.video?.thumbnail ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`})` }}><span>▶</span></button><strong>{exercise.video?.title ?? exercise.name}</strong><a className="btn btn-primary" href={videoUrl} target="_blank" rel="noopener noreferrer">Watch on YouTube</a></> : <><p>See more form guides and training tips on the ShuzhFit channel.</p><a className="btn btn-primary" href="https://www.youtube.com/@ShuzhFit" target="_blank" rel="noopener noreferrer">Watch more on YouTube</a></>}</section>
          <section><h2>Quick details</h2><p>{exercise.muscles}</p><p>{exercise.equipment} · {exercise.difficulty}</p></section>
          <section><h2>Related exercises</h2>{related.length ? related.map((item) => <Link key={item.slug} className="related-exercise" to={`/exercises/${item.slug}`}>{item.name} →</Link>) : <p>More guides coming soon.</p>}</section>
        </aside>
      </div>
    </div></section>
    {playing && videoId ? <div className="video-modal-overlay" role="presentation" onClick={() => setPlaying(false)}><section className={`video-modal app-panel${videoIsShort ? " is-short" : ""}`} role="dialog" aria-modal="true" aria-label={exercise.name} onClick={(event) => event.stopPropagation()}><button className="btn" onClick={() => setPlaying(false)}>Close</button><div className="video-modal-frame"><iframe title={exercise.video?.title ?? exercise.name} src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div></section></div> : null}
  </>;
}
