import { Link } from "react-router-dom";

const footerLinks = [
  { to: "/exercises", label: "Workouts" },
  { to: "/videos", label: "Videos" },
  { to: "/blog", label: "Blog" },
  { to: "/journey", label: "My Journey" },
  { to: "/nutrition", label: "Nutrition" },
  { to: "/contact", label: "Contact" },
];

export function HomeFooter() {
  return (
    <footer className="site-footer home-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link className="brand" to="/" aria-label="ShuzhFit Home">
            <span className="brand-dot" aria-hidden="true" />
            ShuzhFit
          </Link>
          <p>
            Real training, practical nutrition, and consistent progress for the
            long game.
          </p>
        </div>

        <div className="footer-links">
          <h3>Explore</h3>
          <nav className="footer-nav" aria-label="Footer navigation">
            {footerLinks.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="footer-links">
          <h3>Member access</h3>
          <nav className="footer-nav" aria-label="Member access links">
            <Link to="/login">Log in</Link>
            <Link to="/register">Get started</Link>
            <Link to="/search">Search</Link>
          </nav>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© 2026 ShuzhFit</p>
      </div>
    </footer>
  );
}
