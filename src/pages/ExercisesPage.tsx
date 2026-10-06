import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Exercise, Video } from "../lib/content";
import { loadExercises, loadVideos } from "../lib/contentApi";

function MuscleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6.5 6.5 11 11M3 3l1 1m17 17-1-1M2 6l4-4m12 20 4-4M3 10l7-7m4 18 7-7" />
    </svg>
  );
}

function ExerciseCard({ exercise, video }: { exercise: Exercise; video?: Video }) {
  return (
    <article className="ex-card" key={exercise.slug}>
      <div className="ex-card-media">
        {video?.thumbnail ? (
          <img src={video.thumbnail} alt="" width={480} height={270} loading="lazy" />
        ) : (
          <div className="ex-card-art"><MuscleIcon /><span>{exercise.category}</span></div>
        )}
        <span className="tape-badge ex-card-badge">{exercise.category}</span>
      </div>
      <div className="ex-card-body">
        <h2>{exercise.name}</h2>
        <p className="ex-desc">{exercise.description}</p>
        <div className="ex-card-tags">
          <span className="ex-meta">{exercise.muscles}</span>
          <span className="ex-meta">{exercise.equipment}</span>
        </div>
        <Link className="ex-view" to={`/exercises/${exercise.slug}`}>
          View exercise <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export function ExercisesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [level, setLevel] = useState("All");
  const [muscle, setMuscle] = useState("All");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadExercises().then((items) => {
      if (active) {
        setExercises(items);
        setIsLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void loadVideos().then((items) => { if (active) setVideos(items); });
    return () => { active = false; };
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(exercises.map((exercise) => exercise.category))],
    [exercises],
  );
  const muscles = useMemo(
    () => [...new Set(exercises.flatMap((exercise) => exercise.muscles.split(",").map((name) => name.trim())).filter(Boolean))].sort(),
    [exercises],
  );
  const equipmentOptions = useMemo(
    () => [...new Set(exercises.map((exercise) => exercise.equipment).filter(Boolean))].sort(),
    [exercises],
  );
  const levels = useMemo(
    () => [...new Set(exercises.map((exercise) => exercise.difficulty).filter(Boolean))].sort(),
    [exercises],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((exercise) => {
      if (category !== "All" && exercise.category !== category) return false;
      if (equipment !== "All" && exercise.equipment !== equipment) return false;
      if (level !== "All" && exercise.difficulty !== level) return false;
      if (muscle !== "All" && !exercise.muscles.toLowerCase().includes(muscle.toLowerCase())) return false;
      if (!q) return true;
      const haystack = `${exercise.name} ${exercise.category} ${exercise.muscles} ${exercise.equipment} ${exercise.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [category, equipment, exercises, level, muscle, query]);

  function clearFilters() {
    setQuery("");
    setCategory("All");
    setEquipment("All");
    setLevel("All");
    setMuscle("All");
  }

  function videoFor(exercise: Exercise) {
    const title = exercise.name.toLowerCase();
    const slug = exercise.slug.toLowerCase();
    return videos.find((video) => video.exerciseSlug === exercise.slug)
      ?? videos.find((video) => video.title.toLowerCase().includes(title) || video.title.toLowerCase().includes(slug.replaceAll("-", " ")));
  }

  return (
    <section className="pg page exercise-page">
      <div className="container">
        <div className="pg-head">
          <span className="pg-kicker">Move with purpose</span>
          <h1>Workout library</h1>
          <p className="pg-intro">Find your next movement, learn the form, and build a stronger routine.</p>
        </div>

        <div className="exercise-toolbar">
          <label className="pg-search">
            <span className="sr-only">Search exercises</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises" />
          </label>
          <div className="filter-row" aria-label="Exercise categories">
            {categories.map((item) => (
              <button key={item} type="button" className={`chip${category === item ? " is-active" : ""}`} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
        </div>

        <div className="exercise-filters">
          <label className="field"><span>Muscle</span><select value={muscle} onChange={(event) => setMuscle(event.target.value)}><option>All</option>{muscles.map((name) => <option key={name}>{name}</option>)}</select></label>
          <label className="field"><span>Equipment</span><select value={equipment} onChange={(event) => setEquipment(event.target.value)}><option>All</option>{equipmentOptions.map((name) => <option key={name}>{name}</option>)}</select></label>
          <label className="field"><span>Level</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option>All</option>{levels.map((name) => <option key={name}>{name}</option>)}</select></label>
          <div className="exercise-filter-summary"><span aria-live="polite">{filtered.length} {filtered.length === 1 ? "exercise" : "exercises"}</span><button type="button" className="clear-filters" onClick={clearFilters}>Clear filters</button></div>
        </div>

        <div className="ex-grid" aria-live="polite">
          {isLoading ? Array.from({ length: 6 }, (_, index) => <div className="ex-skeleton" key={index} aria-hidden="true"><span /><i /><i /></div>) : filtered.length === 0 ? (
            <div className="library-empty"><p>No exercises match these filters.</p><button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear filters</button></div>
          ) : filtered.map((exercise) => <ExerciseCard key={exercise.slug} exercise={exercise} video={videoFor(exercise)} />)}
        </div>
      </div>
    </section>
  );
}
