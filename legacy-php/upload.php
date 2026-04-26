<?php
require __DIR__ . '/db.php';
require __DIR__ . '/functions.php';
ensureDatabase();

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['archivo'])) {
    $tmp = $_FILES['archivo']['tmp_name'];
    $ext = strtolower(pathinfo($_FILES['archivo']['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['csv','xlsx','xls'])) {
        $msg = 'Formato no soportado. Use Excel (.xlsx) o CSV.';
    } else {
        $result = importSpreadsheet($tmp);
        $msg = $result['message'];
    }
}
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Cargar datos</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<header class="top">
  <h1>Importar personas</h1>
  <nav><a href="index.php">Volver</a></nav>
</header>
<section class="panel">
  <?php if ($msg): ?><div class="alert"><?= htmlspecialchars($msg) ?></div><?php endif; ?>
  <form method="post" enctype="multipart/form-data" class="upload">
    <label>Archivo Excel o CSV con columnas: documento,nombres,apellidos,tipo,centro,tipo_sangre,telefono,ficha,empresa</label>
    <input type="file" name="archivo" required>
    <button type="submit">Cargar</button>
  </form>
  <p>El PDF no se parsea automaticamente; conviertalo a Excel/CSV antes de cargarlo.</p>
</section>
</body>
</html>
