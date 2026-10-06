import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { aboutCopy } from "../content/about";

export function AboutPage() {
  return <><Helmet><title>About ShuzhFit</title><meta name="description" content="The story and purpose behind ShuzhFit." /></Helmet>
    <section className="pg page"><div className="container about-page">
      <header className="about-hero"><img src="/images/shuzh-hero.jpg" width="683" height="1086" alt="Shuzh training cable triceps pushdown"/><div><span className="tape-label">ABOUT SHUZHFIT</span><h1>Train smart.<br/>Stay consistent.</h1><p>{aboutCopy.whyStarted}</p></div></header>
      <section><h2>Why I started</h2><p>{aboutCopy.whyStarted}</p></section>
      <section><h2>What ShuzhFit is</h2><p>{aboutCopy.whatItIs}</p><div className="about-points"><article><h3>Simple training</h3><p>Practical workout guidance that is easy to follow.</p></article><article><h3>Free tracker</h3><p>Plan workouts and track the habits that matter.</p></article><article><h3>Honest guidance</h3><p>Clear, useful fitness information without unnecessary complexity.</p></article></div></section>
      <section><h2>What you get here</h2><p>{aboutCopy.whatYouGet}</p></section>
      <section><h2>The community</h2><p>{aboutCopy.community}</p><div className="btn-row"><a className="btn btn-secondary" href="https://www.youtube.com/@ShuzhFit?sub_confirmation=1" target="_blank" rel="noopener noreferrer">Subscribe</a><Link className="btn btn-primary" to="/register">Create account</Link></div></section>
      <p>Questions? {aboutCopy.contact} <Link to="/contact">Contact ShuzhFit</Link>.</p>
    </div></section></>;
}
