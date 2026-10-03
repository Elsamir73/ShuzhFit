import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { blogs, commonFoods, exercises } from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required before running DB seeding.");
}

const db = drizzle(neon(connectionString), { logger: false });

const exerciseSeed = [
  {
    slug: "barbell-back-squat",
    name: "Barbell Back Squat",
    category: "Strength",
    muscles: "Quads, glutes, hamstrings",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description: "Classic lower-body strength lift for building leg power.",
    benefits: "Builds leg strength and improves overall athletic power.",
    formGuide:
      "Brace your core, keep your chest up, and drive through the floor.",
    mistakes: "Don’t let your knees collapse inward or your torso round.",
  },
  {
    slug: "bench-press",
    name: "Bench Press",
    category: "Strength",
    muscles: "Chest, triceps, shoulders",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description:
      "A staple upper-body press that builds chest strength and lockout power.",
    benefits: "Improves pressing strength and upper-body muscularity.",
    formGuide: "Keep your shoulder blades down and your feet planted.",
    mistakes: "Avoid flared elbows and a bouncing bar off the chest.",
  },
  {
    slug: "deadlift",
    name: "Deadlift",
    category: "Strength",
    muscles: "Hamstrings, glutes, back",
    equipment: "Barbell",
    difficulty: "Advanced",
    description: "Full-body posterior chain lift for strength and power.",
    benefits: "Builds total-body strength and posterior chain development.",
    formGuide: "Drive through the floor and keep the bar close to your shins.",
    mistakes: "Do not round your lower back or jerk the weight up.",
  },
  {
    slug: "overhead-press",
    name: "Overhead Press",
    category: "Strength",
    muscles: "Shoulders, triceps, core",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description: "Vertical press that strengthens the upper body and trunk.",
    benefits: "Improves shoulder pressing and overhead stability.",
    formGuide: "Keep the bar over the midline of your body as you press.",
    mistakes: "Avoid leaning back and arching the lower back.",
  },
  {
    slug: "pull-up",
    name: "Pull-Up",
    category: "Pull",
    muscles: "Lats, biceps, upper back",
    equipment: "Pull-up bar",
    difficulty: "Intermediate",
    description: "Fundamental bodyweight pull for back and arm strength.",
    benefits: "Improves grip, upper-back strength and posture.",
    formGuide:
      "Pull your shoulder blades down and back before driving the elbows down.",
    mistakes: "Avoid kipping hard and swinging through the rep.",
  },
  {
    slug: "dip",
    name: "Dip",
    category: "Push",
    muscles: "Chest, triceps, shoulders",
    equipment: "Parallel bars",
    difficulty: "Intermediate",
    description: "Bodyweight pressing movement for chest and triceps.",
    benefits: "Builds upper-body pressing strength and stability.",
    formGuide: "Keep your torso upright and lower with control.",
    mistakes: "Avoid shrugging your shoulders and dropping too deep.",
  },
  {
    slug: "bent-over-row",
    name: "Bent-Over Row",
    category: "Pull",
    muscles: "Back, biceps, rear delts",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description: "A strong row for upper-back thickness and pulling power.",
    benefits: "Improves back strength and posture for daily life.",
    formGuide: "Keep your torso stable as you row the bar to the lower ribs.",
    mistakes: "Do not jerk the bar or round the lower back.",
  },
  {
    slug: "front-squat",
    name: "Front Squat",
    category: "Strength",
    muscles: "Quads, glutes, core",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description:
      "A squat variation that emphasizes torso position and leg drive.",
    benefits: "Builds quad strength while improving posture and core control.",
    formGuide: "Keep the elbows up and chest tall while you descend.",
    mistakes: "Avoid collapsing the chest or losing upper-back tension.",
  },
  {
    slug: "walking-lunge",
    name: "Walking Lunge",
    category: "Legs",
    muscles: "Quads, glutes, hamstrings",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    description:
      "A unilateral lower-body movement for balance and leg control.",
    benefits: "Improves single-leg stability and leg endurance.",
    formGuide: "Step long and keep the torso tall as you lower.",
    mistakes: "Avoid leaning too far forward or letting the knee cave in.",
  },
  {
    slug: "romanian-deadlift",
    name: "Romanian Deadlift",
    category: "Pull",
    muscles: "Hamstrings, glutes, back",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description: "Hip-dominant hinge that targets the hamstrings and glutes.",
    benefits: "Builds posterior-chain strength and hamstring resilience.",
    formGuide: "Keep a soft bend in the knees and drive hips back.",
    mistakes: "Avoid rounding at the bottom or jerking the weight.",
  },
  {
    slug: "push-up",
    name: "Push-Up",
    category: "Push",
    muscles: "Chest, shoulders, triceps",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    description: "Classic upper-body push for strength and control.",
    benefits: "Improves pressing ability and core stability.",
    formGuide: "Brace your core and keep a straight line from head to heels.",
    mistakes: "Avoid sagging hips or a collapsed low back.",
  },
  {
    slug: "plank",
    name: "Plank",
    category: "Core",
    muscles: "Core, glutes, shoulders",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    description: "Isometric core drill for bracing and stability.",
    benefits: "Strengthens the trunk and improves anti-extension control.",
    formGuide: "Keep your ribs down and your spine neutral.",
    mistakes: "Avoid arching the lower back or piking the hips.",
  },
  {
    slug: "kettlebell-swing",
    name: "Kettlebell Swing",
    category: "Power",
    muscles: "Glutes, hamstrings, core",
    equipment: "Kettlebell",
    difficulty: "Intermediate",
    description: "Explosive hinge for power and conditioning.",
    benefits: "Improves power, coordination and posterior-chain conditioning.",
    formGuide: "Hinge at the hips and keep the bell close to the body.",
    mistakes: "Avoid squatting the weight and rounding the back.",
  },
  {
    slug: "chin-up",
    name: "Chin-Up",
    category: "Pull",
    muscles: "Lats, biceps, upper back",
    equipment: "Pull-up bar",
    difficulty: "Intermediate",
    description:
      "Vertical pull with a supinated grip for arm and back strength.",
    benefits: "Builds biceps, lats and pulling endurance.",
    formGuide: "Pull your elbows down while keeping head neutral.",
    mistakes: "Avoid swinging and leaning backward to get the rep.",
  },
  {
    slug: "dumbbell-row",
    name: "Dumbbell Row",
    category: "Pull",
    muscles: "Back, biceps, rear delts",
    equipment: "Dumbbells",
    difficulty: "Beginner",
    description: "Single-arm pulling movement for row strength.",
    benefits: "Helps build back strength with a stable torso.",
    formGuide: "Brace the torso and row each dumbbell toward the hip.",
    mistakes: "Avoid twisting and rotating the torso as you row.",
  },
  {
    slug: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    category: "Legs",
    muscles: "Quads, glutes, hamstrings",
    equipment: "Dumbbell or barbell",
    difficulty: "Intermediate",
    description:
      "Single-leg squat variation that improves balance and leg strength.",
    benefits: "Builds unilateral leg strength and stability.",
    formGuide: "Keep the front foot flat and the back heel elevated.",
    mistakes: "Avoid collapsing the front knee and losing your balance.",
  },
  {
    slug: "farmer-carry",
    name: "Farmer Carry",
    category: "Carry",
    muscles: "Grip, forearms, core, legs",
    equipment: "Dumbbells or kettlebells",
    difficulty: "Beginner",
    description: "Heavy carry to build grip and full-body tension.",
    benefits: "Improves grip strength, posture and conditioning.",
    formGuide: "Walk tall with a neutral spine and shoulders packed down.",
    mistakes: "Avoid leaning or letting the weights swing.",
  },
  {
    slug: "reverse-lunge",
    name: "Reverse Lunge",
    category: "Legs",
    muscles: "Quads, glutes, hamstrings",
    equipment: "Bodyweight or dumbbells",
    difficulty: "Beginner",
    description:
      "A scalable leg movement that teaches balance and mechanical control.",
    benefits: "Supports leg strength, balance and knee health.",
    formGuide: "Step back under control and keep the torso tall.",
    mistakes: "Avoid letting the front knee collapse inward.",
  },
  {
    slug: "hip-thrust",
    name: "Hip Thrust",
    category: "Glutes",
    muscles: "Glutes, hamstrings, core",
    equipment: "Barbell or dumbbell",
    difficulty: "Intermediate",
    description: "Hip extension movement for glute strength and power.",
    benefits: "Builds glute strength and improves hip extension capacity.",
    formGuide: "Drive through the heels and keep your chin tucked.",
    mistakes: "Avoid over-arching the lower back at the top.",
  },
  {
    slug: "incline-bench-press",
    name: "Incline Bench Press",
    category: "Push",
    muscles: "Upper chest, shoulders, triceps",
    equipment: "Barbell or dumbbells",
    difficulty: "Intermediate",
    description:
      "Upper-body pressing variation for chest and shoulder strength.",
    benefits:
      "Targets upper chest and front delts while improving pressing skill.",
    formGuide: "Set the bench angle and keep your shoulder blades stable.",
    mistakes: "Avoid flared elbows and excessive shoulder elevation.",
  },
  {
    slug: "lat-pulldown",
    name: "Lat Pulldown",
    category: "Pull",
    muscles: "Lats, biceps, upper back",
    equipment: "Cable machine",
    difficulty: "Beginner",
    description: "A machine-based alternative for building back strength.",
    benefits:
      "Improves pull strength with less technical complexity than pull-ups.",
    formGuide: "Pull the bar toward the collarbones and control the return.",
    mistakes: "Avoid leaning back too hard or shrugging the shoulders.",
  },
  {
    slug: "hollow-hold",
    name: "Hollow Hold",
    category: "Core",
    muscles: "Abs, hip flexors, lower back stabilizers",
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    description: "Core bracing position used in gymnastics training.",
    benefits: "Improves trunk control and body tension.",
    formGuide: "Keep the lower back gently pressed into the floor.",
    mistakes: "Avoid lifting the head or letting the ribs flare.",
  },
  {
    slug: "db-overhead-press",
    name: "Dumbbell Overhead Press",
    category: "Push",
    muscles: "Shoulders, triceps, core",
    equipment: "Dumbbells",
    difficulty: "Beginner",
    description: "Unilateral overhead press for balanced shoulder strength.",
    benefits: "Improves shoulder stability and upper-body pressing symmetry.",
    formGuide: "Press with a strong brace and keep the ribs down.",
    mistakes: "Avoid arching the lower back and leaning too far backward.",
  },
  {
    slug: "cable-row",
    name: "Cable Row",
    category: "Pull",
    muscles: "Back, biceps, rear delts",
    equipment: "Cable machine",
    difficulty: "Beginner",
    description:
      "Versatile row movement for building back strength and posture.",
    benefits: "Improves back development and pulling endurance.",
    formGuide:
      "Lean slightly forward, then drive elbows back with a controlled finish.",
    mistakes: "Avoid excessive torso swing and shrugging the shoulders.",
  },
  {
    slug: "squat-to-press",
    name: "Squat to Press",
    category: "Full Body",
    muscles: "Legs, shoulders, core",
    equipment: "Dumbbells",
    difficulty: "Intermediate",
    description:
      "A combined lower-body and upper-body movement for power and coordination.",
    benefits: "Builds full-body coordination and total-body strength.",
    formGuide:
      "Stand tall, squat beneath the dumbbells, then drive up and press overhead.",
    mistakes: "Avoid rounding the low back and rushing the press.",
  },
];

