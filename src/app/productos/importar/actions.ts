"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export interface FilaImportacion {
  codigoProveedor: string;
  nombre: string;
  precioSinIva: number;
  iva: number;
  fotoUrl: string;
}

export interface FilaPreview extends FilaImportacion {
  fila: number;
  accion: "crear" | "actualizar" | "error";
  mensaje?: string;
  productoId?: string;
}

function calcularPrecioFinal(precioSinIva: number, iva: number) {
  return precioSinIva * (1 + iva / 100);
}

export async function previsualizarImportacion(
  proveedorId: string,
  marcaId: string,
  filas: FilaImportacion[]
): Promise<FilaPreview[]> {
  await requireAdmin();

  if (!proveedorId || !marcaId) {
    throw new Error("Faltan el proveedor o la marca.");
  }

  const productosExistentes = await prisma.producto.findMany({
    where: { proveedorId },
  });

  const resultado: FilaPreview[] = [];

  // Detecta código de proveedor repetido DENTRO del mismo archivo, para no
  // crear dos productos duplicados sin avisar.
  const codigosVistos = new Map<string, number>();

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const numeroFila = i + 2; // +2 porque la fila 1 es el encabezado

    if (!fila.nombre || !fila.precioSinIva) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "error",
        mensaje: "Faltan datos obligatorios (nombre o precio).",
      });
      continue;
    }

    if (fila.codigoProveedor) {
      const filaPrevia = codigosVistos.get(fila.codigoProveedor);
      if (filaPrevia) {
        resultado.push({
          ...fila,
          fila: numeroFila,
          accion: "error",
          mensaje: `Código duplicado: ya aparece en la fila ${filaPrevia} de este mismo archivo.`,
        });
        continue;
      }
      codigosVistos.set(fila.codigoProveedor, numeroFila);
    }

    const existente = fila.codigoProveedor
      ? productosExistentes.find((p) => p.codigoProveedor === fila.codigoProveedor)
      : null;

    if (existente) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "actualizar",
        productoId: existente.id,
      });
    } else {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "crear",
      });
    }
  }

  return resultado;
}

export interface ResultadoImportacionMasiva {
  creados: number;
  actualizados: number;
  errores: { fila: number; mensaje: string }[];
}

export async function aplicarImportacionMasiva(
  proveedorId: string,
  marcaId: string,
  filas: FilaPreview[]
): Promise<ResultadoImportacionMasiva> {
  await requireAdmin();

  const validas = filas.filter((f) => f.accion !== "error");
  let creados = 0;
  let actualizados = 0;
  const errores: { fila: number; mensaje: string }[] = [];

  // Cada fila en su propio try/catch: si una falla, seguimos con las demás
  // en vez de cortar toda la importación sin explicación.
  for (const fila of validas) {
    try {
      const precioFinal = calcularPrecioFinal(fila.precioSinIva, fila.iva);

      if (fila.accion === "actualizar" && fila.productoId) {
        await prisma.producto.update({
          where: { id: fila.productoId },
          data: {
            precioSinIva: fila.precioSinIva,
            iva: fila.iva,
            precioFinal,
            precioActualizadoEn: new Date(),
            ...(fila.fotoUrl ? { fotoUrl: fila.fotoUrl } : {}),
          },
        });
        actualizados++;
      } else if (fila.accion === "crear") {
        await prisma.producto.create({
          data: {
            nombre: fila.nombre,
            codigoProveedor: fila.codigoProveedor || null,
            fotoUrl: fila.fotoUrl || null,
            precioSinIva: fila.precioSinIva,
            iva: fila.iva,
            precioFinal,
            precioActualizadoEn: new Date(),
            proveedorId,
            marcaId,
          },
        });
        creados++;
      }
    } catch {
      errores.push({ fila: fila.fila, mensaje: "No se pudo guardar esta fila (error inesperado)." });
    }
  }

  revalidatePath("/productos");
  return { creados, actualizados, errores };
}
