import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import CopiarPedidoBoton from "../componentes/CopiarPedidoBoton";
import EliminarPedidoBoton from "../componentes/EliminarPedidoBoton";

export default async function DetallePedidoPage({
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
  const esPendiente = pedido.estado === "PENDIENTE";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/pedidos" className="text-sm text-blue-700 hover:underline">
            ← Volver a Pedidos
          </Link>
          <h1 className="text-lg font-bold text-slate-900">
            Pedido #{pedido.numero}
          </h1>
        </div>
        {esPendiente ? (
          <div className="flex gap-2">
            <Link
              href={`/pedidos/${pedido.id}/editar`}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Editar
            </Link>
            <EliminarPedidoBoton pedidoId={pedido.id} />
          </div>
        ) : (
          <CopiarPedidoBoton pedidoId={pedido.id} />
        )}
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Cliente</p>
          <p className="font-medium text-slate-900">{pedido.cliente.nombre}</p>
          <p className="text-sm text-slate-600">CUIT: {pedido.cliente.cuit}</p>
          {pedido.cliente.telefono && (
            <p className="text-sm text-slate-600">{pedido.cliente.telefono}</p>
          )}
          {pedido.cliente.direccion && (
            <p className="text-sm text-slate-600">Domicilio: {pedido.cliente.direccion}</p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
            <div>
              <p className="text-slate-500">Vendedor</p>
              <p className="text-slate-900">{pedido.vendedor.nombre}</p>
            </div>
            <div>
              <p className="text-slate-500">Estado</p>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  pedido.estado === "EXPORTADO"
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {pedido.estado === "EXPORTADO" ? "Enviado" : "Pendiente"}
              </span>
            </div>
            <div>
              <p className="text-slate-500">Facturación</p>
              <p className="text-slate-900">
                {pedido.conFactura ? "Con factura" : "Sin factura"}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Modalidad de pago</p>
              <p className="text-slate-900">
                {pedido.modalidadPago === "CONTADO" ? "Contado" : "Cuenta corriente"}
              </p>
            </div>
          </div>

          {pedido.observaciones && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-sm text-slate-500">Observaciones</p>
              <p className="text-sm text-slate-700">{pedido.observaciones}</p>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 font-medium">Producto</th>
                <th className="px-4 py-2.5 text-right font-medium">Cant.</th>
                <th className="px-4 py-2.5 text-right font-medium">Precio</th>
                <th className="px-4 py-2.5 text-right font-medium">Desc.</th>
                <th className="px-4 py-2.5 text-right font-medium">Subtotal</th>
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
                    <td className="px-4 py-2.5 text-slate-900">
                      {item.producto.nombre}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600">
                      {item.cantidad}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600">
                      ${Number(item.precioUnitario).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600">
                      {Number(item.descuento) > 0 ? `${item.descuento}%` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">
                      ${subtotal.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-700">
                  Total
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-blue-700">
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
