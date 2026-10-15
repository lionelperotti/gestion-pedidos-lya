"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { esErrorDeDuplicado, type ResultadoAccion } from "@/lib/errores";

async function validarNombre(nombre: string, excluirId?: string): Promise<ResultadoAccion> {
  if (!nombre) return { error: "El nombre de la provincia es obligatorio." };

  const existente = await prisma.provincia.findFirst({
    where: {
      nombre: { equals: nombre, mode: "insensitive" },
      ...(excluirId ? { NOT: { id: excluirId } } : {}),
    },
  });
  if (existente) {
    return { error: `Ya existe una provincia llamada "${existente.nombre}".` };
  }
  return undefined;
}

export async function crearProvincia(formData: FormData): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const problema = await validarNombre(nombre);
  if (problema) return problema;

  try {
    await prisma.provincia.create({ data: { nombre } });
  } catch (e) {
    if (esErrorDeDuplicado(e)) return { error: `Ya existe una provincia llamada "${nombre}".` };
    return { error: "No se pudo crear la provincia. Intentá de nuevo." };
  }

  revalidatePath("/provincias");
  redirect("/provincias");
}

export async function actualizarProvincia(
  provinciaId: string,
  formData: FormData
): Promise<ResultadoAccion> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const problema = await validarNombre(nombre, provinciaId);
  if (problema) return problema;

  try {
    await prisma.provincia.update({
      where: { id: provinciaId },
      data: { nombre },
    });
  } catch (e) {
    if (esErrorDeDuplicado(e)) return { error: `Ya existe una provincia llamada "${nombre}".` };
    return { error: "No se pudo guardar la provincia. Intentá de nuevo." };
  }

  revalidatePath("/provincias");
  redirect("/provincias");
}
