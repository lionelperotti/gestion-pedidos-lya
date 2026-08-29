import type jsPDF from "jspdf";

export interface ItemLotePdf {
  codigo: string | null;
  nombre: string;
  cantidad: number;
  precioSinIva: number;
  iva: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface PedidoLotePdf {
  numero: number;
  cliente: string;
  clienteCuit: string | null;
  clienteDireccion: string | null;
  conFactura: boolean;
  modalidadPago: "CONTADO" | "CUENTA_CORRIENTE";
  observaciones: string | null;
  items: ItemLotePdf[];
}

export interface LotePdf {
  numero: number;
  vendedor: string;
  creadoEn: string;
  enviadoEn: string | null;
  pedidos: PedidoLotePdf[];
}

export async function generarPdfLote(lote: LotePdf): Promise<jsPDF> {
  const { default: JsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new JsPDF();
  let y = 15;

  doc.setFontSize(16);
  doc.text(`Lote de Pedidos #${lote.numero}`, 14, y);
  doc.setFontSize(10);
  doc.text(
    `Vendedor: ${lote.vendedor} · Creado: ${new Date(lote.creadoEn).toLocaleDateString(
      "es-AR"
    )}${
      lote.enviadoEn
        ? ` · Enviado: ${new Date(lote.enviadoEn).toLocaleDateString("es-AR")}`
        : " · Sin enviar todavía"
    }`,
    14,
    y + 6
  );
  y += 16;

  let totalGeneral = 0;

  for (const pedido of lote.pedidos) {
    if (y > 260) {
      doc.addPage();
      y = 15;
    }

    const totalPedido = pedido.items.reduce((acc, item) => acc + item.subtotal, 0);
    totalGeneral += totalPedido;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${pedido.cliente} — Pedido #${pedido.numero}`, 14, y);
    doc.setFont("helvetica", "normal");
    y += 5;

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
    doc.text(datos, 14, y);
    y += 4;
    if (pedido.observaciones) {
      doc.text(`Obs: ${pedido.observaciones}`, 14, y);
      y += 4;
    }
    doc.setTextColor(0);

    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["Código", "Producto", "Cant.", "S/IVA", "IVA %", "Precio", "Desc. %", "Subtotal"]],
      body: pedido.items.map((item) => [
        item.codigo ?? "—",
        item.nombre,
        String(item.cantidad),
        `$${item.precioSinIva.toLocaleString("es-AR")}`,
        `${item.iva}%`,
        `$${item.precioUnitario.toLocaleString("es-AR")}`,
        `${item.descuento}%`,
        `$${item.subtotal.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`,
      ]),
      foot: [
        [
          "",
          "",
          "",
          "",
          "",
          "",
          "Total pedido",
          `$${totalPedido.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`,
        ],
      ],
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [30, 64, 175] },
      footStyles: { fillColor: [241, 245, 249], textColor: 0, fontStyle: "bold" },
    });

    // @ts-expect-error -- lastAutoTable lo agrega el plugin jspdf-autotable
    y = doc.lastAutoTable.finalY + 8;
  }

  if (y > 270) {
    doc.addPage();
    y = 15;
  }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total del lote: $${totalGeneral.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`,
    14,
    y + 4
  );

  return doc;
}
