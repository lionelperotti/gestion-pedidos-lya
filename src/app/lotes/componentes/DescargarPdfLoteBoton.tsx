"use client";

import { useState } from "react";
import PdfPreviewModal from "./PdfPreviewModal";

export default function DescargarPdfLoteBoton({ loteId }: { loteId: string }) {
  const [mostrarModal, setMostrarModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMostrarModal(true)}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Ver / Descargar PDF
      </button>
      {mostrarModal && (
        <PdfPreviewModal loteId={loteId} onClose={() => setMostrarModal(false)} />
      )}
    </>
  );
}
