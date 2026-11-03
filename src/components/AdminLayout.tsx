import { useCallback, useEffect, useState, type PropsWithChildren } from "react";
import { Link, NavLink } from "react-router-dom";
import { logoutUser } from "../lib/auth";

const links = [
  { path: "/admin", label: "Overview", icon: "◫" },
  { path: "/admin/members", label: "Members", icon: "♙" },
  { path: "/admin/blogs", label: "Blog", icon: "▤" },
  { path: "/admin/exercises", label: "Exercises", icon: "◉" },
  { path: "/admin/videos", label: "Videos", icon: "▷" },
  { path: "/admin/media", label: "Media", icon: "▧" },
  { path: "/admin/comments", label: "Comments", icon: "☷" },
  { path: "/admin/messages", label: "Messages", icon: "✉" },
];

export function AdminLayout({ children }: PropsWithChildren) {
  const [unread, setUnread] = useState(0);
  const updateUnread = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/messages?page=1", { credentials: "same-origin" });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json() as { unreadCount: number };
      setUnread(data.unreadCount);
    } catch (error) {
      console.error("Unable to refresh admin message count.", error);
    }
  }, []);

  useEffect(() => {
    void updateUnread();
    window.addEventListener("admin-messages-updated", updateUnread);
    return () => window.removeEventListener("admin-messages-updated", updateUnread);
  }, [updateUnread]);

  return (
    <div className="admin-layout-shell">
      <aside className="admin-sidebar">
        <Link className="brand" to="/admin">ShuzhFit <small>ADMIN</small></Link>
        <nav aria-label="Admin navigation">
          {links.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === "/admin"}
              className={({ isActive }) => isActive ? "active" : ""}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
              {item.label === "Messages" && unread > 0 ? <span className="admin-unread-badge">{unread}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link to="/">View site ↗</Link>
          <button type="button" onClick={() => void logoutUser()}>Log out</button>
        </div>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
