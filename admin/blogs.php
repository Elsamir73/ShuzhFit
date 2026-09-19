<?php
// ShuzhFit - Admin Blog Manager

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/seo.php';
require_once __DIR__ . '/../lib/auth.php';

auth_session_boot();
if (!isset($_SESSION['admin_ok']) || $_SESSION['admin_ok'] !== true) {
    header('Location: index.php');
    exit;
}

$blogs = db_fetch_all('SELECT id, title, slug, category, image, author, created_at FROM blogs ORDER BY created_at DESC');

$pageTitle = 'Manage Blogs | ShuzhFit';
$desc = 'Add, edit, and delete blogs.';

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/admin/blogs'); ?>
    <link rel="stylesheet" href="../css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>

    <main class="container page">
        <div class="section-title" style="margin-top:0;">
            <h2>Manage Blogs</h2>
            <span>CRUD</span>
        </div>

        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
            <a class="btn btn-primary" href="blog_edit.php">+ Add Blog</a>
            <a class="btn" href="index.php">← Dashboard</a>
            <a class="btn" href="logout.php">Logout</a>
        </div>

        <div style="margin-top:18px; overflow:auto;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Slug</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!$blogs): ?>
                        <tr>
                            <td colspan="5">No blogs yet.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($blogs as $b): ?>
                            <tr>
                                <td><?php echo e($b['title']); ?></td>
                                <td><?php echo e($b['category']); ?></td>
                                <td><?php echo e($b['slug']); ?></td>
                                <td><?php echo e($b['created_at']); ?></td>
                                <td>
                                    <a class="btn" href="blog_edit.php?slug=<?php echo urlencode($b['slug']); ?>">Edit</a>
                                    <form method="post" action="blogs.php" style="display:inline;" onsubmit="return confirm('Delete this blog?');">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="delete_slug" value="<?php echo e($b['slug']); ?>" />
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
    // Handle delete AFTER rendering (simpler for this beginner project).
    if (isset($_POST['do_delete']) && ($_POST['delete_slug'] ?? '') !== '') {
        if (!csrf_check()) {
            echo '<div class="notice err">Invalid security token. Please try again.</div>';
        } else {
            $delSlug = trim((string)$_POST['delete_slug']);
            db_exec('DELETE FROM blogs WHERE slug = :slug', [':slug' => $delSlug]);
            header('Location: blogs.php');
            exit;
        }
    }
    ?>

</body>

</html>