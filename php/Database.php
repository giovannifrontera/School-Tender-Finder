<?php
class Database {
    private $pdo;
    public function __construct() {
        $dsn = getenv('DB_DSN') ?: 'mysql:host=localhost;dbname=tenderfinder;charset=utf8mb4';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        $this->pdo = new PDO($dsn, $user, $pass, $options);
    }
    public function pdo() {
        return $this->pdo;
    }
}
?>
