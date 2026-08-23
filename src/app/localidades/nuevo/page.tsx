import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { crearLocalidad } from "../actions";

export default async function NuevaLocalidadPage({
  searchParams,
}: {
  searchParams: Promise<{ provinciaId?: string }>;
}) {
  await requireAdmin();
  const { provinciaId } = await searchParams;

  const provincias = await prisma.provincia.findMany({ orderBy: { nombre: "asc" } });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/localidades" className="text-sm text-blue-700 hover:underline">
          ← Volver a Localidades
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Nueva localidad</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        {provincias.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            No hay provincias cargadas. Creá una primero en la sección Provincias.
          </p>
        ) : (
          <form action={crearLocalidad} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Provincia
              </label>
              <select
                name="provinciaId"
                required
                defaultValue={provinciaId ?? ""}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="" disabled>
                  Seleccionar provincia
                </option>
                {provincias.map((provincia) => (
                  <option key={provincia.id} value={provincia.id}>
                    {provincia.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nombre
              </label>
              <input
                name="nombre"
                required
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800"
            >
              Crear localidad
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
