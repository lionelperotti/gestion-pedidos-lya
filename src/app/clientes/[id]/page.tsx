import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { actualizarCliente } from "../actions";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({ where: { id } });

  if (!cliente) {
    notFound();
  }

  if (usuario.perfil !== "Administrador" && cliente.vendedorId !== usuario.id) {
    redirect("/clientes");
  }

  const actualizarConId = actualizarCliente.bind(null, cliente.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/clientes" className="text-sm text-blue-700 hover:underline">
          ← Volver a Clientes
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Editar cliente</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        <form action={actualizarConId} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              name="nombre"
              required
              defaultValue={cliente.nombre}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Teléfono (opcional)
            </label>
            <input
              name="telefono"
              type="tel"
              defaultValue={cliente.telefono ?? ""}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Dirección (opcional)
            </label>
            <input
              name="direccion"
              defaultValue={cliente.direccion ?? ""}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email (opcional)
            </label>
            <input
              name="email"
              type="email"
              defaultValue={cliente.email ?? ""}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-700 px-4 py-3.5 text-base font-semibold text-white hover:bg-blue-800"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </main>
  );
}
