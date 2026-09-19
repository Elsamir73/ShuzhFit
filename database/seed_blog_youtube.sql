-- Seed data for 2 sample blog posts + YouTube CTA/videos
-- Run this in your `shuzhfit` database.

USE shuzhfit;

-- Upsert-like inserts using slug uniqueness.
-- BLOG 1
INSERT INTO blogs (title, slug, category, image, author, content, created_at)
SELECT
  'What Bench Press Helps You Achieve',
  'what-bench-press-helps-you-achieve',
  'Workout Guides',
  'blogimg1.jpeg',
  'ShuzhFit',
  '<h2>Introduction</h2>
<p>The bench press is one of the most popular barbell exercises for building a stronger upper body. If you are a beginner, you might wonder what the bench press actually helps you achieve beyond “bigger chest.” The truth is: the bench press trains more than your pecs—it builds pressing strength, improves posture, and gives you a reliable foundation for many other lifts.</p>
<p>In this guide, you will learn what the bench press helps you achieve, which muscles it works, and how to use it to progress safely. You will also find common mistakes to avoid and practical beginner tips to make your first months in the gym count.</p>

<h2>Benefits of Bench Press (What You’ll Achieve)</h2>
<ul>
  <li><strong>Stronger pressing power</strong>: You gain the ability to push heavier weights in a controlled way.</li>
  <li><strong>More upper-body muscle</strong>: Chest, shoulders, and triceps get trained directly.</li>
  <li><strong>Improved posture and upper-body stability</strong>: A balanced pressing strength supports better shoulder positioning for daily life.</li>
  <li><strong>Better carryover to other movements</strong>: Push-ups, incline presses, overhead work, and even functional pushes become easier.</li>
</ul>

<h2>Muscles Worked</h2>
<p>The bench press is a “multi-muscle” movement. Even though it feels like a chest exercise, several muscles contribute to the bar path and joint control.</p>
<ul>
  <li><strong>Pectoralis major (chest)</strong>: Main driver of the pressing motion.</li>
  <li><strong>Anterior deltoids (front shoulders)</strong>: Help press the weight and keep the shoulders stable.</li>
  <li><strong>Triceps brachii</strong>: Responsible for elbow extension to finish the rep.</li>
  <li><strong>Upper back (scapular stabilizers)</strong>: Your lats and upper-back muscles keep your shoulder blades in position (this is crucial).</li>
  <li><strong>Core and lower body</strong>: Even though you’re lying down, your legs and core help create a stable base.</li>
</ul>

<h2>Strength Gains: What to Expect as a Beginner</h2>
<p>When you start bench pressing, your progress may feel fast—especially if you haven’t trained the movement before. Early strength gains often come from:</p>
<ul>
  <li><strong>Technique improvements</strong> (better bar path, tighter setup)</li>
  <li><strong>More muscle recruitment</strong> (your body becomes more efficient)</li>
  <li><strong>Stronger support muscles</strong> (shoulder stability and triceps involvement)</li>
</ul>
<p>Within 4–8 weeks, many beginners notice that they can press the same weight with better control—or press slightly more weight with the same effort.</p>

<h3>A simple beginner progression</h3>
<p>Try 3 sessions per week max (or 2 if you’re busy). For example:</p>
<ul>
  <li><strong>Week 1–2</strong>: 3 sets x 8–12 reps with a weight you can lift with good form.</li>
  <li><strong>Week 3–4</strong>: Add small weight increases when you hit the top of the rep range.</li>
  <li><strong>Ongoing</strong>: Keep a consistent schedule and only increase when your technique stays solid.</li>
</ul>

<h2>Posture Benefits (Why Bench Press Can Help You Look Better)</h2>
<p>Many beginners have forward-leaning shoulders due to long hours sitting. When you bench press correctly—especially by keeping your shoulder blades “packed” and your chest lifted—you can build strength in the muscles that help counter that posture.</p>
<p>Bench press also trains the muscles of the upper body to coordinate better for pushing strength. Over time, you may notice improved confidence in your upper-body movements and less “rounded” feeling during daily tasks.</p>

