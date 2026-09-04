"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProductoResumen {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  activo: boolean;
  precioFinal: number;
  precioActualizadoEn: string | null;
  proveedorNombre: string;
  codigoProveedor: string | null;
}

export default function ProductosGrid({ productos }: { productos: ProductoResumen[] }) {
  const [busqueda, setBusqueda] = useState("");

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(texto));
  }, [busqueda, productos]);

  return (
    <div>
      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar producto..."
        className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {productosFiltrados.map((producto) => (
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
              <p className="truncate text-sm font-medium text-slate-900">{producto.nombre}</p>
              <p className="truncate text-xs text-slate-500">
                {producto.proveedorNombre}
                {producto.codigoProveedor ? ` · ${producto.codigoProveedor}` : ""}
              </p>
              <p className="mt-1 text-sm font-semibold text-blue-700">
                ${producto.precioFinal.toLocaleString("es-AR")}
              </p>
              {producto.precioActualizadoEn && (
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Precio actualizado:{" "}
                  {new Date(producto.precioActualizadoEn).toLocaleDateString("es-AR")}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {productosFiltrados.length === 0 && (
        <p className="py-12 text-center text-slate-500">
          {productos.length === 0
            ? "Esta marca todavía no tiene productos cargados."
            : "Ningún producto coincide con la búsqueda."}
        </p>
      )}
      {productos.length > 0 && (
        <p className="mt-3 text-sm text-slate-500">
          Total: {productosFiltrados.length} de {productos.length} producto
          {productos.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
