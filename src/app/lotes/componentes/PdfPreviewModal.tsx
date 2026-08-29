"use client";

import { useEffect, useState } from "react";
import { obtenerDatosLoteParaPdf } from "../reporte-actions";
import { generarPdfLote } from "./pdfLote";

export default function PdfPreviewModal({
  loteId,
  onClose,
}: {
  loteId: string;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("lote.pdf");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelado = false;

    (async () => {
      try {
        const lote = await obtenerDatosLoteParaPdf(loteId);

        if (lote.pedidos.length === 0) {
          if (!cancelado) {
            setError("Este lote todavía no tiene pedidos.");
            setCargando(false);
          }
          return;
        }

        const doc = await generarPdfLote(lote);
        const blob = doc.output("blob");
        objectUrl = URL.createObjectURL(blob);

        if (cancelado) return;

        setUrl(objectUrl);
        const fecha = new Date().toLocaleDateString("es-AR").replaceAll("/", "-");
        setFilename(`lote-${lote.numero}-${fecha}.pdf`);
      } catch {
        if (!cancelado) setError("Ocurrió un error al generar el PDF.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [loteId]);

  function handleDescargar() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <span className="text-sm font-medium text-slate-700">Vista previa del PDF</span>
        <div className="flex gap-2">
          {url && (
            <button
              type="button"
              onClick={handleDescargar}
              className="rounded-lg bg-blue-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Descargar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-slate-100">
        {cargando && (
          <p className="p-6 text-center text-slate-500">Generando el PDF...</p>
        )}
        {error && <p className="p-6 text-center text-red-600">{error}</p>}
        {url && <iframe src={url} className="h-full w-full" title="Vista previa del PDF" />}
      </div>
    </div>
  );
}
