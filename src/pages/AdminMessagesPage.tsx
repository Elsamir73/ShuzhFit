import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

type Message = {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  createdAt: string;
  isRead: boolean;
};
type MessageResponse = {
  messages: Message[];
  unreadCount: number;
  total: number;
  page: number;
  pageSize: number;
};

export function AdminMessagesPage() {
  const [items, setItems] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/messages?page=${page}`, { credentials: "same-origin" });
      if (!response.ok) throw new Error("Unable to load contact messages.");
      const data = await response.json() as MessageResponse;
      setItems(data.messages);
      setTotal(data.total);
      if (selectedId !== null && !data.messages.some((item) => item.id === selectedId)) {
        setSelectedId(null);
      }
      window.dispatchEvent(new Event("admin-messages-updated"));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load contact messages.");
    }
  }, [page, selectedId]);

  useEffect(() => { void load(); }, [load]);

  async function markRead(item: Message, isRead: boolean) {
    try {
      const response = await fetch("/api/admin/messages", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isRead }),
      });
      if (!response.ok) throw new Error("Unable to update message status.");
      setItems((current) => current.map((message) => message.id === item.id ? { ...message, isRead } : message));
      window.dispatchEvent(new Event("admin-messages-updated"));
      setError("");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update message status.");
    }
  }

  async function remove(item: Message) {
    if (!window.confirm("Delete this message?")) return;
    try {
      const response = await fetch(`/api/admin/messages?id=${item.id}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error("Unable to delete message.");
      setSelectedId(null);
      window.dispatchEvent(new Event("admin-messages-updated"));
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete message.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 25));
  return (
    <>
      <Helmet><title>Messages</title></Helmet>
      <section className="pg page">
        <div className="container">
          <div className="pg-head">
            <span className="pg-kicker">Admin</span>
            <h1>Messages</h1>
            <p className="pg-intro">Contact requests from the community.</p>
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <div className="message-list">
            {items.length ? items.map((item) => (
              <article key={item.id} className={`admin-panel message-card${item.isRead ? "" : " unread"}`}>
                <button type="button" className="message-select" onClick={() => setSelectedId(item.id)}
                  aria-expanded={selectedId === item.id}>
                  <span className="admin-item-head">
                    <strong>{item.name}</strong>
                    <span>{new Date(item.createdAt).toLocaleDateString()} · {item.isRead ? "Read" : "Unread"}</span>
                  </span>
                  <span>{item.email}</span>
                  <strong>{item.subject || "No subject"}</strong>
                  <span className="message-body">{item.message.slice(0, 160)}{item.message.length > 160 ? "…" : ""}</span>
                </button>
                {selectedId === item.id ? (
                  <div className="message-detail">
                    <h2>{item.subject || "No subject"}</h2>
                    <p><strong>From:</strong> {item.name} · <a href={`mailto:${item.email}`}>{item.email}</a></p>
                    <p><strong>Received:</strong> {new Date(item.createdAt).toLocaleString()}</p>
                    <p className="message-body">{item.message}</p>
                    <div className="btn-row">
                      <button className="btn btn-sm" type="button" onClick={() => void markRead(item, !item.isRead)}>
                        {item.isRead ? "Mark unread" : "Mark read"}
                      </button>
                      <a className="btn btn-sm" href={`mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(`Re: ${item.subject || "ShuzhFit enquiry"}`)}`}>
                        Reply
                      </a>
                      <button className="btn btn-sm" type="button" onClick={() => void remove(item)}>Delete</button>
                    </div>
                  </div>
                ) : null}
              </article>
            )) : <p className="empty-state">No messages yet.</p>}
          </div>
          <div className="btn-row" aria-label="Message pagination">
            <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </div>
      </section>
    </>
  );
}
