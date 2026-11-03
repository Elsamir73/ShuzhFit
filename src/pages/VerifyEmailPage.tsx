import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { resendVerificationEmail, verifyEmailToken } from "../lib/auth";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [error, setError] = useState(token ? "" : "This verification link is invalid or has expired.");
  const [email, setEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void verifyEmailToken(token)
      .then(() => {
        if (active) setStatus("success");
      })
      .catch((verificationError: unknown) => {
        if (!active) return;
        setError(verificationError instanceof Error
          ? verificationError.message
          : "Unable to verify your email right now.");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      <Helmet><title>Verify email | ShuzhFit</title></Helmet>
      <section className="pg page">
        <div className="container" style={{ maxWidth: 620 }}>
          <div className="auth-card">
            {status === "loading" ? <p role="status">Verifying your email...</p> : null}
            {status === "success" ? (
              <>
                <h1>Email verified</h1>
                <p>You can now log in to your ShuzhFit account.</p>
                <Link className="btn btn-primary" to="/login">Log in</Link>
              </>
            ) : null}
            {status === "error" ? (
              <>
                <h1>Could not verify email</h1>
                <p role="alert">{error}</p>
                <form onSubmit={handleResend} className="field-stack">
                  <label className="field">
                    <span>Email address</span>
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                  </label>
                  <button className="btn btn-primary" type="submit" disabled={isResending}>
                    {isResending ? "Sending..." : "Resend verification email"}
                  </button>
                </form>
                {resendMessage ? <p role="status">{resendMessage}</p> : null}
                <p><Link to="/login">Back to log in</Link></p>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
