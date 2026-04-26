import Link from "next/link";
import { uploadSpreadsheetAction } from "@/app/actions/upload";

type Props = { searchParams: Promise<{ msg?: string }> };

export default async function UploadPage({ searchParams }: Props) {
  const sp = await searchParams;
  const msg = sp.msg ?? "";

  return (
    <>
      <header className="top">
        <div className="top-inner">
          <h1>Importar personas</h1>
          <nav>
            <Link href="/">Volver</Link>
          </nav>
        </div>
      </header>
      <section className="panel">
        {msg ? <div className="alert">{msg}</div> : null}
        <form className="upload" action={uploadSpreadsheetAction}>
          <label>
            Archivo Excel o CSV con columnas: documento, nombres, apellidos,
            tipo, centro, tipo_sangre, telefono, ficha, empresa
          </label>
          <input type="file" name="archivo" required accept=".csv,.xlsx,.xls" />
          <button type="submit">Cargar</button>
        </form>
        <p>
          El PDF no se parsea automaticamente; conviertalo a Excel/CSV antes
          de cargarlo.
        </p>
      </section>
    </>
  );
}
