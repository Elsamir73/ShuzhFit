import type { PropsWithChildren } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { APP_NAV_ITEMS } from "../lib/appShell";

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
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
