import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer app-footer">
      <div className="container footer-wrap">
        <p>© 2026 ShuzhFit</p>
        <nav className="footer-meta" aria-label="App footer">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/workout">Workout</Link>
          <Link to="/progress">Progress</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </div>
    </footer>
  );
}
