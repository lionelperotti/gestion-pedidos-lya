import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { obtenerPedidosParaReporte } from "../consultas";
import ReporteFiltros from "../ReporteFiltros";
import ExportarBotones from "../ExportarBotones";

export default async function ReporteProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; vendedorId?: string }>;
}) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const esAdmin = usuario.perfil === "Administrador";
  const filtros = await searchParams;

  const [pedidos, vendedores] = await Promise.all([
    obtenerPedidosParaReporte(usuario, filtros),
    esAdmin
      ? prisma.usuario.findMany({
          where: { estado: "ACTIVO" },
          orderBy: { nombre: "asc" },
          select: { id: true, nombre: true },
        })
      : Promise.resolve([{ id: usuario.id, nombre: usuario.name }]),
  ]);

  const porProducto = new Map<
    string,
    { nombre: string; cantidad: number; total: number }
  >();

  for (const pedido of pedidos) {
    for (const item of pedido.items) {
      const actual = porProducto.get(item.productoId) ?? {
        nombre: item.producto.nombre,
        cantidad: 0,
        total: 0,
      };
      actual.cantidad += item.cantidad;
      actual.total +=
        Number(item.precioUnitario) * item.cantidad * (1 - Number(item.descuento) / 100);
      porProducto.set(item.productoId, actual);
    }
  }

  const filas = Array.from(porProducto.values()).sort((a, b) => b.cantidad - a.cantidad);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/reportes" className="text-sm text-blue-700 hover:underline">
          ← Volver a Reportes
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Productos más vendidos</h1>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <ReporteFiltros
          esAdmin={esAdmin}
          vendedores={vendedores}
          desdeInicial={filtros.desde ?? ""}
          hastaInicial={filtros.hasta ?? ""}
          vendedorIdInicial={filtros.vendedorId ?? ""}
          usuarioIdPropio={usuario.id}
        />

        <div className="mb-4 flex justify-end">
          <ExportarBotones
            titulo="Productos más vendidos"
            nombreArchivo="productos-mas-vendidos"
            columnas={[
              { header: "Producto", accessor: (f: (typeof filas)[number]) => f.nombre },
              {
                header: "Cantidad vendida",
                accessor: (f: (typeof filas)[number]) => f.cantidad,
                alineacionDerecha: true,
              },
              {
                header: "Total",
                accessor: (f: (typeof filas)[number]) =>
                  f.total.toLocaleString("es-AR", { maximumFractionDigits: 2 }),
                alineacionDerecha: true,
              },
            ]}
            filas={filas}
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="w-12 px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 text-right font-medium">Cantidad vendida</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((fila, i) => (
                <tr key={fila.nombre}>
                  <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{fila.nombre}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{fila.cantidad}</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-700">
                    ${fila.total.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No hay pedidos enviados en el período seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
