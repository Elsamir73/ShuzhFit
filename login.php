<?php

// ShuzhFit - Login
declare(strict_types=1);

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/seo.php';

auth_session_boot();

// Already logged in? Straight to the dashboard.
if (current_user()) {
    header('Location: dashboard.php');
    exit;
}

$error = null;
$emailPrefill = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_check()) {
        $error = 'Your session expired. Please try again.';
    } else {
        $emailPrefill = trim((string)($_POST['email'] ?? ''));
        $password = (string)($_POST['password'] ?? '');

        [$ok, $err, $user] = login_user($emailPrefill, $password);
        if ($ok) {
            auth_login_session((int)$user['id']);
            flash_set('ok', 'Welcome back, ' . $user['name'] . '!');
            $next = (string)($_POST['next'] ?? '');
            $target = 'dashboard.php';
            if ($next !== '' && str_starts_with($next, '/') && !str_contains($next, '//')) {
                $target = $next;
            }
            header('Location: ' . $target);
            exit;
        }
        $error = $err;
    }
}

$flash = flash_get();
$pageTitle = 'Log In | ShuzhFit';
$desc = 'Log in to your ShuzhFit training tracker.';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/login'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>
<body>
    <?php require __DIR__ . '/includes/header.php'; ?>

    <main class="container page">
        <div class="auth-wrap">
            <div class="form-card">
                <div class="section-title" style="margin-top:0;">
                    <h2>Welcome back</h2>
                    <span>Log in to continue your journey</span>
                </div>

                <?php if ($flash): ?>
                    <div class="notice <?= e($flash['type'] === 'ok' ? 'ok' : 'err') ?>"><?= e($flash['message']) ?></div>
                <?php endif; ?>

                <?php if ($error): ?>
                    <div class="notice err"><?= e($error) ?></div>
                <?php endif; ?>

                <form method="post" action="login.php">
                    <?= csrf_field() ?>
                    <?php if (!empty($_GET['next'])): ?>
                        <input type="hidden" name="next" value="<?= e((string)$_GET['next']) ?>" />
                    <?php endif; ?>

                    <label for="email">Email</label>
                    <input id="email" name="email" type="email" autocomplete="email" required value="<?= e($emailPrefill) ?>" placeholder="you@example.com" />

                    <label for="password">Password</label>
                    <input id="password" name="password" type="password" autocomplete="current-password" required placeholder="Your password" />

                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit">Log In</button>
                        <a class="btn" href="register.php">Create Account</a>
                    </div>
                </form>

                <p class="muted" style="margin-top:14px; font-size:14px;">
                    Your workouts, progress, and goals stay private to your account.
                </p>
            </div>
        </div>
    </main>

    <?php require __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
