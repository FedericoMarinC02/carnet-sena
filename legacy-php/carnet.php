<?php
require __DIR__ . '/db.php';
require __DIR__ . '/functions.php';
ensureDatabase();

$id = (int)($_GET['id'] ?? 0);
$persona = $id ? getPerson($id) : null;
if (!$persona) {
    http_response_code(404);
    echo 'Persona no encontrada';
    exit;
}
function guessGender(string $nombres): string {
    $first = strtolower(trim(explode(' ', $nombres)[0] ?? ''));
    if ($first === '') return 'neutral';
    if (in_array($first, ['jose','juan','luis','carlos','jhon','john'])) return 'male';
    if (in_array($first, ['maria','ana','laura','sofia','camila','karla'])) return 'female';
    $lastChar = substr($first, -1);
    return $lastChar === 'a' ? 'female' : 'male';
}
function genderAvatarSvg(string $gender): string {
    $color = $gender === 'female' ? '#fc7323' : '#238276';
    $bg = $gender === 'female' ? '#fff1e8' : '#e9f6f4';
    $path = $gender === 'female'
      ? 'M50 18a14 14 0 1 1 0 28 14 14 0 0 1 0-28zm0 32c14 0 26 9 26 20v6H24v-6c0-11 12-20 26-20z'
      : 'M50 18a14 14 0 1 1 0 28 14 14 0 0 1 0-28zm0 32c-16 0-28 10-28 22v6h56v-6c0-12-12-22-28-22z';
    $svg = "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='260' viewBox='0 0 100 130'><rect width='100' height='130' rx='12' fill='$bg'/><path d='$path' fill='$color'/></svg>";
    return 'data:image/svg+xml;base64,' . base64_encode($svg);
}
$qrPayload = "NOMBRE: {$persona['nombres']} {$persona['apellidos']}\n"
           . "DOC: {$persona['documento']}\n"
           . "RH: " . ($persona['tipo_sangre'] ?? '-') . "\n"
           . "FICHA: " . ($persona['ficha'] ?? '-') . "\n"
           . "CENTRO: " . ($persona['centro'] ?? '-');
$photoFile = null;
foreach (['jpg','jpeg','png','webp'] as $ext) {
    $candidate = "assets/fotos/{$persona['documento']}.$ext";
    if (file_exists(__DIR__ . "/$candidate")) {
        $photoFile = $candidate;
        break;
    }
}
$hasPhoto = $photoFile !== null;
$gender = guessGender($persona['nombres'] ?? '');
$remoteIdx = ($persona['id'] ?? 0) % 99;
$remotePhoto = $gender === 'female'
    ? "https://randomuser.me/api/portraits/women/{$remoteIdx}.jpg"
    : "https://randomuser.me/api/portraits/men/{$remoteIdx}.jpg";
$avatarFallback = $remotePhoto;
$initials = '';
if (!empty($persona['nombres'])) $initials .= mb_strtoupper(mb_substr($persona['nombres'],0,1));
if (!empty($persona['apellidos'])) $initials .= mb_strtoupper(mb_substr($persona['apellidos'],0,1));
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Carnet <?= htmlspecialchars($persona['nombres']) ?></title>
<link rel="stylesheet" href="styles.css">
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script src="assets/qrcode.min.js"></script>
</head>
<body class="canvas">
<div class="carnet tipo-<?= htmlspecialchars(strtolower($persona['tipo'])) ?>" id="carnet">
  <div class="head-row">
    <img src="assets/imgs/image.png" alt="SENA" class="logo">
    <div class="role"><?= strtoupper($persona['tipo']) ?></div>
  </div>
  <div class="body">
    <div class="qr" id="qrBox"></div>
    <div class="info">
      <div class="nombre"><?= htmlspecialchars($persona['nombres'] . ' ' . $persona['apellidos']) ?></div>
      <div class="text">Doc: <?= htmlspecialchars($persona['documento']) ?></div>
      <div class="text">RH: <?= htmlspecialchars($persona['tipo_sangre'] ?? '-') ?></div>
      <?php if ($persona['ficha']): ?><div class="text">Ficha: <?= htmlspecialchars($persona['ficha']) ?></div><?php endif; ?>
      <?php if ($persona['centro']): ?><div class="text">Centro: <?= htmlspecialchars($persona['centro']) ?></div><?php endif; ?>
      <div class="barcode">
        <svg id="barcode"></svg>
      </div>
    </div>
    <div class="foto">
      <img src="<?= htmlspecialchars($hasPhoto ? $photoFile : $avatarFallback) ?>" alt="Foto de <?= htmlspecialchars($persona['nombres']) ?>">
    </div>
  </div>
</div>
<div class="actions">
  <button onclick="window.print()">Imprimir / Guardar PDF</button>
</div>
<script>
JsBarcode("#barcode", "<?= htmlspecialchars($persona['documento']) ?>", {
  format: "CODE128",
  width: 2,
  height: 70,
  displayValue: true,
  font: "Work Sans",
  fontSize: 14,
  textMargin: 4,
  background: "transparent",
  lineColor: "#222"
});

new QRCode(document.getElementById("qrBox"), {
  text: <?= json_encode($qrPayload) ?>,
  width: 200,
  height: 200,
  colorDark : "#000000",
  colorLight : "#ffffff",
  correctLevel : QRCode.CorrectLevel.M
});
</script>
</body>
</html>
