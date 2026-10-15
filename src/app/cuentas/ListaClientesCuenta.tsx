"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { claveDeNombre } from "@/lib/cuentas";
import { normalizarNombre } from "@/lib/errores";
import { useNavegacionTeclado } from "@/lib/useNavegacionTeclado";
import { formatearMoneda } from "@/lib/formato";

interface ItemCliente {
  id: string;
  nombre: string;
  codigo: string;
  /** Deuda según el último resumen; null si el cliente no figura en él. */
  deuda: number | null;
}

export default function ListaClientesCuenta({ clientes }: { clientes: ItemCliente[] }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const palabras = normalizarNombre(busqueda).split(" ").filter(Boolean);
    if (palabras.length === 0) return clientes;
    return clientes.filter((c) => {
      const texto = `${normalizarNombre(c.nombre)} ${claveDeNombre(c.nombre)} ${normalizarNombre(c.codigo)}`;
      return palabras.every((p) => texto.includes(p));
    });
  }, [busqueda, clientes]);

  const { indiceActivo: navIndice, onKeyDown: navKeyDown, contenedorRef: navRef, reiniciar: navReiniciar } = useNavegacionTeclado(
    filtrados,
    (c) => router.push(`/cuentas/clientes/${c.id}`),
    busqueda.trim() !== ""
  );

  return (
    <div>
      <input
        type="text"
        autoFocus
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          navReiniciar();
        }}
        onKeyDown={navKeyDown}
        placeholder="Buscar por nombre o código... (↑ ↓ y Enter para abrir)"
        className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />

      <div ref={navRef} className="space-y-2">
        {filtrados.map((c, indice) => (
          <Link
            key={c.id}
            href={`/cuentas/clientes/${c.id}`}
            data-nav-index={indice}
            className={`flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm hover:border-blue-300 hover:bg-blue-50 ${
              busqueda.trim() !== "" && navIndice === indice
                ? "border-blue-500 ring-2 ring-blue-300"
                : "border-slate-200"
            }`}
          >
            <span>
              <span className="block text-sm font-medium text-slate-900">{c.nombre}</span>
              <span className="block text-xs text-slate-500">Código {c.codigo}</span>
            </span>
            <span
              className={`text-sm font-semibold ${
                c.deuda === null ? "text-slate-400" : c.deuda > 0 ? "text-blue-700" : "text-green-700"
              }`}
            >
              {c.deuda === null ? "—" : formatearMoneda(c.deuda)}
            </span>
          </Link>
        ))}
        {filtrados.length === 0 && (
          <p className="py-10 text-center text-slate-500">Ningún cliente coincide con la búsqueda.</p>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {filtrados.length === clientes.length
          ? `Total: ${clientes.length} cliente${clientes.length !== 1 ? "s" : ""}`
          : `Mostrando ${filtrados.length} de ${clientes.length}`}
      </p>
    </div>
  );
}
