import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export default async function ProductosMarcasPage() {
  await requireAdmin();

  const marcas = await prisma.marca.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-sm text-blue-700 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Productos</h1>
          <p className="text-sm text-slate-500">Elegí una marca para ver sus productos</p>
        </div>
        <Link
          href="/productos/importar"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Importar desde Excel
        </Link>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Link
            href="/productos/todos"
            className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-8 text-center shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="font-semibold text-slate-900">Todos los productos</span>
          </Link>
          {marcas.map((marca) => (
            <Link
              key={marca.id}
              href={`/productos/marca/${marca.id}`}
              className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-8 text-center shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="font-semibold text-slate-900">{marca.nombre}</span>
              <span className="mt-1 text-xs text-slate-500">
                {marca._count.productos} producto{marca._count.productos !== 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
        {marcas.length === 0 && (
          <p className="py-12 text-center text-slate-500">
            Todavía no hay marcas cargadas.{" "}
            <Link href="/marcas/nuevo" className="text-blue-700 underline">
              Creá una primero
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
