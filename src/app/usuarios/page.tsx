import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { autorizarUsuario } from "./actions";
import RechazarBoton from "./RechazarBoton";

export default async function UsuariosPage() {
  await requireAdmin();

  const [usuarios, pendientes, perfiles] = await Promise.all([
    prisma.usuario.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { nombre: "asc" },
      include: { perfil: true },
    }),
    prisma.usuario.findMany({
      where: { estado: "PENDIENTE" },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.perfil.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-sm text-blue-700 hover:underline">
            ← Volver
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Usuarios</h1>
        </div>
        <Link
          href="/usuarios/nuevo"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nuevo usuario
        </Link>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {pendientes.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-700">
              Pendientes de autorizar ({pendientes.length})
            </h2>
            <div className="space-y-3">
              {pendientes.map((pendiente) => {
                const autorizarConId = autorizarUsuario.bind(null, pendiente.id);
                return (
                  <div
                    key={pendiente.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{pendiente.nombre}</p>
                      <p className="text-sm text-slate-600">{pendiente.email}</p>
                      <p className="text-xs text-slate-500">
                        Se registró con Google el{" "}
                        {new Date(pendiente.creadoEn).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <form action={autorizarConId} className="flex items-center gap-2">
                      <select
                        name="perfilId"
                        required
                        defaultValue=""
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="" disabled>
                          Elegir perfil
                        </option>
                        {perfiles.map((perfil) => (
                          <option key={perfil.id} value={perfil.id}>
                            {perfil.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800"
                      >
                        Autorizar
                      </button>
                      <RechazarBoton usuarioId={pendiente.id} />
                    </form>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Perfil</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {usuario.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{usuario.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {usuario.perfil?.nombre ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {usuario.activo ? (
                      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Activo
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/usuarios/${usuario.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Todavía no hay usuarios cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Total: {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}
        </p>
      </div>
    </main>
  );
}
