<?php

// ShuzhFit - Contact page
// Stores messages into the `contacts` table via the shared DB helper.

declare(strict_types=1);

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/seo.php';

$success = null;
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_check()) {
        $error = 'Your session expired. Please try again.';
    } else {
        $name = mb_substr(trim((string)($_POST['name'] ?? '')), 0, 100);
        $email = mb_substr(trim((string)($_POST['email'] ?? '')), 0, 100);
        $message = mb_substr(trim((string)($_POST['message'] ?? '')), 0, 4000);

        if ($name === '' || $email === '' || $message === '') {
            $error = 'Please fill in all fields.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = 'Please enter a valid email.';
        } else {
            try {
                db_exec(
                    'INSERT INTO contacts (name, email, message) VALUES (:name, :email, :message)',
                    [':name' => $name, ':email' => $email, ':message' => $message]
                );
                $success = 'Message sent! Thank you for contacting ShuzhFit.';
            } catch (Throwable $e) {
                $error = 'Could not send your message right now. Please try again later.';
            }
        }
    }
}

$pageTitle = 'Contact | ShuzhFit';
$desc = 'Send a message to the ShuzhFit team.';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php render_seo_tags($pageTitle, $desc, '/contact'); ?>
    <link rel="stylesheet" href="css/style.css" />
</head>
<body>
    <?php require __DIR__ . '/includes/header.php'; ?>

    <section class="page">
        <div class="section-title">
            <h2>Contact</h2>
            <span>Send a message</span>
        </div>

        <div class="form-wrap">
            <div class="form-card">
                <?php if ($success): ?>
                    <div class="notice ok"><?= e($success) ?></div>
                <?php endif; ?>

                <?php if ($error): ?>
                    <div class="notice err"><?= e($error) ?></div>
                <?php endif; ?>

                <form method="post" action="contact.php" novalidate>
                    <?= csrf_field() ?>
                    <label for="name">Name</label>
                    <input id="name" name="name" type="text" maxlength="100" placeholder="Your name" value="<?= e($_POST['name'] ?? '') ?>" required />

                    <label for="email">Email</label>
                    <input id="email" name="email" type="email" maxlength="100" placeholder="you@example.com" value="<?= e($_POST['email'] ?? '') ?>" required />

                    <label for="message">Message</label>
                    <textarea id="message" name="message" maxlength="4000" placeholder="Write your message..." required><?= e($_POST['message'] ?? '') ?></textarea>

                    <div class="form-actions">
                        <button class="btn btn-primary" type="submit">Send Message</button>
                        <a class="btn" href="index.php">Back to Home</a>
                    </div>
                </form>
            </div>
        </div>
    </section>

    <?php require __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
