<?php
require_once __DIR__ . '/Database.php';
header('Content-Type: application/json');

$db = new Database();
$pdo = $db->pdo();

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

function not_found() {
    http_response_code(404);
    echo json_encode(['message' => 'Not Found']);
    exit;
}

// Simple routing
if ($path === '/api/schools' && $method === 'POST') {
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['message' => 'No file uploaded']);
        exit;
    }

    $handle = fopen($_FILES['file']['tmp_name'], 'r');
    if (!$handle) {
        http_response_code(400);
        echo json_encode(['message' => 'Failed to read uploaded file']);
        exit;
    }

    $headers = fgetcsv($handle);
    $inserted = 0;
    while (($row = fgetcsv($handle)) !== false) {
        $data = array_combine($headers, $row);
        if (!$data) continue;
        $stmt = $pdo->prepare('INSERT INTO schools (codice_meccanografico, denominazione_scuola, indirizzo_email, sito_web) VALUES (:code, :name, :email, :web) ON DUPLICATE KEY UPDATE denominazione_scuola=VALUES(denominazione_scuola)');
        $stmt->execute([
            ':code' => $data['codiceMeccanografico'] ?? '',
            ':name' => $data['denominazioneScuola'] ?? '',
            ':email' => $data['indirizzoEmail'] ?? '',
            ':web' => $data['sitoWeb'] ?? ''
        ]);
        $inserted++;
    }
    fclose($handle);
    echo json_encode(['inserted' => $inserted]);
    exit;
}

if ($path === '/api/schools' && $method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM schools');
    $schools = $stmt->fetchAll();
    echo json_encode($schools);
    exit;
}

if ($path === '/api/tenders' && $method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM tenders ORDER BY created_at DESC');
    echo json_encode($stmt->fetchAll());
    exit;
}

not_found();
?>
