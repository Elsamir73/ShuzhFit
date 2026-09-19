<?php

/**
 * ShuzhFit - Auth, session & security helpers
 *
 * Provides: session boot, current user, login/register/logout,
 * CSRF protection, flash messages, guest-data claiming.
 *
 * Requires lib/db.php (for e() and the DB helpers) when used.
 */

declare(strict_types=1);

if (!defined('SHUZHFIT_AUTH_LOADED')) {
    define('SHUZHFIT_AUTH_LOADED', true);

    /**
     * Start the session once, with hardened cookie params.
     */
    function auth_session_boot(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['SERVER_PORT'] ?? '') === '443');

        session_set_cookie_params([
            'lifetime' => 60 * 60 * 24 * 30, // 30 days: keeps returning users logged in
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => $isHttps,
        ]);

        session_start();
    }

    /**
     * Get the logged-in user row (null for guests). Cached per request.
     */
    function current_user(): ?array
    {
        static $user = false;
        if ($user !== false) {
            return $user;
        }

        auth_session_boot();

        $userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;
        if ($userId <= 0) {
            return $user = null;
        }

        $user = db_fetch_one(
            'SELECT id, name, email, height_cm, goal_type, activity_level, weekly_workout_target, target_weight_kg
             FROM users WHERE id = :id LIMIT 1',
            [':id' => $userId]
        );

        if (!$user) {
            // Account deleted mid-session
            unset($_SESSION['user_id']);
            $user = null;
        }

        return $user;
    }

    /**
     * Require a logged-in user or redirect to login with a return URL.
     */
    function require_login(): array
    {
        $user = current_user();
        if ($user) {
            return $user;
        }

        $next = $_SERVER['REQUEST_URI'] ?? 'dashboard.php';
        $suffix = str_contains($next, 'login.php') ? '' : '?next=' . urlencode($next);
        header('Location: login.php' . $suffix);
        exit;
    }

    /**
     * CSRF token for the current session.
     */
    function csrf_token(): string
    {
        auth_session_boot();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return (string)$_SESSION['csrf_token'];
    }

    /**
     * Hidden input to embed in every POST form.
     */
    function csrf_field(): string
    {
        return '<input type="hidden" name="csrf_token" value="' . e(csrf_token()) . '" />';
    }

    /**
     * Verify the submitted CSRF token. Call for every state-changing POST.
     */
    function csrf_check(): bool
    {
        auth_session_boot();
        $sent = (string)($_POST['csrf_token'] ?? '');
        return $sent !== '' && hash_equals(csrf_token(), $sent);
    }

    /**
     * Claim guest-era rows (keyed by session id) for a new account.
     * Call BEFORE regenerating the session id on login/registration.
     */
    function claim_guest_data(int $userId, string $oldSessionId): void
    {
        if ($userId <= 0 || $oldSessionId === '') {
            return;
        }

        $tables = ['workout_logs', 'progress_entries', 'user_favorites'];
        foreach ($tables as $table) {
            db_exec(
                "UPDATE {$table} SET user_id = :uid WHERE user_session_id = :sid AND user_id IS NULL",
                [':uid' => $userId, ':sid' => $oldSessionId]
            );
        }
    }

    /**
     * Create an account. Returns [ok(bool), error(string), userId(int)].
     */
    function register_user(string $name, string $email, string $password, string $confirm): array
    {
        $name = trim($name);
        $email = strtolower(trim($email));

        if (mb_strlen($name) < 2 || mb_strlen($name) > 60) {
            return [false, 'Please enter your name (2-60 characters).', 0];
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 100) {
            return [false, 'Please enter a valid email address.', 0];
        }
        if (strlen($password) < 8) {
            return [false, 'Password must be at least 8 characters.', 0];
        }
        if ($password !== $confirm) {
            return [false, 'Passwords do not match.', 0];
        }

        $exists = db_fetch_one('SELECT id FROM users WHERE email = :email LIMIT 1', [':email' => $email]);
        if ($exists) {
            return [false, 'An account with this email already exists. Try logging in.', 0];
        }

        db_exec(
            'INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)',
            [':name' => $name, ':email' => $email, ':password' => password_hash($password, PASSWORD_DEFAULT), ':role' => 'user']
        );

        return [true, '', (int)db_last_insert_id()];
    }

    /**
     * Attempt login. Returns [ok(bool), error(string), userRow(?array)].
     * Includes a small in-session brute-force delay + lockout.
     */
    function login_user(string $email, string $password): array
    {
        auth_session_boot();

        $attempts = (int)($_SESSION['login_attempts'] ?? 0);
        $lockedUntil = (int)($_SESSION['login_locked_until'] ?? 0);
        if ($lockedUntil > time()) {
            $wait = $lockedUntil - time();
            return [false, "Too many attempts. Try again in {$wait} seconds.", null];
        }

        $email = strtolower(trim($email));
        $user = db_fetch_one(
            'SELECT id, name, email, password FROM users WHERE email = :email LIMIT 1',
            [':email' => $email]
        );

        if (!$user || !password_verify($password, (string)$user['password'])) {
            $attempts++;
            $_SESSION['login_attempts'] = $attempts;
            if ($attempts >= 8) {
                $_SESSION['login_locked_until'] = time() + 300;
                $_SESSION['login_attempts'] = 0;
                return [false, 'Too many failed attempts. Locked for 5 minutes.', null];
            }
            usleep(300000); // 0.3s slows brute force without hurting real users
            return [false, 'Invalid email or password.', null];
        }

        unset($_SESSION['login_attempts'], $_SESSION['login_locked_until']);
        return [true, '', ['id' => (int)$user['id'], 'name' => (string)$user['name'], 'email' => (string)$user['email']]];
    }

    /**
     * Establish the logged-in session (after register or login).
     */
    function auth_login_session(int $userId): void
    {
        $oldSessionId = session_id();
        claim_guest_data($userId, $oldSessionId);
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
    }

    /**
     * Log out completely.
     */
    function auth_logout(): void
    {
        auth_session_boot();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], (bool)$p['secure'], (bool)$p['httponly']);
        }
        session_destroy();
    }
}


    /**
     * One-shot flash message helpers.
     */
    function flash_set(string $type, string $message): void
    {
        auth_session_boot();
        $_SESSION['flash'] = ['type' => $type, 'message' => $message];
    }

    function flash_get(): ?array
    {
        auth_session_boot();
        if (empty($_SESSION['flash'])) {
            return null;
        }
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
