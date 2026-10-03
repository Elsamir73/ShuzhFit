import { useState } from "react";
import type { FormEvent } from "react";

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, message }) });
    if (!response.ok) { setSubmitted(false); return; }
    setSubmitted(true);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <section className="pg page">
      <div className="container">
        <div className="pg-head">
          <span className="pg-kicker">ShuzhFit</span>
          <h1>Contact</h1>
          <p className="pg-intro">
            Send a message to the ShuzhFit team or ask a question about
            programming, nutrition, or training.
          </p>
        </div>

        <form className="contact-card card" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>Name</span>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Message</span>
            <textarea
              name="message"
              rows={7}
              placeholder="Your message"
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>

          <button type="submit" className="btn btn-primary">
            Send message
          </button>

          {submitted ? (
            <p className="form-success">
              Thanks — your message was captured and added to the admin inbox.
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
