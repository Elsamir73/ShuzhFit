import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import {
  getAdminVideos,
  saveAdminVideos,
  type VideoItem,
} from "../lib/adminData";

const emptyForm = {
  slug: "",
  title: "",
  description: "",
  youtubeUrl: "",
  exerciseSlug: "",
};

function makeSlug(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "new-video"
  );
}

export function AdminVideosPage() {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  useEffect(() => {
    void getAdminVideos().then((next) => setItems(next));
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingSlug(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      return;
    }

    const payload: VideoItem = {
      slug: form.slug.trim() || makeSlug(title),
      title,
      description: form.description,
      youtubeUrl: form.youtubeUrl,
      exerciseSlug: form.exerciseSlug,
    };

    const next = editingSlug
      ? items.map((item) => (item.slug === editingSlug ? payload : item))
      : [payload, ...items];

    setItems(next);
    await saveAdminVideos(next);
    resetForm();
  }

  function handleEdit(item: VideoItem) {
    setEditingSlug(item.slug);
    setForm({
      ...item,
      exerciseSlug: item.exerciseSlug ?? "",
    });
  }

  async function handleDelete(slug: string) {
    const next = items.filter((item) => item.slug !== slug);
    setItems(next);
    await saveAdminVideos(next);
    if (editingSlug === slug) {
      resetForm();
    }
  }

  return (
    <>
      <Helmet>
        <title>Admin Video Manager</title>
        <meta
          name="description"
          content="Manage video lessons and exercise demos."
        />
      </Helmet>

      <section className="pg page">
        <div className="container admin-stack">
          <div className="pg-head">
            <span className="pg-kicker">Admin</span>
            <h1>Video manager</h1>
            <p className="pg-intro">
              Upload or curate video resources for your exercise library.
            </p>
          </div>

          <div className="admin-layout">
            <form onSubmit={handleSubmit} className="admin-panel admin-form">
              <div className="field-grid is-two-col">
                <label className="field">
                  <span>Title</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm({ ...form, title: event.target.value })
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

              <label className="field">
                <span>Exercise slug</span>
                <input
                  value={form.exerciseSlug ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, exerciseSlug: event.target.value })
                  }
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

              <label className="field">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  rows={4}
                />
              </label>

              <div className="admin-actions">
                <button type="submit" className="btn btn-primary">
                  {editingSlug ? "Update video" : "Add video"}
                </button>
                <button type="button" className="btn" onClick={resetForm}>
                  Clear
                </button>
              </div>
            </form>

            <aside className="admin-panel">
              <h2>Current videos</h2>
              <div className="admin-list">
                {items.map((item) => (
                  <div key={item.slug} className="admin-item">
                    <div className="admin-item-head">
                      <strong>{item.title}</strong>
                    </div>
                    <p>{item.description}</p>
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
    </>
  );
}
