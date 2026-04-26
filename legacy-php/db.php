<?php
$config = require __DIR__ . '/config.php';
$GLOBALS['config'] = $config;

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $cfg = $GLOBALS['config']['db'];
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $cfg['host'], $cfg['port'], $cfg['name'], $cfg['charset']);
        $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function ensureDatabase(): void
{
    // No schema changes here; assume laraip.sql already imported.
    try {
        db()->query('SELECT 1');
    } catch (Throwable $e) {
        http_response_code(500);
        echo 'No se pudo conectar a la base de datos: ' . htmlspecialchars($e->getMessage());
        exit;
    }
}
?>
