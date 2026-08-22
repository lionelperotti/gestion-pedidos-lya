import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export default async function ProductosPorMarcaPage({
  params,
}: {
  params: Promise<{ marcaId: string }>;
}) {
  await requireAdmin();
  const { marcaId } = await params;

  const marca = await prisma.marca.findUnique({ where: { id: marcaId } });
  if (!marca) {
    notFound();
  }

  const productos = await prisma.producto.findMany({
    where: { marcaId },
    orderBy: { nombre: "asc" },
    include: { proveedor: true },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/productos" className="text-sm text-blue-700 hover:underline">
            ← Volver a Marcas
          </Link>
          <h1 className="text-lg font-bold text-slate-900">{marca.nombre}</h1>
        </div>
        <Link
          href={`/productos/nuevo?marcaId=${marca.id}`}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nuevo producto
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {productos.map((producto) => (
            <Link
              key={producto.id}
              href={`/productos/${producto.id}`}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square bg-slate-100">
                {producto.fotoUrl ? (
                  <Image
                    src={producto.fotoUrl}
                    alt={producto.nombre}
                    fill
                    className="object-cover"
                    sizes="200px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    Sin foto
                  </div>
                )}
                {!producto.activo && (
                  <span className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-white">
                    Inactivo
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-slate-900">
                  {producto.nombre}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {producto.proveedor.nombre}
                  {producto.codigoProveedor ? ` · ${producto.codigoProveedor}` : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-blue-700">
                  ${Number(producto.precioFinal).toLocaleString("es-AR")}
                </p>
              </div>
            </Link>
          ))}
        </div>
        {productos.length === 0 && (
          <p className="py-12 text-center text-slate-500">
            Esta marca todavía no tiene productos cargados.
          </p>
        )}
      </div>
    </main>
  );
}
