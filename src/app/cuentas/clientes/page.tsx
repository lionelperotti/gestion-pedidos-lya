import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { formatearFechaUTC } from "@/lib/formato";
import { esAdministrador, filtroVisibilidad } from "../consultas";
import ListaClientesCuenta from "../ListaClientesCuenta";

export default async function DeudaPorClientePage() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const [clientes, ultimo] = await Promise.all([
    prisma.cliente.findMany({
      where: esAdministrador(usuario) ? {} : { vendedorId: usuario.id },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, codigoCliente: true },
    }),
    prisma.resumenCuenta.findFirst({ orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }] }),
  ]);

  // Deuda de cada cliente según el resumen más reciente
  const deudas = new Map<string, number>();
  if (ultimo) {
    const sumas = await prisma.comprobanteCuenta.groupBy({
      by: ["clienteId"],
      where: { resumenId: ultimo.id, clienteId: { not: null }, ...filtroVisibilidad(usuario) },
      _sum: { totalACobrar: true },
    });
    for (const s of sumas) {
      if (s.clienteId) deudas.set(s.clienteId, Number(s._sum.totalACobrar ?? 0));
    }
  }

  const items = clientes.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    codigo: c.codigoCliente,
    deuda: deudas.get(c.id) ?? null,
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/cuentas" className="text-sm text-blue-700 hover:underline">
          ← Volver a Cuentas corrientes
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Deuda por cliente</h1>
        <p className="text-sm text-slate-500">
          {ultimo
            ? `Según el resumen del ${formatearFechaUTC(ultimo.fecha)}. Elegí un cliente para ver su historial.`
            : "Todavía no se importó ningún resumen de cuenta."}
        </p>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <ListaClientesCuenta clientes={items} />
      </div>
    </main>
  );
}
