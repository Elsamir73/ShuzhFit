import { Helmet } from "react-helmet-async";

export function HomePage() {
  return (
    <>
      <Helmet>
        <title>ShuzhFit - Fitness guidance and training</title>
        <meta
          name="description"
          content="Simple strength guidance, training basics, nutrition habits, and a structured path to consistent results."
        />
      </Helmet>

      <section className="home-hero">
        <div className="container home-hero-inner">
          <div className="home-hero-copy">
            <div className="hero-badges">
              <span className="kicker">Fitness • Knowledge</span>
              <span className="badge">Built for consistency</span>
            </div>

            <h1>
              Train smart.
              <br />
              <span className="home-accent">Stay consistent.</span>
            </h1>

            <p className="home-hero-sub">
              Simple strength guidance, training basics, and nutrition habits
              for people who want to build a body that lasts.
            </p>

            <div className="home-actions">
              <a className="btn btn-primary btn-lg" href="/exercises">
                Explore workouts
              </a>
              <a className="btn btn-secondary btn-lg" href="/nutrition">
                Nutrition basics
              </a>
            </div>

            <div className="stat-strip">
              <div>
                <strong>3–5</strong>
                <span>Key training pillars</span>
              </div>
              <div>
                <strong>1</strong>
                <span>Sustainable routine</span>
              </div>
              <div>
                <strong>∞</strong>
                <span>Progress over time</span>
              </div>
            </div>
          </div>

          <aside className="home-hero-panel card paint-splash">
            <span className="tape-badge">This week</span>
            <h2>Keep it simple. Keep it moving.</h2>
            <ul className="hero-list">
              <li>Clear strength blocks built around effort and recovery</li>
              <li>Solid nutrition habits that support training and health</li>
              <li>Progress tracking that keeps the next session honest</li>
            </ul>
            <a className="btn btn-ghost" href="/knowledge">
              Learn the framework
            </a>
          </aside>
        </div>
      </section>

      <section className="home-section" aria-label="Explore ShuzhFit">
        <div className="container">
          <div className="home-dest-grid">
            <article className="dest-card card">
              <span className="feature-meta">Training</span>
              <h2>Workouts</h2>
              <p>
                Exercise guides, programming ideas, and essentials for better
                sessions.
              </p>
              <a className="dest-link" href="/exercises">
                Explore workouts
              </a>
            </article>

            <article className="dest-card card">
              <span className="feature-meta">Knowledge</span>
              <h2>Learning</h2>
              <p>
                Build your understanding of training, recovery, and consistency.
              </p>
              <a className="dest-link" href="/knowledge">
                Learn more
              </a>
            </article>

            <article className="dest-card card">
              <span className="feature-meta">Nutrition</span>
              <h2>Fuel</h2>
              <p>
                Simple food habits that support energy, recovery, and long-term
                results.
              </p>
              <a className="dest-link" href="/nutrition">
                Explore nutrition
              </a>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
