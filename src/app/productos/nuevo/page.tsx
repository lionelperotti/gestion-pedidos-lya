import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { crearProducto } from "../actions";

export default async function NuevoProductoPage() {
  await requireAdmin();

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/productos" className="text-sm text-blue-700 hover:underline">
          ← Volver a Productos
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Nuevo producto</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        <form action={crearProducto} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              name="nombre"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Descripción (opcional)
            </label>
            <textarea
              name="descripcion"
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              URL de la foto (opcional)
            </label>
            <input
              name="fotoUrl"
              type="url"
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Por ahora se carga con un link a la imagen. Más adelante sumamos subida directa desde el celular.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Precio
              </label>
              <input
                name="precio"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Stock
              </label>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={0}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Proveedor
            </label>
            <select
              name="proveedorId"
              required
              defaultValue=""
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="" disabled>
                Seleccionar proveedor
              </option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
            {proveedores.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                No hay proveedores activos. Creá uno primero en la sección Proveedores.
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800"
          >
            Crear producto
          </button>
        </form>
      </div>
    </main>
  );
}
