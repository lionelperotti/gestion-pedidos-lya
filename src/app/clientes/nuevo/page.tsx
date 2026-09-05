import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import { crearCliente } from "../actions";
import ClienteForm from "../ClienteForm";

export default async function NuevoClientePage() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");

  const [provincias, rubros] = await Promise.all([
    prisma.provincia.findMany({
      orderBy: { nombre: "asc" },
      include: { localidades: { orderBy: { nombre: "asc" } } },
    }),
    prisma.rubro.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/clientes" className="text-sm text-blue-700 hover:underline">
          ← Volver a Clientes
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Nuevo cliente</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        <ClienteForm action={crearCliente} provincias={provincias} rubros={rubros} />
      </div>
    </main>
  );
}
