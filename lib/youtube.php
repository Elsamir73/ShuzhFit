<?php

/**
 * ShuzhFit - YouTube helper
 *
 * Admin pastes a YouTube URL. We normalize it into embed URLs.
 */

declare(strict_types=1);

/**
 * Extract a YouTube video ID from many URL formats.
 *
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEOID
 * - https://youtu.be/VIDEOID
 * - https://www.youtube.com/shorts/VIDEOID
 */
function youtube_extract_id(string $url): ?string
{
    $url = trim($url);
    if ($url === '') {
        return null;
    }

    // watch?v=...
    if (preg_match('~[?&]v=([A-Za-z0-9_-]{6,})~', $url, $m)) {
        return $m[1];
    }

    // youtu.be/...
    if (preg_match('~youtu\.be/([A-Za-z0-9_-]{6,})~', $url, $m)) {
        return $m[1];
    }

    // /shorts/...
    if (preg_match('~/shorts/([A-Za-z0-9_-]{6,})~', $url, $m)) {
        return $m[1];
    }

    return null;
}

/**
 * Convert to embed URL.
 */
function youtube_embed_url(string $url): ?string
{
    $id = youtube_extract_id($url);
    if (!$id) {
        return null;
    }
    return 'https://www.youtube.com/embed/' . $id;
}

/**
 * Render an embed responsive frame.
 */
function render_youtube_embed(string $youtubeUrl, string $title = ''): void
{
    $embed = youtube_embed_url($youtubeUrl);
    if (!$embed) {
        echo '<div class="notice err">Invalid YouTube URL.</div>';
        return;
    }

    $titleEsc = $title ? e($title) : 'YouTube video';

    echo "\n<div class=\"video-frame\" aria-label=\"{$titleEsc}\">";
    echo "\n  <iframe src=\"" . e($embed) . "\" loading=\"lazy\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen></iframe>";
    echo "\n</div>\n";
}
