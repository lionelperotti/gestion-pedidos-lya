"use client";

import { signOut } from "next-auth/react";

export default function CerrarSesionBoton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
    >
      Cerrar sesión
    </button>
  );
}
