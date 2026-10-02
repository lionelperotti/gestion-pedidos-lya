"use client";

import { useState } from "react";
import PdfPedidoPreviewModal from "./PdfPedidoPreviewModal";

export default function VerPedidoAcciones({ pedidoId }: { pedidoId: string }) {
  const [mostrarModal, setMostrarModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMostrarModal(true)}
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Descargar / Imprimir PDF
      </button>
      {mostrarModal && (
        <PdfPedidoPreviewModal pedidoId={pedidoId} onClose={() => setMostrarModal(false)} />
      )}
    </>
  );
}
