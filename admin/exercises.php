<?php
// ShuzhFit - Admin Exercise Manager

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/seo.php';
require_once __DIR__ . '/../lib/auth.php';

auth_session_boot();
if (!isset($_SESSION['admin_ok']) || $_SESSION['admin_ok'] !== true) {
    header('Location: index.php');
    exit;
}

$exercises = db_fetch_all('SELECT id, name, slug, muscles_worked, reps, created_at FROM exercises ORDER BY created_at DESC');

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Manage Exercises | ShuzhFit</title>
    <meta name="description" content="Add, edit, and delete exercises." />
    <link rel="stylesheet" href="../css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>

    <main class="container page">
        <div class="section-title" style="margin-top:0;">
            <h2>Manage Exercises</h2>
            <span>CRUD</span>
        </div>

        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
            <a class="btn btn-primary" href="exercise_edit.php">+ Add Exercise</a>
            <a class="btn" href="index.php">← Dashboard</a>
            <a class="btn" href="logout.php">Logout</a>
        </div>

        <div style="margin-top:18px; overflow:auto;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Muscles</th>
                        <th>Reps</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!$exercises): ?>
                        <tr>
                            <td colspan="5">No exercises yet.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($exercises as $ex): ?>
                            <tr>
                                <td><?php echo e($ex['name']); ?></td>
                                <td><?php echo e($ex['muscles_worked']); ?></td>
                                <td><?php echo e($ex['reps']); ?></td>
                                <td><?php echo e($ex['created_at']); ?></td>
                                <td>
                                    <a class="btn" href="exercise_edit.php?slug=<?php echo urlencode($ex['slug']); ?>">Edit</a>
                                    <form method="post" action="exercises.php" style="display:inline;" onsubmit="return confirm('Delete this exercise?');">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="delete_slug" value="<?php echo e($ex['slug']); ?>" />
                                        <button class="btn" name="do_delete" value="1" type="submit" style="border-color:rgba(255,60,60,0.35);">Delete</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </main>

    <?php
    // Handle delete
    if (isset($_POST['do_delete']) && ($_POST['delete_slug'] ?? '') !== '') {
        if (!csrf_check()) {
            echo '<div class="notice err">Invalid security token. Please try again.</div>';
        } else {
            $delSlug = trim((string)$_POST['delete_slug']);
            db_exec('DELETE FROM exercises WHERE slug = :slug', [':slug' => $delSlug]);
            header('Location: exercises.php');
            exit;
        }
    }
    ?>

</body>

</html>