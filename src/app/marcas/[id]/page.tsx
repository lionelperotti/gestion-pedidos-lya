import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { actualizarMarca } from "../actions";

export default async function EditarMarcaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [marca, proveedores] = await Promise.all([
    prisma.marca.findUnique({ where: { id }, include: { proveedores: true } }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  if (!marca) {
    notFound();
  }

  const idsSeleccionados = new Set(marca.proveedores.map((p) => p.id));
  const actualizarConId = actualizarMarca.bind(null, marca.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/marcas" className="text-sm text-blue-700 hover:underline">
          ← Volver a Marcas
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Editar marca</h1>
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
              defaultValue={marca.nombre}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Proveedores relacionados
            </label>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-300 p-3">
              {proveedores.map((proveedor) => (
                <label key={proveedor.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="proveedorIds"
                    value={proveedor.id}
                    defaultChecked={idsSeleccionados.has(proveedor.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  />
                  {proveedor.nombre}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={marca.activo}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            />
            Marca activa
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </main>
  );
}
