<?php

declare(strict_types=1);

// =====================
// ShuzhFit - PUBLIC HOMEPAGE (gateway)
//
// Deliberately minimal — the homepage is a gateway, not the whole site:
//   1. Navigation (includes/home_header.php)
//   2. Hero — what ShuzhFit is
//   3. ONE daily motivation card
//   4. THREE main destinations (Workouts / Knowledge / Nutrition)
//   5. ONE featured video from the DB (clean placeholder when none)
//   6. Small footer (includes/home_footer.php)
//
// Blogs, the full exercise library and the video list live on their own
// pages (/blog, /exercises, /search). This page only links to them.
// =====================

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/seo.php';
require_once __DIR__ . '/lib/youtube.php';

// =====================
// ONE featured video (the latest). Table empty -> clean placeholder.
// Same query pattern the homepage always used, now LIMIT 1.
// =====================
$featuredVideo = db_fetch_one(
    'SELECT v.id, v.title, v.youtube_url, v.created_at, e.name AS exercise_name
     FROM videos v
     LEFT JOIN exercises e ON e.id = v.exercise_id
     ORDER BY v.created_at DESC
     LIMIT 1'
);

$videoId = ($featuredVideo && !empty($featuredVideo['youtube_url']))
    ? youtube_extract_id((string)$featuredVideo['youtube_url'])
    : null;

// =====================
// Daily motivation (same quotes the homepage always used)
// =====================
$quotes = [
    'You don’t need to be perfect. Just keep showing up.',
    'Consistency is the quiet power behind every transformation.',
    'Small steps every day build the biggest results over time.',
    'Your future self is watching your choices right now.',
    'Discipline beats motivation when motivation disappears.',
    'Train smart. Recover well. Repeat with patience.',
];

$quote = $quotes[array_rand($quotes)];

$pageTitle = 'ShuzhFit - Fitness Motivation & Knowledge';
$desc = 'Simple fitness knowledge, workouts and motivation for people building a better version of themselves.';

?>

<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#070708" />

    <?php render_seo_tags($pageTitle, $desc, '/'); ?>

    <link rel="stylesheet" href="css/style.css" />
    <link rel="stylesheet" href="css/home.css" />
</head>

<body>
    <?php require __DIR__ . '/includes/home_header.php'; ?>

    <main class="home">

        <!-- SECTION 2: HERO -->
        <section class="home-hero">
            <div class="container">
                <span class="kicker">Fitness • Knowledge • Motivation</span>
                <h1>Train Smart.<br /><span class="home-accent">Stay Consistent.</span></h1>
                <p class="home-hero-sub">
                    Simple fitness knowledge, workouts and motivation for people building
                    a better version of themselves.
                </p>

                <div class="btn-row">
                    <a class="btn btn-primary btn-lg" href="exercises.php">Explore Workouts</a>
                    <a class="btn btn-lg home-btn-ghost" href="knowledge.php">Learn the Basics</a>
                </div>
            </div>
        </section>

        <!-- SECTION 3: DAILY MOTIVATION (exactly one card) -->
        <section class="home-section" id="motivation" aria-label="Daily motivation">
            <div class="container">
                <div class="home-quote">
                    <span class="home-quote-label">Daily Motivation</span>
                    <p class="home-quote-text"
                       data-quote-text
                       data-quotes="<?= e(json_encode($quotes, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT)) ?>">
                        <?= e($quote) ?>
                    </p>
                    <?php if (count($quotes) > 1): ?>
                        <a class="btn btn-sm" href="index.php#motivation" data-new-quote>New Quote</a>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <!-- SECTION 4: THREE MAIN DESTINATIONS -->
        <section class="home-section" aria-label="Explore ShuzhFit">
            <div class="container">
                <div class="home-dest-grid">
                    <article class="dest-card">
                        <h2>Workouts</h2>
                        <p>Exercise guides, workout ideas and training basics.</p>
                        <a class="dest-link" href="exercises.php">Explore Workouts</a>
                    </article>

                    <article class="dest-card">
                        <h2>Knowledge</h2>
                        <p>Learn the basics of training, recovery and fitness.</p>
                        <a class="dest-link" href="knowledge.php">Learn More</a>
                    </article>

                    <article class="dest-card">
                        <h2>Nutrition</h2>
                        <p>Simple nutrition information for everyday fitness.</p>
                        <a class="dest-link" href="nutrition.php">Explore Nutrition</a>
                    </article>
                </div>
            </div>
        </section>

        <!-- SECTION 5: ONE FEATURED VIDEO -->
        <section class="home-section" aria-label="From ShuzhFit">
            <div class="container">
                <div class="section-title">
                    <h2>From ShuzhFit</h2>
                </div>

                <?php if ($featuredVideo && $videoId): ?>
                    <?php $videoTitle = (string)$featuredVideo['title']; ?>
                    <article class="home-video">
                        <div class="home-video-cover" data-video-cover>
                            <img
                                src="https://i.ytimg.com/vi/<?= e($videoId) ?>/hqdefault.jpg"
                                alt="<?= e($videoTitle) ?> — YouTube thumbnail"
                                loading="lazy"
                                width="480"
                                height="360" />
                            <button
                                class="video-play"
                                type="button"
                                data-video-embed="<?= e('https://www.youtube.com/embed/' . $videoId) ?>"
                                data-video-title="<?= e($videoTitle) ?>"
                                aria-label="Play video: <?= e($videoTitle) ?>">
                                <span class="play-circle" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" width="26" height="26" fill="#fff"><path d="M8 5.5v13l11-6.5z" /></svg>
                                </span>
                            </button>
                        </div>

                        <div class="home-video-info">
                            <span class="home-video-label">Latest video</span>
                            <h3><?= e($videoTitle) ?></h3>
                            <?php if (!empty($featuredVideo['exercise_name'])): ?>
                                <p class="muted"><?= e((string)$featuredVideo['exercise_name']) ?></p>
                            <?php endif; ?>
                            <a class="btn" href="<?= e((string)$featuredVideo['youtube_url']) ?>" target="_blank" rel="noopener noreferrer">
                                Watch on YouTube
                            </a>
                        </div>
                    </article>
                <?php else: ?>
                    <div class="home-video-empty">
                        <h3>New videos are on the way</h3>
                        <p class="muted">Workout form guides and Shorts will show up here.</p>
                        <a class="btn" href="https://youtube.com/@shuzhfit?si=BCCs-y45wU_VSNKs" target="_blank" rel="noopener noreferrer">
                            Visit the YouTube channel
                        </a>
                    </div>
                <?php endif; ?>
            </div>
        </section>

    </main>

    <?php require __DIR__ . '/includes/home_footer.php'; ?>
</body>

</html>
