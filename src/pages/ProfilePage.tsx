import { useEffect, useState, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { logoutUser } from "../lib/auth";

type Goal = {
  id: number;
  title: string;
  metric: string;
  targetValue: number;
  exerciseName?: string | null;
  status: string;
  deadline: string | null;
  currentValue: number;
};

type Profile = {
  name: string;
  email: string;
  goalType: "fat_loss" | "maintain" | "muscle_gain";
  sex: "male" | "female" | "other";
  heightCm: number;
  ageYears: number;
  experience: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  equipment: "gym" | "home_dumbbells" | "bodyweight";
  activityLevel: number;
  targetWeightKg: number;
  weeklyWorkoutTarget: number;
  receiveFollowupEmails: boolean;
};

type Data = {
  profile: Profile;
  goals: Goal[];
  achievements: Array<{ id: string; title: string; earned: boolean }>;
};

export function ProfilePage() {
  const [data, setData] = useState<Data | null>(null);
  const [message, setMessage] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalMetric, setGoalMetric] = useState("weight");
  const [target, setTarget] = useState(0);
  const [exercise, setExercise] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/profile", { credentials: "include" });
      if (!response.ok) throw new Error("Profile unavailable.");
      setData(await response.json() as Data);
    } catch {
      setMessage("Could not load your profile.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function setProfile<K extends keyof Profile>(key: K, value: Profile[K]) {
    setData((current) => current ? { ...current, profile: { ...current.profile, [key]: value } } : current);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    const response = await fetch("/api/profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.profile),
    });
    setMessage(response.ok ? "Profile saved. Your preferences have been updated." : "Could not save profile.");
  }

  async function addGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/profile", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: goalTitle,
        metric: goalMetric,
        targetValue: target,
        exerciseName: goalMetric === "exercise_weight" ? exercise : undefined,
      }),
    });
    if (!response.ok) {
      setMessage("Could not create goal.");
      return;
    }
    setGoalTitle("");
    await load();
  }

  async function goalAction(goal: Goal, action: "achieved" | "delete") {
    if (action === "delete") {
      await fetch(`/api/profile?type=goal&id=${goal.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    } else {
      await fetch(`/api/profile?action=goal&id=${goal.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: goal.status === "achieved" ? "active" : "achieved" }),
      });
    }
    await load();
  }

  return (
    <>
      <Helmet><title>Profile &amp; Goals</title></Helmet>
      <section className="pg page">
        <div className="container profile-page">
          <header className="pg-head">
            <span className="pg-kicker">Profile</span>
            <h1>Profile &amp; goals</h1>
            <p className="pg-intro">Manage the preferences behind your plan and nutrition targets.</p>
          </header>
          {message ? <p role="status">{message}</p> : null}
          {data ? (
            <>
              <form onSubmit={save} className="app-panel app-form">
                <h2>Preferences</h2>
                <div className="field-grid is-two-col">
                  <label className="field"><span>Name</span><input value={data.profile.name} onChange={(event) => setProfile("name", event.target.value)}/></label>
                  <label className="field"><span>Email</span><input value={data.profile.email} disabled/><small>Email changes are not supported here.</small></label>
                </div>
                <div className="field-grid is-three-col">
                  <label className="field"><span>Goal</span><select value={data.profile.goalType} onChange={(event) => setProfile("goalType", event.target.value as Profile["goalType"])}><option value="fat_loss">Fat loss</option><option value="maintain">Maintain</option><option value="muscle_gain">Muscle gain</option></select></label>
                  <label className="field"><span>Target weight (kg)</span><input type="number" step="0.1" value={data.profile.targetWeightKg} onChange={(event) => setProfile("targetWeightKg", Number(event.target.value))}/></label>
                  <label className="field"><span>Weekly workout target</span><input type="number" min="1" max="7" value={data.profile.weeklyWorkoutTarget} onChange={(event) => setProfile("weeklyWorkoutTarget", Number(event.target.value))}/></label>
                </div>
                <div className="field-grid is-three-col">
                  <label className="field"><span>Sex</span><select value={data.profile.sex} onChange={(event) => setProfile("sex", event.target.value as Profile["sex"])}><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
                  <label className="field"><span>Age</span><input type="number" min="13" max="120" value={data.profile.ageYears} onChange={(event) => setProfile("ageYears", Number(event.target.value))}/></label>
                  <label className="field"><span>Height (cm)</span><input type="number" value={data.profile.heightCm} onChange={(event) => setProfile("heightCm", Number(event.target.value))}/></label>
                </div>
                <div className="field-grid is-three-col">
                  <label className="field"><span>Experience</span><select value={data.profile.experience} onChange={(event) => setProfile("experience", event.target.value as Profile["experience"])}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
                  <label className="field"><span>Days per week</span><input type="number" min="2" max="6" value={data.profile.daysPerWeek} onChange={(event) => setProfile("daysPerWeek", Number(event.target.value))}/></label>
                  <label className="field"><span>Equipment</span><select value={data.profile.equipment} onChange={(event) => setProfile("equipment", event.target.value as Profile["equipment"])}><option value="gym">Gym</option><option value="home_dumbbells">Home dumbbells</option><option value="bodyweight">Bodyweight</option></select></label>
                </div>
                <label className="field"><span>Activity level</span><select value={data.profile.activityLevel} onChange={(event) => setProfile("activityLevel", Number(event.target.value))}><option value={1.2}>Mostly seated</option><option value={1.375}>Light activity</option><option value={1.55}>Moderate activity</option><option value={1.725}>Very active</option><option value={1.9}>Highly active</option></select></label>
                <label className="followup-optout">
                  <input type="checkbox" checked={data.profile.receiveFollowupEmails} onChange={(event) => setProfile("receiveFollowupEmails", event.target.checked)}/>
                  <span><strong>Receive follow-up emails</strong><small>Occasional training and nutrition reminders. Account and security emails are unaffected.</small></span>
                </label>
                <button className="btn btn-primary">Save preferences</button>
              </form>

              <section className="app-panel">
                <div className="meal-day-header"><h2>Training plan</h2><Link className="btn btn-secondary" to="/plan">Edit exercises and schedule</Link></div>
                <p>Save preference changes, then regenerate your weekly plan to apply them.</p>
                <button className="btn btn-primary" onClick={async () => {
                  if (!window.confirm("Regenerate your plan using your saved preferences? Your current schedule will be replaced.")) return;
                  const response = await fetch("/api/program/regenerate", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                  setMessage(response.ok ? "Training plan regenerated." : "Save preferences first, then try regenerating the plan again.");
                }}>Regenerate my plan</button>
              </section>

              <section className="app-panel">
                <h2>Goals</h2>
                {data.goals.map((goal) => (
                  <div className="goal-progress-row" key={goal.id}>
                    <div className="meal-day-header"><strong>{goal.title}</strong><span>{goal.currentValue} / {goal.targetValue} {goal.metric === "workouts_per_week" ? "sessions" : ""}</span></div>
                    <progress max={100} value={Math.min(100, goal.currentValue / Math.max(goal.targetValue, 1) * 100)}/>
                    <div className="btn-row"><button className="btn btn-secondary" onClick={() => void goalAction(goal, "achieved")}>{goal.status === "achieved" ? "Reopen" : "Mark achieved"}</button><button className="btn btn-ghost" onClick={() => void goalAction(goal, "delete")}>Delete</button></div>
                  </div>
                ))}
                <form className="field-stack" onSubmit={addGoal}>
                  <h3>Add a goal</h3>
                  <label className="field"><span>Title</span><input value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} required/></label>
                  <label className="field"><span>Measure</span><select value={goalMetric} onChange={(event) => setGoalMetric(event.target.value)}><option value="weight">Body weight (kg)</option><option value="exercise_weight">Exercise load (kg)</option><option value="workouts_per_week">Workouts per week</option></select></label>
                  {goalMetric === "exercise_weight" ? <label className="field"><span>Exercise</span><input value={exercise} onChange={(event) => setExercise(event.target.value)}/></label> : null}
                  <label className="field"><span>Target value</span><input type="number" min="0.1" step="0.1" value={target} onChange={(event) => setTarget(Number(event.target.value))} required/></label>
                  <button className="btn btn-primary">Create goal</button>
                </form>
              </section>
              <section className="app-panel">
                <h2>Achievements</h2>
                <div className="achievement-grid">{data.achievements.map((achievement) => <div key={achievement.id} className={`achievement-card${achievement.earned ? " earned" : ""}`}><span>{achievement.earned ? "✓" : "○"}</span><strong>{achievement.title}</strong></div>)}</div>
              </section>
              <div className="btn-row"><button className="btn btn-secondary" onClick={() => void logoutUser()}>Log out</button></div>
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}
