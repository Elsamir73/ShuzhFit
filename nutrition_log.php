<?php

// ShuzhFit - Daily food & water log (/nutrition_log)

declare(strict_types=1);

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/seo.php';

$user = require_login();
$userId = (int)$user['id'];

$error = null;

/** Daily calorie/protein targets derived from the profile + latest weight. */
function nutrition_targets(array $user): array
{
    $height = (float)($user['height_cm'] ?? 0);
    $latestWeight = db_fetch_one(
        'SELECT weight_kg FROM progress_entries WHERE user_id = :uid ORDER BY log_date DESC, id DESC LIMIT 1',
        [':uid' => (int)$user['id']]
    );
    $weight = $latestWeight ? (float)$latestWeight['weight_kg'] : 0.0;
    if ($weight <= 0) {
        $weight = 65.0;
    }
    $activity = (float)($user['activity_level'] ?? 1.375);
    if ($activity < 1.1 || $activity > 2.1) {
        $activity = 1.375;
    }

    // Mifflin-St Jeor (male-neutral approximation without gender)
    $bmr = 10 * $weight + 6.25 * max($height, 150) - 103 + 5;
    $maintenance = (int)round($bmr * $activity);

    $goal = (string)($user['goal_type'] ?? 'maintain');
    $target = match ($goal) {
        'fat_loss' => $maintenance - 350,
        'muscle_gain' => $maintenance + 250,
        default => $maintenance,
    };

    return [
        'calories' => max(1200, $target),
        'protein' => (int)round($weight * 1.6),
        'water' => 8,
        'weight' => $weight,
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_check()) {
        $error = 'Your session expired. Please try again.';
    } else {
        $action = (string)($_POST['action'] ?? '');

        if ($action === 'add_food') {
            $logDate = (string)($_POST['log_date'] ?? date('Y-m-d'));
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $logDate)) {
                $logDate = date('Y-m-d');
            }
            $name = mb_substr(trim((string)($_POST['name'] ?? '')), 0, 200);
            $meal = (string)($_POST['meal_type'] ?? 'snack');
            if (!in_array($meal, ['breakfast', 'lunch', 'dinner', 'snack'], true)) {
                $meal = 'snack';
            }
            $calories = max(0, min(5000, (int)($_POST['calories'] ?? 0)));
            $protein = max(0, min(500, (float)($_POST['protein_g'] ?? 0)));
            $carbs = max(0, min(800, (float)($_POST['carbs_g'] ?? 0)));
            $fat = max(0, min(400, (float)($_POST['fat_g'] ?? 0)));

            if ($name === '') {
                $error = 'Give the food a name.';
            } else {
                db_exec(
                    'INSERT INTO food_logs (user_id, log_date, meal_type, name, calories, protein_g, carbs_g, fat_g)
                     VALUES (:uid, :d, :meal, :name, :cal, :p, :c, :f)',
                    [':uid' => $userId, ':d' => $logDate, ':meal' => $meal, ':name' => $name,
                     ':cal' => $calories, ':p' => $protein, ':c' => $carbs, ':f' => $fat]
                );

                $existing = db_fetch_one(
                    'SELECT id FROM saved_foods WHERE user_id = :uid AND name = :name LIMIT 1',
                    [':uid' => $userId, ':name' => $name]
                );
                if ($existing) {
                    db_exec(
                        'UPDATE saved_foods SET calories=:cal, protein_g=:p, carbs_g=:c, fat_g=:f,
                         times_used = times_used + 1, last_used_at = NOW() WHERE id = :id',
                        [':cal' => $calories, ':p' => $protein, ':c' => $carbs, ':f' => $fat, ':id' => (int)$existing['id']]
                    );
                } else {
                    db_exec(
                        'INSERT INTO saved_foods (user_id, name, calories, protein_g, carbs_g, fat_g, times_used, last_used_at)
                         VALUES (:uid, :name, :cal, :p, :c, :f, 1, NOW())',
                        [':uid' => $userId, ':name' => $name, ':cal' => $calories, ':p' => $protein, ':c' => $carbs, ':f' => $fat]
                    );
                }

                flash_set('ok', $name . ' logged.');
                header('Location: nutrition_log.php?date=' . $logDate);
                exit;
            }
        }

        if ($action === 'delete_food') {
            db_exec(
                'DELETE FROM food_logs WHERE id = :fid AND user_id = :uid',
                [':fid' => (int)($_POST['food_id'] ?? 0), ':uid' => $userId]
            );
            header('Location: nutrition_log.php?date=' . (string)($_POST['log_date'] ?? date('Y-m-d')));
            exit;
        }

        if ($action === 'water') {
            $logDate = (string)($_POST['log_date'] ?? date('Y-m-d'));
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $logDate)) {
                $logDate = date('Y-m-d');
            }
            $delta = (int)($_POST['delta'] ?? 1);
            db_exec(
                'INSERT INTO water_logs (user_id, log_date, glasses) VALUES (:uid, :d, GREATEST(:delta, 0))
                 ON DUPLICATE KEY UPDATE glasses = GREATEST(glasses + :delta2, 0)',
                [':uid' => $userId, ':d' => $logDate, ':delta' => $delta, ':delta2' => $delta]
            );
            header('Location: nutrition_log.php?date=' . $logDate);
            exit;
        }
    }
}

