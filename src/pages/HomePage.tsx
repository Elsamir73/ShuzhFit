import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { loadVideos } from "../lib/contentApi";
import type { Video } from "../lib/content";

function FeatureIcon({ kind }: { kind: "workouts" | "progress" | "nutrition" }) {
  if (kind === "workouts") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6.5 6.5 11 11M3 3l1 1m17 17-1-1M2 6l4-4m12 20 4-4M3 10l7-7m4 18 7-7" /></svg>;
  }
  if (kind === "progress") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18M7 14l4-4 4 3 6-7M16 6h5v5" /></svg>;
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20.5c-4.5 0-8-3.7-8-8.2 0-3.7 2.1-6.3 5.5-6.3 1.2 0 2 .5 2.5 1.1.5-.6 1.3-1.1 2.5-1.1 3.4 0 5.5 2.6 5.5 6.3 0 4.5-3.5 8.2-8 8.2Z"/><path d="M12 7c-.4-2.2.8-4 3.2-4.5"/></svg>;
}

function VideoCard({ video }: { video: Video }) {
  return (
    <a className="channel-card" href={video.youtubeUrl} target="_blank" rel="noopener noreferrer">
      <div className="channel-card-media">
        {video.thumbnail ? <img src={video.thumbnail} alt="" loading="lazy" /> : null}
        <span className="channel-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7z" /></svg></span>
      </div>
      <div className="channel-card-copy">
        <span className="mono-label">ShuzhFit video</span>
        <h3>{video.title}</h3>
        <span className="channel-watch">Watch video <span aria-hidden="true">↗</span></span>
      </div>
    </a>
  );
}

export function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadVideos().then((items) => {
      if (active) {
        setVideos(items.slice(0, 3));
        setVideosLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  return (
    <>
      <Helmet>
        <title>ShuzhFit — Train smart. Stay consistent.</title>
        <meta name="description" content="Simple strength guidance, practical training, nutrition habits, and a tracker to help you stay consistent." />
      </Helmet>

      <section className="home-hero" aria-labelledby="home-title">
        <img
          className="home-hero-photo"
          src="/images/shuzh-hero.jpg"
          alt="Shuzh training cable triceps pushdown"
          width={683}
          height={1086}
          fetchPriority="high"
        />
        <div className="home-hero-wash" aria-hidden="true" />
        <div className="container home-hero-inner">
          <div className="home-hero-copy">
            <span className="tape-badge">Health and fitness, simplified</span>
            <h1 id="home-title">Train smart.<br /><span className="home-accent">Stay consistent.</span></h1>
            <p className="home-hero-sub">Practical workouts and simple habits to help you get stronger and stay on track.</p>
            <div className="home-actions">
              <Link className="btn btn-primary btn-lg" to="/exercises">Explore workouts</Link>
              <a className="btn btn-secondary btn-lg" href="https://www.youtube.com/@ShuzhFit" target="_blank" rel="noopener noreferrer">Watch on YouTube <span aria-hidden="true">↗</span></a>
            </div>
            <ul className="home-facts" aria-label="ShuzhFit features">
              <li>25+ exercises with form guides</li>
              <li>Free weekly plan built for you</li>
              <li>Track workouts, food and progress</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="home-section channel-section" aria-labelledby="channel-title">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <span className="mono-label">New training videos</span>
              <h2 id="channel-title">Latest from the channel</h2>
            </div>
            <a className="btn btn-secondary" href="https://www.youtube.com/@ShuzhFit" target="_blank" rel="noopener noreferrer">Watch more on YouTube <span aria-hidden="true">↗</span></a>
          </div>
          {videosLoading ? (
            <div className="channel-grid" aria-label="Loading latest videos" aria-busy="true">
              {[1, 2, 3].map((item) => <div className="channel-skeleton" key={item}><div /><span /></div>)}
            </div>
          ) : videos.length ? (
            <div className="channel-grid">{videos.map((video) => <VideoCard key={video.slug} video={video} />)}</div>
          ) : (
            <div className="channel-empty"><p>New videos are on the channel.</p><a href="https://www.youtube.com/@ShuzhFit" target="_blank" rel="noopener noreferrer">Visit ShuzhFit on YouTube ↗</a></div>
          )}
        </div>
      </section>

      <section className="home-section feature-section" aria-labelledby="feature-title">
        <div className="container">
          <div className="section-heading-row feature-heading">
            <div><span className="mono-label">Built for your routine</span><h2 id="feature-title">Tools to keep moving</h2></div>
          </div>
          <div className="home-feature-grid">
            <article className="home-feature-card">
              <span className="feature-icon"><FeatureIcon kind="workouts" /></span>
              <span className="mono-label">01 / Train</span>
              <h3>Workouts</h3>
              <p>Find exercise guides and build a repeatable strength routine.</p>
              <Link to="/exercises">Explore workouts <span aria-hidden="true">→</span></Link>
            </article>
            <article className="home-feature-card">
              <span className="feature-icon"><FeatureIcon kind="progress" /></span>
              <span className="mono-label">02 / Track</span>
              <h3>Track progress</h3>
              <p>Keep workouts and progress in one place as you build the habit.</p>
              <Link to="/register">Start tracking <span aria-hidden="true">→</span></Link>
            </article>
            <article className="home-feature-card">
              <span className="feature-icon"><FeatureIcon kind="nutrition" /></span>
              <span className="mono-label">03 / Fuel</span>
              <h3>Nutrition</h3>
              <p>Make food choices that support your energy, training, and recovery.</p>
              <Link to="/nutrition">Explore nutrition <span aria-hidden="true">→</span></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="home-cta-band">
        <div className="container home-cta-inner">
          <div><span className="mono-label">Your next session starts here</span><h2>Make consistency your advantage.</h2></div>
          <Link className="btn btn-primary btn-lg" to="/register">Create your account <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </>
  );
}
