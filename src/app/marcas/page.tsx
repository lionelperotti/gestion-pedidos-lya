import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export default async function MarcasPage() {
  await requireAdmin();

  const marcas = await prisma.marca.findMany({
    orderBy: { nombre: "asc" },
    include: { proveedores: true, _count: { select: { productos: true } } },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-sm text-blue-700 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Marcas</h1>
        </div>
        <Link
          href="/marcas/nuevo"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nueva marca
        </Link>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Proveedores</th>
                <th className="px-4 py-3 font-medium">Productos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marcas.map((marca) => (
                <tr key={marca.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {marca.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {marca.proveedores.length > 0
                      ? marca.proveedores.map((p) => p.nombre).join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {marca._count.productos}
                  </td>
                  <td className="px-4 py-3">
                    {marca.activo ? (
                      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Activa
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/marcas/${marca.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {marcas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Todavía no hay marcas cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Total: {marcas.length} marca{marcas.length !== 1 ? "s" : ""}
        </p>
      </div>
    </main>
  );
}
