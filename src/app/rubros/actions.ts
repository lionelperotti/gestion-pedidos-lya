"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { esErrorDeDuplicado, type ResultadoAccion } from "@/lib/errores";

async function validarNombre(nombre: string, excluirId?: string): Promise<ResultadoAccion> {
  if (!nombre) return { error: "El nombre del rubro es obligatorio." };

  const existente = await prisma.rubro.findFirst({
    where: {
      nombre: { equals: nombre, mode: "insensitive" },
      ...(excluirId ? { NOT: { id: excluirId } } : {}),
    },
  });
  if (existente) {
    return { error: `Ya existe un rubro llamado "${existente.nombre}".` };
  }
  return undefined;
}

export async function crearRubro(formData: FormData): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const problema = await validarNombre(nombre);
  if (problema) return problema;

  try {
    await prisma.rubro.create({ data: { nombre } });
  } catch (e) {
    if (esErrorDeDuplicado(e)) return { error: `Ya existe un rubro llamado "${nombre}".` };
    return { error: "No se pudo crear el rubro. Intentá de nuevo." };
  }

  revalidatePath("/rubros");
  redirect("/rubros");
}

export async function actualizarRubro(
  rubroId: string,
  formData: FormData
): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const problema = await validarNombre(nombre, rubroId);
  if (problema) return problema;

  try {
    await prisma.rubro.update({
      where: { id: rubroId },
      data: { nombre },
    });
  } catch (e) {
    if (esErrorDeDuplicado(e)) return { error: `Ya existe un rubro llamado "${nombre}".` };
    return { error: "No se pudo guardar el rubro. Intentá de nuevo." };
  }

  revalidatePath("/rubros");
  redirect("/rubros");
}
