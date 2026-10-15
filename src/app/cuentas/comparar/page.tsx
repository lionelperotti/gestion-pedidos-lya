import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { formatearFechaUTC, formatearMoneda } from "@/lib/formato";
import { filtroVisibilidad } from "../consultas";

export default async function CompararResumenesPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const { a, b } = await searchParams;

  const encabezado = (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <Link href="/cuentas" className="text-sm text-blue-700 hover:underline">
        ← Volver a Cuentas corrientes
      </Link>
      <h1 className="text-lg font-bold text-slate-900">Comparar resúmenes</h1>
    </header>
  );

  const [resumenA, resumenB] = await Promise.all([
    a ? prisma.resumenCuenta.findUnique({ where: { id: a } }) : null,
    b ? prisma.resumenCuenta.findUnique({ where: { id: b } }) : null,
  ]);

  if (!resumenA || !resumenB) {
    return (
      <main className="min-h-screen bg-slate-50">
        {encabezado}
        <p className="px-6 py-12 text-center text-slate-500">
          Elegí dos resúmenes para comparar desde la pantalla de Cuentas corrientes.
        </p>
      </main>
    );
  }

  const visibilidad = filtroVisibilidad(usuario);
  const sumar = (resumenId: string) =>
    prisma.comprobanteCuenta.groupBy({
      by: ["clienteId"],
      where: { resumenId, clienteId: { not: null }, ...visibilidad },
      _sum: { totalACobrar: true },
    });

  const [sumasA, sumasB] = await Promise.all([sumar(resumenA.id), sumar(resumenB.id)]);

  const deudaA = new Map<string, number>();
  const deudaB = new Map<string, number>();
  sumasA.forEach((s) => s.clienteId && deudaA.set(s.clienteId, Number(s._sum.totalACobrar ?? 0)));
  sumasB.forEach((s) => s.clienteId && deudaB.set(s.clienteId, Number(s._sum.totalACobrar ?? 0)));

  const ids = Array.from(new Set([...deudaA.keys(), ...deudaB.keys()]));
  const clientes = await prisma.cliente.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true, codigoCliente: true },
  });

  const filas = clientes
    .map((c) => {
      const antes = deudaA.get(c.id) ?? 0;
      const despues = deudaB.get(c.id) ?? 0;
      return { ...c, antes, despues, diferencia: despues - antes };
    })
    // primero los que más cambiaron
    .sort((x, y) => Math.abs(y.diferencia) - Math.abs(x.diferencia));

  const totalAntes = filas.reduce((acc, f) => acc + f.antes, 0);
  const totalDespues = filas.reduce((acc, f) => acc + f.despues, 0);

  const colorDiferencia = (d: number) =>
    d > 0 ? "text-red-600" : d < 0 ? "text-green-700" : "text-slate-500";
  const conSigno = (d: number) => `${d > 0 ? "+" : ""}${formatearMoneda(d)}`;

  return (
    <main className="min-h-screen bg-slate-50">
      {encabezado}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <p className="mb-4 text-sm text-slate-600">
          Resumen al <strong>{formatearFechaUTC(resumenA.fecha)}</strong> contra resumen al{" "}
          <strong>{formatearFechaUTC(resumenB.fecha)}</strong>. En rojo, la deuda subió; en verde,
          bajó.
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Al {formatearFechaUTC(resumenA.fecha)}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Al {formatearFechaUTC(resumenB.fecha)}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/cuentas/clientes/${f.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {f.nombre}
                      </Link>
                      <span className="block text-xs text-slate-500">Código {f.codigoCliente}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatearMoneda(f.antes)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatearMoneda(f.despues)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${colorDiferencia(f.diferencia)}`}>
                      {conSigno(f.diferencia)}
                    </td>
                  </tr>
                ))}
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No hay clientes con deuda en ninguno de los dos resúmenes.
                    </td>
                  </tr>
                )}
              </tbody>
              {filas.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-4 py-3 text-slate-700">Total</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatearMoneda(totalAntes)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatearMoneda(totalDespues)}
                    </td>
                    <td className={`px-4 py-3 text-right ${colorDiferencia(totalDespues - totalAntes)}`}>
                      {conSigno(totalDespues - totalAntes)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Solo se comparan los comprobantes asignados a un cliente.
        </p>
      </div>
    </main>
  );
}
