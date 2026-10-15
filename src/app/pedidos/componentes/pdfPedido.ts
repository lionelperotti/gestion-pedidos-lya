import type jsPDF from "jspdf";
import {
  dibujarBloquePedido,
  MARGEN_X,
  MARGEN_SUPERIOR,
  type AutoTable,
  type BloquePedido,
  type ItemBloquePedido,
} from "@/lib/pdfBloquePedido";

export type ItemPedidoPdf = ItemBloquePedido;

export interface PedidoPdf extends BloquePedido {
  vendedor: string;
  creadoEn: string;
}

export async function generarPdfPedido(pedido: PedidoPdf): Promise<jsPDF> {
  const { default: JsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default as unknown as AutoTable;

  const doc = new JsPDF();
  let y = MARGEN_SUPERIOR;

  doc.setFontSize(16);
  doc.text(`Pedido #${pedido.numero}`, MARGEN_X, y);
  doc.setFontSize(10);
  doc.text(
    `Vendedor: ${pedido.vendedor} · Fecha: ${new Date(pedido.creadoEn).toLocaleDateString(
      "es-AR"
    )}`,
    MARGEN_X,
    y + 6
  );
  y += 14;

  dibujarBloquePedido(doc, autoTable, pedido, y, {
    mostrarNumero: false,
    etiquetaTotal: "Total",
  });

  return doc;
}