const blogSeed = [
  {
    slug: "simple-strength-rules",
    title: "Simple Strength Rules That Actually Work",
    excerpt:
      "Consistency beats complexity when building strength and body composition.",
    content:
      "<p>Strength is built through a simple recipe: train hard, recover well, and stay consistent.</p><p>Focus on the basics, track your progress, and let the plan do the heavy lifting.</p>",
    authorName: "ShuzhFit",
    category: "Strength",
    imageUrl: "",
    isPublished: true,
  },
  {
    slug: "better-recovery",
    title: "The Recovery Habits That Make Gains Stick",
    excerpt:
      "Recovery is not a reward; it is the process that makes the work count.",
    content:
      "<p>Recovery is where adaptation happens. Sleep, hydration, and a manageable training schedule matter as much as effort in the gym.</p><p>When your recovery is in order, your training quality improves and your progress compounds.</p>",
    authorName: "ShuzhFit",
    category: "Recovery",
    imageUrl: "",
    isPublished: true,
  },
];

const commonFoodSeed = [
  { name: "Dal bhat", calories: 650, proteinG: "22", carbsG: "105", fatG: "14", isEstimate: true },
  { name: "Momo (8 pieces)", calories: 520, proteinG: "24", carbsG: "58", fatG: "22", isEstimate: true },
  { name: "Sel roti (1 piece)", calories: 210, proteinG: "4", carbsG: "32", fatG: "8", isEstimate: true },
  { name: "Boiled eggs (2)", calories: 156, proteinG: "13", carbsG: "1", fatG: "11", isEstimate: true },
  { name: "Chicken curry (1 serving)", calories: 320, proteinG: "29", carbsG: "8", fatG: "18", isEstimate: true },
  { name: "Dahi (1 cup)", calories: 150, proteinG: "8", carbsG: "11", fatG: "8", isEstimate: true },
  { name: "Milk (1 cup)", calories: 150, proteinG: "8", carbsG: "12", fatG: "8", isEstimate: true },
  { name: "Chiura (1 cup)", calories: 180, proteinG: "4", carbsG: "40", fatG: "1", isEstimate: true },
  { name: "Roti with tarkari (1 serving)", calories: 360, proteinG: "10", carbsG: "58", fatG: "10", isEstimate: true },
];


async function main() {
  await Promise.all(
    exerciseSeed.map((exercise) =>
      db
        .insert(exercises)
        .values(exercise)
        .onConflictDoNothing({ target: exercises.slug })
        .execute(),
    ),
  );


  await Promise.all(
    commonFoodSeed.map((food) =>
      db.insert(commonFoods).values(food).onConflictDoNothing({ target: commonFoods.name }).execute(),
    ),
  );

  await Promise.all(
    blogSeed.map((post) =>
      db
        .insert(blogs)
        .values(post)
        .onConflictDoNothing({ target: blogs.slug })
        .execute(),
    ),
  );

  console.log(
    `Seeded ${exerciseSeed.length} exercises, ${blogSeed.length} blog posts, and ${commonFoodSeed.length} common foods.`,
  );
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
