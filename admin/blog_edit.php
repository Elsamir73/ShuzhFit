<?php
// ShuzhFit - Admin blog add/edit

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/seo.php';
require_once __DIR__ . '/../lib/auth.php';

auth_session_boot();
if (!isset($_SESSION['admin_ok']) || $_SESSION['admin_ok'] !== true) {
    header('Location: index.php');
    exit;
}

$slug = trim($_GET['slug'] ?? '');
$editing = $slug !== '';

$existing = null;
if ($editing) {
    $existing = db_fetch_one('SELECT * FROM blogs WHERE slug = :slug LIMIT 1', [':slug' => $slug]);
}

$notice = null;
$error = null;

if (isset($_POST['save'])) {
    if (!csrf_check()) {
        $error = 'Invalid security token. Please try again.';
    } else {
    $title = trim((string)($_POST['title'] ?? ''));
    $category = trim((string)($_POST['category'] ?? ''));
    $author = trim((string)($_POST['author'] ?? 'ShuzhFit'));
    $image = trim((string)($_POST['image'] ?? ''));
    $content = (string)($_POST['content'] ?? '');

    if ($title === '' || $category === '' || $content === '') {
        $error = 'Title, category, and content are required.';
    } else {
        $newSlug = slugify($title);

        // Ensure slug unique (if editing, allow same)
        $conflict = db_fetch_one('SELECT id FROM blogs WHERE slug = :slug AND slug <> :orig LIMIT 1', [
            ':slug' => $newSlug,
            ':orig' => $editing ? $slug : '__none__'
        ]);

        if ($conflict) {
            $newSlug = $newSlug . '-' . time();
        }

        $params = [
            ':title' => $title,
            ':slug' => $newSlug,
            ':category' => $category,
            ':image' => $image !== '' ? $image : null,
            ':author' => $author !== '' ? $author : 'ShuzhFit',
            ':content' => $content,
        ];

        if ($editing) {
            db_exec(
                'UPDATE blogs SET title=:title, slug=:slug, category=:category, image=:image, author=:author, content=:content WHERE slug=:orig',
                array_merge($params, [':orig' => $slug])
            );
            $notice = 'Blog updated.';
        } else {
            db_exec(
                'INSERT INTO blogs (title, slug, category, image, author, content) VALUES (:title,:slug,:category,:image,:author,:content)',
                $params
            );
            $notice = 'Blog created.';
        }
    }
    }
}

$prefill = [
    'title' => $existing['title'] ?? '',
    'category' => $existing['category'] ?? 'Workout Guides',
    'author' => $existing['author'] ?? 'ShuzhFit',
    'image' => $existing['image'] ?? '',
    'content' => $existing['content'] ?? '',
];

$pageTitle = $editing ? 'Edit Blog | ShuzhFit' : 'Add Blog | ShuzhFit';
$desc = 'Admin blog editor.';

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?php echo e($pageTitle); ?></title>
    <meta name="description" content="<?php echo e($desc); ?>" />
    <link rel="stylesheet" href="../css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>

    <main class="container page">
        <div class="section-title" style="margin-top:0;">
            <h2><?php echo $editing ? 'Edit Blog' : 'Add Blog'; ?></h2>
            <span>CRUD</span>
        </div>

        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
            <a class="btn" href="blogs.php">← Back to Blogs</a>
            <a class="btn" href="../blog.php">View Blog List</a>
            <?php if ($editing && $existing): ?>
                <a class="btn btn-primary" href="../blog_post.php?slug=<?php echo urlencode($existing['slug']); ?>" target="_blank">View Post</a>
            <?php endif; ?>
            <a class="btn" href="logout.php">Logout</a>
        </div>

        <?php if ($notice): ?><div class="notice ok" style="margin-top:14px;"><?php echo e($notice); ?></div><?php endif; ?>
        <?php if ($error): ?><div class="notice err" style="margin-top:14px;"><?php echo e($error); ?></div><?php endif; ?>

        <div class="form-wrap" style="margin-top:18px;">
            <div class="form-card">
                <form method="post" action="">
                    <?= csrf_field() ?>
                    <label>Title</label>
                    <input type="text" name="title" required value="<?php echo e($prefill['title']); ?>" />

                    <label>Category</label>
                    <select name="category" style="width:100%; margin-top:6px; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.25); color:var(--text);">
                        <?php
                        $cats = ['Workout Guides', 'Nutrition', 'Motivation', 'My Journey', 'Supplement Guides'];
                        foreach ($cats as $c):
                            $sel = $prefill['category'] === $c ? 'selected' : '';
                            echo '<option value="' . e($c) . '" ' . $sel . '>' . e($c) . '</option>';
                        endforeach;
                        ?>
                    </select>

                    <label>Author</label>
                    <input type="text" name="author" value="<?php echo e($prefill['author']); ?>" />

                    <label>Featured Image URL (optional)</label>
                    <input type="text" name="image" placeholder="https://..." value="<?php echo e($prefill['image']); ?>" />

                    <label>Content (HTML allowed)</label>
                    <textarea name="content" required><?php echo e($prefill['content']); ?></textarea>

                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit" name="save">Save</button>
                        <a class="btn" href="blogs.php">Cancel</a>
                    </div>

                    <p class="notice" style="margin-top:14px; color:var(--muted);">
                        Beginner note: Slug is auto-generated from Title. If you update the title, the URL will change.
                    </p>
                </form>
            </div>
        </div>
    </main>

</body>

</html>