import { readFileSync } from "fs";
import { join } from "path";
import QRCode from "qrcode";
import {
  buildQrPayload,
  guessGender,
  resolvePersonPhoto,
} from "./carnet-utils";
import type { Person } from "./persons";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function footerMeta(persona: Person): string {
  const rows: string[] = [];
  const regional = persona.regional?.trim();

  if (persona.ficha?.trim()) {
    rows.push(
      `<div class="meta-line meta-line--muted">Ficha ${escapeHtml(persona.ficha)}</div>`,
    );
  }

  if (regional) {
    rows.push(`<div class="meta-line meta-line--regional">${escapeHtml(regional)}</div>`);
  }

  if (persona.centro?.trim()) {
    rows.push(`<div class="meta-line">${escapeHtml(persona.centro)}</div>`);
  }

  return rows.join("\n");
}

async function oneCarnetBlock(
  persona: Person,
  baseUrl: string,
  logoUrl: string,
  isLast: boolean,
): Promise<string> {
  const gender = guessGender(persona.nombres ?? "");
  const photoSrc = resolvePersonPhoto(
    persona.documento,
    persona.id,
    gender === "neutral" ? "male" : gender,
  );
  const photoUrl = photoSrc.startsWith("http") ? photoSrc : `${baseUrl}${photoSrc}`;
  const qrPayload = buildQrPayload(persona);
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 200,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const tipoClass = `tipo-${persona.tipo.toLowerCase().replace(/\s+/g, "-")}`;
  const pageClass = isLast
    ? "bulk-carnet-page bulk-carnet-page--last"
    : "bulk-carnet-page";
  const rh = escapeHtml(persona.tipo_sangre ?? "-");
  const meta = footerMeta(persona);
  const fullName = escapeHtml(`${persona.nombres} ${persona.apellidos}`);
  const roleLabel = escapeHtml(persona.tipo.toUpperCase());

  return `<section class="${pageClass}" aria-label="Carnet ${escapeHtml(persona.documento)}">
  <div class="carnet-root">
    <div class="carnet-shell">
      <span class="frame-tab frame-tab--left" aria-hidden="true"></span>
      <span class="frame-tab frame-tab--right" aria-hidden="true"></span>
      <span class="frame-tab frame-tab--bottom-left" aria-hidden="true"></span>
      <span class="frame-tab frame-tab--bottom-right" aria-hidden="true"></span>
      <div class="carnet ${tipoClass}">
        <div class="top-band" aria-hidden="true"></div>
        <div class="head-row">
          <div class="head-left">
            <img src="${escapeHtml(logoUrl)}" alt="SENA" class="logo" width="200" height="70" />
            <div class="role-wrap role-wrap--head">
              <span class="role">${roleLabel}</span>
            </div>
          </div>
          <div class="foto-wrap">
            <div class="foto">
              <img src="${escapeHtml(photoUrl)}" alt="" width="126" height="138" />
            </div>
          </div>
        </div>
        <div class="info">
          <div class="nombre">${fullName}</div>
          <div class="doc-row">
            <span class="doc-value">C.C. ${escapeHtml(persona.documento)}</span>
          </div>
          <div class="doc-row doc-row--secondary">
            <span class="rh-value">Rh. ${rh}</span>
          </div>
        </div>
        <div class="body">
          <div class="qr-wrap">
            <div class="qr"><img src="${qrDataUrl}" alt="" width="168" height="168" /></div>
          </div>
          <div class="footer-meta">${meta}</div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

export async function buildBulkCarnetsHtml(
  persons: Person[],
  origin: string,
): Promise<string> {
  const cssPath = join(process.cwd(), "src/lib/bulk-carnet-print.css");
  const css = readFileSync(cssPath, "utf8");
  const baseUrl = origin.replace(/\/$/, "");
  const logoUrl = `${baseUrl}/assets/imgs/image.png`;
  const count = persons.length;
  const title =
    count === 0
      ? "Carnets SENA"
      : `Carnets SENA (${count} ${count === 1 ? "registro" : "registros"})`;

  if (count === 0) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
<style>${css}</style>
</head>
<body>
  <div class="bulk-toolbar no-print">
    <h1>Sin carnets para exportar</h1>
    <p>No hay registros con los filtros actuales. Ajuste la busqueda e intente de nuevo.</p>
  </div>
  <div class="bulk-empty"><p>No hay datos.</p></div>
</body>
</html>`;
  }

  const blocks = await Promise.all(
    persons.map((p, i) =>
      oneCarnetBlock(p, baseUrl, logoUrl, i === persons.length - 1),
    ),
  );

  const toolbar = `<div class="bulk-toolbar no-print">
  <h1>${escapeHtml(title)}</h1>
  <p>
    Vista previa con el mismo diseno que en la web. Al imprimir: <strong>una hoja A4 por carnet</strong>.
    Si necesita tamano plastico 8,5 x 5,5 cm, en el cuadro de impresion use <strong>escala</strong> o recorte segun su impresora.
    <kbd>Ctrl+P</kbd> -> Guardar como PDF.
  </p>
  <button type="button" onclick="window.print()">Imprimir / Guardar PDF</button>
</div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
<style>${css}</style>
</head>
<body>
${toolbar}
${blocks.join("\n")}
</body>
</html>`;
}
