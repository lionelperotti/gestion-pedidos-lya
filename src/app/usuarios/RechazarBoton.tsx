"use client";

import { useState } from "react";
import { rechazarUsuario } from "./actions";

export default function RechazarBoton({ usuarioId }: { usuarioId: string }) {
  const [enviando, setEnviando] = useState(false);

  async function handleClick() {
    if (!confirm("¿Seguro que querés rechazar este acceso? Se va a eliminar el registro pendiente.")) {
      return;
    }
    setEnviando(true);
    try {
      await rechazarUsuario(usuarioId);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={enviando}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
    >
      Cancelar
    </button>
  );
}
