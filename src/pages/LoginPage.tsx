import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { FormEvent } from "react";
import { authenticateUser } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestedNext = new URLSearchParams(location.search).get("next");
  const stateFrom =
    typeof location.state === "object" &&
    location.state &&
    "from" in location.state
      ? String(location.state.from)
      : "/dashboard";
  const candidate = requestedNext ?? stateFrom;
  const from = candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.includes("\\") && !/^[a-z][a-z\d+.-]*:/i.test(candidate)
    ? candidate
    : "/dashboard";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await authenticateUser({ email, password });
      navigate(from, { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to log in right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Log In</title>
        <meta
          name="description"
          content="Sign in to your ShuzhFit account and access your dashboard, progress tracker, and workout planner."
        />
      </Helmet>

      <section className="pg page">
        <div className="container" style={{ maxWidth: 560 }}>
          <div className="pg-head" style={{ marginBottom: 28 }}>
            <span className="pg-kicker">Members</span>
            <h1>Welcome back</h1>
            <p className="pg-intro">
              Log in to keep your workouts, nutrition, and progress in sync.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-card">
            <div className="field-stack">
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
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
                {isSubmitting ? "Signing in..." : "Log In"}
              </button>
            </div>
          </form>

          <p className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </>
  );
}
