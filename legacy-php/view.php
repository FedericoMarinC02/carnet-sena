<?php
require __DIR__ . '/db.php';
require __DIR__ . '/functions.php';
ensureDatabase();

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$persona = $id ? getPerson($id) : null;
if (!$persona) {
    http_response_code(404);
    echo 'Carnet no encontrado';
    exit;
}
$photoFile = null;
foreach (['jpg','jpeg','png','webp'] as $ext) {
    $candidate = "assets/fotos/{$persona['documento']}.$ext";
    if (file_exists(__DIR__ . "/$candidate")) { $photoFile = $candidate; break; }
}
$hasPhoto = $photoFile !== null;
$gender = strtolower($persona['tipo']) === 'instructor' ? 'male' : 'female';
$remoteIdx = ($persona['id'] ?? 0) % 99;
$remotePhoto = $gender === 'female'
    ? "https://randomuser.me/api/portraits/women/{$remoteIdx}.jpg"
    : "https://randomuser.me/api/portraits/men/{$remoteIdx}.jpg";
$photo = $hasPhoto ? $photoFile : $remotePhoto;

$qrLink = "NOMBRE: {$persona['nombres']} {$persona['apellidos']}\n"
         . "DOC: {$persona['documento']}\n"
         . "RH: " . ($persona['tipo_sangre'] ?? '-') . "\n"
         . "FICHA: " . ($persona['ficha'] ?? '-') . "\n"
         . "CENTRO: " . ($persona['centro'] ?? '-')";
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= htmlspecialchars($persona['nombres']) ?> - Carnet SENA</title>
<style>
  :root{--sena-orange:#fc7323;--sena-green:#238276;}
  *{box-sizing:border-box;font-family:'Work Sans','Segoe UI',sans-serif;}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f6f7f8;padding:16px;}
  a.hover-3d{position:relative;display:block;text-decoration:none;}
  .card-3d{
    width:760px;min-height:240px;
    background:#fff;
    color:#1f1f1f;
    border-radius:14px;
    padding:18px 22px;
    box-shadow:0 16px 36px rgba(0,0,0,.12);
  }
  .card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
  .logo{height:56px;}
  .role{font-weight:800;font-size:18px;color:var(--sena-green);border-bottom:4px solid var(--sena-green);padding-bottom:4px;flex:1;margin-left:14px;}
  .big-title{font-size:22px;font-weight:800;line-height:1.2;color:var(--sena-green); margin-bottom:10px;}
  .info{color:#2c2c2c;font-size:14px;line-height:1.5;}
  .photo{width:120px;height:150px;border-radius:12px;overflow:hidden;border:2px solid #1f2937;}
  .photo img{width:100%;height:100%;object-fit:cover;}
  .grid{display:grid;grid-template-columns:170px 1fr 130px;gap:14px;align-items:center;}
  .qr-box{width:170px;height:170px;background:#fff;border:1px solid #e0e0e0;border-radius:10px;display:flex;align-items:center;justify-content:center;}
  .barcode{margin-top:8px;}
  .footer{margin-top:12px;display:flex;justify-content:center;}
  .footer button{padding:10px 14px;border:0;border-radius:10px;background:var(--sena-green);color:#fff;font-weight:700;cursor:pointer;box-shadow:0 12px 25px rgba(35,130,118,.35);}
  a.hover-3d div.empty{position:absolute;inset:0;pointer-events:none;}
  @media (max-width:520px){
    .card-3d{width:94vw;}
    .grid{grid-template-columns:1fr;grid-template-rows:auto auto auto;}
    .photo{justify-self:flex-start;}
    .qr-box{justify-self:flex-start;}
  }
</style>
</head>
<body>
<a class="hover-3d">
  <div class="card-3d">
    <div class="card-header">
      <img src="assets/imgs/image.png" class="logo" alt="SENA">
      <div class="role"><?= strtoupper($persona['tipo']) ?></div>
    </div>
    <div class="grid">
      <div class="qr-box" id="qrBox"></div>
      <div>
        <div class="big-title"><?= htmlspecialchars(strtoupper($persona['nombres'].' '.$persona['apellidos'])) ?></div>
        <div class="info">
          Doc: <?= htmlspecialchars($persona['documento']) ?><br>
          RH: <?= htmlspecialchars($persona['tipo_sangre'] ?? '-') ?><br>
          Ficha: <?= htmlspecialchars($persona['ficha'] ?? '-') ?><br>
          Centro: <?= htmlspecialchars($persona['centro'] ?? '-') ?>
        </div>
        <img class="barcode" src="https://api.qrserver.com/v1/create-qr-code/?size=120x40&data=<?= urlencode($persona['documento']) ?>" alt="barcode">
      </div>
      <div class="photo"><img src="<?= htmlspecialchars($photo) ?>" alt="Foto"></div>
    </div>
    <div class="footer"><button onclick="window.print()">Imprimir / Guardar PDF</button></div>
  </div>
  <?php for($i=0;$i<8;$i++): ?><div class="empty"></div><?php endfor; ?>
</a>
<script src="assets/qrcode.min.js"></script>
<script>
new QRCode(document.getElementById("qrBox"), {
  text: <?= json_encode($qrLink) ?>,
  width: 170,
  height: 170,
  colorDark : "#000",
  colorLight : "#fff",
  correctLevel : QRCode.CorrectLevel.M
});
</script>
</body>
</html>
