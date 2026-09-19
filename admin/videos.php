<?php
// ShuzhFit - Admin Video Manager

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/seo.php';
require_once __DIR__ . '/../lib/auth.php';

auth_session_boot();
if (!isset($_SESSION['admin_ok']) || $_SESSION['admin_ok'] !== true) {
    header('Location: index.php');
    exit;
}

$videos = db_fetch_all(
    'SELECT v.id, v.title, v.youtube_url, v.exercise_id, v.created_at, e.name AS exercise_name
     FROM videos v
     LEFT JOIN exercises e ON e.id = v.exercise_id
     ORDER BY v.created_at DESC'
);

$pageTitle = 'Manage Videos | ShuzhFit';
$desc = 'Add, edit, and delete YouTube links for shorts/long-form videos.';

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/admin/videos'); ?>
    <link rel="stylesheet" href="../css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>

    <main class="container page">
        <div class="section-title" style="margin-top:0;">
            <h2>Manage Videos</h2>
            <span>YouTube links</span>
        </div>

        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
            <a class="btn btn-primary" href="video_edit.php">+ Add YouTube Link</a>
            <a class="btn" href="index.php">← Dashboard</a>
            <a class="btn" href="logout.php">Logout</a>
        </div>

        <div style="margin-top:18px; overflow:auto;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Exercise</th>
                        <th>YouTube URL</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!$videos): ?>
                        <tr>
                            <td colspan="5">No videos yet.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($videos as $v): ?>
                            <tr>
                                <td><?php echo e($v['title']); ?></td>
                                <td><?php echo e($v['exercise_name'] ?? '—'); ?></td>
                                <td style="max-width:420px;"><?php echo e($v['youtube_url']); ?></td>
                                <td><?php echo e($v['created_at']); ?></td>
                                <td>
                                    <a class="btn" href="video_edit.php?id=<?php echo (int)$v['id']; ?>">Edit</a>
                                    <form method="post" action="videos.php" style="display:inline;" onsubmit="return confirm('Delete this video?');">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="delete_id" value="<?php echo (int)$v['id']; ?>" />
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
    if (isset($_POST['do_delete']) && ($_POST['delete_id'] ?? '') !== '') {
        if (!csrf_check()) {
            echo '<div class="notice err">Invalid security token. Please try again.</div>';
        } else {
            $id = (int)$_POST['delete_id'];
            db_exec('DELETE FROM videos WHERE id = :id', [':id' => $id]);
            header('Location: videos.php');
            exit;
        }
    }
    ?>

</body>

</html>