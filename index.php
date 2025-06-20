<?php
require_once __DIR__ . '/php/Database.php';

$db = new Database();
$pdo = $db->pdo();

$inserted = 0;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $handle = fopen($_FILES['file']['tmp_name'], 'r');
    if ($handle) {
        $headers = fgetcsv($handle);
        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($headers, $row);
            if (!$data) continue;
            $stmt = $pdo->prepare(
                'INSERT INTO schools (codice_meccanografico, denominazione_scuola, indirizzo_email, sito_web)
                 VALUES (:code, :name, :email, :web)
                 ON DUPLICATE KEY UPDATE denominazione_scuola=VALUES(denominazione_scuola)'
            );
            $stmt->execute([
                ':code' => $data['codiceMeccanografico'] ?? '',
                ':name' => $data['denominazioneScuola'] ?? '',
                ':email' => $data['indirizzoEmail'] ?? '',
                ':web' => $data['sitoWeb'] ?? ''
            ]);
            $inserted++;
        }
        fclose($handle);
    } else {
        $error = 'Failed to read uploaded file';
    }
}

$schools = $pdo->query('SELECT * FROM schools ORDER BY denominazione_scuola')->fetchAll();
$tenders = $pdo->query('SELECT * FROM tenders ORDER BY created_at DESC')->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>School Tender Finder</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
        th, td { border: 1px solid #ccc; padding: 4px; }
        th { background: #eee; }
    </style>
</head>
<body>
<h1>School Tender Finder</h1>
<?php if ($inserted): ?>
    <p><strong><?php echo $inserted; ?></strong> schools inserted.</p>
<?php elseif ($error): ?>
    <p style="color:red;"><?php echo htmlspecialchars($error); ?></p>
<?php endif; ?>
<form method="post" enctype="multipart/form-data">
    <label>Upload CSV of schools:
        <input type="file" name="file" required>
    </label>
    <button type="submit">Upload</button>
</form>
<h2>Schools</h2>
<table>
    <tr><th>ID</th><th>Code</th><th>Name</th><th>Email</th><th>Website</th></tr>
    <?php foreach ($schools as $s): ?>
        <tr>
            <td><?php echo $s['id']; ?></td>
            <td><?php echo htmlspecialchars($s['codice_meccanografico']); ?></td>
            <td><?php echo htmlspecialchars($s['denominazione_scuola']); ?></td>
            <td><?php echo htmlspecialchars($s['indirizzo_email']); ?></td>
            <td><?php echo htmlspecialchars($s['sito_web']); ?></td>
        </tr>
    <?php endforeach; ?>
</table>
<h2>Tenders</h2>
<table>
    <tr><th>ID</th><th>School</th><th>Title</th><th>Deadline</th><th>Platform</th></tr>
    <?php foreach ($tenders as $t): ?>
        <tr>
            <td><?php echo $t['id']; ?></td>
            <td><?php echo $t['school_id']; ?></td>
            <td><?php echo htmlspecialchars($t['title']); ?></td>
            <td><?php echo htmlspecialchars($t['deadline']); ?></td>
            <td><?php echo htmlspecialchars($t['platform']); ?></td>
        </tr>
    <?php endforeach; ?>
</table>
</body>
</html>
