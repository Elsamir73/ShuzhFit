import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { getAdminBlogs, saveAdminBlogs, type BlogItem } from "../lib/adminData";

const emptyForm = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  category: "Strength",
  author: "ShuzhFit",
};

function makeSlug(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "new-post"
  );
}

export function AdminBlogsPage() {
  const [items, setItems] = useState<BlogItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  useEffect(() => {
    void getAdminBlogs().then((next) => setItems(next));
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

    const payload: BlogItem = {
      slug: form.slug.trim() || makeSlug(title),
      title,
      excerpt: form.excerpt,
      content: form.content,
      category: form.category,
      author: form.author,
    };

    const next = editingSlug
      ? items.map((item) => (item.slug === editingSlug ? payload : item))
      : [payload, ...items];

    setItems(next);
    await saveAdminBlogs(next);
    resetForm();
  }

  function handleEdit(item: BlogItem) {
    setEditingSlug(item.slug);
    setForm({ ...item });
  }

  async function handleDelete(slug: string) {
    const next = items.filter((item) => item.slug !== slug);
    setItems(next);
    await saveAdminBlogs(next);
    if (editingSlug === slug) {
      resetForm();
    }
  }

  return (
    <>
      <Helmet>
        <title>Admin Blog Manager</title>
        <meta
          name="description"
          content="Manage blog posts and training articles."
        />
      </Helmet>

      <section className="pg page">
        <div className="container admin-stack">
          <div className="pg-head">
            <span className="pg-kicker">Admin</span>
            <h1>Blog manager</h1>
            <p className="pg-intro">
              Write and manage your training articles and coaching posts.
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

              <div className="field-grid is-two-col">
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
                  <span>Author</span>
                  <input
                    value={form.author}
                    onChange={(event) =>
                      setForm({ ...form, author: event.target.value })
                    }
                  />
                </label>
              </div>

              <label className="field">
                <span>Excerpt</span>
                <textarea
                  value={form.excerpt}
                  onChange={(event) =>
                    setForm({ ...form, excerpt: event.target.value })
                  }
                  rows={3}
                />
              </label>

              <label className="field">
                <span>Content</span>
                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm({ ...form, content: event.target.value })
                  }
                  rows={6}
                />
              </label>

              <div className="admin-actions">
                <button type="submit" className="btn btn-primary">
                  {editingSlug ? "Update post" : "Add post"}
                </button>
                <button type="button" className="btn" onClick={resetForm}>
                  Clear
                </button>
              </div>
            </form>

            <aside className="admin-panel">
              <h2>Current posts</h2>
              <div className="admin-list">
                {items.map((item) => (
                  <div key={item.slug} className="admin-item">
                    <div className="admin-item-head">
                      <strong>{item.title}</strong>
                      <span>{item.category}</span>
                    </div>
                    <p>{item.excerpt}</p>
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
