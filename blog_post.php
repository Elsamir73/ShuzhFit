<?php
// ShuzhFit - Blog post page (/blog/post/{slug})
// Pure PHP + MySQL.

//require __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/seo.php';

auth_session_boot();

$slug = trim($_GET['slug'] ?? '');
if ($slug === '') {
    header('Location: blog.php');
    exit;
}

$blog = db_fetch_one(
    'SELECT id, title, slug, category, image, author, content, created_at FROM blogs WHERE slug = :slug LIMIT 1',
    [':slug' => $slug]
);

if (!$blog) {
    http_response_code(404);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_comment'])) {
    if (!csrf_check()) {
        // Bad token: just re-render.
    } else {
        $author = mb_substr(trim((string)($_POST['comment_author'] ?? 'ShuzhFit Reader')), 0, 120);
        $message = mb_substr(trim((string)($_POST['comment_message'] ?? '')), 0, 2000);

        if ($message !== '') {
            db_exec(
                'INSERT INTO content_comments (item_type, item_id, item_slug, author, message) VALUES (:type, :item_id, :slug, :author, :message)',
                [
                    ':type' => 'blog',
                    ':item_id' => (int)($blog['id'] ?? 0),
                    ':slug' => $slug,
                    ':author' => $author !== '' ? $author : 'ShuzhFit Reader',
                    ':message' => $message,
                ]
            );
        }
    }
    header('Location: blog_post.php?slug=' . urlencode($slug) . '#comments');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['toggle_favorite'])) {
    if (csrf_check() && $blog) {
        $user = current_user();
        if ($user) {
            $sessionId = 'user-' . (int)$user['id'];
            $existing = db_fetch_one(
                'SELECT id FROM user_favorites WHERE user_session_id = :sid AND item_type = :type AND item_id = :iid LIMIT 1',
                [':sid' => $sessionId, ':type' => 'blog', ':iid' => (int)$blog['id']]
            );
            if ($existing) {
                db_exec('DELETE FROM user_favorites WHERE id = :fid', [':fid' => (int)$existing['id']]);
                flash_set('ok', 'Removed from favorites.');
            } else {
                db_exec(
                    'INSERT INTO user_favorites (user_session_id, item_type, item_id, item_slug, item_title) VALUES (:sid, :item_type, :item_id, :item_slug, :item_title)',
                    [
                        ':sid' => $sessionId,
                        ':item_type' => 'blog',
                        ':item_id' => (int)$blog['id'],
                        ':item_slug' => $slug,
                        ':item_title' => (string)$blog['title'],
                    ]
                );
                flash_set('ok', 'Saved to favorites.');
            }
        }
    }
    header('Location: blog_post.php?slug=' . urlencode($slug));
    exit;
}


// Related blogs (same category)
$relatedBlogs = db_fetch_all(
    'SELECT id, title, slug, category, image, created_at FROM blogs WHERE category = :cat AND slug <> :slug ORDER BY created_at DESC LIMIT 3',
    [':cat' => ($blog['category'] ?? ''), ':slug' => $slug]
);

// Related exercises: simple matching by category keywords
$relatedExercises = [];
$cat = $blog['category'] ?? '';
if ($cat !== '') {
    $keywords = [
        'Workout Guides' => ['squat', 'press', 'push', 'pull', 'row', 'lat', 'press', 'exercise'],
        'Nutrition' => ['protein', 'creatine', 'supplement'],
        'Motivation' => ['consistency', 'discipline'],
        'My Journey' => ['journey'],
        'Supplement Guides' => ['creatine', 'protein', 'supplement'],
    ];

    $muscleLike = $keywords[$cat] ?? [];

    // If no meaningful keywords, still show newest exercises
    if ($muscleLike) {
        $likeParts = [];
        $params = [':lim' => (int)3];

        foreach ($muscleLike as $i => $kw) {
            $likeParts[] = 'LOWER(muscles_worked) LIKE :k' . $i;
            $params[':k' . $i] = '%' . strtolower($kw) . '%';
        }
        $where = '(' . implode(' OR ', $likeParts) . ')';
        $relatedExercises = db_fetch_all(
            'SELECT id, name, slug, muscles_worked FROM exercises WHERE ' . $where . ' ORDER BY created_at DESC LIMIT :lim',
            $params
        );
    }

    if (!$relatedExercises) {
        $relatedExercises = db_fetch_all('SELECT id, name, slug, muscles_worked FROM exercises ORDER BY created_at DESC LIMIT 3');
    }
}

// Related videos: by exercise mapping for exercises shown
$relatedVideos = [];
if ($blog) {
    $exerciseIds = array_map(fn($x) => (int)$x['id'], $relatedExercises);
    if ($exerciseIds) {
        $in = implode(',', array_fill(0, count($exerciseIds), '?'));
        $sql = 'SELECT id, title, youtube_url, exercise_id, created_at FROM videos WHERE exercise_id IN (' . $in . ') ORDER BY created_at DESC LIMIT 3';
        $stmt = shuzhfit_pdo()->prepare($sql);
        $stmt->execute($exerciseIds);
        $relatedVideos = $stmt->fetchAll();
    }
}

$comments = db_fetch_all(
    'SELECT author, message, created_at FROM content_comments WHERE item_type = :type AND item_slug = :slug ORDER BY created_at DESC LIMIT 10',
    [':type' => 'blog', ':slug' => $slug]
);

require __DIR__ . '/lib/youtube.php';

