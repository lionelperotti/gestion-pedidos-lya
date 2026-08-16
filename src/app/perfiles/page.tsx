import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export default async function PerfilesPage() {
  await requireAdmin();

  const perfiles = await prisma.perfil.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { usuarios: true } } },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-sm text-blue-700 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Perfiles</h1>
        </div>
        <Link
          href="/perfiles/nuevo"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nuevo perfil
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium">Usuarios</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perfiles.map((perfil) => (
                <tr key={perfil.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {perfil.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {perfil.descripcion || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {perfil._count.usuarios}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/perfiles/${perfil.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {perfiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Todavía no hay perfiles cargados.
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
