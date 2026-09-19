<?php

// ShuzhFit - Logout
declare(strict_types=1);

require_once __DIR__ . '/lib/auth.php';

auth_logout();
header('Location: index.php');
exit;
