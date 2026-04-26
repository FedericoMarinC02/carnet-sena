import fs from "fs";
import path from "path";

export function guessGender(
  nombres: string,
): "male" | "female" | "neutral" {
  const first =
    nombres
      .trim()
      .split(/\s+/)[0]
      ?.toLowerCase() ?? "";
  if (!first) return "neutral";
  if (
    ["jose", "juan", "luis", "carlos", "jhon", "john"].includes(first)
  ) {
    return "male";
  }
  if (
    ["maria", "ana", "laura", "sofia", "camila", "karla"].includes(first)
  ) {
    return "female";
  }
  return first.endsWith("a") ? "female" : "male";
}

export function buildQrPayload(persona: {
  nombres: string;
  apellidos: string;
  documento: string;
  tipo_sangre: string | null;
  ficha: string | null;
  centro: string | null;
}): string {
  return [
    // iOS sometimes interprets leading "LABEL:" as a URI scheme (e.g. "NOMBRE:"),
    // which can show an error when scanning. A non-scheme first line keeps it as plain text.
    "CARNET SENA",
    `NOMBRE: ${persona.nombres} ${persona.apellidos}`,
    `DOC: ${persona.documento}`,
    `RH: ${persona.tipo_sangre ?? "-"}`,
    `FICHA: ${persona.ficha ?? "-"}`,
    `CENTRO: ${persona.centro ?? "-"}`,
  ].join("\n");
}

export function resolvePersonPhoto(
  documento: string,
  id: number,
  gender: "male" | "female" | "neutral",
): string {
  const exts = ["jpg", "jpeg", "png", "webp"];
  const dir = path.join(process.cwd(), "public", "assets", "fotos");
  for (const ext of exts) {
    const f = path.join(dir, `${documento}.${ext}`);
    if (fs.existsSync(f)) {
      return `/assets/fotos/${documento}.${ext}`;
    }
  }
  const idx = id % 99;
  const g = gender === "female" ? "women" : "men";
  return `https://randomuser.me/api/portraits/${g}/${idx}.jpg`;
}
