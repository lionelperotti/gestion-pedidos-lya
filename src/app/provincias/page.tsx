import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export default async function ProvinciasPage() {
  await requireAdmin();

  const provincias = await prisma.provincia.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { localidades: true, clientes: true } } },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-sm text-blue-700 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Provincias</h1>
        </div>
        <Link
          href="/provincias/nuevo"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nueva provincia
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Localidades</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {provincias.map((provincia) => (
                <tr key={provincia.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {provincia.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {provincia._count.localidades}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/provincias/${provincia.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {provincias.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                    Todavía no hay provincias cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Total: {provincias.length} provincia{provincias.length !== 1 ? "s" : ""}
        </p>
      </div>
    </main>
  );
}
