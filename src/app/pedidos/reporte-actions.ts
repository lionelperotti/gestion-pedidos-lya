"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";

export async function obtenerDatosPedidoParaPdf(pedidoId: string) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      cliente: true,
      vendedor: true,
      items: { include: { producto: true } },
    },
  });

  if (!pedido) throw new Error("El pedido no existe.");
  if (usuario.perfil !== "Administrador" && pedido.vendedorId !== usuario.id) {
    throw new Error("No tenés permiso sobre este pedido.");
  }

  return {
    numero: pedido.numero,
    vendedor: pedido.vendedor.nombre,
    cliente: pedido.cliente.nombre,
    clienteCuit: pedido.cliente.cuit,
    clienteDireccion: pedido.cliente.direccion,
    conFactura: pedido.conFactura,
    modalidadPago: pedido.modalidadPago,
    observaciones: pedido.observaciones,
    creadoEn: pedido.creadoEn.toISOString(),
    items: pedido.items.map((item) => ({
      codigo: item.producto.codigoProveedor,
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precioSinIva: Number(item.precioSinIva),
      iva: Number(item.iva),
      precioUnitario: Number(item.precioUnitario),
      descuento: Number(item.descuento),
      subtotal:
        Number(item.precioUnitario) * item.cantidad * (1 - Number(item.descuento) / 100),
    })),
  };
}
