"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

interface SearchFiltersProps {
  centros: string[];
  fichas: string[];
  initialBuscar: string;
  initialCentro: string;
  initialFicha: string;
}

export function SearchFilters({
  centros,
  fichas,
  initialBuscar,
  initialCentro,
  initialFicha,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [buscar, setBuscar] = useState(initialBuscar);
  const [centro, setCentro] = useState(initialCentro);
  const [ficha, setFicha] = useState(initialFicha);

  // Debounce la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (buscar) params.set("buscar", buscar);
      if (centro) params.set("centro", centro);
      if (ficha) params.set("ficha", ficha);

      startTransition(() => {
        router.push(`/?${params.toString()}`);
      });
    }, 300); // Espera 300ms después de dejar de escribir

    return () => clearTimeout(timer);
  }, [buscar, centro, ficha, router]);

  return (
    <div className="search" style={{ opacity: isPending ? 0.6 : 1 }}>
      <input
        type="search"
        placeholder="Buscar por documento o nombre"
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
        disabled={isPending}
      />
      <select
        value={centro}
        onChange={(e) => setCentro(e.target.value)}
        disabled={isPending}
      >
        <option value="">Todos los centros</option>
        {centros.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={ficha}
        onChange={(e) => setFicha(e.target.value)}
        disabled={isPending}
      >
        <option value="">Todas las fichas</option>
        {fichas.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      {isPending && <span className="searching">Buscando...</span>}
    </div>
  );
}
