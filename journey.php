<?php
// ShuzhFit - Personal Fitness Journey timeline (/journey)


//require __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/seo.php';

$pageTitle = 'My Journey | ShuzhFit';
$desc = 'A beginner-friendly fitness journey timeline.';

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/journey'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>
    <?php require __DIR__ . '/includes/header.php'; ?>

    <main class="container page">
        <div class="section-title">
            <h2>My Journey</h2>
            <span>A timeline you can relate to</span>
        </div>

        <section class="timeline" aria-label="Fitness journey timeline">
            <div class="timeline-item">
                <div class="timeline-dot" aria-hidden="true"></div>
                <div class="timeline-content">
                    <h3>First Gym Day</h3>
                    <p>Showed up even though I was nervous. Learned how to move with control and not rush.</p>
                    <div class="timeline-image">📍</div>
                </div>
            </div>

            <div class="timeline-item">
                <div class="timeline-dot" aria-hidden="true"></div>
                <div class="timeline-content">
                    <h3>Started Creatine</h3>
                    <p>Added creatine to my routine and stayed consistent with hydration and training.</p>
                    <div class="timeline-image">💧</div>
                </div>
            </div>

            <div class="timeline-item">
                <div class="timeline-dot" aria-hidden="true"></div>
                <div class="timeline-content">
                    <h3>Completed First Month</h3>
                    <p>Made it through the hardest part: the early days. Progress started to feel normal.</p>
                    <div class="timeline-image">🏁</div>
                </div>
            </div>

            <div class="timeline-item">
                <div class="timeline-dot" aria-hidden="true"></div>
                <div class="timeline-content">
                    <h3>Built Consistency</h3>
                    <p>Missed days became shorter. I learned to restart fast instead of quitting.</p>
                    <div class="timeline-image">🔁</div>
                </div>
            </div>

            <div class="timeline-item">
                <div class="timeline-dot" aria-hidden="true"></div>
                <div class="timeline-content">
                    <h3>Started ShuzhFit</h3>
                    <p>Turned my learning into a beginner-friendly space: workouts, nutrition, motivation, and guides.</p>
                    <div class="timeline-image">🚀</div>
                </div>
            </div>
        </section>

        <section style="margin-top:24px;">
            <div class="quote">
                <p>“Small steps today become strength tomorrow.”</p>
                <small>— ShuzhFit</small>
            </div>
        </section>

    </main>

    <?php require __DIR__ . '/includes/footer.php'; ?>

</body>

</html>