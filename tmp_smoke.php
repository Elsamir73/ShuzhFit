<?php
declare(strict_types=1);
$urls = [
    'http://localhost/shuzhfit/index.php',
    'http://localhost/shuzhfit/dashboard.php',
    'http://localhost/shuzhfit/workout.php',
    'http://localhost/shuzhfit/exercises.php',
    'http://localhost/shuzhfit/blog_post.php?slug=what-bench-press-helps-you-achieve',
    'http://localhost/shuzhfit/meal_planner.php',
];
foreach ($urls as $u) {
    $ctx = stream_context_create(['http' => ['ignore_errors' => true, 'timeout' => 10]]);
    $h = @file_get_contents($u, false, $ctx);
    $code = '???';
    foreach ($http_response_header ?? [] as $hdr) {
        if (preg_match('~^HTTP/\S+\s+(\d+)~', $hdr, $m)) { $code = $m[1]; }
    }
    $issues = [];
    if (stripos((string)$h, 'fatal error') !== false) { $issues[] = 'FATAL'; }
    if (strpos((string)$h, 'Warning:') !== false) { $issues[] = 'WARNING'; }
    echo $u . ' -> ' . $code . (empty($issues) ? ' OK' : ' [' . implode(',', $issues) . ']') . "\n";
}
