import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { crearProvincia } from "../actions";
import FormAccion from "@/components/FormAccion";

export default async function NuevaProvinciaPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/provincias" className="text-sm text-blue-700 hover:underline">
          ← Volver a Provincias
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Nueva provincia</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        <FormAccion action={crearProvincia} textoBoton="Crear provincia">
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
        </FormAccion>
      </div>
    </main>
  );
}
