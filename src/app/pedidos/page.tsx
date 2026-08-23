import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import SeleccionPedidosPendientes from "./componentes/SeleccionPedidosPendientes";

export default async function PedidosPage() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const esAdmin = usuario.perfil === "Administrador";

  const [pedidos, loteAbierto] = await Promise.all([
    prisma.pedido.findMany({
      where: {
        estado: "PENDIENTE",
        ...(esAdmin ? {} : { vendedorId: usuario.id }),
      },
      orderBy: { creadoEn: "desc" },
      include: { cliente: true, vendedor: true, items: true },
    }),
    prisma.lote.findFirst({
      where: { vendedorId: usuario.id, estado: "ABIERTO" },
      include: { _count: { select: { pedidos: true } } },
    }),
  ]);

  const pedidosResumen = pedidos.map((pedido) => ({
    id: pedido.id,
    numero: pedido.numero,
    clienteNombre: pedido.cliente.nombre,
    vendedorNombre: pedido.vendedor.nombre,
    cantidadItems: pedido.items.length,
    total: pedido.items.reduce(
      (acc, item) =>
        acc +
        Number(item.precioUnitario) * item.cantidad * (1 - Number(item.descuento) / 100),
      0
    ),
    fecha: new Date(pedido.creadoEn).toLocaleDateString("es-AR"),
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-blue-700 hover:underline">
              ← Volver
            </Link>
            <h1 className="text-lg font-bold text-slate-900">Pedidos pendientes</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/lotes"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ver lotes
            </Link>
            <Link
              href="/pedidos/nuevo"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              + Nuevo pedido
            </Link>
          </div>
        </div>

        <div className="mt-3">
          {loteAbierto ? (
            <Link
              href={`/lotes/${loteAbierto.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 hover:bg-amber-100"
            >
              📦 Lote abierto: <span className="font-semibold">#{loteAbierto.numero}</span> ·
              creado el {new Date(loteAbierto.creadoEn).toLocaleDateString("es-AR")} ·{" "}
              {loteAbierto._count.pedidos} pedido
              {loteAbierto._count.pedidos !== 1 ? "s" : ""}
            </Link>
          ) : (
            <p className="text-sm text-slate-500">
              No tenés ningún lote abierto todavía. Seleccioná pedidos abajo para crear uno.
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <SeleccionPedidosPendientes
          pedidos={pedidosResumen}
          esAdmin={esAdmin}
          hayLoteAbierto={Boolean(loteAbierto)}
        />
      </div>
    </main>
  );
}
