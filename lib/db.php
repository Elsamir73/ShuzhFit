<?php

/**
 * ShuzhFit - DB helper (PDO)
 *
 * Beginner notes:
 * - Use PDO with prepared statements to avoid SQL injection.
 * - This file centralizes DB connection and simple query helpers.
 */

declare(strict_types=1);

// Guard against accidental multiple includes in the same request.
if (!defined('SHUZHFIT_DB_LOADED')) {
    define('SHUZHFIT_DB_LOADED', true);

    // =====================
    // DB credentials
    // Single source of truth: shuzhfit/config/db.php
    // =====================
    $config = require __DIR__ . '/../config/db.php';
    $dbHost = $config['host'] ?? '127.0.0.1';
    $dbName = $config['dbname'] ?? 'shuzhfit';
    $dbUser = $config['user'] ?? 'root';
    $dbPass = $config['pass'] ?? '';
    $dbPort = $config['port'] ?? 3306;

    /**
     * Get a PDO connection (singleton-like per request).
     */
    function shuzhfit_pdo(): PDO
    {
        static $pdo = null;
        global $dbHost, $dbName, $dbUser, $dbPass, $dbPort;

        if ($pdo instanceof PDO) {
            return $pdo;
        }

        $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";

        $pdo = new PDO($dsn, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        return $pdo;
    }

    /**
     * Escape output safely.
     */
    function e(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }

    /**
     * Bind parameters with correct PDO types.
     *
     * Why this exists: with emulated prepares (the PDO MySQL default), integers
     * passed via execute() are quoted as strings. MariaDB rejects LIMIT '3'.
     * Binding ints as PDO::PARAM_INT fixes LIMIT/OFFSET placeholders globally.
     */
    function db_bind_all(PDOStatement $stmt, array $params): void
    {
        foreach ($params as $key => $value) {
            if ($value === null) {
                $stmt->bindValue($key, null, PDO::PARAM_NULL);
            } elseif (is_int($value)) {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } elseif (is_bool($value)) {
                $stmt->bindValue($key, (int)$value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, (string)$value, PDO::PARAM_STR);
            }
        }
    }

    /**
     * Fetch all rows.
     */
    function db_fetch_all(string $sql, array $params = []): array
    {
        $stmt = shuzhfit_pdo()->prepare($sql);
        db_bind_all($stmt, $params);
        $stmt->execute();
        return $stmt->fetchAll();
    }



    /**
     * Fetch one row.
     */
    function db_fetch_one(string $sql, array $params = []): ?array
    {
        $stmt = shuzhfit_pdo()->prepare($sql);
        db_bind_all($stmt, $params);
        $stmt->execute();
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /**
     * Execute write queries.
     */
    function db_exec(string $sql, array $params = []): int
    {
        $stmt = shuzhfit_pdo()->prepare($sql);
        db_bind_all($stmt, $params);
        $stmt->execute();
        return $stmt->rowCount();
    }

    /**
     * Get last insert id.
     */
    function db_last_insert_id(): string
    {
        return shuzhfit_pdo()->lastInsertId();
    }
}
