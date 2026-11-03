import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { resendVerificationEmail } from "../lib/auth";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  goal: string | null;
  joined: string;
  lastActive: string | null;
  emailVerifiedAt: string | null;
  isVerified: boolean;
  workoutsCount: number;
  onboarded: boolean;
};
type Detail = {
  member: Member & {
    experience?: string | null;
    heightCm?: number | null;
    ageYears?: number | null;
    daysPerWeek?: number | null;
    equipment?: string | null;
  };
  sessions: Array<{ id: string; name: string; workoutDate: string; status: string }>;
};

export function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [onboarded, setOnboarded] = useState("");
  const [verified, setVerified] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), q: query, role, onboarded, verified });
      const response = await fetch(`/api/admin/members?${params}`, { credentials: "same-origin" });
      const body = await response.json() as { members?: Member[]; total?: number; error?: string | { message?: string } };
      if (!response.ok) {
        const message = typeof body.error === "string" ? body.error : body.error?.message;
        throw new Error(message ?? "Unable to load members.");
      }
      setMembers(body.members ?? []);
      setTotal(body.total ?? 0);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load members.");
    }
  }, [page, query, role, onboarded, verified]);
  useEffect(() => { void load(); }, [load]);

  async function showDetail(member: Member) {
    try {
      const response = await fetch(`/api/admin/members?id=${member.id}`, { credentials: "same-origin" });
      if (!response.ok) throw new Error("Unable to load member details.");
      setDetail(await response.json() as Detail);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load member details.");
    }
  }

  async function changeRole(member: Member) {
    const nextRole = member.role === "admin" ? "user" : "admin";
    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "role", userId: Number(member.id), role: nextRole }),
    });
    if (!response.ok) {
      setError("Could not update this member's role.");
      return;
    }
    await load();
  }

  async function markVerified(member: Member) {
    if (!window.confirm(`Mark ${member.email} as verified?`)) return;
    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", userId: Number(member.id) }),
    });
    if (!response.ok) {
      setError("Could not mark this member as verified.");
      return;
    }
    setNotice(`${member.email} is now verified.`);
    await load();
    if (detail?.member.id === member.id) await showDetail({ ...member, isVerified: true });
  }

  async function resend(member: Member) {
    try {
      await resendVerificationEmail(member.email);
      setNotice("If the account is eligible, a verification email will be sent.");
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to resend verification email.");
    }
  }

  async function deleteMember(member: Member) {
    const confirmEmail = window.prompt(`Type ${member.email} to permanently delete this member and their data.`);
    if (confirmEmail === null) return;
    const response = await fetch("/api/admin/members", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", userId: Number(member.id), confirmEmail }),
    });
    if (!response.ok) {
      setError("Could not delete this member. Check the confirmation email.");
      return;
    }
    setDetail(null);
    await load();
  }

  async function exportCsv() {
    const params = new URLSearchParams({ export: "csv", q: query, role, onboarded, verified });
    const response = await fetch(`/api/admin/members?${params}`, { credentials: "same-origin" });
    if (!response.ok) {
      setError("Could not export member data.");
      return;
    }
    const body = await response.json() as { csv: string };
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([body.csv], { type: "text/csv" }));
    link.download = "shuzhfit-members.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <>
      <Helmet><title>Members · Admin</title></Helmet>
      <section className="pg page">
        <div className="container admin-stack">
          <header className="pg-head"><span className="pg-kicker">Admin</span><h1>Members</h1></header>
          <div className="admin-toolbar">
            <label className="field"><span>Search name or email</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
            <label className="field"><span>Role</span><select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option value="">All roles</option><option value="user">Member</option><option value="admin">Admin</option></select></label>
            <label className="field"><span>Onboarding</span><select value={onboarded} onChange={(event) => { setOnboarded(event.target.value); setPage(1); }}><option value="">All</option><option value="true">Complete</option><option value="false">Incomplete</option></select></label>
            <label className="field"><span>Email verification</span><select value={verified} onChange={(event) => { setVerified(event.target.value); setPage(1); }}><option value="">All</option><option value="true">Verified</option><option value="false">Not verified</option></select></label>
            <button type="button" className="btn" onClick={() => void exportCsv()}>Export CSV</button>
          </div>
          {error ? <p role="alert">{error}</p> : null}
          {notice ? <p role="status">{notice}</p> : null}
          <div className="admin-table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Last login</th><th>Verified</th><th>Workouts</th><th>Role</th><th>Actions</th></tr></thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td><button type="button" className="table-link" onClick={() => void showDetail(member)}>{member.name}</button></td>
                    <td>{member.email}</td>
                    <td>{new Date(member.joined).toLocaleDateString()}</td>
                    <td>{member.lastActive ? new Date(member.lastActive).toLocaleDateString() : "—"}</td>
                    <td><span className={`status-badge ${member.isVerified ? "verified" : "not-verified"}`}>{member.isVerified ? "Verified" : "Not verified"}</span></td>
                    <td>{member.workoutsCount}</td>
                    <td>{member.role}</td>
                    <td>
                      <button type="button" className="btn btn-sm" onClick={() => void changeRole(member)}>{member.role === "admin" ? "Demote" : "Promote"}</button>{" "}
                      {!member.isVerified ? <><button type="button" className="btn btn-sm" onClick={() => void resend(member)}>Resend verification</button>{" "}<button type="button" className="btn btn-sm" onClick={() => void markVerified(member)}>Mark verified</button>{" "}</> : null}
                      <button type="button" className="btn btn-sm" onClick={() => void deleteMember(member)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="btn-row">
            <button type="button" className="btn" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
            <span>Page {page} · {total} members</span>
            <button type="button" className="btn" disabled={page * 20 >= total} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </div>
      </section>
      {detail ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setDetail(null)}>
          <section className="app-panel quick-log-modal" role="dialog" aria-modal="true" aria-labelledby="member-detail-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="btn" onClick={() => setDetail(null)}>Close</button>
            <h2 id="member-detail-title">{detail.member.name}</h2>
            <p>{detail.member.email} · {detail.member.isVerified ? "Verified" : "Not verified"} · {detail.member.goal ?? "Goal not set"}</p>
            <p>{detail.member.experience ?? "Experience not set"} · {detail.member.equipment ?? "Equipment not set"}</p>
            <p>{detail.member.workoutsCount} completed workouts</p>
            <h3>Recent sessions</h3>
            {detail.sessions.map((session) => <p key={session.id}>{session.name} · {new Date(session.workoutDate).toLocaleDateString()}</p>)}
          </section>
        </div>
      ) : null}
    </>
  );
}
