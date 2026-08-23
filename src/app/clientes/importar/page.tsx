import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUsuario } from "@/lib/session";
import ImportarClientesForm from "./ImportarClientesForm";

export default async function ImportarClientesPage() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/clientes" className="text-sm text-blue-700 hover:underline">
          ← Volver a Clientes
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Importar clientes desde Excel</h1>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <ImportarClientesForm />
      </div>
    </main>
  );
}
