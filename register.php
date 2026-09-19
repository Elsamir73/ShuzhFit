<?php

// ShuzhFit - Create account
declare(strict_types=1);

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/seo.php';

auth_session_boot();

if (current_user()) {
    header('Location: dashboard.php');
    exit;
}

$error = null;
$prefill = ['name' => '', 'email' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_check()) {
        $error = 'Your session expired. Please try again.';
    } else {
        $prefill['name'] = trim((string)($_POST['name'] ?? ''));
        $prefill['email'] = trim((string)($_POST['email'] ?? ''));

        [$ok, $err, $userId] = register_user(
            $prefill['name'],
            $prefill['email'],
            (string)($_POST['password'] ?? ''),
            (string)($_POST['confirm'] ?? '')
        );

        if ($ok) {
            auth_login_session($userId);
            flash_set('ok', 'Account created. Welcome to ShuzhFit, ' . $prefill['name'] . '!');
            header('Location: profile.php?welcome=1');
            exit;
        }
        $error = $err;
    }
}

$pageTitle = 'Create Account | ShuzhFit';
$desc = 'Create your free ShuzhFit account to track workouts, nutrition, and progress.';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/register'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>
<body>
    <?php require __DIR__ . '/includes/header.php'; ?>

    <main class="container page">
        <div class="auth-wrap">
            <div class="form-card">
                <div class="section-title" style="margin-top:0;">
                    <h2>Create your account</h2>
                    <span>Free forever · 30 seconds</span>
                </div>

                <?php if ($error): ?>
                    <div class="notice err"><?= e($error) ?></div>
                <?php endif; ?>

                <form method="post" action="register.php">
                    <?= csrf_field() ?>

                    <label for="name">Name</label>
                    <input id="name" name="name" type="text" autocomplete="name" required maxlength="60" value="<?= e($prefill['name']) ?>" placeholder="Your name" />

                    <label for="email">Email</label>
                    <input id="email" name="email" type="email" autocomplete="email" required value="<?= e($prefill['email']) ?>" placeholder="you@example.com" />

                    <label for="password">Password (min 8 characters)</label>
                    <input id="password" name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="Choose a strong password" />

                    <label for="confirm">Confirm password</label>
                    <input id="confirm" name="confirm" type="password" autocomplete="new-password" required minlength="8" placeholder="Repeat your password" />

                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit">Create Account</button>
                        <a class="btn" href="login.php">I already have one</a>
                    </div>
                </form>
            </div>
        </div>
    </main>

    <?php require __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
