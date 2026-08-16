import { redirect } from "next/navigation";
import { getSessionUsuario } from "@/lib/session";
import CerrarSesionBoton from "@/components/CerrarSesionBoton";
import type { UsuarioSesion } from "@/lib/auth";

export default async function Home() {
  const sesionUsuario = await getSessionUsuario();

  if (!sesionUsuario) {
    redirect("/login");
  }

  const usuario = sesionUsuario as unknown as UsuarioSesion;

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

      <div className="mx-auto max-w-3xl px-6 py-12 text-center">
        <p className="text-slate-600">
          El login ya está funcionando. Las pantallas de Usuarios, Perfiles,
          Proveedores, Productos, Clientes y Pedidos se van a ir agregando acá.
        </p>
      </div>
    </main>
  );
}