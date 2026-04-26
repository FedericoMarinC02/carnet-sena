import Link from "next/link";
import { pingDb } from "@/lib/db";
import {
  listCentros,
  listFichas,
  listPersons,
} from "@/lib/persons";
import { CarnetModalHost } from "./CarnetModalHost";
import { SearchFilters } from "@/components/SearchFilters";

/** Evita error de chunk al prerenderizar "/" con el modal y react-qr-code. */
export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const buscar = typeof sp.buscar === "string" ? sp.buscar : "";
  const centro = typeof sp.centro === "string" ? sp.centro : "";
  const ficha = typeof sp.ficha === "string" ? sp.ficha : "";

  try {
    await pingDb();
  } catch {
    return (
      <div className="db-error">
        <h1>Error de base de datos</h1>
        <p>
          No se pudo conectar a MySQL. Revise que el servicio esté activo y
          cree un archivo <code>.env.local</code> con las variables de{" "}
          <code>.env.example</code> (misma base que <code>laraip.sql</code>).
        </p>
      </div>
    );
  }

  const [centros, fichas, persons] = await Promise.all([
    listCentros(),
    listFichas(),
    listPersons(buscar, centro || null, ficha || null),
  ]);

  const exportParams = new URLSearchParams();
  if (buscar) exportParams.set("buscar", buscar);
  if (centro) exportParams.set("centro", centro);
  if (ficha) exportParams.set("ficha", ficha);
  const bulkPrintHref = `/api/carnets/bulk-print${exportParams.size ? `?${exportParams}` : ""}`;

  return (
    <>
      <header className="top">
        <div className="top-inner">
          <h1>Sistema de Carnets</h1>
          <nav>
            {persons.length > 0 ? (
              <a href={bulkPrintHref} download>
                Descargar carnets (imprimir)
              </a>
            ) : null}
            <Link href="/upload">Cargar Excel/PDF</Link>
          </nav>
        </div>
      </header>
      <section className="panel">
        <SearchFilters
          centros={centros}
          fichas={fichas}
          initialBuscar={buscar}
          initialCentro={centro}
          initialFicha={ficha}
        />
        <div className="grid">
          {persons.map((p) => (
            <article className="card-item" key={p.id}>
              <div className="tag">{p.tipo.toUpperCase()}</div>
              <div className="name">
                {p.nombres} {p.apellidos}
              </div>
              <div className="doc">Doc: {p.documento}</div>
              <div className="meta">RH: {p.tipo_sangre ?? "-"}</div>
              <div className="meta">Centro: {p.centro ?? "-"}</div>
              <button
                type="button"
                className="btn view-carnet"
                data-carnet-id={p.id}
              >
                Ver carnet
              </button>
            </article>
          ))}
          {persons.length === 0 ? (
            <p>Sin registros. Cargue un Excel o agregue manualmente.</p>
          ) : null}
        </div>
      </section>
      <CarnetModalHost />
    </>
  );
}
