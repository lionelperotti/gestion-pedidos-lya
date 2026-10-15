"use client";

import { useState } from "react";

export type TipoColumna = "texto" | "entero" | "moneda" | "porcentaje";

export interface ColumnaReporte {
  header: string;
  /** Las columnas numéricas se guardan como números y van alineadas a la derecha. */
  tipo?: TipoColumna;
}

const esNumerica = (tipo?: TipoColumna) => tipo !== undefined && tipo !== "texto";

function formatearParaPdf(valor: string | number, tipo?: TipoColumna): string {
  if (typeof valor !== "number") return String(valor);
  switch (tipo) {
    case "moneda":
      return `$${valor.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    case "porcentaje":
      return `${valor.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
    case "entero":
      return valor.toLocaleString("es-AR");
    default:
      return String(valor);
  }
}

export default function ExportarBotones({
  titulo,
  nombreArchivo,
  columnas,
  filas,
}: {
  titulo: string;
  nombreArchivo: string;
  columnas: ColumnaReporte[];
  // Cada fila viene en el mismo orden que "columnas". Las columnas numéricas traen el
  // número crudo (no texto), y cada formato (PDF o Excel) lo presenta como corresponde.
  // (No se pasan funciones: un Server Component no puede pasarle funciones a un
  // Client Component.)
  filas: (string | number)[][];
}) {
  const [generando, setGenerando] = useState<"excel" | "pdf" | null>(null);

  async function handleExcel() {
    setGenerando("excel");
    try {
      const XLSX = await import("xlsx");
      const hoja = XLSX.utils.aoa_to_sheet([columnas.map((c) => c.header), ...filas]);

      // Formato numérico de cada columna (los números quedan alineados a la derecha)
      const formatos: Record<string, string> = {
        moneda: "#,##0.00",
        entero: "#,##0",
        porcentaje: 'General"%"',
      };
      columnas.forEach((col, c) => {
        const formato = col.tipo ? formatos[col.tipo] : undefined;
        if (!formato) return;
        for (let r = 1; r <= filas.length; r++) {
          const celda = hoja[XLSX.utils.encode_cell({ r, c })];
          if (celda && celda.t === "n") celda.z = formato;
        }
      });

      // Ancho de cada columna según su contenido
      hoja["!cols"] = columnas.map((col, c) => ({
        wch: Math.min(
          50,
          Math.max(
            col.header.length,
            ...filas.map((f) => formatearParaPdf(f[c], col.tipo).length)
          ) + 2
        ),
      }));

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

      const derecha = { halign: "right" as const };

      autoTable(doc, {
        startY: 27,
        margin: { left: 14, right: 14 },
        head: [
          columnas.map((c) =>
            esNumerica(c.tipo) ? { content: c.header, styles: derecha } : c.header
          ),
        ],
        body: filas.map((fila) =>
          fila.map((valor, i) => formatearParaPdf(valor, columnas[i].tipo))
        ),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 64, 175] },
        columnStyles: Object.fromEntries(
          columnas.map((c, i) => [i, esNumerica(c.tipo) ? derecha : {}])
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
