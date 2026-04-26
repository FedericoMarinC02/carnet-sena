"use client";

import dynamic from "next/dynamic";

/** Carga el carnet (y react-qr-code) solo en el cliente para evitar fallos de chunks de Webpack. */
export const CarnetClientLazy = dynamic(
  () => import("@/components/CarnetClient"),
  {
    ssr: false,
    loading: () => (
      <div className="modal-carnet-skeleton" aria-hidden>
        <div className="modal-carnet-skeleton__shine" />
      </div>
    ),
  },
);
