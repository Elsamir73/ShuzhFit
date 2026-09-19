<?php

/**
 * ShuzhFit - SEO helpers (pure PHP)
 */

declare(strict_types=1);

/**
 * Create a friendly slug.
 * - Lowercase
 * - Replace non-alphanumerics with hyphens
 * - Trim duplicate hyphens
 */
function slugify(string $text): string
{
    $text = trim(mb_strtolower($text));

    // Replace whitespace with hyphen
    $text = preg_replace('/\s+/', '-', $text);

    // Remove anything that's not a-z, 0-9, or hyphen
    $text = preg_replace('/[^a-z0-9\-]/', '', $text);

    // Collapse multiple hyphens
    $text = preg_replace('/\-+/', '-', $text);

    return trim($text, '-');
}

/**
 * Build SEO title & meta description from base fields.
 */
function seo_title(string $base, ?string $category = null): string
{
    $categoryPart = $category ? " | {$category}" : '';
    return "{$base}{$categoryPart} | ShuzhFit";
}

function seo_description(string $contentOrExcerpt): string
{
    $contentOrExcerpt = trim(strip_tags($contentOrExcerpt));
    if ($contentOrExcerpt === '') {
        return 'Beginner-friendly fitness blog and exercise library.';
    }

    // Limit length
    if (mb_strlen($contentOrExcerpt) > 155) {
        $contentOrExcerpt = mb_substr($contentOrExcerpt, 0, 155) . '...';
    }

    return $contentOrExcerpt;
}

/**
 * Output common SEO tags.
 *
 * IMPORTANT: This helper expects e() to be loaded (from shuzhfit/lib/db.php).
 */
function render_seo_tags(string $title, string $description, string $urlPath = ''): void
{
    echo "\n    <title>" . e($title) . "</title>\n";
    echo "    <meta name=\"description\" content=\"" . e($description) . "\" />\n";
    echo "    <meta property=\"og:title\" content=\"" . e($title) . "\" />\n";
    echo "    <meta property=\"og:description\" content=\"" . e($description) . "\" />\n";

    if ($urlPath !== '') {
        echo "    <link rel=\"canonical\" href=\"" . e($urlPath) . "\" />\n";
    }
}
