import { useMemo, useState } from "react";
import { calculateFitnessMetrics } from "../../shared/fitness";

export function BmiPage() {
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(72);
  const [ageYears, setAgeYears] = useState(30);
  const [sex, setSex] = useState<"male" | "female" | "other">("other");
  const [goal, setGoal] = useState<"fat_loss" | "maintain" | "muscle_gain">("maintain");

  const result = useMemo(() => {
    const heightMeters = heightCm / 100;
    if (!heightMeters || heightMeters <= 0) return null;
    const bmi = weightKg / (heightMeters * heightMeters);

    if (bmi < 18.5) return { label: "Underweight", className: "notice err" };
    if (bmi < 25) return { label: "Normal", className: "notice ok" };
    if (bmi < 30) return { label: "Overweight", className: "notice err" };
    return { label: "Obese", className: "notice err" };
  }, [heightCm, weightKg]);
  const targets = calculateFitnessMetrics({ ageYears, sex, heightCm, weightKg, activityLevel: 1.55, goal });

  return (
    <section className="pg page">
      <div className="container">
        <div className="pg-head">
          <span className="pg-kicker">ShuzhFit</span>
          <h1>BMI &amp; Calories</h1>
          <p className="pg-intro">
            A client-side BMI quick check for planning training and nutrition
            goals.
          </p>
        </div>

        <div
          className="pg-section"
          style={{ display: "grid", gap: "16px", maxWidth: "520px" }}
        >
          <label>
            Height (cm)
            <input
              type="number"
              value={heightCm}
              onChange={(event) => setHeightCm(Number(event.target.value))}
            />
          </label>
          <label>
            Weight (kg)
            <input
              type="number"
              value={weightKg}
              onChange={(event) => setWeightKg(Number(event.target.value))}
            />
          </label>
          <label>
            Age
            <input type="number" min={13} max={100} value={ageYears} onChange={(event) => setAgeYears(Number(event.target.value))} />
          </label>
          <label>
            Sex for calorie estimate
            <select value={sex} onChange={(event) => setSex(event.target.value as typeof sex)}><option value="female">Female</option><option value="male">Male</option><option value="other">Prefer not to specify</option></select>
          </label>
          <label>
            Goal
            <select value={goal} onChange={(event) => setGoal(event.target.value as typeof goal)}><option value="fat_loss">Fat loss</option><option value="maintain">Maintain</option><option value="muscle_gain">Muscle gain</option></select>
          </label>

          <div className={result?.className ?? "notice"}>
            <strong>BMI:</strong>{" "}
            {(weightKg / (heightCm / 100) ** 2 || 0).toFixed(1)}
            <div>{result?.label ?? "Enter valid numbers"}</div>
          </div>
          <div className="app-panel"><strong>BMR:</strong> {targets.bmrCalories} kcal · <strong>Maintenance:</strong> {targets.maintenanceCalories} kcal<br /><strong>Daily target:</strong> {targets.calorieTarget} kcal · <strong>Protein:</strong> {targets.proteinTargetG} g · <strong>Water:</strong> {targets.waterTargetMl} ml</div>
        </div>
      </div>
    </section>
  );
}
