import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

type Overview = { totalMembers: number; newThisWeek: number; newThisMonth: number; activeLast7Days: number; workoutsLogged: number; publishedBlogs: number; unreadMessages: number; onboardingCompletionPct: number; signupsByDay: Array<{ day: string; total: number }>; membersByGoal: Array<{ goal: string; total: number }>; recentSignups: Array<{ name: string; email: string; joined: string }>; popularExercises: Array<{ name: string; total: number }> };

export function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void fetch("/api/admin/overview", { credentials: "same-origin" }).then(async (response) => { const body = await response.json() as Overview & { error?: string | { message?: string } }; if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Unable to load overview."); setOverview(body); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load overview.")); }, []);
  return (
    <>
      <Helmet>
        <title>Admin</title>
        <meta
          name="description"
          content="Administrative dashboard for managing exercises, blogs, videos, and community messages."
        />
      </Helmet>

      <section className="pg page">
        <div className="container">
          <div className="pg-head" style={{ marginBottom: 28 }}>
            <span className="pg-kicker">Admin</span>
            <h1>Content dashboard</h1>
            <p className="pg-intro">
              Manage the public fitness library, blog content, and community
              messaging from this admin console.
            </p>
          </div>

          {error ? <p role="alert">{error}</p> : null}
          {!overview && !error ? <p role="status">Loading overview…</p> : null}
          {overview ? <section className="admin-metrics-grid" aria-label="People and content overview">
            {[{ title: "Total members", value: overview.totalMembers }, { title: "New this week", value: overview.newThisWeek }, { title: "New this month", value: overview.newThisMonth }, { title: "Active in 7 days", value: overview.activeLast7Days }, { title: "Onboarding complete", value: `${overview.onboardingCompletionPct}%` }, { title: "Workouts logged", value: overview.workoutsLogged }, { title: "Published blogs", value: overview.publishedBlogs }, { title: "Unread messages", value: overview.unreadMessages }].map((item) => <article className="admin-metric-card" key={item.title}><p>{item.title}</p><h3>{item.value}</h3></article>)}
          </section> : null}
          {overview ? <div className="admin-overview-grid"><article className="admin-panel"><h2>Signups · 30 days</h2><svg viewBox="0 0 600 160" role="img" aria-label="Member signups per day for the past 30 days">{overview.signupsByDay.map((item,index)=>{const max=Math.max(1,...overview.signupsByDay.map((day)=>day.total));const width=560/Math.max(1,overview.signupsByDay.length);const height=130*item.total/max;return <rect key={item.day} x={20+index*width} y={145-height} width={Math.max(2,width-3)} height={height} rx="2" fill="var(--brand)"><title>{item.day}: {item.total}</title></rect>;})}</svg></article><article className="admin-panel"><h2>Members by goal</h2>{overview.membersByGoal.map((item)=><div className="goal-progress-row" key={item.goal}><div className="meal-day-header"><span>{item.goal}</span><strong>{item.total}</strong></div><progress max={overview.totalMembers || 1} value={item.total}>{item.total}</progress></div>)}</article><article className="admin-panel"><h2>Latest signups</h2>{overview.recentSignups.map((item)=><p key={item.email}><strong>{item.name}</strong> · {item.email}<small> · {new Date(item.joined).toLocaleDateString()}</small></p>)}</article><article className="admin-panel"><h2>Most logged exercises</h2>{overview.popularExercises.map((item,index)=><p key={item.name}>{index+1}. {item.name} <strong>{item.total}</strong></p>)}</article></div> : null}
          <div className="admin-metrics-grid">
            {[
              { title: "Exercises", path: "/admin/exercises" },
              { title: "Blog posts", path: "/admin/blogs" },
              { title: "Videos", path: "/admin/videos" },
              { title: "Comments", path: "/admin/comments" },
              { title: "Messages", path: "/admin/messages" },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className="admin-metric-card"
              >
                <p>{item.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
