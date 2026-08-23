import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { actualizarCliente } from "../actions";
import ClienteForm from "../ClienteForm";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const { id } = await params;

  const [cliente, provincias] = await Promise.all([
    prisma.cliente.findUnique({ where: { id } }),
    prisma.provincia.findMany({
      orderBy: { nombre: "asc" },
      include: { localidades: { orderBy: { nombre: "asc" } } },
    }),
  ]);

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
        <ClienteForm
          action={actualizarConId}
          provincias={provincias}
          valoresIniciales={{
            nombre: cliente.nombre,
            telefono: cliente.telefono ?? "",
            email: cliente.email ?? "",
            direccion: cliente.direccion ?? "",
            codigoCliente: cliente.codigoCliente,
            cuit: cliente.cuit,
            categoria: cliente.categoria,
            provinciaId: cliente.provinciaId ?? "",
            localidadId: cliente.localidadId ?? "",
          }}
        />
      </div>
    </main>
  );
}
