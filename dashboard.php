<?php

// ShuzhFit - Dashboard: "What matters to me today?"

declare(strict_types=1);

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/insights.php';
require_once __DIR__ . '/lib/seo.php';

$user = require_login();
$userId = (int)$user['id'];

$notice = null;
$error = null;

// ---------- quick workout log (cardio / walks / simple sessions) ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_workout'])) {
    if (!csrf_check()) {
        $error = 'Your session expired. Please try again.';
    } else {
        $date = trim((string)($_POST['date'] ?? date('Y-m-d')));
        $workoutType = mb_substr(trim((string)($_POST['workout_type'] ?? '')), 0, 120);
        $duration = (int)($_POST['duration_minutes'] ?? 0);
        $exercise = mb_substr(trim((string)($_POST['exercise'] ?? '')), 0, 200);
        $notes = mb_substr(trim((string)($_POST['notes'] ?? '')), 0, 1000);

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || $workoutType === '' || $duration <= 0 || $duration > 600) {
            $error = 'Please enter a date, workout type, and a valid duration.';
        } else {
            try {
                db_exec(
                    'INSERT INTO workout_logs (user_id, user_session_id, log_date, workout_type, duration_minutes, exercise, notes)
                     VALUES (:uid, :sid, :d, :wt, :dur, :ex, :n)',
                    [':uid' => $userId, ':sid' => 'user-' . $userId, ':d' => $date, ':wt' => $workoutType,
                     ':dur' => $duration, ':ex' => $exercise !== '' ? $exercise : null, ':n' => $notes !== '' ? $notes : null]
                );
                flash_set('ok', 'Workout saved.');
            } catch (Throwable $e) {
                $error = 'Could not save the workout. Please try again.';
            }
            header('Location: dashboard.php');
            exit;
        }
    }
}

// ---------- quick measurement ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_progress'])) {
    if (!csrf_check()) {
        $error = 'Your session expired. Please try again.';
    } else {
        $date = (string)($_POST['progress_date'] ?? date('Y-m-d'));
        $weight = isset($_POST['weight_kg']) && $_POST['weight_kg'] !== '' ? (float)$_POST['weight_kg'] : null;
        $waist = isset($_POST['waist_cm']) && $_POST['waist_cm'] !== '' ? (float)$_POST['waist_cm'] : null;
        $goalText = mb_substr(trim((string)($_POST['goal'] ?? '')), 0, 255);

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || $weight === null || $weight <= 0 || $weight > 500) {
            $error = 'Please enter a valid weight.';
        } else {
            db_exec(
                'INSERT INTO progress_entries (user_id, user_session_id, log_date, weight_kg, waist_cm, goal)
                 VALUES (:uid, :sid, :d, :w, :wa, :g)',
                [':uid' => $userId, ':sid' => 'user-' . $userId, ':d' => $date,
                 ':w' => round($weight, 1), ':wa' => ($waist !== null && $waist > 0) ? round($waist, 1) : null,
                 ':g' => $goalText !== '' ? $goalText : null]
            );
            flash_set('ok', 'Progress updated.');
            header('Location: dashboard.php');
            exit;
        }
    }
}

// ---------- "what matters today" ----------
$streak = training_streak($userId);
$week = workouts_this_week($userId);
$insights = training_insights($userId);
$goals = goals_with_progress($userId);
$target = max(1, (int)($user['weekly_workout_target'] ?? 3));

$activeWorkout = db_fetch_one(
    "SELECT id, name, started_at FROM workouts WHERE user_id = :uid AND status = 'in_progress' ORDER BY id DESC LIMIT 1",
    [':uid' => $userId]
);

$trainedToday = (int)db_fetch_one(
    "SELECT COUNT(*) AS c FROM (
        SELECT workout_date AS d FROM workouts WHERE user_id = :uid1 AND status = 'finished'
        UNION ALL
        SELECT log_date AS d FROM workout_logs WHERE user_id = :uid2
    ) x WHERE d = CURDATE()",
    [':uid1' => $userId, ':uid2' => $userId]
)['c'];

$lastWorkout = db_fetch_one(
    "SELECT id, name, workout_date FROM workouts WHERE user_id = :uid AND status = 'finished' ORDER BY workout_date DESC, id DESC LIMIT 1",
    [':uid' => $userId]
);

$topRecords = array_slice(personal_records($userId, 3), 0, 3);
$latestMeasurement = db_fetch_one(
    'SELECT log_date, weight_kg, waist_cm FROM progress_entries WHERE user_id = :uid ORDER BY log_date DESC, id DESC LIMIT 1',
    [':uid' => $userId]
);
$recentQuickLogs = db_fetch_all(
    'SELECT log_date, workout_type, duration_minutes FROM workout_logs WHERE user_id = :uid ORDER BY log_date DESC, id DESC LIMIT 3',
    [':uid' => $userId]
);

$flash = flash_get();
$hour = (int)date('G');
$greeting = $hour < 12 ? 'Good morning' : ($hour < 18 ? 'Good afternoon' : 'Good evening');