<h2>Common Bench Press Mistakes (And How to Fix Them)</h2>
<ul>
  <li><strong>Putting the shoulders in the wrong position</strong>: If your shoulders collapse, you reduce pressing efficiency. <em>Fix:</em> set your shoulder blades, keep your chest up, and stay tight.</li>
  <li><strong>Touching too high or too low</strong>: A random bar path makes progress harder. <em>Fix:</em> aim for a consistent touch point (often around mid-chest) and use controlled reps.</li>
  <li><strong>Rushing the rep</strong>: Fast reps often turn into sloppy reps. <em>Fix:</em> lower with control (about 2 seconds) and press powerfully.</li>
  <li><strong>Overstretching at the bottom</strong>: If you keep bouncing the bar, you risk losing joint stability. <em>Fix:</em> touch softly and press immediately without bouncing.</li>
  <li><strong>Locking out aggressively every rep</strong>: Aggressive lockouts are not always necessary. <em>Fix:</em> finish under control—full extension, but no jerking.</li>
</ul>

<h2>Beginner Tips to Bench Press Better</h2>
<ul>
  <li><strong>Start lighter than you think</strong>: Technique first. You should feel worked, not overwhelmed.</li>
  <li><strong>Use a consistent grip</strong>: Find a grip that feels stable and repeat it.</li>
  <li><strong>Keep your feet planted</strong>: Your legs help you create tension through your whole body.</li>
  <li><strong>Train with a rep target</strong>: Example: “I will hit 3 sets of 10 with good form.”</li>
  <li><strong>Track your best sets</strong>: Progress is easier when you know what you lifted last week.</li>
</ul>

<h2>Conclusion</h2>
<p>The bench press helps you achieve more than a stronger chest. It builds pressing strength, trains key upper-body muscles, and can support better posture when you set up correctly. By avoiding common mistakes and following a simple beginner progression, you can make steady improvements for months—not just days.</p>
<p>If you’re new to lifting, focus on consistent practice, controlled technique, and small, reliable progress. That’s how beginners build real strength.</p>',
  '2025-01-15'
WHERE NOT EXISTS (
  SELECT 1 FROM blogs WHERE slug = 'what-bench-press-helps-you-achieve'
);

-- BLOG 2
INSERT INTO blogs (title, slug, category, image, author, content, created_at)
SELECT
  '5 Ways to Build a Lean Back for Beginners',
  '5-ways-to-build-a-lean-back-for-beginners',
  'Workout Guides',
  'blogimg2.jpeg',
  'ShuzhFit',
  '<h2>Introduction</h2>
<p>A “lean back” is not only about looks—it’s about strength, stability, and posture. Your back muscles support good shoulder position, help you stand taller, and make your training safer and more effective. If you are a beginner, you don’t need complicated workouts. You need the right movements, progressive effort, and recovery.</p>
<p>In this guide, we’ll cover <strong>5 beginner-friendly ways</strong> to build a lean back. You’ll learn what to do, why it matters, and how to avoid common mistakes that slow down progress.</p>

<h2>1) Pull-Ups / Assisted Pull-Ups</h2>
<p>Pull-ups are one of the best exercises for building back thickness and strength. If you can’t do a full pull-up yet, assisted pull-ups (machine assist, band assist, or partner assistance) still give you the benefits.</p>
<ul>
  <li><strong>Beginner goal:</strong> start with sets of 3–6 assisted reps.</li>
  <li><strong>Technique cue:</strong> think “pull elbows down and back.”</li>
  <li><strong>Progress:</strong> reduce assistance over time or add reps.</li>
</ul>

