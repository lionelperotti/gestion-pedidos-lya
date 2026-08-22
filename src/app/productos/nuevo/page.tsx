import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { crearProducto } from "../actions";
import ProductoForm from "../ProductoForm";

export default async function NuevoProductoPage({
  searchParams,
}: {
  searchParams: Promise<{ marcaId?: string }>;
}) {
  await requireAdmin();
  const { marcaId } = await searchParams;

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    include: { marcas: { orderBy: { nombre: "asc" } } },
  });

  // Si venimos desde la lista de una marca, precargamos el proveedor que la tenga relacionada
  const proveedorSugerido = marcaId
    ? proveedores.find((p) => p.marcas.some((m) => m.id === marcaId))
    : undefined;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/productos" className="text-sm text-blue-700 hover:underline">
          ← Volver a Productos
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Nuevo producto</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        {proveedores.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            No hay proveedores activos. Creá uno primero en la sección Proveedores.
          </p>
        ) : (
          <ProductoForm
            action={crearProducto}
            proveedores={proveedores}
            valoresIniciales={{
              proveedorId: proveedorSugerido?.id ?? "",
              marcaId: marcaId ?? "",
              iva: 21,
            }}
          />
        )}
      </div>
    </main>
  );
}
