"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { subirImagenProducto } from "./imagen-actions";

interface ProveedorConMarcas {
  id: string;
  nombre: string;
  marcas: { id: string; nombre: string }[];
}

interface ProductoFormValues {
  nombre: string;
  descripcion: string;
  fotoUrl: string;
  codigoProveedor: string;
  precioSinIva: number;
  iva: number;
  stock: number;
  proveedorId: string;
  marcaId: string;
  activo: boolean;
}

export default function ProductoForm({
  action,
  proveedores,
  valoresIniciales,
  esEdicion = false,
}: {
  action: (formData: FormData) => void;
  proveedores: ProveedorConMarcas[];
  valoresIniciales?: Partial<ProductoFormValues>;
  esEdicion?: boolean;
}) {
  const [proveedorId, setProveedorId] = useState(valoresIniciales?.proveedorId ?? "");
  const [precioSinIva, setPrecioSinIva] = useState(valoresIniciales?.precioSinIva ?? 0);
  const [iva, setIva] = useState(valoresIniciales?.iva ?? 21);
  const [fotoUrl, setFotoUrl] = useState(valoresIniciales?.fotoUrl ?? "");
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);

  const proveedorSeleccionado = proveedores.find((p) => p.id === proveedorId);
  const marcasDisponibles = useMemo(
    () => proveedorSeleccionado?.marcas ?? [],
    [proveedorSeleccionado]
  );

  const precioFinal = useMemo(
    () => precioSinIva * (1 + iva / 100),
    [precioSinIva, iva]
  );

  async function handleArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setErrorSubida(null);
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.set("archivo", archivo);
      const resultado = await subirImagenProducto(formData);
      if (resultado.error) {
        setErrorSubida(resultado.error);
      } else {
        setFotoUrl(resultado.url);
      }
    } catch {
      setErrorSubida("No se pudo subir la imagen. Probá de nuevo.");
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre</label>
        <input
          name="nombre"
          required
          defaultValue={valoresIniciales?.nombre}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Descripción (opcional)
        </label>
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={valoresIniciales?.descripcion}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Foto del producto (opcional)
        </label>
        <input
          name="fotoUrl"
          type="url"
          placeholder="Pegá una URL, o subí un archivo abajo"
          value={fotoUrl}
          onChange={(e) => setFotoUrl(e.target.value)}
          className="mb-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {subiendo ? "Subiendo..." : "Subir foto"}
            <input
              type="file"
              accept="image/*"
              onChange={handleArchivoSeleccionado}
              disabled={subiendo}
              className="hidden"
            />
          </label>
          {fotoUrl && (
            <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <Image src={fotoUrl} alt="Vista previa" fill className="object-cover" unoptimized />
            </div>
          )}
        </div>
        {errorSubida && <p className="mt-1 text-xs text-red-600">{errorSubida}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Código de proveedor (opcional)
        </label>
        <input
          name="codigoProveedor"
          defaultValue={valoresIniciales?.codigoProveedor}
          placeholder="Ej: AB-1234"
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Proveedor
        </label>
        <select
          name="proveedorId"
          required
          value={proveedorId}
          onChange={(e) => setProveedorId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="" disabled>
            Seleccionar proveedor
          </option>
          {proveedores.map((proveedor) => (
            <option key={proveedor.id} value={proveedor.id}>
              {proveedor.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Marca</label>
        <select
          name="marcaId"
          required
          disabled={!proveedorId}
          defaultValue={valoresIniciales?.marcaId ?? ""}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="" disabled>
            {proveedorId ? "Seleccionar marca" : "Elegí primero un proveedor"}
          </option>
          {marcasDisponibles.map((marca) => (
            <option key={marca.id} value={marca.id}>
              {marca.nombre}
            </option>
          ))}
        </select>
        {proveedorId && marcasDisponibles.length === 0 && (
          <p className="mt-1 text-xs text-amber-600">
            Este proveedor no tiene marcas relacionadas. Agregala desde la sección Marcas.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Precio S/IVA
          </label>
          <input
            name="precioSinIva"
            type="number"
            step="0.01"
            min="0"
            required
            value={precioSinIva}
            onChange={(e) => setPrecioSinIva(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">IVA (%)</label>
          <input
            name="iva"
            type="number"
            step="0.01"
            min="0"
            value={iva}
            onChange={(e) => setIva(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 px-4 py-3">
        <p className="text-xs text-blue-700">Precio final (calculado)</p>
        <p className="text-lg font-bold text-blue-900">
          ${precioFinal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Stock</label>
        <input
          name="stock"
          type="number"
          min="0"
          defaultValue={valoresIniciales?.stock ?? 0}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {esEdicion && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={valoresIniciales?.activo ?? true}
            className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
          />
          Producto activo
        </label>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800"
      >
        {esEdicion ? "Guardar cambios" : "Crear producto"}
      </button>
    </form>
  );
}
