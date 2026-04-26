import * as XLSX from "xlsx";
import { savePerson } from "./persons";

function rowsFromBuffer(buffer: Buffer, ext: string): string[][] {
  if (ext === "csv") {
    const text = buffer.toString("utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    return lines.map((line) => line.split(";"));
  }
  const wb = XLSX.read(buffer, { type: "buffer" });
  const first = wb.SheetNames[0];
  if (!first) return [];
  const sheet = wb.Sheets[first];
  const raw = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  return raw.map((r) =>
    (Array.isArray(r) ? r : []).map((c) => (c == null ? "" : String(c))),
  );
}

export async function importSpreadsheet(
  buffer: Buffer,
  ext: string,
): Promise<{ ok: boolean; message: string }> {
  const rows = rowsFromBuffer(buffer, ext);
  if (rows.length === 0) {
    return { ok: false, message: "El archivo esta vacio" };
  }
  const header = rows[0].map((h) => String(h).toLowerCase().trim());
  const map = Object.fromEntries(header.map((h, i) => [h, i])) as Record<
    string,
    number
  >;
  const required = ["documento", "nombres", "apellidos"];
  for (const r of required) {
    if (map[r] === undefined) {
      return { ok: false, message: `Falta la columna requerida: ${r}` };
    }
  }
  let added = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r.join("").trim() === "") continue;
    const row = {
      documento: r[map["documento"]] ?? "",
      nombres: r[map["nombres"]] ?? "",
      apellidos: r[map["apellidos"]] ?? "",
      tipo:
        map["tipo"] !== undefined
          ? String(r[map["tipo"]]).toLowerCase()
          : "aprendiz",
      centro: map["centro"] !== undefined ? r[map["centro"]] : null,
      tipo_sangre:
        map["tipo_sangre"] !== undefined ? r[map["tipo_sangre"]] : null,
      telefono: map["telefono"] !== undefined ? r[map["telefono"]] : null,
      ficha: map["ficha"] !== undefined ? r[map["ficha"]] : null,
      empresa: map["empresa"] !== undefined ? r[map["empresa"]] : null,
    };
    if (row.documento === "" || row.nombres === "") continue;
    await savePerson(row);
    added++;
  }
  return { ok: true, message: `Filas importadas: ${added}` };
}
