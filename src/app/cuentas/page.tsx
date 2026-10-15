import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { formatearFechaUTC, formatearMoneda } from "@/lib/formato";
import { esAdministrador, filtroVisibilidad } from "./consultas";

export default async function CuentasPage() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const esAdmin = esAdministrador(usuario);
  const visibilidad = filtroVisibilidad(usuario);

  const [resumenes, totales, porCliente] = await Promise.all([
    prisma.resumenCuenta.findMany({
      orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
      include: { importadoPor: { select: { nombre: true } } },
    }),
    prisma.comprobanteCuenta.groupBy({
      by: ["resumenId"],
      where: visibilidad,
      _sum: { totalACobrar: true },
      _count: { _all: true },
    }),
    prisma.comprobanteCuenta.groupBy({
      by: ["resumenId", "clienteId"],
      where: visibilidad,
    }),
  ]);

  const totalPorResumen = new Map(
    totales.map((t) => [
      t.resumenId,
      { comprobantes: t._count._all, total: Number(t._sum.totalACobrar ?? 0) },
    ])
  );
  const clientesPorResumen = new Map<string, number>();
  for (const fila of porCliente) {
    clientesPorResumen.set(fila.resumenId, (clientesPorResumen.get(fila.resumenId) ?? 0) + 1);
  }

  // Un vendedor solo ve los resúmenes donde tiene comprobantes de sus clientes
  const visibles = resumenes.filter((r) => esAdmin || totalPorResumen.has(r.id));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-sm text-blue-700 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Cuentas corrientes</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/cuentas/clientes"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Deuda por cliente
          </Link>
          {esAdmin && (
            <Link
              href="/cuentas/importar"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              + Importar resumen
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {visibles.length >= 2 && (
          <form
            action="/cuentas/comparar"
            method="get"
            className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Resumen anterior
              </label>
              <select
                name="a"
                defaultValue={visibles[1].id}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                {visibles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {formatearFechaUTC(r.fecha)}
                    {r.nombreArchivo ? ` · ${r.nombreArchivo}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Resumen nuevo
              </label>
              <select
                name="b"
                defaultValue={visibles[0].id}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              >
                {visibles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {formatearFechaUTC(r.fecha)}
                    {r.nombreArchivo ? ` · ${r.nombreArchivo}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Comparar
            </button>
          </form>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Archivo</th>
                  {esAdmin && <th className="px-4 py-3 font-medium">Importado por</th>}
                  <th className="px-4 py-3 text-right font-medium">Clientes</th>
                  <th className="px-4 py-3 text-right font-medium">Comprob.</th>
                  <th className="px-4 py-3 text-right font-medium">Total a cobrar</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.map((r) => {
                  const t = totalPorResumen.get(r.id);
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {formatearFechaUTC(r.fecha)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.nombreArchivo ?? "—"}</td>
                      {esAdmin && (
                        <td className="px-4 py-3 text-slate-600">{r.importadoPor.nombre}</td>
                      )}
                      <td className="px-4 py-3 text-right text-slate-600">
                        {clientesPorResumen.get(r.id) ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{t?.comprobantes ?? 0}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-700">
                        {formatearMoneda(t?.total ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/cuentas/${r.id}`} className="text-blue-700 hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={esAdmin ? 7 : 6} className="px-4 py-8 text-center text-slate-500">
                      {esAdmin
                        ? "Todavía no se importó ningún resumen de cuenta."
                        : "Todavía no hay resúmenes de cuenta con deuda de tus clientes."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {visibles.length > 0 && (
          <p className="mt-3 text-sm text-slate-500">
            Total: {visibles.length} resumen{visibles.length !== 1 ? "es" : ""}
          </p>
        )}
      </div>
    </main>
  );
}
