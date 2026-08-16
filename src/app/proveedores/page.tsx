import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export default async function ProveedoresPage() {
  await requireAdmin();

  const proveedores = await prisma.proveedor.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-sm text-blue-700 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Proveedores</h1>
        </div>
        <Link
          href="/proveedores/nuevo"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nuevo proveedor
        </Link>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Productos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proveedores.map((proveedor) => (
                <tr key={proveedor.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {proveedor.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {proveedor.contacto || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {proveedor.telefono || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {proveedor._count.productos}
                  </td>
                  <td className="px-4 py-3">
                    {proveedor.activo ? (
                      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Activo
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/proveedores/${proveedor.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {proveedores.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Todavía no hay proveedores cargados.
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
