import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { actualizarProducto } from "../actions";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [producto, proveedores] = await Promise.all([
    prisma.producto.findUnique({ where: { id } }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  if (!producto) {
    notFound();
  }

  const actualizarConId = actualizarProducto.bind(null, producto.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/productos" className="text-sm text-blue-700 hover:underline">
          ← Volver a Productos
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Editar producto</h1>
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
              defaultValue={producto.nombre}
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
              defaultValue={producto.descripcion ?? ""}
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
              defaultValue={producto.fotoUrl ?? ""}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
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
                defaultValue={Number(producto.precio)}
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
                defaultValue={producto.stock}
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
              defaultValue={producto.proveedorId}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={producto.activo}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            />
            Producto activo
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
