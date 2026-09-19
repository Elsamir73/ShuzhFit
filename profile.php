<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/seo.php';

$user = require_login();
$userId = (int)$user['id'];
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_check()) {
        $error = 'Your session expired. Please try again.';
    } elseif (($_POST['action'] ?? '') === 'profile') {
        $height = (float)($_POST['height_cm'] ?? 0);
        $activity = (float)($_POST['activity_level'] ?? 1.375);
        $weeklyTarget = (int)($_POST['weekly_workout_target'] ?? 3);
        $goalType = (string)($_POST['goal_type'] ?? 'maintain');
        $targetWeight = trim((string)($_POST['target_weight_kg'] ?? ''));
        if ($height < 100 || $height > 250 || $weeklyTarget < 1 || $weeklyTarget > 14 || !in_array($goalType, ['fat_loss', 'maintain', 'muscle_gain'], true)) {
            $error = 'Please enter valid profile details.';
        } else {
            db_exec(
                'UPDATE users SET height_cm = :height, goal_type = :goal, activity_level = :activity,
                 weekly_workout_target = :weekly, target_weight_kg = :target WHERE id = :uid',
                [
                    ':height' => $height,
                    ':goal' => $goalType,
                    ':activity' => $activity,
                    ':weekly' => $weeklyTarget,
                    ':target' => $targetWeight !== '' ? (float)$targetWeight : null,
                    ':uid' => $userId
                ]
            );
            flash_set('ok', 'Profile updated.');
            header('Location: profile.php');
            exit;
        }
    } elseif (($_POST['action'] ?? '') === 'goal_achieve') {
        $gid = (int)($_POST['goal_id'] ?? 0);
        db_exec(
            "UPDATE user_goals SET status = 'achieved', achieved_at = NOW() WHERE id = :gid AND user_id = :uid",
            [':gid' => $gid, ':uid' => $userId]
        );
        flash_set('ok', 'Goal marked as achieved. Nice work!');
        header('Location: profile.php');
        exit;
    } elseif (($_POST['action'] ?? '') === 'goal_delete') {
        $gid = (int)($_POST['goal_id'] ?? 0);
        db_exec('DELETE FROM user_goals WHERE id = :gid AND user_id = :uid', [':gid' => $gid, ':uid' => $userId]);
        flash_set('ok', 'Goal removed.');
        header('Location: profile.php');
        exit;
    } elseif (($_POST['action'] ?? '') === 'goal') {
        $title = mb_substr(trim((string)($_POST['title'] ?? '')), 0, 160);
        $metric = (string)($_POST['metric'] ?? 'workouts_per_week');
        $value = (float)($_POST['target_value'] ?? 0);
        $deadline = trim((string)($_POST['deadline'] ?? ''));
        if ($title === '' || $value <= 0 || !in_array($metric, ['weight', 'exercise_weight', 'workouts_per_week'], true)) {
            $error = 'Enter a goal title and a positive target.';
        } else {
            db_exec(
                'INSERT INTO user_goals (user_id, title, metric, target_value, exercise_name, deadline)
                 VALUES (:uid, :title, :metric, :value, :exercise, :deadline)',
                [
                    ':uid' => $userId,
                    ':title' => $title,
                    ':metric' => $metric,
                    ':value' => $value,
                    ':exercise' => trim((string)($_POST['exercise_name'] ?? '')) ?: null,
                    ':deadline' => $deadline !== '' ? $deadline : null
                ]
            );
            flash_set('ok', 'Goal added.');
            header('Location: profile.php');
            exit;
        }
    }
}

$user = current_user() ?? $user;
require_once __DIR__ . '/lib/insights.php';
$goalProgress = goals_with_progress($userId);
$achieveList = achievements($userId);
$flash = flash_get();
$pageTitle = 'Profile & Goals | ShuzhFit';
$desc = 'Manage your fitness preferences and personal goals.';
?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/profile'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>

