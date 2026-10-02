"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

// Convierte los campos Decimal de Prisma (precios, descuentos, IVA) a número
// plano, para que el JSON resultante sea legible y reimportable sin depender
// de la librería de Prisma.
function aNumero(valor: unknown) {
  return valor === null || valor === undefined ? valor : Number(valor);
}

export async function generarBackupCompleto() {
  await requireAdmin();

  const [
    perfiles,
    usuarios,
    proveedores,
    marcas,
    productos,
    provincias,
    localidades,
    rubros,
    clientes,
    pedidos,
    pedidoItems,
    lotes,
  ] = await Promise.all([
    prisma.perfil.findMany(),
    prisma.usuario.findMany(),
    prisma.proveedor.findMany(),
    prisma.marca.findMany({ include: { proveedores: { select: { id: true } } } }),
    prisma.producto.findMany(),
    prisma.provincia.findMany(),
    prisma.localidad.findMany(),
    prisma.rubro.findMany(),
    prisma.cliente.findMany(),
    prisma.pedido.findMany(),
    prisma.pedidoItem.findMany(),
    prisma.lote.findMany(),
  ]);

  return {
    version: 1,
    generadoEn: new Date().toISOString(),
    datos: {
      perfiles,
      // No incluimos sessionId ni los tokens de verificación: son datos de
      // sesión transitorios, no información de negocio que haga falta respaldar.
      usuarios: usuarios.map(({ sessionId: _s, tokenVerificacion: _t, tokenVerificacionExpira: _e, ...resto }) => resto),
      proveedores,
      marcas: marcas.map((m) => ({
        ...m,
        proveedorIds: m.proveedores.map((p) => p.id),
        proveedores: undefined,
      })),
      productos: productos.map((p) => ({
        ...p,
        precioSinIva: aNumero(p.precioSinIva),
        iva: aNumero(p.iva),
        precioFinal: aNumero(p.precioFinal),
      })),
      provincias,
      localidades,
      rubros,
      clientes,
      pedidos,
      pedidoItems: pedidoItems.map((i) => ({
        ...i,
        precioSinIva: aNumero(i.precioSinIva),
        iva: aNumero(i.iva),
        precioUnitario: aNumero(i.precioUnitario),
        descuento: aNumero(i.descuento),
      })),
      lotes,
    },
  };
}
