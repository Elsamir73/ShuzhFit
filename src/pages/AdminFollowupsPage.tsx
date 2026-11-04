import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

type SegmentId = "inactive_7d" | "no_food_7d" | "missed_workouts" | "not_onboarded" | "unverified";
type Segment = { segment: SegmentId; count: number };
type Message = { segment: SegmentId; subject: string; body: string; buttonLabel: string; buttonPath: string };
type CampaignHistory = { id: number; name: string; subject: string; segment: string; createdAt: string; sent: number; failed: number };
type SendFailure = { name: string; email: string; error: string };
type Preview = { subject: string; html: string; text: string; count: number };
type BuiltinTemplate = { id: string; title: string; message: Omit<Message, "segment"> };

const templates: BuiltinTemplate[] = [
  {
    id: "missed",
    title: "Missed workouts",
    message: {
      subject: "Your plan is waiting, {{name}}",
      body: "Hi {{name}},\n\nYou have missed {{missedCount}} planned sessions lately. That is okay. Life gets busy.\n\nA short workout still counts. Open today's plan and pick the shorter version, even 20 minutes is a win.\n\nKeep showing up.",
      buttonLabel: "Open today's workout",
      buttonPath: "/today",
    },
  },
  {
    id: "food",
    title: "Track your food",
    message: {
      subject: "Are you tracking your food, {{name}}?",
      body: "Hi {{name}},\n\nYour training is only half the picture. Logging your meals for even a few days shows you how much protein you are really eating.\n\nIt takes about two minutes a day, and your targets are already set for you.",
      buttonLabel: "Log today's food",
      buttonPath: "/food",
    },
  },
  {
    id: "come-back",
    title: "Come back",
    message: {
      subject: "It has been a while, {{name}}",
      body: "Hi {{name}},\n\nIt has been {{daysAway}} days since we saw you on ShuzhFit. Your plan and your progress are right where you left them.\n\nNo pressure. Start with one set.",
      buttonLabel: "Pick up where you left off",
      buttonPath: "/today",
    },
  },
  {
    id: "setup",
    title: "Finish setup",
    message: {
      subject: "Finish setting up your plan, {{name}}",
      body: "Hi {{name}},\n\nYou are one step away from your personal weekly plan. Answer a few questions about your goal and equipment and we will build it for you.",
      buttonLabel: "Finish setup",
      buttonPath: "/onboarding",
    },
  },
  {
    id: "verify",
    title: "Verify reminder",
    message: {
      subject: "Please verify your email",
      body: "Hi {{name}},\n\nYou created a ShuzhFit account but have not confirmed your email yet. Use the button to verify, then log in.",
      buttonLabel: "Open ShuzhFit",
      buttonPath: "/login",
    },
  },
];

const segmentNames: Record<SegmentId, string> = {
  inactive_7d: "Inactive for 7+ days",
  no_food_7d: "No food logs in 7 days",
  missed_workouts: "Missed planned workouts",
  not_onboarded: "Setup not finished",
  unverified: "Email not verified",
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", ...init });
  const result: unknown = await response.json();
  if (!response.ok) {
    const body = result as { error?: { message?: string } };
    throw new Error(body.error?.message ?? "The request failed. Please try again.");
  }
  return result as T;
}

