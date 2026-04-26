import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CarnetClientLazy } from "@/components/CarnetClientLazy";
import {
  buildQrPayload,
  guessGender,
  resolvePersonPhoto,
} from "@/lib/carnet-utils";
import { getPerson } from "@/lib/persons";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const persona = await getPerson(Number(id));
  if (!persona) return { title: "Carnet" };
  return { title: `Carnet ${persona.nombres}` };
}

export default async function CarnetPage({ params }: Props) {
  const { id } = await params;
  const persona = await getPerson(Number(id));
  if (!persona || Number.isNaN(Number(id))) notFound();

  const gender = guessGender(persona.nombres ?? "");
  const photoSrc = resolvePersonPhoto(
    persona.documento,
    persona.id,
    gender === "neutral" ? "male" : gender,
  );
  const qrPayload = buildQrPayload(persona);

  return (
    <div className="canvas">
      <CarnetClientLazy
        persona={persona}
        photoSrc={photoSrc}
        qrPayload={qrPayload}
        variant="page"
      />
    </div>
  );
}
