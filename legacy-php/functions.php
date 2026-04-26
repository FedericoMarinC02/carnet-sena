<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/lib/SimpleXLSX.php';

function listPersons(string $search = '', ?string $centro = null, ?string $ficha = null): array
{
    $pdo = db();
    $where = [];
    $params = [];
    if ($search !== '') {
        $where[] = "(documento LIKE :q OR nombres LIKE :q OR apellidos LIKE :q)";
        $params[':q'] = "%$search%";
    }
    if ($centro !== null && $centro !== '') {
        $where[] = "centro = :centro";
        $params[':centro'] = $centro;
    }
    if ($ficha !== null && $ficha !== '') {
        $where[] = "ficha = :ficha";
        $params[':ficha'] = $ficha;
    }
    $sql = "SELECT * FROM personas";
    if ($where) {
        $sql .= " WHERE " . implode(' AND ', $where);
    }
    $sql .= " ORDER BY created_at DESC LIMIT 300";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function listCentros(): array
{
    $stmt = db()->query("SELECT DISTINCT centro FROM personas WHERE centro IS NOT NULL AND centro <> '' ORDER BY centro");
    return array_column($stmt->fetchAll(), 'centro');
}

function listFichas(): array
{
    $stmt = db()->query("SELECT DISTINCT ficha FROM personas WHERE ficha IS NOT NULL AND ficha <> '' ORDER BY ficha");
    return array_column($stmt->fetchAll(), 'ficha');
}

function getPerson(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM personas WHERE id = ?');
    $stmt->execute([$id]);
    $p = $stmt->fetch();
    return $p ?: null;
}

function savePerson(array $row): void
{
    $pdo = db();
    $sql = "INSERT INTO personas (tipo, centro, tipo_sangre, documento, nombres, apellidos, telefono, ficha, empresa, activo, created_at) 
            VALUES (:tipo, :centro, :tipo_sangre, :documento, :nombres, :apellidos, :telefono, :ficha, :empresa, 1, NOW())";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':tipo' => $row['tipo'] ?? 'aprendiz',
        ':centro' => $row['centro'] ?? null,
        ':tipo_sangre' => $row['tipo_sangre'] ?? null,
        ':documento' => $row['documento'],
        ':nombres' => $row['nombres'],
        ':apellidos' => $row['apellidos'],
        ':telefono' => $row['telefono'] ?? null,
        ':ficha' => $row['ficha'] ?? null,
        ':empresa' => $row['empresa'] ?? null,
    ]);
}

function importSpreadsheet(string $path): array
{
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $rows = [];
    if ($ext === 'csv') {
        $h = fopen($path, 'r');
        while (($data = fgetcsv($h, 0, ';')) !== false) {
            $rows[] = $data;
        }
        fclose($h);
    } else {
        $xlsx = SimpleXLSX::parse($path);
        if (!$xlsx) {
            return ['ok' => false, 'message' => 'No se pudo leer el archivo Excel'];
        }
        $rows = $xlsx->rows();
    }
    if (count($rows) === 0) {
        return ['ok' => false, 'message' => 'El archivo esta vacio'];
    }
    // Assumes header row: documento,nombres,apellidos,tipo,centro,tipo_sangre,telefono,ficha,empresa
    $header = array_map('strtolower', $rows[0]);
    $map = array_flip($header);
    $required = ['documento','nombres','apellidos'];
    foreach ($required as $r) {
        if (!isset($map[$r])) return ['ok' => false, 'message' => "Falta la columna requerida: $r"];
    }
    $added = 0;
    for ($i=1; $i<count($rows); $i++) {
        $r = $rows[$i];
        if (count($r)==0 || trim(implode('', $r))==='') continue;
        $row = [
            'documento' => $r[$map['documento']] ?? '',
            'nombres' => $r[$map['nombres']] ?? '',
            'apellidos' => $r[$map['apellidos']] ?? '',
            'tipo' => isset($map['tipo']) ? strtolower($r[$map['tipo']]) : 'aprendiz',
            'centro' => isset($map['centro']) ? $r[$map['centro']] : null,
            'tipo_sangre' => isset($map['tipo_sangre']) ? $r[$map['tipo_sangre']] : null,
            'telefono' => isset($map['telefono']) ? $r[$map['telefono']] : null,
            'ficha' => isset($map['ficha']) ? $r[$map['ficha']] : null,
            'empresa' => isset($map['empresa']) ? $r[$map['empresa']] : null,
        ];
        if ($row['documento']==='' || $row['nombres']==='') continue;
        savePerson($row);
        $added++;
    }
    return ['ok' => true, 'message' => "Filas importadas: $added"];
}
?>
