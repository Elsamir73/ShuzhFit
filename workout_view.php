<?php

// ShuzhFit - Workout summary (/workout_view?id=...)

declare(strict_types=1);

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/insights.php';
require_once __DIR__ . '/lib/seo.php';

$user = require_login();
$userId = (int)$user['id'];

$id = (int)($_GET['id'] ?? 0);
$workout = db_fetch_one(
    "SELECT * FROM workouts WHERE id = :id AND user_id = :uid AND status = 'finished' LIMIT 1",
    [':id' => $id, ':uid' => $userId]
);

if (!$workout) {
    http_response_code(404);
    $pageTitle = 'Workout Not Found | ShuzhFit';
    $desc = 'Workout not found.';
} else {
    $pageTitle = ((string)$workout['name']) . ' Summary | ShuzhFit';
    $desc = 'Workout summary.';
}

$sets = $workout ? db_fetch_all(
    'SELECT id, exercise_id, exercise_name, set_number, weight_kg, reps
     FROM workout_sets WHERE workout_id = :wid ORDER BY id ASC',
    [':wid' => (int)$workout['id']]
) : [];

// Group in insertion order
$grouped = [];
foreach ($sets as $s) {
    $key = strtolower((string)$s['exercise_name']);
    $grouped[$key]['name'] = (string)$s['exercise_name'];
    $grouped[$key]['exercise_id'] = $s['exercise_id'] !== null ? (int)$s['exercise_id'] : null;
    if ((int)$s['set_number'] > 0) {
        $grouped[$key]['sets'][] = $s;
    }
}

// PR detection: is the best e1RM in this workout the user's all-time best?
$prs = [];
if ($workout) {
    foreach ($grouped as $g) {
        if (empty($g['sets'])) {
            continue;
        }
        $bestSetE1rm = 0.0;
        foreach ($g['sets'] as $s) {
            $e = estimate_1rm($s['weight_kg'] !== null ? (float)$s['weight_kg'] : null, $s['reps'] !== null ? (int)$s['reps'] : null);
            if ($e !== null && $e > $bestSetE1rm) {
                $bestSetE1rm = $e;
            }
        }
        if ($bestSetE1rm > 0) {
            $allTime = best_e1rm($userId, $g['exercise_id'], $g['name']);
            if ($allTime !== null && $bestSetE1rm >= $allTime) {
                $prs[] = ['name' => $g['name'], 'e1rm' => $allTime];
            }
        }
    }
}

$totalVolume = 0.0;
$totalSets = 0;
foreach ($sets as $s) {
    if ((int)$s['set_number'] > 0) {
        $totalSets++;
        $totalVolume += (float)$s['weight_kg'] * (int)$s['reps'];
    }
}

$flash = flash_get();
$durationMin = $workout ? max(1, (int)round(((int)$workout['duration_seconds']) / 60)) : 0;
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/workout-view'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>
<body>
    <?php require __DIR__ . '/includes/header.php'; ?>
    <main class="container page">
        <?php if ($flash): ?>
            <div class="notice <?= e($flash['type'] === 'ok' ? 'ok' : 'err') ?>"><?= e($flash['message']) ?></div>
        <?php endif; ?>

        <?php if (!$workout): ?>
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Workout not found</h3>
                <p>This workout doesn't exist or belongs to another account.</p>
                <a class="btn btn-primary" href="workout_history.php">Back to history</a>
            </div>
        <?php else: ?>
            <section class="section-title" style="margin-top:0;">
                <h2><?= e((string)$workout['name']) ?></h2>
                <span><?= e((string)$workout['workout_date']) ?> · done</span>
            </section>

            <?php if ($prs): ?>
                <div class="pr-banner">
                    <?php foreach ($prs as $pr): ?>
                        <div class="pr-item">🏆 <strong><?= e($pr['name']) ?></strong> — best estimated 1RM: <?= e((string)$pr['e1rm']) ?> kg</div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <div class="workout-stats">
                <div class="stat"><span class="stat-value"><?= $totalSets ?></span><span class="stat-label">sets</span></div>
                <div class="stat"><span class="stat-value"><?= number_format($totalVolume, 0) ?></span><span class="stat-label">kg lifted</span></div>
                <div class="stat"><span class="stat-value"><?= $durationMin ?></span><span class="stat-label">minutes</span></div>
                <div class="stat"><span class="stat-value"><?= count($grouped) ?></span><span class="stat-label">exercises</span></div>
            </div>

            <?php foreach ($grouped as $g): ?>
                <div class="exercise-log-card">
                    <div class="elc-head">
                        <h3><?= e($g['name']) ?></h3>
                        <?php if (!empty($g['sets'])): ?>
                            <?php
                            $best = 0.0;
                            foreach ($g['sets'] as $s) {
                                if ($s['weight_kg'] !== null && (float)$s['weight_kg'] > $best) {
                                    $best = (float)$s['weight_kg'];
                                }
                            }
                            ?>
                            <span class="muted">best: <?= e(rtrim(rtrim((string)$best, '0'), '.')) ?> kg</span>
                        <?php endif; ?>
                    </div>
                    <div class="memory-sets">
                        <?php foreach ($g['sets'] as $s): ?>
                            <span class="set-pill">
                                <?= $s['weight_kg'] !== null ? e(rtrim(rtrim((string)$s['weight_kg'], '0'), '.') . ' kg') : 'BW' ?> × <?= (int)$s['reps'] ?>
                            </span>
                        <?php endforeach; ?>
                        <?php if (empty($g['sets'])): ?>
                            <span class="muted">No sets logged.</span>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>

            <?php if (!empty($workout['notes'])): ?>
                <div class="card" style="padding:18px;">
                    <h3>Notes</h3>
                    <p class="muted"><?= e((string)$workout['notes']) ?></p>
                </div>
            <?php endif; ?>

            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
                <a class="btn btn-primary" href="workout.php">Start Next Workout</a>
                <a class="btn" href="workout_history.php">← History</a>
                <a class="btn" href="progress.php">View Progress</a>
            </div>
        <?php endif; ?>
    </main>
    <?php require __DIR__ . '/includes/footer.php'; ?>
    <script src="js/script.js"></script>
</body>
</html>
