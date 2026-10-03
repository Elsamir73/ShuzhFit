import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { type Exercise } from "../lib/content";
import { loadExercises } from "../lib/contentApi";

export function ExercisesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [level, setLevel] = useState("All");
  const [muscle, setMuscle] = useState("All");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void loadExercises().then((items) => {
      if (isMounted) {
        setExercises(items);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(exercises.map((exercise) => exercise.category))],
    [exercises],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const matchesCategory =
        category === "All" || exercise.category === category;
      if (!matchesCategory || (equipment !== "All" && exercise.equipment !== equipment) || (level !== "All" && exercise.difficulty !== level) || (muscle !== "All" && !exercise.muscles.toLowerCase().includes(muscle.toLowerCase()))) return false;

      if (!q) return true;

      const haystack =
        `${exercise.name} ${exercise.category} ${exercise.muscles} ${exercise.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [category, equipment, exercises, level, muscle, query]);

  return (
    <section className="pg page">
      <div className="container">
        <div className="pg-head">
          <span className="pg-kicker">ShuzhFit</span>
          <h1>Workout Library</h1>
          <p className="pg-intro">
            A practical library of movement patterns and strength basics for
            busy trainees.
          </p>
        </div>

        <div className="pg-toolbar">
          <div className="pg-search">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search exercises"
              aria-label="Search exercises"
            />
          </div>

          <div className="filter-row" aria-label="Exercise categories">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip ${category === item ? "is-active" : ""}`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="field-grid is-three-col" style={{ marginBottom: 20 }}>
          <label className="field"><span>Muscle group</span><select value={muscle} onChange={(event) => setMuscle(event.target.value)}><option>All</option>{[...new Set(exercises.flatMap((exercise) => exercise.muscles.split(",").map((name) => name.trim())).filter(Boolean))].sort().map((name) => <option key={name}>{name}</option>)}</select></label>
          <label className="field"><span>Equipment</span><select value={equipment} onChange={(event) => setEquipment(event.target.value)}><option>All</option>{[...new Set(exercises.map((exercise) => exercise.equipment).filter(Boolean))].sort().map((name) => <option key={name}>{name}</option>)}</select></label>
          <label className="field"><span>Level</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option>All</option>{[...new Set(exercises.map((exercise) => exercise.difficulty).filter(Boolean))].sort().map((name) => <option key={name}>{name}</option>)}</select></label>
        </div>

        <div className="ex-grid">
          {isLoading ? (
            <p className="empty-state">Loading workout library...</p>
          ) : filtered.length === 0 ? (
            <p className="empty-state">
              No exercises matched your search. Try a different keyword.
            </p>
          ) : (
            filtered.map((exercise) => (
              <article className="ex-card card" key={exercise.slug}>
                <span className="ex-muscles">{exercise.category}</span>
                <h3>{exercise.name}</h3>
                <p className="ex-desc">{exercise.description}</p>
                <div className="ex-meta">{exercise.muscles}</div>
                <div className="ex-meta">{exercise.equipment}</div>
                <Link className="ex-view" to={`/exercises/${exercise.slug}`}>
                  View exercise →
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