$pageTitle = 'Dashboard | ShuzhFit';
$desc = 'Your training focus, streak, goals, and next step.';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/dashboard'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>
<body>
    <?php require __DIR__ . '/includes/header.php'; ?>
    <main class="container page">
        <?php if ($flash): ?>
            <div class="notice <?= e($flash['type'] === 'ok' ? 'ok' : 'err') ?>"><?= e($flash['message']) ?></div>
        <?php endif; ?>
        <?php if ($notice): ?><div class="notice ok"><?= e($notice) ?></div><?php endif; ?>
        <?php if ($error): ?><div class="notice err"><?= e($error) ?></div><?php endif; ?>

        <section class="dash-greeting">
            <h2><?= e($greeting) ?>, <?= e((string)$user['name']) ?></h2>
            <span><?= e(date('l, j M Y')) ?></span>
        </section>

        <!-- TODAY'S FOCUS -->
        <div class="focus-card">
            <?php if ($activeWorkout): ?>
                <div class="focus-kicker">Workout in progress</div>
                <div class="focus-title"><?= e((string)$activeWorkout['name']) ?></div>
                <div class="focus-meta">Started <?= e(date('H:i', strtotime((string)$activeWorkout['started_at']))) ?> · picks up right where you left off</div>
                <a class="btn btn-primary btn-lg" href="workout.php">Resume Workout →</a>
            <?php elseif ($trainedToday > 0): ?>
                <div class="focus-kicker">Today's focus</div>
                <div class="focus-title">Recovery day</div>
                <div class="focus-meta">You already trained today. Walk, stretch, eat protein, and protect your streak tomorrow.</div>
                <div class="btn-row">
                    <a class="btn" href="nutrition_log.php">Log Food</a>
                    <a class="btn" href="workout.php">Train Again Anyway</a>
                </div>
            <?php elseif ($lastWorkout): ?>
                <div class="focus-kicker">Today's focus</div>
                <div class="focus-title">Train: <?= e((string)$lastWorkout['name']) ?></div>
                <div class="focus-meta">Last session <?= e((string)$lastWorkout['workout_date']) ?> — your exercise memory is ready with targets.</div>
                <a class="btn btn-primary btn-lg" href="workout.php">Start Workout →</a>
            <?php else: ?>
                <div class="focus-kicker">Welcome to your journey</div>
                <div class="focus-title">Start your first workout</div>
                <div class="focus-meta">Two minutes to set up. Every set you log builds your streak, records, and recommendations.</div>
                <a class="btn btn-primary btn-lg" href="workout.php">Start Workout →</a>
            <?php endif; ?>

            <?php if ($goals): ?>
                <div class="focus-goal">
                    <div class="focus-goal-head">
                        <span><?= e($goals[0]['title']) ?></span>
                        <span class="muted"><?= $goals[0]['current'] !== null ? e((string)round((float)$goals[0]['current'], 1)) : '—' ?><?= e($goals[0]['unit']) ?> / <?= e((string)round($goals[0]['target'], 1)) ?><?= e($goals[0]['unit']) ?></span>
                    </div>
                    <div class="progress"><div class="progress-fill<?= $goals[0]['pct'] >= 100 ? ' complete' : '' ?>" style="width: <?= $goals[0]['pct'] ?>%;"></div></div>
                </div>
            <?php else: ?>
                <div class="focus-goal focus-goal-empty">
                    <span class="muted">No goal set yet — <a href="profile.php">set one</a> to give every week a target.</span>
                </div>
            <?php endif; ?>
        </div>

        <!-- STATS STRIP -->
        <div class="workout-stats">
            <div class="stat"><span class="stat-value">🔥 <?= $streak ?></span><span class="stat-label">day streak</span></div>
            <div class="stat"><span class="stat-value"><?= $week['count'] ?>/<?= $target ?></span><span class="stat-label">this week</span></div>
            <div class="stat"><span class="stat-value"><?= (int)$week['minutes'] ?></span><span class="stat-label">min trained</span></div>
            <div class="stat"><span class="stat-value"><?= $latestMeasurement ? e((string)round((float)$latestMeasurement['weight_kg'], 1)) : '—' ?></span><span class="stat-label">kg <?= $latestMeasurement ? '· ' . e((string)$latestMeasurement['log_date']) : 'no data' ?></span></div>
        </div>

        <!-- INSIGHTS -->
        <?php if ($insights): ?>
            <section class="section-title">
                <h2>Your insights</h2>
                <span>From your own training data</span>
            </section>
            <div class="insight-list">
                <?php foreach ($insights as $insight): ?>
                    <div class="insight-item">💡 <?= e($insight) ?></div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <!-- QUICK ACTIONS -->
        <section class="section-title">
            <h2>Quick actions</h2>
            <span>The things you do most</span>
        </section>
        <div class="quick-actions">
            <a class="quick-action" href="workout.php"><span class="qa-icon">🏋️</span>Start Workout</a>
            <a class="quick-action" href="nutrition_log.php"><span class="qa-icon">🍽️</span>Log Food</a>
            <a class="quick-action" href="progress.php"><span class="qa-icon">⚖️</span>Log Weight</a>
            <a class="quick-action" href="workout_history.php"><span class="qa-icon">📋</span>History</a>
        </div>

        <div class="grid" style="grid-template-columns:repeat(2,1fr);">
            <div class="form-card">
                <h3>Quick log · workout</h3>
                <p class="muted" style="font-size:13px;">For cardio, walks, or simple sessions. For gym sets, use the live tracker.</p>
                <form method="post" action="dashboard.php">
                    <?= csrf_field() ?>
                    <div class="grid" style="grid-template-columns:repeat(2,1fr); margin-top:0;">
                        <div>
                            <label for="date">Date</label>
                            <input id="date" name="date" type="date" value="<?= e(date('Y-m-d')) ?>" required />
                        </div>
                        <div>
                            <label for="duration_minutes">Minutes</label>
                            <input id="duration_minutes" name="duration_minutes" type="number" min="1" max="600" placeholder="30" required />
                        </div>
                    </div>
                    <label for="workout_type">Type</label>
                    <input id="workout_type" name="workout_type" type="text" maxlength="120" placeholder="Push Day, Legs, Walk..." required />
                    <label for="exercise">Main exercise (optional)</label>
                    <input id="exercise" name="exercise" type="text" maxlength="200" placeholder="Bench Press, Squat, Run" />
                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit" name="save_workout" value="1">Save Workout</button>
                    </div>
                </form>
            </div>

            <div class="form-card">
                <h3>Quick log · measurement</h3>
                <form method="post" action="dashboard.php">
                    <?= csrf_field() ?>
                    <div class="grid" style="grid-template-columns:repeat(2,1fr); margin-top:0;">
                        <div>
                            <label for="progress_date">Date</label>
                            <input id="progress_date" name="progress_date" type="date" value="<?= e(date('Y-m-d')) ?>" required />
                        </div>
                        <div>
                            <label for="weight_kg">Weight (kg)</label>
                            <input id="weight_kg" name="weight_kg" type="number" step="0.1" min="20" max="500" value="<?= $latestMeasurement ? e((string)round((float)$latestMeasurement['weight_kg'], 1)) : '' ?>" required />
                        </div>
                    </div>
                    <div class="grid" style="grid-template-columns:repeat(2,1fr); margin-top:0;">
                        <div>
                            <label for="waist_cm">Waist (cm)</label>
                            <input id="waist_cm" name="waist_cm" type="number" step="0.1" min="30" max="300" />
                        </div>
                        <div>
                            <label for="goal">Goal note</label>
                            <input id="goal" name="goal" type="text" maxlength="255" placeholder="e.g., 75 kg by December" />
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit" name="save_progress" value="1">Save Measurement</button>
                        <a class="btn" href="progress.php">Full progress</a>
                    </div>
                </form>
            </div>
        </div>

        <!-- RECENT ACTIVITY -->
        <section class="section-title">
            <h2>Recent activity</h2>
            <span>Your last sessions</span>
        </section>
        <?php if ($lastWorkout || $recentQuickLogs): ?>
            <div class="history-list">
                <?php if ($lastWorkout): ?>
                    <div class="history-row">
                        <div class="history-main">
                            <a class="history-title" href="workout_view.php?id=<?= (int)$lastWorkout['id'] ?>"><?= e((string)$lastWorkout['name']) ?></a>
                            <div class="muted"><?= e((string)$lastWorkout['workout_date']) ?> · structured session</div>
                        </div>
                        <a class="btn btn-sm" href="workout_view.php?id=<?= (int)$lastWorkout['id'] ?>">View</a>
                    </div>
                <?php endif; ?>
                <?php foreach ($recentQuickLogs as $q): ?>
                    <div class="history-row">
                        <div class="history-main">
                            <strong class="history-title"><?= e((string)$q['workout_type']) ?></strong>
                            <div class="muted"><?= e((string)$q['log_date']) ?> · <?= (int)$q['duration_minutes'] ?> min</div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <div class="empty-state">
                <div class="empty-icon">🗓️</div>
                <h3>No sessions yet</h3>
                <p>Your workouts will appear here. Start with a short session today.</p>
                <a class="btn btn-primary" href="workout.php">Start your first workout</a>
            </div>
        <?php endif; ?>

        <?php if ($topRecords): ?>
            <section class="section-title">
                <h2>Recent achievements</h2>
                <span>Top estimated strength</span>
            </section>
            <div class="pr-banner">
                <?php foreach ($topRecords as $r): ?>
                    <div class="pr-item">🏆 <strong><?= e((string)$r['exercise_name']) ?></strong> — <?= e((string)$r['best_weight']) ?> kg × <?= (int)$r['best_reps'] ?> (e1RM <?= e((string)$r['e1rm']) ?> kg)</div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </main>
    <?php require __DIR__ . '/includes/footer.php'; ?>
    <script src="js/script.js"></script>
</body>
</html>
