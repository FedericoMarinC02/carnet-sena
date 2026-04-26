const fs = require("fs");
const mysql = require("mysql2/promise");

function loadEnvLocal() {
  const env = {};
  try {
    const s = fs.readFileSync(".env.local", "utf8");
    for (const line of s.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const m = line.match(/^([^=]+)=(.*)$/);
      if (!m) continue;
      const k = m[1].trim();
      let v = m[2];
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      env[k] = v;
    }
  } catch {
    // ignore
  }
  return env;
}

(async () => {
  const env = loadEnvLocal();
  const cfg = {
    host: env.DATABASE_HOST || "127.0.0.1",
    port: Number(env.DATABASE_PORT || 3306),
    database: env.DATABASE_NAME || "laraip",
    user: env.DATABASE_USER || "root",
    password: env.DATABASE_PASSWORD || "",
    connectTimeout: 5000,
  };
  const t0 = Date.now();
  try {
    const conn = await mysql.createConnection(cfg);
    await conn.query("SELECT 1");
    await conn.end();
    console.log("DB_OK", Date.now() - t0, cfg.host, cfg.port, cfg.database);
  } catch (e) {
    console.log("DB_FAIL", Date.now() - t0, e.code || e.name, e.message);
    process.exitCode = 1;
  }
})();

