<?php
// ShuzhFit - Exercise library listing page (/exercises)

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/seo.php';

$muscleFilter = trim((string)($_GET['muscle'] ?? ''));
$allowedMuscles = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

if ($muscleFilter !== '' && !in_array($muscleFilter, $allowedMuscles, true)) {
    $muscleFilter = '';
}

$params = [];
$where = '';
if ($muscleFilter !== '') {
    $where = ' WHERE LOWER(muscles_worked) LIKE :muscle';
    $params[':muscle'] = '%' . strtolower($muscleFilter) . '%';
}

$exercises = db_fetch_all(
    'SELECT id, name, slug, muscles_worked, benefits, reps, created_at FROM exercises' . $where . ' ORDER BY created_at DESC LIMIT 100',
    $params
);

$pageTitle = seo_title('Exercises', null);
$desc = 'Browse exercise library with proper form, benefits, common mistakes, sets & reps, and related exercises.';

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <?php render_seo_tags($pageTitle, $desc, '/exercises'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>

<body>
    <?php require __DIR__ . '/includes/header.php'; ?>

    <main class="container page">
        <section>
            <div class="section-title">
                <h2>Exercise Library</h2>
                <span>Proper form + beginner guidance</span>
            </div>

            <div class="filter-bar">
                <a class="filter-pill <?php echo $muscleFilter === '' ? 'active' : ''; ?>" href="exercises.php">All</a>
                <?php foreach ($allowedMuscles as $muscle): ?>
                    <a class="filter-pill <?php echo $muscleFilter === $muscle ? 'active' : ''; ?>" href="exercises.php?muscle=<?php echo urlencode($muscle); ?>"><?php echo e($muscle); ?></a>
                <?php endforeach; ?>
            </div>

            <div class="grid" style="grid-template-columns:repeat(3,1fr);">
                <?php if (!$exercises): ?>
                    <div class="notice err">No exercises found. Admin can add exercises from /admin.</div>
                <?php else: ?>
                    <?php foreach ($exercises as $ex): ?>
                        <article class="exercise-card">
                            <a href="exercise_page.php?slug=<?php echo urlencode($ex['slug']); ?>">
                                <h3><?php echo e($ex['name']); ?></h3>
                                <div class="muted" style="margin-top:6px;">Muscles: <?php echo e($ex['muscles_worked']); ?></div>
                                <div class="muted" style="margin-top:10px;">Sets & Reps: <?php echo e($ex['reps']); ?></div>
                            </a>
                        </article>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </section>
    </main>

    <?php require __DIR__ . '/includes/footer.php'; ?>
</body>

</html>