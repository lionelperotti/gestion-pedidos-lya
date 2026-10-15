import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { formatearFechaUTC, formatearMoneda } from "@/lib/formato";
import { esAdministrador } from "../../consultas";

export default async function HistorialClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: { id: true, nombre: true, codigoCliente: true, cuit: true, vendedorId: true },
  });
  if (!cliente) notFound();
  if (!esAdministrador(usuario) && cliente.vendedorId !== usuario.id) redirect("/cuentas/clientes");

  const comprobantes = await prisma.comprobanteCuenta.findMany({
    where: { clienteId: id },
    include: { resumen: { select: { id: true, fecha: true, creadoEn: true } } },
    orderBy: [{ fecha: "asc" }, { comprobante: "asc" }],
  });

  // Se agrupa por resumen, del más reciente al más antiguo
  const porResumen = new Map<
    string,
    { fecha: Date; creadoEn: Date; total: number; filas: typeof comprobantes }
  >();
  for (const c of comprobantes) {
    const g = porResumen.get(c.resumenId) ?? {
      fecha: c.resumen.fecha,
      creadoEn: c.resumen.creadoEn,
      total: 0,
      filas: [],
    };
    g.total += Number(c.totalACobrar);
    g.filas.push(c);
    porResumen.set(c.resumenId, g);
  }

  const resumenes = Array.from(porResumen.entries()).sort(
    (a, b) =>
      b[1].fecha.getTime() - a[1].fecha.getTime() ||
      b[1].creadoEn.getTime() - a[1].creadoEn.getTime()
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/cuentas/clientes" className="text-sm text-blue-700 hover:underline">
          ← Volver a Deuda por cliente
        </Link>
        <h1 className="text-lg font-bold text-slate-900">{cliente.nombre}</h1>
        <p className="text-sm text-slate-500">
          Código {cliente.codigoCliente} · CUIT {cliente.cuit}
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        {resumenes.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            Este cliente todavía no figura en ningún resumen de cuenta.
          </p>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Resumen al</th>
                    <th className="px-4 py-3 text-right font-medium">Comprob.</th>
                    <th className="px-4 py-3 text-right font-medium">Total a cobrar</th>
                    <th className="px-4 py-3 text-right font-medium">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resumenes.map(([resumenId, g], i) => {
                    const anterior = resumenes[i + 1]?.[1];
                    const variacion = anterior ? g.total - anterior.total : null;
                    return (
                      <tr key={resumenId}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatearFechaUTC(g.fecha)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{g.filas.length}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">
                          {formatearMoneda(g.total)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right ${
                            variacion === null
                              ? "text-slate-400"
                              : variacion > 0
                              ? "text-red-600"
                              : variacion < 0
                              ? "text-green-700"
                              : "text-slate-500"
                          }`}
                        >
                          {variacion === null
                            ? "—"
                            : `${variacion > 0 ? "+" : ""}${formatearMoneda(variacion)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-600">Detalle por resumen</h2>
              {resumenes.map(([resumenId, g], i) => (
                <details
                  key={resumenId}
                  open={i === 0}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">
                      Resumen al {formatearFechaUTC(g.fecha)}
                    </span>
                    <span className="font-semibold text-blue-700">{formatearMoneda(g.total)}</span>
                  </summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="text-slate-500">
                        <tr>
                          <th className="py-1.5 font-medium">Comprobante</th>
                          <th className="py-1.5 font-medium">Fecha</th>
                          <th className="py-1.5 text-right font-medium">Importe</th>
                          <th className="py-1.5 text-right font-medium">A cuenta</th>
                          <th className="py-1.5 text-right font-medium">Total a cobrar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {g.filas.map((c) => (
                          <tr key={c.id}>
                            <td className="py-1.5 text-slate-900">{c.comprobante}</td>
                            <td className="py-1.5 text-slate-600">
                              {c.fecha ? formatearFechaUTC(c.fecha) : "—"}
                            </td>
                            <td className="py-1.5 text-right text-slate-600">
                              {formatearMoneda(Number(c.importe))}
                            </td>
                            <td className="py-1.5 text-right text-slate-600">
                              {formatearMoneda(Number(c.aCuenta))}
                            </td>
                            <td className="py-1.5 text-right font-medium text-slate-900">
                              {formatearMoneda(Number(c.totalACobrar))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
