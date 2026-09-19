<?php
// ShuzhFit - Admin Exercise add/edit

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/seo.php';
require_once __DIR__ . '/../lib/auth.php';

auth_session_boot();
if (!isset($_SESSION['admin_ok']) || $_SESSION['admin_ok'] !== true) {
    header('Location: index.php');
    exit;
}

$slug = trim($_GET['slug'] ?? '');
$editing = $slug !== '';

$existing = null;
if ($editing) {
    $existing = db_fetch_one('SELECT * FROM exercises WHERE slug = :slug LIMIT 1', [':slug' => $slug]);
}

$notice = null;
$error = null;

if (isset($_POST['save'])) {
    if (!csrf_check()) {
        $error = 'Invalid security token. Please try again.';
    } else {
    $name = trim((string)($_POST['name'] ?? ''));
    $muscles = trim((string)($_POST['muscles_worked'] ?? ''));
    $benefits = (string)($_POST['benefits'] ?? '');
    $form = (string)($_POST['form_guide'] ?? '');
    $mistakes = (string)($_POST['mistakes'] ?? '');
    $reps = trim((string)($_POST['reps'] ?? ''));

    if ($name === '' || $muscles === '' || $benefits === '' || $form === '' || $mistakes === '' || $reps === '') {
        $error = 'All fields are required.';
    } else {
        $newSlug = slugify($name);

        $conflict = db_fetch_one('SELECT id FROM exercises WHERE slug = :slug AND slug <> :orig LIMIT 1', [
            ':slug' => $newSlug,
            ':orig' => $editing ? $slug : '__none__'
        ]);

        if ($conflict) {
            $newSlug = $newSlug . '-' . time();
        }

        $params = [
            ':name' => $name,
            ':slug' => $newSlug,
            ':muscles' => $muscles,
            ':benefits' => $benefits,
            ':form' => $form,
            ':mistakes' => $mistakes,
            ':reps' => $reps,
        ];

        if ($editing) {
            db_exec(
                'UPDATE exercises SET name=:name, slug=:slug, muscles_worked=:muscles, benefits=:benefits, form_guide=:form, mistakes=:mistakes, reps=:reps WHERE slug=:orig',
                array_merge($params, [':orig' => $slug])
            );
            $notice = 'Exercise updated.';
        } else {
            db_exec(
                'INSERT INTO exercises (name, slug, muscles_worked, benefits, form_guide, mistakes, reps) VALUES (:name,:slug,:muscles,:benefits,:form,:mistakes,:reps)',
                $params
            );
            $notice = 'Exercise created.';
        }
    }
    }
}

$prefill = [
    'name' => $existing['name'] ?? '',
    'muscles_worked' => $existing['muscles_worked'] ?? '',
    'benefits' => $existing['benefits'] ?? '',
    'form_guide' => $existing['form_guide'] ?? '',
    'mistakes' => $existing['mistakes'] ?? '',
    'reps' => $existing['reps'] ?? '3 sets x 8-12 reps',
];

$pageTitle = $editing ? 'Edit Exercise | ShuzhFit' : 'Add Exercise | ShuzhFit';
$desc = 'Admin exercise editor.';

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?php echo e($pageTitle); ?></title>
    <meta name="description" content="<?php echo e($desc); ?>" />
    <link rel="stylesheet" href="../css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>

    <main class="container page">
        <div class="section-title" style="margin-top:0;">
            <h2><?php echo $editing ? 'Edit Exercise' : 'Add Exercise'; ?></h2>
            <span>CRUD</span>
        </div>

        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
            <a class="btn" href="exercises.php">← Back</a>
            <a class="btn" href="../exercises.php">View Library</a>
            <?php if ($editing && $existing): ?>
                <a class="btn btn-primary" href="../exercise_page.php?slug=<?php echo urlencode($existing['slug']); ?>" target="_blank">View Page</a>
            <?php endif; ?>
            <a class="btn" href="logout.php">Logout</a>
        </div>

        <?php if ($notice): ?><div class="notice ok" style="margin-top:14px;"><?php echo e($notice); ?></div><?php endif; ?>
        <?php if ($error): ?><div class="notice err" style="margin-top:14px;"><?php echo e($error); ?></div><?php endif; ?>

        <div class="form-wrap" style="margin-top:18px;">
            <div class="form-card">
                <form method="post" action="">
                    <?= csrf_field() ?>
                    <label>Name</label>
                    <input type="text" name="name" required value="<?php echo e($prefill['name']); ?>" />

                    <label>Muscles Worked (e.g., Chest, Triceps, Shoulders)</label>
                    <input type="text" name="muscles_worked" required value="<?php echo e($prefill['muscles_worked']); ?>" />

                    <label>Benefits (HTML allowed)</label>
                    <textarea name="benefits" required><?php echo e($prefill['benefits']); ?></textarea>

                    <label>Proper Form Guide (HTML allowed)</label>
                    <textarea name="form_guide" required><?php echo e($prefill['form_guide']); ?></textarea>

                    <label>Common Mistakes (HTML allowed)</label>
                    <textarea name="mistakes" required><?php echo e($prefill['mistakes']); ?></textarea>

                    <label>Sets & Reps (e.g., 3 sets x 8-12 reps)</label>
                    <input type="text" name="reps" required value="<?php echo e($prefill['reps']); ?>" />

                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit" name="save">Save</button>
                        <a class="btn" href="exercises.php">Cancel</a>
                    </div>

                    <p class="notice" style="margin-top:14px; color:var(--muted);">
                        Beginner note: Slug is auto-generated from Name.
                    </p>
                </form>
            </div>
        </div>
    </main>

</body>

</html>