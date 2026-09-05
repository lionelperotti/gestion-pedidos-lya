"use client";

import { useState } from "react";

export interface ColumnaReporte<T> {
  header: string;
  accessor: (fila: T) => string | number;
  alineacionDerecha?: boolean;
}

export default function ExportarBotones<T>({
  titulo,
  nombreArchivo,
  columnas,
  filas,
}: {
  titulo: string;
  nombreArchivo: string;
  columnas: ColumnaReporte<T>[];
  filas: T[];
}) {
  const [generando, setGenerando] = useState<"excel" | "pdf" | null>(null);

  async function handleExcel() {
    setGenerando("excel");
    try {
      const XLSX = await import("xlsx");
      const datos = filas.map((fila) => {
        const fila2: Record<string, string | number> = {};
        for (const col of columnas) {
          fila2[col.header] = col.accessor(fila);
        }
        return fila2;
      });
      const hoja = XLSX.utils.json_to_sheet(datos);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Reporte");
      XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
    } finally {
      setGenerando(null);
    }
  }

  async function handlePdf() {
    setGenerando("pdf");
    try {
      const { default: JsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new JsPDF();
      doc.setFontSize(14);
      doc.text(titulo, 14, 15);
      doc.setFontSize(9);
      doc.text(`Generado el ${new Date().toLocaleDateString("es-AR")}`, 14, 21);

      autoTable(doc, {
        startY: 27,
        margin: { left: 14, right: 14 },
        head: [columnas.map((c) => c.header)],
        body: filas.map((fila) => columnas.map((c) => String(c.accessor(fila)))),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 64, 175] },
        columnStyles: Object.fromEntries(
          columnas
            .map((c, i) => (c.alineacionDerecha ? [i, { halign: "right" as const }] : null))
            .filter((x): x is [number, { halign: "right" }] => x !== null)
        ),
      });

      doc.save(`${nombreArchivo}.pdf`);
    } finally {
      setGenerando(null);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleExcel}
        disabled={generando !== null || filas.length === 0}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {generando === "excel" ? "Generando..." : "Exportar Excel"}
      </button>
      <button
        type="button"
        onClick={handlePdf}
        disabled={generando !== null || filas.length === 0}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {generando === "pdf" ? "Generando..." : "Exportar PDF"}
      </button>
    </div>
  );
}
