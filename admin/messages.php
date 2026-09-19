<?php

// ShuzhFit - Admin contact messages (/admin/messages)

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/seo.php';
require_once __DIR__ . '/../lib/auth.php';

auth_session_boot();
if (!isset($_SESSION['admin_ok']) || $_SESSION['admin_ok'] !== true) {
    header('Location: index.php');
    exit;
}

if (isset($_POST['do_delete']) && ($_POST['delete_id'] ?? '') !== '') {
    if (csrf_check()) {
        db_exec('DELETE FROM contacts WHERE id = :id', [':id' => (int)$_POST['delete_id']]);
    }
    header('Location: messages.php');
    exit;
}

$messages = db_fetch_all(
    'SELECT id, name, email, message, created_at FROM contacts ORDER BY created_at DESC LIMIT 200'
);

$pageTitle = 'Contact Messages | ShuzhFit';
$desc = 'Review contact form messages.';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/admin/messages'); ?>
    <link rel="stylesheet" href="../css/style.css" />
</head>
<body>
    <div class="bg-glow" aria-hidden="true"></div>

    <main class="container page">
        <div class="section-title" style="margin-top:0;">
            <h2>Contact Messages</h2>
            <span>Inbox</span>
        </div>

        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
            <a class="btn" href="index.php">← Dashboard</a>
            <a class="btn" href="logout.php">Logout</a>
        </div>

        <div style="margin-top:18px; overflow:auto;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!$messages): ?>
                        <tr><td colspan="5">No messages yet.</td></tr>
                    <?php else: ?>
                        <?php foreach ($messages as $m): ?>
                            <tr>
                                <td><?php echo e((string)$m['name']); ?></td>
                                <td><a href="mailto:<?php echo e((string)$m['email']); ?>"><?php echo e((string)$m['email']); ?></a></td>
                                <td style="max-width:340px;"><?php echo nl2br(e((string)$m['message'])); ?></td>
                                <td><?php echo e((string)$m['created_at']); ?></td>
                                <td>
                                    <form method="post" action="messages.php" style="display:inline;" onsubmit="return confirm('Delete this message?');">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="delete_id" value="<?php echo (int)$m['id']; ?>" />
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
</body>
</html>
