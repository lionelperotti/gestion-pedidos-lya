"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { marcarLoteEnviado } from "../actions";

export default function MarcarEnviadoBoton({ loteId }: { loteId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function handleClick() {
    if (
      !confirm(
        "¿Marcar este lote como enviado? Una vez enviado, no vas a poder agregar ni sacar pedidos."
      )
    )
      return;
    setEnviando(true);
    try {
      await marcarLoteEnviado(loteId);
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={enviando}
      className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
    >
      {enviando ? "Marcando..." : "Marcar como enviado"}
    </button>
  );
}
