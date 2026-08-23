"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";

export async function obtenerDatosLoteParaPdf(loteId: string) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const lote = await prisma.lote.findUnique({
    where: { id: loteId },
    include: {
      vendedor: true,
      pedidos: {
        orderBy: [{ cliente: { nombre: "asc" } }, { creadoEn: "asc" }],
        include: {
          cliente: true,
          items: { include: { producto: true } },
        },
      },
    },
  });

  if (!lote) throw new Error("El lote no existe.");
  if (usuario.perfil !== "Administrador" && lote.vendedorId !== usuario.id) {
    throw new Error("No tenés permiso sobre este lote.");
  }

  return {
    id: lote.id,
    numero: lote.numero,
    estado: lote.estado,
    vendedor: lote.vendedor.nombre,
    creadoEn: lote.creadoEn.toISOString(),
    enviadoEn: lote.enviadoEn ? lote.enviadoEn.toISOString() : null,
    pedidos: lote.pedidos.map((pedido) => ({
      id: pedido.id,
      numero: pedido.numero,
      cliente: pedido.cliente.nombre,
      clienteCuit: pedido.cliente.cuit,
      clienteDireccion: pedido.cliente.direccion,
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
    })),
  };
}
