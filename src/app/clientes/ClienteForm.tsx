"use client";

import { useMemo, useState } from "react";

interface ProvinciaConLocalidades {
  id: string;
  nombre: string;
  localidades: { id: string; nombre: string }[];
}

interface RubroOpcion {
  id: string;
  nombre: string;
}

interface ClienteFormValues {
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  codigoCliente: string;
  cuit: string;
  categoria: string;
  provinciaId: string;
  localidadId: string;
  rubroId: string;
}

export default function ClienteForm({
  action,
  provincias,
  rubros,
  valoresIniciales,
}: {
  action: (formData: FormData) => void;
  provincias: ProvinciaConLocalidades[];
  rubros: RubroOpcion[];
  valoresIniciales?: Partial<ClienteFormValues>;
}) {
  const [provinciaId, setProvinciaId] = useState(valoresIniciales?.provinciaId ?? "");

  const provinciaSeleccionada = provincias.find((p) => p.id === provinciaId);
  const localidadesDisponibles = useMemo(
    () => provinciaSeleccionada?.localidades ?? [],
    [provinciaSeleccionada]
  );

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre</label>
        <input
          name="nombre"
          required
          autoFocus
          defaultValue={valoresIniciales?.nombre}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Código de cliente
          </label>
          <input
            name="codigoCliente"
            required
            defaultValue={valoresIniciales?.codigoCliente}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">CUIT</label>
          <input
            name="cuit"
            required
            defaultValue={valoresIniciales?.cuit}
            placeholder="20-12345678-9"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Categoría</label>
        <select
          name="categoria"
          required
          defaultValue={valoresIniciales?.categoria ?? ""}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="" disabled>
            Seleccionar categoría
          </option>
          <option value="RI">RI</option>
          <option value="MO">MO</option>
          <option value="EX">EX</option>
          <option value="CF">CF</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Teléfono (opcional)
        </label>
        <input
          name="telefono"
          type="tel"
          inputMode="tel"
          defaultValue={valoresIniciales?.telefono}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Dirección (opcional)
        </label>
        <input
          name="direccion"
          defaultValue={valoresIniciales?.direccion}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Provincia (opcional)
          </label>
          <select
            name="provinciaId"
            value={provinciaId}
            onChange={(e) => setProvinciaId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Sin especificar</option>
            {provincias.map((provincia) => (
              <option key={provincia.id} value={provincia.id}>
                {provincia.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Localidad (opcional)
          </label>
          <select
            name="localidadId"
            disabled={!provinciaId}
            defaultValue={valoresIniciales?.localidadId ?? ""}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {provinciaId ? "Sin especificar" : "Elegí primero una provincia"}
            </option>
            {localidadesDisponibles.map((localidad) => (
              <option key={localidad.id} value={localidad.id}>
                {localidad.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Email (opcional)
        </label>
        <input
          name="email"
          type="email"
          defaultValue={valoresIniciales?.email}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Rubro (opcional)
        </label>
        <select
          name="rubroId"
          defaultValue={valoresIniciales?.rubroId ?? ""}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Sin especificar</option>
          {rubros.map((rubro) => (
            <option key={rubro.id} value={rubro.id}>
              {rubro.nombre}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-700 px-4 py-3.5 text-base font-semibold text-white hover:bg-blue-800"
      >
        Guardar
      </button>
    </form>
  );
}
