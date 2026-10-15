"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizarNombre } from "@/lib/errores";
import { useNavegacionTeclado } from "@/lib/useNavegacionTeclado";
import { listarClientesParaAsignar, type ClienteOpcion } from "./actions";

const MAXIMO_VISIBLE = 100;

/**
 * Ventana para buscar un cliente y elegirlo. Se filtra por nombre, código o CUIT,
 * y se puede usar con flechas ↑ ↓ y Enter (Esc cierra).
 */
export default function BuscadorClienteModal({
  titulo,
  clientes: clientesProp,
  onElegir,
  onCerrar,
  onQuitar,
}: {
  titulo: string;
  /** Si no se pasa la lista, se carga desde el servidor al abrir. */
  clientes?: ClienteOpcion[];
  onElegir: (cliente: ClienteOpcion) => void;
  onCerrar: () => void;
  onQuitar?: () => void;
}) {
  const [clientes, setClientes] = useState<ClienteOpcion[] | null>(clientesProp ?? null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (clientes) return;
    let cancelado = false;
    listarClientesParaAsignar()
      .then((lista) => {
        if (!cancelado) setClientes(lista);
      })
      .catch(() => {
        if (!cancelado) setErrorCarga(true);
      });
    return () => {
      cancelado = true;
    };
  }, [clientes]);

  const filtrados = useMemo(() => {
    if (!clientes) return [];
    const palabras = normalizarNombre(busqueda).split(" ").filter(Boolean);
    const coincidentes =
      palabras.length === 0
        ? clientes
        : clientes.filter((c) => {
            const texto = normalizarNombre(`${c.nombre} ${c.codigoCliente} ${c.cuit}`);
            return palabras.every((p) => texto.includes(p));
          });
    return coincidentes.slice(0, MAXIMO_VISIBLE);
  }, [clientes, busqueda]);

  const { indiceActivo: navIndice, onKeyDown: navKeyDown, contenedorRef: navRef, reiniciar: navReiniciar, activar: navActivar } = useNavegacionTeclado(filtrados, onElegir);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            ✕ Cerrar
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            autoFocus
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              navReiniciar();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCerrar();
              else navKeyDown(e);
            }}
            placeholder="Buscar por nombre, código o CUIT... (↑ ↓ y Enter)"
            className="mb-3 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />

          <div ref={navRef} className="max-h-80 space-y-1 overflow-y-auto">
            {!clientes && !errorCarga && (
              <p className="py-6 text-center text-sm text-slate-500">Cargando clientes...</p>
            )}
            {errorCarga && (
              <p className="py-6 text-center text-sm text-red-600">
                No se pudieron cargar los clientes.
              </p>
            )}
            {filtrados.map((cliente, indice) => (
              <button
                key={cliente.id}
                type="button"
                data-nav-index={indice}
                onClick={() => onElegir(cliente)}
                onMouseEnter={() => navActivar(indice)}
                className={`block w-full rounded-lg border px-3 py-2 text-left hover:bg-blue-50 ${
                  navIndice === indice
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-300"
                    : "border-slate-200"
                }`}
              >
                <span className="block text-sm font-medium text-slate-900">{cliente.nombre}</span>
                <span className="block text-xs text-slate-500">
                  Código {cliente.codigoCliente} · CUIT {cliente.cuit}
                </span>
              </button>
            ))}
            {clientes && filtrados.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                No hay clientes que coincidan con la búsqueda.
              </p>
            )}
          </div>

          {clientes && clientes.length > MAXIMO_VISIBLE && filtrados.length === MAXIMO_VISIBLE && (
            <p className="mt-2 text-xs text-slate-400">
              Se muestran los primeros {MAXIMO_VISIBLE}. Escribí más para afinar la búsqueda.
            </p>
          )}

          {onQuitar && (
            <button
              type="button"
              onClick={onQuitar}
              className="mt-3 text-sm text-slate-600 hover:underline"
            >
              Dejar esta fila sin asignar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
