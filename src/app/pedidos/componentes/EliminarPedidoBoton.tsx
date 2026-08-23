"use client";

import { useState } from "react";
import { eliminarPedido } from "../actions";

export default function EliminarPedidoBoton({ pedidoId }: { pedidoId: string }) {
  const [enviando, setEnviando] = useState(false);

  async function handleClick() {
    const confirmado = confirm(
      "¿Seguro que querés eliminar este pedido? Esta acción no se puede deshacer y no vas a poder volver a verlo."
    );
    if (!confirmado) return;

    setEnviando(true);
    try {
      await eliminarPedido(pedidoId);
    } catch {
      setEnviando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={enviando}
      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {enviando ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
