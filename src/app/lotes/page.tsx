import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";

export default async function LotesPage() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const esAdmin = usuario.perfil === "Administrador";

  const lotes = await prisma.lote.findMany({
    where: esAdmin ? {} : { vendedorId: usuario.id },
    orderBy: { creadoEn: "desc" },
    include: { vendedor: true, _count: { select: { pedidos: true } } },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/pedidos" className="text-sm text-blue-700 hover:underline">
          ← Volver a Pedidos
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Lotes</h1>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="space-y-3">
          {lotes.map((lote) => (
            <Link
              key={lote.id}
              href={`/lotes/${lote.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-medium text-slate-900">
                  Lote #{lote.numero}
                  {esAdmin && ` · ${lote.vendedor.nombre}`}
                </p>
                <p className="text-sm text-slate-500">
                  {lote._count.pedidos} pedido{lote._count.pedidos !== 1 ? "s" : ""} · Creado{" "}
                  {new Date(lote.creadoEn).toLocaleDateString("es-AR")}
                  {lote.enviadoEn &&
                    ` · Enviado ${new Date(lote.enviadoEn).toLocaleDateString("es-AR")}`}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  lote.estado === "ABIERTO"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {lote.estado === "ABIERTO" ? "Abierto" : "Enviado"}
              </span>
            </Link>
          ))}
          {lotes.length === 0 && (
            <p className="py-12 text-center text-slate-500">
              Todavía no hay lotes creados.
            </p>
          )}
        </div>
        {lotes.length > 0 && (
          <p className="mt-3 text-sm text-slate-500">
            Total: {lotes.length} lote{lotes.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </main>
  );
}