$logDate = (string)($_GET['date'] ?? date('Y-m-d'));
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $logDate)) {
    $logDate = date('Y-m-d');
}

$targets = nutrition_targets($user);

$foods = db_fetch_all(
    'SELECT id, meal_type, name, calories, protein_g, carbs_g, fat_g
     FROM food_logs WHERE user_id = :uid AND log_date = :d ORDER BY id ASC',
    [':uid' => $userId, ':d' => $logDate]
);

$water = (int)(db_fetch_one(
    'SELECT glasses FROM water_logs WHERE user_id = :uid AND log_date = :d LIMIT 1',
    [':uid' => $userId, ':d' => $logDate]
)['glasses'] ?? 0);

$savedFoods = db_fetch_all(
    'SELECT id, name, calories, protein_g, carbs_g, fat_g
     FROM saved_foods WHERE user_id = :uid ORDER BY times_used DESC, last_used_at DESC LIMIT 8',
    [':uid' => $userId]
);

$weekRows = db_fetch_all(
    'SELECT log_date, SUM(calories) AS cal, SUM(protein_g) AS protein
     FROM food_logs WHERE user_id = :uid AND log_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY log_date ORDER BY log_date ASC',
    [':uid' => $userId]
);

$totals = ['calories' => 0, 'protein' => 0.0, 'carbs' => 0.0, 'fat' => 0.0];
$byMeal = ['breakfast' => [], 'lunch' => [], 'dinner' => [], 'snack' => []];
foreach ($foods as $f) {
    $totals['calories'] += (int)$f['calories'];
    $totals['protein'] += (float)$f['protein_g'];
    $totals['carbs'] += (float)$f['carbs_g'];
    $totals['fat'] += (float)$f['fat_g'];
    $byMeal[$f['meal_type']][] = $f;
}

