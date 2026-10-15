"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";
import type { ResultadoAccion } from "@/lib/errores";

const MENSAJE_SESION_VENCIDA =
  "Tu sesión venció. Abrí una pestaña nueva, ingresá de nuevo y volvé a esta pestaña (sin recargarla) para confirmar el pedido: lo que cargaste sigue acá.";

interface ItemCarrito {
  productoId: string;
  cantidad: number;
  descuento: number;
  precioSinIva: number;
  iva: number;
}

interface DatosPedido {
  clienteId: string;
  items: ItemCarrito[];
  conFactura: boolean;
  modalidadPago: "CONTADO" | "CUENTA_CORRIENTE";
  observaciones: string;
}

function precioFinal(precioSinIva: number, iva: number) {
  return precioSinIva * (1 + iva / 100);
}

async function usuarioActual() {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  return sesionUsuario as unknown as UsuarioSesion;
}

function validarDatosPedido(datos: DatosPedido): string | null {
  if (!datos.clienteId) return "Tenés que seleccionar un cliente.";
  if (!datos.items || datos.items.length === 0) return "El pedido necesita al menos un producto.";
  if (!datos.modalidadPago) return "Tenés que indicar la modalidad de pago.";
  return null;
}

export async function crearPedido(datos: DatosPedido): Promise<ResultadoAccion> {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) return { error: MENSAJE_SESION_VENCIDA };
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const problema = validarDatosPedido(datos);
  if (problema) return { error: problema };

  const productos = await prisma.producto.findMany({
    where: { id: { in: datos.items.map((i) => i.productoId) } },
  });
  if (productos.length !== new Set(datos.items.map((i) => i.productoId)).size) {
    return { error: "Uno de los productos del pedido ya no existe. Revisá el pedido." };
  }

  let nuevoPedidoId: string;
  try {
    const nuevoPedido = await prisma.pedido.create({
      data: {
        clienteId: datos.clienteId,
        vendedorId: usuario.id,
        conFactura: datos.conFactura,
        modalidadPago: datos.modalidadPago,
        observaciones: datos.observaciones || null,
        items: {
          create: datos.items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioSinIva: item.precioSinIva,
            iva: item.iva,
            precioUnitario: precioFinal(item.precioSinIva, item.iva),
            descuento: item.descuento || 0,
          })),
        },
      },
    });
    nuevoPedidoId = nuevoPedido.id;
  } catch {
    return { error: "No se pudo guardar el pedido. Intentá de nuevo." };
  }

  revalidatePath("/pedidos");
  redirect(`/pedidos/${nuevoPedidoId}`);
}

export async function actualizarPedido(
  pedidoId: string,
  datos: Omit<DatosPedido, "clienteId">
): Promise<ResultadoAccion> {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) return { error: MENSAJE_SESION_VENCIDA };
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const pedidoActual = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedidoActual) return { error: "El pedido ya no existe." };
  if (pedidoActual.estado !== "PENDIENTE") {
    return { error: "Solo se pueden editar pedidos pendientes." };
  }
  if (usuario.perfil !== "Administrador" && pedidoActual.vendedorId !== usuario.id) {
    return { error: "No tenés permiso para editar este pedido." };
  }
  if (!datos.items || datos.items.length === 0) {
    return { error: "El pedido necesita al menos un producto." };
  }
  if (!datos.modalidadPago) return { error: "Tenés que indicar la modalidad de pago." };

  const productos = await prisma.producto.findMany({
    where: { id: { in: datos.items.map((i) => i.productoId) } },
  });
  if (productos.length !== new Set(datos.items.map((i) => i.productoId)).size) {
    return { error: "Uno de los productos del pedido ya no existe. Revisá el pedido." };
  }

  try {
    await prisma.$transaction([
      prisma.pedidoItem.deleteMany({ where: { pedidoId } }),
      prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          conFactura: datos.conFactura,
          modalidadPago: datos.modalidadPago,
          observaciones: datos.observaciones || null,
          items: {
            create: datos.items.map((item) => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              precioSinIva: item.precioSinIva,
              iva: item.iva,
              precioUnitario: precioFinal(item.precioSinIva, item.iva),
              descuento: item.descuento || 0,
            })),
          },
        },
      }),
    ]);
  } catch {
    return { error: "No se pudo guardar el pedido. Intentá de nuevo." };
  }

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

  // Traemos el precio ACTUAL de cada producto, no el que tenía el pedido original,
  // por si el precio cambió desde que se cargó ese pedido.
  const productos = await prisma.producto.findMany({
    where: { id: { in: original.items.map((i) => i.productoId) } },
  });

  const itemsValidos = original.items.filter((item) =>
    productos.some((p) => p.id === item.productoId)
  );

  if (itemsValidos.length === 0) {
    throw new Error(
      "Ninguno de los productos de ese pedido existe todavía, no se puede copiar."
    );
  }

  const nuevoPedido = await prisma.pedido.create({
    data: {
      clienteId: original.clienteId,
      vendedorId: usuario.id,
      conFactura: original.conFactura,
      modalidadPago: original.modalidadPago,
      observaciones: original.observaciones,
      items: {
        create: itemsValidos.map((item) => {
          const producto = productos.find((p) => p.id === item.productoId)!;
          return {
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioSinIva: producto.precioSinIva, // precio actual, no el histórico
            iva: producto.iva,
            precioUnitario: producto.precioFinal,
            descuento: item.descuento,
          };
        }),
      },
    },
  });

  revalidatePath("/pedidos");
  redirect(`/pedidos/${nuevoPedido.id}/editar`);
}
