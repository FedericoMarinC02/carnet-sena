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

async function getPool() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306, // Añade el puerto desde las variables de entorno
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    // Habilita la conexión segura (SSL), requerida por TiDB Cloud
    ssl: {
      rejectUnauthorized: true,
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
      'SELECT id, tipo, centro, tipo_sangre, documento, nombres, apellidos, telefono, ficha, empresa, activo FROM personas'
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
    res.status(500).json({ error: 'No se pudo leer la base de datos' });
  }
});

app.get('/personas/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      'SELECT id, tipo, centro, tipo_sangre, documento, nombres, apellidos, telefono, ficha, empresa, activo FROM personas WHERE id = ? OR documento = ? LIMIT 1',
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