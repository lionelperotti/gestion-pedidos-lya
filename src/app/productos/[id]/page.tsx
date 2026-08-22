import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { actualizarProducto } from "../actions";
import ProductoForm from "../ProductoForm";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [producto, proveedores] = await Promise.all([
    prisma.producto.findUnique({ where: { id } }),
    prisma.proveedor.findMany({
      orderBy: { nombre: "asc" },
      include: { marcas: { orderBy: { nombre: "asc" } } },
    }),
  ]);

  if (!producto) {
    notFound();
  }

  const actualizarConId = actualizarProducto.bind(null, producto.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/productos" className="text-sm text-blue-700 hover:underline">
          ← Volver a Productos
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Editar producto</h1>
        {producto.precioActualizadoEn && (
          <p className="mt-1 text-xs text-slate-500">
            Precio actualizado por última vez:{" "}
            {new Date(producto.precioActualizadoEn).toLocaleString("es-AR")}
          </p>
        )}
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        <ProductoForm
          action={actualizarConId}
          proveedores={proveedores}
          esEdicion
          valoresIniciales={{
            nombre: producto.nombre,
            descripcion: producto.descripcion ?? "",
            fotoUrl: producto.fotoUrl ?? "",
            codigoProveedor: producto.codigoProveedor ?? "",
            precioSinIva: Number(producto.precioSinIva),
            iva: Number(producto.iva),
            stock: producto.stock,
            proveedorId: producto.proveedorId,
            marcaId: producto.marcaId,
            activo: producto.activo,
          }}
        />
      </div>
    </main>
  );
}
