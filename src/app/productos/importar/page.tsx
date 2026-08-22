import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import ImportarForm from "./ImportarForm";

export default async function ImportarProductosPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/productos" className="text-sm text-blue-700 hover:underline">
          ← Volver a Productos
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Importar productos desde Excel</h1>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <ImportarForm />
      </div>
    </main>
  );
}
