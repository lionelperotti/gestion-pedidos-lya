import type jsPDF from "jspdf";
import type { UserOptions } from "jspdf-autotable";

export interface ItemBloquePedido {
  codigo: string | null;
  nombre: string;
  cantidad: number;
  precioSinIva: number;
  iva: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface BloquePedido {
  numero: number;
  cliente: string;
  clienteCuit: string | null;
  clienteDireccion: string | null;
  conFactura: boolean;
  modalidadPago: "CONTADO" | "CUENTA_CORRIENTE";
  observaciones: string | null;
  items: ItemBloquePedido[];
}

export type AutoTable = (doc: jsPDF, options: UserOptions) => void;

export const MARGEN_X = 14;
export const MARGEN_SUPERIOR = 15;
export const MARGEN_INFERIOR = 15;

const moneda = (n: number) =>
  `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const porcentaje = (n: number) =>
  `${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;

const derecha = { halign: "right" as const };

/** Texto que puede tener saltos de línea, partido para que entre en el ancho dado. */
function partirTexto(doc: jsPDF, texto: string, ancho: number): string[] {
  return texto
    .split(/\r?\n/)
    .flatMap((linea) => doc.splitTextToSize(linea.trim() === "" ? " " : linea, ancho) as string[]);
}

/**
 * Dibuja un pedido (cliente, condiciones, observaciones y tabla de productos)
 * a partir de la posición `yInicial` y devuelve la posición donde termina.
 *
 * - Las observaciones largas se parten en varias líneas hacia abajo.
 * - Si el pedido es tan largo que ocupa más de una hoja, los títulos de las
 *   columnas salen una sola vez (al principio) y el total una sola vez (al final).
 * - Las columnas numéricas (cantidades, precios, IVA, descuento, subtotal) y los
 *   totales van alineados a la derecha.
 */
export function dibujarBloquePedido(
  doc: jsPDF,
  autoTable: AutoTable,
  pedido: BloquePedido,
  yInicial: number,
  opciones: { mostrarNumero: boolean; etiquetaTotal: string }
): number {
  let y = yInicial;
  const ancho = doc.internal.pageSize.getWidth() - MARGEN_X * 2;

  // Cliente
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const titulo = opciones.mostrarNumero
    ? `${pedido.cliente} — Pedido #${pedido.numero}`
    : pedido.cliente;
  const lineasTitulo = doc.splitTextToSize(titulo, ancho) as string[];
  doc.text(lineasTitulo, MARGEN_X, y);
  y += lineasTitulo.length * 5;
  doc.setFont("helvetica", "normal");

  // Datos del cliente y condiciones
  doc.setFontSize(9);
  doc.setTextColor(80);
  const datos = [
    pedido.clienteCuit ? `CUIT: ${pedido.clienteCuit}` : null,
    pedido.clienteDireccion ? `Domicilio: ${pedido.clienteDireccion}` : null,
    pedido.conFactura ? "Con factura" : "Sin factura",
    pedido.modalidadPago === "CONTADO" ? "Contado" : "Cuenta corriente",
  ]
    .filter(Boolean)
    .join("  ·  ");
  const lineasDatos = partirTexto(doc, datos, ancho);
  doc.text(lineasDatos, MARGEN_X, y);
  y += lineasDatos.length * 4;

  // Observaciones: ocupan todas las líneas que necesiten
  if (pedido.observaciones && pedido.observaciones.trim() !== "") {
    const lineasObs = partirTexto(doc, `Obs: ${pedido.observaciones}`, ancho);
    doc.text(lineasObs, MARGEN_X, y);
    y += lineasObs.length * 4;
  }
  doc.setTextColor(0);
  y += 2;

  const total = pedido.items.reduce((acc, item) => acc + item.subtotal, 0);

  autoTable(doc, {
    startY: y,
    margin: {
      left: MARGEN_X,
      right: MARGEN_X,
      top: MARGEN_SUPERIOR,
      bottom: MARGEN_INFERIOR,
    },
    head: [
      [
        "Código",
        "Producto",
        { content: "Cant.", styles: derecha },
        { content: "S/IVA", styles: derecha },
        { content: "IVA %", styles: derecha },
        { content: "Precio", styles: derecha },
        { content: "Desc.", styles: derecha },
        { content: "Subtotal", styles: derecha },
      ],
    ],
    body: pedido.items.map((item) => [
      item.codigo ?? "—",
      item.nombre,
      String(item.cantidad),
      moneda(item.precioSinIva),
      porcentaje(item.iva),
      moneda(item.precioUnitario),
      porcentaje(item.descuento),
      moneda(item.subtotal),
    ]),
    foot: [
      [
        { content: opciones.etiquetaTotal, colSpan: 7, styles: derecha },
        { content: moneda(total), styles: derecha },
      ],
    ],
    // Un pedido que se parte en dos hojas no repite títulos ni totales
    showHead: "firstPage",
    showFoot: "lastPage",
    // una fila de producto nunca queda partida entre dos hojas
    rowPageBreak: "avoid",
    columnStyles: {
      2: derecha,
      3: derecha,
      4: derecha,
      5: derecha,
      6: derecha,
      7: derecha,
    },
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: [30, 64, 175] },
    footStyles: { fillColor: [241, 245, 249], textColor: 0, fontStyle: "bold" },
  });

  const tabla = doc as unknown as { lastAutoTable: { finalY: number } };
  return tabla.lastAutoTable.finalY + 8;
}
