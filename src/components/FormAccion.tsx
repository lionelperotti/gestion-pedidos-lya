"use client";

import { useState } from "react";

type RespuestaAccion = { error?: string } | void | undefined;

/**
 * Formulario que llama a una acción del servidor y muestra el mensaje de error
 * que esta devuelva (por ejemplo "Ya existe una marca con ese nombre"), en vez
 * de dejar que se rompa la pantalla con un error genérico.
 */
export default function FormAccion({
  action,
  textoBoton,
  textoEnviando = "Guardando...",
  className = "space-y-5",
  claseBoton = "w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60",
  children,
}: {
  action: (formData: FormData) => Promise<RespuestaAccion>;
  textoBoton: string;
  textoEnviando?: string;
  className?: string;
  claseBoton?: string;
  children: React.ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setError(null);
    setEnviando(true);

    const formData = new FormData(e.currentTarget);
    try {
      const resultado = await action(formData);
      if (resultado && typeof resultado === "object" && resultado.error) {
        setError(resultado.error);
        setEnviando(false);
      }
      // Si no devolvió error, la acción redirige a otra pantalla.
    } catch {
      setError(
        "No se pudo guardar. Revisá que tu sesión siga activa e intentá de nuevo."
      );
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className={claseBoton}
      >
        {enviando ? textoEnviando : textoBoton}
      </button>
    </form>
  );
}
