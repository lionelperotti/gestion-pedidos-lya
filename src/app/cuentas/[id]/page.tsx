import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { formatearFechaUTC, formatearMoneda } from "@/lib/formato";
import { esAdministrador, filtroVisibilidad } from "../consultas";
import AsignarClienteBoton from "../AsignarClienteBoton";
import EliminarResumenBoton from "../EliminarResumenBoton";

interface Comprobante {
  id: string;
  comprobante: string;
  fecha: Date | null;
  importe: number;
  aCuenta: number;
  totalACobrar: number;
}

function TablaComprobantes({ filas }: { filas: Comprobante[] }) {
  return (
    <div className="overflow-x-auto">
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
          {filas.map((c) => (
            <tr key={c.id}>
              <td className="py-1.5 text-slate-900">{c.comprobante}</td>
              <td className="py-1.5 text-slate-600">{c.fecha ? formatearFechaUTC(c.fecha) : "—"}</td>
              <td className="py-1.5 text-right text-slate-600">{formatearMoneda(c.importe)}</td>
              <td className="py-1.5 text-right text-slate-600">{formatearMoneda(c.aCuenta)}</td>
              <td className="py-1.5 text-right font-medium text-slate-900">
                {formatearMoneda(c.totalACobrar)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function DetalleResumenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const esAdmin = esAdministrador(usuario);
  const { id } = await params;

  const resumen = await prisma.resumenCuenta.findUnique({
    where: { id },
    include: { importadoPor: { select: { nombre: true } } },
  });
  if (!resumen) notFound();

  const filasDb = await prisma.comprobanteCuenta.findMany({
    where: { resumenId: id, ...filtroVisibilidad(usuario) },
    include: { cliente: { select: { id: true, nombre: true, codigoCliente: true } } },
    orderBy: [{ nombreEnResumen: "asc" }, { fecha: "asc" }],
  });

  // Un vendedor sin comprobantes en este resumen no tiene nada que ver acá
  if (!esAdmin && filasDb.length === 0) redirect("/cuentas");

  const aComprobante = (c: (typeof filasDb)[number]): Comprobante => ({
    id: c.id,
    comprobante: c.comprobante,
    fecha: c.fecha,
    importe: Number(c.importe),
    aCuenta: Number(c.aCuenta),
    totalACobrar: Number(c.totalACobrar),
  });

  const asignados = new Map<
    string,
    { nombre: string; codigo: string; filas: Comprobante[]; total: number }
  >();
  const sinAsignar = new Map<string, { filas: Comprobante[]; total: number }>();

  for (const c of filasDb) {
    const fila = aComprobante(c);
    if (c.cliente) {
      const g = asignados.get(c.cliente.id) ?? {
        nombre: c.cliente.nombre,
        codigo: c.cliente.codigoCliente,
        filas: [],
        total: 0,
      };
      g.filas.push(fila);
      g.total += fila.totalACobrar;
      asignados.set(c.cliente.id, g);
    } else {
      const g = sinAsignar.get(c.nombreEnResumen) ?? { filas: [], total: 0 };
      g.filas.push(fila);
      g.total += fila.totalACobrar;
      sinAsignar.set(c.nombreEnResumen, g);
    }
  }

  const grupos = Array.from(asignados.entries()).sort((a, b) =>
    a[1].nombre.localeCompare(b[1].nombre, "es")
  );
  const totalGeneral = filasDb.reduce((acc, c) => acc + Number(c.totalACobrar), 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/cuentas" className="text-sm text-blue-700 hover:underline">
            ← Volver a Cuentas corrientes
          </Link>
          <h1 className="text-lg font-bold text-slate-900">
            Resumen al {formatearFechaUTC(resumen.fecha)}
          </h1>
          <p className="text-sm text-slate-500">
            {resumen.nombreArchivo ?? "Sin archivo"} · importado por {resumen.importadoPor.nombre}
          </p>
        </div>
        {esAdmin && <EliminarResumenBoton resumenId={resumen.id} />}
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            {grupos.length} cliente{grupos.length !== 1 ? "s" : ""} · {filasDb.length} comprobante
            {filasDb.length !== 1 ? "s" : ""}
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
            Total a cobrar: {formatearMoneda(totalGeneral)}
          </span>
        </div>

        {esAdmin && sinAsignar.size > 0 && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h2 className="mb-1 text-sm font-semibold text-amber-800">
              Sin asignar a un cliente ({sinAsignar.size})
            </h2>
            <p className="mb-3 text-xs text-amber-700">
              Estos nombres no se pudieron relacionar con ningún cliente. Mientras no los asignes,
              su deuda no aparece en el historial de ningún cliente.
            </p>
            <div className="space-y-2">
              {Array.from(sinAsignar.entries()).map(([nombre, g]) => (
                <details key={nombre} className="rounded-lg border border-amber-200 bg-white px-3 py-2">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-slate-900">
                      {nombre}{" "}
                      <span className="font-normal text-slate-500">
                        · {g.filas.length} comprob. · {formatearMoneda(g.total)}
                      </span>
                    </span>
                    <AsignarClienteBoton resumenId={resumen.id} nombreEnResumen={nombre} />
                  </summary>
                  <div className="mt-2">
                    <TablaComprobantes filas={g.filas} />
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2">
          {grupos.map(([clienteId, g]) => (
            <details key={clienteId} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-slate-900">
                  {g.nombre}{" "}
                  <span className="font-normal text-slate-500">
                    · Código {g.codigo} · {g.filas.length} comprob.
                  </span>
                </span>
                <span className="font-semibold text-blue-700">{formatearMoneda(g.total)}</span>
              </summary>
              <div className="mt-3">
                <TablaComprobantes filas={g.filas} />
                <p className="mt-2 text-right">
                  <Link
                    href={`/cuentas/clientes/${clienteId}`}
                    className="text-xs text-blue-700 hover:underline"
                  >
                    Ver historial de este cliente →
                  </Link>
                </p>
              </div>
            </details>
          ))}
          {grupos.length === 0 && (
            <p className="py-8 text-center text-slate-500">
              Este resumen no tiene comprobantes asignados a clientes.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
