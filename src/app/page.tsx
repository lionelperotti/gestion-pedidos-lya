import { redirect } from "next/navigation";
import { getSessionUsuario } from "@/lib/session";
import CerrarSesionBoton from "@/components/CerrarSesionBoton";

export default async function Home() {
  const usuario = await getSessionUsuario();

  if (!usuario) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Gestión de Pedidos
          </h1>
          <p className="text-sm text-slate-500">
            {/* @ts-expect-error -- perfil agregado en el callback de sesión */}
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
