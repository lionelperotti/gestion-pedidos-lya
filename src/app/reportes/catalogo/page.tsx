import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import CatalogoFiltros from "./CatalogoFiltros";
import ExportarBotones from "../ExportarBotones";

export default async function ReporteCatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ proveedorId?: string; marcaId?: string }>;
}) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const filtros = await searchParams;

  const [productosDb, proveedores, marcas] = await Promise.all([
    prisma.producto.findMany({
      where: {
        ...(filtros.proveedorId ? { proveedorId: filtros.proveedorId } : {}),
        ...(filtros.marcaId ? { marcaId: filtros.marcaId } : {}),
      },
      orderBy: [{ proveedor: { nombre: "asc" } }, { marca: { nombre: "asc" } }, { nombre: "asc" }],
      include: { proveedor: true, marca: true },
    }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.marca.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  const filas = productosDb.map((p) => ({
    codigo: p.codigoProveedor ?? "—",
    nombre: p.nombre,
    proveedor: p.proveedor.nombre,
    marca: p.marca.nombre,
    precioSinIva: Number(p.precioSinIva),
    iva: Number(p.iva),
    precioFinal: Number(p.precioFinal),
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/reportes" className="text-sm text-blue-700 hover:underline">
          ← Volver a Reportes
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Catálogo de Productos</h1>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <CatalogoFiltros
          proveedores={proveedores}
          marcas={marcas}
          proveedorIdInicial={filtros.proveedorId ?? ""}
          marcaIdInicial={filtros.marcaId ?? ""}
        />

        <div className="mb-4 flex justify-end">
          <ExportarBotones
            titulo="Catálogo de Productos"
            nombreArchivo="catalogo-productos"
            columnas={[
              { header: "Código", accessor: (f: (typeof filas)[number]) => f.codigo },
              { header: "Nombre", accessor: (f: (typeof filas)[number]) => f.nombre },
              { header: "Proveedor", accessor: (f: (typeof filas)[number]) => f.proveedor },
              { header: "Marca", accessor: (f: (typeof filas)[number]) => f.marca },
              {
                header: "Precio S/IVA",
                accessor: (f: (typeof filas)[number]) =>
                  f.precioSinIva.toLocaleString("es-AR"),
                alineacionDerecha: true,
              },
              {
                header: "IVA",
                accessor: (f: (typeof filas)[number]) => `${f.iva}%`,
                alineacionDerecha: true,
              },
              {
                header: "Precio Final",
                accessor: (f: (typeof filas)[number]) =>
                  f.precioFinal.toLocaleString("es-AR"),
                alineacionDerecha: true,
              },
            ]}
            filas={filas}
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 text-right font-medium">Precio S/IVA</th>
                  <th className="px-4 py-3 text-right font-medium">IVA</th>
                  <th className="px-4 py-3 text-right font-medium">Precio Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((fila, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-slate-600">{fila.codigo}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{fila.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{fila.proveedor}</td>
                    <td className="px-4 py-3 text-slate-600">{fila.marca}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${fila.precioSinIva.toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{fila.iva}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">
                      ${fila.precioFinal.toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      No hay productos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {filas.length > 0 && (
          <p className="mt-3 text-sm text-slate-500">
            Total: {filas.length} producto{filas.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </main>
  );
}
