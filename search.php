<?php
// ShuzhFit - Search page (/search)
// Search blogs + exercises by query.

//require __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/seo.php';
require_once __DIR__ . '/lib/youtube.php';

$q = trim($_GET['q'] ?? '');

$blogResults = [];
$exerciseResults = [];
$videoResults = [];

if ($q !== '') {
    $like = '%' . $q . '%';

    $blogResults = db_fetch_all(
        'SELECT id, title, slug, category, image, author, created_at, content
         FROM blogs
         WHERE title LIKE :like OR category LIKE :like OR content LIKE :like
         ORDER BY created_at DESC
         LIMIT 10',
        [':like' => $like]
    );

    $exerciseResults = db_fetch_all(
        'SELECT id, name, slug, muscles_worked, benefits, reps, created_at
         FROM exercises
         WHERE name LIKE :like OR muscles_worked LIKE :like OR benefits LIKE :like
         ORDER BY created_at DESC
         LIMIT 10',
        [':like' => $like]
    );

    $videoResults = db_fetch_all(
        'SELECT id, title, youtube_url, created_at
         FROM videos
         WHERE title LIKE :like
         ORDER BY created_at DESC
         LIMIT 6',
        [':like' => $like]
    );
}

$pageTitle = seo_title('Search', $q ?: null);
$desc = 'Search matching articles and exercises.';

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/search'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>
    <?php require __DIR__ . '/includes/header.php'; ?>

    <main class="container page">

        <section class="section-title" style="margin-top:0;">
            <h2>Search</h2>
            <span>Blogs + Exercises</span>
        </section>

        <form method="get" action="search.php" class="search-form" role="search" aria-label="Search">
            <input type="text" name="q" placeholder="Search: Chest Press, Creatine, Protein, Back Day..." value="<?php echo e($q); ?>" />
            <button class="btn btn-primary" type="submit">Search</button>
        </form>

        <?php if ($q === ''): ?>
            <div class="notice" style="margin-top:14px;">Try: <strong>Chest Press</strong>, <strong>Creatine</strong>, <strong>Protein</strong>, <strong>Back Day</strong>, <strong>Bicep</strong>, <strong>Squat</strong>.</div>
        <?php else: ?>
            <section class="related" style="margin-top:20px;">
                <div class="related-grid" style="grid-template-columns:1fr 1fr;">
                    <div>
                        <h3 class="rel-heading">Matching Blogs</h3>
                        <?php if (!$blogResults): ?>
                            <div class="muted">No matching blogs.</div>
                        <?php else: ?>
                            <ul class="list">
                                <?php foreach ($blogResults as $b): ?>
                                    <li>
                                        <a href="blog_post.php?slug=<?php echo urlencode($b['slug']); ?>"><?php echo e($b['title']); ?></a>
                                        <div class="muted" style="font-size:13px;"><?php echo e($b['category']); ?> • <?php echo e($b['created_at']); ?></div>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>

                    <div>
                        <h3 class="rel-heading">Matching Exercises</h3>
                        <?php if (!$exerciseResults): ?>
                            <div class="muted">No matching exercises.</div>
                        <?php else: ?>
                            <ul class="list">
                                <?php foreach ($exerciseResults as $ex): ?>
                                    <li>
                                        <a href="exercise_page.php?slug=<?php echo urlencode($ex['slug']); ?>"><?php echo e($ex['name']); ?></a>
                                        <div class="muted" style="font-size:13px;">Muscles: <?php echo e($ex['muscles_worked']); ?></div>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>
                </div>

                <?php if ($videoResults): ?>
                    <div style="margin-top:22px;">
                        <h3 class="rel-heading">Matching Videos</h3>
                        <div class="grid">
                            <?php foreach ($videoResults as $v): ?>
                                <article class="video-card">
                                    <strong><?php echo e($v['title']); ?></strong>
                                    <div class="mini-video-frame" style="margin-top:10px;">
                                        <?php render_youtube_embed((string)$v['youtube_url'], (string)$v['title']); ?>
                                    </div>
                                </article>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
            </section>

        <?php endif; ?>

    </main>

    <?php require __DIR__ . '/includes/footer.php'; ?>
</body>

</html>