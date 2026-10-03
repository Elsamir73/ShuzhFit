import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../lib/auth";
import { summarizeDashboardData } from "../lib/dashboardStats";
import {
  getUserProfile,
  loadNutritionEntriesFromServer,
  loadProgressEntriesFromServer,
  loadUserProfileFromServer,
  loadWorkoutEntriesFromServer,
} from "../lib/tracker";

export function DashboardPage() {
  const user = getCurrentUser();
  const [profile, setProfile] = useState(getUserProfile());
  const [snapshot, setSnapshot] = useState(
    summarizeDashboardData({
      workouts: [],
      meals: [],
      progress: [],
      profile: getUserProfile(),
    }),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      loadWorkoutEntriesFromServer(),
      loadNutritionEntriesFromServer(),
      loadProgressEntriesFromServer(),
      loadUserProfileFromServer(),
    ]).then(([workouts, meals, progress, nextProfile]) => {
      if (!isMounted) {
        return;
      }

      setProfile(nextProfile);
      setSnapshot(
        summarizeDashboardData({
          workouts,
          meals,
          progress,
          profile: nextProfile,
        }),
      );
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!user) {
    return null;
  }

  const stats = [
    {
      title: "Workout log",
      value: `${snapshot.workoutCount} ${snapshot.workoutCount === 1 ? "session" : "sessions"}`,
      meta: "This week",
    },
    {
      title: "Nutrition",
      value: `${snapshot.nutritionPercent}%`,
      meta: "Consistency",
    },
    {
      title: "Progress",
      value: snapshot.progressDeltaLabel,
      meta: "7-day trend",
    },
    {
      title: "Goals",
      value: `${snapshot.goalCount} active`,
      meta: profile.goalType
        ? profile.goalType.replace("-", " ")
        : "Current focus",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
        <meta
          name="description"
          content="Dashboard overview for your workout habits, meal planning, and current training focus."
        />
      </Helmet>

      <section className="pg page">
        <div className="container">
          <div className="pg-head" style={{ marginBottom: 24 }}>
            <span className="pg-kicker">Welcome</span>
            <h1>Hi {user.name}</h1>
            <p className="pg-intro">
              Your tracker is ready. Review your workouts, daily nutrition, and
              progress goals below.
            </p>
          </div>

          <div className="stats-grid">
            {stats.map((card) => (
              <div key={card.title} className="stat-card">
                <p>{card.title}</p>
                <h3>{isLoading ? "—" : card.value}</h3>
                <span>{card.meta}</span>
              </div>
            ))}
          </div>

          <div className="app-panel">
            <h2>Quick actions</h2>
            <div className="btn-row">
              <Link className="btn btn-primary" to="/today">
                Start Workout
              </Link>
              <Link className="btn" to="/nutrition-log">
                Log Food
              </Link>
              <Link className="btn" to="/progress">
                View Progress
              </Link>
              <Link className="btn" to="/profile">
                Update Profile
              </Link>
              <Link className="btn" to="/plan">
                View plan
              </Link>
              <Link className="btn" to="/onboarding">
                Complete onboarding
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