$flash = flash_get();
$pageTitle = 'Food Log | ShuzhFit';
$desc = 'Track calories, macros, and water for today.';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/nutrition-log'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>
<body>
    <?php require __DIR__ . '/includes/header.php'; ?>
    <main class="container page">
        <?php if ($flash): ?>
            <div class="notice <?= e($flash['type'] === 'ok' ? 'ok' : 'err') ?>"><?= e($flash['message']) ?></div>
        <?php endif; ?>
        <?php if ($error): ?><div class="notice err"><?= e($error) ?></div><?php endif; ?>

        <section class="section-title" style="margin-top:0;">
            <h2>Food Log</h2>
            <span><?= e($logDate) ?></span>
        </section>

        <div class="day-nav">
            <a class="btn btn-sm" href="nutrition_log.php?date=<?= e(date('Y-m-d', strtotime($logDate . ' -1 day'))) ?>">← Prev</a>
            <a class="btn btn-sm" href="nutrition_log.php">Today</a>
            <a class="btn btn-sm" href="nutrition_log.php?date=<?= e(date('Y-m-d', strtotime($logDate . ' +1 day'))) ?>">Next →</a>
        </div>

        <div class="nutrition-summary">
            <div class="nutri-ring">
                <svg viewBox="0 0 120 120" width="150" height="150" role="img" aria-label="Calories consumed today">
                    <?php
                    $pct = $targets['calories'] > 0 ? min(1, $totals['calories'] / $targets['calories']) : 0;
                    $circ = 2 * M_PI * 52;
                    ?>
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" stroke-width="10"
                            stroke-linecap="round" stroke-dasharray="<?= round($pct * $circ, 1) ?> <?= round($circ, 1) ?>"
                            transform="rotate(-90 60 60)" />
                    <text x="60" y="57" text-anchor="middle" fill="var(--text)" font-size="20" font-weight="800"><?= number_format($totals['calories']) ?></text>
                    <text x="60" y="76" text-anchor="middle" fill="var(--muted)" font-size="10">of <?= number_format($targets['calories']) ?> kcal</text>
                </svg>
            </div>

            <div class="macro-bars">
                <?php
                $macroDefs = [
                    ['Protein', $totals['protein'], $targets['protein']],
                    ['Carbs', $totals['carbs'], round($targets['calories'] * 0.45 / 4)],
                    ['Fat', $totals['fat'], round($targets['calories'] * 0.25 / 9)],
                ];
                foreach ($macroDefs as [$label, $value, $goal]):
                    $mpct = $goal > 0 ? min(100, (int)round($value / $goal * 100)) : 0;
                ?>
                    <div class="macro-row">
                        <div class="macro-label"><?= $label ?></div>
                        <div class="progress"><div class="progress-fill" style="width: <?= $mpct ?>%;"></div></div>
                        <div class="macro-value"><?= number_format($value, 0) ?> / <?= number_format($goal, 0) ?> g</div>
                    </div>
                <?php endforeach; ?>

                <div class="water-row">
                    <div class="macro-label">Water</div>
                    <div class="water-glasses" aria-label="Water glasses today">
                        <?php for ($i = 1; $i <= max($targets['water'], $water); $i++): ?>
                            <span class="glass<?= $i <= $water ? ' full' : '' ?>">💧</span>
                        <?php endfor; ?>
                    </div>
                    <div class="water-actions">
                        <form method="post" action="nutrition_log.php">
                            <?= csrf_field() ?>
                            <input type="hidden" name="action" value="water" />
                            <input type="hidden" name="log_date" value="<?= e($logDate) ?>" />
                            <input type="hidden" name="delta" value="-1" />
                            <button class="btn btn-sm" type="submit" aria-label="Remove a glass">−</button>
                        </form>
                        <form method="post" action="nutrition_log.php">
                            <?= csrf_field() ?>
                            <input type="hidden" name="action" value="water" />
                            <input type="hidden" name="log_date" value="<?= e($logDate) ?>" />
                            <input type="hidden" name="delta" value="1" />
                            <button class="btn btn-sm btn-primary" type="submit" aria-label="Add a glass">+ Glass</button>
                        </form>
                        <span class="muted"><?= $water ?>/<?= $targets['water'] ?></span>
                    </div>
                </div>
            </div>
        </div>
        <div class="form-card" style="margin:18px 0;">
            <h3 style="margin-top:0;">Add food</h3>

            <?php if ($savedFoods): ?>
                <div class="chip-row" role="group" aria-label="Recently logged foods">
                    <?php foreach ($savedFoods as $sf): ?>
                        <button type="button" class="chip"
                                data-food-name="<?= e((string)$sf['name']) ?>"
                                data-food-cal="<?= (int)$sf['calories'] ?>"
                                data-food-p="<?= e((string)$sf['protein_g']) ?>"
                                data-food-c="<?= e((string)$sf['carbs_g']) ?>"
                                data-food-f="<?= e((string)$sf['fat_g']) ?>">
                            <?= e((string)$sf['name']) ?> · <?= (int)$sf['calories'] ?> kcal
                        </button>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <form method="post" action="nutrition_log.php">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="add_food" />
                <input type="hidden" name="log_date" value="<?= e($logDate) ?>" />

                <div class="grid" style="grid-template-columns: 2fr 1fr; margin-top:0;">
                    <div>
                        <label for="fname">Food</label>
                        <input id="fname" name="name" type="text" maxlength="200" required placeholder="e.g., Chicken + rice" />
                    </div>
                    <div>
                        <label for="fmeal">Meal</label>
                        <select id="fmeal" name="meal_type">
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack" selected>Snack</option>
                        </select>
                    </div>
                </div>

                <div class="grid" style="grid-template-columns: repeat(4, 1fr); margin-top:0;">
                    <div>
                        <label for="fcal">Calories</label>
                        <input id="fcal" name="calories" type="number" inputmode="numeric" min="0" max="5000" placeholder="kcal" />
                    </div>
                    <div>
                        <label for="fp">Protein (g)</label>
                        <input id="fp" name="protein_g" type="number" inputmode="decimal" min="0" max="500" step="0.1" placeholder="0" />
                    </div>
                    <div>
                        <label for="fc">Carbs (g)</label>
                        <input id="fc" name="carbs_g" type="number" inputmode="decimal" min="0" max="800" step="0.1" placeholder="0" />
                    </div>
                    <div>
                        <label for="ff">Fat (g)</label>
                        <input id="ff" name="fat_g" type="number" inputmode="decimal" min="0" max="400" step="0.1" placeholder="0" />
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-primary" type="submit">Log Food</button>
                </div>
            </form>
        </div>

        <?php if (!$foods): ?>
            <div class="empty-state">
                <div class="empty-icon">🍽️</div>
                <h3>Nothing logged for this day</h3>
                <p>Add your first food above. Foods you log once become one-tap shortcuts.</p>
            </div>
        <?php endif; ?>

        <?php foreach (['breakfast' => 'Breakfast', 'lunch' => 'Lunch', 'dinner' => 'Dinner', 'snack' => 'Snacks'] as $mealKey => $mealLabel): ?>
            <?php if (!$byMeal[$mealKey]) { continue; } ?>
            <div class="card" style="padding:18px; margin-top:14px;">
                <h3 style="margin-top:0;"><?= $mealLabel ?></h3>
                <ul class="list">
                    <?php foreach ($byMeal[$mealKey] as $f): ?>
                        <li>
                            <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
                                <div>
                                    <strong><?= e((string)$f['name']) ?></strong>
                                    <div class="muted" style="font-size:13px; margin-top:2px;">
                                        <?= (int)$f['calories'] ?> kcal
                                        · P <?= e(rtrim(rtrim((string)$f['protein_g'], '0'), '.')) ?>g
                                        · C <?= e(rtrim(rtrim((string)$f['carbs_g'], '0'), '.')) ?>g
                                        · F <?= e(rtrim(rtrim((string)$f['fat_g'], '0'), '.')) ?>g
                                    </div>
                                </div>
                                <form method="post" action="nutrition_log.php">
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="action" value="delete_food" />
                                    <input type="hidden" name="food_id" value="<?= (int)$f['id'] ?>" />
                                    <input type="hidden" name="log_date" value="<?= e($logDate) ?>" />
                                    <button class="btn btn-sm" type="submit" aria-label="Delete entry">✕</button>
                                </form>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endforeach; ?>

        <?php if ($weekRows): ?>
            <section class="section-title">
                <h2>Last 7 days</h2>
                <span>Daily calories</span>
            </section>
            <div class="card" style="padding:18px;">
                <div class="week-bars">
                    <?php
                    $maxCal = 0;
                    foreach ($weekRows as $wr) {
                        $maxCal = max($maxCal, (int)$wr['cal']);
                    }
                    $dayMap = [];
                    foreach ($weekRows as $wr) {
                        $dayMap[(string)$wr['log_date']] = $wr;
                    }
                    for ($i = 6; $i >= 0; $i--) {
                        $day = date('Y-m-d', strtotime("-{$i} days"));
                        $cal = isset($dayMap[$day]) ? (int)$dayMap[$day]['cal'] : 0;
                        $h = $maxCal > 0 ? (int)round($cal / $maxCal * 100) : 0;
                        echo '<div class="week-bar-col">';
                        echo '<div class="week-bar" style="height:' . max(4, $h) . 'px" title="' . $cal . ' kcal"></div>';
                        echo '<span class="week-bar-label">' . date('D', strtotime($day)) . '</span>';
                        echo '</div>';
                    }
                    ?>
                </div>
            </div>
        <?php endif; ?>
    </main>
    <?php require __DIR__ . '/includes/footer.php'; ?>
    <script src="js/script.js"></script>
</body>
</html>

