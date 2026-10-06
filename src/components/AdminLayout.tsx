import { useEffect, useState, type PropsWithChildren } from "react";
import { Link, NavLink } from "react-router-dom";
import { logoutUser } from "../lib/auth";

const links = [{ path: "/admin", label: "Overview", icon: "◫" }, { path: "/admin/members", label: "Members", icon: "♙" }, { path: "/admin/blogs", label: "Blog", icon: "▤" }, { path: "/admin/exercises", label: "Exercises", icon: "◉" }, { path: "/admin/videos", label: "Videos", icon: "▷" }, { path: "/admin/media", label: "Media", icon: "▧" }, { path: "/admin/comments", label: "Comments", icon: "☷" }, { path: "/admin/messages", label: "Messages", icon: "✉" }];
export function AdminLayout({ children }: PropsWithChildren) {
  const [unread, setUnread] = useState(0);
  useEffect(() => { void fetch("/api/admin/messages", { credentials: "same-origin" }).then((response) => response.ok ? response.json() as Promise<Array<{ isRead: boolean }>> : []).then((messages) => setUnread(messages.filter((message) => !message.isRead).length)).catch(() => setUnread(0)); }, []);
  return <div className="admin-layout-shell"><aside className="admin-sidebar"><Link className="brand" to="/admin">ShuzhFit <small>ADMIN</small></Link><nav aria-label="Admin navigation">{links.map((item) => <NavLink key={item.path} to={item.path} end={item.path === "/admin"} className={({ isActive }) => isActive ? "active" : ""}><span aria-hidden="true">{item.icon}</span>{item.label}{item.label === "Messages" && unread > 0 ? <span className="admin-unread-badge">{unread}</span> : null}</NavLink>)}</nav><div className="admin-sidebar-bottom"><Link to="/">View site ↗</Link><button type="button" onClick={() => void logoutUser()}>Log out</button></div></aside><main className="admin-content">{children}</main></div>;
}
