import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { getAdminBlogs, saveAdminBlogs, type BlogItem } from "../lib/adminData";
import { MediaPicker } from "./AdminMediaPage";

const emptyForm = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  category: "Strength",
  author: "ShuzhFit",
  status: "draft" as "draft" | "published",
  publishedAt: "",
  contentFormat: "markdown" as "html" | "markdown",
  coverImage: "",
  seoTitle: "",
  seoDescription: "",
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

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
      status: form.status,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      contentFormat: form.contentFormat,
      coverImage: form.coverImage,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
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
    setForm({ ...emptyForm, ...item, publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 16) : "", coverImage: item.coverImage ?? "" });
  }

  async function handleDelete(slug: string) {
    if (!window.confirm(`Delete “${slug}” permanently?`)) return;
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

              <div className="field-grid is-two-col"><label className="field"><span>Publishing status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as typeof form.status })}><option value="draft">Draft</option><option value="published">Published</option></select></label><label className="field"><span>Publish date</span><input type="datetime-local" value={form.publishedAt} onChange={(event) => setForm({ ...form, publishedAt: event.target.value })}/></label><label className="field"><span>Body format</span><select value={form.contentFormat} onChange={(event) => setForm({ ...form, contentFormat: event.target.value as typeof form.contentFormat })}><option value="markdown">Markdown</option><option value="html">Legacy HTML</option></select></label></div>
              <label className="field"><span>Cover image</span><input type="url" value={form.coverImage} onChange={(event) => setForm({ ...form, coverImage: event.target.value })}/></label><button type="button" className="btn btn-sm" onClick={() => setMediaOpen(true)}>Choose cover from Media</button>
              <div className="blog-editor-grid"><label className="field"><span>Content</span>{form.contentFormat === "markdown" ? <div className="btn-row"><button type="button" className="btn btn-sm" onClick={() => setForm({ ...form, content: `${form.content}**bold text**` })}>Bold</button><button type="button" className="btn btn-sm" onClick={() => setForm({ ...form, content: `${form.content}## Heading\n` })}>H2</button><button type="button" className="btn btn-sm" onClick={() => setForm({ ...form, content: `${form.content}- List item\n` })}>List</button><button type="button" className="btn btn-sm" onClick={() => setForm({ ...form, content: `${form.content}[link](https://)` })}>Link</button><button type="button" className="btn btn-sm" onClick={() => setMediaOpen(true)}>Image</button></div> : null}
                <textarea ref={contentRef}
                  value={form.content}
                  onChange={(event) =>
                    setForm({ ...form, content: event.target.value })
                  }
                  rows={12}
                />
              </label><section className="blog-preview"><h3>Live preview</h3>{form.contentFormat === "markdown" ? <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{form.content}</ReactMarkdown> : <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.content) }}/>}</section></div>
              <div className="field-grid is-two-col"><label className="field"><span>SEO title</span><input maxLength={200} value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}/></label><label className="field"><span>SEO description</span><textarea maxLength={500} value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}/></label></div>

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
                <div className="field-grid is-two-col"><label className="field"><span>Search posts</span><input value={query} onChange={(event) => setQuery(event.target.value)}/></label><label className="field"><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All</option><option value="draft">Draft</option><option value="published">Published</option></select></label></div>
                {items.filter((item) => (!statusFilter || (item.status ?? "published") === statusFilter) && `${item.title} ${item.slug}`.toLowerCase().includes(query.toLowerCase())).map((item) => (
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
      {mediaOpen ? <MediaPicker onClose={() => setMediaOpen(false)} onSelect={(item) => { setForm((current) => ({ ...current, coverImage: item.url, content: current.contentFormat === "markdown" ? `${current.content}\n\n![${item.altText || item.filename}](${item.url})` : current.content })); setMediaOpen(false); }} /> : null}
    </>
  );
}
