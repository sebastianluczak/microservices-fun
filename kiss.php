<?php
$json = $_POST['json'] ?? '';
$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    json_decode($json);
    $message = json_last_error() === JSON_ERROR_NONE
        ? 'Valid JSON.'
        : 'Invalid JSON: ' . json_last_error_msg();
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Validate JSON</title>
</head>
<body>
    <h1>Validate JSON</h1>
    <?php if ($message !== ''): ?>
        <p><?php echo htmlspecialchars($message, ENT_QUOTES, 'UTF-8'); ?></p>
    <?php endif; ?>
    <form method="post" action="">
        <textarea name="json" rows="15" cols="80"><?php echo htmlspecialchars($json, ENT_QUOTES, 'UTF-8'); ?></textarea><br>
        <button type="submit">Validate</button>
    </form>
</body>
</html>