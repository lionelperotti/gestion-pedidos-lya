import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import CartForm from "./CartForm";

export default async function NuevoPedidoPage() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) redirect("/login");
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const [clientes, productosDb] = await Promise.all([
    prisma.cliente.findMany({
      where: { vendedorId: usuario.id },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      include: { proveedor: true },
    }),
  ]);

  const productos = productosDb.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    fotoUrl: p.fotoUrl,
    precio: Number(p.precioFinal),
    proveedorNombre: p.proveedor.nombre,
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <Link href="/pedidos" className="text-sm text-blue-700 hover:underline">
          ← Volver a Pedidos
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Nuevo pedido</h1>
        {clientes.length === 0 && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            No tenés clientes cargados todavía.{" "}
            <Link href="/clientes/nuevo" className="underline">
              Creá uno primero
            </Link>
            .
          </p>
        )}
      </header>

      <CartForm clientes={clientes} productos={productos} />
    </main>
  );
}
