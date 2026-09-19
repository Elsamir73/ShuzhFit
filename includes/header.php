<?php
// ShuzhFit - reusable page header (navbar only)
// This file MUST NOT output <!doctype html>, <html>, <head>, or <body>.
// It only outputs the top navigation + mobile menu panel.

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

auth_session_boot();
$headerUser = current_user();

// Highlight the current section
$currentFile = basename((string)($_SERVER['PHP_SELF'] ?? ''));
?>
<link rel="stylesheet" href="css/style.css" />

<div class="bg-glow" aria-hidden="true"></div>

<header class="site-header">
    <div class="container nav-wrap">
        <a class="brand" href="index.php" aria-label="ShuzhFit Home">
            <span class="brand-dot" aria-hidden="true"></span>
            ShuzhFit
        </a>

        <nav class="nav" aria-label="Primary">
            <a class="nav-link<?= $currentFile === 'index.php' ? ' active' : '' ?>" href="index.php">Home</a>
            <?php if ($headerUser): ?>
                <a class="nav-link<?= $currentFile === 'dashboard.php' ? ' active' : '' ?>" href="dashboard.php">Dashboard</a>
            <?php endif; ?>

            <details class="nav-drop">
                <summary class="nav-link">Train</summary>
                <div class="drop-panel">
                    <a href="workout.php">Start Workout</a>
                    <a href="workout_history.php">Workout History</a>
                    <a href="exercises.php">Exercise Library</a>
                </div>
            </details>

            <?php if ($headerUser): ?>
                <a class="nav-link<?= $currentFile === 'progress.php' ? ' active' : '' ?>" href="progress.php">Progress</a>
            <?php endif; ?>

            <details class="nav-drop">
                <summary class="nav-link">Nutrition</summary>
                <div class="drop-panel">
                    <?php if ($headerUser): ?><a href="nutrition_log.php">Food Log</a><?php endif; ?>
                    <a href="meal_planner.php">Meal Planner</a>
                    <a href="nutrition.php">Nutrition Basics</a>
                </div>
            </details>

            <details class="nav-drop">
                <summary class="nav-link">More</summary>
                <div class="drop-panel">
                    <a href="blog.php">Blog</a>
                    <a href="knowledge.php">Knowledge</a>
                    <a href="motivation.php">Motivation</a>
                    <a href="journey.php">My Journey</a>
                    <a href="bmi.php">BMI & Calories</a>
                    <a href="search.php">Search</a>
                </div>
            </details>

            <a class="nav-link<?= $currentFile === 'contact.php' ? ' active' : '' ?>" href="contact.php">Contact</a>

            <?php if ($headerUser): ?>
                <details class="nav-drop nav-user">
                    <summary class="nav-link nav-cta"><?= e((string)$headerUser['name']) ?> ▾</summary>
                    <div class="drop-panel drop-right">
                        <a href="profile.php">My Profile & Goals</a>
                        <a href="logout.php">Log Out</a>
                    </div>
                </details>
            <?php else: ?>
                <a class="nav-link" href="login.php">Log In</a>
                <a class="nav-link nav-cta" href="register.php">Get Started</a>
            <?php endif; ?>
        </nav>

        <!-- Mobile nav toggle button (vanilla JS) -->
        <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" data-nav-toggle>
            <span class="hamburger" aria-hidden="true"></span>
        </button>
    </div>
</header>

<!-- Mobile menu panel -->
<div class="mobile-panel" data-mobile-panel>
    <div class="container mobile-panel-inner">
        <div class="mobile-group">Menu</div>
        <a class="nav-link" href="index.php">Home</a>
        <?php if ($headerUser): ?>
            <a class="nav-link" href="dashboard.php">Dashboard</a>
        <?php endif; ?>

        <div class="mobile-group">Train</div>
        <?php if ($headerUser): ?>
            <a class="nav-link" href="workout.php">Start Workout</a>
            <a class="nav-link" href="workout_history.php">Workout History</a>
        <?php endif; ?>
        <a class="nav-link" href="exercises.php">Exercise Library</a>

        <?php if ($headerUser): ?>
            <div class="mobile-group">Track</div>
            <a class="nav-link" href="progress.php">Progress</a>
            <a class="nav-link" href="nutrition_log.php">Food Log</a>
        <?php endif; ?>

        <div class="mobile-group">Nutrition</div>
        <a class="nav-link" href="meal_planner.php">Meal Planner</a>
        <a class="nav-link" href="nutrition.php">Nutrition Basics</a>

        <div class="mobile-group">Discover</div>
        <a class="nav-link" href="blog.php">Blog</a>
        <a class="nav-link" href="knowledge.php">Knowledge</a>
        <a class="nav-link" href="motivation.php">Motivation</a>
        <a class="nav-link" href="journey.php">My Journey</a>
        <a class="nav-link" href="bmi.php">BMI & Calories</a>
        <a class="nav-link" href="search.php">Search</a>
        <a class="nav-link" href="contact.php">Contact</a>

        <div class="mobile-group">Account</div>
        <?php if ($headerUser): ?>
            <a class="nav-link" href="profile.php">My Profile & Goals</a>
            <a class="nav-link" href="logout.php">Log Out</a>
        <?php else: ?>
            <a class="nav-link" href="login.php">Log In</a>
            <a class="nav-link nav-cta" href="register.php">Get Started</a>
        <?php endif; ?>
    </div>
</div>
