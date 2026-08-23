"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { crearOAgregarLote } from "../../lotes/actions";

interface PedidoResumen {
  id: string;
  numero: number;
  clienteNombre: string;
  vendedorNombre: string;
  cantidadItems: number;
  total: number;
  fecha: string;
}

export default function SeleccionPedidosPendientes({
  pedidos,
  esAdmin,
  hayLoteAbierto,
}: {
  pedidos: PedidoResumen[];
  esAdmin: boolean;
  hayLoteAbierto: boolean;
}) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const totalGeneral = pedidos.reduce((acc, p) => acc + p.total, 0);

  function toggle(id: string) {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  function toggleTodos() {
    setSeleccionados((prev) =>
      prev.size === pedidos.length ? new Set() : new Set(pedidos.map((p) => p.id))
    );
  }

  function handleCrearLote() {
    if (seleccionados.size === 0) {
      setError("Seleccioná al menos un pedido.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await crearOAgregarLote(Array.from(seleccionados));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ocurrió un error al armar el lote.");
      }
    });
  }

  return (
    <div>
      {pedidos.length > 0 && (
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={seleccionados.size === pedidos.length}
            onChange={toggleTodos}
            className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
          />
          Seleccionar todos
        </label>
      )}

      <div className="space-y-3">
        {pedidos.map((pedido) => (
          <div
            key={pedido.id}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <input
              type="checkbox"
              checked={seleccionados.has(pedido.id)}
              onChange={() => toggle(pedido.id)}
              className="h-4 w-4 flex-shrink-0 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            />
            <Link href={`/pedidos/${pedido.id}`} className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 hover:underline">
                Pedido #{pedido.numero} · {pedido.clienteNombre}
              </p>
              <p className="text-sm text-slate-500">
                {pedido.cantidadItems} producto{pedido.cantidadItems !== 1 ? "s" : ""}
                {esAdmin && ` · ${pedido.vendedorNombre}`} · {pedido.fecha}
              </p>
            </Link>
            <span className="font-semibold text-blue-700">
              ${pedido.total.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
        {pedidos.length === 0 && (
          <p className="py-12 text-center text-slate-500">No hay pedidos pendientes.</p>
        )}
      </div>

      {pedidos.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-600">
            Total: {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""}
          </span>
          <span className="font-semibold text-blue-700">
            ${totalGeneral.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {seleccionados.size > 0 && (
        <button
          type="button"
          onClick={handleCrearLote}
          disabled={pendiente}
          className="fixed inset-x-4 bottom-4 rounded-lg bg-blue-700 px-4 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-blue-800 disabled:opacity-60 sm:inset-x-auto sm:right-6 sm:w-auto sm:px-6"
        >
          {pendiente
            ? "Guardando..."
            : hayLoteAbierto
            ? `Agregar al lote abierto (${seleccionados.size})`
            : `Crear lote (${seleccionados.size})`}
        </button>
      )}
    </div>
  );
}
