import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { calculateFitnessMetrics } from "../../shared/fitness";
import type { FitnessGoal, SexAtBirth } from "../../shared/fitness";
import "../styles/nutrition.css";

const proteinFoods = [
  { food: "Egg", serving: "1 large", protein: "6 g" },
  { food: "Chicken", serving: "100 g cooked", protein: "31 g" },
  { food: "Paneer", serving: "100 g", protein: "18 g" },
  { food: "Soya chunks", serving: "50 g dry", protein: "26 g" },
  { food: "Dal", serving: "1 cup cooked", protein: "18 g" },
  { food: "Curd", serving: "200 g", protein: "8 g" },
  { food: "Milk", serving: "250 ml", protein: "8 g" },
  { food: "Peanuts", serving: "30 g", protein: "8 g" },
  { food: "Tofu", serving: "100 g", protein: "12 g" },
  { food: "Fish", serving: "100 g cooked", protein: "22 g" },
  { food: "Chickpeas", serving: "1 cup cooked", protein: "15 g" },
  { food: "Rice", serving: "1 cup cooked", protein: "4 g" },
];

const guideLinks = [
  ["why-food-matters", "Why food matters"],
  ["protein-builder", "Protein: the builder"],
  ["carbs-fuel", "Carbs: the fuel"],
  ["fats-regulator", "Fats: the regulator"],
  ["meal-timing", "Meal timing"],
  ["water", "Water"],
  ["eating-for-your-goal", "Eating for your goal"],
  ["supplements", "Supplements: what is worth it"],
  ["start-this-week", "Start here (this week)"],
  ["quick-questions", "Quick questions"],
] as const;

const mealExamples = {
  training: [
    "Breakfast: eggs, oats and a banana",
    "Lunch: rice, dal, chicken or paneer, and vegetables",
    "Before training: curd and fruit",
    "Dinner: roti, tofu or fish, and vegetables",
  ],
  rest: [
    "Breakfast: curd, oats, fruit and peanuts",
    "Lunch: rice, dal, paneer or tofu, and vegetables",
    "Snack: milk and a banana",
    "Dinner: roti, chickpeas or eggs, and vegetables",
  ],
} as const;

