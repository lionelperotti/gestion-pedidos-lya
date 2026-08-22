"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export interface FilaImportacion {
  proveedor: string;
  marca: string;
  codigoProveedor: string;
  nombre: string;
  precioSinIva: number;
  iva: number;
}

export interface FilaPreview extends FilaImportacion {
  fila: number;
  accion: "crear" | "actualizar" | "error";
  mensaje?: string;
  proveedorId?: string;
  marcaId?: string;
  productoId?: string;
}

function calcularPrecioFinal(precioSinIva: number, iva: number) {
  return precioSinIva * (1 + iva / 100);
}

export async function previsualizarImportacion(
  filas: FilaImportacion[]
): Promise<FilaPreview[]> {
  await requireAdmin();

  const proveedores = await prisma.proveedor.findMany({ include: { marcas: true } });
  const resultado: FilaPreview[] = [];

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const numeroFila = i + 2; // +2 porque la fila 1 es el encabezado

    if (!fila.proveedor || !fila.nombre || !fila.precioSinIva) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "error",
        mensaje: "Faltan datos obligatorios (proveedor, nombre o precio).",
      });
      continue;
    }

    const proveedor = proveedores.find(
      (p) => p.nombre.trim().toLowerCase() === fila.proveedor.trim().toLowerCase()
    );
    if (!proveedor) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "error",
        mensaje: `No existe el proveedor "${fila.proveedor}".`,
      });
      continue;
    }

    let marcaId: string | undefined;
    if (fila.marca) {
      const marca = proveedor.marcas.find(
        (m) => m.nombre.trim().toLowerCase() === fila.marca.trim().toLowerCase()
      );
      if (!marca) {
        resultado.push({
          ...fila,
          fila: numeroFila,
          accion: "error",
          mensaje: `El proveedor "${fila.proveedor}" no tiene la marca "${fila.marca}".`,
        });
        continue;
      }
      marcaId = marca.id;
    }

    // Busca un producto existente por proveedor + código de proveedor
    const existente = fila.codigoProveedor
      ? await prisma.producto.findFirst({
          where: { proveedorId: proveedor.id, codigoProveedor: fila.codigoProveedor },
        })
      : null;

    if (existente) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "actualizar",
        proveedorId: proveedor.id,
        marcaId: marcaId ?? existente.marcaId,
        productoId: existente.id,
      });
    } else {
      if (!marcaId) {
        resultado.push({
          ...fila,
          fila: numeroFila,
          accion: "error",
          mensaje: "Para dar de alta un producto nuevo hace falta indicar la marca.",
        });
        continue;
      }
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "crear",
        proveedorId: proveedor.id,
        marcaId,
      });
    }
  }

  return resultado;
}

export async function aplicarImportacionMasiva(filas: FilaPreview[]) {
  await requireAdmin();

  const validas = filas.filter((f) => f.accion !== "error");
  let creados = 0;
  let actualizados = 0;

  for (const fila of validas) {
    const precioFinal = calcularPrecioFinal(fila.precioSinIva, fila.iva);

    if (fila.accion === "actualizar" && fila.productoId) {
      await prisma.producto.update({
        where: { id: fila.productoId },
        data: {
          precioSinIva: fila.precioSinIva,
          iva: fila.iva,
          precioFinal,
          precioActualizadoEn: new Date(),
        },
      });
      actualizados++;
    } else if (fila.accion === "crear" && fila.proveedorId && fila.marcaId) {
      await prisma.producto.create({
        data: {
          nombre: fila.nombre,
          codigoProveedor: fila.codigoProveedor || null,
          precioSinIva: fila.precioSinIva,
          iva: fila.iva,
          precioFinal,
          precioActualizadoEn: new Date(),
          proveedorId: fila.proveedorId,
          marcaId: fila.marcaId,
        },
      });
      creados++;
    }
  }

  revalidatePath("/productos");
  return { creados, actualizados };
}