<h2>2) Lat Pulldowns</h2>
<p>Lat pulldowns are a practical alternative for beginners. They help you practice the pulling pattern and target your lats (latissimus dorsi).</p>
<ul>
  <li><strong>Beginner setup:</strong> choose a weight you can control for full range of motion.</li>
  <li><strong>Technique cue:</strong> keep chest up and avoid shrugging.</li>
  <li><strong>Progress:</strong> add reps first, then increase weight slowly.</li>
</ul>

<h2>3) Row Variations</h2>
<p>Rows build the mid-back and improve posture. They also help your pulling strength because they train muscles that work alongside your lats.</p>
<p>Great beginner row options include:</p>
<ul>
  <li><strong>Seated cable rows</strong></li>
  <li><strong>Dumbbell rows</strong></li>
  <li><strong>Chest-supported rows</strong></li>
</ul>
<p>Pick one variation to start. Focus on a smooth pull, a controlled return, and good posture throughout.</p>

<h2>4) Progressive Overload (The Missing Ingredient)</h2>
<p>Even the best exercises will not change your body if your training stays the same. Progressive overload simply means gradually making your workouts a little harder.</p>
<p>Easy ways to apply overload:</p>
<ul>
  <li><strong>Add 1–2 reps</strong> to your set each week while keeping form clean.</li>
  <li><strong>Add a small amount of weight</strong> once you hit your rep target.</li>
  <li><strong>Improve form and control</strong> before you add intensity.</li>
</ul>
<p><em>Beginner reminder:</em> Progress should feel challenging but not chaotic. Leave 1–2 reps “in reserve” when you can.</p>

<h2>5) Nutrition and Recovery</h2>
<p>If you want a leaner, stronger back, you need both training and nutrition. Back growth and posture improvements are supported by:</p>
<ul>
  <li><strong>A protein-rich diet</strong> to support muscle repair</li>
  <li><strong>Enough calories</strong> (or a gentle surplus if you aim for lean muscle)</li>
  <li><strong>Sleep and stress management</strong> so your body recovers</li>
  <li><strong>Consistency</strong>—you don’t build a strong back in one week</li>
</ul>
<p>A simple beginner nutrition approach: include protein in each meal, eat vegetables for micronutrients, and stay hydrated. If fat loss is your goal, aim for slow and sustainable changes.</p>

<h2>Beginner Mistakes to Avoid</h2>
<ul>
  <li><strong>Using too much weight</strong>: It turns rows into jerking and makes your technique sloppy.</li>
  <li><strong>Pulling with the arms only</strong>: For many beginners, the cue “elbows lead” helps improve back targeting.</li>
  <li><strong>Ignoring range of motion</strong>: Short reps don’t fully stimulate the muscles.</li>
  <li><strong>Not tracking progress</strong>: If you don’t know what you did last time, you can’t progressively overload.</li>
  <li><strong>Skipping recovery</strong>: Training hard without sleep makes you stall.</li>
</ul>

<h2>Conclusion</h2>
<p>Building a lean back for beginners comes down to five key actions: pull-up practice, lat pulldowns, rows, progressive overload, and good nutrition/recovery. Keep your workouts consistent, progress slowly and safely, and focus on feeling your back doing the work.</p>
<p>Over time, you’ll develop better posture, stronger pulling muscles, and a more athletic physique that supports every other movement in the gym.</p>',
  '2025-01-20'
WHERE NOT EXISTS (
  SELECT 1 FROM blogs WHERE slug = '5-ways-to-build-a-lean-back-for-beginners'
);

-- Add/ensure a YouTube video row so blog.php shows the CTA card.
-- This project expects a `videos` table row. If you already have rows, this will add one more.
INSERT INTO videos (title, youtube_url, exercise_id, created_at)
SELECT
  'Beginner Back Workout',
  'https://youtube.com/@shuzhfit',
  NULL,
  '2025-01-25'
WHERE NOT EXISTS (
  SELECT 1 FROM videos WHERE youtube_url = 'https://youtube.com/@shuzhfit'
);

