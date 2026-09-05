import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUsuario } from "@/lib/session";

export default async function ReportesPage() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/" className="text-sm text-blue-700 hover:underline">
          ← Volver
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Reportes</h1>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/reportes/clientes"
            className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center shadow-sm hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="font-semibold text-slate-900">Ventas por Cliente</span>
          </Link>
          <Link
            href="/reportes/vendedores"
            className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center shadow-sm hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="font-semibold text-slate-900">Ventas por Vendedor</span>
          </Link>
          <Link
            href="/reportes/productos"
            className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center shadow-sm hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="font-semibold text-slate-900">Productos más vendidos</span>
          </Link>
          <Link
            href="/reportes/catalogo"
            className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center shadow-sm hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="font-semibold text-slate-900">Catálogo de Productos</span>
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Los reportes de ventas solo cuentan pedidos que ya fueron enviados (están en un
          Lote). El Catálogo de Productos muestra todo el catálogo actual.
        </p>
      </div>
    </main>
  );
}
