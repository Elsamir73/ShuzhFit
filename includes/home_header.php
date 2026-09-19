<?php
// ShuzhFit - PUBLIC HOMEPAGE header (minimal gateway navigation).
//
// Used ONLY by index.php. Every other page keeps using includes/header.php.
// It reuses the same classes and JS hooks (data-nav-toggle / data-mobile-panel)
// from css/style.css + js/script.js, so the visual identity and the mobile
// menu behavior stay identical to the rest of the site.
?>
<div class="bg-glow" aria-hidden="true"></div>

<header class="site-header">
    <div class="container nav-wrap">
        <a class="brand" href="index.php" aria-label="ShuzhFit Home">
            <span class="brand-dot" aria-hidden="true"></span>
            ShuzhFit
        </a>

        <nav class="nav" aria-label="Primary">
            <a class="nav-link active" href="index.php" aria-current="page">Home</a>
            <a class="nav-link" href="exercises.php">Workouts</a>
            <a class="nav-link" href="knowledge.php">Knowledge</a>
            <a class="nav-link" href="nutrition.php">Nutrition</a>
            <a class="nav-link" href="motivation.php">Motivation</a>
            <a class="nav-link" href="journey.php">My Journey</a>

            <a class="nav-icon" href="search.php" aria-label="Search ShuzhFit" title="Search">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7"></circle>
                    <path d="M20 20l-3.6-3.6"></path>
                </svg>
            </a>
        </nav>

        <!-- Mobile nav toggle (vanilla JS from js/script.js) -->
        <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" data-nav-toggle>
            <span class="hamburger" aria-hidden="true"></span>
        </button>
    </div>
</header>

<!-- Mobile menu panel -->
<div class="mobile-panel" data-mobile-panel>
    <div class="container mobile-panel-inner">
        <a class="nav-link active" href="index.php" aria-current="page">Home</a>
        <a class="nav-link" href="exercises.php">Workouts</a>
        <a class="nav-link" href="knowledge.php">Knowledge</a>
        <a class="nav-link" href="nutrition.php">Nutrition</a>
        <a class="nav-link" href="motivation.php">Motivation</a>
        <a class="nav-link" href="journey.php">My Journey</a>
        <a class="nav-link" href="search.php">Search</a>
    </div>
</div>
