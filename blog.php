<?php
// ShuzhFit - Blog listing page (/blog)
// Pure PHP + MySQL. Shows categories, featured image, title, author, date, category, and excerpt.


//require __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/seo.php';
require_once __DIR__ . '/lib/youtube.php';


$allowedCategories = [
    'Workout Guides',
    'Nutrition',
    'Motivation',
    'My Journey',
    'Supplement Guides'
];

$category = trim($_GET['category'] ?? '');
if ($category !== '' && !in_array($category, $allowedCategories, true)) {
    $category = '';
}

$q = trim($_GET['q'] ?? '');

$params = [];
$where = '';
if ($category !== '') {
    $where = 'WHERE category = :category';
    $params[':category'] = $category;
}

// Simple listing with optional category; search is handled on search.php
$sql = "SELECT id, title, slug, category, image, author, content, created_at
        FROM blogs
        {$where}
        ORDER BY created_at DESC
        LIMIT 50";

$blogs = db_fetch_all($sql, $params);

// SEO
$pageTitle = seo_title('Blog', $category ?: null);
$desc = 'Browse workout guides, nutrition tips, motivation, and beginner progress articles.';

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/blog'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>

    <?php require __DIR__ . '/includes/header.php'; ?>

    <main class="container page">
        <section aria-label="Blog header">
            <div class="section-title">
                <h2>Blog</h2>
                <span>Beginner-friendly guides</span>
            </div>

            <div class="filters" style="margin-top:12px;">
                <a class="filter" href="blog.php" style="<?php echo $category === '' ? 'border-color:rgba(255,45,45,0.55);color:var(--text);' : ''; ?>">All</a>
                <?php foreach ($allowedCategories as $cat): ?>
                    <a class="filter" href="blog.php?category=<?php echo urlencode($cat); ?>" style="<?php echo $category === $cat ? 'border-color:rgba(255,45,45,0.55);color:var(--text);' : ''; ?>">
                        <?php echo e($cat); ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </section>

        <section class="blog-grid" aria-label="Blog posts">
            <?php if (!$blogs): ?>
                <div class="notice err">No blogs found.</div>
            <?php else: ?>
                <?php foreach ($blogs as $b):
                    $excerpt = seo_description($b['content']);
                    $img = $b['image'] ? $b['image'] : null;
                    $postUrl = 'blog_post.php?slug=' . urlencode($b['slug']);
                ?>
                    <?php
                    $normalizeImgUrl = static function (?string $raw): ?string {
                        if (!$raw) return null;
                        $raw = trim($raw);
                        if ($raw === '') return null;
                        // Absolute URL
                        if (preg_match('~^https?://~i', $raw)) return $raw;
                        // Already a path under /images
                        if (str_starts_with($raw, '/images/')) return $raw;
                        // Database might store just the filename
                        if (!str_contains($raw, '/')) return '/images/' . ltrim($raw, '/');
                        // Other relative paths (e.g. images/xxx.jpg)
                        if (str_starts_with($raw, 'images/')) return '/' . $raw;
                        return '/' . ltrim($raw, '/');
                    };
                    $imgUrl = $normalizeImgUrl($img);
                    ?>
                    <article class="blog-card">
                        <a href="<?php echo e($postUrl); ?>" aria-label="Open blog post: <?php echo e($b['title']); ?>">
                            <div class="blog-thumb">
                                <?php if ($imgUrl): ?>
                                    <img
                                        src="<?php echo e($imgUrl); ?>"
                                        alt="<?php echo e($b['title']); ?>"
                                        style="width:100%; height:220px; object-fit:cover; border-radius:12px; display:block;"
                                        class="blog-thumb-img"
                                        loading="lazy" />
                                <?php else: ?>
                                    <div class="blog-thumb-fallback">No Image</div>
                                <?php endif; ?>
                            </div>
                            <div class="blog-body">
                                <div class="blog-meta">
                                    <span class="tag"><?php echo e($b['category']); ?></span>
                                    <span class="muted">• <?php echo e($b['created_at']); ?></span>
                                </div>
                                <h3 class="blog-title"><?php echo e($b['title']); ?></h3>
                                <p class="blog-author">By <?php echo e($b['author']); ?></p>
                                <p class="blog-excerpt"><?php echo e($excerpt); ?></p>
                            </div>
                        </a>
                    </article>

                <?php endforeach; ?>
            <?php endif; ?>
        </section>

        <!-- Videos section (YouTube embeds) -->
        <?php
        $videos = db_fetch_all(
            'SELECT id, title, youtube_url, exercise_id, created_at
             FROM videos
             ORDER BY created_at DESC
             LIMIT 12'
        );
        ?>

        <section class="section-block" style="margin-top:28px;">
            <h2>Latest YouTube Videos</h2>

            <div class="grid">
                <?php if (empty($videos)): ?>
                    <article class="video-card" aria-label="YouTube subscription CTA">
                        <div class="mini-video-frame" style="margin-top:0; padding:0;">
                            <div style="padding:18px; border-radius:14px; border:1px solid var(--border); background:rgba(255,45,45,0.08);">
                                <strong style="font-size:18px;">Latest YouTube Videos</strong>
                                <p style="margin:10px 0 0; color:var(--muted); line-height:1.5;">
                                    Want more workout tutorials, fitness motivation, exercise demonstrations, and real fitness journey updates?
                                </p>
                                <p style="margin:10px 0 0; color:var(--muted); line-height:1.5;">
                                    Join our YouTube community and follow ShuzhFit for regular fitness content designed to help beginners stay consistent and build a stronger physique.
                                </p>
                                <a class="btn btn-primary" href="https://youtube.com/@shuzhfit" target="_blank" rel="noopener noreferrer" style="margin-top:14px;">
                                    Subscribe to ShuzhFit on YouTube
                                </a>
                            </div>
                        </div>
                    </article>
                <?php else: ?>
                    <?php foreach ($videos as $v): ?>
                        <?php
                        $youtubeUrl = $v['youtube_url'] ?? '';
                        $videoTitle = $v['title'] ?? 'YouTube video';
                        ?>
                        <article class="video-card">
                            <strong><?php echo e($videoTitle); ?></strong>
                            <div class="mini-video-frame" style="margin-top:10px;">
                                <?php
                                // Short URLs like https://youtube.com/shorts/... need only the ID.
                                // Your lib/youtube.php already converts /shorts/VIDEO_ID -> /embed/VIDEO_ID.
                                render_youtube_embed($youtubeUrl, $videoTitle);
                                ?>
                            </div>
                            <small class="muted" style="display:block; margin-top:8px;">
                                <?php echo e($v['created_at'] ?? ''); ?>
                            </small>
                        </article>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </section>

    </main>


    <?php require __DIR__ . '/includes/footer.php'; ?>

</body>

</html>