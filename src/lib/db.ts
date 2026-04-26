import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST ?? "127.0.0.1",
      port: Number(process.env.DATABASE_PORT ?? 3306),
      database: process.env.DATABASE_NAME ?? "laraip",
      user: process.env.DATABASE_USER ?? "root",
      password: process.env.DATABASE_PASSWORD ?? "",
      charset: "utf8mb4",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

export async function pingDb(): Promise<void> {
  const p = getPool();
  await p.query("SELECT 1");
}
