import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { actualizarProveedor } from "../actions";

export default async function EditarProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [proveedor, marcas] = await Promise.all([
    prisma.proveedor.findUnique({ where: { id }, include: { marcas: true } }),
    prisma.marca.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  if (!proveedor) {
    notFound();
  }

  const marcaIdsSeleccionadas = new Set(proveedor.marcas.map((m) => m.id));
  const actualizarConId = actualizarProveedor.bind(null, proveedor.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/proveedores" className="text-sm text-blue-700 hover:underline">
          ← Volver a Proveedores
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Editar proveedor</h1>
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
              defaultValue={proveedor.nombre}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Contacto (opcional)
            </label>
            <input
              name="contacto"
              defaultValue={proveedor.contacto ?? ""}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Teléfono (opcional)
            </label>
            <input
              name="telefono"
              type="tel"
              defaultValue={proveedor.telefono ?? ""}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email (opcional)
            </label>
            <input
              name="email"
              type="email"
              defaultValue={proveedor.email ?? ""}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Marcas relacionadas
            </label>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-300 p-3">
              {marcas.map((marca) => (
                <label key={marca.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="marcaIds"
                    value={marca.id}
                    defaultChecked={marcaIdsSeleccionadas.has(marca.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  />
                  {marca.nombre}
                </label>
              ))}
              {marcas.length === 0 && (
                <p className="text-sm text-slate-500">No hay marcas cargadas todavía.</p>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={proveedor.activo}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            />
            Proveedor activo
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
