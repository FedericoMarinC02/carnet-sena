import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

export type Person = {
  id: number;
  tipo: string;
  centro: string | null;
  regional: string | null;
  tipo_sangre: string | null;
  documento: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  ficha: string | null;
  empresa: string | null;
  activo: number;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  deleted_at: Date | string | null;
};

function rowPerson(r: RowDataPacket): Person {
  return r as Person;
}

export async function listPersons(
  search = "",
  centro: string | null = null,
  ficha: string | null = null,
): Promise<Person[]> {
  const p = getPool();
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (search !== "") {
    where.push("(documento LIKE ? OR nombres LIKE ? OR apellidos LIKE ?)");
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  if (centro !== null && centro !== "") {
    where.push("centro = ?");
    params.push(centro);
  }
  if (ficha !== null && ficha !== "") {
    where.push("ficha = ?");
    params.push(ficha);
  }
  let sql = "SELECT * FROM personas";
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY created_at DESC LIMIT 300";
  const [rows] = await p.query<RowDataPacket[]>(sql, params);
  return rows.map(rowPerson);
}

export async function listCentros(): Promise<string[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT DISTINCT centro FROM personas WHERE centro IS NOT NULL AND centro <> '' ORDER BY centro",
  );
  return rows.map((r) => String(r.centro));
}

export async function listFichas(): Promise<string[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT DISTINCT ficha FROM personas WHERE ficha IS NOT NULL AND ficha <> '' ORDER BY ficha",
  );
  return rows.map((r) => String(r.ficha));
}

export async function getPerson(id: number): Promise<Person | null> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT * FROM personas WHERE id = ?",
    [id],
  );
  const p = rows[0];
  return p ? rowPerson(p) : null;
}

export async function savePerson(row: Record<string, unknown>): Promise<void> {
  const p = getPool();
  await p.execute(
    `INSERT INTO personas (tipo, centro, regional, tipo_sangre, documento, nombres, apellidos, telefono, ficha, empresa, activo, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
    [
      (row.tipo as string) ?? "aprendiz",
      (row.centro as string | null) ?? null,
      (row.regional as string | null) ?? null,
      (row.tipo_sangre as string | null) ?? null,
      row.documento as string,
      row.nombres as string,
      row.apellidos as string,
      (row.telefono as string | null) ?? null,
      (row.ficha as string | null) ?? null,
      (row.empresa as string | null) ?? null,
    ],
  );
}