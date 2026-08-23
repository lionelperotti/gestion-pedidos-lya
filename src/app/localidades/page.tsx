import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export default async function LocalidadesPage() {
  await requireAdmin();

  const localidades = await prisma.localidad.findMany({
    orderBy: [{ provincia: { nombre: "asc" } }, { nombre: "asc" }],
    include: { provincia: true },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-sm text-blue-700 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Localidades</h1>
        </div>
        <Link
          href="/localidades/nuevo"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nueva localidad
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Provincia</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localidades.map((localidad) => (
                <tr key={localidad.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {localidad.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {localidad.provincia.nombre}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/localidades/${localidad.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {localidades.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                    Todavía no hay localidades cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Total: {localidades.length} localidad{localidades.length !== 1 ? "es" : ""}
        </p>
      </div>
    </main>
  );
}
