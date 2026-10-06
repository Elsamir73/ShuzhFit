import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/exercises", label: "Workouts" },
  { to: "/videos", label: "Videos" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
  { to: "/nutrition", label: "Nutrition" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link className="brand" to="/" aria-label="ShuzhFit home">
          <span className="brand-dot" aria-hidden="true" />
          ShuzhFit
        </Link>

        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              end={item.end}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
          <Link className="nav-icon" to="/search" aria-label="Search ShuzhFit" title="Search">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
          </Link>
          <Link className="nav-link nav-login" to="/login">Log in</Link>
          <Link className="nav-link nav-cta" to="/register">Get started</Link>
        </nav>

        <button
          className="nav-toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="public-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={`hamburger${menuOpen ? " is-open" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <nav
        id="public-mobile-menu"
        className={`mobile-panel${menuOpen ? " is-open" : ""}`}
        aria-label="Mobile navigation"
        hidden={!menuOpen}
      >
        <div className="container mobile-panel-inner">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              end={item.end}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
          <Link className="nav-link" to="/search">Search</Link>
          <Link className="nav-link" to="/login">Log in</Link>
          <Link className="nav-link nav-cta" to="/register">Get started</Link>
        </div>
      </nav>
    </header>
  );
}
