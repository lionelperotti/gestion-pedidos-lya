import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import ReportePdfBoton from "./componentes/ReportePdfBoton";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const esAdmin = usuario.perfil === "Administrador";

  const { estado } = await searchParams;
  const vista = estado === "enviados" ? "enviados" : "pendientes";

  const pedidos = await prisma.pedido.findMany({
    where: {
      estado: vista === "pendientes" ? "PENDIENTE" : "EXPORTADO",
      ...(esAdmin ? {} : { vendedorId: usuario.id }),
    },
    orderBy: { creadoEn: "desc" },
    include: {
      cliente: true,
      vendedor: true,
      items: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-blue-700 hover:underline">
              ← Volver
            </Link>
            <h1 className="text-lg font-bold text-slate-900">Pedidos</h1>
          </div>
          <Link
            href="/pedidos/nuevo"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            + Nuevo pedido
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Link
              href="/pedidos?estado=pendientes"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                vista === "pendientes"
                  ? "bg-blue-700 text-white"
                  : "border border-slate-300 text-slate-700"
              }`}
            >
              Pendientes
            </Link>
            <Link
              href="/pedidos?estado=enviados"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                vista === "enviados"
                  ? "bg-blue-700 text-white"
                  : "border border-slate-300 text-slate-700"
              }`}
            >
              Enviados
            </Link>
          </div>
          {vista === "pendientes" && <ReportePdfBoton />}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-3">
          {pedidos.map((pedido) => {
            const total = pedido.items.reduce(
              (acc, item) =>
                acc +
                Number(item.precioUnitario) *
                  item.cantidad *
                  (1 - Number(item.descuento) / 100),
              0
            );
            return (
              <Link
                key={pedido.id}
                href={`/pedidos/${pedido.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    Pedido #{pedido.numero} · {pedido.cliente.nombre}
                  </p>
                  <p className="text-sm text-slate-500">
                    {pedido.items.length} producto{pedido.items.length !== 1 ? "s" : ""}
                    {esAdmin && ` · ${pedido.vendedor.nombre}`}
                    {" · "}
                    {new Date(pedido.creadoEn).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-700">
                    ${total.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                  </p>
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
              </Link>
            );
          })}
          {pedidos.length === 0 && (
            <p className="py-12 text-center text-slate-500">
              No hay pedidos {vista === "pendientes" ? "pendientes" : "enviados"}.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
