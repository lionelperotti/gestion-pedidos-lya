import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import ImportarForm from "./ImportarForm";

export default async function ImportarProductosPage() {
  await requireAdmin();

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    include: { marcas: { orderBy: { nombre: "asc" } } },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/productos" className="text-sm text-blue-700 hover:underline">
          ← Volver a Productos
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Importar productos desde Excel</h1>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {proveedores.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            No hay proveedores activos. Creá uno primero en la sección Proveedores.
          </p>
        ) : (
          <ImportarForm proveedores={proveedores} />
        )}
      </div>
    </main>
  );
}
