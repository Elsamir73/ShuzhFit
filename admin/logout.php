<?php
require_once __DIR__ . '/../lib/auth.php';

// ShuzhFit - admin logout

auth_session_boot();
unset($_SESSION['admin_ok']);
header('Location: index.php');
exit;
