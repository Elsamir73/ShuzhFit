<?php
// ShuzhFit - Admin Video add/edit

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/seo.php';
require __DIR__ . '/../lib/youtube.php';
require_once __DIR__ . '/../lib/auth.php';

auth_session_boot();
if (!isset($_SESSION['admin_ok']) || $_SESSION['admin_ok'] !== true) {
    header('Location: index.php');
    exit;
}

$id = (int)($_GET['id'] ?? 0);
$editing = $id > 0;

$existing = null;
if ($editing) {
    $existing = db_fetch_one('SELECT * FROM videos WHERE id = :id LIMIT 1', [':id' => $id]);
}

$notice = null;
$error = null;

$exercises = db_fetch_all('SELECT id, name FROM exercises ORDER BY name ASC');

if (isset($_POST['save'])) {
    if (!csrf_check()) {
        $error = 'Invalid security token. Please try again.';
    } else {
    $title = trim((string)($_POST['title'] ?? ''));
    $youtubeUrl = trim((string)($_POST['youtube_url'] ?? ''));
    $exerciseId = (int)($_POST['exercise_id'] ?? 0);

    if ($title === '' || $youtubeUrl === '') {
        $error = 'Title and YouTube URL are required.';
    } else {
        $embedCheck = youtube_embed_url($youtubeUrl);
        if (!$embedCheck) {
            $error = 'Invalid YouTube URL format.';
        } else {
            if ($editing) {
                db_exec(
                    'UPDATE videos SET title=:title, youtube_url=:url, exercise_id=:eid WHERE id=:id',
                    [':title' => $title, ':url' => $youtubeUrl, ':eid' => ($exerciseId > 0 ? $exerciseId : null), ':id' => $id]
                );
                $notice = 'Video updated.';
            } else {
                db_exec(
                    'INSERT INTO videos (title, youtube_url, exercise_id) VALUES (:title,:url,:eid)',
                    [':title' => $title, ':url' => $youtubeUrl, ':eid' => ($exerciseId > 0 ? $exerciseId : null)]
                );
                $notice = 'Video created.';
            }
        }
    }
    }
}

$prefill = [
    'title' => $existing['title'] ?? '',
    'youtube_url' => $existing['youtube_url'] ?? '',
    'exercise_id' => (int)($existing['exercise_id'] ?? 0),
];

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?php echo e($editing ? 'Edit Video' : 'Add Video'); ?> | ShuzhFit</title>
    <meta name="description" content="Admin video editor" />
    <link rel="stylesheet" href="../css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>

    <main class="container page">
        <div class="section-title" style="margin-top:0;">
            <h2><?php echo $editing ? 'Edit YouTube Link' : 'Add YouTube Link'; ?></h2>
            <span>Shorts / long-form / multiple embeds</span>
        </div>

        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
            <a class="btn" href="videos.php">← Back</a>
            <a class="btn" href="index.php">Dashboard</a>
            <a class="btn" href="logout.php">Logout</a>
        </div>

        <?php if ($notice): ?><div class="notice ok" style="margin-top:14px;"><?php echo e($notice); ?></div><?php endif; ?>
        <?php if ($error): ?><div class="notice err" style="margin-top:14px;"><?php echo e($error); ?></div><?php endif; ?>

        <div class="form-wrap" style="margin-top:18px;">
            <div class="form-card">
                <form method="post" action="">
                    <?= csrf_field() ?>
                    <label>Video Title</label>
                    <input type="text" name="title" required value="<?php echo e($prefill['title']); ?>" />

                    <label>YouTube URL (admin only)</label>
                    <input type="text" name="youtube_url" required placeholder="https://www.youtube.com/shorts/VIDEOID" value="<?php echo e($prefill['youtube_url']); ?>" />

                    <label>Related Exercise (optional)</label>
                    <select name="exercise_id" style="width:100%; margin-top:6px; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.25); color:var(--text);">
                        <option value="0">— Not linked to an exercise —</option>
                        <?php foreach ($exercises as $ex): ?>
                            <?php $sel = ((int)$prefill['exercise_id'] === (int)$ex['id']) ? 'selected' : ''; ?>
                            <option value="<?php echo (int)$ex['id']; ?>" <?php echo $sel; ?>><?php echo e($ex['name']); ?></option>
                        <?php endforeach; ?>
                    </select>

                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit" name="save">Save</button>
                        <a class="btn" href="videos.php">Cancel</a>
                    </div>

                    <p class="notice" style="margin-top:14px; color:var(--muted);">
                        System will embed automatically after saving.
                    </p>

                    <div style="margin-top:14px;">
                        <strong>Embed preview:</strong>
                        <div style="margin-top:10px;">
                            <?php
                            $preview = $prefill['youtube_url'];
                            if ($preview) {
                                render_youtube_embed($preview, $prefill['title'] ?: 'YouTube video');
                            }
                            ?>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    </main>

</body>

</html>