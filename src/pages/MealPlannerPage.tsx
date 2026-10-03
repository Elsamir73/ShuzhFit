import { Helmet } from "react-helmet-async";

const weeklyPlan = [
  {
    day: "Monday",
    focus: "High protein + carb support",
    meals: ["Oats + berries", "Chicken rice bowl", "Salmon + potatoes"],
  },
  {
    day: "Tuesday",
    focus: "Lower fatigue, steady calories",
    meals: ["Greek yogurt bowl", "Turkey wrap", "Beef stir-fry"],
  },
  {
    day: "Wednesday",
    focus: "Recovery and hydration",
    meals: ["Smoothie + toast", "Tuna salad", "Pasta + chicken"],
  },
  {
    day: "Thursday",
    focus: "Strength support",
    meals: ["Egg scramble", "Lean beef burrito", "Shrimp rice plate"],
  },
  {
    day: "Friday",
    focus: "Performing meal timing",
    meals: ["Protein porridge", "Chicken quinoa bowl", "Salmon + veg"],
  },
  {
    day: "Saturday",
    focus: "Slight calorie increase",
    meals: ["Bagel + eggs", "Turkey burger", "Rice + lentils"],
  },
  {
    day: "Sunday",
    focus: "Recovery and reset",
    meals: ["Overnight oats", "Turkey chili", "Chicken salad"],
  },
];

export function MealPlannerPage() {
  return (
    <>
      <Helmet>
        <title>Meal Planner</title>
        <meta
          name="description"
          content="Stay consistent with your weekly meal plan and nutrition structure."
        />
      </Helmet>

      <section className="pg page">
        <div className="container">
          <div className="pg-head" style={{ marginBottom: 24 }}>
            <span className="pg-kicker">Fuel</span>
            <h1>Meal planner</h1>
            <p className="pg-intro">
              Align your meals with your training schedule and recovery needs.
            </p>
          </div>

          <div className="meal-plan-list">
            {weeklyPlan.map((day) => (
              <article key={day.day} className="meal-day-card">
                <div className="meal-day-header">
                  <h2>{day.day}</h2>
                  <span>{day.focus}</span>
                </div>
                <ul className="meal-list">
                  {day.meals.map((meal) => (
                    <li key={meal}>{meal}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
