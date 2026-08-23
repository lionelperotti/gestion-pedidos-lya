import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import DescargarPdfLoteBoton from "../componentes/DescargarPdfLoteBoton";
import SacarDelLoteBoton from "../componentes/SacarDelLoteBoton";
import MarcarEnviadoBoton from "../componentes/MarcarEnviadoBoton";

export default async function DetalleLotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const { id } = await params;

  const lote = await prisma.lote.findUnique({
    where: { id },
    include: {
      vendedor: true,
      pedidos: {
        orderBy: { creadoEn: "asc" },
        include: { cliente: true, items: true },
      },
    },
  });

  if (!lote) {
    notFound();
  }

  if (usuario.perfil !== "Administrador" && lote.vendedorId !== usuario.id) {
    redirect("/lotes");
  }

  const abierto = lote.estado === "ABIERTO";

  const totalGeneral = lote.pedidos.reduce(
    (acc, pedido) =>
      acc +
      pedido.items.reduce(
        (accItem, item) =>
          accItem +
          Number(item.precioUnitario) * item.cantidad * (1 - Number(item.descuento) / 100),
        0
      ),
    0
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/lotes" className="text-sm text-blue-700 hover:underline">
            ← Volver a Lotes
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Lote #{lote.numero}</h1>
          <p className="text-sm text-slate-500">
            Creado {new Date(lote.creadoEn).toLocaleDateString("es-AR")}
            {lote.enviadoEn &&
              ` · Enviado ${new Date(lote.enviadoEn).toLocaleDateString("es-AR")}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              abierto ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
            }`}
          >
            {abierto ? "Abierto" : "Enviado"}
          </span>
          <DescargarPdfLoteBoton loteId={lote.id} />
          {abierto && <MarcarEnviadoBoton loteId={lote.id} />}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="space-y-3">
          {lote.pedidos.map((pedido) => {
            const total = pedido.items.reduce(
              (acc, item) =>
                acc +
                Number(item.precioUnitario) *
                  item.cantidad *
                  (1 - Number(item.descuento) / 100),
              0
            );
            return (
              <div
                key={pedido.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <Link href={`/pedidos/${pedido.id}`} className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 hover:underline">
                    Pedido #{pedido.numero} · {pedido.cliente.nombre}
                  </p>
                  <p className="text-sm text-slate-500">
                    {pedido.items.length} producto{pedido.items.length !== 1 ? "s" : ""} · $
                    {total.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                  </p>
                </Link>
                {abierto && <SacarDelLoteBoton pedidoId={pedido.id} />}
              </div>
            );
          })}
          {lote.pedidos.length === 0 && (
            <p className="py-12 text-center text-slate-500">
              Este lote todavía no tiene pedidos.
            </p>
          )}
        </div>
        {lote.pedidos.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
            <span className="text-slate-600">
              Total: {lote.pedidos.length} pedido{lote.pedidos.length !== 1 ? "s" : ""}
            </span>
            <span className="font-semibold text-blue-700">
              ${totalGeneral.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
