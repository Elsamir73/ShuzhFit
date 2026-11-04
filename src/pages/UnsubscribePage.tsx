import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";

export function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) return () => { active = false; };
    void fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`, { credentials: "same-origin" })
      .then(async (response) => {
        const result: unknown = await response.json();
        if (!response.ok) {
          const body = result as { error?: { message?: string } };
          throw new Error(body.error?.message ?? "This email preference link is invalid.");
        }
        const body = result as { subscribed: boolean };
        if (active) setSubscribed(body.subscribed);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to update your email preference.");
      });
    return () => { active = false; };
  }, [token]);

  async function updateSubscription(nextValue: boolean) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}&action=${nextValue ? "subscribe" : "unsubscribe"}`, {
        credentials: "same-origin",
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const body = result as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Unable to update your email preference.");
      }
      setSubscribed(nextValue);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update your email preference.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Helmet><title>Email preferences · ShuzhFit</title></Helmet>
      <section className="pg page">
        <div className="container unsubscribe-page">
          <div className="app-panel unsubscribe-card">
            <span className="pg-kicker">ShuzhFit</span>
            <h1>Email preferences</h1>
            {subscribed === null && !error ? <p role="status">Updating your preference...</p> : null}
            {error || !token ? <p className="followups-message is-error" role="alert">{error || "This email preference link is missing its token."}</p> : null}
            {subscribed !== null ? (
              <>
                <p>{subscribed ? "You are subscribed to ShuzhFit follow-up emails." : "You are unsubscribed from ShuzhFit follow-up emails."}</p>
                <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void updateSubscription(!subscribed)}>
                  {subscribed ? "Unsubscribe" : "Subscribe again"}
                </button>
              </>
            ) : null}
            <p><Link to="/">Return to ShuzhFit</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
