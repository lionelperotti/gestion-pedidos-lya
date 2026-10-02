"use client";

import { useState } from "react";
import PasswordInput from "@/components/PasswordInput";
import { crearUsuario } from "./actions";

interface Perfil {
  id: string;
  nombre: string;
}

export default function NuevoUsuarioForm({ perfiles }: { perfiles: Perfil[] }) {
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    const formData = new FormData(e.currentTarget);
    try {
      await crearUsuario(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al crear el usuario.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre</label>
        <input
          name="nombre"
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Contraseña</label>
        <PasswordInput
          name="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">Mínimo 6 caracteres.</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Confirmar contraseña
        </label>
        <PasswordInput
          required
          minLength={6}
          value={confirmarPassword}
          onChange={(e) => setConfirmarPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Perfil</label>
        <select
          name="perfilId"
          required
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="" disabled>
            Seleccionar perfil
          </option>
          {perfiles.map((perfil) => (
            <option key={perfil.id} value={perfil.id}>
              {perfil.nombre}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {enviando ? "Creando..." : "Crear usuario"}
      </button>
    </form>
  );
}
