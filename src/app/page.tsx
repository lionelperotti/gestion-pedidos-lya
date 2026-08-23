import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUsuario } from "@/lib/session";
import CerrarSesionBoton from "@/components/CerrarSesionBoton";
import AppFooter from "@/components/AppFooter";
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
        <div className="mb-8 grid grid-cols-2 gap-4">
          <Link
            href="/pedidos/nuevo"
            className="rounded-lg bg-blue-700 px-4 py-6 text-center font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
          >
            + Nuevo pedido
          </Link>
          <Link
            href="/pedidos"
            className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            Ver pedidos
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Link
            href="/clientes"
            className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            Clientes
          </Link>
          {esAdmin && (
            <Link
              href="/productos"
              className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              Productos
            </Link>
          )}
          {esAdmin && (
            <>
              <Link
                href="/marcas"
                className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                Marcas
              </Link>
              <Link
                href="/proveedores"
                className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                Proveedores
              </Link>
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
                href="/provincias"
                className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                Provincias
              </Link>
              <Link
                href="/localidades"
                className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                Localidades
              </Link>
            </>
          )}
        </div>
      </div>
      <AppFooter />
    </main>
  );
}
