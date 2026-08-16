import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { crearPerfil } from "../actions";

export default async function NuevoPerfilPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/perfiles" className="text-sm text-blue-700 hover:underline">
          ← Volver a Perfiles
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Nuevo perfil</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        <form action={crearPerfil} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              name="nombre"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Ej: Supervisor"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Descripción (opcional)
            </label>
            <textarea
              name="descripcion"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800"
          >
            Crear perfil
          </button>
        </form>
      </div>
    </main>
  );
}
