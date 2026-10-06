import type { PropsWithChildren } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { APP_NAV_ITEMS } from "../lib/appShell";

const navIcons: Record<string, string> = { Today: "M3 10.5 12 3l9 7.5V21H3z M9 21v-6h6v6", Train: "M6 4v16 M3 8h6 M3 16h6 M18 4v16 M15 8h6 M15 16h6", Food: "M4 3v7a3 3 0 0 0 6 0V3 M7 13v8 M16 3v18 M16 3c4 2 4 7 0 9", Progress: "M3 18 9 12l4 4 8-9 M15 7h6v6", Profile: "M20 21a8 8 0 0 0-16 0 M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8" };
function NavIcon({ label }: { label: string }) { return <svg className="app-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={navIcons[label] ?? "M4 4h16v16H4z"} /></svg>; }

export function AppShell({ children }: PropsWithChildren) {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="app-shell-sidebar">
        <Link
          className="app-shell-brand"
          to="/dashboard"
          aria-label="ShuzhFit dashboard"
        >
          <span className="brand-dot" aria-hidden="true" />
          ShuzhFit
        </Link>

        <nav className="app-shell-nav" aria-label="Member navigation">
          {APP_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `app-shell-link${isActive ? " active" : ""}`
              }
            >
              <NavIcon label={item.label} />
              <span className="app-shell-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {user ? (
          <div className="app-shell-user">
            <div>
              <strong>{user.name.split(" ")[0]}</strong>
              <small>{user.email}</small>
            </div>
            <Link className="app-shell-logout" to="/logout">
              Log out
            </Link>
          </div>
        ) : null}
      </aside>

      <div className="app-shell-main">
        <header className="app-shell-header">
          <div className="app-shell-header-inner">
            <span className="app-shell-kicker">Member area</span>
            <Link className="btn btn-primary btn-sm" to="/logout">
              Log out
            </Link>
          </div>
        </header>

        <main className="app-shell-body">{children}</main>
      </div>

      <nav
        className="app-shell-mobile-nav"
        aria-label="Mobile member navigation"
      >
        {APP_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `app-shell-mobile-link${isActive ? " active" : ""}`
            }
          >
            <NavIcon label={item.label} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