// SEO
$title = $blog ? seo_title($blog['title'], $blog['category']) : 'Blog Post | ShuzhFit';
$description = $blog ? seo_description($blog['content']) : 'Blog post not found.';

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($title, $description, '/blog/post/' . $blog['slug']); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>
    <?php require __DIR__ . '/includes/header.php'; ?>

    <main class="container page">
        <div style="margin-bottom:16px;">
            <a class="btn" href="blog.php">← Back to Blog</a>
        </div>

        <?php if (!$blog): ?>
            <div class="notice err">Blog post not found.</div>
        <?php else: ?>
            <article class="post">
                <?php
                $normalizeImgUrl = static function (?string $raw): ?string {
                    if (!$raw) return null;
                    $raw = trim($raw);
                    if ($raw === '') return null;
                    if (preg_match('~^https?://~i', $raw)) return $raw;
                    if (str_starts_with($raw, '/images/')) return $raw;
                    if (!str_contains($raw, '/')) return '/images/' . ltrim($raw, '/');
                    if (str_starts_with($raw, 'images/')) return '/' . $raw;
                    return '/' . ltrim($raw, '/');
                };
                $heroImgUrl = $normalizeImgUrl($blog['image'] ?? null);
                ?>
                <div class="post-hero" style="background-image:url('<?php echo e($heroImgUrl ?? ''); ?>')">
                    <?php if (!$blog['image']): ?>
                        <div class="post-hero-fallback">No Featured Image</div>
                    <?php endif; ?>
                </div>

                <div class="post-meta">
                    <span class="tag"><?php echo e($blog['category']); ?></span>
                    <span class="muted">• <?php echo e($blog['created_at']); ?></span>
                    <span class="muted">• By <?php echo e($blog['author']); ?></span>
                </div>

                <?php $flashBlog = flash_get(); ?>
                <?php if ($flashBlog): ?>
                    <div class="notice <?= e($flashBlog['type'] === 'ok' ? 'ok' : 'err') ?>" style="margin:12px 0;"><?= e($flashBlog['message']) ?></div>
                <?php endif; ?>

                <?php if ($blogUser = current_user()): ?>
                    <?php
                    $isFavBlog = (bool)db_fetch_one(
                        'SELECT id FROM user_favorites WHERE user_session_id = :sid AND item_type = :type AND item_id = :iid LIMIT 1',
                        [':sid' => 'user-' . (int)$blogUser['id'], ':type' => 'blog', ':iid' => (int)$blog['id']]
                    );
                    ?>
                    <form method="post" action="blog_post.php?slug=<?php echo urlencode($blog['slug']); ?>" style="margin: 14px 0 20px;">
                        <?= csrf_field() ?>
                        <input type="hidden" name="toggle_favorite" value="1" />
                        <button class="btn<?= $isFavBlog ? ' btn-primary' : '' ?>" type="submit">
                            <?= $isFavBlog ? '★ In Favorites — Remove' : '☆ Save to Favorites' ?>
                        </button>
                    </form>
                <?php else: ?>
                    <div style="margin: 14px 0 20px;">
                        <a class="btn" href="login.php?next=<?= urlencode('blog_post.php?slug=' . $slug) ?>">Log in to save favorites</a>
                    </div>
                <?php endif; ?>

                <h1 class="post-title"><?php echo e($blog['title']); ?></h1>

                <div class="post-content">
                    <?php
                    // Content is stored as plain text/HTML from admin.
                    // For beginner editing, we allow basic HTML; if you only want plain text,
                    // replace with nl2br(htmlspecialchars($blog['content']))
                    echo $blog['content'];
                    ?>
                </div>
            </article>

            <section class="related" aria-label="Comments">
                <div class="section-title">
                    <h2>Comments</h2>
                    <span>Community discussion</span>
                </div>

                <div class="form-card" style="margin-bottom:18px;">
                    <form method="post" action="blog_post.php?slug=<?php echo urlencode($blog['slug']); ?>">
                        <?= csrf_field() ?>
                        <label for="comment_author">Name</label>
                        <input id="comment_author" name="comment_author" type="text" placeholder="Your name" value="ShuzhFit Reader" />

                        <label for="comment_message">Comment</label>
                        <textarea id="comment_message" name="comment_message" placeholder="Share your thoughts..." required></textarea>

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

            <section class="related" aria-label="Related content">
                <div class="section-title">
                    <h2>Related</h2>
                    <span>Exercises, blogs, and videos</span>
                </div>

                <div class="related-grid">
                    <div class="related-col">
                        <h3 class="rel-heading">Related Exercises</h3>
                        <?php if (!$relatedExercises): ?>
                            <div class="muted">No related exercises found.</div>
                        <?php else: ?>
                            <ul class="list">
                                <?php foreach ($relatedExercises as $ex): ?>
                                    <li><a href="exercise_page.php?slug=<?php echo urlencode($ex['slug']); ?>"><?php echo e($ex['name']); ?></a></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>

                    <div class="related-col">
                        <h3 class="rel-heading">Related Blogs</h3>
                        <?php if (!$relatedBlogs): ?>
                            <div class="muted">No related blogs found.</div>
                        <?php else: ?>
                            <ul class="list">
                                <?php foreach ($relatedBlogs as $rb): ?>
                                    <li><a href="blog_post.php?slug=<?php echo urlencode($rb['slug']); ?>"><?php echo e($rb['title']); ?></a></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>

                    <div class="related-col">
                        <h3 class="rel-heading">Related Videos</h3>
                        <?php if (!$relatedVideos): ?>
                            <div class="muted">No related videos found.</div>
                        <?php else: ?>
                            <?php foreach ($relatedVideos as $v): ?>
                                <div class="mini-video">
                                    <strong><?php echo e($v['title']); ?></strong>
                                    <div class="mini-video-frame">
                                        <?php render_youtube_embed($v['youtube_url'], $v['title']); ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </section>

        <?php endif; ?>
    </main>

    <?php require __DIR__ . '/includes/footer.php'; ?>
</body>

</html>