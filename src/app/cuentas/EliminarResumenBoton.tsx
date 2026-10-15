"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eliminarResumen } from "./actions";

export default function EliminarResumenBoton({ resumenId }: { resumenId: string }) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (
      !confirm(
        "¿Eliminar este resumen? Se borra con todos sus comprobantes y deja de figurar en el historial de los clientes. No se puede deshacer."
      )
    )
      return;
    setEliminando(true);
    setError(null);
    const res = await eliminarResumen(resumenId);
    if (res.ok) {
      router.push("/cuentas");
    } else {
      setError(res.error);
      setEliminando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={eliminando}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {eliminando ? "Eliminando..." : "Eliminar resumen"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
