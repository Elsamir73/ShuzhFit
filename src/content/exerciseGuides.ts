export type Guide = {
  steps: string[];
  tips: string[];
  mistakes: string[];
  rest?: string;
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function splitList(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

/** Fallback: turn a paragraph into short steps. */
export function sentences(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .replace(/<[^>]*>/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

const GUIDES: Record<string, Guide> = {
  "barbell-back-squat": {
    rest: "90–120 sec",
    steps: [
      "Set the bar on the rack at upper-chest height. Step under it and place it across your upper back, not on your neck.",
      "Grip the bar just outside your shoulders, lift it off the rack and take two small steps back.",
      "Stand with your feet shoulder-width apart and toes turned out slightly. Take a deep breath and brace your core.",
      "Push your hips back and bend your knees together. Lower until your thighs are at least parallel to the floor.",
      "Keep your chest up and your knees tracking over your toes. Keep your whole foot flat on the floor.",
      "Drive through your mid-foot to stand up and squeeze your glutes at the top. Re-rack the bar carefully.",
    ],
    tips: [
      "Set the safety bars just below your lowest squat depth before you start.",
      "Learn the pattern with an empty bar and add weight slowly.",
      "Lower for about 2–3 seconds, then stand up with power.",
    ],
    mistakes: [
      "Knees caving in: push your knees out over your toes.",
      "Rounding the lower back: keep your chest tall, brace harder and lower the weight.",
      "Heels lifting: keep your whole foot on the floor.",
      "Cutting depth short: use a lighter weight and reach parallel on every rep.",
    ],
  },
  "bench-press": {
    rest: "90–120 sec",
    steps: [
      "Lie on the bench with your eyes under the bar and your feet flat on the floor.",
      "Pull your shoulder blades together and down, and keep a slight arch in your upper back.",
      "Grip the bar slightly wider than your shoulders and unrack it with your arms straight over your shoulders.",
      "Lower the bar under control to your mid-chest, with your elbows about 45–60 degrees from your body.",
      "Touch your chest lightly without bouncing, then press the bar up and slightly back.",
      "Lock out your arms without shrugging, then re-rack. Use a spotter or safety arms for heavy sets.",
    ],
    tips: [
      "Push the floor away with your feet to stay tight through the whole rep.",
      "Lower in about 2 seconds and press up fast.",
      "Add weight only when every rep of every set looks the same.",
    ],
    mistakes: [
      "Flaring your elbows out to 90 degrees: tuck them to about 45–60 degrees.",
      "Bouncing the bar off your chest: pause briefly instead.",
      "Lifting your hips off the bench: keep your glutes down and feet planted.",
      "Pressing heavy with no spotter or safeties: always set them up.",
    ],
  },
  "front-squat": {
    rest: "90–120 sec",
    steps: [
      "Set the bar at upper-chest height. Rest it on the front of your shoulders with your fingertips under the bar.",
      "Lift your elbows high so your upper arms are close to parallel with the floor, then unrack the bar.",
      "Step back, place your feet shoulder-width apart with your toes slightly out, and brace your core.",
      "Sit straight down between your knees, keeping your chest tall and your elbows up.",
      "Go as deep as you can while keeping your back flat, ideally below parallel.",
      "Drive up through your whole foot, leading with your chest, until you stand tall.",
    ],
    tips: [
      "Start light. The bar position takes a few sessions to feel natural.",
      "If your wrists are tight, use straps or a cross-arm grip.",
      "Small plates under your heels or squat shoes can help your depth.",
    ],
    mistakes: [
      "Elbows dropping: the bar rolls forward, so keep your elbows high.",
      "Chest collapsing forward: lower the weight and brace harder.",
      "Heels lifting: keep your whole foot flat.",
      "Rushing the way down: control the descent every rep.",
    ],
  },
  deadlift: {
    rest: "2–3 min",
    steps: [
      "Stand with your feet hip-width apart and the bar over your mid-foot, close to your shins.",
      "Hinge at your hips, bend your knees and grip the bar just outside your legs.",
      "Pull the slack out of the bar, drop your hips and lift your chest so your back is flat.",
      "Brace your core and push the floor away, keeping the bar close to your legs.",
      "When the bar passes your knees, drive your hips forward and stand tall without leaning back.",
      "Lower by pushing your hips back first, then bending your knees, and set the bar down with control.",
    ],
    tips: [
      "Think of pushing the floor away instead of pulling the bar up.",
      "Keep the bar touching your legs the whole way.",
      "Use straps or a mixed grip if your grip gives out first.",
    ],
    mistakes: [
      "Rounding your lower back: reset, brace harder and lower the weight.",
      "Letting the bar drift away from your body.",
      "Jerking the bar off the floor: take the slack out first.",
      "Leaning back at the top: finish by standing tall, not hyperextending.",
    ],
  },
  "overhead-press": {
    rest: "90–120 sec",
    steps: [
      "Stand with your feet hip-width apart and let the bar rest on the front of your shoulders.",
      "Grip the bar just outside your shoulders with your elbows slightly in front of the bar.",
      "Brace your core and squeeze your glutes to keep your ribs stacked over your hips.",
      "Press the bar straight up and move your head back slightly as it passes your face.",
      "Push your head forward once the bar clears it and lock your arms fully overhead.",
      "Keep the bar over the middle of your body, then lower it under control and breathe.",
    ],
    tips: [
      "Start with an empty bar to learn the bar path before adding weight.",
      "Squeeze your glutes hard so your lower back stays neutral.",
      "Exhale slowly after the bar passes the hardest part of the rep.",
    ],
    mistakes: [
      "Arching your lower back: brace your core and squeeze your glutes before each press.",
      "Pressing the bar around your chin: move your head back as the bar passes, then forward.",
      "Flaring your elbows out wide: keep them slightly in front of the bar.",
      "Stopping short of lockout: press until your arms are straight overhead.",
    ],
  },
  "pull-up": {
    rest: "90–120 sec",
    steps: [
      "Grip the bar slightly wider than your shoulders with your palms facing away, and hang with straight arms.",
      "Pull your shoulder blades down and back to start the movement.",
      "Drive your elbows down toward your ribs until your chin passes the bar.",
      "Keep your chest up and your legs still. Avoid swinging.",
      "Lower slowly over 2–3 seconds until your arms are fully straight.",
      "Repeat. Use a band or an assisted machine if you can't do full reps yet.",
    ],
    tips: [
      "Start every rep from a controlled hang, not a bounce.",
      "Squeeze the bar hard to switch on your upper back.",
      "Slow lowering reps are a great way to build your first pull-up.",
    ],
    mistakes: [
      "Swinging or kipping to get over the bar.",
      "Half reps: go from a full hang to chin over the bar.",
      "Shrugging your shoulders up to your ears.",
      "Dropping fast: control the way down.",
    ],
  },
  dip: {
    rest: "90–120 sec",
    steps: [
      "Grip the parallel bars and support yourself above them with straight arms.",
      "Choose your angle: lean forward slightly for chest or stay upright for triceps.",
      "Bend your elbows and lower your body until your upper arms are parallel to the floor.",
      "Keep your shoulders pressed down away from your ears the whole way down.",
      "Press back up until your arms are straight without snapping your elbows hard.",
      "Keep your legs still and your core braced so your body does not swing.",
    ],
    tips: [
      "Start with bench dips or a band and build up to full dips.",
      "Lower only as deep as your shoulders stay comfortable.",
      "Take about two seconds to lower on every rep.",
    ],
    mistakes: [
      "Dropping too deep: stop when your upper arms reach parallel.",
      "Shrugging your shoulders up: press them down and hold them stable.",
      "Swinging your legs for momentum: keep your body still and press smoothly.",
      "Rushing the reps: control both the way down and the way up.",
    ],
  },
  "bent-over-row": {
    rest: "90–120 sec",
    steps: [
      "Hold the bar with your hands just outside your knees and stand with your feet hip-width apart.",
      "Hinge forward from your hips until your torso is around 45 degrees with a flat back.",
      "Let the bar hang straight down, then brace your core before each rep.",
      "Row the bar up toward your lower ribs, leading with your elbows.",
      "Squeeze your shoulder blades together at the top for a moment.",
      "Lower the bar slowly back to the hang position without moving your torso.",
    ],
    tips: [
      "Start light and own the hip hinge before adding weight.",
      "Keep your hips and shoulders level so both sides work evenly.",
      "Set the bar down and rest if your lower back tires before your upper back.",
    ],
    mistakes: [
      "Jerking the bar upward: row smoothly and keep your torso still.",
      "Rounding your lower back: hinge from the hips and brace your core.",
      "Standing up as you row: hold your torso angle fixed.",
      "Cutting the range short: pull the bar to your lower ribs every rep.",
    ],
  },
  "walking-lunge": {
    rest: "60–90 sec",
    steps: [
      "Stand tall with your feet hip-width apart and your arms relaxed at your sides.",
      "Step forward into a long stride and plant your whole front foot flat.",
      "Lower straight down until both knees are bent about 90 degrees.",
      "Keep your torso tall and your front knee stacked over your ankle.",
      "Push through your front heel to stand and bring your back leg through.",
      "Repeat on the other leg and keep walking forward in a straight line.",
    ],
    tips: [
      "Take steps long enough that your front knee stays over your ankle.",
      "Move slowly at first to build balance before adding dumbbells.",
      "Exhale as you push up out of every rep.",
    ],
    mistakes: [
      "Front knee caving in: line your knee up over your toes.",
      "Leaning far forward: keep your chest tall and your core braced.",
      "Short choppy steps: take a longer stride so both knees can bend.",
      "Slamming the back knee down: lower it with control.",
    ],
  },
  "romanian-deadlift": {
    rest: "2–3 min",
    steps: [
      "Stand holding the bar at hip height with your feet hip-width apart.",
      "Soften your knees slightly and keep that bend for the whole set.",
      "Push your hips back and let the bar slide down your thighs toward your shins.",
      "Stop when you feel a strong hamstring stretch with your back still flat.",
      "Drive your hips forward to stand tall and squeeze your glutes at the top.",
      "Reset your breath and brace again before the next rep.",
    ],
    tips: [
      "Start with just the bar to learn the hinge before adding weight.",
      "Keep the bar in contact with your legs the whole way.",
      "End the set if your lower back starts working instead of your hamstrings.",
    ],
    mistakes: [
      "Rounding your lower back: stop higher, brace harder and lighten the load.",
      "Squatting instead of hinging: push your hips back, not your knees forward.",
      "Letting the bar drift away from your legs.",
      "Jerking the weight up: pull smoothly out of the stretch.",
    ],
  },
};

export function guideFor(slug: string, name: string): Guide | null {
  return GUIDES[slug] ?? GUIDES[slugify(name)] ?? null;
}
