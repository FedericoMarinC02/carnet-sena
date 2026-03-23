const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

const buildPlaceholder = (nombres = '', apellidos = '') => {
  const initials =
    `${nombres} ${apellidos}`
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => (part && part[0] ? part[0].toUpperCase() : ''))
      .join('') || 'SN';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'><rect width='512' height='512' rx='40' fill='#00a651'/><text x='50%' y='55%' font-size='200' fill='white' text-anchor='middle' font-family='Arial, sans-serif' dominant-baseline='middle'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// c:\Users\Vhelator\Desktop\carnet\server.js

// ... (líneas de código)
async function getPool() {
  const rawUser = process.env.DB_USER || 'root';
  const dbName = process.env.DB_NAME || 'larapi';
  const inferredPrefix = dbName.includes('.') ? dbName.split('.')[0] : '';
  const userPrefix = process.env.DB_USER_PREFIX || inferredPrefix;

  let user;
  if (rawUser.includes('.')) {
    user = rawUser;
  } else if (userPrefix) {
    // Caso TiDB: si el usuario es igual al prefijo, usa <prefijo>.root
    user = rawUser === userPrefix ? `${userPrefix}.root` : `${userPrefix}.${rawUser}`;
  } else {
    user = rawUser;
  }

  const database = dbName;

  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user,
    password: process.env.DB_PASS,
    // --- ¡LA CORRECCIÓN CLAVE! ---
    // Apuntamos a la base de datos correcta en el formato requerido por TiDB Cloud.
    database: '4Nt3NyvGLPWxviG.sena_accesos',
    ssl:
      process.env.DB_SSL_DISABLE === '1'
        ? false
        : {
            rejectUnauthorized: false
          },
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  });
  return pool;
}

app.get('/personas', async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT id, tipo, centro, tipo_sangre, documento, nombres, apellidos, telefono, empresa, activo FROM personas'
    );
    const withFotos = rows.map((p) => {
      if (p.foto && p.foto.trim()) return p;
      return {
        ...p,
        foto: buildPlaceholder(p.nombres, p.apellidos),
      };
    });

    res.json(withFotos);
  } catch (err) {
    console.error(err);
    // Devuelve lista vacía en lugar de 500 para no romper el cliente si la BD cae.
    res.status(200).json([]);
  }
});

app.get('/personas/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT id, tipo, centro, tipo_sangre, documento, nombres, apellidos, telefono, empresa, activo FROM personas WHERE id = ? OR documento = ? LIMIT 1',
      [req.params.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    const p = rows[0];
    if (!p.foto || !p.foto.trim()) {
      p.foto = buildPlaceholder(p.nombres, p.apellidos);
    }
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo leer la base de datos' });
  }
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://127.0.0.1:${PORT}`);
});