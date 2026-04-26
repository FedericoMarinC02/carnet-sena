<?php
require __DIR__ . '/db.php';
require __DIR__ . '/functions.php';
ensureDatabase();

$buscar = $_GET['buscar'] ?? '';
$centro = $_GET['centro'] ?? '';
$ficha = $_GET['ficha'] ?? '';
$centros = listCentros();
$fichas = listFichas();
$persons = listPersons($buscar, $centro, $ficha);
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Carnets SENA</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<header class="top">
  <div class="top-inner">
    <h1>Sistema de Carnets</h1>
    <nav>
      <a href="upload.php">Cargar Excel/PDF</a>
    </nav>
  </div>
</header>
<section class="panel">
  <form method="get" class="search">
    <input type="search" name="buscar" placeholder="Buscar por documento o nombre" value="<?= htmlspecialchars($buscar) ?>">
    <select name="centro">
      <option value="">Todos los centros</option>
      <?php foreach ($centros as $c): ?>
        <option value="<?= htmlspecialchars($c) ?>" <?= $centro===$c ? 'selected' : '' ?>><?= htmlspecialchars($c) ?></option>
      <?php endforeach; ?>
    </select>
    <select name="ficha">
      <option value="">Todas las fichas</option>
      <?php foreach ($fichas as $f): ?>
        <option value="<?= htmlspecialchars($f) ?>" <?= $ficha===$f ? 'selected' : '' ?>><?= htmlspecialchars($f) ?></option>
      <?php endforeach; ?>
    </select>
    <button type="submit">Buscar</button>
  </form>
  <div class="grid">
    <?php foreach ($persons as $p): ?>
      <article class="card-item">
        <div class="tag"><?= strtoupper($p['tipo']) ?></div>
        <div class="name"><?= htmlspecialchars($p['nombres'] . ' ' . $p['apellidos']) ?></div>
        <div class="doc">Doc: <?= htmlspecialchars($p['documento']) ?></div>
        <div class="meta">RH: <?= htmlspecialchars($p['tipo_sangre'] ?? '-') ?></div>
        <div class="meta">Centro: <?= htmlspecialchars($p['centro'] ?? '-') ?></div>
        <a class="btn view-carnet" href="carnet.php?id=<?= $p['id'] ?>">Ver carnet</a>
      </article>
    <?php endforeach; ?>
    <?php if (count($persons)===0): ?>
      <p>Sin registros. Cargue un Excel o agregue manualmente.</p>
    <?php endif; ?>
  </div>
</section>
<div id="carnetModal" class="modal hidden">
  <div class="modal-body">
    <button class="modal-close" aria-label="Cerrar">&times;</button>
    <iframe id="carnetFrame" title="Carnet"></iframe>
  </div>
</div>
<script>
document.querySelectorAll('.view-carnet').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const src = link.getAttribute('href');
    const modal = document.getElementById('carnetModal');
    const frame = document.getElementById('carnetFrame');
    frame.src = src;
    modal.classList.remove('hidden');
  });
});
document.querySelector('.modal-close').addEventListener('click', () => {
  const modal = document.getElementById('carnetModal');
  const frame = document.getElementById('carnetFrame');
  frame.src = '';
  modal.classList.add('hidden');
});
document.getElementById('carnetModal').addEventListener('click', (e) => {
  if (e.target.id === 'carnetModal') {
    document.querySelector('.modal-close').click();
  }
});
</script>
</body>
</html>
