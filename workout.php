<?php

// ShuzhFit - Live workout logger (/workout)
// Start a session, log sets fast (weight x reps), see your last performance,
// use the rest timer, and finish with a summary.

declare(strict_types=1);

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/insights.php';
require_once __DIR__ . '/lib/seo.php';

$user = require_login();
$userId = (int)$user['id'];

$notice = null;
$error = null;

/** Find the current in-progress workout for this user. */
function active_workout(int $userId): ?array
{
    return db_fetch_one(
        "SELECT * FROM workouts WHERE user_id = :uid AND status = 'in_progress' ORDER BY id DESC LIMIT 1",
        [':uid' => $userId]
    );
}

/** Owner-checked in-progress workout by id. */
function owned_active_workout(int $userId, int $workoutId): ?array
{
    if ($workoutId <= 0) {
        return null;
    }
    return db_fetch_one(
        "SELECT * FROM workouts WHERE id = :wid AND user_id = :uid AND status = 'in_progress' LIMIT 1",
        [':wid' => $workoutId, ':uid' => $userId]
    );
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_check()) {
        $error = 'Your session expired. Please try again.';
    } else {
        $action = (string)($_POST['action'] ?? '');

        if ($action === 'start') {
            $name = mb_substr(trim((string)($_POST['name'] ?? '')) ?: 'Workout', 0, 160);
            if (active_workout($userId)) {
                header('Location: workout.php');
                exit;
            }
            db_exec(
                "INSERT INTO workouts (user_id, name, workout_date, started_at, status)
                 VALUES (:uid, :name, CURDATE(), NOW(), 'in_progress')",
                [':uid' => $userId, ':name' => $name]
            );
            header('Location: workout.php');
            exit;
        }

        if ($action === 'add_exercise') {
            $workout = owned_active_workout($userId, (int)($_POST['workout_id'] ?? 0));
            if ($workout) {
                $exerciseId = (int)($_POST['exercise_id'] ?? 0);
                $freeName = trim((string)($_POST['free_name'] ?? ''));
                $exName = '';
                $exId = null;

                if ($exerciseId > 0) {
                    $ex = db_fetch_one('SELECT id, name FROM exercises WHERE id = :id LIMIT 1', [':id' => $exerciseId]);
                    if ($ex) {
                        $exId = (int)$ex['id'];
                        $exName = (string)$ex['name'];
                    }
                }
                if ($exName === '' && $freeName !== '') {
                    $exName = mb_substr($freeName, 0, 200);
                }

                if ($exName !== '') {
                    $wid = (int)$workout['id'];
                    $already = db_fetch_one(
                        'SELECT id FROM workout_sets WHERE workout_id = :wid
                         ' . ($exId ? 'AND exercise_id = :eid' : 'AND LOWER(exercise_name) = LOWER(:ename)') . ' LIMIT 1',
                        $exId ? [':wid' => $wid, ':eid' => $exId] : [':wid' => $wid, ':ename' => $exName]
                    );
                    if ($already) {
                        $notice = $exName . ' is already in this workout.';
                    } else {
                        // Placeholder row (set_number = 0) keeps the card visible before the first set
                        db_exec(
                            'INSERT INTO workout_sets (workout_id, user_id, exercise_id, exercise_name, set_number, weight_kg, reps)
                             VALUES (:wid, :uid, :eid, :ename, 0, NULL, NULL)',
                            [':wid' => $wid, ':uid' => $userId, ':eid' => $exId, ':ename' => $exName]
                        );
                    }
                } else {
                    $error = 'Pick an exercise from the list or type a name.';
                }
            }
            header('Location: workout.php');
            exit;
        }

        if ($action === 'log_set') {
            $wid = (int)($_POST['workout_id'] ?? 0);
            $workout = owned_active_workout($userId, $wid);
            $exName = trim((string)($_POST['exercise_name'] ?? ''));
            $exId = ($_POST['exercise_id'] ?? '') !== '' ? (int)$_POST['exercise_id'] : null;
            $weightRaw = trim((string)($_POST['weight_kg'] ?? ''));
            $reps = (int)($_POST['reps'] ?? 0);

            if ($workout && $exName !== '') {
                if ($weightRaw !== '' && !is_numeric($weightRaw)) {
                    $error = 'Weight must be a number (or empty for bodyweight).';
                } elseif ($reps <= 0 || $reps > 500) {
                    $error = 'Enter a valid rep count.';
                } else {
                    $weight = $weightRaw === '' ? null : round((float)$weightRaw, 2);
                    if ($weight !== null && ($weight <= 0 || $weight > 1000)) {
                        $error = 'Weight must be between 0 and 1000 kg.';
                    } else {
                        $nextSet = (int)db_fetch_one(
                            'SELECT COALESCE(MAX(set_number), 0) + 1 AS n FROM workout_sets
                             WHERE workout_id = :wid
                             ' . ($exId ? 'AND exercise_id = :eid' : 'AND LOWER(exercise_name) = LOWER(:ename)'),
                            $exId ? [':wid' => $wid, ':eid' => $exId] : [':wid' => $wid, ':ename' => $exName]
                        )['n'];
                        db_exec(
                            'INSERT INTO workout_sets (workout_id, user_id, exercise_id, exercise_name, set_number, weight_kg, reps)
                             VALUES (:wid, :uid, :eid, :ename, :snum, :w, :r)',
                            [':wid' => $wid, ':uid' => $userId, ':eid' => $exId, ':ename' => $exName, ':snum' => $nextSet, ':w' => $weight, ':r' => $reps]
                        );
                        db_exec(
                            'DELETE FROM workout_sets WHERE workout_id = :wid AND set_number = 0
                             ' . ($exId ? 'AND exercise_id = :eid' : 'AND LOWER(exercise_name) = LOWER(:ename)'),
                            $exId ? [':wid' => $wid, ':eid' => $exId] : [':wid' => $wid, ':ename' => $exName]
                        );
                    }
                }
            }
            header('Location: workout.php');
            exit;
        }

        if ($action === 'delete_set') {
            db_exec(
                'DELETE FROM workout_sets WHERE id = :sid AND user_id = :uid',
                [':sid' => (int)($_POST['set_id'] ?? 0), ':uid' => $userId]
            );
            header('Location: workout.php');
            exit;
        }

        if ($action === 'remove_exercise') {
            $workout = owned_active_workout($userId, (int)($_POST['workout_id'] ?? 0));
            $exName = trim((string)($_POST['exercise_name'] ?? ''));
            if ($workout && $exName !== '') {
                db_exec(
                    'DELETE FROM workout_sets WHERE workout_id = :wid AND LOWER(exercise_name) = LOWER(:ename)',
                    [':wid' => (int)$workout['id'], ':ename' => $exName]
                );
            }
            header('Location: workout.php');
            exit;
        }

        if ($action === 'finish') {
            $wid = (int)($_POST['workout_id'] ?? 0);
            $workout = owned_active_workout($userId, $wid);
            if ($workout) {
                $notes = mb_substr(trim((string)($_POST['notes'] ?? '')), 0, 1000);
                $hasSets = (int)db_fetch_one(
                    'SELECT COUNT(*) AS c FROM workout_sets WHERE workout_id = :wid AND set_number > 0',
                    [':wid' => $wid]
                )['c'];
                if ($hasSets === 0) {
                    $error = 'Log at least one set before finishing.';
                } else {
                    db_exec(
                        "UPDATE workouts
                         SET status = 'finished', finished_at = NOW(),
                             duration_seconds = GREATEST(TIMESTAMPDIFF(SECOND, started_at, NOW()), 60),
                             notes = :notes
                         WHERE id = :wid",
                        [':notes' => $notes !== '' ? $notes : null, ':wid' => $wid]
                    );
                    flash_set('ok', 'Workout saved. Great work!');
                    header('Location: workout_view.php?id=' . $wid);
                    exit;
                }
            }
        }

        if ($action === 'discard') {
            $wid = (int)($_POST['workout_id'] ?? 0);
            $workout = owned_active_workout($userId, $wid);
            if ($workout) {
                db_exec('DELETE FROM workouts WHERE id = :wid', [':wid' => $wid]);
                flash_set('ok', 'Workout discarded.');
            }
            header('Location: dashboard.php');
            exit;
        }
    }
}

