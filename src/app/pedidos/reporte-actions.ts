"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function obtenerPedidosPendientesParaReporte() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const esAdmin = usuario.perfil === "Administrador";

  const pedidos = await prisma.pedido.findMany({
    where: {
      estado: "PENDIENTE",
      ...(esAdmin ? {} : { vendedorId: usuario.id }),
    },
    orderBy: [{ cliente: { nombre: "asc" } }, { creadoEn: "asc" }],
    include: {
      cliente: true,
      vendedor: true,
      items: { include: { producto: true } },
    },
  });

  return pedidos.map((pedido) => ({
    id: pedido.id,
    numero: pedido.numero,
    cliente: pedido.cliente.nombre,
    clienteTelefono: pedido.cliente.telefono,
    clienteDireccion: pedido.cliente.direccion,
    vendedor: pedido.vendedor.nombre,
    conFactura: pedido.conFactura,
    modalidadPago: pedido.modalidadPago,
    observaciones: pedido.observaciones,
    creadoEn: pedido.creadoEn.toISOString(),
    items: pedido.items.map((item) => ({
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precioUnitario: Number(item.precioUnitario),
      descuento: Number(item.descuento),
      subtotal:
        Number(item.precioUnitario) * item.cantidad * (1 - Number(item.descuento) / 100),
    })),
  }));
}

export async function marcarPedidosComoExportados(pedidoIds: string[]) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  const usuario = sesionUsuario as unknown as UsuarioSesion;
  const esAdmin = usuario.perfil === "Administrador";

  await prisma.pedido.updateMany({
    where: {
      id: { in: pedidoIds },
      estado: "PENDIENTE",
      ...(esAdmin ? {} : { vendedorId: usuario.id }),
    },
    data: {
      estado: "EXPORTADO",
      exportadoEn: new Date(),
    },
  });

  revalidatePath("/pedidos");
}
