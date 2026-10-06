import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer public-footer">
      <div className="container public-footer-inner">
        <div className="footer-brand">
          <Link className="brand" to="/" aria-label="ShuzhFit home">ShuzhFit</Link>
          <p>Train smart. Stay consistent. Build strength for the long run.</p>
        </div>
        <nav className="footer-nav" aria-label="Social and contact links">
          <a href="https://www.youtube.com/@ShuzhFit" target="_blank" rel="noopener noreferrer">YouTube</a>
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
        <p className="health-disclaimer">Fitness content is educational and not medical advice. Check with a health professional before starting a new exercise program.</p>
        <p className="public-footer-copy">© 2026 ShuzhFit</p>
      </div>
    </footer>
  );
}