$workout = active_workout($userId);
$flash = flash_get();

$exercises = db_fetch_all('SELECT id, name, muscles_worked FROM exercises ORDER BY name ASC');

$wExercises = [];
$setsByExercise = [];
$allSets = [];
$totalVolume = 0.0;
$totalSets = 0;

if ($workout) {
    $wid = (int)$workout['id'];
    $wExercises = db_fetch_all(
        'SELECT exercise_id, exercise_name, MIN(id) AS first_id
         FROM workout_sets WHERE workout_id = :wid
         GROUP BY exercise_id, exercise_name
         ORDER BY first_id ASC',
        [':wid' => $wid]
    );
    $allSets = db_fetch_all(
        'SELECT id, exercise_id, exercise_name, set_number, weight_kg, reps
         FROM workout_sets WHERE workout_id = :wid ORDER BY id ASC',
        [':wid' => $wid]
    );
    foreach ($allSets as $s) {
        $setsByExercise[strtolower((string)$s['exercise_name'])][] = $s;
        if ((int)$s['set_number'] > 0) {
            $totalSets++;
            $totalVolume += (float)$s['weight_kg'] * (int)$s['reps'];
        }
    }
}

$pageTitle = $workout ? ((string)$workout['name'] . ' | ShuzhFit') : 'Start Workout | ShuzhFit';
$desc = 'Live workout tracker with rest timer and last-performance memory.';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/workout'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>
<body class="workout-live">
    <?php require __DIR__ . '/includes/header.php'; ?>

    <main class="container page workout-page">
        <?php if ($flash): ?>
            <div class="notice <?= e($flash['type'] === 'ok' ? 'ok' : 'err') ?>"><?= e($flash['message']) ?></div>
        <?php endif; ?>
        <?php if ($notice): ?><div class="notice ok"><?= e($notice) ?></div><?php endif; ?>
        <?php if ($error): ?><div class="notice err"><?= e($error) ?></div><?php endif; ?>

        <?php if (!$workout): ?>
            <section class="section-title" style="margin-top:0;">
                <h2>Start a workout</h2>
                <span>Log sets in seconds — your last session is remembered</span>
            </section>

            <div class="form-wrap">
                <div class="form-card">
                    <form method="post" action="workout.php">
                        <?= csrf_field() ?>
                        <input type="hidden" name="action" value="start" />

                        <label for="wname">Workout name</label>
                        <input id="wname" name="name" type="text" maxlength="160" placeholder="e.g., Push Day" required />

                        <div class="chip-row" role="group" aria-label="Quick name suggestions">
                            <?php foreach (['Push Day', 'Pull Day', 'Leg Day', 'Full Body', 'Cardio'] as $suggestion): ?>
                                <button type="button" class="chip" data-name-fill="<?= e($suggestion) ?>"><?= e($suggestion) ?></button>
                            <?php endforeach; ?>
                        </div>

                        <div class="form-actions">
                            <button class="btn btn-primary btn-lg" type="submit">Start Workout</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card" style="margin-top:20px;">
                <h3>How this works</h3>
                <ul class="list">
                    <li>Add exercises from the library — or type your own.</li>
                    <li>Every exercise shows <strong>your last session</strong> with a suggested target.</li>
                    <li>Log each set in two taps. A rest timer starts automatically.</li>
                </ul>
            </div>
        <?php else: ?>
            <section class="section-title" style="margin-top:0;">
                <h2><?= e((string)$workout['name']) ?></h2>
                <span class="live-timer" data-live-timer data-started="<?= (int)strtotime((string)$workout['started_at']) ?>">0:00</span>
            </section>

            <div class="workout-stats">
                <div class="stat"><span class="stat-value"><?= $totalSets ?></span><span class="stat-label">sets</span></div>
                <div class="stat"><span class="stat-value"><?= number_format($totalVolume, 0) ?></span><span class="stat-label">kg lifted</span></div>
                <div class="stat"><span class="stat-value"><?= count($wExercises) ?></span><span class="stat-label">exercises</span></div>
            </div>

            <div class="form-card" style="margin:14px 0 20px;">
                <form method="post" action="workout.php" class="add-exercise-row">
                    <?= csrf_field() ?>
                    <input type="hidden" name="action" value="add_exercise" />
                    <input type="hidden" name="workout_id" value="<?= (int)$workout['id'] ?>" />

                    <label for="exsel">Add exercise</label>
                    <select id="exsel" name="exercise_id">
                        <option value="">— From library —</option>
                        <?php foreach ($exercises as $exOption): ?>
                            <option value="<?= (int)$exOption['id'] ?>"><?= e((string)$exOption['name']) ?></option>
                        <?php endforeach; ?>
                    </select>

                    <label for="exfree">Or type your own</label>
                    <input id="exfree" name="free_name" type="text" maxlength="200" placeholder="e.g., Smith Machine Row" />

                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit">+ Add Exercise</button>
                    </div>
                </form>
            </div>

            <?php if (!$wExercises): ?>
                <div class="empty-state">
                    <div class="empty-icon">🏋️</div>
                    <h3>No exercises yet</h3>
                    <p>Add your first exercise above — pick one from the library or type your own.</p>
                </div>
            <?php endif; ?>

            <?php foreach ($wExercises as $we):
                $exName = (string)$we['exercise_name'];
                $exId = $we['exercise_id'] !== null ? (int)$we['exercise_id'] : null;
                $key = strtolower($exName);
                $wSets = $setsByExercise[$key] ?? [];
                $memory = last_performance($userId, $exId, $exName);
                $target = $memory ? suggested_target($memory['sets']) : null;
                $lastWeight = null;
                foreach ($wSets as $ws) {
                    if ((int)$ws['set_number'] > 0 && $ws['weight_kg'] !== null) {
                        $lastWeight = (float)$ws['weight_kg'];
                    }
                }
                if ($lastWeight === null && $target && $target['weight'] !== null) {
                    $lastWeight = (float)$target['weight'];
                }
            ?>
                <div class="exercise-log-card">
                    <div class="elc-head">
                        <h3><?= e($exName) ?></h3>
                        <form method="post" action="workout.php" onsubmit="return confirm('Remove this exercise and its sets?');">
                            <?= csrf_field() ?>
                            <input type="hidden" name="action" value="remove_exercise" />
                            <input type="hidden" name="workout_id" value="<?= (int)$workout['id'] ?>" />
                            <input type="hidden" name="exercise_name" value="<?= e($exName) ?>" />
                            <button class="btn btn-sm" type="submit" aria-label="Remove <?= e($exName) ?>">✕</button>
                        </form>
                    </div>

                    <?php if ($memory): ?>
                        <div class="memory-box">
                            <div class="memory-title">Last time (<?= e($memory['date']) ?>)</div>
                            <div class="memory-sets">
                                <?php foreach ($memory['sets'] as $ms): ?>
                                    <span class="set-pill">
                                        <?= $ms['weight_kg'] !== null ? e(rtrim(rtrim((string)$ms['weight_kg'], '0'), '.') . ' kg') : 'BW' ?> × <?= (int)$ms['reps'] ?>
                                    </span>
                                <?php endforeach; ?>
                            </div>
                            <?php if ($target && $target['note']): ?>
                                <div class="memory-hint">Suggested: <?= $target['weight'] !== null ? e((string)$target['weight']) . ' kg × ' : '' ?><?= $target['reps'] ? (int)$target['reps'] . '+' : '' ?> reps</div>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>

                    <?php
                    $realSets = array_values(array_filter($wSets, static fn($ws) => (int)$ws['set_number'] > 0));
                    if ($realSets):
                    ?>
                        <table class="set-table">
                            <thead><tr><th>Set</th><th>Weight</th><th>Reps</th><th></th></tr></thead>
                            <tbody>
                                <?php foreach ($realSets as $ws): ?>
                                    <tr>
                                        <td><?= (int)$ws['set_number'] ?></td>
                                        <td><?= $ws['weight_kg'] !== null ? e(rtrim(rtrim((string)$ws['weight_kg'], '0'), '.') . ' kg') : '—' ?></td>
                                        <td><?= (int)$ws['reps'] ?></td>
                                        <td>
                                            <form method="post" action="workout.php">
                                                <?= csrf_field() ?>
                                                <input type="hidden" name="action" value="delete_set" />
                                                <input type="hidden" name="set_id" value="<?= (int)$ws['id'] ?>" />
                                                <button class="btn btn-sm" type="submit" aria-label="Delete set">✕</button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>

                    <form method="post" action="workout.php" class="set-form">
                        <?= csrf_field() ?>
                        <input type="hidden" name="action" value="log_set" />
                        <input type="hidden" name="workout_id" value="<?= (int)$workout['id'] ?>" />
                        <input type="hidden" name="exercise_name" value="<?= e($exName) ?>" />
                        <input type="hidden" name="exercise_id" value="<?= $exId !== null ? $exId : '' ?>" />

                        <div class="set-inputs">
                            <div class="set-field">
                                <label for="w-<?= md5($exName) ?>">Weight (kg)</label>
                                <input id="w-<?= md5($exName) ?>" name="weight_kg" type="number" inputmode="decimal" min="0" max="1000" step="0.5"
                                       placeholder="BW" value="<?= $lastWeight !== null ? e(rtrim(rtrim((string)$lastWeight, '0'), '.')) : '' ?>" />
                            </div>
                            <div class="set-field">
                                <label for="r-<?= md5($exName) ?>">Reps</label>
                                <input id="r-<?= md5($exName) ?>" name="reps" type="number" inputmode="numeric" min="1" max="500"
                                       placeholder="10" value="<?= $target && $target['reps'] ? (int)$target['reps'] : '' ?>" required />
                            </div>
                            <button class="btn btn-primary" type="submit">Save Set</button>
                        </div>
                    </form>
                </div>
            <?php endforeach; ?>

            <div class="finish-panel">
                <form method="post" action="workout.php">
                    <?= csrf_field() ?>
                    <input type="hidden" name="action" value="finish" />
                    <input type="hidden" name="workout_id" value="<?= (int)$workout['id'] ?>" />

                    <label for="wnotes">Notes (optional)</label>
                    <textarea id="wnotes" name="notes" rows="2" placeholder="How did it feel? Energy, soreness, wins..."></textarea>

                    <div class="form-actions">
                        <button class="btn btn-primary btn-lg" type="submit">Finish Workout</button>
                    </div>
                </form>

                <form method="post" action="workout.php" onsubmit="return confirm('Discard this entire workout?');">
                    <?= csrf_field() ?>
                    <input type="hidden" name="action" value="discard" />
                    <input type="hidden" name="workout_id" value="<?= (int)$workout['id'] ?>" />
                    <button class="btn btn-link-danger" type="submit">Discard workout</button>
                </form>
            </div>
        <?php endif; ?>
    </main>

    <?php require __DIR__ . '/includes/footer.php'; ?>

    <script src="js/script.js"></script>
</body>

</html>
