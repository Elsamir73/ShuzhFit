import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

type MediaItem = { id: number; url: string; pathname: string; filename: string; contentType: string; size: number; width: number | null; height: number | null; altText: string };
const accepted = new Set(["image/jpeg", "image/png", "image/webp"]);

export function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]); const [progress, setProgress] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => { const response = await fetch("/api/admin/media", { credentials: "same-origin" }); if (!response.ok) throw new Error("Unable to load media library."); setItems(await response.json() as MediaItem[]); }, []);
  useEffect(() => { void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load media.")); }, [load]);
  async function acceptFiles(files: FileList | File[]) { setError(""); for (const file of Array.from(files)) { if (!accepted.has(file.type) || file.size > 8 * 1024 * 1024) { setError(`${file.name}: choose a JPEG, PNG, or WebP under 8 MB.`); continue; } setBusy(true); setProgress(0); try { await upload(file.name, file, { access: "public", handleUploadUrl: "/api/admin/media", onUploadProgress: (event) => setProgress(Math.round(event.percentage)) }); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Upload failed."); } finally { setBusy(false); setProgress(0); } } }
  async function updateAlt(item: MediaItem, altText: string) { const response = await fetch("/api/admin/media", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "alt", id: item.id, altText }) }); if (!response.ok) setError("Could not update alternative text."); else await load(); }
  async function remove(item: MediaItem) { if (!window.confirm(`Delete ${item.filename}? This also removes the image from Blob storage.`)) return; const response = await fetch("/api/admin/media", { method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id: item.id }) }); if (!response.ok) { setError("Could not delete this image."); return; } await load(); }
  return <><Helmet><title>Media · Admin</title></Helmet><section className="pg page"><div className="container admin-stack"><header className="pg-head"><span className="pg-kicker">Admin</span><h1>Media library</h1><p className="pg-intro">Upload and manage site images.</p></header><label className="media-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void acceptFiles(event.dataTransfer.files); }}><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { if (event.target.files) void acceptFiles(event.target.files); event.target.value = ""; }} /><strong>Drop images here or choose files</strong><span>JPEG, PNG, WebP · up to 8 MB each</span>{busy ? <progress max={100} value={progress}>{progress}%</progress> : null}</label>{error ? <p role="alert">{error}</p> : null}{!items.length ? <div className="empty-state">No images uploaded yet.</div> : <div className="media-grid">{items.map((item) => <article className="app-panel media-card" key={item.id}><img src={item.url} alt={item.altText} width={item.width ?? 640} height={item.height ?? 480} loading="lazy"/><strong>{item.filename}</strong><small>{(item.size / 1024).toFixed(0)} KB · {item.contentType}</small><label className="field"><span>Alternative text</span><input defaultValue={item.altText} onBlur={(event) => { if (event.target.value !== item.altText) void updateAlt(item, event.target.value); }}/></label><div className="btn-row"><button className="btn btn-sm" onClick={() => void navigator.clipboard.writeText(item.url)}>Copy URL</button><button className="btn btn-sm" onClick={() => void remove(item)}>Delete</button></div></article>)}</div>}</div></section></>;
}

export function MediaPicker({ onSelect, onClose }: { onSelect: (item: MediaItem) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void fetch("/api/admin/media", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load media library. Please try again.");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("The media library returned an invalid response.");
        if (active) setItems(data as MediaItem[]);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load media library.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className="modal-backdrop media-picker-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="app-panel media-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
      >
        <header className="media-picker-header">
          <h2 id="media-picker-title">Choose media</h2>
          <div className="media-picker-actions">
            <Link className="btn btn-sm" to="/admin/media">Upload new</Link>
            <button ref={closeButtonRef} className="btn" type="button" onClick={onClose}>Close</button>
          </div>
        </header>
        <div className="media-picker-body">
          {loading ? <p role="status">Loading media...</p> : null}
          {error ? <p className="media-picker-error" role="alert">{error}</p> : null}
          {!loading && !error && !items.length ? (
            <p className="media-picker-empty">
              No media yet. Upload photos in <Link to="/admin/media">Admin &gt; Media</Link>.
            </p>
          ) : null}
          {!loading && !error && items.length ? (
            <div className="media-grid media-picker-grid">
              {items.map((item) => (
                <button className="media-picker-item" key={item.id} type="button" onClick={() => onSelect(item)}>
                  <img src={item.url} alt={item.altText || item.filename} loading="lazy" width={item.width ?? 640} height={item.height ?? 480}/>
                  <span>{item.filename || item.altText || "Untitled image"}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
