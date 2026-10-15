"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { interpretarFilasResumen, type FilaResumen } from "@/lib/cuentas";
import { formatearMoneda } from "@/lib/formato";
import BuscadorClienteModal from "./BuscadorClienteModal";
import {
  prepararImportacion,
  guardarResumen,
  type ClienteOpcion,
  type SugerenciaNombre,
} from "./actions";

type Origen = "recordado" | "nombre" | "manual" | null;

function hoyIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function ImportarResumenForm() {
  const router = useRouter();
  const [fecha, setFecha] = useState(hoyIso());
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [filas, setFilas] = useState<FilaResumen[] | null>(null);
  const [ignoradas, setIgnoradas] = useState(0);
  const [clientes, setClientes] = useState<ClienteOpcion[]>([]);
  const [asignaciones, setAsignaciones] = useState<Record<string, string | null>>({});
  const [origenes, setOrigenes] = useState<Record<string, Origen>>({});
  const [filaEnEdicion, setFilaEnEdicion] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientePorId = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);

  // Un renglón por cada nombre distinto que aparece en el resumen
  const grupos = useMemo(() => {
    const mapa = new Map<string, { nombre: string; comprobantes: FilaResumen[]; total: number }>();
    for (const f of filas ?? []) {
      const g = mapa.get(f.nombre) ?? { nombre: f.nombre, comprobantes: [], total: 0 };
      g.comprobantes.push(f);
      g.total += f.totalACobrar;
      mapa.set(f.nombre, g);
    }
    // Los que faltan asignar van primero, para verlos sin buscar
    return Array.from(mapa.values()).sort((a, b) => {
      const sa = asignaciones[a.nombre] ? 1 : 0;
      const sb = asignaciones[b.nombre] ? 1 : 0;
      return sa - sb || a.nombre.localeCompare(b.nombre, "es");
    });
  }, [filas, asignaciones]);

  const sinAsignar = grupos.filter((g) => !asignaciones[g.nombre]).length;
  const totalGeneral = (filas ?? []).reduce((acc, f) => acc + f.totalACobrar, 0);

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setError(null);
    setCargando(true);
    setFilas(null);

    try {
      const buffer = await archivo.arrayBuffer();
      const libro = XLSX.read(buffer, { type: "array", cellDates: true });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      const crudas = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
        header: 1,
        defval: "",
        raw: true,
      });

      const lectura = interpretarFilasResumen(crudas);
      if (lectura.filas.length === 0) {
        setError(
          "No se encontraron comprobantes en el archivo. Revisá que tenga las columnas: Clientes, Fact. o Rem, Fecha, Importe, A cuenta y Total a cobrar."
        );
        return;
      }

      const nombres = Array.from(new Set(lectura.filas.map((f) => f.nombre)));
      const { sugerencias, clientes: lista } = await prepararImportacion(nombres);

      const asign: Record<string, string | null> = {};
      const orig: Record<string, Origen> = {};
      sugerencias.forEach((s: SugerenciaNombre) => {
        asign[s.nombre] = s.clienteId;
        orig[s.nombre] = s.origen;
      });

      setNombreArchivo(archivo.name);
      setFilas(lectura.filas);
      setIgnoradas(lectura.ignoradas);
      setClientes(lista);
      setAsignaciones(asign);
      setOrigenes(orig);
    } catch {
      setError("No se pudo leer el archivo. Verificá que sea un Excel (.xlsx).");
    } finally {
      setCargando(false);
      e.target.value = "";
    }
  }

  function elegirCliente(nombre: string, cliente: ClienteOpcion) {
    setAsignaciones((prev) => ({ ...prev, [nombre]: cliente.id }));
    setOrigenes((prev) => ({ ...prev, [nombre]: "manual" }));
    setFilaEnEdicion(null);
  }

  function quitarCliente(nombre: string) {
    setAsignaciones((prev) => ({ ...prev, [nombre]: null }));
    setOrigenes((prev) => ({ ...prev, [nombre]: null }));
    setFilaEnEdicion(null);
  }

  async function handleGuardar() {
    if (!filas) return;
    if (
      sinAsignar > 0 &&
      !confirm(
        `Hay ${sinAsignar} nombre(s) sin asignar a un cliente. Se guardan igual, pero su deuda no va a figurar en el historial de ningún cliente hasta que los asignes. ¿Guardar?`
      )
    ) {
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const res = await guardarResumen({ fecha, nombreArchivo, filas, asignaciones });
      if (res.ok) {
        router.push(`/cuentas/${res.resumenId}`);
      } else {
        setError(res.error);
        setGuardando(false);
      }
    } catch {
      setError("No se pudo guardar el resumen. Revisá que tu sesión siga activa e intentá de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm text-slate-600">
          Subí el Excel del resumen de cuenta de la distribuidora, con las columnas{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            Clientes, Fact. o Rem, Fecha, Importe, A cuenta, Total a cobrar
          </code>
          . Antes de guardar vas a ver a qué cliente corresponde cada nombre y podés corregirlo.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Fecha del resumen
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Archivo</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleArchivo}
              disabled={cargando || guardando}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
            />
          </div>
        </div>
        {cargando && <p className="mt-2 text-sm text-slate-500">Leyendo archivo...</p>}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {filas && (
        <div>
          <div className="mb-3 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              {filas.length} comprobantes · {formatearMoneda(totalGeneral)}
            </span>
            <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
              {grupos.length - sinAsignar} cliente(s) asignados
            </span>
            {sinAsignar > 0 && (
              <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                {sinAsignar} sin asignar
              </span>
            )}
            {ignoradas > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {ignoradas} fila(s) de totales o subtotales ignoradas
              </span>
            )}
          </div>

          <div className="max-h-[28rem] overflow-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Nombre en el resumen</th>
                  <th className="px-3 py-2 text-right font-medium">Comprob.</th>
                  <th className="px-3 py-2 text-right font-medium">Total a cobrar</th>
                  <th className="px-3 py-2 font-medium">Cliente asignado</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grupos.map((g) => {
                  const cliente = asignaciones[g.nombre]
                    ? clientePorId.get(asignaciones[g.nombre] as string)
                    : undefined;
                  const origen = origenes[g.nombre];
                  return (
                    <tr key={g.nombre} className={cliente ? "" : "bg-amber-50/50"}>
                      <td className="px-3 py-2 align-top">
                        <details>
                          <summary className="cursor-pointer font-medium text-slate-900">
                            {g.nombre}
                          </summary>
                          <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                            {g.comprobantes.map((c, i) => (
                              <li key={i}>
                                {c.comprobante} · {c.fecha ?? "sin fecha"} ·{" "}
                                {formatearMoneda(c.totalACobrar)}
                              </li>
                            ))}
                          </ul>
                        </details>
                      </td>
                      <td className="px-3 py-2 text-right align-top text-slate-600">
                        {g.comprobantes.length}
                      </td>
                      <td className="px-3 py-2 text-right align-top font-medium text-slate-900">
                        {formatearMoneda(g.total)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {cliente ? (
                          <>
                            <span className="block text-slate-900">{cliente.nombre}</span>
                            <span className="block text-xs text-slate-500">
                              Código {cliente.codigoCliente}
                              {origen === "recordado" && " · recordado de un resumen anterior"}
                              {origen === "nombre" && " · coincide por nombre"}
                              {origen === "manual" && " · asignado a mano"}
                            </span>
                          </>
                        ) : (
                          <span className="text-amber-700">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right align-top">
                        <button
                          type="button"
                          onClick={() => setFilaEnEdicion(g.nombre)}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          {cliente ? "Cambiar" : "Asignar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar resumen"}
            </button>
            <button
              type="button"
              onClick={() => setFilas(null)}
              disabled={guardando}
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {filaEnEdicion && (
        <BuscadorClienteModal
          titulo={`Asignar cliente a "${filaEnEdicion}"`}
          clientes={clientes}
          onElegir={(c) => elegirCliente(filaEnEdicion, c)}
          onCerrar={() => setFilaEnEdicion(null)}
          onQuitar={() => quitarCliente(filaEnEdicion)}
        />
      )}
    </div>
  );
}
