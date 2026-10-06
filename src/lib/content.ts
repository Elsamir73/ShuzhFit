export type Exercise = {
  slug: string;
  name: string;
  category: string;
  muscles: string;
  equipment: string;
  difficulty: string;
  description: string;
  benefits: string;
  formGuide: string;
  mistakes: string;
  youtubeUrl?: string;
  muscleGroup?: string;
  steps?: string[];
  tips?: string[];
  mistakesList?: string[];
  repUnit?: "reps" | "seconds" | "meters";
  video?: { title: string; url: string; thumbnail: string; isShort?: boolean } | null;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  contentFormat?: "html" | "markdown";
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type Video = {
  slug: string;
  title: string;
  description: string;
  youtubeUrl: string;
  exerciseSlug?: string;
  thumbnail?: string;
  durationSeconds?: number;
  publishedAt?: string;
  isShort?: boolean;
};

export const exercises: Exercise[] = [
  {
    slug: "barbell-back-squat",
    name: "Barbell Back Squat",
    category: "Strength",
    muscles: "Quads, glutes, hamstrings",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description:
      "A classic lower-body lift that builds leg strength and full-body tension.",
    benefits:
      "<p>Builds leg strength, increases overall power, and improves stability in daily life.</p>",
    formGuide:
      "<p>Brace the core, keep the chest tall, and descend until the hips and knees are loaded properly.</p>",
    mistakes:
      "<p>Avoid rounding the lower back, collapsing the knees inward, or bouncing out of the bottom.</p>",
  },
  {
    slug: "bench-press",
    name: "Bench Press",
    category: "Strength",
    muscles: "Chest, triceps, shoulders",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description: "A staple press for upper-body strength and lockout power.",
    benefits:
      "<p>Improves pressing strength and upper-body muscular development.</p>",
    formGuide:
      "<p>Keep your feet rooted, shoulder blades down, and lower with control before driving the bar upward.</p>",
    mistakes:
      "<p>Do not bounce the bar off the chest or flare the elbows excessively.</p>",
  },
  {
    slug: "deadlift",
    name: "Deadlift",
    category: "Strength",
    muscles: "Hamstrings, glutes, back",
    equipment: "Barbell",
    difficulty: "Advanced",
    description: "Full-body posterior chain lift for strength and power.",
    benefits:
      "<p>Builds total-body strength and improves the posterior chain.</p>",
    formGuide:
      "<p>Keep the bar close to the shins, brace the trunk, and lock the top position with control.</p>",
    mistakes: "<p>Avoid rounding the back or jerking the weight upward.</p>",
  },
  {
    slug: "pull-up",
    name: "Pull-Up",
    category: "Pull",
    muscles: "Lats, biceps, upper back",
    equipment: "Pull-up bar",
    difficulty: "Intermediate",
    description: "Bodyweight pull with big carryover to upper-back strength.",
    benefits: "<p>Develops grip, lats, and upper-back endurance.</p>",
    formGuide:
      "<p>Pull the shoulder blades down and back, then drive the elbows toward the floor.</p>",
    mistakes: "<p>Do not swing, shrug, or use momentum to finish the rep.</p>",
  },
  {
    slug: "push-up",
    name: "Push-Up",
    category: "Push",
    muscles: "Chest, shoulders, triceps",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    description:
      "A compact chest and triceps press that scales well for nearly everyone.",
    benefits: "<p>Builds pressing strength and improves trunk stability.</p>",
    formGuide:
      "<p>Keep your body in one straight line and lower until your chest nearly reaches the floor.</p>",
    mistakes:
      "<p>Avoid sagging at the hips or flaring the elbows too far out.</p>",
  },
  {
    slug: "plank",
    name: "Plank",
    category: "Core",
    muscles: "Core, glutes, shoulders",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    description: "Simple isometric core builder for bracing and control.",
    benefits: "<p>Improves trunk endurance and anti-extension control.</p>",
    formGuide:
      "<p>Brace the abs, keep the ribs down, and hold a neutral spine.</p>",
    mistakes: "<p>Do not arch the lower back or let the hips hike upward.</p>",
  },
  {
    slug: "walking-lunge",
    name: "Walking Lunge",
    category: "Legs",
    muscles: "Quads, glutes, hamstrings",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    description:
      "Unilateral leg movement for balance, coordination, and strength.",
    benefits:
      "<p>Improves single-leg control and helps develop balanced lower-body strength.</p>",
    formGuide:
      "<p>Step forward long, keep the torso tall, and lower with control.</p>",
    mistakes:
      "<p>Avoid the front knee collapsing inward or the torso leaning too far forward.</p>",
  },
  {
    slug: "romanian-deadlift",
    name: "Romanian Deadlift",
    category: "Pull",
    muscles: "Hamstrings, glutes, back",
    equipment: "Barbell",
    difficulty: "Intermediate",
    description:
      "Hip-dominant hinging movement that targets the hamstrings and glutes.",
    benefits:
      "<p>Builds posterior-chain strength and improves hamstring resilience.</p>",
    formGuide:
      "<p>Set a soft knee bend, hinge the hips back, and keep the bar close to the thighs.</p>",
    mistakes: "<p>Avoid rounding the back or overextending at the bottom.</p>",
  },
  {
    slug: "lat-pulldown",
    name: "Lat Pulldown",
    category: "Pull",
    muscles: "Lats, biceps, upper back",
    equipment: "Cable machine",
    difficulty: "Beginner",
    description:
      "A very accessible pull for building upper-back strength and posture.",
    benefits: "<p>Improves upper-back development and pulling endurance.</p>",
    formGuide:
      "<p>Lean back slightly, pull the bar to the collarbones, and control the return.</p>",
    mistakes:
      "<p>Do not yank the weight down or shrug the shoulders at the top.</p>",
  },
  {
    slug: "farmer-carry",
    name: "Farmer Carry",
    category: "Carry",
    muscles: "Grip, forearms, core, legs",
    equipment: "Dumbbells or kettlebells",
    difficulty: "Beginner",
    description: "A brutal but useful full-body carry for grip and posture.",
    benefits:
      "<p>Improves grip strength, prevents fatigue from poor posture, and builds work capacity.</p>",
    formGuide:
      "<p>Walk tall with the shoulders down and the ribs tucked while keeping a neutral spine.</p>",
    mistakes: "<p>Do not lean forward or let the weights swing wildly.</p>",
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "simple-strength-rules",
    title: "Simple Strength Rules That Actually Work",
    excerpt:
      "Consistency beats complexity when building strength and body composition.",
    category: "Strength",
    author: "ShuzhFit",
    content:
      "<p>Strength is built through a simple recipe: train hard, recover well, and stay consistent.</p><p>Focus on the basics, track your progress, and let the plan do the heavy lifting.</p><p>Most people do not fail because they are lazy; they fail because they change too much too quickly.</p>",
  },
  {
    slug: "better-recovery",
    title: "The Recovery Habits That Make Gains Stick",
    excerpt: "Recovery is not optional if you want your training to compound.",
    category: "Recovery",
    author: "ShuzhFit",
    content:
      "<p>Recovery is where adaptation happens. Sleep, hydration, and a manageable training schedule matter as much as effort in the gym.</p><p>When your recovery is in order, your training quality improves and your progress compounds.</p><p>Keep your plans realistic and your weekends intentional.</p>",
  },
  {
    slug: "small-win-culture",
    title: "Small Wins Build Bigger Results",
    excerpt:
      "Short sessions, steady effort, and a long-term mindset keep progress alive.",
    category: "Mindset",
    author: "ShuzhFit",
    content:
      "<p>Long transformation stories are usually built from small wins repeated often enough to matter.</p><p>Train with intention, recover with structure, and remember that momentum is built by repeating the plan.</p>",
  },
];

export const videos: Video[] = [];

export const searchRecords = [
  ...exercises.map((exercise) => ({
    type: "exercise" as const,
    slug: exercise.slug,
    title: exercise.name,
    summary: exercise.description,
  })),
  ...blogPosts.map((blog) => ({
    type: "blog" as const,
    slug: blog.slug,
    title: blog.title,
    summary: blog.excerpt,
  })),
  ...videos.map((video) => ({
    type: "video" as const,
    slug: video.slug,
    title: video.title,
    summary: video.description,
  })),
];

export function getYouTubeVideoId(url: string) {
  try {
    const value = new URL(url);
    const pathParts = value.pathname.split("/").filter(Boolean);

    if (value.hostname.includes("youtu.be")) {
      return pathParts[0] ?? "";
    }

    if (value.hostname.includes("youtube.com")) {
      if (pathParts[0] === "shorts") {
        return pathParts[1] ?? "";
      }

      if (pathParts[0] === "embed") {
        return pathParts[1] ?? "";
      }

      return value.searchParams.get("v") ?? "";
    }
  } catch {
    return "";
  }

  return "";
}

export function toYouTubeEmbedUrl(url: string) {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return "";
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
