import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import NuevoUsuarioForm from "../NuevoUsuarioForm";

export default async function NuevoUsuarioPage() {
  await requireAdmin();

  const perfiles = await prisma.perfil.findMany({ orderBy: { nombre: "asc" } });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/usuarios" className="text-sm text-blue-700 hover:underline">
          ← Volver a Usuarios
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Nuevo usuario</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-8">
        <NuevoUsuarioForm perfiles={perfiles} />
      </div>
    </main>
  );
}
