"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { crearPedido } from "../actions";

interface Cliente {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  precio: number;
  proveedorNombre: string;
}

export default function CartForm({
  clientes,
  productos,
}: {
  clientes: Cliente[];
  productos: Producto[];
}) {
  const [clienteId, setClienteId] = useState("");
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(
    () =>
      Object.entries(cantidades)
        .filter(([, cantidad]) => cantidad > 0)
        .map(([productoId, cantidad]) => ({ productoId, cantidad })),
    [cantidades]
  );

  const total = useMemo(() => {
    return items.reduce((acc, item) => {
      const producto = productos.find((p) => p.id === item.productoId);
      return acc + (producto ? producto.precio * item.cantidad : 0);
    }, 0);
  }, [items, productos]);

  function cambiarCantidad(productoId: string, delta: number) {
    setCantidades((prev) => {
      const actual = prev[productoId] ?? 0;
      const nueva = Math.max(0, actual + delta);
      return { ...prev, [productoId]: nueva };
    });
  }

  async function handleConfirmar() {
    setError(null);
    if (!clienteId) {
      setError("Seleccioná un cliente antes de continuar.");
      return;
    }
    if (items.length === 0) {
      setError("Agregá al menos un producto al pedido.");
      return;
    }
    setEnviando(true);
    try {
      await crearPedido(clienteId, items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error al crear el pedido.");
      setEnviando(false);
    }
  }

  return (
    <div className="pb-32">
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Cliente
        </label>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Seleccionar cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {productos.map((producto) => {
          const cantidad = cantidades[producto.id] ?? 0;
          return (
            <div
              key={producto.id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative aspect-square bg-slate-100">
                {producto.fotoUrl ? (
                  <Image
                    src={producto.fotoUrl}
                    alt={producto.nombre}
                    fill
                    className="object-cover"
                    sizes="180px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    Sin foto
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="truncate text-sm font-medium text-slate-900">
                  {producto.nombre}
                </p>
                <p className="text-sm font-semibold text-blue-700">
                  ${producto.precio.toLocaleString("es-AR")}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(producto.id, -1)}
                    disabled={cantidad === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-lg font-semibold text-slate-700 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-base font-semibold text-slate-900">
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(producto.id, 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-lg font-semibold text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {productos.length === 0 && (
          <p className="col-span-full py-8 text-center text-slate-500">
            No hay productos disponibles.
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
        {error && (
          <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-slate-600">
            {items.length} producto{items.length !== 1 ? "s" : ""}
          </span>
          <span className="text-lg font-bold text-slate-900">
            ${total.toLocaleString("es-AR")}
          </span>
        </div>
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={enviando}
          className="w-full rounded-lg bg-blue-700 px-4 py-3.5 text-base font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {enviando ? "Confirmando..." : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}
