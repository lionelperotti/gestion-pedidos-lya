"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  previsualizarImportacion,
  aplicarImportacionMasiva,
  type FilaImportacion,
  type FilaPreview,
} from "./actions";

export default function ImportarForm() {
  const router = useRouter();
  const [preview, setPreview] = useState<FilaPreview[] | null>(null);
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
      const filasRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, {
        defval: "",
      });

      const filas: FilaImportacion[] = filasRaw.map((f) => ({
        proveedor: String(f["Proveedor"] ?? "").trim(),
        marca: String(f["Marca"] ?? "").trim(),
        codigoProveedor: String(f["CodigoProveedor"] ?? f["Código Proveedor"] ?? "").trim(),
        nombre: String(f["Nombre"] ?? "").trim(),
        precioSinIva: Number(f["PrecioSinIva"] ?? f["Precio S/IVA"] ?? 0),
        iva: Number(f["IVA"] ?? 21),
      }));

      if (filas.length === 0) {
        setError("El archivo no tiene filas de datos.");
        setCargando(false);
        return;
      }

      const resultadoPreview = await previsualizarImportacion(filas);
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
      const res = await aplicarImportacionMasiva(preview);
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
          El archivo Excel debe tener estas columnas en la primera fila:{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            Proveedor, Marca, CodigoProveedor, Nombre, PrecioSinIva, IVA
          </code>
          . Si el <code className="rounded bg-slate-100 px-1 text-xs">Proveedor</code> +{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">CodigoProveedor</code> ya
          existen, se actualiza el precio. Si no existen, se crea un producto nuevo (en
          ese caso la <code className="rounded bg-slate-100 px-1 text-xs">Marca</code> es
          obligatoria).
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
          Listo: {resultado.creados} producto(s) creado(s), {resultado.actualizados}{" "}
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
                  <th className="px-3 py-2 font-medium">Proveedor</th>
                  <th className="px-3 py-2 font-medium">Marca</th>
                  <th className="px-3 py-2 font-medium">Código</th>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 text-right font-medium">Precio S/IVA</th>
                  <th className="px-3 py-2 text-right font-medium">IVA</th>
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
                    <td className="px-3 py-2 text-slate-700">{fila.proveedor}</td>
                    <td className="px-3 py-2 text-slate-700">{fila.marca}</td>
                    <td className="px-3 py-2 text-slate-700">{fila.codigoProveedor}</td>
                    <td className="px-3 py-2 text-slate-700">{fila.nombre}</td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      ${fila.precioSinIva.toLocaleString("es-AR")}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">{fila.iva}%</td>
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
