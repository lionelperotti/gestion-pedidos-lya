"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";

async function usuarioActual() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  return sesionUsuario as unknown as UsuarioSesion;
}

export async function obtenerLoteAbierto(vendedorId?: string) {
  const usuario = await usuarioActual();
  const idVendedor = vendedorId ?? usuario.id;

  return prisma.lote.findFirst({
    where: { vendedorId: idVendedor, estado: "ABIERTO" },
    include: { _count: { select: { pedidos: true } } },
  });
}

export async function crearOAgregarLote(pedidoIds: string[]) {
  const usuario = await usuarioActual();

  if (!pedidoIds || pedidoIds.length === 0) {
    throw new Error("Seleccioná al menos un pedido.");
  }

  // Solo se pueden agrupar pedidos propios y que sigan pendientes
  const pedidos = await prisma.pedido.findMany({
    where: {
      id: { in: pedidoIds },
      estado: "PENDIENTE",
      ...(usuario.perfil === "Administrador" ? {} : { vendedorId: usuario.id }),
    },
  });

  if (pedidos.length === 0) {
    throw new Error("Ninguno de los pedidos seleccionados está disponible para agrupar.");
  }

  let lote = await prisma.lote.findFirst({
    where: { vendedorId: usuario.id, estado: "ABIERTO" },
  });

  if (!lote) {
    lote = await prisma.lote.create({
      data: { vendedorId: usuario.id },
    });
  }

  await prisma.pedido.updateMany({
    where: { id: { in: pedidos.map((p) => p.id) } },
    data: { loteId: lote.id, estado: "EN_LOTE" },
  });

  revalidatePath("/pedidos");
  revalidatePath("/lotes");
  redirect(`/lotes/${lote.id}`);
}

export async function sacarDelLote(pedidoId: string) {
  const usuario = await usuarioActual();

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { lote: true },
  });
  if (!pedido || !pedido.lote) throw new Error("El pedido no pertenece a ningún lote.");
  if (pedido.lote.estado !== "ABIERTO") {
    throw new Error("El lote ya fue enviado, no se pueden sacar pedidos.");
  }
  if (usuario.perfil !== "Administrador" && pedido.vendedorId !== usuario.id) {
    throw new Error("No tenés permiso sobre este pedido.");
  }

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { loteId: null, estado: "PENDIENTE" },
  });

  revalidatePath("/pedidos");
  revalidatePath(`/lotes/${pedido.lote.id}`);
  revalidatePath("/lotes");
}

export async function marcarLoteEnviado(loteId: string) {
  const usuario = await usuarioActual();

  const lote = await prisma.lote.findUnique({ where: { id: loteId } });
  if (!lote) throw new Error("El lote no existe.");
  if (usuario.perfil !== "Administrador" && lote.vendedorId !== usuario.id) {
    throw new Error("No tenés permiso sobre este lote.");
  }
  if (lote.estado !== "ABIERTO") {
    throw new Error("Este lote ya fue enviado.");
  }

  await prisma.lote.update({
    where: { id: loteId },
    data: { estado: "ENVIADO", enviadoEn: new Date() },
  });

  revalidatePath("/lotes");
  revalidatePath(`/lotes/${loteId}`);
}
