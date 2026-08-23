import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";

export default async function ClientesPage() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const esAdmin = usuario.perfil === "Administrador";

  const clientes = await prisma.cliente.findMany({
    where: esAdmin ? {} : { vendedorId: usuario.id },
    orderBy: { nombre: "asc" },
    include: { vendedor: true, _count: { select: { pedidos: true } } },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-sm text-blue-700 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Clientes</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/clientes/importar"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Importar desde Excel
          </Link>
          <Link
            href="/clientes/nuevo"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            + Nuevo cliente
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">CUIT</th>
                <th className="px-4 py-3 font-medium">Cat.</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                {esAdmin && <th className="px-4 py-3 font-medium">Vendedor</th>}
                <th className="px-4 py-3 font-medium">Pedidos</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="px-4 py-3 text-slate-600">{cliente.codigoCliente}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {cliente.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{cliente.cuit}</td>
                  <td className="px-4 py-3 text-slate-600">{cliente.categoria}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {cliente.telefono || "—"}
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-3 text-slate-600">
                      {cliente.vendedor.nombre}
                    </td>
                  )}
                  <td className="px-4 py-3 text-slate-600">
                    {cliente._count.pedidos}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={esAdmin ? 8 : 7} className="px-4 py-6 text-center text-slate-500">
                    Todavía no hay clientes cargados.
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
