<?php
// ShuzhFit - Single exercise page (/exercises/{slug})

//require __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/seo.php';
require __DIR__ . '/lib/youtube.php';

auth_session_boot();

$slug = trim($_GET['slug'] ?? '');
if ($slug === '') {
    header('Location: exercises.php');
    exit;
}

$exercise = db_fetch_one(
    'SELECT id, name, slug, muscles_worked, benefits, form_guide, mistakes, reps, created_at FROM exercises WHERE slug = :slug LIMIT 1',
    [':slug' => $slug]
);

if (!$exercise) {
    http_response_code(404);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_comment'])) {
    if (!csrf_check()) {
        // Silently reject bad tokens; the form will re-render with a fresh one.
    } else {
        $author = mb_substr(trim((string)($_POST['comment_author'] ?? 'ShuzhFit Reader')), 0, 120);
        $message = mb_substr(trim((string)($_POST['comment_message'] ?? '')), 0, 2000);

        if ($message !== '') {
            db_exec(
                'INSERT INTO content_comments (item_type, item_id, item_slug, author, message) VALUES (:type, :item_id, :slug, :author, :message)',
                [
                    ':type' => 'exercise',
                    ':item_id' => (int)($exercise['id'] ?? 0),
                    ':slug' => $slug,
                    ':author' => $author !== '' ? $author : 'ShuzhFit Reader',
                    ':message' => $message,
                ]
            );
        }
    }
    header('Location: exercise_page.php?slug=' . urlencode($slug) . '#comments');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['toggle_favorite'])) {
    if (csrf_check() && $exercise) {
        $user = current_user();
        if ($user) {
            $sessionId = 'user-' . (int)$user['id'];
            $existing = db_fetch_one(
                'SELECT id FROM user_favorites WHERE user_session_id = :sid AND item_type = :type AND item_id = :iid LIMIT 1',
                [':sid' => $sessionId, ':type' => 'exercise', ':iid' => (int)$exercise['id']]
            );
            if ($existing) {
                db_exec('DELETE FROM user_favorites WHERE id = :fid', [':fid' => (int)$existing['id']]);
                flash_set('ok', 'Removed from favorites.');
            } else {
                db_exec(
                    'INSERT INTO user_favorites (user_session_id, item_type, item_id, item_slug, item_title) VALUES (:sid, :item_type, :item_id, :item_slug, :item_title)',
                    [
                        ':sid' => $sessionId,
                        ':item_type' => 'exercise',
                        ':item_id' => (int)$exercise['id'],
                        ':item_slug' => $slug,
                        ':item_title' => (string)$exercise['name'],
                    ]
                );
                flash_set('ok', 'Saved to favorites.');
            }
        }
    }
    header('Location: exercise_page.php?slug=' . urlencode($slug));
    exit;
}

// Videos for this exercise
$videos = db_fetch_all(
    'SELECT id, title, youtube_url, created_at FROM videos WHERE exercise_id = :eid ORDER BY created_at DESC',
    [':eid' => (int)($exercise['id'] ?? 0)]
);

// Related exercises: by shared muscles_worked keywords (basic)
$relatedExercises = [];
if ($exercise) {
    $muscles = strtolower($exercise['muscles_worked'] ?? '');
    $parts = array_filter(array_map('trim', preg_split('/[,]+/', $muscles)));
    $likeParts = [];
    $params = [':lim' => 3];

    foreach ($parts as $i => $p) {
        if (strlen($p) < 3) continue;
        $likeParts[] = 'LOWER(muscles_worked) LIKE :m' . $i;
        $params[':m' . $i] = '%' . $p . '%';
    }

    if ($likeParts) {
        $where = '(' . implode(' OR ', $likeParts) . ')';
        $relatedExercises = db_fetch_all(
            'SELECT id, name, slug, muscles_worked FROM exercises WHERE id <> :id AND ' . $where . ' ORDER BY created_at DESC LIMIT :lim',
            array_merge([':id' => (int)$exercise['id']], $params)
        );
    }

    if (!$relatedExercises) {
        $relatedExercises = db_fetch_all(
            'SELECT id, name, slug, muscles_worked FROM exercises WHERE id <> :id ORDER BY created_at DESC LIMIT 3',
            [':id' => (int)$exercise['id']]
        );
    }
}

