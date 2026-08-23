import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { actualizarProvincia } from "../actions";

export default async function EditarProvinciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const provincia = await prisma.provincia.findUnique({
    where: { id },
    include: { localidades: { orderBy: { nombre: "asc" } } },
  });

  if (!provincia) {
    notFound();
  }

  const actualizarConId = actualizarProvincia.bind(null, provincia.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/provincias" className="text-sm text-blue-700 hover:underline">
          ← Volver a Provincias
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Editar provincia</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        <form action={actualizarConId} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              name="nombre"
              required
              defaultValue={provincia.nombre}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800"
          >
            Guardar cambios
          </button>
        </form>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Localidades ({provincia.localidades.length})
            </h2>
            <Link
              href={`/localidades/nuevo?provinciaId=${provincia.id}`}
              className="text-sm text-blue-700 hover:underline"
            >
              + Agregar
            </Link>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white">
            {provincia.localidades.map((localidad) => (
              <Link
                key={localidad.id}
                href={`/localidades/${localidad.id}`}
                className="block border-b border-slate-100 px-4 py-2 text-sm text-slate-700 last:border-0 hover:bg-slate-50"
              >
                {localidad.nombre}
              </Link>
            ))}
            {provincia.localidades.length === 0 && (
              <p className="px-4 py-4 text-sm text-slate-500">
                Todavía no tiene localidades cargadas.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
