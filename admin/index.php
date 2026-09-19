<?php
// ShuzhFit - Admin dashboard (/admin)

require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/seo.php';
require_once __DIR__ . '/../lib/auth.php';

$appConfig = require __DIR__ . '/../config/app.php';

$ADMIN_USER = (string)($appConfig['admin_user'] ?? 'admin');
$ADMIN_PASS = (string)($appConfig['admin_pass'] ?? 'admin123');
$ADMIN_PASS_HASH = (string)($appConfig['admin_pass_hash'] ?? password_hash($ADMIN_PASS, PASSWORD_DEFAULT));

auth_session_boot();

function is_admin_authed(): bool
{
    return isset($_SESSION['admin_ok']) && $_SESSION['admin_ok'] === true;
}

if (isset($_POST['login'])) {
    if (!csrf_check()) {
        // Bad token: fall through to error message below.
    } else {
        $u = trim((string)($_POST['username'] ?? ''));
        $p = (string)($_POST['password'] ?? '');

        if ($u === $ADMIN_USER && password_verify($p, $ADMIN_PASS_HASH)) {
            session_regenerate_id(true);
            $_SESSION['admin_ok'] = true;
            header('Location: index.php');
            exit;
        }
    }
}

if (!is_admin_authed()) {
    $pageTitle = 'Admin Login | ShuzhFit';
    $desc = 'Login to manage blogs, exercises, and YouTube videos.';

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
                <h2>Admin</h2>
                <span>Login</span>
            </div>

            <div class="form-wrap">
                <div class="form-card">
                    <?php if (isset($_POST['login'])): ?>
                        <div class="notice err">Invalid username or password.</div>
                    <?php endif; ?>

                    <form method="post" action="index.php">
                        <?= csrf_field() ?>
                        <label>Username</label>
                        <input type="text" name="username" autocomplete="username" required />

                        <label>Password</label>
                        <input type="password" name="password" autocomplete="current-password" required />

                        <div class="form-actions">
                            <button class="btn btn-primary" type="submit" name="login">Login</button>
                            <a class="btn" href="../index.php">Back to Site</a>
                        </div>
                    </form>
                </div>
            </div>
        </main>

    </body>

    </html>
<?php
    exit;
}

// Stats
$totalBlogs = (int)db_fetch_one('SELECT COUNT(*) AS c FROM blogs')['c'];
$totalExercises = (int)db_fetch_one('SELECT COUNT(*) AS c FROM exercises')['c'];
$totalVideos = (int)db_fetch_one('SELECT COUNT(*) AS c FROM videos')['c'];
$totalComments = (int)db_fetch_one('SELECT COUNT(*) AS c FROM content_comments')['c'];

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin Dashboard | ShuzhFit</title>
    <meta name="description" content="Manage blogs, exercises, and YouTube videos." />
    <link rel="stylesheet" href="../css/style.css" />
</head>

<body>
    <div class="bg-glow" aria-hidden="true"></div>

    <main class="container page">
        <div class="section-title" style="margin-top:0;">
            <h2>Dashboard</h2>
            <span>Admin Panel</span>
        </div>

        <div class="grid" style="grid-template-columns:repeat(4,1fr);">
            <div class="card">
                <h2>Total Blogs</h2>
                <p style="font-size:26px; color:var(--text); font-weight:900; margin-top:8px;"><?php echo e((string)$totalBlogs); ?></p>
            </div>
            <div class="card">
                <h2>Total Exercises</h2>
                <p style="font-size:26px; color:var(--text); font-weight:900; margin-top:8px;"><?php echo e((string)$totalExercises); ?></p>
            </div>
            <div class="card">
                <h2>Total Videos</h2>
                <p style="font-size:26px; color:var(--text); font-weight:900; margin-top:8px;"><?php echo e((string)$totalVideos); ?></p>
            </div>
            <div class="card">
                <h2>Total Comments</h2>
                <p style="font-size:26px; color:var(--text); font-weight:900; margin-top:8px;"><?php echo e((string)$totalComments); ?></p>
            </div>
        </div>

        <section style="margin-top:18px;">
            <div class="section-title">
                <h2>Manage</h2>
                <span>CRUD shortcuts</span>
            </div>

            <div class="grid" style="grid-template-columns:repeat(4,1fr);">
                <div class="card">
                    <h2>Manage Blogs</h2>
                    <p><a class="btn" href="blogs.php">Open Blog Manager</a></p>
                </div>
                <div class="card">
                    <h2>Manage Exercises</h2>
                    <p><a class="btn" href="exercises.php">Open Exercise Manager</a></p>
                </div>
                <div class="card">
                    <h2>Manage Videos</h2>
                    <p><a class="btn" href="videos.php">Open Video Manager</a></p>
                </div>
                <div class="card">
                    <h2>Manage Comments</h2>
                    <p><a class="btn" href="comments.php">Open Comment Manager</a></p>
                </div>
            </div>

            <div class="grid" style="grid-template-columns:repeat(2,1fr); margin-top:18px;">
                <div class="card">
                    <h2>Contact Messages</h2>
                    <p><a class="btn" href="messages.php">Open Inbox</a></p>
                </div>
                <div class="card">
                    <h2>Security note</h2>
                    <p>Set <code>SHUZHFIT_ADMIN_PASS</code> (or <code>ADMIN_PASS</code>) as an environment variable to replace the default admin password.</p>
                </div>
            </div>

            <div class="card" style="margin-top:18px; padding:18px;">
                <h2>Quick admin workflow</h2>
                <ul class="list" style="margin-top:12px;">
                    <li>Review the latest content and community comments before publishing.</li>
                    <li>Use the exercise and blog managers to keep beginner guidance consistent.</li>
                    <li>Refresh video links and nutrition content weekly to keep the library relevant.</li>
                </ul>
            </div>

            <div style="margin-top:14px;">
                <a class="btn" href="logout.php">Logout</a>
            </div>
        </section>
    </main>

</body>

</html>