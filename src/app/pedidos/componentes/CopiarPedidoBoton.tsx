"use client";

import { useState } from "react";
import { copiarPedido } from "../actions";

export default function CopiarPedidoBoton({ pedidoId }: { pedidoId: string }) {
  const [enviando, setEnviando] = useState(false);

  async function handleClick() {
    setEnviando(true);
    try {
      await copiarPedido(pedidoId);
    } catch {
      setEnviando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={enviando}
      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
    >
      {enviando ? "Copiando..." : "Copiar pedido"}
    </button>
  );
}
