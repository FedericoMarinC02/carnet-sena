"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { importSpreadsheet } from "@/lib/import-spreadsheet";

export async function uploadSpreadsheetAction(formData: FormData) {
  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      "/upload?msg=" + encodeURIComponent("Seleccione un archivo."),
    );
  }
  const lower = file.name.toLowerCase();
  const ext = lower.endsWith(".csv")
    ? "csv"
    : lower.endsWith(".xlsx")
      ? "xlsx"
      : lower.endsWith(".xls")
        ? "xls"
        : "";
  if (!ext) {
    redirect(
      "/upload?msg=" +
        encodeURIComponent(
          "Formato no soportado. Use Excel (.xlsx, .xls) o CSV.",
        ),
    );
  }
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await importSpreadsheet(buf, ext);
    revalidatePath("/");
    redirect("/upload?msg=" + encodeURIComponent(result.message));
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Error al importar el archivo.";
    redirect("/upload?msg=" + encodeURIComponent(msg));
  }
}
