"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { claveDeNombre, type FilaResumen } from "@/lib/cuentas";

export interface ClienteOpcion {
  id: string;
  nombre: string;
  codigoCliente: string;
  cuit: string;
}

export interface SugerenciaNombre {
  nombre: string;
  clienteId: string | null;
  origen: "recordado" | "nombre" | null;
}

export async function listarClientesParaAsignar(): Promise<ClienteOpcion[]> {
  await requireAdmin();
  return prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, codigoCliente: true, cuit: true },
  });
}

/**
 * Para cada nombre del resumen, sugiere el cliente: primero por una asignación
 * hecha en un resumen anterior, y si no, por coincidencia exacta de nombre.
 */
export async function prepararImportacion(
  nombres: string[]
): Promise<{ sugerencias: SugerenciaNombre[]; clientes: ClienteOpcion[] }> {
  await requireAdmin();

  const [clientes, alias] = await Promise.all([
    prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, codigoCliente: true, cuit: true },
    }),
    prisma.aliasCliente.findMany({ select: { nombreNormalizado: true, clienteId: true } }),
  ]);

  const idsExistentes = new Set(clientes.map((c) => c.id));
  const aliasPorClave = new Map(alias.map((a) => [a.nombreNormalizado, a.clienteId]));

  const clientesPorClave = new Map<string, ClienteOpcion[]>();
  for (const c of clientes) {
    const clave = claveDeNombre(c.nombre);
    clientesPorClave.set(clave, [...(clientesPorClave.get(clave) ?? []), c]);
  }

  const sugerencias: SugerenciaNombre[] = nombres.map((nombre) => {
    const clave = claveDeNombre(nombre);

    const recordado = aliasPorClave.get(clave);
    if (recordado && idsExistentes.has(recordado)) {
      return { nombre, clienteId: recordado, origen: "recordado" };
    }

    const iguales = clientesPorClave.get(clave) ?? [];
    // Si dos clientes se llaman igual no se asigna solo: lo decide la persona
    if (iguales.length === 1) {
      return { nombre, clienteId: iguales[0].id, origen: "nombre" };
    }
    return { nombre, clienteId: null, origen: null };
  });

  return { sugerencias, clientes };
}

type ResultadoGuardado =
  | { ok: true; resumenId: string; sinAsignar: number }
  | { ok: false; error: string };

const aFecha = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

export async function guardarResumen(datos: {
  fecha: string;
  nombreArchivo: string | null;
  filas: FilaResumen[];
  asignaciones: Record<string, string | null>;
}): Promise<ResultadoGuardado> {
  const admin = await requireAdmin();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha) || isNaN(aFecha(datos.fecha).getTime())) {
    return { ok: false, error: "La fecha del resumen no es válida." };
  }
  if (!datos.filas || datos.filas.length === 0) {
    return { ok: false, error: "El resumen no tiene comprobantes para guardar." };
  }
  if (datos.filas.length > 20000) {
    return { ok: false, error: "El resumen tiene demasiadas filas (máximo 20.000)." };
  }

  const clientes = await prisma.cliente.findMany({ select: { id: true, codigoCliente: true } });
  const codigoPorId = new Map(clientes.map((c) => [c.id, c.codigoCliente]));

  for (const id of Object.values(datos.asignaciones)) {
    if (id && !codigoPorId.has(id)) {
      return { ok: false, error: "Alguno de los clientes asignados ya no existe. Volvé a asignarlo." };
    }
  }

  let sinAsignar = 0;
  try {
    const resumen = await prisma.$transaction(
      async (tx) => {
        const nuevo = await tx.resumenCuenta.create({
          data: {
            fecha: aFecha(datos.fecha),
            nombreArchivo: datos.nombreArchivo,
            importadoPorId: admin.id,
          },
        });

        await tx.comprobanteCuenta.createMany({
          data: datos.filas.map((f) => {
            const clienteId = datos.asignaciones[f.nombre] ?? null;
            if (!clienteId) sinAsignar++;
            return {
              resumenId: nuevo.id,
              clienteId,
              nombreEnResumen: f.nombre,
              // el código que tenía el cliente al momento de importar
              codigoCliente: clienteId ? (codigoPorId.get(clienteId) ?? null) : null,
              comprobante: f.comprobante,
              fecha: f.fecha ? aFecha(f.fecha) : null,
              importe: f.importe,
              aCuenta: f.aCuenta,
              totalACobrar: f.totalACobrar,
            };
          }),
        });

        // Se recuerda cada asignación para que el próximo resumen ya venga resuelto
        for (const [nombre, clienteId] of Object.entries(datos.asignaciones)) {
          const clave = claveDeNombre(nombre);
          if (!clienteId || !clave) continue;
          await tx.aliasCliente.upsert({
            where: { nombreNormalizado: clave },
            update: { clienteId, nombreOriginal: nombre },
            create: { nombreNormalizado: clave, nombreOriginal: nombre, clienteId },
          });
        }

        return nuevo;
      },
      { timeout: 60000, maxWait: 10000 }
    );

    revalidatePath("/cuentas");
    return { ok: true, resumenId: resumen.id, sinAsignar };
  } catch {
    return { ok: false, error: "No se pudo guardar el resumen. Intentá de nuevo." };
  }
}

/** Asigna un cliente a los comprobantes de un resumen que habían quedado sin asignar. */
export async function asignarClienteAComprobantes(
  resumenId: string,
  nombreEnResumen: string,
  clienteId: string
): Promise<{ ok: true; actualizados: number } | { ok: false; error: string }> {
  await requireAdmin();

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { id: true, codigoCliente: true },
  });
  if (!cliente) return { ok: false, error: "El cliente elegido ya no existe." };

  try {
    const res = await prisma.comprobanteCuenta.updateMany({
      where: { resumenId, nombreEnResumen, clienteId: null },
      data: { clienteId: cliente.id, codigoCliente: cliente.codigoCliente },
    });

    const clave = claveDeNombre(nombreEnResumen);
    if (clave) {
      await prisma.aliasCliente.upsert({
        where: { nombreNormalizado: clave },
        update: { clienteId: cliente.id, nombreOriginal: nombreEnResumen },
        create: { nombreNormalizado: clave, nombreOriginal: nombreEnResumen, clienteId: cliente.id },
      });
    }

    revalidatePath(`/cuentas/${resumenId}`);
    revalidatePath("/cuentas");
    return { ok: true, actualizados: res.count };
  } catch {
    return { ok: false, error: "No se pudo asignar el cliente. Intentá de nuevo." };
  }
}

export async function eliminarResumen(
  resumenId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    await prisma.resumenCuenta.delete({ where: { id: resumenId } });
    revalidatePath("/cuentas");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el resumen." };
  }
}