// Related blogs/videos (simple)
$relatedBlogs = [];
$relatedVideos = [];
if ($exercise) {
    // by same muscles keyword overlap is complex; show newest in relevant category via content matching
    $relatedBlogs = db_fetch_all(
        'SELECT id, title, slug, category, created_at FROM blogs ORDER BY created_at DESC LIMIT 3'
    );

    // related videos: newest videos excluding the current exercise
    $relatedVideos = db_fetch_all(
        'SELECT id, title, youtube_url, exercise_id, created_at FROM videos WHERE exercise_id <> :eid ORDER BY created_at DESC LIMIT 3',
        [':eid' => (int)$exercise['id']]
    );
}

$comments = [];
if ($exercise) {
    $comments = db_fetch_all(
        'SELECT author, message, created_at FROM content_comments WHERE item_type = :type AND item_slug = :slug ORDER BY created_at DESC LIMIT 10',
        [':type' => 'exercise', ':slug' => $slug]
    );
}

$pageTitle = $exercise ? seo_title($exercise['name']) : 'Exercise | ShuzhFit';
$desc = $exercise ? seo_description($exercise['benefits'] . ' ' . $exercise['form_guide']) : 'Exercise not found.';

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/exercises/' . ($exercise['slug'] ?? '')); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>
    <?php require __DIR__ . '/includes/header.php'; ?>

    <main class="container page">
        <div style="margin-bottom:16px;">
            <a class="btn" href="exercises.php">← Back to Exercises</a>
        </div>

        <?php if (!$exercise): ?>
            <div class="notice err">Exercise not found.</div>
        <?php else: ?>
            <article class="post">
                <div class="section-title">
                    <h2><?php echo e($exercise['name']); ?></h2>
                    <span>Exercise details</span>
                </div>

                <?php $flashEx = flash_get(); ?>
                <?php if ($flashEx): ?>
                    <div class="notice <?= e($flashEx['type'] === 'ok' ? 'ok' : 'err') ?>" style="margin:12px 0;"><?= e($flashEx['message']) ?></div>
                <?php endif; ?>

                <?php if ($exerciseUser = current_user()): ?>
                    <?php
                    $isFav = (bool)db_fetch_one(
                        'SELECT id FROM user_favorites WHERE user_session_id = :sid AND item_type = :type AND item_id = :iid LIMIT 1',
                        [':sid' => 'user-' . (int)$exerciseUser['id'], ':type' => 'exercise', ':iid' => (int)$exercise['id']]
                    );
                    ?>
                    <form method="post" action="exercise_page.php?slug=<?php echo urlencode($exercise['slug']); ?>" style="margin: 12px 0 18px;">
                        <?= csrf_field() ?>
                        <input type="hidden" name="toggle_favorite" value="1" />
                        <button class="btn<?= $isFav ? ' btn-primary' : '' ?>" type="submit">
                            <?= $isFav ? '★ In Favorites — Remove' : '☆ Save to Favorites' ?>
                        </button>
                        <a class="btn" href="workout.php">Track This Exercise</a>
                    </form>
                <?php else: ?>
                    <div style="margin: 12px 0 18px; display:flex; gap:10px; flex-wrap:wrap;">
                        <a class="btn" href="login.php?next=<?= urlencode('exercise_page.php?slug=' . $slug) ?>">Log in to save favorites</a>
                        <a class="btn btn-primary" href="workout.php">Track This Exercise</a>
                    </div>
                <?php endif; ?>

                <div class="meta-row">
                    <div class="meta-box">
                        <div class="muted">Muscles Worked</div>
                        <div class="value"><?php echo nl2br(e($exercise['muscles_worked'])); ?></div>
                    </div>
                    <div class="meta-box">
                        <div class="muted">Sets & Reps</div>
                        <div class="value"><?php echo nl2br(e($exercise['reps'])); ?></div>
                    </div>
                </div>

                <section class="info-block">
                    <h3>Benefits</h3>
                    <div class="prose"><?php echo $exercise['benefits']; ?></div>
                </section>

                <section class="info-block">
                    <h3>Proper Form</h3>
                    <div class="prose"><?php echo $exercise['form_guide']; ?></div>
                </section>

                <section class="info-block">
                    <h3>Common Mistakes</h3>
                    <div class="prose"><?php echo $exercise['mistakes']; ?></div>
                </section>

                <section class="info-block" aria-label="YouTube videos">
                    <h3>YouTube Videos</h3>
                    <p class="muted">Admin can add Shorts, long-form, or multiple videos via YouTube URL. We embed automatically.</p>

                    <?php if (!$videos): ?>
                        <div class="notice err">No videos added for this exercise yet.</div>
                    <?php else: ?>
                        <div class="video-stack">
                            <?php foreach ($videos as $v): ?>
                                <div class="video-card">
                                    <strong><?php echo e($v['title']); ?></strong>
                                    <div class="mini-video-frame">
                                        <?php render_youtube_embed($v['youtube_url'], $v['title']); ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </section>

                <section class="related" aria-label="Comments">
                    <div class="section-title">
                        <h2>Comments</h2>
                        <span>Community discussion</span>
                    </div>

                    <div class="form-card" style="margin-bottom:18px;">
                        <form method="post" action="exercise_page.php?slug=<?php echo urlencode($exercise['slug']); ?>">
                            <?= csrf_field() ?>
                            <label for="comment_author">Name</label>
                            <input id="comment_author" name="comment_author" type="text" placeholder="Your name" value="ShuzhFit Reader" />

                            <label for="comment_message">Comment</label>
                            <textarea id="comment_message" name="comment_message" placeholder="Share your exercise tips..." required></textarea>

                            <div class="form-actions">
                                <button class="btn btn-primary" type="submit" name="submit_comment">Post Comment</button>
                            </div>
                        </form>
                    </div>

                    <?php if (!$comments): ?>
                        <div class="muted">No comments yet. Be the first to share.</div>
                    <?php else: ?>
                        <div class="card" style="padding:18px;">
                            <ul class="list">
                                <?php foreach ($comments as $comment): ?>
                                    <li>
                                        <strong><?php echo e((string)$comment['author']); ?></strong>
                                        <div class="muted" style="font-size:13px; margin-top:4px;">
                                            <?php echo e((string)$comment['created_at']); ?>
                                        </div>
                                        <div style="margin-top:8px; color:var(--muted);">
                                            <?php echo e((string)$comment['message']); ?>
                                        </div>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endif; ?>
                </section>

                <section class="related" aria-label="Related exercises">
                    <div class="section-title">
                        <h2>Related</h2>
                        <span>Exercises, blogs & videos</span>
                    </div>

                    <div class="related-grid">
                        <div class="related-col">
                            <h3 class="rel-heading">Related Exercises</h3>
                            <ul class="list">
                                <?php foreach ($relatedExercises as $rx): ?>
                                    <li><a href="exercise_page.php?slug=<?php echo urlencode($rx['slug']); ?>"><?php echo e($rx['name']); ?></a></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>

                        <div class="related-col">
                            <h3 class="rel-heading">Related Blogs</h3>
                            <ul class="list">
                                <?php foreach ($relatedBlogs as $rb): ?>
                                    <li><a href="blog_post.php?slug=<?php echo urlencode($rb['slug']); ?>"><?php echo e($rb['title']); ?></a></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>

                        <div class="related-col">
                            <h3 class="rel-heading">Related Videos</h3>
                            <?php if (!$relatedVideos): ?>
                                <div class="muted">No related videos found.</div>
                            <?php else: ?>
                                <?php foreach ($relatedVideos as $rv): ?>
                                    <div class="mini-video">
                                        <strong><?php echo e($rv['title']); ?></strong>
                                        <div class="mini-video-frame">
                                            <?php render_youtube_embed($rv['youtube_url'], $rv['title']); ?>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    </div>
                </section>

            </article>
        <?php endif; ?>
    </main>

    <?php require __DIR__ . '/includes/footer.php'; ?>
</body>

</html>