export function NutritionPage() {
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);
  const [ageYears, setAgeYears] = useState(25);
  const [sex, setSex] = useState<SexAtBirth>("other");
  const [goal, setGoal] = useState<FitnessGoal>("maintain");
  const [sampleDay, setSampleDay] = useState<"training" | "rest">("training");

  const metrics = useMemo(
    () =>
      calculateFitnessMetrics({
        ageYears,
        sex,
        heightCm,
        weightKg,
        activityLevel: 1.55,
        goal,
      }),
    [ageYears, sex, heightCm, weightKg, goal],
  );
  const proteinLow = Math.round(weightKg * 1.6);
  const proteinTarget = Math.round(weightKg * 1.8);
  const proteinHigh = Math.round(weightKg * 2.2);
  const waterLitres = (metrics.waterTargetMl / 1000).toFixed(1);

  return (
    <main className="nutrition-page pg page">
      <Helmet>
        <title>Nutrition | ShuzhFit</title>
        <meta
          name="description"
          content="Simple nutrition estimates, practical food ideas, and the basics to support your training."
        />
      </Helmet>
      <div className="container nutrition-container">
        <header className="pg-head nutrition-head">
          <span className="pg-kicker">Eat well. Train consistently.</span>
          <h1>Nutrition that works in real life</h1>
          <p className="pg-intro">
            Start with useful estimates, everyday foods and habits you can
            repeat. You do not need a perfect meal plan to make progress.
          </p>
        </header>

        <section className="nutrition-calculator" aria-labelledby="nutrition-calc-title">
          <div className="nutrition-section-heading">
            <span className="nutrition-label">Your starting point</span>
            <h2 id="nutrition-calc-title">Daily targets calculator</h2>
            <p>
              Adjust a few details to estimate a calorie target, protein range
              and water starting point.
            </p>
          </div>
          <div className="nutrition-calculator-grid">
            <form className="nutrition-fields" onSubmit={(event) => event.preventDefault()}>
              <label className="nutrition-field">
                <span>Weight (kg)</span>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={weightKg}
                  onChange={(event) => setWeightKg(Number(event.target.value))}
                />
              </label>
              <label className="nutrition-field">
                <span>Height (cm)</span>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={heightCm}
                  onChange={(event) => setHeightCm(Number(event.target.value))}
                />
              </label>
              <label className="nutrition-field">
                <span>Age</span>
                <input
                  type="number"
                  min="13"
                  max="100"
                  value={ageYears}
                  onChange={(event) => setAgeYears(Number(event.target.value))}
                />
              </label>
              <label className="nutrition-field">
                <span>Sex for estimate</span>
                <select
                  value={sex}
                  onChange={(event) => setSex(event.target.value as SexAtBirth)}
                >
                  <option value="other">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </label>
              <label className="nutrition-field nutrition-field-wide">
                <span>Your goal</span>
                <select
                  value={goal}
                  onChange={(event) => setGoal(event.target.value as FitnessGoal)}
                >
                  <option value="fat_loss">Fat loss</option>
                  <option value="maintain">Maintain</option>
                  <option value="muscle_gain">Muscle gain</option>
                </select>
              </label>
            </form>

            <div className="nutrition-results" aria-live="polite">
              <article className="nutrition-result nutrition-result-primary">
                <span>Daily calorie target</span>
                <strong>{metrics.calorieTarget.toLocaleString()} kcal</strong>
                <small>Estimated maintenance: {metrics.maintenanceCalories.toLocaleString()} kcal</small>
              </article>
              <article className="nutrition-result">
                <span>Protein range</span>
                <strong>{proteinLow}–{proteinHigh} g</strong>
                <small>Target: about {proteinTarget} g per day</small>
              </article>
              <article className="nutrition-result">
                <span>Water starting point</span>
                <strong>{waterLitres} L</strong>
                <small>About 35 ml per kg of bodyweight</small>
              </article>
              <p className="nutrition-estimate-note">
                Estimates, not medical advice. Real needs vary with activity,
                health and day-to-day life.
              </p>
            </div>
          </div>
        </section>

        <section className="nutrition-foods" aria-labelledby="nutrition-foods-title">
          <div className="nutrition-section-heading">
            <span className="nutrition-label">Everyday options</span>
            <h2 id="nutrition-foods-title">Protein foods at a glance</h2>
            <p>Approximate protein per common serving; values vary by brand and preparation.</p>
          </div>
          <div className="nutrition-table-wrap">
            <table className="nutrition-food-table">
              <thead>
                <tr><th scope="col">Food</th><th scope="col">Serving</th><th scope="col">Protein (approx.)</th></tr>
              </thead>
              <tbody>
                {proteinFoods.map((item) => (
                  <tr key={item.food}><th scope="row">{item.food}</th><td>{item.serving}</td><td>{item.protein}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="nutrition-sample" aria-labelledby="nutrition-sample-title">
          <div className="nutrition-section-heading">
            <span className="nutrition-label">A simple example</span>
            <h2 id="nutrition-sample-title">Build a day of meals</h2>
            <p>Use this as inspiration, not a strict plan. Adjust portions to fit your targets.</p>
          </div>
          <div className="nutrition-tabs" role="tablist" aria-label="Sample day">
          <button id="nutrition-training-tab" type="button" role="tab" aria-controls="nutrition-sample-panel" aria-selected={sampleDay === "training"} className={sampleDay === "training" ? "nutrition-tab is-active" : "nutrition-tab"} onClick={() => setSampleDay("training")}>Training day</button>
          <button id="nutrition-rest-tab" type="button" role="tab" aria-controls="nutrition-sample-panel" aria-selected={sampleDay === "rest"} className={sampleDay === "rest" ? "nutrition-tab is-active" : "nutrition-tab"} onClick={() => setSampleDay("rest")}>Rest day</button>
          </div>
          <ol id="nutrition-sample-panel" className="nutrition-meal-list" role="tabpanel" aria-labelledby={`nutrition-${sampleDay}-tab`}>
            {mealExamples[sampleDay].map((meal) => <li key={meal}>{meal}</li>)}
          </ol>
        </section>

        <section className="nutrition-rules" aria-labelledby="nutrition-rules-title">
          <div className="nutrition-section-heading">
            <span className="nutrition-label">Keep it practical</span>
            <h2 id="nutrition-rules-title">Simple rules to start with</h2>
          </div>
          <div className="nutrition-rule-grid">
            <article className="nutrition-rule-card"><span>01</span><h3>Build around protein</h3><p>Include a protein source at most meals and make the daily total your priority.</p></article>
            <article className="nutrition-rule-card"><span>02</span><h3>Choose useful portions</h3><p>Adjust portions to match your goal instead of labeling foods as good or bad.</p></article>
            <article className="nutrition-rule-card"><span>03</span><h3>Repeat what works</h3><p>Keep a few easy meals in rotation so busy days do not derail your routine.</p></article>
          </div>
        </section>

        <section className="nutrition-guide" aria-labelledby="nutrition-guide-title">
          <header className="nutrition-section-heading">
            <span className="nutrition-label">A clear place to begin</span>
            <h2 id="nutrition-guide-title">Learn the basics</h2>
            <p>Short answers to the nutrition questions that matter most when you are starting out.</p>
          </header>
          <div className="nutrition-guide-layout">
            <nav className="nutrition-toc" aria-label="Nutrition guide contents">
              <strong>In this guide</strong>
              {guideLinks.map(([id, title]) => <a href={`#${id}`} key={id}>{title}</a>)}
            </nav>
            <div className="nutrition-guide-content">
              <article className="nutrition-guide-section" id="why-food-matters">
                <h3>Why food matters</h3>
                <p>Training gives your body a reason to change. Food gives it the material. You spend a few hours a week in the gym and the rest of the week eating, sleeping and recovering, so those hours decide how much your training pays off. Keep it simple: enough protein, the right amount of calories, and meals you can repeat.</p>
              </article>
              <article className="nutrition-guide-section" id="protein-builder">
                <h3>Protein: the builder</h3>
                <p>Protein supplies the building blocks your muscles use to repair and grow. Aim for about 1.6 to 2.2 g per kg of bodyweight each day. A 70 kg person lands around 110 to 155 g. Spread it over 3 to 4 meals with roughly 20 to 40 g each. Good everyday sources: eggs, chicken, fish, paneer, dal, soya chunks, curd, milk and tofu.</p>
              </article>
              <article className="nutrition-guide-section" id="carbs-fuel">
                <h3>Carbs: the fuel</h3>
                <p>Carbs power your hard sets. Most people who train 3 to 5 days a week do well on roughly 3 to 6 g per kg per day, more if you train long or hard, less if you are cutting. Rice, roti, oats, potatoes, fruit and lentils are all fine. A bowl of white rice after training will not ruin anything. Total intake and consistency matter more than any single food.</p>
              </article>
              <article className="nutrition-guide-section" id="fats-regulator">
                <h3>Fats: the regulator</h3>
                <p>Fat supports hormones, vitamin absorption and joint health. Keep it around 0.6 to 1 g per kg per day. Going very low usually makes you feel worse without helping your results. Nuts, eggs, fish, ghee in small amounts, mustard oil or olive oil, and seeds are good choices.</p>
              </article>
              <article className="nutrition-guide-section" id="meal-timing">
                <h3>Meal timing</h3>
                <p>Total daily intake matters far more than the clock. A meal with protein and carbs one to three hours before training helps you feel strong. A protein-rich meal within a couple of hours afterward helps recovery. The idea that you lose your gains if you skip a 30-minute window is a myth. Pick a meal pattern you can actually keep.</p>
              </article>
              <article className="nutrition-guide-section" id="water">
                <h3>Water</h3>
                <p>Even mild dehydration can make training feel harder. A simple start is about 35 ml per kg per day, plus extra when you sweat a lot. Pale yellow urine means you are on track. Dark yellow means drink more.</p>
              </article>
              <section className="nutrition-guide-section" id="eating-for-your-goal">
                <h3>Eating for your goal</h3>
                <div className="nutrition-goal-grid">
                  <article className="nutrition-goal-card"><h4>Fat loss</h4><p>Eat about 300 to 500 kcal below maintenance, which usually means losing about 0.25 to 0.5 kg per week. Keep protein high so you keep muscle. Crash diets cost you muscle and energy.</p></article>
                  <article className="nutrition-goal-card"><h4>Muscle gain</h4><p>Eat about 200 to 300 kcal above maintenance and train progressively. Bigger surpluses mostly add fat. Expect slow, steady gains.</p></article>
                  <article className="nutrition-goal-card"><h4>Recomposition</h4><p>Eat close to maintenance with high protein and good training. It is slower, but works well for beginners and people returning after a break.</p></article>
                </div>
              </section>
              <article className="nutrition-guide-section" id="supplements">
                <h3>Supplements: what is worth it</h3>
                <p>Food comes first. Creatine monohydrate (3 to 5 g a day) is one of the most studied supplements and helps strength. Whey or other protein powder is simply a convenient way to reach your protein target. Caffeine before training can help performance if you tolerate it. BCAAs are unnecessary when your protein is enough, and fat burners and testosterone boosters are not worth the money.</p>
              </article>
              <article className="nutrition-guide-section" id="start-this-week">
                <h3>Start here (this week)</h3>
                <ul className="nutrition-checklist">
                  <li>Add a protein food to every meal</li>
                  <li>Carry a water bottle and refill it 3 to 4 times</li>
                  <li>Cook a big batch of dal, chicken or soya for 2 days</li>
                  <li>Read the label on foods you eat often</li>
                  <li>Aim for 80 percent consistency, not perfection</li>
                </ul>
              </article>
              <section className="nutrition-guide-section nutrition-questions" id="quick-questions">
                <h3>Quick questions</h3>
                <details><summary>Do I need to count calories?</summary><p>Not forever. Tracking for 2 to 4 weeks teaches you portions and how much protein you really eat. After that, rough estimates and regular check-ins work for many people.</p></details>
                <details><summary>Can I eat well on a budget?</summary><p>Yes. Eggs, dal, rice, oats, bananas, seasonal vegetables, soya chunks and curd are cheap and cover most needs.</p></details>
                <details><summary>I am vegetarian. Can I still build muscle?</summary><p>Yes. Combine dal, chickpeas, soya, tofu, paneer, milk and curd, and aim for a little more variety to reach your protein target.</p></details>
              </section>
            </div>
          </div>
        </section>

        <p className="nutrition-disclaimer">
          General information only, not medical advice. If you have a health condition, allergy or take medication, talk to a doctor or dietitian.
        </p>
        <section className="nutrition-cta" aria-labelledby="nutrition-cta-title">
          <div><span className="nutrition-label">One step at a time</span><h2 id="nutrition-cta-title">Track it for free</h2><p>Keep your meals, workouts and progress in one simple place.</p></div>
          <Link className="btn btn-primary btn-lg" to="/register">Get started</Link>
        </section>
      </div>
    </main>
  );
}
