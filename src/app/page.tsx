import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUsuario } from "@/lib/session";
import CerrarSesionBoton from "@/components/CerrarSesionBoton";
import type { UsuarioSesion } from "@/lib/auth";

export default async function Home() {
  const sesionUsuario = await getSessionUsuario();

  if (!sesionUsuario) {
    redirect("/login");
  }

  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const esAdmin = usuario.perfil === "Administrador";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Gestión de Pedidos
          </h1>
          <p className="text-sm text-slate-500">
            {usuario.name} · {usuario.perfil}
          </p>
        </div>
        <CerrarSesionBoton />
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {esAdmin && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Link
              href="/usuarios"
              className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              Usuarios
            </Link>
            <Link
              href="/perfiles"
              className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              Perfiles
            </Link>
            <Link
              href="/proveedores"
              className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              Proveedores
            </Link>
          </div>
        )}

        <p className="text-center text-slate-600">
          Las pantallas de Proveedores, Productos, Clientes y Pedidos se van a
          ir agregando acá.
        </p>
      </div>
    </main>
  );
}
