"use client";

import { useState } from "react";
import { generarBackupCompleto } from "./actions";

export default function DescargarBackupBoton() {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  async function handleClick() {
    setGenerando(true);
    setError(null);
    setListo(false);
    try {
      const backup = await generarBackupCompleto();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const fecha = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-pedidoslya-${fecha}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setListo(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el backup.");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={generando}
        className="rounded-lg bg-blue-700 px-6 py-3 text-base font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {generando ? "Generando..." : "Descargar backup completo"}
      </button>
      {listo && (
        <p className="mt-2 text-sm text-green-700">
          Listo, se descargó el archivo. Guardalo en un lugar seguro (Google Drive, tu
          compu, etc.).
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
