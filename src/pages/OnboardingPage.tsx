import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { calculateFitnessMetrics } from "../../shared/fitness";

type OnboardingForm = {
  goal: "fat_loss" | "maintain" | "muscle_gain";
  experience: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  equipment: "gym" | "home_dumbbells" | "bodyweight";
  ageYears: number;
  sex: "male" | "female" | "other";
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: number;
};

const initialForm: OnboardingForm = {
  goal: "fat_loss",
  experience: "beginner",
  daysPerWeek: 3,
  equipment: "gym",
  ageYears: 25,
  sex: "other",
  heightCm: 170,
  weightKg: 70,
  targetWeightKg: 65,
  activityLevel: 1.55,
};
const draftKey = (userId: string) => `shuzhfit_onboarding_draft_${userId}`;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(() => {
    if (!user || typeof window === "undefined") return initialForm;
    try {
      return { ...initialForm, ...JSON.parse(window.sessionStorage.getItem(draftKey(user.id)) ?? "{}") as Partial<OnboardingForm> };
    } catch {
      return initialForm;
    }
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) window.sessionStorage.setItem(draftKey(user.id), JSON.stringify(form));
  }, [form, user]);

  function update<K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 2) {
      setStep((current) => current + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string | { message?: string } } | null;
        const message = typeof result?.error === "object" ? result.error.message : result?.error;
        throw new Error(message ?? "Unable to save your plan. Please try again.");
      }
      if (user) window.sessionStorage.removeItem(draftKey(user.id));
      await refresh();
      navigate("/today", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save your plan.");
    } finally {
      setSaving(false);
    }
  }

  const stepLabels = ["Training", "About you", "Targets"];
  const estimates = calculateFitnessMetrics({ ageYears: form.ageYears, sex: form.sex, heightCm: form.heightCm, weightKg: form.weightKg, activityLevel: form.activityLevel, goal: form.goal });
  return (
    <>
      <Helmet><title>Set up your plan</title><meta name="description" content="Choose your goals and build your personalized ShuzhFit plan." /></Helmet>
      <section className="pg page">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="pg-head" style={{ marginBottom: 20 }}>
            <span className="pg-kicker">Welcome{user ? `, ${user.name.split(" ")[0]}` : ""}</span>
            <h1>Set up your plan</h1>
            <p className="pg-intro">A few details help us build a plan that fits your schedule, experience, and equipment.</p>
          </div>
          <div className="btn-row" aria-label="Onboarding progress" style={{ marginBottom: 20 }}>
            {stepLabels.map((label, index) => (
              <button key={label} className={`btn btn-sm${index === step ? " btn-primary" : ""}`} type="button" onClick={() => index < step && setStep(index)} aria-current={index === step ? "step" : undefined}>
                {index + 1}. {label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="app-panel app-form">
            {step === 0 ? <>
              <div className="field-grid is-two-col">
                <label className="field"><span>Goal</span><select value={form.goal} onChange={(event) => update("goal", event.target.value as OnboardingForm["goal"])}><option value="fat_loss">Fat loss</option><option value="maintain">Maintain</option><option value="muscle_gain">Muscle gain</option></select></label>
                <label className="field"><span>Experience</span><select value={form.experience} onChange={(event) => update("experience", event.target.value as OnboardingForm["experience"])}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
                <label className="field"><span>Training days per week</span><select value={form.daysPerWeek} onChange={(event) => update("daysPerWeek", Number(event.target.value))}>{[2, 3, 4, 5, 6].map((days) => <option value={days} key={days}>{days} days</option>)}</select></label>
                <label className="field"><span>Equipment</span><select value={form.equipment} onChange={(event) => update("equipment", event.target.value as OnboardingForm["equipment"])}><option value="gym">Full gym</option><option value="home_dumbbells">Home dumbbells</option><option value="bodyweight">Bodyweight only</option></select></label>
              </div>
            </> : null}
            {step === 1 ? <div className="field-grid is-two-col">
              <label className="field"><span>Age</span><input type="number" min={13} max={100} required value={form.ageYears} onChange={(event) => update("ageYears", Number(event.target.value))} /></label>
              <label className="field"><span>Sex for calorie estimate</span><select value={form.sex} onChange={(event) => update("sex", event.target.value as OnboardingForm["sex"])}><option value="female">Female</option><option value="male">Male</option><option value="other">Prefer not to specify</option></select></label>
              <label className="field"><span>Height (cm)</span><input type="number" min={100} max={250} required value={form.heightCm} onChange={(event) => update("heightCm", Number(event.target.value))} /></label>
              <label className="field"><span>Current weight (kg)</span><input type="number" min={30} max={350} step={0.1} required value={form.weightKg} onChange={(event) => update("weightKg", Number(event.target.value))} /></label>
            </div> : null}
            {step === 2 ? <div className="field-grid is-two-col">
              <label className="field"><span>Target weight (kg)</span><input type="number" min={30} max={350} step={0.1} required value={form.targetWeightKg} onChange={(event) => update("targetWeightKg", Number(event.target.value))} /></label>
              <label className="field"><span>Daily activity</span><select value={form.activityLevel} onChange={(event) => update("activityLevel", Number(event.target.value))}><option value={1.2}>Mostly sitting</option><option value={1.375}>Lightly active</option><option value={1.55}>Moderately active</option><option value={1.725}>Very active</option><option value={1.9}>Highly active</option></select></label>
              <p className="pg-intro">Your plan will include {form.daysPerWeek} training days and use your current measurements as the starting point for progress.</p>
              <div className="hint-box"><strong>Daily starting targets</strong><span>{estimates.calorieTarget} kcal · {estimates.proteinTargetG} g protein · {estimates.waterTargetMl} ml water</span></div>
            </div> : null}
            {error ? <div role="alert" className="form-message">{error}</div> : null}
            <p className="health-disclaimer">Fitness and nutrition information is educational and is not medical advice. Talk to a health professional before making major changes.</p>
            <div className="btn-row" style={{ marginTop: 20 }}>
              {step > 0 ? <button type="button" className="btn btn-lg" onClick={() => setStep((current) => current - 1)}>Back</button> : null}
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{step < 2 ? "Continue" : saving ? "Building your plan…" : "Create my plan"}</button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
