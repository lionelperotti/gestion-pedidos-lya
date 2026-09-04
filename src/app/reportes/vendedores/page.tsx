import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { obtenerPedidosParaReporte, totalPedido } from "../consultas";
import ReporteFiltros from "../ReporteFiltros";

export default async function ReporteVendedoresPage({
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

  const porVendedor = new Map<
    string,
    { nombre: string; cantidadPedidos: number; total: number }
  >();

  for (const pedido of pedidos) {
    const actual = porVendedor.get(pedido.vendedorId) ?? {
      nombre: pedido.vendedor.nombre,
      cantidadPedidos: 0,
      total: 0,
    };
    actual.cantidadPedidos += 1;
    actual.total += totalPedido(pedido);
    porVendedor.set(pedido.vendedorId, actual);
  }

  const filas = Array.from(porVendedor.values()).sort((a, b) => b.total - a.total);
  const totalGeneral = filas.reduce((acc, f) => acc + f.total, 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/reportes" className="text-sm text-blue-700 hover:underline">
          ← Volver a Reportes
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Ventas por Vendedor</h1>
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

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Vendedor</th>
                <th className="px-4 py-3 text-right font-medium">Pedidos</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filas.map((fila) => (
                <tr key={fila.nombre}>
                  <td className="px-4 py-3 font-medium text-slate-900">{fila.nombre}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{fila.cantidadPedidos}</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-700">
                    ${fila.total.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                    No hay pedidos enviados en el período seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
            {filas.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50">
                  <td colSpan={2} className="px-4 py-3 text-right font-semibold text-slate-700">
                    Total general
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-blue-700">
                    ${totalGeneral.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </main>
  );
}
