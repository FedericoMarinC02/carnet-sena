"use client";

import { useCallback, useEffect, useState } from "react";
import { CarnetClientLazy } from "@/components/CarnetClientLazy";
import type { Person } from "@/lib/persons";

type CarnetPayload = {
  persona: Person;
  photoSrc: string;
  qrPayload: string;
};

function ModalCarnetSkeleton() {
  return (
    <div className="modal-carnet-skeleton" aria-hidden>
      <div className="modal-carnet-skeleton__shine" />
    </div>
  );
}

export function CarnetModalHost() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CarnetPayload | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setPayload(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("button.view-carnet");
      if (!el) return;
      e.preventDefault();
      const raw = (el as HTMLButtonElement).dataset.carnetId;
      if (!raw) return;
      setOpen(true);
      setLoading(true);
      setError(null);
      setPayload(null);
      void fetch(`/api/persons/${raw}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error("No encontrado");
          }
          return res.json() as Promise<CarnetPayload>;
        })
        .then((data) => {
          setPayload(data);
        })
        .catch(() => {
          setError("No se pudo cargar el carnet.");
        })
        .finally(() => {
          setLoading(false);
        });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <div
      id="carnetModal"
      className={`modal ${open ? "modal--open" : "hidden"}`}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="modal-dialog modal-dialog--carnet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="carnet-modal-title"
        aria-busy={loading}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-chrome">
          <h2 id="carnet-modal-title" className="modal-title">
            Carnet
          </h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Cerrar"
            onClick={close}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-carnet-body">
          {loading ? <ModalCarnetSkeleton /> : null}
          {error && !loading ? (
            <p className="modal-carnet-error" role="alert">
              {error}
            </p>
          ) : null}
          {payload && !loading ? (
            <div className="modal-carnet-floating" id="carnet-modal-print-root">
              <CarnetClientLazy
                persona={payload.persona}
                photoSrc={payload.photoSrc}
                qrPayload={payload.qrPayload}
                variant="modal"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
