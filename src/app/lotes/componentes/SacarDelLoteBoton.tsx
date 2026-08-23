"use client";

import { useState } from "react";
import { sacarDelLote } from "../actions";

export default function SacarDelLoteBoton({ pedidoId }: { pedidoId: string }) {
  const [enviando, setEnviando] = useState(false);

  async function handleClick() {
    if (!confirm("¿Sacar este pedido del lote? Vuelve a la lista de Pendientes.")) return;
    setEnviando(true);
    try {
      await sacarDelLote(pedidoId);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={enviando}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      {enviando ? "Sacando..." : "Sacar"}
    </button>
  );
}
