import type jsPDF from "jspdf";
import {
  dibujarBloquePedido,
  MARGEN_X,
  MARGEN_SUPERIOR,
  MARGEN_INFERIOR,
  type AutoTable,
  type BloquePedido,
  type ItemBloquePedido,
} from "@/lib/pdfBloquePedido";

export type ItemLotePdf = ItemBloquePedido;
export type PedidoLotePdf = BloquePedido;

export interface LotePdf {
  numero: number;
  vendedor: string;
  creadoEn: string;
  enviadoEn: string | null;
  pedidos: PedidoLotePdf[];
}

export async function generarPdfLote(lote: LotePdf): Promise<jsPDF> {
  const { default: JsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default as unknown as AutoTable;

  const doc = new JsPDF();
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();
  const opciones = { mostrarNumero: true, etiquetaTotal: "Total pedido" };

  let y = MARGEN_SUPERIOR;

  doc.setFontSize(16);
  doc.text(`Lote de Pedidos #${lote.numero}`, MARGEN_X, y);
  doc.setFontSize(10);
  doc.text(
    `Vendedor: ${lote.vendedor} · Creado: ${new Date(lote.creadoEn).toLocaleDateString(
      "es-AR"
    )}${
      lote.enviadoEn
        ? ` · Enviado: ${new Date(lote.enviadoEn).toLocaleDateString("es-AR")}`
        : " · Sin enviar todavía"
    }`,
    MARGEN_X,
    y + 6
  );
  y += 16;

  let totalGeneral = 0;

  for (const pedido of lote.pedidos) {
    totalGeneral += pedido.items.reduce((acc, item) => acc + item.subtotal, 0);

    // Se dibuja primero en una hoja de prueba para saber cuánto ocupa el pedido.
    // Si entra completo en una hoja pero no en lo que queda de la actual, pasa
    // entero a la hoja siguiente en vez de quedar partido en dos.
    const prueba = new JsPDF();
    const finPrueba = dibujarBloquePedido(prueba, autoTable, pedido, MARGEN_SUPERIOR, opciones);
    const altura = finPrueba - MARGEN_SUPERIOR;
    const entraEnUnaHoja = prueba.getNumberOfPages() === 1;
    const espacioMinimo = entraEnUnaHoja ? altura : Math.min(altura, 45);

    if (y + espacioMinimo > altoPagina - MARGEN_INFERIOR) {
      doc.addPage();
      y = MARGEN_SUPERIOR;
    }

    y = dibujarBloquePedido(doc, autoTable, pedido, y, opciones);
  }

  if (y > altoPagina - MARGEN_INFERIOR - 12) {
    doc.addPage();
    y = MARGEN_SUPERIOR;
  }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total del lote: $${totalGeneral.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    anchoPagina - MARGEN_X,
    y + 4,
    { align: "right" }
  );

  return doc;
}
