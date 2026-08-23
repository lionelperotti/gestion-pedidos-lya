"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  previsualizarImportacionClientes,
  aplicarImportacionClientes,
  type FilaImportacionCliente,
  type FilaPreviewCliente,
} from "./actions";

export default function ImportarClientesForm() {
  const router = useRouter();
  const [preview, setPreview] = useState<FilaPreviewCliente[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ creados: number; actualizados: number } | null>(
    null
  );

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setError(null);
    setResultado(null);
    setCargando(true);

    try {
      const buffer = await archivo.arrayBuffer();
      const libro = XLSX.read(buffer, { type: "array" });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      const filasCrudas = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
        header: 1,
        defval: "",
      });

      if (filasCrudas.length === 0) {
        setError("El archivo no tiene filas de datos.");
        setCargando(false);
        return;
      }

      const encabezadosPosibles = [
        "codigo",
        "código",
        "nombre",
        "domicilio",
        "localidad",
        "provincia",
        "categoria",
        "categoría",
        "cuit",
      ];
      const primeraFila = filasCrudas[0].map((c) => String(c).trim().toLowerCase());
      const tieneEncabezados = primeraFila.some((c) => encabezadosPosibles.includes(c));

      let filas: FilaImportacionCliente[];

      if (tieneEncabezados) {
        const idxCodigo = primeraFila.findIndex((c) => ["codigo", "código"].includes(c));
        const idxNombre = primeraFila.findIndex((c) => c === "nombre");
        const idxDomicilio = primeraFila.findIndex((c) => c === "domicilio");
        const idxLocalidad = primeraFila.findIndex((c) => c === "localidad");
        const idxProvincia = primeraFila.findIndex((c) => c === "provincia");
        const idxCategoria = primeraFila.findIndex((c) => ["categoria", "categoría"].includes(c));
        const idxCuit = primeraFila.findIndex((c) => c === "cuit");

        filas = filasCrudas.slice(1).map((fila) => ({
          codigoCliente: String(fila[idxCodigo] ?? "").trim(),
          nombre: String(fila[idxNombre] ?? "").trim(),
          domicilio: String(fila[idxDomicilio] ?? "").trim(),
          localidad: String(fila[idxLocalidad] ?? "").trim(),
          provincia: String(fila[idxProvincia] ?? "").trim(),
          categoria: String(fila[idxCategoria] ?? "").trim(),
          cuit: String(fila[idxCuit] ?? "").trim(),
        }));
      } else {
        // Sin encabezados: Código, Nombre, Domicilio, Localidad, Provincia, Categoría, CUIT
        filas = filasCrudas.map((fila) => ({
          codigoCliente: String(fila[0] ?? "").trim(),
          nombre: String(fila[1] ?? "").trim(),
          domicilio: String(fila[2] ?? "").trim(),
          localidad: String(fila[3] ?? "").trim(),
          provincia: String(fila[4] ?? "").trim(),
          categoria: String(fila[5] ?? "").trim(),
          cuit: String(fila[6] ?? "").trim(),
        }));
      }

      filas = filas.filter((f) => f.nombre || f.cuit);

      if (filas.length === 0) {
        setError("El archivo no tiene filas de datos.");
        setCargando(false);
        return;
      }

      const resultadoPreview = await previsualizarImportacionClientes(filas);
      setPreview(resultadoPreview);
    } catch {
      setError(
        "No se pudo leer el archivo. Verificá que sea un .xlsx con las columnas correctas."
      );
    } finally {
      setCargando(false);
      e.target.value = "";
    }
  }

  async function handleConfirmar() {
    if (!preview) return;
    setAplicando(true);
    setError(null);
    try {
      const res = await aplicarImportacionClientes(preview);
      setResultado(res);
      setPreview(null);
      router.refresh();
    } catch {
      setError("Ocurrió un error al aplicar los cambios.");
    } finally {
      setAplicando(false);
    }
  }

  const aCrear = preview?.filter((f) => f.accion === "crear").length ?? 0;
  const aActualizar = preview?.filter((f) => f.accion === "actualizar").length ?? 0;
  const conError = preview?.filter((f) => f.accion === "error").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm text-slate-600">
          El Excel puede tener una fila de encabezados (
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            Codigo, Nombre, Domicilio, Localidad, Provincia, Categoria, CUIT
          </code>
          ) o directamente empezar con los datos, siempre en ese orden de columnas.
          La Provincia y la Localidad tienen que existir ya cargadas en el sistema. Si
          el CUIT ya existe, se actualiza el cliente; si no existe, se crea uno nuevo.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleArchivo}
          disabled={cargando}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
        />
        {cargando && <p className="mt-2 text-sm text-slate-500">Leyendo archivo...</p>}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {resultado && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Listo: {resultado.creados} cliente(s) creado(s), {resultado.actualizados}{" "}
          actualizado(s).
        </p>
      )}

      {preview && (
        <div>
          <div className="mb-3 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
              {aCrear} a crear
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
              {aActualizar} a actualizar
            </span>
            {conError > 0 && (
              <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
                {conError} con error (no se van a aplicar)
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Fila</th>
                  <th className="px-3 py-2 font-medium">Acción</th>
                  <th className="px-3 py-2 font-medium">Código</th>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">CUIT</th>
                  <th className="px-3 py-2 font-medium">Provincia</th>
                  <th className="px-3 py-2 font-medium">Localidad</th>
                  <th className="px-3 py-2 font-medium">Cat.</th>
                  <th className="px-3 py-2 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.map((fila, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-slate-500">{fila.fila}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          fila.accion === "crear"
                            ? "bg-green-50 text-green-700"
                            : fila.accion === "actualizar"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {fila.accion}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{fila.codigoCliente}</td>
                    <td className="px-3 py-2 text-slate-700">{fila.nombre}</td>
                    <td className="px-3 py-2 text-slate-700">{fila.cuit}</td>
                    <td className="px-3 py-2 text-slate-700">{fila.provincia}</td>
                    <td className="px-3 py-2 text-slate-700">{fila.localidad}</td>
                    <td className="px-3 py-2 text-slate-700">{fila.categoria}</td>
                    <td className="px-3 py-2 text-red-600">{fila.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={aplicando || aCrear + aActualizar === 0}
              className="rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {aplicando ? "Aplicando..." : `Confirmar y aplicar (${aCrear + aActualizar})`}
            </button>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
