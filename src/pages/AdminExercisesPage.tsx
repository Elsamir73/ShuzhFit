import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import {
  getAdminExercises,
  saveAdminExercises,
  type ExerciseItem,
} from "../lib/adminData";
import { MediaPicker } from "./AdminMediaPage";

const emptyForm = {
  slug: "",
  name: "",
  category: "Strength",
  muscles: "",
  equipment: "",
  difficulty: "Beginner",
  description: "",
  benefits: "",
  formGuide: "",
  mistakes: "",
  youtubeUrl: "",
  muscleGroup: "full_body",
  stepsText: "",
  tipsText: "",
  mistakesListText: "",
  repUnit: "reps" as "reps" | "seconds" | "meters",
  imageUrl: "",
};

function makeSlug(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "new-exercise"
  );
}

export function AdminExercisesPage() {
  const [items, setItems] = useState<ExerciseItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  useEffect(() => {
    void getAdminExercises().then((next) => setItems(next));
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingSlug(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      return;
    }
    const steps = form.stepsText.split("\n").map((step) => step.trim()).filter(Boolean);
    if (steps.length < 3) { window.alert("Published exercises need at least three steps."); return; }

    const payload: ExerciseItem = {
      slug: form.slug.trim() || makeSlug(trimmedName),
      name: trimmedName,
      category: form.category,
      muscles: form.muscles,
      equipment: form.equipment,
      difficulty: form.difficulty,
      description: form.description,
      benefits: form.benefits,
      formGuide: form.formGuide,
      mistakes: form.mistakes,
      youtubeUrl: form.youtubeUrl,
      muscleGroup: form.muscleGroup,
      steps,
      tips: form.tipsText.split("\n").map((tip) => tip.trim()).filter(Boolean).slice(0, 3),
      mistakesList: form.mistakesListText.split("\n").map((mistake) => mistake.trim()).filter(Boolean).slice(0, 4),
      repUnit: form.repUnit,
      imageUrl: form.imageUrl,
    };

    const next = editingSlug
      ? items.map((item) => (item.slug === editingSlug ? payload : item))
      : [payload, ...items];

    setItems(next);
    await saveAdminExercises(next);
    resetForm();
  }

  function handleEdit(item: ExerciseItem) {
    setEditingSlug(item.slug);
    setForm({ ...emptyForm, ...item, youtubeUrl: item.youtubeUrl ?? "", muscleGroup: item.muscleGroup ?? "full_body", stepsText: item.steps?.join("\n") ?? "", tipsText: item.tips?.join("\n") ?? "", mistakesListText: item.mistakesList?.join("\n") ?? "", repUnit: item.repUnit ?? "reps", imageUrl: item.imageUrl ?? "" });
  }

  async function handleDelete(slug: string) {
    const next = items.filter((item) => item.slug !== slug);
    setItems(next);
    await saveAdminExercises(next);
    if (editingSlug === slug) {
      resetForm();
    }
  }

  return (
    <>
      <Helmet>
        <title>Admin Exercises</title>
        <meta
          name="description"
          content="Manage exercise content for the ShuzhFit app."
        />
      </Helmet>

      <section className="pg page">
        <div className="container admin-stack">
          <div className="pg-head">
            <span className="pg-kicker">Admin</span>
            <h1>Exercise manager</h1>
            <p className="pg-intro">
              Create, edit, and remove exercise library entries.
            </p>
          </div>

          <div className="admin-layout">
            <form onSubmit={handleSubmit} className="admin-panel admin-form">
              <div className="field-grid is-two-col">
                <label className="field">
                  <span>Name</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Slug</span>
                  <input
                    value={form.slug}
                    onChange={(event) =>
                      setForm({ ...form, slug: event.target.value })
                    }
                  />
                </label>
              </div>

              <div className="field-grid is-three-col">
                <label className="field">
                  <span>Category</span>
                  <input
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Equipment</span>
                  <input
                    value={form.equipment}
                    onChange={(event) =>
                      setForm({ ...form, equipment: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Difficulty</span>
                  <select
                    value={form.difficulty}
                    onChange={(event) =>
                      setForm({ ...form, difficulty: event.target.value })
                    }
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Muscles</span>
                <input
                  value={form.muscles}
                  onChange={(event) =>
                    setForm({ ...form, muscles: event.target.value })
                  }
                />
              </label>
              <div className="field-grid is-two-col"><label className="field"><span>Muscle group</span><select value={form.muscleGroup} onChange={(event) => setForm({ ...form, muscleGroup: event.target.value })}>{["chest", "back", "legs", "shoulders", "arms", "core", "full_body"].map((group) => <option key={group} value={group}>{group.replace("_", " ")}</option>)}</select></label><label className="field"><span>Rep unit</span><select value={form.repUnit} onChange={(event) => setForm({ ...form, repUnit: event.target.value as typeof form.repUnit })}><option value="reps">Reps</option><option value="seconds">Seconds</option><option value="meters">Meters</option></select></label></div>
              <label className="field"><span>Steps (one per line, 3–7)</span><textarea required value={form.stepsText} onChange={(event) => setForm({ ...form, stepsText: event.target.value })} rows={6} /></label>
              <label className="field"><span>Coach tips (one per line)</span><textarea value={form.tipsText} onChange={(event) => setForm({ ...form, tipsText: event.target.value })} rows={3} /></label>
              <label className="field"><span>Common mistakes (one per line)</span><textarea value={form.mistakesListText} onChange={(event) => setForm({ ...form, mistakesListText: event.target.value })} rows={3} /></label>

              <label className="field">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  rows={3}
                />
              </label>

              <label className="field">
                <span>Benefits</span>
                <textarea
                  value={form.benefits}
                  onChange={(event) =>
                    setForm({ ...form, benefits: event.target.value })
                  }
                  rows={3}
                />
              </label>

              <label className="field">
                <span>Form guide</span>
                <textarea
                  value={form.formGuide}
                  onChange={(event) =>
                    setForm({ ...form, formGuide: event.target.value })
                  }
                  rows={3}
                />
              </label>

              <label className="field">
                <span>Mistakes</span>
                <textarea
                  value={form.mistakes}
                  onChange={(event) =>
                    setForm({ ...form, mistakes: event.target.value })
                  }
                  rows={3}
                />
              </label>

              <label className="field">
                <span>YouTube URL</span>
                <input
                  value={form.youtubeUrl}
                  onChange={(event) =>
                    setForm({ ...form, youtubeUrl: event.target.value })
                  }
                />
              </label>
              <label className="field"><span>Image URL</span><input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></label><button type="button" className="btn" onClick={() => setMediaOpen(true)}>Choose from Media</button>

              <div className="admin-actions">
                <button type="submit" className="btn btn-primary">
                  {editingSlug ? "Update exercise" : "Add exercise"}
                </button>
                <button type="button" className="btn" onClick={resetForm}>
                  Clear
                </button>
              </div>
            </form>

            <aside className="admin-panel">
              <h2>Current entries</h2>
              <div className="admin-list">
                {items.map((item) => (
                  <div key={item.slug} className="admin-item">
                    <div className="admin-item-head">
                      <strong>{item.name}</strong>
                      <span>{item.category}</span>
                    </div>
                    <p>{item.muscles}</p>
                    <div className="admin-actions">
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => handleDelete(item.slug)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
      {mediaOpen ? <MediaPicker onClose={() => setMediaOpen(false)} onSelect={(item) => { setForm((current) => ({ ...current, imageUrl: item.url })); setMediaOpen(false); }} /> : null}
    </>
  );
}
