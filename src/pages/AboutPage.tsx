import {
  Compass,
  Dumbbell,
  LineChart,
  ShieldCheck,
  Target,
  Utensils,
  Video,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { aboutCopy } from "../content/about";
import "../styles/about.css";

const storyOpeningEnd = aboutCopy.whyStarted.indexOf(". ") + 1;

const platformFeatures = [
  {
    title: "Start simple",
    description: "Practical guidance that is easy to follow.",
    Icon: Compass,
  },
  {
    title: "Track yourself",
    description: "Plan workouts and log food and progress for free.",
    Icon: LineChart,
  },
  {
    title: "Honest guidance",
    description: "Real experience, no fake transformations.",
    Icon: ShieldCheck,
  },
];

const thingsToExplore = [
  {
    title: "Exercise library",
    description: "Step-by-step guides for every move",
    Icon: Dumbbell,
  },
  {
    title: "YouTube videos",
    description: "Watch my training on the channel",
    Icon: Video,
  },
  {
    title: "Food tracking",
    description: "Log meals and see your targets",
    Icon: Utensils,
  },
  {
    title: "Goal plans",
    description: "Muscle gain or fat loss, one day at a time",
    Icon: Target,
  },
];

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About | ShuzhFit</title>
        <meta
          name="description"
          content="The story and purpose behind ShuzhFit."
        />
      </Helmet>
      <section className="about-page" aria-labelledby="about-title">
        <div className="container about-content">
          <header className="about-hero">
            <img
              className="about-hero-photo"
              src="/images/shuzh-hero.jpg"
              width="683"
              height="1086"
              alt="Samir Pathak training at the gym"
            />
            <div className="about-hero-copy">
              <span className="tape-badge">ABOUT SHUZHFIT</span>
              <h1 id="about-title">Hi, I&apos;m Samir.</h1>
              <p>{aboutCopy.heroLine}</p>
            </div>
          </header>

          <section className="about-section about-story">
            <h2>Why I started</h2>
            <div className="about-readable">
              <p className="about-pull-quote">
                {aboutCopy.whyStarted.slice(0, storyOpeningEnd)}
              </p>
              <p>{aboutCopy.whyStarted.slice(storyOpeningEnd).trim()}</p>
            </div>
          </section>

          <section className="about-section">
            <h2>What ShuzhFit is</h2>
            <p className="about-section-intro">{aboutCopy.whatItIs}</p>
            <div className="about-feature-grid">
              {platformFeatures.map(({ title, description, Icon }) => (
                <article className="about-card" key={title}>
                  <Icon className="about-card-icon" aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="about-section">
            <h2>What you get here</h2>
            <p className="about-section-intro">{aboutCopy.whatYouGet}</p>
            <div className="about-benefit-grid">
              {thingsToExplore.map(({ title, description, Icon }) => (
                <article className="about-card about-benefit-card" key={title}>
                  <Icon className="about-card-icon" aria-hidden="true" />
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="about-belief">
            <p>{aboutCopy.community}</p>
          </section>

          <section className="about-closing">
            <h2>Start where you are</h2>
            <div className="about-actions">
              <a
                className="btn btn-primary btn-lg"
                href="https://www.youtube.com/@ShuzhFit?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Subscribe on YouTube
              </a>
              <Link className="btn btn-secondary btn-lg" to="/register">
                Create free account
              </Link>
            </div>
            <p className="about-contact">
              Questions? {aboutCopy.contact}{" "}
              <Link to="/contact">Contact ShuzhFit</Link>.
            </p>
          </section>
        </div>
      </section>
    </>
  );
}
