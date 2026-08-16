import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";

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
    (acc, item) => acc + Number(item.precioUnitario) * item.cantidad,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/pedidos" className="text-sm text-blue-700 hover:underline">
          ← Volver a Pedidos
        </Link>
        <h1 className="text-lg font-bold text-slate-900">
          Pedido #{pedido.numero}
        </h1>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Cliente</p>
          <p className="font-medium text-slate-900">{pedido.cliente.nombre}</p>
          {pedido.cliente.telefono && (
            <p className="text-sm text-slate-600">{pedido.cliente.telefono}</p>
          )}
          {pedido.cliente.direccion && (
            <p className="text-sm text-slate-600">{pedido.cliente.direccion}</p>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm text-slate-500">
              Vendedor: {pedido.vendedor.nombre}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                pedido.estado === "EXPORTADO"
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {pedido.estado === "EXPORTADO" ? "Exportado" : "Pendiente"}
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-2.5 font-medium">Producto</th>
                <th className="px-4 py-2.5 text-right font-medium">Cant.</th>
                <th className="px-4 py-2.5 text-right font-medium">Precio</th>
                <th className="px-4 py-2.5 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pedido.items.map((item) => (
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
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">
                    ${(Number(item.precioUnitario) * item.cantidad).toLocaleString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td colSpan={3} className="px-4 py-3 text-right font-semibold text-slate-700">
                  Total
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-blue-700">
                  ${total.toLocaleString("es-AR")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </main>
  );
}
