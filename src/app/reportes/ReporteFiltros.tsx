"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface VendedorOpcion {
  id: string;
  nombre: string;
}

export default function ReporteFiltros({
  esAdmin,
  vendedores,
  desdeInicial,
  hastaInicial,
  vendedorIdInicial,
  usuarioIdPropio,
}: {
  esAdmin: boolean;
  vendedores: VendedorOpcion[];
  desdeInicial: string;
  hastaInicial: string;
  vendedorIdInicial: string;
  usuarioIdPropio: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [desde, setDesde] = useState(desdeInicial);
  const [hasta, setHasta] = useState(hastaInicial);
  const [vendedorId, setVendedorId] = useState(vendedorIdInicial);

  function aplicarFiltros() {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (esAdmin && vendedorId) params.set("vendedorId", vendedorId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Desde</label>
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Hasta</label>
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Vendedor</label>
        <select
          value={esAdmin ? vendedorId : usuarioIdPropio}
          onChange={(e) => setVendedorId(e.target.value)}
          disabled={!esAdmin}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
        >
          {esAdmin && <option value="">Todos</option>}
          {vendedores.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre}
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
