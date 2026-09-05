"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Opcion {
  id: string;
  nombre: string;
}

export default function CatalogoFiltros({
  proveedores,
  marcas,
  proveedorIdInicial,
  marcaIdInicial,
}: {
  proveedores: Opcion[];
  marcas: Opcion[];
  proveedorIdInicial: string;
  marcaIdInicial: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [proveedorId, setProveedorId] = useState(proveedorIdInicial);
  const [marcaId, setMarcaId] = useState(marcaIdInicial);

  function aplicarFiltros() {
    const params = new URLSearchParams();
    if (proveedorId) params.set("proveedorId", proveedorId);
    if (marcaId) params.set("marcaId", marcaId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Proveedor</label>
        <select
          value={proveedorId}
          onChange={(e) => setProveedorId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todos</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Marca</label>
        <select
          value={marcaId}
          onChange={(e) => setMarcaId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todas</option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={aplicarFiltros}
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Aplicar
      </button>
    </div>
  );
}
