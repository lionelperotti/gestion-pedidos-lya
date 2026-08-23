"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";

interface ItemCarrito {
  productoId: string;
  cantidad: number;
  descuento: number;
}

interface DatosPedido {
  clienteId: string;
  items: ItemCarrito[];
  conFactura: boolean;
  modalidadPago: "CONTADO" | "CUENTA_CORRIENTE";
  observaciones: string;
}

async function usuarioActual() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  return sesionUsuario as unknown as UsuarioSesion;
}

function validarDatosPedido(datos: DatosPedido) {
  if (!datos.clienteId) {
    throw new Error("Tenés que seleccionar un cliente.");
  }
  if (!datos.items || datos.items.length === 0) {
    throw new Error("El pedido necesita al menos un producto.");
  }
  if (!datos.modalidadPago) {
    throw new Error("Tenés que indicar la modalidad de pago.");
  }
}

export async function crearPedido(datos: DatosPedido) {
  const usuario = await usuarioActual();
  validarDatosPedido(datos);

  const productos = await prisma.producto.findMany({
    where: { id: { in: datos.items.map((i) => i.productoId) } },
  });

  const nuevoPedido = await prisma.pedido.create({
    data: {
      clienteId: datos.clienteId,
      vendedorId: usuario.id,
      conFactura: datos.conFactura,
      modalidadPago: datos.modalidadPago,
      observaciones: datos.observaciones || null,
      items: {
        create: datos.items.map((item) => {
          const producto = productos.find((p) => p.id === item.productoId);
          if (!producto) {
            throw new Error("Uno de los productos ya no existe.");
          }
          return {
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: producto.precioFinal,
            descuento: item.descuento || 0,
          };
        }),
      },
    },
  });

  revalidatePath("/pedidos");
  redirect(`/pedidos/${nuevoPedido.id}`);
}

export async function actualizarPedido(pedidoId: string, datos: Omit<DatosPedido, "clienteId">) {
  const usuario = await usuarioActual();

  const pedidoActual = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedidoActual) throw new Error("El pedido no existe.");
  if (pedidoActual.estado !== "PENDIENTE") {
    throw new Error("Solo se pueden editar pedidos pendientes.");
  }
  if (usuario.perfil !== "Administrador" && pedidoActual.vendedorId !== usuario.id) {
    throw new Error("No tenés permiso para editar este pedido.");
  }
  if (!datos.items || datos.items.length === 0) {
    throw new Error("El pedido necesita al menos un producto.");
  }
  if (!datos.modalidadPago) {
    throw new Error("Tenés que indicar la modalidad de pago.");
  }

  const productos = await prisma.producto.findMany({
    where: { id: { in: datos.items.map((i) => i.productoId) } },
  });

  await prisma.$transaction([
    prisma.pedidoItem.deleteMany({ where: { pedidoId } }),
    prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        conFactura: datos.conFactura,
        modalidadPago: datos.modalidadPago,
        observaciones: datos.observaciones || null,
        items: {
          create: datos.items.map((item) => {
            const producto = productos.find((p) => p.id === item.productoId);
            if (!producto) {
              throw new Error("Uno de los productos ya no existe.");
            }
            return {
              productoId: item.productoId,
              cantidad: item.cantidad,
              precioUnitario: producto.precioFinal,
              descuento: item.descuento || 0,
            };
          }),
        },
      },
    }),
  ]);

  revalidatePath("/pedidos");
  redirect(`/pedidos/${pedidoId}`);
}

export async function eliminarPedido(pedidoId: string) {
  const usuario = await usuarioActual();

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido) throw new Error("El pedido no existe.");
  if (pedido.estado !== "PENDIENTE") {
    throw new Error("Solo se pueden eliminar pedidos pendientes.");
  }
  if (usuario.perfil !== "Administrador" && pedido.vendedorId !== usuario.id) {
    throw new Error("No tenés permiso para eliminar este pedido.");
  }

  await prisma.pedido.delete({ where: { id: pedidoId } });

  revalidatePath("/pedidos");
  redirect("/pedidos");
}

export async function copiarPedido(pedidoId: string) {
  const usuario = await usuarioActual();

  const original = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { items: true },
  });
  if (!original) throw new Error("El pedido no existe.");
  if (usuario.perfil !== "Administrador" && original.vendedorId !== usuario.id) {
    throw new Error("No tenés permiso para copiar este pedido.");
  }

  const nuevoPedido = await prisma.pedido.create({
    data: {
      clienteId: original.clienteId,
      vendedorId: usuario.id,
      conFactura: original.conFactura,
      modalidadPago: original.modalidadPago,
      observaciones: original.observaciones,
      items: {
        create: original.items.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: item.descuento,
        })),
      },
    },
  });

  revalidatePath("/pedidos");
  redirect(`/pedidos/${nuevoPedido.id}/editar`);
}
