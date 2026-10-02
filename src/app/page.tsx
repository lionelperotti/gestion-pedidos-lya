import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUsuario } from "@/lib/session";
import { prisma } from "@/lib/prisma";
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

  // Espacio reservado para avisos que necesitan la atención del usuario.
  // Por ahora solo cubre usuarios pendientes de autorizar (solo Admin);
  // más adelante se pueden sumar más tipos de aviso a este mismo arreglo.
  const avisos: { texto: string; href: string }[] = [];
  if (esAdmin) {
    const pendientes = await prisma.usuario.count({ where: { estado: "PENDIENTE" } });
    if (pendientes > 0) {
      avisos.push({
        texto: `Hay ${pendientes} usuario${pendientes !== 1 ? "s" : ""} pendiente${
          pendientes !== 1 ? "s" : ""
        } de autorizar.`,
        href: "/usuarios",
      });
    }
  }

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
          <Link
            href="/reportes"
            className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            Reportes
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
              <Link
                href="/rubros"
                className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                Rubros
              </Link>
              <Link
                href="/backup"
                className="rounded-lg border border-slate-200 bg-white px-4 py-5 text-center font-medium text-slate-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                Backup
              </Link>
            </>
          )}
        </div>

        {avisos.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-500">Avisos</h2>
            {avisos.map((aviso) => (
              <Link
                key={aviso.href + aviso.texto}
                href={aviso.href}
                className="block rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"
              >
                ⚠️ {aviso.texto}
              </Link>
            ))}
          </div>
        )}
      </div>
      <AppFooter />
    </main>
  );
}
