<?php
// ShuzhFit - Admin Comment Manager

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/seo.php';
require_once __DIR__ . '/../lib/auth.php';

auth_session_boot();
if (!isset($_SESSION['admin_ok']) || $_SESSION['admin_ok'] !== true) {
    header('Location: index.php');
    exit;
}

$comments = db_fetch_all(
    'SELECT id, item_type, item_slug, author, message, created_at FROM content_comments ORDER BY created_at DESC'
);

$pageTitle = 'Manage Comments | ShuzhFit';
$desc = 'Review and moderate community comments.';
?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/admin/comments'); ?>
    <link rel="stylesheet" href="../css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>

    <main class="container page">
        <div class="section-title" style="margin-top:0;">
            <h2>Manage Comments</h2>
            <span>Community moderation</span>
        </div>

        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
            <a class="btn" href="index.php">← Dashboard</a>
            <a class="btn" href="logout.php">Logout</a>
        </div>

        <div style="margin-top:18px; overflow:auto;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Slug</th>
                        <th>Author</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!$comments): ?>
                        <tr>
                            <td colspan="6">No comments yet.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($comments as $comment): ?>
                            <tr>
                                <td><?php echo e((string)$comment['item_type']); ?></td>
                                <td><?php echo e((string)$comment['item_slug']); ?></td>
                                <td><?php echo e((string)$comment['author']); ?></td>
                                <td style="max-width:260px;"><?php echo e((string)$comment['message']); ?></td>
                                <td><?php echo e((string)$comment['created_at']); ?></td>
                                <td>
                                    <form method="post" action="comments.php" style="display:inline;" onsubmit="return confirm('Delete this comment?');">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="delete_id" value="<?php echo (int)$comment['id']; ?>" />
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
            db_exec('DELETE FROM content_comments WHERE id = :id', [':id' => $id]);
            header('Location: comments.php');
            exit;
        }
    }
    ?>
</body>

</html>