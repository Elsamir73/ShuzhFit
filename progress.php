<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/insights.php';
require_once __DIR__ . '/lib/seo.php';

$user = require_login();
$userId = (int)$user['id'];
$week = workouts_this_week($userId);
$streak = training_streak($userId);
$insights = training_insights($userId);
$records = personal_records($userId, 8);
$measurements = db_fetch_all(
    'SELECT log_date, weight_kg, waist_cm FROM progress_entries WHERE user_id = :uid ORDER BY log_date DESC, id DESC LIMIT 12',
    [':uid' => $userId]
);
$weekly = weekly_workout_counts($userId, 8);
$pageTitle = 'Progress | ShuzhFit';
$desc = 'Review training consistency, strength records, and body measurements.';
?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/progress'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>

<body>
    <?php require __DIR__ . '/includes/header.php'; ?>
    <main class="container page">
        <section class="section-title" style="margin-top:0;">
            <h2>Progress</h2><span>Your real training history</span>
        </section>
        <div class="grid" style="grid-template-columns:repeat(3,1fr);">
            <div class="card">
                <h3>This week</h3>
                <p class="stat-value"><?= (int)$week['count'] ?></p><span class="muted">of <?= (int)($user['weekly_workout_target'] ?? 3) ?> workouts</span>
            </div>
            <div class="card">
                <h3>Current streak</h3>
                <p class="stat-value"><?= $streak ?></p><span class="muted">consecutive days</span>
            </div>
            <div class="card">
                <h3>Weekly history</h3>
                <p class="stat-value"><?= array_sum(array_column($weekly, 'count')) ?></p><span class="muted">sessions in 8 weeks</span>
            </div>
        </div>

        <?php if ($measurements && count($measurements) >= 2): ?>
            <section class="section-title">
                <h2>Weight trend</h2>
                <span>
                    <?= e((string)round($firstWeight, 1)) ?> kg → <?= e((string)round($lastWeight, 1)) ?> kg
                    (<?= $lastWeight < $firstWeight ? '↓' : ($lastWeight > $firstWeight ? '↑' : '→') ?>
                    <?= e((string)round(abs($lastWeight - $firstWeight), 1)) ?> kg)
                </span>
            </section>
            <div class="card chart-card">
                <?php
                // Inline SVG line chart of body weight over time
                $points = [];
                $n = count($measurements);
                $minW = min(array_map(fn($m) => (float)$m['weight_kg'], $measurements)) - 1;
                $maxW = max(array_map(fn($m) => (float)$m['weight_kg'], $measurements)) + 1;
                if ($maxW - $minW < 2) { $maxW = $minW + 2; }
                foreach ($measurements as $i => $m) {
                    $x = 40 + ($i / max(1, $n - 1)) * 560;
                    $y = 20 + (1 - ((float)$m['weight_kg'] - $minW) / ($maxW - $minW)) * 130;
                    $points[] = [round($x, 1), round($y, 1), (float)$m['weight_kg'], (string)$m['log_date']];
                }
                ?>
                <svg viewBox="0 0 640 180" width="100%" height="auto" role="img" aria-label="Body weight trend chart">
                    <line x1="40" y1="150" x2="620" y2="150" stroke="rgba(255,255,255,0.15)" />
                    <line x1="40" y1="20" x2="40" y2="150" stroke="rgba(255,255,255,0.15)" />
                    <polyline fill="none" stroke="var(--accent)" stroke-width="2.5" points="<?= e(implode(' ', array_map(fn($p) => $p[0] . ',' . $p[1], $points))) ?>" />
                    <?php foreach ($points as $p): ?>
                        <circle cx="<?= $p[0] ?>" cy="<?= $p[1] ?>" r="3.5" fill="var(--accent-2)">
                            <title><?= $p[3] ?>: <?= $p[2] ?> kg</title>
                        </circle>
                    <?php endforeach; ?>
                    <text x="6" y="<?= $points[0][1] + 4 ?>" fill="var(--muted)" font-size="11"><?= e((string)round($maxW - 1, 1)) ?></text>
                    <text x="6" y="154" fill="var(--muted)" font-size="11"><?= e((string)round($minW + 1, 1)) ?></text>
                </svg>
                <div class="muted" style="font-size:12px; margin-top:6px;"><?= e((string)$measurements[0]['log_date']) ?> → <?= e((string)$measurements[$n - 1]['log_date']) ?></div>
            </div>
        <?php endif; ?>

        <?php if ($insights): ?><section class="section-title">
                <h2>What your data says</h2><span>Small signals, useful direction</span>
            </section>
            <div class="card">
                <ul class="list"><?php foreach ($insights as $insight): ?><li><?= e($insight) ?></li><?php endforeach; ?></ul>
            </div><?php endif; ?>

        <section class="section-title">
            <h2>Consistency</h2><span>Workouts per week (last 12 weeks)</span>
        </section>
        <div class="card chart-card">
            <div class="week-bars week-bars-lg">
                <?php
                $maxCount = max(1, max(array_column($weekly, 'count')));
                foreach ($weekly as $wk):
                    $h = (int)round(((int)$wk['count'] / $maxCount) * 100);
                ?>
                    <div class="week-bar-col">
                        <div class="week-bar" style="height: <?= max(4, $h) ?>px;" title="<?= (int)$wk['count'] ?> workout<?= (int)$wk['count'] === 1 ? '' : 's' ?> (week of <?= e((string)$wk['week_start']) ?>)"></div>
                        <span class="week-bar-label"><?= e(date('d M', strtotime((string)$wk['week_start']))) ?></span>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <section class="section-title">
            <h2>Log a measurement</h2><span>Weight drives your goal progress</span>
        </section>
        <div class="form-wrap" style="margin-bottom:18px;">
            <div class="form-card">
                <?php if (!empty($error)): ?><div class="notice err"><?= e($error) ?></div><?php endif; ?>
                <form method="post" action="progress.php">
                    <?= csrf_field() ?>
                    <input type="hidden" name="action" value="add_measurement" />
                    <div class="grid" style="grid-template-columns:repeat(3,1fr); margin-top:0;">
                        <div>
                            <label for="pdate">Date</label>
                            <input id="pdate" name="log_date" type="date" value="<?= e(date('Y-m-d')) ?>" required />
                        </div>
                        <div>
                            <label for="pweight">Weight (kg)</label>
                            <input id="pweight" name="weight_kg" type="number" step="0.1" min="20" max="500" value="<?= $latest ? e((string)$latest['weight_kg']) : '' ?>" required />
                        </div>
                        <div>
                            <label for="pwaist">Waist (cm, optional)</label>
                            <input id="pwaist" name="waist_cm" type="number" step="0.1" min="30" max="300" />
                        </div>
                    </div>
                    <label for="pnotes">Notes (optional)</label>
                    <textarea id="pnotes" name="notes" rows="2" placeholder="Energy, sleep, how training feels..."></textarea>
                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit">Save Measurement</button>
                    </div>
                </form>
            </div>
        </div>

        <section class="section-title">
            <h2>Personal records</h2><span>Best estimated strength by exercise</span>
        </section>
        <?php if ($records): ?><div class="history-list"><?php foreach ($records as $record): ?><div class="history-row">
                        <div class="history-main"><strong class="history-title"><?= e((string)$record['exercise_name']) ?></strong>
                            <div class="muted">Best set: <?= e((string)$record['best_weight']) ?> kg × <?= (int)$record['best_reps'] ?> · Estimated 1RM: <?= e((string)$record['e1rm']) ?> kg</div>
                        </div><span class="muted"><?= e((string)$record['last_date']) ?></span>
                    </div><?php endforeach; ?></div><?php else: ?><div class="empty-state">
                <h3>No strength records yet</h3>
                <p>Complete a weighted set to start building your records.</p><a class="btn btn-primary" href="workout.php">Start a workout</a>
            </div><?php endif; ?>

        <section class="section-title">
            <h2>Body measurements</h2><span>Latest logged entries</span>
        </section>
        <?php if ($measurements): ?><div class="card">
                <ul class="list"><?php foreach ($measurements as $measurement): ?><li><strong><?= e((string)$measurement['log_date']) ?></strong><span class="muted"> <?= e((string)$measurement['weight_kg']) ?> kg<?php if ($measurement['waist_cm'] !== null): ?> · <?= e((string)$measurement['waist_cm']) ?> cm waist<?php endif; ?></span></li><?php endforeach; ?></ul>
            </div><?php else: ?><div class="empty-state">
                <h3>No measurements yet</h3>
                <p>Log a weight from the dashboard to see your trend here.</p><a class="btn btn-primary" href="dashboard.php">Log progress</a>
            </div><?php endif; ?>
    </main>
    <?php require __DIR__ . '/includes/footer.php'; ?>
</body>

</html>