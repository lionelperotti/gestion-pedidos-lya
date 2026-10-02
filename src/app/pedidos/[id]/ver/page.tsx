import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import VerPedidoAcciones from "../../componentes/VerPedidoAcciones";

export default async function VerPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: true,
      vendedor: true,
      items: { include: { producto: true } },
    },
  });

  if (!pedido) {
    notFound();
  }

  if (usuario.perfil !== "Administrador" && pedido.vendedorId !== usuario.id) {
    redirect("/pedidos");
  }

  const total = pedido.items.reduce(
    (acc, item) =>
      acc +
      Number(item.precioUnitario) * item.cantidad * (1 - Number(item.descuento) / 100),
    0
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4 print:hidden">
        <Link href={`/pedidos/${pedido.id}`} className="text-sm text-blue-700 hover:underline">
          ← Volver al pedido
        </Link>
        <VerPedidoAcciones pedidoId={pedido.id} />
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Pedido #{pedido.numero}</h1>
              <p className="text-sm text-slate-500">
                {new Date(pedido.creadoEn).toLocaleDateString("es-AR")} · Vendedor:{" "}
                {pedido.vendedor.nombre}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                pedido.estado === "EN_LOTE"
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {pedido.estado === "EN_LOTE" ? "En lote" : "Pendiente"}
            </span>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Cliente</p>
              <p className="font-medium text-slate-900">{pedido.cliente.nombre}</p>
              <p className="text-slate-600">CUIT: {pedido.cliente.cuit}</p>
              {pedido.cliente.direccion && (
                <p className="text-slate-600">{pedido.cliente.direccion}</p>
              )}
            </div>
            <div>
              <p className="text-slate-500">Condiciones</p>
              <p className="text-slate-900">
                {pedido.conFactura ? "Con factura" : "Sin factura"}
              </p>
              <p className="text-slate-900">
                {pedido.modalidadPago === "CONTADO" ? "Contado" : "Cuenta corriente"}
              </p>
            </div>
          </div>

          {pedido.observaciones && (
            <div className="mb-6 rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <p className="text-slate-500">Observaciones</p>
              <p className="text-slate-700">{pedido.observaciones}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2 font-medium">Código</th>
                  <th className="py-2 font-medium">Producto</th>
                  <th className="py-2 text-right font-medium">Cant.</th>
                  <th className="py-2 text-right font-medium">S/IVA</th>
                  <th className="py-2 text-right font-medium">IVA</th>
                  <th className="py-2 text-right font-medium">Precio</th>
                  <th className="py-2 text-right font-medium">Desc.</th>
                  <th className="py-2 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedido.items.map((item) => {
                  const subtotal =
                    Number(item.precioUnitario) *
                    item.cantidad *
                    (1 - Number(item.descuento) / 100);
                  return (
                    <tr key={item.id}>
                      <td className="py-2 text-slate-600">
                        {item.producto.codigoProveedor ?? "—"}
                      </td>
                      <td className="py-2 text-slate-900">{item.producto.nombre}</td>
                      <td className="py-2 text-right text-slate-600">{item.cantidad}</td>
                      <td className="py-2 text-right text-slate-600">
                        ${Number(item.precioSinIva).toLocaleString("es-AR")}
                      </td>
                      <td className="py-2 text-right text-slate-600">{Number(item.iva)}%</td>
                      <td className="py-2 text-right text-slate-600">
                        ${Number(item.precioUnitario).toLocaleString("es-AR")}
                      </td>
                      <td className="py-2 text-right text-slate-600">
                        {Number(item.descuento) > 0 ? `${item.descuento}%` : "—"}
                      </td>
                      <td className="py-2 text-right font-medium text-slate-900">
                        ${subtotal.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200">
                  <td colSpan={7} className="py-3 text-right font-semibold text-slate-700">
                    Total
                  </td>
                  <td className="py-3 text-right text-lg font-bold text-blue-700">
                    ${total.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
