import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { crearProveedor } from "../actions";

export default async function NuevoProveedorPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/proveedores" className="text-sm text-blue-700 hover:underline">
          ← Volver a Proveedores
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Nuevo proveedor</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        <form action={crearProveedor} className="space-y-5">
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
              Contacto (opcional)
            </label>
            <input
              name="contacto"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Nombre de la persona de contacto"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Teléfono (opcional)
            </label>
            <input
              name="telefono"
              type="tel"
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
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800"
          >
            Crear proveedor
          </button>
        </form>
      </div>
    </main>
  );
}
