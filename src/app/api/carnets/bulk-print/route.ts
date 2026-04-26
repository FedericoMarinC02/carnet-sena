import { NextResponse } from "next/server";
import { buildBulkCarnetsHtml } from "@/lib/bulk-carnet-html";
import { listPersons } from "@/lib/persons";

function getOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto = forwardedProto ?? url.protocol.replace(":", "");
    return `${proto}://${forwardedHost}`;
  }
  return url.origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const buscar = searchParams.get("buscar") ?? "";
  const centro = searchParams.get("centro") ?? "";
  const ficha = searchParams.get("ficha") ?? "";

  const persons = await listPersons(
    buscar,
    centro || null,
    ficha || null,
  );

  const origin = getOrigin(request);
  const html = await buildBulkCarnetsHtml(persons, origin);

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `carnets-sena-${stamp}.html`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
