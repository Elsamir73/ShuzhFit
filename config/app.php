<?php

declare(strict_types=1);

return [
    'app_name' => getenv('SHUZHFIT_APP_NAME') ?: 'ShuzhFit',
    'site_url' => getenv('SHUZHFIT_SITE_URL') ?: 'http://localhost/shuzhfit',
    'admin_user' => getenv('SHUZHFIT_ADMIN_USER') ?: getenv('ADMIN_USER') ?: 'admin',
    'admin_pass' => getenv('SHUZHFIT_ADMIN_PASS') ?: getenv('ADMIN_PASS') ?: 'admin123',
    'admin_pass_hash' => getenv('SHUZHFIT_ADMIN_PASS_HASH') ?: password_hash((string)(getenv('SHUZHFIT_ADMIN_PASS') ?: getenv('ADMIN_PASS') ?: 'admin123'), PASSWORD_DEFAULT),
];
