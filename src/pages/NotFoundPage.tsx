import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Page Not Found</title>
        <meta
          name="description"
          content="This page does not exist in the ShuzhFit app."
        />
      </Helmet>

      <section className="pg page">
        <div className="container">
          <div className="pg-head">
            <span className="pg-kicker">ShuzhFit</span>
            <h1>Page not found</h1>
            <p className="pg-intro">
              The page you are looking for does not exist or has moved.
            </p>
          </div>

          <div className="app-panel" style={{ maxWidth: 720 }}>
            <p className="form-success">
              Try heading back to the home page or jump to a key area of the
              site to keep moving.
            </p>
            <div className="btn-row">
              <Link className="btn btn-primary" to="/">
                Go home
              </Link>
              <Link className="btn" to="/exercises">
                Browse exercises
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
