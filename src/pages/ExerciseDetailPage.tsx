import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { ContentEngagement } from "../components/ContentEngagement";
import { ExerciseGuide } from "../components/ExerciseGuide";
import { guideFor, sentences, splitList } from "../content/exerciseGuides";
import { useAuth } from "../contexts/AuthContext";
import type { Exercise } from "../lib/content";
import { loadExercise, loadExercises } from "../lib/contentApi";

export function ExerciseDetailPage() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [related, setRelated] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
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
  const guide = guideFor(slug, exercise.name);
  const steps = guide?.steps.length
    ? guide.steps
    : exercise.steps?.length
      ? exercise.steps
      : sentences(exercise.formGuide);
  const tips = guide?.tips.length ? guide.tips : (exercise.tips ?? []);
  const mistakes = guide?.mistakes.length
    ? guide.mistakes
    : (exercise.mistakesList ?? []);
  const muscles = splitList(exercise.muscles);
  const reps =
    exercise.repUnit === "seconds"
      ? "3 × 30–45 seconds"
      : exercise.repUnit === "meters"
        ? "3 × 20–40 meters"
        : "3 × 6–10 reps";
  return (
    <>
      <Helmet>
        <title>{exercise.name} | ShuzhFit</title>
        <meta name="description" content={exercise.description} />
      </Helmet>
      <ExerciseGuide
        name={exercise.name}
        category={exercise.category}
        summary={exercise.description}
        muscles={muscles}
        equipment={exercise.equipment}
        level={exercise.difficulty}
        reps={reps}
        rest={guide?.rest}
        steps={steps}
        tips={tips}
        mistakes={mistakes}
        related={related.map((item) => ({
          slug: item.slug,
          name: item.name,
          meta: `${item.muscles} · ${item.difficulty}`,
        }))}
        addToWorkoutHref={user ? "/workout" : "/login"}
      >
        <ContentEngagement type="exercise" slug={slug} />
      </ExerciseGuide>
    </>
  );
}

