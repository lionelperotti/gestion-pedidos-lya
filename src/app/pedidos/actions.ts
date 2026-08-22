"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";

interface ItemCarrito {
  productoId: string;
  cantidad: number;
}

export async function crearPedido(clienteId: string, items: ItemCarrito[]) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  if (!clienteId) {
    throw new Error("Tenés que seleccionar un cliente.");
  }
  if (!items || items.length === 0) {
    throw new Error("El pedido necesita al menos un producto.");
  }

  // Trae los precios actuales desde la base (nunca confiar en precios del cliente)
  const productos = await prisma.producto.findMany({
    where: { id: { in: items.map((i) => i.productoId) } },
  });

  const nuevoPedido = await prisma.pedido.create({
    data: {
      clienteId,
      vendedorId: usuario.id,
      items: {
        create: items.map((item) => {
          const producto = productos.find((p) => p.id === item.productoId);
          if (!producto) {
            throw new Error("Uno de los productos ya no existe.");
          }
          return {
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: producto.precioFinal,
          };
        }),
      },
    },
  });

  revalidatePath("/pedidos");
  redirect(`/pedidos/${nuevoPedido.id}`);
}
