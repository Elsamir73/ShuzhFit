import { Helmet } from "react-helmet-async";

const milestones = [
  {
    meta: "Foundation",
    title: "Keep the plan simple",
    body: "I learned that useful programming is not a perfect plan. It is a repeatable plan that gets done consistently.",
  },
  {
    meta: "Training",
    title: "Use the basics well",
    body: "Progress comes from quality reps, a clear schedule, and enough recovery to keep the work sustainable.",
  },
  {
    meta: "Nutrition",
    title: "Fuel the work",
    body: "Good nutrition is the support system behind the work in the gym. Consistency with protein, calories, and timing matters most.",
  },
  {
    meta: "Mindset",
    title: "Build habits, not drama",
    body: "The strongest routines are boring, realistic, and repeatable. Long-term progress is built by showing up, not chasing intensity.",
  },
];

export function JourneyPage() {
  return (
    <>
      <Helmet>
        <title>My Journey</title>
        <meta
          name="description"
          content="A simple look at the training, nutrition, and consistency principles behind ShuzhFit."
        />
      </Helmet>

      <section className="pg page">
        <div className="container">
          <div className="pg-head">
            <span className="pg-kicker">My Journey</span>
            <h1>Build strength with real-life consistency</h1>
            <p className="pg-intro">
              My approach is simple: train hard, recover well, eat with purpose,
              and focus on the habits that keep results sustainable.
            </p>
          </div>

          <div className="feature-grid" aria-label="ShuzhFit journey overview">
            {milestones.map((item) => (
              <article key={item.title} className="feature-card">
                <span className="feature-meta">{item.meta}</span>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
