import { NextResponse } from "next/server";
import {
  buildQrPayload,
  guessGender,
  resolvePersonPhoto,
} from "@/lib/carnet-utils";
import { getPerson } from "@/lib/persons";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const persona = await getPerson(id);
  if (!persona) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const gender = guessGender(persona.nombres ?? "");
  const photoSrc = resolvePersonPhoto(
    persona.documento,
    persona.id,
    gender === "neutral" ? "male" : gender,
  );
  const qrPayload = buildQrPayload(persona);
  return NextResponse.json({ persona, photoSrc, qrPayload });
}
