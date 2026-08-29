"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";
import { crearPedido, actualizarPedido } from "../actions";

interface Cliente {
  id: string;
  nombre: string;
  cuit?: string | null;
  direccion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
}

interface Marca {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  precioSinIva: number;
  iva: number;
  marcaId: string;
}

interface ItemEstado {
  productoId: string;
  cantidad: number;
  descuento: number;
  precioSinIva: number;
  iva: number;
}

type Paso = "cliente" | "marca" | "productos" | "confirmar";

export default function PedidoWizard({
  clientes,
  marcas,
  productos,
  modo,
  pedidoId,
  clienteInicial,
  itemsIniciales,
  datosPedidoIniciales,
}: {
  clientes: Cliente[];
  marcas: Marca[];
  productos: Producto[];
  modo: "crear" | "editar";
  pedidoId?: string;
  clienteInicial?: Cliente;
  itemsIniciales?: ItemEstado[];
  datosPedidoIniciales?: {
    conFactura: boolean;
    modalidadPago: "CONTADO" | "CUENTA_CORRIENTE";
    observaciones: string;
  };
}) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>(modo === "editar" ? "marca" : "cliente");
  const [clienteId, setClienteId] = useState(clienteInicial?.id ?? "");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | undefined>(
    clienteInicial
  );
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [marcaId, setMarcaId] = useState<string>("");
  const [items, setItems] = useState<Record<string, ItemEstado>>(() => {
    const inicial: Record<string, ItemEstado> = {};
    for (const item of itemsIniciales ?? []) {
      inicial[item.productoId] = item;
    }
    return inicial;
  });
  const [conFactura, setConFactura] = useState<"si" | "no" | "">(
    datosPedidoIniciales ? (datosPedidoIniciales.conFactura ? "si" : "no") : ""
  );
  const [modalidadPago, setModalidadPago] = useState<"CONTADO" | "CUENTA_CORRIENTE" | "">(
    datosPedidoIniciales?.modalidadPago ?? ""
  );
  const [observaciones, setObservaciones] = useState(datosPedidoIniciales?.observaciones ?? "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productoAmpliadoIndex, setProductoAmpliadoIndex] = useState<number | null>(null);

  const clientesFiltrados = useMemo(() => {
    const texto = busquedaCliente.trim().toLowerCase();
    if (!texto) return clientes;
    return clientes.filter((c) => c.nombre.toLowerCase().includes(texto));
  }, [busquedaCliente, clientes]);

  const productosVisibles = useMemo(() => {
    if (marcaId === "todas" || !marcaId) return productos;
    return productos.filter((p) => p.marcaId === marcaId);
  }, [marcaId, productos]);

  const productosFiltrados = useMemo(() => {
    const texto = busquedaProducto.trim().toLowerCase();
    if (!texto) return productosVisibles;
    return productosVisibles.filter((p) => p.nombre.toLowerCase().includes(texto));
  }, [busquedaProducto, productosVisibles]);

  const itemsCargados = useMemo(
    () => Object.values(items).filter((i) => i.cantidad > 0),
    [items]
  );

  // Cuántos productos DISTINTOS (no unidades) hay cargados de cada marca,
  // para mostrar el numerito en la tarjeta de cada marca.
  const cantidadPorMarca = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const item of itemsCargados) {
      const producto = productos.find((p) => p.id === item.productoId);
      if (!producto) continue;
      mapa[producto.marcaId] = (mapa[producto.marcaId] ?? 0) + 1;
    }
    return mapa;
  }, [itemsCargados, productos]);

  function precioFinalProducto(producto: Producto) {
    return producto.precioSinIva * (1 + producto.iva / 100);
  }

  function calcularSubtotal(item: ItemEstado, precio: number) {
    return precio * item.cantidad * (1 - (item.descuento || 0) / 100);
  }

  function DatosCliente({ compacto = false }: { compacto?: boolean }) {
    if (!clienteSeleccionado) return null;
    const partes = [
      clienteSeleccionado.cuit ? `CUIT: ${clienteSeleccionado.cuit}` : null,
      clienteSeleccionado.direccion,
      clienteSeleccionado.localidad,
      clienteSeleccionado.provincia,
    ].filter(Boolean);

    if (compacto) {
      return (
        <span className="text-sm text-slate-600">
          {clienteSeleccionado.nombre}
          {partes.length > 0 && (
            <span className="block text-xs text-slate-400">{partes.join(" · ")}</span>
          )}
        </span>
      );
    }

    return (
      <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
        <p>
          Cliente: <span className="font-semibold">{clienteSeleccionado.nombre}</span>
        </p>
        {partes.length > 0 && <p className="mt-0.5 text-xs text-blue-700">{partes.join(" · ")}</p>}
      </div>
    );
  }

  const total = useMemo(() => {
    return itemsCargados.reduce((acc, item) => {
      const producto = productos.find((p) => p.id === item.productoId);
      return acc + (producto ? calcularSubtotal(item, precioFinalProducto(producto)) : 0);
    }, 0);
  }, [itemsCargados, productos]);

  function actualizarItem(productoId: string, cambios: Partial<ItemEstado>) {
    setItems((prev) => {
      const producto = productos.find((p) => p.id === productoId);
      const actual =
        prev[productoId] ??
        ({
          productoId,
          cantidad: 0,
          descuento: 0,
          precioSinIva: producto?.precioSinIva ?? 0,
          iva: producto?.iva ?? 21,
        } as ItemEstado);
      const nuevo = { ...actual, ...cambios };
      return { ...prev, [productoId]: nuevo };
    });
  }

  function cambiarCantidad(productoId: string, delta: number) {
    const actual = items[productoId]?.cantidad ?? 0;
    actualizarItem(productoId, { cantidad: Math.max(0, actual + delta) });
  }

  function elegirCliente(cliente: Cliente) {
    setClienteId(cliente.id);
    setClienteSeleccionado(cliente);
    setPaso("marca");
  }

  function cancelarCarga() {
    const confirmado = confirm(
      "¿Cancelar la carga de este pedido? Se va a perder todo lo que cargaste hasta ahora."
    );
    if (confirmado) {
      router.push("/");
    }
  }

  async function handleEnviarFinal() {
    setError(null);

    if (itemsCargados.length === 0) {
      setError("Agregá al menos un producto al pedido.");
      return;
    }

    if (!conFactura) {
      setError("Indicá si el pedido es con factura o sin factura.");
      return;
    }
    if (!modalidadPago) {
      setError("Indicá la modalidad de pago.");
      return;
    }

    setEnviando(true);
    try {
      if (modo === "crear") {
        await crearPedido({
          clienteId,
          items: itemsCargados,
          conFactura: conFactura === "si",
          modalidadPago: modalidadPago as "CONTADO" | "CUENTA_CORRIENTE",
          observaciones,
        });
      } else if (pedidoId) {
        await actualizarPedido(pedidoId, {
          items: itemsCargados,
          conFactura: conFactura === "si",
          modalidadPago: modalidadPago as "CONTADO" | "CUENTA_CORRIENTE",
          observaciones,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error al guardar el pedido.");
      setEnviando(false);
    }
  }

  // ---------------------------------------------------------
  // Paso 1: Cliente
  // ---------------------------------------------------------
  if (paso === "cliente") {
    return (
      <div className="p-4">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-blue-700 hover:underline"
        >
          ← Volver al Menú Principal
        </Link>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Buscar cliente
        </label>
        <input
          type="text"
          autoFocus
          value={busquedaCliente}
          onChange={(e) => setBusquedaCliente(e.target.value)}
          placeholder="Escribí el nombre..."
          className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <div className="space-y-2">
          {clientesFiltrados.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              onClick={() => elegirCliente(cliente)}
              className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-base font-medium text-slate-900 shadow-sm hover:border-blue-300 hover:bg-blue-50"
            >
              {cliente.nombre}
            </button>
          ))}
          {clientesFiltrados.length === 0 && (
            <p className="py-6 text-center text-slate-500">
              No se encontró ningún cliente con ese nombre.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Paso 2: Marca
  // ---------------------------------------------------------
  if (paso === "marca") {
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          {modo === "editar" && pedidoId ? (
            <Link
              href={`/pedidos/${pedidoId}`}
              className="inline-block text-sm text-blue-700 hover:underline"
            >
              ← Volver al pedido
            </Link>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={cancelarCarga}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Cancelar
          </button>
        </div>
        <DatosCliente />
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Elegí una marca</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setMarcaId("todas");
              setPaso("productos");
            }}
            className="relative flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-8 text-center shadow-sm hover:border-blue-300 hover:bg-blue-50"
          >
            {itemsCargados.length > 0 && (
              <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-700 px-1.5 text-xs font-bold text-white">
                {itemsCargados.length}
              </span>
            )}
            <span className="font-semibold text-slate-900">Todas las marcas</span>
          </button>
          {marcas.map((marca) => {
            const cantidad = cantidadPorMarca[marca.id] ?? 0;
            return (
              <button
                key={marca.id}
                type="button"
                onClick={() => {
                  setMarcaId(marca.id);
                  setPaso("productos");
                }}
                className="relative flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-8 text-center shadow-sm hover:border-blue-300 hover:bg-blue-50"
              >
                {cantidad > 0 && (
                  <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-700 px-1.5 text-xs font-bold text-white">
                    {cantidad}
                  </span>
                )}
                <span className="font-semibold text-slate-900">{marca.nombre}</span>
              </button>
            );
          })}
        </div>
        {itemsCargados.length > 0 && (
          <button
            type="button"
            onClick={() => setPaso("confirmar")}
            className="fixed inset-x-4 bottom-4 rounded-lg bg-blue-700 px-4 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-blue-800"
          >
            Ver pedido ({itemsCargados.length}) · ${total.toLocaleString("es-AR")}
          </button>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------
  // Paso 3: Productos
  // ---------------------------------------------------------
  if (paso === "productos") {
    return (
      <div className="pb-32">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => setPaso("marca")}
            className="text-sm text-blue-700 hover:underline"
          >
            ← Marcas
          </button>
          <DatosCliente compacto />
          <button
            type="button"
            onClick={cancelarCarga}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Cancelar
          </button>
        </div>

        <div className="px-4 pt-3">
          <input
            type="text"
            value={busquedaProducto}
            onChange={(e) => setBusquedaProducto(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
          {productosFiltrados.map((producto) => {
            const item = items[producto.id];
            const cantidad = item?.cantidad ?? 0;
            return (
              <div
                key={producto.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              >
                <div
                  className="relative aspect-square cursor-pointer bg-slate-100"
                  onClick={() =>
                    setProductoAmpliadoIndex(
                      productosFiltrados.findIndex((p) => p.id === producto.id)
                    )
                  }
                >
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
                    ${precioFinalProducto(producto).toLocaleString("es-AR")}
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
                    <input
                      type="number"
                      min={0}
                      value={cantidad}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        actualizarItem(producto.id, {
                          cantidad: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-12 rounded-lg border border-slate-200 text-center text-base font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-100"
                    />
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
          {productosFiltrados.length === 0 && (
            <p className="col-span-full py-8 text-center text-slate-500">
              No hay productos disponibles en esta marca.
            </p>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {itemsCargados.length} producto{itemsCargados.length !== 1 ? "s" : ""}
            </span>
            <span className="text-lg font-bold text-slate-900">
              ${total.toLocaleString("es-AR")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPaso("confirmar")}
            disabled={itemsCargados.length === 0}
            className="w-full rounded-lg bg-blue-700 px-4 py-3.5 text-base font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            Revisar y confirmar
          </button>
        </div>

        {productoAmpliadoIndex !== null && productosFiltrados[productoAmpliadoIndex] && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-sm text-slate-500">
                {productoAmpliadoIndex + 1} de {productosFiltrados.length}
              </span>
              <button
                type="button"
                onClick={() => setProductoAmpliadoIndex(null)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="relative flex-1 bg-slate-100">
              {productosFiltrados[productoAmpliadoIndex].fotoUrl ? (
                <Image
                  src={productosFiltrados[productoAmpliadoIndex].fotoUrl as string}
                  alt={productosFiltrados[productoAmpliadoIndex].nombre}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  Sin foto
                </div>
              )}

              {productoAmpliadoIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setProductoAmpliadoIndex((i) => (i !== null ? i - 1 : i))}
                  className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-slate-700 shadow"
                  aria-label="Producto anterior"
                >
                  ‹
                </button>
              )}
              {productoAmpliadoIndex < productosFiltrados.length - 1 && (
                <button
                  type="button"
                  onClick={() => setProductoAmpliadoIndex((i) => (i !== null ? i + 1 : i))}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-slate-700 shadow"
                  aria-label="Producto siguiente"
                >
                  ›
                </button>
              )}
            </div>

            <div className="border-t border-slate-200 px-4 py-4">
              <p className="text-base font-semibold text-slate-900">
                {productosFiltrados[productoAmpliadoIndex].nombre}
              </p>
              <p className="mb-3 text-lg font-bold text-blue-700">
                ${precioFinalProducto(productosFiltrados[productoAmpliadoIndex]).toLocaleString("es-AR")}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => cambiarCantidad(productosFiltrados[productoAmpliadoIndex].id, -1)}
                  disabled={(items[productosFiltrados[productoAmpliadoIndex].id]?.cantidad ?? 0) === 0}
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-300 text-2xl font-semibold text-slate-700 disabled:opacity-30"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={items[productosFiltrados[productoAmpliadoIndex].id]?.cantidad ?? 0}
                  onFocus={(e) => e.target.select()}
                      onClick={(e) => e.currentTarget.select()}
                  onChange={(e) =>
                    actualizarItem(productosFiltrados[productoAmpliadoIndex].id, {
                      cantidad: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-20 rounded-lg border border-slate-300 py-2 text-center text-xl font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => cambiarCantidad(productosFiltrados[productoAmpliadoIndex].id, 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-700 text-2xl font-semibold text-white"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------
  // Paso 4: Confirmación
  // ---------------------------------------------------------
  return (
    <div className="pb-40">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPaso("productos")}
            className="text-sm text-blue-700 hover:underline"
          >
            ← Seguir cargando productos
          </button>
          <button
            type="button"
            onClick={cancelarCarga}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Cancelar
          </button>
        </div>
        <h1 className="mt-1 text-lg font-bold text-slate-900">Confirmar pedido</h1>
        <DatosCliente compacto />
      </div>

      <div className="p-4">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 text-right font-medium">Cant.</th>
                <th className="px-3 py-2 text-right font-medium">Precio S/IVA</th>
                <th className="px-3 py-2 text-right font-medium">IVA %</th>
                <th className="px-3 py-2 text-right font-medium">Precio Final</th>
                <th className="px-3 py-2 text-right font-medium">Desc. %</th>
                <th className="px-3 py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsCargados.map((item) => {
                const producto = productos.find((p) => p.id === item.productoId);
                if (!producto) return null;
                const precioFinalItem = item.precioSinIva * (1 + item.iva / 100);
                const subtotal = calcularSubtotal(item, precioFinalItem);
                return (
                  <tr key={item.productoId}>
                    <td className="px-3 py-2 text-slate-900">{producto.nombre}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={item.cantidad}
                        onFocus={(e) => e.target.select()}
                      onClick={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          actualizarItem(item.productoId, {
                            cantidad: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-14 rounded border border-slate-200 px-1 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.precioSinIva}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          actualizarItem(item.productoId, {
                            precioSinIva: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-20 rounded border border-slate-200 px-1 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={item.iva}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          actualizarItem(item.productoId, {
                            iva: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                          })
                        }
                        className="w-16 rounded border border-slate-200 px-1 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      ${precioFinalItem.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={item.descuento}
                        onFocus={(e) => e.target.select()}
                      onClick={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          actualizarItem(item.productoId, {
                            descuento: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                          })
                        }
                        className="w-16 rounded border border-slate-200 px-1 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-900">
                      ${subtotal.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td colSpan={6} className="px-3 py-3 text-right font-semibold text-slate-700">
                  Total
                </td>
                <td className="px-3 py-3 text-right text-lg font-bold text-blue-700">
                  ${total.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>

        <div className="mt-6 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                ¿Con factura o sin factura?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConFactura("si")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${
                    conFactura === "si"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 text-slate-700"
                  }`}
                >
                  Con factura
                </button>
                <button
                  type="button"
                  onClick={() => setConFactura("no")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${
                    conFactura === "no"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 text-slate-700"
                  }`}
                >
                  Sin factura
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Modalidad de pago
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalidadPago("CONTADO")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${
                    modalidadPago === "CONTADO"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 text-slate-700"
                  }`}
                >
                  Contado
                </button>
                <button
                  type="button"
                  onClick={() => setModalidadPago("CUENTA_CORRIENTE")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${
                    modalidadPago === "CUENTA_CORRIENTE"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 text-slate-700"
                  }`}
                >
                  Cuenta corriente
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Observaciones (opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Algún comentario sobre el pedido..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
        {error && (
          <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleEnviarFinal}
          disabled={enviando}
          className="w-full rounded-lg bg-blue-700 px-4 py-3.5 text-base font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {enviando
            ? "Guardando..."
            : modo === "crear"
            ? "Confirmar pedido"
            : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
