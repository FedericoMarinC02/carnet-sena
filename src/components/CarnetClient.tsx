"use client";

import Image from "next/image";
import QRCode from "react-qr-code";
import type { Person } from "@/lib/persons";

type Props = {
  persona: Person;
  photoSrc: string;
  qrPayload: string;
  /** "modal" = flotante sobre la lista; "page" = vista /carnet/id */
  variant?: "modal" | "page";
};

export function CarnetClient({
  persona,
  photoSrc,
  qrPayload,
  variant = "page",
}: Props) {
  const tipoClass = `tipo-${persona.tipo.toLowerCase().replace(/\s+/g, "-")}`;
  const rootClass =
    variant === "modal" ? "carnet-root carnet-root--modal" : "carnet-root";
  const roleLabel = persona.tipo.toUpperCase();
  const centroLines = (persona.centro ?? "")
    .split(/\r?\n| y /)
    .map((line) => line.trim())
    .filter(Boolean);
  const regional = persona.regional?.trim() ?? "";

  return (
    <div className={rootClass}>
      <div className="carnet-shell">
        <span className="frame-tab frame-tab--left" aria-hidden="true" />
        <span className="frame-tab frame-tab--right" aria-hidden="true" />
        <span className="frame-tab frame-tab--bottom-left" aria-hidden="true" />
        <span className="frame-tab frame-tab--bottom-right" aria-hidden="true" />
        <div className={`carnet ${tipoClass}`} id="carnet">
          <div className="top-band" aria-hidden="true" />

          <div className="head-row">
            <div className="head-left">
              <Image
                src="/assets/imgs/image.png"
                alt="SENA"
                className="logo"
                width={200}
                height={70}
                priority
              />
              <div className="role-wrap role-wrap--head">
                <span className="role">{roleLabel}</span>
              </div>
            </div>
            <div className="foto-wrap">
              <div className="foto">
                <Image
                  src={photoSrc}
                  alt={`Foto de ${persona.nombres}`}
                  width={126}
                  height={138}
                  unoptimized
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
          </div>

          <div className="info">
            <div className="nombre">{persona.nombres} {persona.apellidos}</div>
            <div className="doc-row">
              <span className="doc-value">C.C. {persona.documento}</span>
            </div>
            <div className="doc-row doc-row--secondary">
              <span className="rh-value">Rh. {persona.tipo_sangre ?? "-"}</span>
            </div>
          </div>

          <div className="body">
            <div className="qr-wrap">
              <div className="qr">
                <QRCode value={qrPayload} size={168} />
              </div>
            </div>

            <div className="footer-meta">
              {persona.ficha ? (
                <div className="meta-line meta-line--muted">Ficha {persona.ficha}</div>
              ) : null}
              {regional ? <div className="meta-line meta-line--regional">{regional}</div> : null}
              {centroLines.map((line) => (
                <div key={line} className="meta-line">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="actions">
        <button type="button" onClick={() => window.print()}>
          Imprimir / Guardar PDF
        </button>
      </div>
    </div>
  );
}

export default CarnetClient;