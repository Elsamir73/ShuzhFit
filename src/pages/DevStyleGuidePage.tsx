export function DevStyleGuidePage() {
  return (
    <section className="pg page">
      <div className="container" style={{ display: "grid", gap: 24 }}>
        <div className="pg-head">
          <span className="pg-kicker">Dev</span>
          <h1>Style guide</h1>
          <p className="pg-intro">
            Shared tokens, buttons, cards, badges, and layout primitives for the
            ShuzhFit product system.
          </p>
        </div>

        <div className="section section--dark card" style={{ padding: 24 }}>
          <div className="chip-row">
            <span className="tape-badge">Health and fitness</span>
            <span className="badge">Beginner</span>
            <span className="badge">Strength</span>
          </div>

          <div className="btn-row" style={{ marginTop: 20 }}>
            <button className="btn btn-primary btn-lg">Primary</button>
            <button className="btn btn-secondary">Secondary</button>
            <button className="btn btn-ghost">Ghost</button>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="chip-row">
            <span className="chip is-active">All</span>
            <span className="chip">Upper</span>
            <span className="chip">Lower</span>
            <span className="chip">Core</span>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="field-grid is-two-col">
            <label className="field">
              <span>Label</span>
              <input value="Example" readOnly />
            </label>
            <label className="field">
              <span>Category</span>
              <select defaultValue="strength">
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
              </select>
            </label>
          </div>
        </div>

        <div className="feature-grid">
          <article className="feature-card card">
            <span className="feature-meta">Training</span>
            <h2>Workouts</h2>
            <p>Simple plans and clear progress signals.</p>
          </article>
          <article className="feature-card card">
            <span className="feature-meta">Food</span>
            <h2>Nutrition</h2>
            <p>Calorie-aware habits built for consistency.</p>
          </article>
          <article className="feature-card card">
            <span className="feature-meta">Progress</span>
            <h2>Results</h2>
            <p>Track trend lines and keep the next session honest.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
