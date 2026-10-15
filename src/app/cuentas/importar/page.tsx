import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import ImportarResumenForm from "../ImportarResumenForm";

export default async function ImportarResumenPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/cuentas" className="text-sm text-blue-700 hover:underline">
          ← Volver a Cuentas corrientes
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Importar resumen de cuenta</h1>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <ImportarResumenForm />
      </div>
    </main>
  );
}
