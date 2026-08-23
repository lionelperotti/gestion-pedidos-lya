"use client";

import { useState } from "react";
import Link from "next/link";
import { registrarUsuario } from "./actions";

export default function RegistroForm() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const formData = new FormData(e.currentTarget);
    try {
      await registrarUsuario(formData);
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al registrarte.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-4 text-center">
        <p className="font-medium text-green-800">¡Listo! Te mandamos un email.</p>
        <p className="mt-1 text-sm text-green-700">
          Revisá tu casilla y hacé clic en el link para confirmar tu cuenta antes de
          poder ingresar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre</label>
        <input
          name="nombre"
          required
          autoFocus
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="mb-6">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <p className="mt-1 text-xs text-slate-500">Mínimo 6 caracteres.</p>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-blue-700 px-4 py-3.5 text-base font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {enviando ? "Registrando..." : "Registrarme"}
      </button>

      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-blue-700 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
