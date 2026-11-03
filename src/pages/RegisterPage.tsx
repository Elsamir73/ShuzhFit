import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useState } from "react";
import type { FormEvent } from "react";
import { registerAccount, resendVerificationEmail } from "../lib/auth";
import { validatePassword } from "../../shared/password";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [resendMessage, setResendMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordError = validatePassword(password, { email, name });
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerAccount({
        email,
        password,
        name,
      });
      setEmailSent(result.emailSent);
      setRegistrationComplete(true);
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

  async function handleResend() {
    setIsResending(true);
    setResendMessage("");
    try {
      await resendVerificationEmail(email);
      setResendMessage("If the account is eligible, a verification email will be sent.");
    } catch (resendError) {
      setResendMessage(resendError instanceof Error ? resendError.message : "Unable to resend the email.");
    } finally {
      setIsResending(false);
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
          {registrationComplete ? (
            <div className="auth-card" role="status">
              <div className="pg-head" style={{ marginBottom: 20 }}>
                <span className="pg-kicker">One more step</span>
                <h1>Check your email</h1>
                <p className="pg-intro">
                  We sent a verification link to {email}. Verify your email before logging in.
                </p>
                {!emailSent ? <p role="alert">We could not send the email. You can try again below.</p> : null}
                <button className="btn btn-primary" type="button" onClick={handleResend} disabled={isResending}>
                  {isResending ? "Sending..." : "Resend verification email"}
                </button>
                {resendMessage ? <p role="status">{resendMessage}</p> : null}
                <p><Link to="/login">Go to log in</Link></p>
              </div>
            </div>
          ) : (
          <>
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
                <span>Password (8–64 characters)</span>
                <input
                  type="password"
                  maxLength={64}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <p className="legal-note">Use 8–64 characters with at least one letter and one number. Avoid common passwords, sequences, repeated characters, your name, and your email username.</p>
              {password ? <p className="legal-note" role="status">{validatePassword(password, { email, name }) ?? "Password meets the requirements."}</p> : null}

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
            <p className="legal-note">By creating an account you agree to our <Link to="/terms">Terms</Link> and acknowledge our <Link to="/privacy">Privacy Policy</Link>.</p>

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
          </>
          )}
        </div>
      </section>
    </>
  );
}
