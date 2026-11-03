import { useState } from "react";
import type { FormEvent } from "react";

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(false);
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as {
          error?: string | { message?: string };
        } | null;
        const messageText = typeof body?.error === "string"
          ? body.error
          : typeof body?.error === "object" ? body.error.message : undefined;
        throw new Error(messageText ?? "Unable to send your message right now.");
      }
      setSubmitted(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setWebsite("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send your message right now.");
    } finally {
      setIsSubmitting(false);
    }
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
            <input type="text" name="name" placeholder="Your name" required minLength={2} maxLength={80}
              value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className="field-group">
            <span>Email</span>
            <input type="email" name="email" placeholder="Email address" required maxLength={255}
              value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          <label className="field-group">
            <span>Subject (optional)</span>
            <input type="text" name="subject" maxLength={120}
              value={subject} onChange={(event) => setSubject(event.target.value)} />
          </label>

          <label className="field-group">
            <span>Message</span>
            <textarea name="message" rows={7} placeholder="Your message" required minLength={10} maxLength={3000}
              value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>

          <input type="text" name="website" value={website} onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
          {error ? <p className="form-message" role="alert">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send message"}
          </button>

          {submitted ? (
            <p className="form-success" role="status">
              Thanks — your message was sent and added to the admin inbox.
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