export function AdminFollowupsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [history, setHistory] = useState<CampaignHistory[]>([]);
  const [message, setMessage] = useState<Message>({
    segment: "missed_workouts",
    subject: templates[0]!.message.subject,
    body: templates[0]!.message.body,
    buttonLabel: templates[0]!.message.buttonLabel,
    buttonPath: templates[0]!.message.buttonPath,
  });
  const [templateId, setTemplateId] = useState(templates[0]!.id);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const [failures, setFailures] = useState<SendFailure[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const recipientCount = useMemo(
    () => segments.find((item) => item.segment === message.segment)?.count ?? 0,
    [message.segment, segments],
  );

  useEffect(() => {
    let active = true;
    void Promise.all([
      requestJson<Segment[]>("/api/admin/followups/segments"),
      requestJson<CampaignHistory[]>("/api/admin/followups/history"),
    ]).then(([nextSegments, nextHistory]) => {
      if (!active) return;
      setSegments(nextSegments);
      setHistory(nextHistory);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Unable to load follow-ups.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void requestJson<Preview>("/api/admin/followups/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      }).then((result) => {
        if (active) setPreview(result);
      }).catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to preview this message.");
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [message]);

  function chooseTemplate(value: string) {
    setTemplateId(value);
    const selected = templates.find((item) => item.id === value);
    if (selected) setMessage((current) => ({ ...selected.message, segment: current.segment }));
  }

  function setField<K extends keyof Message>(key: K, value: Message[K]) {
    setMessage((current) => ({ ...current, [key]: value }));
  }

  async function sendTest() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await requestJson<{ sent: boolean }>("/api/admin/followups/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      setNotice("Test email sent to your admin email address.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Test email failed.");
    } finally {
      setBusy(false);
    }
  }

  async function sendCampaign() {
    if (!recipientCount || busy) return;
    if (!window.confirm(`Send "${message.subject}" to ${recipientCount} people?`)) return;
    const confirmedMessage = { ...message };
    let campaignId: number | undefined;
    let remaining = recipientCount;
    let processed = 0;
    let sentTotal = 0;
    let failedTotal = 0;
    const allFailures: SendFailure[] = [];
    setBusy(true);
    setError("");
    setNotice("");
    setFailures([]);
    setProgress({ processed, total: recipientCount });
    try {
      while (remaining > 0) {
        const result = await requestJson<{
          campaignId: number;
          sent: number;
          failed: number;
          remaining: number;
          failures: SendFailure[];
        }>("/api/admin/followups/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...confirmedMessage, campaignId }),
        });
        campaignId = result.campaignId;
        remaining = result.remaining;
        processed = recipientCount - remaining;
        sentTotal += result.sent;
        failedTotal += result.failed;
        allFailures.push(...result.failures);
        setFailures([...allFailures]);
        setProgress({ processed, total: recipientCount });
      }
      const skipped = Math.max(0, processed - sentTotal - failedTotal);
      setNotice(`Campaign complete. ${sentTotal} sent; ${failedTotal} failed; ${skipped} skipped.`);
      const refreshed = await requestJson<CampaignHistory[]>("/api/admin/followups/history");
      setHistory(refreshed);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Campaign sending stopped.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <>
      <Helmet><title>Follow-ups · Admin</title></Helmet>
      <section className="pg page">
        <div className="container admin-stack followups-page">
          <header className="pg-head">
            <span className="pg-kicker">Admin</span>
            <h1>Follow-ups</h1>
            <p className="pg-intro">Send a thoughtful nudge to members who may need one.</p>
          </header>
          {error ? <p role="alert" className="followups-message is-error">{error}</p> : null}
          {notice ? <p role="status" className="followups-message">{notice}</p> : null}
          {loading ? <p role="status">Loading audiences...</p> : (
            <div className="followups-grid">
              <div className="followups-editor">
                <section className="admin-panel">
                  <h2>1. Choose the audience</h2>
                  <div className="followup-segments">
                    {segments.map((item) => (
                      <button
                        type="button"
                        key={item.segment}
                        className={`followup-segment${message.segment === item.segment ? " is-selected" : ""}`}
                        aria-pressed={message.segment === item.segment}
                        onClick={() => setField("segment", item.segment)}
                      >
                        <span>{segmentNames[item.segment]}</span>
                        <strong>{item.count}</strong>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="admin-panel followup-form">
                  <h2>2. Choose a template or write your own</h2>
                  <label className="field">
                    <span>Template</span>
                    <select value={templateId} onChange={(event) => chooseTemplate(event.target.value)}>
                      {templates.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                      <option value="custom">Write your own</option>
                    </select>
                  </label>
                  <label className="field"><span>Subject</span><input value={message.subject} maxLength={300} onChange={(event) => { setTemplateId("custom"); setField("subject", event.target.value); }}/></label>
                  <label className="field"><span>Message</span><textarea rows={9} value={message.body} maxLength={10000} onChange={(event) => { setTemplateId("custom"); setField("body", event.target.value); }}/></label>
                  <p className="followup-help">Available fields: {"{{name}}"}, {"{{missedCount}}"}, {"{{daysAway}}"}, {"{{appUrl}}"}.</p>
                  <div className="field-grid is-two-col">
                    <label className="field"><span>Button label</span><input value={message.buttonLabel} maxLength={100} onChange={(event) => { setTemplateId("custom"); setField("buttonLabel", event.target.value); }}/></label>
                    <label className="field"><span>Button path</span><input value={message.buttonPath} maxLength={500} placeholder="/today" onChange={(event) => { setTemplateId("custom"); setField("buttonPath", event.target.value); }}/></label>
                  </div>
                </section>
                <section className="admin-panel">
                  <h2>4. Send</h2>
                  <p>{recipientCount} eligible recipients in “{segmentNames[message.segment]}”.</p>
                  <div className="btn-row followup-send-actions">
                    <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => void sendTest()}>Send test to me</button>
                    <button className="btn btn-primary" type="button" disabled={busy || recipientCount === 0} onClick={() => void sendCampaign()}>Send to {recipientCount} people</button>
                  </div>
                  {progress ? (
                    <div className="followup-progress">
                      <p role="status">Sending {progress.processed} of {progress.total}</p>
                      <progress max={progress.total || 1} value={progress.processed}>{progress.processed} of {progress.total}</progress>
                    </div>
                  ) : null}
                  {failures.length ? <div className="followup-failures"><h3>Failed deliveries</h3><ul>{failures.map((item, index) => <li key={`${item.email}-${index}`}><strong>{item.name}</strong> ({item.email}): {item.error}</li>)}</ul></div> : null}
                </section>
              </div>
              <aside className="admin-panel followup-preview-panel">
                <h2>3. Live preview</h2>
                <p>Sample recipient: Samir · merge fields are filled for preview.</p>
                {preview ? <iframe className="followup-preview" title="Email preview" sandbox="" srcDoc={preview.html}/> : <p role="status">Preparing preview...</p>}
              </aside>
            </div>
          )}
          <section className="admin-panel followup-history">
            <h2>History</h2>
            {history.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Campaign</th><th>Audience</th><th>Date</th><th>Sent</th><th>Failed</th></tr></thead>
                  <tbody>{history.map((item) => <tr key={item.id}><td><strong>{item.subject}</strong></td><td>{segmentNames[item.segment as SegmentId] ?? item.segment}</td><td>{new Date(item.createdAt).toLocaleString()}</td><td>{item.sent}</td><td>{item.failed}</td></tr>)}</tbody>
                </table>
              </div>
            ) : <p>No follow-up campaigns yet.</p>}
          </section>
        </div>
      </section>
    </>
  );
}
