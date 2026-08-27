<?php
header('Content-Type: application/json; charset=utf-8');

$host = '127.0.0.1';
$db   = 'ajce_site';
$user = 'root';
$pass = '';

$dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'message' => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base = '/api';
$path = str_replace($base, '', $uri);

if ($path === '/site') {
    if ($method === 'GET') {
        $site = $pdo->query('SELECT * FROM site_content ORDER BY id DESC LIMIT 1')->fetch();
        if (!$site) {
            echo json_encode([
                'textEdits' => [],
                'woodWords' => ['al' => [], 'en' => []],
                'galleryData' => []
            ]);
            exit;
        }

        echo json_encode([
            'textEdits' => json_decode($site['text_edits'] ?? '{}', true),
            'woodWords' => json_decode($site['wood_words'] ?? '{"al":[],"en":[]}', true),
            'galleryData' => json_decode($site['gallery_data'] ?? '{}', true)
        ]);
        exit;
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $textEdits = json_encode($input['textEdits'] ?? []);
        $woodWords = json_encode($input['woodWords'] ?? ['al' => [], 'en' => []]);
        $galleryData = json_encode($input['galleryData'] ?? []);

        $stmt = $pdo->prepare('INSERT INTO site_content (text_edits, wood_words, gallery_data, created_at) VALUES (?, ?, ?, NOW())');
        $stmt->execute([$textEdits, $woodWords, $galleryData]);

        echo json_encode(['ok' => true]);
        exit;
    }
}

if ($path === '/upload') {
    if ($method === 'POST') {
        $category = $_POST['category'] ?? 'gallery';
        $dataUrl = null;

        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $mime = mime_content_type($_FILES['photo']['tmp_name']) ?: 'image/jpeg';
            $binary = file_get_contents($_FILES['photo']['tmp_name']);
            $dataUrl = 'data:' . $mime . ';base64,' . base64_encode($binary);
        } elseif (!empty($_POST['dataUrl'])) {
            $dataUrl = $_POST['dataUrl'];
        }

        if (!$dataUrl) {
            http_response_code(400);
            echo json_encode(['error' => 'No image data supplied']);
            exit;
        }

        $stmt = $pdo->prepare('INSERT INTO gallery_photos (category_name, image_data, created_at) VALUES (?, ?, NOW())');
        $stmt->execute([$category, $dataUrl]);

        echo json_encode(['ok' => true, 'url' => $dataUrl]);
        exit;
    }

    if ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $url = $input['path'] ?? '';

        $stmt = $pdo->prepare('DELETE FROM gallery_photos WHERE image_data = ?');
        $stmt->execute([$url]);

        echo json_encode(['ok' => true]);
        exit;
    }
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
