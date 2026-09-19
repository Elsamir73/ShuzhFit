<?php

// ShuzhFit - Workout history (/workout_history)

declare(strict_types=1);

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/insights.php';
require_once __DIR__ . '/lib/seo.php';

$user = require_login();
$userId = (int)$user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete') {
    if (csrf_check()) {
        $wid = (int)($_POST['workout_id'] ?? 0);
        db_exec('DELETE FROM workouts WHERE id = :wid AND user_id = :uid', [':wid' => $wid, ':uid' => $userId]);
        flash_set('ok', 'Workout deleted.');
    }
    header('Location: workout_history.php');
    exit;
}

$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 10;
$offset = ($page - 1) * $perPage;

$total = (int)db_fetch_one(
    "SELECT COUNT(*) AS c FROM workouts WHERE user_id = :uid AND status = 'finished'",
    [':uid' => $userId]
)['c'];
$totalPages = max(1, (int)ceil($total / $perPage));

$workouts = db_fetch_all(
    "SELECT w.id, w.name, w.workout_date, w.duration_seconds, w.notes,
            COALESCE(SUM(ws.weight_kg * ws.reps), 0) AS volume,
            SUM(CASE WHEN ws.set_number > 0 THEN 1 ELSE 0 END) AS sets
     FROM workouts w
     LEFT JOIN workout_sets ws ON ws.workout_id = w.id
     WHERE w.user_id = :uid AND w.status = 'finished'
     GROUP BY w.id
     ORDER BY w.workout_date DESC, w.id DESC
     LIMIT :lim OFFSET :off",
    [':uid' => $userId, ':lim' => $perPage, ':off' => $offset]
);

$quickLogs = db_fetch_all(
    'SELECT id, log_date, workout_type, duration_minutes, exercise, notes
     FROM workout_logs WHERE user_id = :uid
     ORDER BY log_date DESC, id DESC LIMIT 10',
    [':uid' => $userId]
);

$flash = flash_get();
$pageTitle = 'Workout History | ShuzhFit';
$desc = 'Review your past workouts, volumes, and training notes.';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/workout-history'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>
<body>
    <?php require __DIR__ . '/includes/header.php'; ?>
    <main class="container page">
        <?php if ($flash): ?>
            <div class="notice <?= e($flash['type'] === 'ok' ? 'ok' : 'err') ?>"><?= e($flash['message']) ?></div>
        <?php endif; ?>

        <section class="section-title" style="margin-top:0;">
            <h2>Workout History</h2>
            <span><?= $total ?> workout<?= $total === 1 ? '' : 's' ?> completed</span>
        </section>

        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:14px;">
            <a class="btn btn-primary" href="workout.php">+ Start Workout</a>
            <a class="btn" href="dashboard.php">← Dashboard</a>
        </div>

        <?php if (!$workouts): ?>
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No workouts yet</h3>
                <p>Your finished workouts will appear here with sets, volume, and notes.</p>
                <a class="btn btn-primary" href="workout.php">Start your first workout</a>
            </div>
        <?php else: ?>
            <div class="history-list">
                <?php foreach ($workouts as $w): ?>
                    <div class="history-row">
                        <div class="history-main">
                            <a class="history-title" href="workout_view.php?id=<?= (int)$w['id'] ?>"><?= e((string)$w['name']) ?></a>
                            <div class="muted">
                                <?= e((string)$w['workout_date']) ?>
                                · <?= max(1, (int)round(((int)$w['duration_seconds']) / 60)) ?> min
                                · <?= (int)$w['sets'] ?> sets
                                · <?= number_format((float)$w['volume'], 0) ?> kg volume
                            </div>
                            <?php if (!empty($w['notes'])): ?>
                                <div class="muted" style="margin-top:6px;"><?= e((string)$w['notes']) ?></div>
                            <?php endif; ?>
                        </div>
                        <div class="history-actions">
                            <a class="btn btn-sm" href="workout_view.php?id=<?= (int)$w['id'] ?>">View</a>
                            <form method="post" action="workout_history.php" onsubmit="return confirm('Delete this workout permanently?');">
                                <?= csrf_field() ?>
                                <input type="hidden" name="action" value="delete" />
                                <input type="hidden" name="workout_id" value="<?= (int)$w['id'] ?>" />
                                <button class="btn btn-sm btn-link-danger" type="submit">Delete</button>
                            </form>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

            <?php if ($totalPages > 1): ?>
                <div class="pagination" aria-label="History pages">
                    <?php for ($p = 1; $p <= $totalPages; $p++): ?>
                        <a class="page-link<?= $p === $page ? ' active' : '' ?>" href="workout_history.php?page=<?= $p ?>"><?= $p ?></a>
                    <?php endfor; ?>
                </div>
            <?php endif; ?>
        <?php endif; ?>

        <?php if ($quickLogs): ?>
            <section class="section-title">
                <h2>Quick Logs</h2>
                <span>Simple duration entries</span>
            </section>
            <div class="card">
                <ul class="list">
                    <?php foreach ($quickLogs as $q): ?>
                        <li>
                            <strong><?= e((string)$q['workout_type']) ?></strong>
                            <div class="muted" style="font-size:13px; margin-top:4px;">
                                <?= e((string)$q['log_date']) ?> · <?= (int)$q['duration_minutes'] ?> min
                                <?php if (!empty($q['exercise'])): ?> · <?= e((string)$q['exercise']) ?><?php endif; ?>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
    </main>
    <?php require __DIR__ . '/includes/footer.php'; ?>
    <script src="js/script.js"></script>
</body>
</html>
