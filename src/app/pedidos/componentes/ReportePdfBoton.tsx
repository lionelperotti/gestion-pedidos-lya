"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerPedidosPendientesParaReporte, marcarPedidosComoExportados } from "../reporte-actions";

export default function ReportePdfBoton() {
  const router = useRouter();
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (
      !confirm(
        "Se va a generar el PDF con todos los pedidos pendientes, y esos pedidos van a pasar a la lista de 'Enviados'. ¿Confirmás?"
      )
    ) {
      return;
    }

    setGenerando(true);
    setError(null);
    try {
      const pedidos = await obtenerPedidosPendientesParaReporte();

      if (pedidos.length === 0) {
        setError("No hay pedidos pendientes para incluir en el reporte.");
        setGenerando(false);
        return;
      }

      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const fecha = new Date().toLocaleDateString("es-AR");
      let y = 15;

      doc.setFontSize(16);
      doc.text("Reporte de Pedidos Pendientes", 14, y);
      doc.setFontSize(10);
      doc.text(`Generado el ${fecha}`, 14, y + 6);
      y += 14;

      // Agrupar por cliente
      const porCliente = new Map<string, typeof pedidos>();
      for (const pedido of pedidos) {
        const lista = porCliente.get(pedido.cliente) ?? [];
        lista.push(pedido);
        porCliente.set(pedido.cliente, lista);
      }

      let totalGeneral = 0;

      for (const [cliente, pedidosCliente] of porCliente) {
        if (y > 270) {
          doc.addPage();
          y = 15;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(cliente, 14, y);
        doc.setFont("helvetica", "normal");
        y += 5;

        const primerPedido = pedidosCliente[0];
        doc.setFontSize(9);
        doc.setTextColor(80);
        const datosCliente = [
          primerPedido.clienteCuit ? `CUIT: ${primerPedido.clienteCuit}` : null,
          primerPedido.clienteDireccion ? `Domicilio: ${primerPedido.clienteDireccion}` : null,
        ]
          .filter(Boolean)
          .join("  ·  ");
        if (datosCliente) {
          doc.text(datosCliente, 14, y);
          y += 5;
        }
        doc.setTextColor(0);

        for (const pedido of pedidosCliente) {
          const totalPedido = pedido.items.reduce((acc, item) => acc + item.subtotal, 0);
          totalGeneral += totalPedido;

          doc.setFontSize(9);
          doc.setTextColor(100);
          const infoLinea = `Pedido #${pedido.numero} · ${new Date(
            pedido.creadoEn
          ).toLocaleDateString("es-AR")} · Vendedor: ${pedido.vendedor} · ${
            pedido.conFactura ? "Con factura" : "Sin factura"
          } · ${pedido.modalidadPago === "CONTADO" ? "Contado" : "Cuenta corriente"}`;
          doc.text(infoLinea, 14, y);
          y += 4;
          if (pedido.observaciones) {
            doc.text(`Obs: ${pedido.observaciones}`, 14, y);
            y += 4;
          }
          doc.setTextColor(0);

          autoTable(doc, {
            startY: y,
            margin: { left: 14, right: 14 },
            head: [["Producto", "Cant.", "Precio", "Desc. %", "Subtotal"]],
            body: pedido.items.map((item) => [
              item.nombre,
              String(item.cantidad),
              `$${item.precioUnitario.toLocaleString("es-AR")}`,
              `${item.descuento}%`,
              `$${item.subtotal.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`,
            ]),
            foot: [["", "", "", "Total pedido", `$${totalPedido.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`]],
            styles: { fontSize: 8 },
            headStyles: { fillColor: [30, 64, 175] },
            footStyles: { fillColor: [241, 245, 249], textColor: 0, fontStyle: "bold" },
          });

          // @ts-expect-error -- lastAutoTable es agregado por el plugin jspdf-autotable
          y = doc.lastAutoTable.finalY + 8;

          if (y > 270) {
            doc.addPage();
            y = 15;
          }
        }
      }

      if (y > 270) {
        doc.addPage();
        y = 15;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total general: $${totalGeneral.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`,
        14,
        y + 4
      );

      doc.save(`pedidos-pendientes-${fecha.replaceAll("/", "-")}.pdf`);

      await marcarPedidosComoExportados(pedidos.map((p) => p.id));
      router.refresh();
    } catch {
      setError("Ocurrió un error al generar el reporte.");
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
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {generando ? "Generando..." : "Generar reporte PDF"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
