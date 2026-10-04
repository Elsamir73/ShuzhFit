import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { FormEvent } from "react";
import { authenticateUser } from "../lib/auth";

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    if (password.length > 128) {
      setError("Use no more than 128 characters for your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authenticateUser({
        email,
        password,
        name,
        isRegister: true,
      });
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create your account right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Get Started</title>
        <meta
          name="description"
          content="Create your ShuzhFit account to unlock workouts, progress tracking, and goal planning."
        />
      </Helmet>

      <section className="pg page">
        <div className="container" style={{ maxWidth: 620 }}>
          <div className="pg-head" style={{ marginBottom: 28 }}>
            <span className="pg-kicker">Start here</span>
            <h1>Create your account</h1>
            <p className="pg-intro">
              Set up your plan, save your progress, and stay accountable.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-card">
            <div className="field-stack">
              <label className="field">
                <span>Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Password (8–128 characters)</span>
                <input
                  type="password"
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>

              {error ? (
                <div role="alert" className="form-message">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>

          <p className="auth-switch">
            Already a member? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </>
  );
}
