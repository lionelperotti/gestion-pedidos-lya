"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUsuario } from "@/lib/session";
import type { UsuarioSesion } from "@/lib/auth";

const CATEGORIAS_VALIDAS = ["RI", "MO", "EX", "CF"];

export interface FilaImportacionCliente {
  codigoCliente: string;
  nombre: string;
  domicilio: string;
  localidad: string;
  provincia: string;
  categoria: string;
  cuit: string;
}

export interface FilaPreviewCliente extends FilaImportacionCliente {
  fila: number;
  accion: "crear" | "actualizar" | "error";
  mensaje?: string;
  clienteId?: string;
  provinciaId?: string;
  localidadId?: string;
}

export async function previsualizarImportacionClientes(
  filas: FilaImportacionCliente[]
): Promise<FilaPreviewCliente[]> {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");

  const provincias = await prisma.provincia.findMany({ include: { localidades: true } });
  const resultado: FilaPreviewCliente[] = [];

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const numeroFila = i + 2;

    if (!fila.nombre || !fila.cuit || !fila.codigoCliente) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "error",
        mensaje: "Faltan datos obligatorios (nombre, código o CUIT).",
      });
      continue;
    }

    const categoria = fila.categoria.trim().toUpperCase();
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      resultado.push({
        ...fila,
        fila: numeroFila,
        accion: "error",
        mensaje: `Categoría inválida "${fila.categoria}". Tiene que ser RI, MO, EX o CF.`,
      });
      continue;
    }

    let provinciaId: string | undefined;
    let localidadId: string | undefined;

    if (fila.provincia) {
      const provincia = provincias.find(
        (p) => p.nombre.trim().toLowerCase() === fila.provincia.trim().toLowerCase()
      );
      if (!provincia) {
        resultado.push({
          ...fila,
          fila: numeroFila,
          accion: "error",
          mensaje: `No existe la provincia "${fila.provincia}". Cargala primero en Provincias.`,
        });
        continue;
      }
      provinciaId = provincia.id;

      if (fila.localidad) {
        const localidad = provincia.localidades.find(
          (l) => l.nombre.trim().toLowerCase() === fila.localidad.trim().toLowerCase()
        );
        if (!localidad) {
          resultado.push({
            ...fila,
            fila: numeroFila,
            accion: "error",
            mensaje: `La provincia "${fila.provincia}" no tiene la localidad "${fila.localidad}". Cargala primero en Localidades.`,
          });
          continue;
        }
        localidadId = localidad.id;
      }
    }

    const existente = await prisma.cliente.findUnique({ where: { cuit: fila.cuit } });

    resultado.push({
      ...fila,
      categoria,
      fila: numeroFila,
      accion: existente ? "actualizar" : "crear",
      clienteId: existente?.id,
      provinciaId,
      localidadId,
    });
  }

  return resultado;
}

export async function aplicarImportacionClientes(filas: FilaPreviewCliente[]) {
  const sesionUsuario = await getSessionUsuario();
  if (!sesionUsuario) throw new Error("No autenticado.");
  const usuario = sesionUsuario as unknown as UsuarioSesion;

  const validas = filas.filter((f) => f.accion !== "error");
  let creados = 0;
  let actualizados = 0;

  for (const fila of validas) {
    if (fila.accion === "actualizar" && fila.clienteId) {
      await prisma.cliente.update({
        where: { id: fila.clienteId },
        data: {
          nombre: fila.nombre,
          direccion: fila.domicilio || null,
          codigoCliente: fila.codigoCliente,
          categoria: fila.categoria as "RI" | "MO" | "EX" | "CF",
          provinciaId: fila.provinciaId ?? null,
          localidadId: fila.localidadId ?? null,
        },
      });
      actualizados++;
    } else if (fila.accion === "crear") {
      await prisma.cliente.create({
        data: {
          nombre: fila.nombre,
          direccion: fila.domicilio || null,
          codigoCliente: fila.codigoCliente,
          cuit: fila.cuit,
          categoria: fila.categoria as "RI" | "MO" | "EX" | "CF",
          provinciaId: fila.provinciaId ?? null,
          localidadId: fila.localidadId ?? null,
          vendedorId: usuario.id,
        },
      });
      creados++;
    }
  }

  revalidatePath("/clientes");
  return { creados, actualizados };
}
