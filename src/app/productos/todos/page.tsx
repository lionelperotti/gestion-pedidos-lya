import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import ProductosGrid from "../marca/[marcaId]/ProductosGrid";

export default async function TodosLosProductosPage() {
  await requireAdmin();

  const productosDb = await prisma.producto.findMany({
    orderBy: { nombre: "asc" },
    include: { proveedor: true },
  });

  const productos = productosDb.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    fotoUrl: p.fotoUrl,
    activo: p.activo,
    precioFinal: Number(p.precioFinal),
    precioActualizadoEn: p.precioActualizadoEn ? p.precioActualizadoEn.toISOString() : null,
    proveedorNombre: p.proveedor.nombre,
    codigoProveedor: p.codigoProveedor,
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/productos" className="text-sm text-blue-700 hover:underline">
            ← Volver a Marcas
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Todos los productos</h1>
        </div>
        <Link
          href="/productos/nuevo"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nuevo producto
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <ProductosGrid productos={productos} />
      </div>
    </main>
  );
}
