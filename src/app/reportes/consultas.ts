import { prisma } from "@/lib/prisma";
import type { UsuarioSesion } from "@/lib/auth";

export interface FiltrosReporte {
  desde?: string;
  hasta?: string;
  vendedorId?: string;
}

export async function obtenerPedidosParaReporte(
  usuario: UsuarioSesion,
  filtros: FiltrosReporte
) {
  const esAdmin = usuario.perfil === "Administrador";

  const creadoEn: { gte?: Date; lte?: Date } = {};
  if (filtros.desde) creadoEn.gte = new Date(`${filtros.desde}T00:00:00`);
  if (filtros.hasta) creadoEn.lte = new Date(`${filtros.hasta}T23:59:59`);

  const vendedorId = esAdmin ? filtros.vendedorId || undefined : usuario.id;

  return prisma.pedido.findMany({
    where: {
      estado: "EN_LOTE",
      ...(Object.keys(creadoEn).length > 0 ? { creadoEn } : {}),
      ...(vendedorId ? { vendedorId } : {}),
    },
    include: {
      cliente: true,
      vendedor: true,
      items: { include: { producto: true } },
    },
  });
}

export function totalPedido(pedido: { items: { precioUnitario: unknown; cantidad: number; descuento: unknown }[] }) {
  return pedido.items.reduce(
    (acc, item) =>
      acc + Number(item.precioUnitario) * item.cantidad * (1 - Number(item.descuento) / 100),
    0
  );
}
