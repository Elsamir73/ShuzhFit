import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/exercises", label: "Workouts" },
  { to: "/videos", label: "Videos" },
  { to: "/journey", label: "My Journey" },
  { to: "/blog", label: "Blog" },
];

export function Header() {
  const { user } = useAuth();

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

            {user ? (
              <details className="nav-drop nav-user">
                <summary className="nav-link nav-cta">
                  {user.name.split(" ")[0]} ▾
                </summary>
                <div className="drop-panel drop-right">
                  <Link to="/dashboard">Dashboard</Link>
                  <Link to="/workout">Start Workout</Link>
                  <Link to="/workout-history">Workout History</Link>
                  <Link to="/nutrition-log">Food Log</Link>
                  <Link to="/meal-planner">Meal Planner</Link>
                  <Link to="/progress">Progress</Link>
                  <Link to="/profile">My Profile &amp; Goals</Link>
                  <Link to="/bmi">BMI &amp; Calories</Link>
                  {user.role === "admin" ? (
                    <Link to="/admin">Admin</Link>
                  ) : null}
                  <Link to="/logout">Log Out</Link>
                </div>
              </details>
            ) : (
              <>
                <Link className="nav-link" to="/login">
                  Log In
                </Link>
                <Link className="nav-link nav-cta" to="/register">
                  Get Started
                </Link>
              </>
            )}
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
          <Link className="nav-link" to="/bmi">
            BMI &amp; Calories
          </Link>
          <Link className="nav-link" to="/search">
            Search
          </Link>
          {user ? (
            <>
              <Link className="nav-link" to="/dashboard">
                Dashboard
              </Link>
              <Link className="nav-link" to="/workout">
                Start Workout
              </Link>
              <Link className="nav-link" to="/workout-history">
                Workout History
              </Link>
              <Link className="nav-link" to="/nutrition-log">
                Food Log
              </Link>
              <Link className="nav-link" to="/meal-planner">
                Meal Planner
              </Link>
              <Link className="nav-link" to="/progress">
                Progress
              </Link>
              <Link className="nav-link" to="/profile">
                My Profile &amp; Goals
              </Link>
              <Link className="nav-link" to="/logout">
                Log Out
              </Link>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">
                Log In
              </Link>
              <Link className="nav-link nav-cta" to="/register">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