<body>
    <?php require __DIR__ . '/includes/header.php'; ?>
    <main class="container page">
        <section class="section-title" style="margin-top:0;">
            <h2>Profile & Goals</h2><span><?= e((string)$user['email']) ?></span>
        </section>
        <?php if ($flash): ?><div class="notice ok"><?= e($flash['message']) ?></div><?php endif; ?>
        <?php if ($error): ?><div class="notice err"><?= e($error) ?></div><?php endif; ?>
        <div class="grid" style="grid-template-columns:repeat(2,1fr);">
            <div class="form-card">
                <h3>Training preferences</h3>
                <form method="post" action="profile.php">
                    <?= csrf_field() ?><input type="hidden" name="action" value="profile" />
                    <label for="height">Height (cm)</label><input id="height" name="height_cm" type="number" min="100" max="250" step="0.1" value="<?= e((string)($user['height_cm'] ?? '')) ?>" required />
                    <label for="goal_type">Primary goal</label>
                    <select id="goal_type" name="goal_type">
                        <option value="fat_loss" <?= ($user['goal_type'] ?? '') === 'fat_loss' ? 'selected' : '' ?>>Lose fat</option>
                        <option value="maintain" <?= ($user['goal_type'] ?? 'maintain') === 'maintain' ? 'selected' : '' ?>>Maintain</option>
                        <option value="muscle_gain" <?= ($user['goal_type'] ?? '') === 'muscle_gain' ? 'selected' : '' ?>>Build muscle</option>
                    </select>
                    <label for="weekly">Workouts per week</label><input id="weekly" name="weekly_workout_target" type="number" min="1" max="14" value="<?= (int)($user['weekly_workout_target'] ?? 3) ?>" required />
                    <label for="target">Target weight (kg, optional)</label><input id="target" name="target_weight_kg" type="number" min="20" max="300" step="0.1" value="<?= e((string)($user['target_weight_kg'] ?? '')) ?>" />
                    <label for="activity">Activity level</label><select id="activity" name="activity_level">
                        <option value="1.2" <?= (float)($user['activity_level'] ?? 1.375) === 1.2 ? 'selected' : '' ?>>Light</option>
                        <option value="1.375" <?= (float)($user['activity_level'] ?? 1.375) === 1.375 ? 'selected' : '' ?>>Moderate</option>
                        <option value="1.55" <?= (float)($user['activity_level'] ?? 1.375) === 1.55 ? 'selected' : '' ?>>Active</option>
                        <option value="1.725" <?= (float)($user['activity_level'] ?? 1.375) === 1.725 ? 'selected' : '' ?>>Very active</option>
                    </select>
                    <div class="form-actions"><button class="btn btn-primary" type="submit">Save preferences</button></div>
                </form>
            </div>
            <div class="form-card">
                <h3>Add a goal</h3>
                <form method="post" action="profile.php">
                    <?= csrf_field() ?><input type="hidden" name="action" value="goal" />
                    <label for="title">Goal</label><input id="title" name="title" maxlength="160" placeholder="Train consistently" required />
                    <label for="metric">Measure</label><select id="metric" name="metric">
                        <option value="workouts_per_week">Workouts per week</option>
                        <option value="weight">Target weight</option>
                        <option value="exercise_weight">Exercise strength</option>
                    </select>
                    <label for="value">Target value</label><input id="value" name="target_value" type="number" min="0.1" step="0.1" required />
                    <label for="exercise">Exercise (optional)</label><input id="exercise" name="exercise_name" maxlength="200" placeholder="Bench press" />
                    <label for="deadline">Deadline (optional)</label><input id="deadline" name="deadline" type="date" />
                    <div class="form-actions"><button class="btn btn-primary" type="submit">Add goal</button></div>
                </form>
                <?php if ($goalProgress): ?><h3>Active goals</h3>
                    <div class="goal-list">
                        <?php foreach ($goalProgress as $gp): ?>
                            <div class="goal-item">
                                <div class="goal-head">
                                    <strong><?= e($gp['title']) ?></strong>
                                    <span class="muted"><?= $gp['current'] !== null ? e((string)round((float)$gp['current'], 1)) : '—' ?><?= e($gp['unit']) ?> / <?= e((string)round($gp['target'], 1)) ?><?= e($gp['unit']) ?></span>
                                </div>
                                <div class="progress"><div class="progress-fill<?= $gp['pct'] >= 100 ? ' complete' : '' ?>" style="width: <?= $gp['pct'] ?>%;"></div></div>
                                <div class="goal-foot">
                                    <span class="muted"><?= e($gp['note']) ?><?= $gp['deadline'] ? ' · by ' . e($gp['deadline']) : '' ?></span>
                                    <span class="goal-actions">
                                        <form method="post" action="profile.php">
                                            <?= csrf_field() ?>
                                            <input type="hidden" name="action" value="goal_achieve" />
                                            <input type="hidden" name="goal_id" value="<?= $gp['id'] ?>" />
                                            <button class="btn btn-sm" type="submit" title="Mark achieved">✓</button>
                                        </form>
                                        <form method="post" action="profile.php" onsubmit="return confirm('Remove this goal?');">
                                            <?= csrf_field() ?>
                                            <input type="hidden" name="action" value="goal_delete" />
                                            <input type="hidden" name="goal_id" value="<?= $gp['id'] ?>" />
                                            <button class="btn btn-sm btn-link-danger" type="submit" title="Delete goal">✕</button>
                                        </form>
                                    </span>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div><?php else: ?><p class="muted">No goals yet. Add one to give your dashboard a clear target.</p><?php endif; ?>
            </div>
        </div>

        <?php if (!empty($_GET['welcome'])): ?>
            <div class="notice ok" style="margin-top:18px;">
                Welcome! Set your height, goal, and weekly target — the dashboard and nutrition targets adapt to them.
            </div>
        <?php endif; ?>

        <section class="section-title">
            <h2>Achievements</h2><span>Unlocked from your real activity</span>
        </section>
        <div class="achievement-grid">
            <?php foreach ($achieveList as $a): ?>
                <div class="achievement<?= $a['unlocked'] ? ' unlocked' : '' ?>">
                    <div class="achievement-icon"><?= $a['icon'] ?></div>
                    <div class="achievement-title"><?= e($a['title']) ?></div>
                    <div class="achievement-desc"><?= e($a['desc']) ?></div>
                    <div class="progress"><div class="progress-fill" style="width: <?= $a['pct'] ?>%;"></div></div>
                </div>
            <?php endforeach; ?>
        </div>
    </main>
    <?php require __DIR__ . '/includes/footer.php'; ?>
</body>

</html>