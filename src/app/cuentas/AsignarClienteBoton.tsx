"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BuscadorClienteModal from "./BuscadorClienteModal";
import { asignarClienteAComprobantes } from "./actions";

export default function AsignarClienteBoton({
  resumenId,
  nombreEnResumen,
}: {
  resumenId: string;
  nombreEnResumen: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function elegir(clienteId: string) {
    setError(null);
    const res = await asignarClienteAComprobantes(resumenId, nombreEnResumen, clienteId);
    if (res.ok) {
      setAbierto(false);
      router.refresh();
    } else {
      setError(res.error);
      setAbierto(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Asignar cliente
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
      {abierto && (
        <BuscadorClienteModal
          titulo={`Asignar cliente a "${nombreEnResumen}"`}
          onElegir={(c) => elegir(c.id)}
          onCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
}
