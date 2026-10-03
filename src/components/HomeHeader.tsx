import { Link, NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/exercises", label: "Workouts" },
  { to: "/videos", label: "Videos" },
  { to: "/blog", label: "Blog" },
  { to: "/journey", label: "My Journey" },
  { to: "/nutrition", label: "Nutrition" },
];

export function HomeHeader() {
  return (
    <>
      <div className="bg-glow" aria-hidden="true" />
      <header className="site-header">
        <div className="container nav-wrap">
          <Link className="brand" to="/" aria-label="ShuzhFit Home">
            <span className="brand-dot" aria-hidden="true" />
            ShuzhFit
          </Link>

          <nav className="nav" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <Link
              className="nav-icon"
              to="/search"
              aria-label="Search ShuzhFit"
              title="Search"
            >
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.6-3.6" />
              </svg>
            </Link>

            <Link className="nav-link" to="/login">
              Log In
            </Link>
            <Link className="nav-link nav-cta" to="/register">
              Get Started
            </Link>
          </nav>

          <button
            className="nav-toggle"
            type="button"
            aria-label="Open menu"
            aria-expanded="false"
            data-nav-toggle
          >
            <span className="hamburger" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="mobile-panel" data-mobile-panel>
        <div className="container mobile-panel-inner">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav-link">
              {item.label}
            </NavLink>
          ))}
          <Link className="nav-link" to="/search">
            Search
          </Link>
          <Link className="nav-link" to="/login">
            Log In
          </Link>
          <Link className="nav-link nav-cta" to="/register">
            Get Started
          </Link>
        </div>
      </div>
    </>
  );
}
